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
import { getMarseilleNumeral } from "@/lib/artwork";
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
      "hand-of-eris": "Onde esta a tensão — e qual detalhe estou ignorando?",
      "yes-no": "Isso esta alinhado comigo neste momento?",
      relationship: "O que a gente não esta falando — e o que fazer com isso?",
      "year-ahead": "Que energia marca cada fase do proximo ano?",
    },
    guideLabel: "Como interpretar",
    guideTitle: "O papel de cada posição",
    guideIntro:
      "Estrutura simples: a posição pergunta, a carta responde. O salto acontece quando você junta as respostas.",
    askYourself: "Pergunte-se:",
    synthesisTitle: "Síntese",
    synthesisNote: "Integre as mensagens e tire um conselho prático pra agir.",
    synthesisPrompt: "Qual é a lição — e o próximo passo concreto?",
    tipLabel: "Dica da taróloga",
    tipText:
      "Confie na intuição, mas cheque o padrão. As cartas mostram caminhos; quem caminha é você.",
  },
  en: {
    examples: {
      single: "What do I need to understand right now?",
      "three-card": "How did I get here — and what opens next?",
      "celtic-cross": "I want the full picture of this situation.",
      "daily-advice": "What attitude helps me move through today?",
      "hand-of-eris": "Where is the tension — and what detail am I ignoring?",
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
    tipText: "Trust intuition, but check the pattern. Cards show paths; you walk them.",
  },
  es: {
    examples: {
      single: "Que necesito entender ahora?",
      "three-card": "Como llegue aca — y que se abre adelante?",
      "celtic-cross": "Quiero el panorama completo de esta situacion.",
      "daily-advice": "Que actitud me ayuda a atravesar hoy?",
      "hand-of-eris": "Donde esta la tension — y que detalle estoy ignorando?",
      "yes-no": "Esto esta alineado conmigo ahora?",
      relationship: "Que no estamos diciendo — y que hacemos con eso?",
      "year-ahead": "Que energia marca cada fase del proximo ano?",
    },
    guideLabel: "Como interpretar",
    guideTitle: "El papel de cada posicion",
    guideIntro:
      "Estructura simple: la posicion pregunta, la carta responde. El salto pasa cuando juntas las respuestas.",
    askYourself: "Preguntate:",
    synthesisTitle: "Síntesis",
    synthesisNote: "Integra los mensajes y saca un consejo práctico para actuar.",
    synthesisPrompt: "Cual es la leccion — y el proximo paso concreto?",
    tipLabel: "Consejo de la tarotista",
    tipText:
      "Confia en la intuicion, pero chequea el patron. Las cartas muestran caminos; quien camina sos vos.",
  },
};

function MiniCard({ className = "" }: { className?: string }) {
  return <TarotCardBackFace className={`learning-mini-card ${className}`} />;
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

function LearningSectionHeader({
  title,
  text,
}: {
  title: string;
  text?: string;
}) {
  return (
    <header className="learning-section__header">
      <h2 className="learning-section__title font-display">{title}</h2>
      {text ? <p className="learning-section__text">{text}</p> : null}
    </header>
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
      <div className="learning-page learning-marseille">
        <section className="learning-hero">
          <div className="learning-hero__inner">
            <div className="learning-hero-copy">
              <h1 className="learning-intro-title font-display">{copy.learnTitle}</h1>
              <p className="learning-intro-text">{copy.learnIntro}</p>
            </div>

            <div className="learning-hero-art" aria-hidden="true">
              <MiniCard className="hero-card-one" />
              <MiniCard className="hero-card-two" />
              <MiniCard className="hero-card-three" />
              <MiniCard className="hero-card-four" />
            </div>
          </div>
        </section>

        <section className="learning-section" aria-label={copy.spreadExamples}>
          <LearningSectionHeader title={copy.spreadExamples} />
          <div className="learning-featured-grid">
            {featuredSpreads.map((spread) => {
              const count = spread.positions?.length ?? 1;
              return (
                <article key={spread.id} className="learning-spread-card">
                  <header className="learning-spread-header">
                    <p className="learning-spread-kicker">
                      <span className="learning-spread-roman" aria-hidden="true">
                        {getMarseilleNumeral(count)}
                      </span>
                      <span>{spread.subtitle}</span>
                    </p>
                    <h3 className="learning-spread-title font-display">{spread.title}</h3>
                  </header>

                  <div className="learning-spread-stage">
                    <SpreadDiagram spreadId={spread.id} />
                  </div>

                  <p className="learning-spread-description">{spread.description}</p>
                  <p className="learning-spread-example">{pageCopy.examples[spread.id]}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="learning-section learning-section--guide">
          <LearningSectionHeader title={pageCopy.guideTitle} text={pageCopy.guideIntro} />

          <ol className="learning-guide-list">
            {guidePositions.map((position, index) => (
              <li key={position.id} className="learning-guide-item">
                <span className="learning-position-number" aria-hidden="true">
                  {getMarseilleNumeral(index + 1)}
                </span>
                <div className="learning-guide-item__body">
                  <h3 className="learning-guide-item__title font-display">{position.title}</h3>
                  <p className="learning-guide-item__note">{position.learningNote}</p>
                  <p className="learning-guide-question">
                    <span>{pageCopy.askYourself}</span> <em>{position.prompt}</em>
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <aside className="learning-tip">
            <strong>{pageCopy.tipLabel}</strong>
            <p>{pageCopy.tipText}</p>
          </aside>
        </section>

        <section className="learning-section">
          <LearningSectionHeader title={copy.combinations} text={copy.specialPairs} />
          <ul className="learning-pairs">
            {cardCombinations.map((combination) => {
              const localizedCombination = localizeCombination(combination, language);
              const separatorIndex = localizedCombination.indexOf(": ");
              const title = localizedCombination.slice(0, separatorIndex);
              const interpretation = localizedCombination.slice(separatorIndex + 2);

              return (
                <li key={combination.title} className="learning-pair">
                  <p className="learning-pair__title font-display">{title}</p>
                  <p className="learning-pair__text">{interpretation}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="learning-section learning-section--glossary">
          <LearningSectionHeader title={copy.glossary} text={copy.glossarySubtitle} />
          <Accordion type="single" collapsible className="learning-glossary">
            {glossaryTerms.map((item) => (
              <AccordionItem
                key={item.term[language]}
                value={item.term[language]}
                className="learning-glossary__item"
              >
                <AccordionTrigger className="learning-glossary__trigger">
                  {item.term[language]}
                </AccordionTrigger>
                <AccordionContent className="learning-glossary__content">
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
