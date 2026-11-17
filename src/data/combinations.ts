import type { TarotCardId } from "../types/tarot";

export type CardCombination = {
  cards: [TarotCardId, TarotCardId];
  title: string;
  interpretation: string;
};

export const cardCombinations: CardCombination[] = [
  {
    cards: ["the-tower", "the-star"],
    title: "A Torre + A Estrela",
    interpretation: "Crise seguida de cura: algo cai para que a esperança volte sem ilusão.",
  },
  {
    cards: ["death", "temperance"],
    title: "A Morte + A Temperança",
    interpretation: "Encerramento que precisa de tempo, cuidado e reintegração.",
  },
  {
    cards: ["the-moon", "the-sun"],
    title: "A Lua + O Sol",
    interpretation: "Confusão dando lugar à clareza; cheque fatos antes da conclusão final.",
  },
  {
    cards: ["the-fool", "the-magician"],
    title: "O Louco + O Mago",
    interpretation: "Início potente: coragem e ferramenta aparecem juntas.",
  },
  {
    cards: ["the-devil", "the-tower"],
    title: "O Diabo + A Torre",
    interpretation: "Libertação intensa de apegos, dependências ou pactos desgastados.",
  },
  {
    cards: ["justice", "judgement"],
    title: "A Justiça + O Julgamento",
    interpretation: "Acerto de contas maduro: verdade, consequência e renascimento.",
  },
  {
    cards: ["the-high-priestess", "the-moon"],
    title: "A Sacerdotisa + A Lua",
    interpretation: "Intuição profunda, mas com risco de projeção; registre sinais antes de concluir.",
  },
  {
    cards: ["the-emperor", "the-hierophant"],
    title: "O Imperador + O Hierofante",
    interpretation: "Estrutura e tradição: regras podem proteger, mas também engessar.",
  },
  {
    cards: ["the-lovers", "the-devil"],
    title: "Os Enamorados + O Diabo",
    interpretation: "Desejo forte pede escolha consciente para não virar dependência.",
  },
  {
    cards: ["the-chariot", "strength"],
    title: "O Carro + A Força",
    interpretation: "Avanço com domínio interno: velocidade só funciona com maturidade emocional.",
  },
  {
    cards: ["the-hermit", "the-star"],
    title: "O Eremita + A Estrela",
    interpretation: "Cura silenciosa: recolhimento que devolve esperança e direção.",
  },
  {
    cards: ["temperance", "the-world"],
    title: "A Temperança + O Mundo",
    interpretation: "Integração bem-sucedida: pequenos ajustes completam um ciclo maior.",
  },
];
