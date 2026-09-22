import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, useMatch, useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { localizeCard, uiCopy } from "./data/i18n";
import { majorArcana } from "./data/majorArcana";
import { useAmbientSound } from "./hooks/useAmbientSound";
import { useAuth } from "./hooks/useAuth";
import { useStreakCloud } from "./hooks/useStreakCloud";
import { useNewsRole } from "./hooks/useNewsRole";
import { useTarot } from "./hooks/useTarot";
import { registerNewsNavigator } from "./lib/appRouter";
import { createFuseSearch } from "@/lib/fuseSearch";
import { trackPageView } from "./lib/analytics";
import { useTarotCloudQuery } from "./hooks/useTarotCloudQuery";
import type { AppPage, LanguageCode } from "./types/tarot";
import type { TarotCardId } from "./types/tarot";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppFooter } from "@/components/layout/AppFooter";
import { AppNavigation } from "@/components/layout/AppNavigation";
import { useToast } from "./components/ToastProvider";
import { XpGainListener } from "./components/XpGainListener";
import { UserProfileProvider } from "./hooks/useUserProfile";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AppRoutes } from "@/router/AppRouter";

const HomePage = lazy(() =>
  import("./components/HomePage").then((module) => ({
    default: module.HomePage,
  })),
);
const ReadingBoard = lazy(() =>
  import("./components/ReadingBoard").then((module) => ({
    default: module.ReadingBoard,
  })),
);
const LegalPage = lazy(() =>
  import("./components/LegalPage").then((module) => ({
    default: module.LegalPage,
  })),
);
const AuthCallbackPage = lazy(() =>
  import("./components/AuthCallbackPage").then((module) => ({
    default: module.AuthCallbackPage,
  })),
);
const ArcanaPage = lazy(() =>
  import("./components/ArcanaPage").then((module) => ({
    default: module.ArcanaPage,
  })),
);
const HistoryPage = lazy(() =>
  import("./components/HistoryPage").then((module) => ({
    default: module.HistoryPage,
  })),
);
const JournalPage = lazy(() =>
  import("./components/JournalPage").then((module) => ({
    default: module.JournalPage,
  })),
);
const LearningPage = lazy(() =>
  import("./components/LearningPage").then((module) => ({
    default: module.LearningPage,
  })),
);
const NewsAdminPanel = lazy(() =>
  import("./components/NewsAdminPanel").then((module) => ({
    default: module.NewsAdminPanel,
  })),
);
const SettingsPage = lazy(() =>
  import("./components/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  })),
);
const NewsDetailPage = lazy(() =>
  import("./components/NewsDetailPage").then((module) => ({
    default: module.NewsDetailPage,
  })),
);

function SeoHelmet({
  activePage,
  language,
  copy,
}: {
  activePage: AppPage;
  language: LanguageCode;
  copy: (typeof uiCopy)[LanguageCode];
}) {
  const location = useLocation();
  const pageTitle = useMemo(() => {
    const titles: Partial<Record<AppPage, string>> = {
      home: copy.home,
      reading: copy.reading,
      history: copy.history,
      journal: copy.journal,
      arcana: copy.arcana,
      learn: copy.learn,
      settings: copy.settingsTitle,
      "news-admin": copy.newsPanelTitle,
      news: copy.newsDetailEyebrow,
      privacy: copy.legalPrivacy,
      terms: copy.legalTerms,
      cookies: copy.legalCookies,
    };

    return titles[activePage] ?? copy.home;
  }, [activePage, copy]);

  const htmlLang = language === "pt" ? "pt-BR" : language === "en" ? "en" : "es";
  const siteUrl = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
  const canonical = siteUrl ? `${siteUrl}${location.pathname}` : undefined;

  return (
    <Helmet>
      <title>{`${pageTitle} | ${copy.documentTitle}`}</title>
      <html lang={htmlLang} />
      <meta name="description" content={copy.settingsSubtitle} />
      <meta property="og:title" content={`${pageTitle} | ${copy.documentTitle}`} />
      <meta property="og:description" content={copy.settingsSubtitle} />
      <meta property="og:type" content="website" />
      {canonical ? <link rel="canonical" href={canonical} /> : null}
      {canonical ? <meta property="og:url" content={canonical} /> : null}
    </Helmet>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const newsMatch = useMatch("/news/:id");
  const readingMatch = useMatch("/reading");
  const historyMatch = useMatch("/history");
  const journalMatch = useMatch("/journal");
  const arcanaMatch = useMatch("/arcana");
  const learnMatch = useMatch("/learn");
  const settingsMatch = useMatch("/settings");
  const newsAdminMatch = useMatch("/news-admin");
  const homeMatch = useMatch("/home");
  const privacyMatch = useMatch("/privacy");
  const termsMatch = useMatch("/terms");
  const cookiesMatch = useMatch("/cookies");
  const authCallbackMatch = useMatch("/auth/callback");

  const activePage = useMemo((): AppPage => {
    if (newsMatch) return "news";
    if (readingMatch) return "reading";
    if (historyMatch) return "history";
    if (journalMatch) return "journal";
    if (arcanaMatch) return "arcana";
    if (learnMatch) return "learn";
    if (settingsMatch) return "settings";
    if (newsAdminMatch) return "news-admin";
    if (privacyMatch) return "privacy";
    if (termsMatch) return "terms";
    if (cookiesMatch) return "cookies";
    if (homeMatch) return "home";
    return "home";
  }, [
    arcanaMatch,
    cookiesMatch,
    historyMatch,
    homeMatch,
    journalMatch,
    learnMatch,
    newsAdminMatch,
    newsMatch,
    privacyMatch,
    readingMatch,
    settingsMatch,
    termsMatch,
  ]);

  const [cloudError, setCloudError] = useState<string | null>(null);
  const [isArcanaSearchOpen, setIsArcanaSearchOpen] = useState(false);
  const [arcanaQuery, setArcanaQuery] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const { pushToast } = useToast();
  const lastToastKeyRef = useRef<string>("");
  const auth = useAuth();
  const cloudQuery = useTarotCloudQuery(Boolean(auth.isConfigured && auth.session));
  const newsRole = useNewsRole();
  const themeId = useTarot((state) => state.themeId);
  const language = useTarot((state) => state.language);
  const soundEnabled = useTarot((state) => state.soundEnabled);
  const syncError = useTarot((state) => state.syncError);
  const setAccountData = useTarot((state) => state.setAccountData);
  const beginAccountSession = useTarot((state) => state.beginAccountSession);
  const restoreLocalData = useTarot((state) => state.restoreLocalData);
  const setTheme = useTarot((state) => state.setTheme);
  const setLanguage = useTarot((state) => state.setLanguage);
  const toggleSound = useTarot((state) => state.toggleSound);
  const registerDailyVisit = useTarot((state) => state.registerDailyVisit);
  const hydrateEncryptedJournal = useTarot((state) => state.hydrateEncryptedJournal);
  const copy = uiCopy[language];
  const isLoggedIn = Boolean(auth.session);
  const canManageNews = newsRole.isAdmin || newsRole.isModerator;
  const globalArcanaResults = useMemo(() => {
    const localizedCards = majorArcana.map((card) => localizeCard(card, language));
    const normalizedQuery = arcanaQuery.trim();

    if (!normalizedQuery) {
      return localizedCards.slice(0, 6);
    }

    const fuse = createFuseSearch(localizedCards, [
      "name",
      {
        name: "number",
        getFn: (card: ReturnType<typeof localizeCard>) =>
          String(card.number).padStart(2, "0"),
      },
      "keywords",
    ]);

    return fuse.search(normalizedQuery).map((result) => result.item).slice(0, 8);
  }, [arcanaQuery, language]);

  useAmbientSound(soundEnabled);

  useEffect(() => {
    return registerNewsNavigator((newsId) => {
      navigate(`/news/${newsId}`);
    });
  }, [navigate]);

  useEffect(() => {
    document.documentElement.dataset.theme = themeId;
  }, [themeId]);

  useEffect(() => {
    const onboardingSeen = localStorage.getItem("tarot:onboarding-seen");
    if (!onboardingSeen) {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const { registerCloudVisit, isCloudEnabled } = useStreakCloud();

  useEffect(() => {
    registerDailyVisit();
    if (isCloudEnabled) {
      void registerCloudVisit();
    }
  }, [isCloudEnabled, registerCloudVisit, registerDailyVisit]);

  useEffect(() => {
    void hydrateEncryptedJournal();
  }, [hydrateEncryptedJournal]);

  useEffect(() => {
    const toastKey = `${cloudError ?? ""}|${syncError ?? ""}`;
    if (!cloudError && !syncError) {
      return;
    }

    if (lastToastKeyRef.current === toastKey) {
      return;
    }

    pushToast(syncError ? copy.cloudSyncError : copy.cloudLoadError, "error");
    lastToastKeyRef.current = toastKey;
  }, [cloudError, copy.cloudLoadError, copy.cloudSyncError, pushToast, syncError]);

  useEffect(() => {
    if (!isLoggedIn && ["history", "journal"].includes(activePage)) {
      navigate("/home", { replace: true });
    }
  }, [activePage, isLoggedIn, navigate]);

  useEffect(() => {
    if (activePage === "news-admin" && !canManageNews && !newsRole.isLoading) {
      navigate("/home", { replace: true });
    }
  }, [activePage, canManageNews, navigate, newsRole.isLoading]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsArcanaSearchOpen(true);
      }

      if (event.key === "Escape") {
        setIsArcanaSearchOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    if (!auth.isConfigured || !auth.session) {
      restoreLocalData();
      setCloudError(null);
      return;
    }

    beginAccountSession();
  }, [auth.isConfigured, auth.session, beginAccountSession, restoreLocalData]);

  useEffect(() => {
    if (!auth.isConfigured || !auth.session || !cloudQuery.data) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const { mergeLocalIntoCloudAccount } = await import("./lib/tarotCloud");
        const local = {
          history: useTarot.getState().history,
          journal: useTarot.getState().journal,
        };
        const merged = await mergeLocalIntoCloudAccount(cloudQuery.data, local);
        if (cancelled) {
          return;
        }
        setAccountData(merged.history, merged.journal);
        setCloudError(
          "journalDecryptFailed" in cloudQuery.data && cloudQuery.data.journalDecryptFailed
            ? "journal-decrypt-error"
            : null,
        );
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setCloudError(
            error instanceof Error ? error.message : "cloud-merge-error",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    auth.isConfigured,
    auth.session,
    cloudQuery.data,
    setAccountData,
  ]);

  useEffect(() => {
    if (!auth.session || !cloudQuery.error) {
      return;
    }

    beginAccountSession();
    setCloudError(
      cloudQuery.error instanceof Error ? cloudQuery.error.message : "cloud-load-error",
    );
  }, [auth.session, beginAccountSession, cloudQuery.error]);

  const handleSelectArcana = (cardId: TarotCardId) => {
    navigate("/arcana");
    setIsArcanaSearchOpen(false);
    setArcanaQuery("");
    window.dispatchEvent(
      new CustomEvent("arcana:focus", {
        detail: { cardId },
      }),
    );
  };

  const handleNavigate = (page: AppPage) => {
    navigate(`/${page}`);
  };

  const goHome = () => {
    navigate("/home");
  };

  if (authCallbackMatch) {
    return (
      <Suspense fallback={null}>
        <AuthCallbackPage />
      </Suspense>
    );
  }

  return (
    <UserProfileProvider user={auth.user}>
      <XpGainListener />
    <SeoHelmet activePage={activePage} language={language} copy={copy} />
    <div className="theme-root">
      <Sonner />
      <div
        className={`app-shell mx-auto flex min-h-screen w-full flex-col ${
          activePage === "journal" ? "is-journal" : ""
        } ${
          activePage === "reading" ? "is-reading" : ""
        } ${
          activePage === "home" ? "is-home" : ""
        }`}
      >
        <a href="#main-content" className="skip-link">
          {copy.skipToContent}
        </a>

        <AppNavigation
          fixed
          activePage={activePage}
          language={language}
          themeId={themeId}
          soundEnabled={soundEnabled}
          isLoggedIn={isLoggedIn}
          canManageNews={canManageNews}
          auth={auth}
          cloudError={cloudError}
          syncError={syncError}
          installPrompt={installPrompt}
          onNavigate={handleNavigate}
          onOpenSearch={() => setIsArcanaSearchOpen(true)}
          onSetTheme={setTheme}
          onSetLanguage={setLanguage}
          onToggleSound={toggleSound}
          onInstallApp={async () => {
            const promptEvent = installPrompt as Event & {
              prompt?: () => Promise<void>;
            };
            await promptEvent.prompt?.();
            setInstallPrompt(null);
          }}
        />

        {cloudError || syncError || !isOnline ? (
          <div className="status-banner" role="status">
            <div className="zen-container status-banner__inner">
              <AlertTriangle className="status-banner__icon" aria-hidden="true" />
              <span className="status-banner__text">
                {!isOnline
                  ? copy.offlineTitle
                  : syncError
                    ? copy.cloudSyncError
                    : copy.cloudLoadError}
              </span>
            </div>
          </div>
        ) : null}

        <main id="main-content" className="flex-1">
          <Suspense
            fallback={
              <PageShell>
                <div className="suspense-skeleton" aria-label={copy.loading} aria-busy="true">
                  <Skeleton className="h-0.5 w-8" />
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-10 w-full max-w-sm" />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-44 w-full" />
                    <Skeleton className="h-44 w-full" />
                  </div>
                </div>
              </PageShell>
            }
          >
            <AppRoutes
              renderHome={() => <HomePage onNavigate={handleNavigate} />}
              renderReading={() => <ReadingBoard />}
              renderHistory={() => <HistoryPage />}
              renderJournal={() => <JournalPage />}
              renderArcana={() => <ArcanaPage />}
              renderLearn={() => <LearningPage />}
              renderSettings={() => <SettingsPage />}
              renderNewsAdmin={() =>
                newsRole.isLoading ? (
                  <PageShell>
                    <p className="text-sm text-muted-foreground">{copy.loadingShort}</p>
                  </PageShell>
                ) : canManageNews ? (
                  <NewsAdminPanel />
                ) : null
              }
              renderNewsDetail={(newsId) => (
                <NewsDetailPage newsId={newsId} onBack={goHome} />
              )}
              renderLegal={(kind) => <LegalPage kind={kind} onBack={goHome} />}
            />
          </Suspense>
        </main>

        <CommandDialog open={isArcanaSearchOpen} onOpenChange={setIsArcanaSearchOpen}>
          <CommandInput
            placeholder={copy.searchArcanaPlaceholder}
            value={arcanaQuery}
            onValueChange={setArcanaQuery}
          />
          <CommandList>
            <CommandEmpty>{copy.searchArcanaPlaceholder}</CommandEmpty>
            <CommandGroup heading={copy.globalSearch}>
              {globalArcanaResults.map((card) => (
                <CommandItem key={card.id} onSelect={() => handleSelectArcana(card.id)}>
                  <span className="mr-2 text-minimal text-muted-foreground">
                    {String(card.number).padStart(2, "0")}
                  </span>
                  {card.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </CommandDialog>

        <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
          <DialogContent>
            <div className="zen-accent-bar mb-4" aria-hidden="true" />
            <DialogHeader>
              <DialogDescription className="text-minimal">
                {copy.onboardingLabel}
              </DialogDescription>
              <DialogTitle className="font-display text-2xl">
                {copy.onboardingTitle}
              </DialogTitle>
            </DialogHeader>
            <ol className="grid list-decimal gap-3 pl-5 text-sm text-muted-foreground marker:text-minimal marker:font-medium marker:tracking-widest">
              <li>{copy.onboardingStepOne}</li>
              <li>{copy.onboardingStepTwo}</li>
              <li>{copy.onboardingStepThree}</li>
            </ol>
            <DialogFooter>
              <Button
                onClick={() => {
                  localStorage.setItem("tarot:onboarding-seen", "1");
                  setShowOnboarding(false);
                }}
              >
                {copy.onboardingStart}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="zen-container pb-8">
          <AppFooter language={language} />
        </div>
      </div>
    </div>
    </UserProfileProvider>
  );
}
