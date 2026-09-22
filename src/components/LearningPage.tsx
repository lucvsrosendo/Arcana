import { PageShell } from "@/components/layout/PageShell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TarotCardBackFace } from "@/features/tarot/components/TarotCardBackFace";
import { cardCombinations } from "../data/combinations";
import { glossaryTerms } from "../data/arcanaDetails";
import {
  getLocalizedSpreadDefinitions,
  localizeCombination,
  uiCopy,
} from "../data/i18n";
import { useTarot } from "../hooks/useTarot";
import type { LanguageCode, SpreadId } from "../types/tarot";

const featuredSpreadIds: SpreadId[] = [
  "single",
  "three-card",
  "celtic-cross",
  "daily-advice",
  "hand-of-eris",
  "yes-no",
  "relationship",
  "year-ahead",
];

const learningCopy: Record<
  LanguageCode,
  {
    examples: Record<(typeof featuredSpreadIds)[number], string>;
    guideLabel: string;
    guideTitle: string;
    guideIntro: string;
    askYourself: string;
    synthesisTitle: string;
    synthesisNote: string;
    synthesisPrompt: string;
    tipLabel: string;
    tipText: string;
  }
> = {
  pt: {
    examples: {
      single: "O que preciso entender agora?",
      "three-card": "Como cheguei aqui — e o que se abre a frente?",
      "celtic-cross": "Quero o panorama completo dessa situação.",
      "daily-advice": "Qual atitude me ajuda a atravessar hoje?",
      "hand-of-eris":
        "Onde esta a tensão — e qual detalhe estou ignorando?",
      "yes-no": "Isso esta alinhado comigo neste momento?",
      relationship: "O que a gente não esta falando — e o que fazer com isso?",
      "year-ahead": "Que energia marca cada fase do proximo ano?",
    },
    guideLabel: "Como interpretar",
    guideTitle: "O papel de cada posição",
    guideIntro:
      "Estrutura simples: a posição pergunta, a carta responde. O salto acontece quando você junta as respostas.",
    askYourself: "Pergunte-se:",
    synthesisTitle: "Sintese",
    synthesisNote: "Integre as mensagens e tire um conselho pratico pra agir.",
    synthesisPrompt: "Qual e a licao — e o proximo passo concreto?",
    tipLabel: "Dica da tarologa",
    tipText:
      "Confie na intuição, mas cheque o padrão. As cartas mostram caminhos; quem caminha e voce.",
  },
  en: {
    examples: {
      single: "What do I need to understand right now?",
      "three-card": "How did I get here — and what opens next?",
      "celtic-cross": "I want the full picture of this situation.",
      "daily-advice": "What attitude helps me move through today?",
      "hand-of-eris":
        "Where is the tension — and what detail am I ignoring?",
      "yes-no": "Is this aligned for me right now?",
      relationship: "What aren't we saying — and what should we do with it?",
      "year-ahead": "What energy marks each phase of the next year?",
    },
    guideLabel: "How to interpret",
    guideTitle: "The role of each position",
    guideIntro:
      "Simple structure: the position asks, the card answers. The jump happens when you connect the answers.",
    askYourself: "Ask yourself:",
    synthesisTitle: "Synthesis",
    synthesisNote: "Integrate the messages and pull one practical next step.",
    synthesisPrompt: "What's the lesson — and the concrete next step?",
    tipLabel: "Reader's tip",
    tipText:
      "Trust intuition, but check the pattern. Cards show paths; you walk them.",
  },
  es: {
    examples: {
      single: "Que necesito entender ahora?",
      "three-card": "Como llegue aca — y que se abre adelante?",
      "celtic-cross": "Quiero el panorama completo de esta situacion.",
      "daily-advice": "Que actitud me ayuda a atravesar hoy?",
      "hand-of-eris":
        "Donde esta la tension — y que detalle estoy ignorando?",
      "yes-no": "Esto esta alineado conmigo ahora?",
      relationship: "Que no estamos diciendo — y que hacemos con eso?",
      "year-ahead": "Que energia marca cada fase del proximo ano?",
    },
    guideLabel: "Como interpretar",
    guideTitle: "El papel de cada posicion",
    guideIntro:
      "Estructura simple: la posicion pregunta, la carta responde. El salto pasa cuando juntas las respuestas.",
    askYourself: "Preguntate:",
    synthesisTitle: "Sintesis",
    synthesisNote: "Integra los mensajes y saca un consejo practico para actuar.",
    synthesisPrompt: "Cual es la leccion — y el proximo paso concreto?",
    tipLabel: "Consejo de la tarotista",
    tipText:
      "Confia en la intuicion, pero chequea el patron. Las cartas muestran caminos; quien camina sos vos.",
  },
};

function toRoman(n: number): string {
  const vals = [10, 9, 5, 4, 1];
  const syms = ["X", "IX", "V", "IV", "I"];
  let result = "";
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) {
      result += syms[i];
      n -= vals[i];
    }
  }
  return result || "I";
}

function MiniCard({ className = "" }: { className?: string }) {
  return (
    <TarotCardBackFace className={`learning-mini-card ${className}`} />
  );
}

function SpreadDiagram({ spreadId }: { spreadId: SpreadId }) {
  if (spreadId === "three-card") {
    return (
      <div className="learning-spread-diagram is-three" aria-hidden="true">
        <MiniCard />
        <MiniCard />
        <MiniCard />
      </div>
    );
  }

  if (spreadId === "yes-no") {
    return (
      <div className="learning-spread-diagram is-three" aria-hidden="true">
        <MiniCard />
        <MiniCard />
        <MiniCard />
      </div>
    );
  }

  if (spreadId === "relationship" || spreadId === "year-ahead") {
    return (
      <div className="learning-spread-diagram is-four" aria-hidden="true">
        <MiniCard />
        <MiniCard />
        <MiniCard />
        <MiniCard />
      </div>
    );
  }

  if (spreadId === "celtic-cross") {
    return (
      <div className="learning-spread-diagram is-celtic" aria-hidden="true">
        <MiniCard className="card-top" />
        <MiniCard className="card-left" />
        <span className="celtic-core">
          <MiniCard className="card-center" />
          <MiniCard className="card-cross" />
        </span>
        <MiniCard className="card-right" />
        <MiniCard className="card-bottom" />
        <MiniCard className="card-pillar-one" />
        <MiniCard className="card-pillar-two" />
        <MiniCard className="card-pillar-three" />
        <MiniCard className="card-pillar-four" />
      </div>
    );
  }

  if (spreadId === "hand-of-eris") {
    return (
      <div className="learning-spread-diagram is-eris" aria-hidden="true">
        <MiniCard className="card-thumb" />
        <MiniCard className="card-index" />
        <MiniCard className="card-middle" />
        <MiniCard className="card-ring" />
        <MiniCard className="card-little" />
      </div>
    );
  }

  return (
    <div
      className={`learning-spread-diagram ${
        spreadId === "daily-advice" ? "is-daily" : "is-single"
      }`}
      aria-hidden="true"
    >
      <MiniCard />
    </div>
  );
}

export function LearningPage() {
  const language = useTarot((state) => state.language);
  const copy = uiCopy[language];
  const pageCopy = learningCopy[language];
  const spreads = getLocalizedSpreadDefinitions(language);
  const featuredSpreads = featuredSpreadIds
    .map((spreadId) => spreads.find((spread) => spread.id === spreadId))
    .filter((spread) => spread !== undefined);
  const timelineSpread = spreads.find((spread) => spread.id === "three-card");
  const guidePositions = [
    ...(timelineSpread?.positions ?? []),
    {
      id: "synthesis",
      title: pageCopy.synthesisTitle,
      learningNote: pageCopy.synthesisNote,
      prompt: pageCopy.synthesisPrompt,
    },
  ];

  return (
    <PageShell>
      <div className="learning-page">
        <section className="learning-hero">
          <div className="learning-hero-copy">
            <p className="learning-eyebrow">{copy.spreadExamples}</p>
            <h1 className="learning-intro-title font-display text-architectural text-4xl font-light md:text-6xl">{copy.learnTitle}</h1>
            <p className="learning-intro-text">{copy.learnIntro}</p>
          </div>

        <div className="learning-hero-art" aria-hidden="true">
          <MiniCard className="hero-card-one" />
          <MiniCard className="hero-card-two" />
          <MiniCard className="hero-card-three" />
          <MiniCard className="hero-card-four" />
        </div>
      </section>

      <section className="learning-featured-grid" aria-label={copy.spreadExamples}>
        {featuredSpreads.map((spread) => (
          <article key={spread.id} className="learning-spread-card">
            <header className="learning-spread-header">
              <p className="learning-spread-kicker">
                <span className="learning-spread-roman" aria-hidden="true">
                  {toRoman(spread.positions?.length ?? 1)}
                </span>
                <span>{spread.subtitle}</span>
              </p>
              <h2 className="learning-spread-title">{spread.title}</h2>
            </header>

            <div className="learning-spread-stage">
              <SpreadDiagram spreadId={spread.id} />
            </div>

            <p className="learning-spread-description">{spread.description}</p>
            <p className="learning-spread-example">{pageCopy.examples[spread.id]}</p>
          </article>
        ))}
      </section>

      <section className="learning-position-guide">
        <header className="learning-guide-intro mb-8">
          <p className="text-minimal mb-4 text-muted-foreground">{pageCopy.guideLabel}</p>
          <h2 className="font-display text-architectural">{pageCopy.guideTitle}</h2>
          <div className="learning-guide-divider" aria-hidden="true">
            <span />
          </div>
          <p>{pageCopy.guideIntro}</p>
        </header>

        <ol className="learning-guide-list">
          {guidePositions.map((position, index) => {
            return (
              <li key={position.id} className="learning-guide-item">
                <header className="learning-guide-item-header">
                  <span className="learning-position-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3>{position.title}</h3>
                </header>
                <p>{position.learningNote}</p>
                <div className="learning-guide-question">
                  <span>{pageCopy.askYourself}</span>
                  <em>{position.prompt}</em>
                </div>
              </li>
            );
          })}
        </ol>

        <aside className="learning-tip">
          <strong>{pageCopy.tipLabel}</strong>
          <em>{pageCopy.tipText}</em>
        </aside>
      </section>

      <section className="learning-reference-section">
        <header className="learning-section-header mb-8">
          <span className="learning-section-mark" aria-hidden="true" />
          <div>
            <p className="text-minimal mb-4 text-muted-foreground">{copy.specialPairs}</p>
            <h2 className="learning-section-title">{copy.combinations}</h2>
          </div>
        </header>

        <div className="learning-grid two">
          {cardCombinations.map((combination) => {
            const localizedCombination = localizeCombination(combination, language);
            const separatorIndex = localizedCombination.indexOf(": ");
            const title = localizedCombination.slice(0, separatorIndex);
            const interpretation = localizedCombination.slice(separatorIndex + 2);

            return (
              <div key={combination.title} className="learning-tile">
                <p className="learning-tile-title">{title}</p>
                <p className="learning-tile-text">{interpretation}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="learning-reference-section">
        <header className="learning-section-header mb-8">
          <span className="learning-section-mark" aria-hidden="true" />
          <div>
            <p className="text-minimal mb-4 text-muted-foreground">{copy.glossarySubtitle}</p>
            <h2 className="learning-section-title">{copy.glossary}</h2>
          </div>
        </header>

        <Accordion type="single" collapsible className="learning-grid three w-full">
              {glossaryTerms.map((item) => (
                <AccordionItem
                  key={item.term[language]}
                  value={item.term[language]}
                  className="learning-tile border-border px-4"
                >
                  <AccordionTrigger className="learning-tile-title py-4 hover:no-underline">
                    {item.term[language]}
                  </AccordionTrigger>
                  <AccordionContent className="learning-tile-text pb-4 text-muted-foreground">
                    {item.definition[language]}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
      </section>
      </div>
    </PageShell>
  );
}
