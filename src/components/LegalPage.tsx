import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { legalContent, type LegalPageContent } from "@/data/legalContent";
import { uiCopy } from "@/data/i18n";
import { useTarot } from "@/hooks/useTarot";

type LegalPageKind = "privacy" | "terms" | "cookies";

type LegalPageProps = {
  kind: LegalPageKind;
  onBack: () => void;
};

export function LegalPage({ kind, onBack }: LegalPageProps) {
  const language = useTarot((state) => state.language);
  const copy = uiCopy[language];
  const content: LegalPageContent = legalContent[language][kind];

  return (
    <PageShell>
      <div className="legal-page mx-auto max-w-4xl">
        <button type="button" className="legal-back" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {copy.legalBack}
        </button>

        <header className="legal-hero">
          <p className="text-minimal mb-4 text-muted-foreground">{copy.legal}</p>
          <h1 className="font-display text-architectural text-4xl font-light md:text-6xl">
            {content.title}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            {copy.legalLastUpdated}: {content.lastUpdated}
          </p>
        </header>

        <div className="editorial-prose border-t border-border pt-10">
          {content.sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-display">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
