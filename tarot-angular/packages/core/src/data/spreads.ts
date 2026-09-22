import type { SpreadDefinition, SpreadId } from "../types/tarot";

export const spreadDefinitions: SpreadDefinition[] = [
  {
    id: "single",
    title: "1 carta",
    subtitle: "Um foco direto",
    description: "Uma carta para nomear a energia dominante do momento.",
    positions: [
      {
        id: "message",
        title: "Mensagem",
        prompt: "O que quer ser visto agora",
        learningNote: "Leia como clima central, sem forcar previsao.",
      },
    ],
  },
  {
    id: "three-card",
    title: "3 cartas",
    subtitle: "Passado, presente e futuro",
    description: "Uma leitura linear para observar origem, estado atual e tendencia.",
    positions: [
      {
        id: "past",
        title: "Passado",
        prompt: "A raiz que ainda influencia a pergunta",
        learningNote: "Mostra padroes, memorias ou escolhas que trouxeram a situacao ate aqui.",
      },
      {
        id: "present",
        title: "Presente",
        prompt: "A energia que esta em jogo agora",
        learningNote: "Mostra o ponto de poder do momento, onde sua atencao tem mais impacto.",
      },
      {
        id: "future",
        title: "Futuro",
        prompt: "A tendencia se nada essencial mudar",
        learningNote: "Nao e destino fixo; leia como direcao provavel.",
      },
    ],
  },
  {
    id: "celtic-cross",
    title: "Cruz Celta",
    subtitle: "Mapa profundo",
    description: "Dez posicoes para investigar contexto, desafio, base e desfecho possivel.",
    positions: [
      { id: "situation", title: "Situacao", prompt: "O centro da questao", learningNote: "Nomeia o tema principal." },
      { id: "challenge", title: "Desafio", prompt: "O que cruza o caminho", learningNote: "Mostra tensao, obstaculo ou convite de crescimento." },
      { id: "foundation", title: "Base", prompt: "O que sustenta tudo", learningNote: "Revela raiz emocional ou material." },
      { id: "past", title: "Passado", prompt: "O que ficou para tras", learningNote: "Indica influencia recente ou padrao encerrando." },
      { id: "conscious", title: "Consciente", prompt: "O que esta claro para voce", learningNote: "Mostra objetivo, narrativa ou foco mental." },
      { id: "near-future", title: "Futuro proximo", prompt: "O que se aproxima", learningNote: "Tendencia imediata." },
      { id: "self", title: "Voce", prompt: "Sua postura na leitura", learningNote: "Mostra como voce participa da situacao." },
      { id: "environment", title: "Ambiente", prompt: "Influencias externas", learningNote: "Pessoas, clima ou condicoes ao redor." },
      { id: "hopes-fears", title: "Esperancas e medos", prompt: "O desejo misturado ao receio", learningNote: "Ajuda a separar intuicao de ansiedade." },
      { id: "outcome", title: "Resultado", prompt: "O desfecho mais provavel", learningNote: "Leia em conversa com todas as cartas anteriores." },
    ],
  },
  {
    id: "daily-advice",
    title: "Conselho do dia",
    subtitle: "Direcao para hoje",
    description: "Uma carta como conselho pratico para atravessar o dia.",
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
    subtitle: "Cinco dedos da discordia criativa",
    description: "Cinco cartas para ler impulso, direcao, tensao, vinculo e mensagem oculta.",
    positions: [
      { id: "thumb", title: "Polegar", prompt: "Impulso inicial", learningNote: "Mostra a forca que acende a leitura." },
      { id: "index", title: "Indicador", prompt: "Direcao apontada", learningNote: "Sugere para onde a energia quer ir." },
      { id: "middle", title: "Medio", prompt: "Atrito necessario", learningNote: "Revela conflito, provocacao ou verdade inconveniente." },
      { id: "ring", title: "Anelar", prompt: "Vinculo e pacto", learningNote: "Mostra aliancas, lealdades ou promessas envolvidas." },
      { id: "little", title: "Minimo", prompt: "Mensagem oculta", learningNote: "Aponta detalhe pequeno que muda a leitura." },
    ],
  },
  {
    id: "yes-no",
    title: "Sim ou nao",
    subtitle: "Decisao objetiva",
    description: "Tres cartas para sinal, contexto e conselho pratico.",
    positions: [
      { id: "signal", title: "Sinal", prompt: "A resposta principal", learningNote: "Leia o tom geral: expansao, bloqueio ou neutralidade." },
      { id: "context", title: "Contexto", prompt: "O que pesa na decisao", learningNote: "Mostra variavel central por tras do sim/nao." },
      { id: "advice", title: "Conselho", prompt: "Como agir agora", learningNote: "Aponta atitude para aumentar clareza e seguranca." },
    ],
  },
  {
    id: "relationship",
    title: "Relacionamento",
    subtitle: "Dinamica a dois",
    description: "Quatro cartas para sentimentos, desafios, ponte e proximo passo.",
    positions: [
      { id: "you", title: "Voce", prompt: "Seu estado emocional", learningNote: "Mostra o que voce leva para o vinculo." },
      { id: "other", title: "Outra pessoa", prompt: "Energia do outro lado", learningNote: "Retrata postura, necessidade ou limite do outro." },
      { id: "challenge", title: "Desafio", prompt: "O atrito entre voces", learningNote: "E o ponto que precisa de conversa consciente." },
      { id: "next-step", title: "Proximo passo", prompt: "Movimento recomendado", learningNote: "Pequena acao concreta para melhorar o campo relacional." },
    ],
  },
  {
    id: "year-ahead",
    title: "Ano a frente",
    subtitle: "Quatro trimestres",
    description: "Quatro cartas para mapear ciclos do proximo ano.",
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
