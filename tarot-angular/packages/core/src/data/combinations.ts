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
    interpretation: "Crise seguida de cura: algo cai para que a esperanca volte sem ilusao.",
  },
  {
    cards: ["death", "temperance"],
    title: "A Morte + A Temperanca",
    interpretation: "Encerramento que precisa de tempo, cuidado e reintegracao.",
  },
  {
    cards: ["the-moon", "the-sun"],
    title: "A Lua + O Sol",
    interpretation: "Confusao dando lugar a clareza; cheque fatos antes da conclusao final.",
  },
  {
    cards: ["the-fool", "the-magician"],
    title: "O Louco + O Mago",
    interpretation: "Inicio potente: coragem e ferramenta aparecem juntas.",
  },
  {
    cards: ["the-devil", "the-tower"],
    title: "O Diabo + A Torre",
    interpretation: "Libertacao intensa de apegos, dependencias ou pactos desgastados.",
  },
  {
    cards: ["justice", "judgement"],
    title: "A Justica + O Julgamento",
    interpretation: "Acerto de contas maduro: verdade, consequencia e renascimento.",
  },
  {
    cards: ["the-high-priestess", "the-moon"],
    title: "A Sacerdotisa + A Lua",
    interpretation: "Intuicao profunda, mas com risco de projecao; registre sinais antes de concluir.",
  },
  {
    cards: ["the-emperor", "the-hierophant"],
    title: "O Imperador + O Hierofante",
    interpretation: "Estrutura e tradicao: regras podem proteger, mas tambem engessar.",
  },
  {
    cards: ["the-lovers", "the-devil"],
    title: "Os Enamorados + O Diabo",
    interpretation: "Desejo forte pede escolha consciente para nao virar dependencia.",
  },
  {
    cards: ["the-chariot", "strength"],
    title: "O Carro + A Forca",
    interpretation: "Avanco com dominio interno: velocidade so funciona com maturidade emocional.",
  },
  {
    cards: ["the-hermit", "the-star"],
    title: "O Eremita + A Estrela",
    interpretation: "Cura silenciosa: recolhimento que devolve esperanca e direcao.",
  },
  {
    cards: ["temperance", "the-world"],
    title: "A Temperanca + O Mundo",
    interpretation: "Integracao bem-sucedida: pequenos ajustes completam um ciclo maior.",
  },
];
