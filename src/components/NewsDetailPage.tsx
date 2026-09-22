import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Facebook, Link2, Linkedin, MessageCircle, Twitter } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { estimateReadingMinutes } from "@/lib/readingTime";
import { normalizeNewsMarkdown } from "@/lib/normalizeNewsMarkdown";
import { useToast } from "@/components/ToastProvider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { uiCopy } from "@/data/i18n";
import { XP_RULES } from "@/data/xpRules";
import type { SiteNewsItem } from "@/data/siteNews";
import { useAuth } from "@/hooks/useAuth";
import { useTarot } from "@/hooks/useTarot";
import { fetchCloudNewsById } from "@/lib/newsCloud";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { emitXpGain } from "@/lib/xpSignals";

const NewsCommentsSection = lazy(() =>
  import("@/components/news/NewsCommentsSection").then((module) => ({
    default: module.NewsCommentsSection,
  })),
);

type NewsDetailPageProps = {
  newsId: string;
  onBack: () => void;
};

const buildShareLinks = (url: string, title: string, summary: string) => ({
  twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(summary)}`,
});

export function NewsDetailPage({ newsId, onBack }: NewsDetailPageProps) {
  const language = useTarot((state) => state.language);
  const auth = useAuth();
  const copy = uiCopy[language];
  const { pushToast } = useToast();
  const [article, setArticle] = useState<SiteNewsItem | null>(null);
  const [isCloudArticle, setIsCloudArticle] = useState(false);
  const [isArticleLoading, setIsArticleLoading] = useState(true);
  const [readProgress, setReadProgress] = useState(0);
  const articleReadMarkedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const loadArticle = async () => {
      setIsArticleLoading(true);
      const cloudArticle = await fetchCloudNewsById(newsId, language);
      if (!isMounted) {
        return;
      }

      setArticle(cloudArticle);
      setIsCloudArticle(Boolean(cloudArticle));
      setIsArticleLoading(false);
    };

    void loadArticle();
    return () => {
      isMounted = false;
    };
  }, [language, newsId]);

  const readText = useMemo(() => {
    if (!article) {
      return "";
    }
    return [article.title, article.summary, article.body].filter(Boolean).join(" ");
  }, [article]);

  const readMinutes = useMemo(() => estimateReadingMinutes(readText), [readText]);

  const readTimeLabel = useMemo(
    () => copy.newsReadTime.replace("{minutes}", String(readMinutes)),
    [copy.newsReadTime, readMinutes],
  );

  const shareUrl = typeof window === "undefined" ? "" : window.location.href;

  const shareLinks = useMemo(() => {
    if (!shareUrl || !article) {
      return null;
    }
    return buildShareLinks(shareUrl, article.title, article.summary);
  }, [article, shareUrl]);

  useEffect(() => {
    if (!article?.body) {
      setReadProgress(0);
      return;
    }

    const updateReadProgress = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) {
        setReadProgress(100);
        return;
      }

      setReadProgress(Math.min(100, Math.round((window.scrollY / scrollHeight) * 100)));
    };

    window.addEventListener("scroll", updateReadProgress, { passive: true });
    updateReadProgress();
    return () => window.removeEventListener("scroll", updateReadProgress);
  }, [article?.body]);

  useEffect(() => {
    if (!isCloudArticle || !auth.user?.id || articleReadMarkedRef.current) {
      return;
    }

    const markReadOnComplete = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0 || window.scrollY / scrollHeight < 0.95) {
        return;
      }

      articleReadMarkedRef.current = true;
      if (isSupabaseConfigured && supabase) {
        void supabase
          .rpc("mark_article_read_complete", { p_news_id: newsId })
          .then(({ data, error }) => {
            if (error) {
              articleReadMarkedRef.current = false;
              return;
            }
            if (data === true) {
              emitXpGain(XP_RULES.articleReadComplete);
            }
          });
      }
    };

    window.addEventListener("scroll", markReadOnComplete, { passive: true });
    markReadOnComplete();
    return () => window.removeEventListener("scroll", markReadOnComplete);
  }, [article, auth.user?.id, isCloudArticle, newsId]);

  const backButton = (
    <button type="button" className="news-detail__back" onClick={onBack}>
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {copy.newsBackToHome}
    </button>
  );

  if (isArticleLoading) {
    return (
      <PageShell className="news-detail-shell">
        <div className="news-detail news-detail--loading" aria-label={copy.loadingShort}>
          <Skeleton className="h-8 w-32" />
          <div className="zen-accent-bar news-detail__accent" aria-hidden="true" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-12 w-full max-w-2xl" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageShell>
    );
  }

  if (!article) {
    return (
      <PageShell className="news-detail-shell">
        <div className="news-detail news-detail--missing">
          {backButton}
          <div className="zen-accent-bar news-detail__accent" aria-hidden="true" />
          <p className="news-detail__missing-text">{copy.newsNotFound}</p>
        </div>
      </PageShell>
    );
  }

  const siteUrl = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary,
    datePublished: article.date,
    ...(article.coverImageUrl ? { image: [article.coverImageUrl] } : {}),
    ...(siteUrl ? { url: `${siteUrl}/news/${article.id}` } : {}),
  };

  return (
    <PageShell className="news-detail-shell">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(articleJsonLd)}</script>
      </Helmet>

      {isCloudArticle && article.body ? (
        <div className="news-read-progress">
          <Progress value={readProgress} className="h-1 rounded-none" aria-label={readTimeLabel} />
        </div>
      ) : null}

      <article className="news-detail">
        {backButton}

        <header className="news-detail__hero">
          <p className="news-detail__eyebrow">{copy.newsDetailEyebrow}</p>
          <div className="zen-accent-bar news-detail__accent" aria-hidden="true" />

          {article.coverImageUrl ? (
            <figure className="news-detail__cover">
              <img
                src={article.coverImageUrl}
                alt=""
                loading="eager"
                decoding="async"
              />
            </figure>
          ) : null}

          <div className="news-detail__meta">
            <span className="news-detail__tag">{article.tag}</span>
            <time dateTime={article.date}>{article.date}</time>
            <span className="news-detail__read-time">{readTimeLabel}</span>
          </div>

          <h1 className="news-detail__title font-display">{article.title}</h1>
          <p className="news-detail__lead">{article.summary}</p>

          {shareLinks ? (
            <div className="news-detail__share">
              <span className="news-share-label">{copy.newsShareTitle}</span>
              <div className="news-detail__share-actions">
                <Button asChild variant="outline" size="sm" className="news-detail__share-btn">
                  <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="X / Twitter">
                    <Twitter className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">X</span>
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm" className="news-detail__share-btn">
                  <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                    <Facebook className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Facebook</span>
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm" className="news-detail__share-btn">
                  <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">WhatsApp</span>
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm" className="news-detail__share-btn">
                  <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                    <Linkedin className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">LinkedIn</span>
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="news-detail__share-btn"
                  aria-label={copy.newsShareTitle}
                  onClick={() => {
                    void navigator.clipboard.writeText(shareUrl);
                    pushToast(copy.newsLinkCopied, "success");
                  }}
                >
                  <Link2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ) : null}
        </header>

        {article.body ? (
          <div id="news-article-body" className="news-detail__body editorial-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
              {normalizeNewsMarkdown(article.body)}
            </ReactMarkdown>
          </div>
        ) : null}

        {isCloudArticle ? (
          <section className="news-detail__comments">
            <Suspense fallback={null}>
              <NewsCommentsSection newsId={newsId} />
            </Suspense>
          </section>
        ) : null}
      </article>
    </PageShell>
  );
}
