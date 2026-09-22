import type { SpreadDefinition, SpreadId } from "../types/tarot";

export const spreadDefinitions: SpreadDefinition[] = [
  {
    id: "single",
    title: "1 carta",
    subtitle: "Foco rápido",
    description: "Uma carta pra nomear o clima do momento. Ideal pra check-in sem enrolacao.",
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
    description: "Origem, agora e tendência. Leia o fio entre as tres — não tres pedacos soltos.",
    positions: [
      {
        id: "past",
        title: "Passado",
        prompt: "A raiz que ainda influencia a pergunta",
        learningNote: "Mostra padroes, memórias ou escolhas que trouxeram a situação até aqui.",
      },
      {
        id: "present",
        title: "Presente",
        prompt: "A energia que esta em jogo agora",
        learningNote: "Mostra o ponto de poder do momento, onde sua atenção tem mais impacto.",
      },
      {
        id: "future",
        title: "Futuro",
        prompt: "A tendência se nada essencial mudar",
        learningNote: "Não e destino fixo; leia como direção provável.",
      },
    ],
  },
  {
    id: "celtic-cross",
    title: "Cruz Celta",
    subtitle: "Mapa completo",
    description:
      "Dez posicoes pra situacoes complexas: contexto, desafio, medo e desfecho em um so mapa.",
    positions: [
      { id: "situation", title: "Situação", prompt: "O centro da questão", learningNote: "Nomeia o tema principal." },
      { id: "challenge", title: "Desafio", prompt: "O que cruza o caminho", learningNote: "Mostra tensão, obstáculo ou convite de crescimento." },
      { id: "foundation", title: "Base", prompt: "O que sustenta tudo", learningNote: "Revela raiz emocional ou material." },
      { id: "past", title: "Passado", prompt: "O que ficou para tras", learningNote: "Indica influencia recente ou padrão encerrando." },
      { id: "conscious", title: "Consciente", prompt: "O que esta claro para voce", learningNote: "Mostra objetivo, narrativa ou foco mental." },
      { id: "near-future", title: "Futuro proximo", prompt: "O que se aproxima", learningNote: "Tendência imediata." },
      { id: "self", title: "Você", prompt: "Sua postura na leitura", learningNote: "Mostra como você participa da situação." },
      { id: "environment", title: "Ambiente", prompt: "Influencias externas", learningNote: "Pessoas, clima ou condicoes ao redor." },
      { id: "hopes-fears", title: "Esperancas e medos", prompt: "O desejo misturado ao receio", learningNote: "Ajuda a separar intuição de ansiedade." },
      { id: "outcome", title: "Resultado", prompt: "O desfecho mais provável", learningNote: "Leia em conversa com todas as cartas anteriores." },
    ],
  },
  {
    id: "daily-advice",
    title: "Conselho do dia",
    subtitle: "Direção pro dia",
    description: "Uma carta, uma atitude. Bom pra comecar o dia com foco sem drama.",
    positions: [
      {
        id: "advice",
        title: "Conselho",
        prompt: "A atitude mais sabia para hoje",
        learningNote: "Procure uma acao simples que traduza o arcano.",
      },
    ],
  },
  {
    id: "hand-of-eris",
    title: "Mao de Eris",
    subtitle: "Tensao e detalhe oculto",
    description:
      "Cinco cartas pra perguntas confusas: impulso, direção, atrito, vínculo e o detalhe que muda a leitura.",
    positions: [
      { id: "thumb", title: "Polegar", prompt: "Impulso inicial", learningNote: "Mostra a força que acende a leitura." },
      { id: "index", title: "Indicador", prompt: "Direção apontada", learningNote: "Sugere para onde a energia quer ir." },
      { id: "middle", title: "Medio", prompt: "Atrito necessário", learningNote: "Revela conflito, provocação ou verdade inconveniente." },
      { id: "ring", title: "Anelar", prompt: "Vinculo e pacto", learningNote: "Mostra aliancas, lealdades ou promessas envolvidas." },
      { id: "little", title: "Minimo", prompt: "Mensagem oculta", learningNote: "Aponta detalhe pequeno que muda a leitura." },
    ],
  },
  {
    id: "yes-no",
    title: "Sim ou nao",
    subtitle: "Decisão com contexto",
    description: "Sinal, contexto e conselho. Pra quando a dúvida já ocupou espaço demais na cabeça.",
    positions: [
      { id: "signal", title: "Sinal", prompt: "A resposta principal", learningNote: "Leia o tom geral: expansao, bloqueio ou neutralidade." },
      { id: "context", title: "Contexto", prompt: "O que pesa na decisão", learningNote: "Mostra variavel central por tras do sim/não." },
      { id: "advice", title: "Conselho", prompt: "Como agir agora", learningNote: "Aponta atitude para aumentar clareza e seguranca." },
    ],
  },
  {
    id: "relationship",
    title: "Relacionamento",
    subtitle: "Dinamica a dois",
    description:
      "Você, o outro, o atrito e o proximo passo. Quatro cartas pra ver o vínculo com mais honestidade.",
    positions: [
      { id: "you", title: "Você", prompt: "Seu estado emocional", learningNote: "Mostra o que você leva para o vínculo." },
      { id: "other", title: "Outra pessoa", prompt: "Energia do outro lado", learningNote: "Retrata postura, necessidade ou limite do outro." },
      { id: "challenge", title: "Desafio", prompt: "O atrito entre voces", learningNote: "É o ponto que precisa de conversa consciente." },
      { id: "next-step", title: "Proximo passo", prompt: "Movimento recomendado", learningNote: "Pequena acao concreta para melhorar o campo relacional." },
    ],
  },
  {
    id: "year-ahead",
    title: "Ano a frente",
    subtitle: "Quatro trimestres",
    description: "Quatro cartas pra mapear o clima de cada fase do proximo ciclo.",
    positions: [
      { id: "q1", title: "1o trimestre", prompt: "Inicio do ciclo", learningNote: "Define a base dos primeiros movimentos." },
      { id: "q2", title: "2o trimestre", prompt: "Consolidacao", learningNote: "Mostra o que ganha forma e estabilidade." },
      { id: "q3", title: "3o trimestre", prompt: "Virada", learningNote: "Indica ajustes, mudancas e maturacao." },
      { id: "q4", title: "4o trimestre", prompt: "Fechamento", learningNote: "Resume colheita e preparo para o ciclo seguinte." },
    ],
  },
];

export const getSpreadDefinition = (spreadId: SpreadId) =>
  spreadDefinitions.find((spread) => spread.id === spreadId) ?? spreadDefinitions[1];
