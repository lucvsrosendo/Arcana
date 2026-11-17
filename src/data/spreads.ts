import type { SpreadDefinition, SpreadId } from "../types/tarot";

export const spreadDefinitions: SpreadDefinition[] = [
  {
    id: "single",
    title: "1 carta",
    subtitle: "Foco rápido",
    description: "Uma carta para nomear o clima do momento. Ideal para um check-in sem enrolação.",
    positions: [
      {
        id: "message",
        title: "Mensagem",
        prompt: "O que quer ser visto agora",
        learningNote: "Leia como clima central, sem forçar previsão.",
      },
    ],
  },
  {
    id: "three-card",
    title: "3 cartas",
    subtitle: "Passado, presente e futuro",
    description: "Origem, agora e tendência. Leia o fio entre as três — não três pedaços soltos.",
    positions: [
      {
        id: "past",
        title: "Passado",
        prompt: "A raiz que ainda influencia a pergunta",
        learningNote: "Mostra padrões, memórias ou escolhas que trouxeram a situação até aqui.",
      },
      {
        id: "present",
        title: "Presente",
        prompt: "A energia que está em jogo agora",
        learningNote: "Mostra o ponto de poder do momento, onde sua atenção tem mais impacto.",
      },
      {
        id: "future",
        title: "Futuro",
        prompt: "A tendência se nada essencial mudar",
        learningNote: "Não é destino fixo; leia como direção provável.",
      },
    ],
  },
  {
    id: "celtic-cross",
    title: "Cruz Celta",
    subtitle: "Mapa completo",
    description:
      "Dez posições para situações complexas: contexto, desafio, medo e desfecho em um só mapa.",
    positions: [
      { id: "situation", title: "Situação", prompt: "O centro da questão", learningNote: "Nomeia o tema principal." },
      { id: "challenge", title: "Desafio", prompt: "O que cruza o caminho", learningNote: "Mostra tensão, obstáculo ou convite de crescimento." },
      { id: "foundation", title: "Base", prompt: "O que sustenta tudo", learningNote: "Revela raiz emocional ou material." },
      { id: "past", title: "Passado", prompt: "O que ficou para trás", learningNote: "Indica influência recente ou padrão encerrando." },
      { id: "conscious", title: "Consciente", prompt: "O que está claro para você", learningNote: "Mostra objetivo, narrativa ou foco mental." },
      { id: "near-future", title: "Futuro próximo", prompt: "O que se aproxima", learningNote: "Tendência imediata." },
      { id: "self", title: "Você", prompt: "Sua postura na leitura", learningNote: "Mostra como você participa da situação." },
      { id: "environment", title: "Ambiente", prompt: "Influências externas", learningNote: "Pessoas, clima ou condições ao redor." },
      { id: "hopes-fears", title: "Esperanças e medos", prompt: "O desejo misturado ao receio", learningNote: "Ajuda a separar intuição de ansiedade." },
      { id: "outcome", title: "Resultado", prompt: "O desfecho mais provável", learningNote: "Leia em conversa com todas as cartas anteriores." },
    ],
  },
  {
    id: "daily-advice",
    title: "Conselho do dia",
    subtitle: "Direção para o dia",
    description: "Uma carta, uma atitude. Bom para começar o dia com foco, sem drama.",
    positions: [
      {
        id: "advice",
        title: "Conselho",
        prompt: "A atitude mais sábia para hoje",
        learningNote: "Procure uma ação simples que traduza o arcano.",
      },
    ],
  },
  {
    id: "hand-of-eris",
    title: "Mão de Éris",
    subtitle: "Tensão e detalhe oculto",
    description:
      "Cinco cartas para perguntas confusas: impulso, direção, atrito, vínculo e o detalhe que muda a leitura.",
    positions: [
      { id: "thumb", title: "Polegar", prompt: "Impulso inicial", learningNote: "Mostra a força que acende a leitura." },
      { id: "index", title: "Indicador", prompt: "Direção apontada", learningNote: "Sugere para onde a energia quer ir." },
      { id: "middle", title: "Médio", prompt: "Atrito necessário", learningNote: "Revela conflito, provocação ou verdade inconveniente." },
      { id: "ring", title: "Anelar", prompt: "Vínculo e pacto", learningNote: "Mostra alianças, lealdades ou promessas envolvidas." },
      { id: "little", title: "Mínimo", prompt: "Mensagem oculta", learningNote: "Aponta detalhe pequeno que muda a leitura." },
    ],
  },
  {
    id: "yes-no",
    title: "Sim ou não",
    subtitle: "Decisão com contexto",
    description: "Sinal, contexto e conselho. Para quando a dúvida já ocupou espaço demais na cabeça.",
    positions: [
      { id: "signal", title: "Sinal", prompt: "A resposta principal", learningNote: "Leia o tom geral: expansão, bloqueio ou neutralidade." },
      { id: "context", title: "Contexto", prompt: "O que pesa na decisão", learningNote: "Mostra a variável central por trás do sim/não." },
      { id: "advice", title: "Conselho", prompt: "Como agir agora", learningNote: "Aponta atitude para aumentar clareza e segurança." },
    ],
  },
  {
    id: "relationship",
    title: "Relacionamento",
    subtitle: "Dinâmica a dois",
    description:
      "Você, o outro, o atrito e o próximo passo. Quatro cartas para ver o vínculo com mais honestidade.",
    positions: [
      { id: "you", title: "Você", prompt: "Seu estado emocional", learningNote: "Mostra o que você leva para o vínculo." },
      { id: "other", title: "Outra pessoa", prompt: "Energia do outro lado", learningNote: "Retrata postura, necessidade ou limite do outro." },
      { id: "challenge", title: "Desafio", prompt: "O atrito entre vocês", learningNote: "É o ponto que precisa de conversa consciente." },
      { id: "next-step", title: "Próximo passo", prompt: "Movimento recomendado", learningNote: "Pequena ação concreta para melhorar o campo relacional." },
    ],
  },
  {
    id: "year-ahead",
    title: "Ano à frente",
    subtitle: "Quatro trimestres",
    description: "Quatro cartas para mapear o clima de cada fase do próximo ciclo.",
    positions: [
      { id: "q1", title: "1º trimestre", prompt: "Início do ciclo", learningNote: "Define a base dos primeiros movimentos." },
      { id: "q2", title: "2º trimestre", prompt: "Consolidação", learningNote: "Mostra o que ganha forma e estabilidade." },
      { id: "q3", title: "3º trimestre", prompt: "Virada", learningNote: "Indica ajustes, mudanças e maturação." },
      { id: "q4", title: "4º trimestre", prompt: "Fechamento", learningNote: "Resume colheita e preparo para o ciclo seguinte." },
    ],
  },
];

export const getSpreadDefinition = (spreadId: SpreadId) =>
  spreadDefinitions.find((spread) => spread.id === spreadId) ?? spreadDefinitions[1];
