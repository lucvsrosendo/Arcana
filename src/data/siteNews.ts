import type { LanguageCode } from "../types/tarot";

export type SiteNewsItem = {
  id: string;
  date: string;
  tag: string;
  title: string;
  summary: string;
  body?: string;
  coverImageUrl?: string | null;
};

export type NewsComment = {
  id: string;
  newsId: string;
  userId: string;
  parentId?: string | null;
  authorDisplayName: string;
  authorAvatarUrl?: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  favoriteCount: number;
  likedByCurrentUser: boolean;
  favoritedByCurrentUser: boolean;
};

export type HomeContent = {
  brandName: string;
  title: string;
  /** Substring of `title` set in italic. */
  titleAccent: string;
  intro: string;
  primaryAction: string;
  secondaryAction: string;
  heroFactArcana: string;
  heroFactSpreads: string;
  dailyTitle: string;
  dailyText: string;
  dailyOpenLabel: string;
  arcanaTitle: string;
  arcanaText: string;
  arcanaAction: string;
  arcanaOpenLabel: string;
  spreadsTitle: string;
  spreadsText: string;
  spreadsAction: string;
  spreadsCardUnit: { one: string; other: string };
  pillarsTitle: string;
  pillars: Array<{
    icon: "layers" | "book" | "journal" | "shield";
    title: string;
    text: string;
  }>;
  aboutTitle: string;
  aboutText: string;
  aboutPoints: string[];
  newsTitle: string;
  newsSubtitle: string;
  newsSidebarTitle: string;
  newsSidebarHint: string;
};

export const homeContent: Record<LanguageCode, HomeContent> = {
  pt: {
    brandName: "Arcanos Maiores",
    title: "Organize o que você já sente.",
    titleAccent: "já sente",
    intro:
      "Tiragem rápida, os 22 arcanos de Marselha e um diário para notar padrões. Sem previsão: só espelho, e a próxima decisão fica mais clara.",
    primaryAction: "Fazer uma tiragem",
    secondaryAction: "Aprender a ler",
    heroFactArcana: "22 arcanos de Marselha",
    heroFactSpreads: "formatos de tiragem",
    dailyTitle: "Carta de hoje",
    dailyText: "Um símbolo para calibrar o dia. Leva segundos e fica com você o resto da tarde.",
    dailyOpenLabel: "Abrir minha carta",
    arcanaTitle: "Os 22, em ordem",
    arcanaText:
      "Do Louco ao Mundo, cada arcano é um passo da mesma jornada. Toque numa carta para abrir o significado dela.",
    arcanaAction: "Abrir a biblioteca",
    arcanaOpenLabel: "Ver significado",
    spreadsTitle: "Primeiro a pergunta, depois o formato",
    spreadsText:
      "Comece com uma carta. Quando a pergunta pedir contexto, abra três, ou a Cruz Celta inteira.",
    spreadsAction: "Usar esta tiragem",
    spreadsCardUnit: { one: "carta", other: "cartas" },
    pillarsTitle: "O que você encontra aqui",
    pillars: [
      {
        icon: "layers",
        title: "Tiragens sem enrolação",
        text: "Escolha o formato, puxe as cartas e leia cada posição como uma pergunta. Clareza agora, não depois.",
      },
      {
        icon: "book",
        title: "Biblioteca dos 22",
        text: "Significados, símbolos e exemplos no tarot de Marselha. Consulte quando a carta virar e você quiser ir fundo.",
      },
      {
        icon: "journal",
        title: "Diário que mostra padrão",
        text: "Anote o que bateu. Dias depois você vê o que se repetiu e para de achar que é só coincidência.",
      },
      {
        icon: "shield",
        title: "Espelho, não destino",
        text: "Tarot como linguagem simbólica. Ajuda a nomear, não decide por você. Você lê. Você escolhe.",
      },
    ],
    aboutTitle: "Tarot como ferramenta. Não como sentença.",
    aboutText:
      "Mesa, estudo e diário no mesmo lugar. Você tira, interpreta, anota, e volta quando a cabeça pedir outra rodada.",
    aboutPoints: [
      "Na Tiragem você abre a pergunta e vê o que responde.",
      "O Histórico guarda leituras e mostra as cartas que voltam.",
      "O Diário transforma impressão solta em padrão visível.",
      "Aprender explica as posições para você ler com mais confiança.",
    ],
    newsTitle: "Novidades",
    newsSubtitle: "Atualizações da mesa, melhorias e ideias para usar melhor.",
    newsSidebarTitle: "Últimas",
    newsSidebarHint: "Veja tudo na Home.",
  },
  en: {
    brandName: "Major Arcana",
    title: "Name what you already feel.",
    titleAccent: "already feel",
    intro:
      "Quick spreads, the 22 Marseille arcana, and a journal to spot patterns. Not prediction: a mirror, so the next call gets clearer.",
    primaryAction: "Do a reading",
    secondaryAction: "Learn to read",
    heroFactArcana: "22 Marseille arcana",
    heroFactSpreads: "spread layouts",
    dailyTitle: "Today's card",
    dailyText: "One symbol to set the tone. Takes seconds and stays with you all afternoon.",
    dailyOpenLabel: "Open my card",
    arcanaTitle: "The 22, in order",
    arcanaText:
      "From the Fool to the World, each arcanum is one step of the same journey. Tap a card to open its meaning.",
    arcanaAction: "Open the library",
    arcanaOpenLabel: "See meaning",
    spreadsTitle: "The question first, then the layout",
    spreadsText:
      "Start with one card. When the question needs context, open three, or the full Celtic Cross.",
    spreadsAction: "Use this spread",
    spreadsCardUnit: { one: "card", other: "cards" },
    pillarsTitle: "What you'll find here",
    pillars: [
      {
        icon: "layers",
        title: "Spreads without the fluff",
        text: "Pick a layout, draw, and read each position as a question. Clarity now, not later.",
      },
      {
        icon: "book",
        title: "Library of 22",
        text: "Meanings, symbols, and Marseille examples. Dig in when a card turns and you want depth.",
      },
      {
        icon: "journal",
        title: "A journal that shows patterns",
        text: "Note what hit. Days later you see what repeated, and stop calling it coincidence.",
      },
      {
        icon: "shield",
        title: "Mirror, not fate",
        text: "Tarot as symbolic language. It helps you name things. It doesn't decide for you.",
      },
    ],
    aboutTitle: "Tarot as a tool. Not a sentence.",
    aboutText:
      "Table, study, and journal in one place. Draw, interpret, take notes, and come back when your head wants another round.",
    aboutPoints: [
      "Reading is where you open the question and see what answers.",
      "History keeps your readings and shows the cards that return.",
      "The Journal turns loose impressions into visible patterns.",
      "Learn explains positions so you read with more confidence.",
    ],
    newsTitle: "Updates",
    newsSubtitle: "Table updates, improvements, and ideas to use it better.",
    newsSidebarTitle: "Latest",
    newsSidebarHint: "See everything on Home.",
  },
  es: {
    brandName: "Arcanos Mayores",
    title: "Ordena lo que ya sentís.",
    titleAccent: "ya sentís",
    intro:
      "Tirada rápida, los 22 arcanos de Marsella y un diario para notar patrones. Sin predicción: solo espejo, y la próxima decisión queda más clara.",
    primaryAction: "Hacer una tirada",
    secondaryAction: "Aprender a leer",
    heroFactArcana: "22 arcanos de Marsella",
    heroFactSpreads: "formatos de tirada",
    dailyTitle: "Carta de hoy",
    dailyText: "Un símbolo para calibrar el día. Toma segundos y se te queda toda la tarde.",
    dailyOpenLabel: "Abrir mi carta",
    arcanaTitle: "Los 22, en orden",
    arcanaText:
      "Del Loco al Mundo, cada arcano es un paso del mismo viaje. Tocá una carta para abrir su significado.",
    arcanaAction: "Abrir la biblioteca",
    arcanaOpenLabel: "Ver significado",
    spreadsTitle: "Primero la pregunta, después el formato",
    spreadsText:
      "Empezá con una carta. Cuando la pregunta pida contexto, abrí tres, o la Cruz Celta completa.",
    spreadsAction: "Usar esta tirada",
    spreadsCardUnit: { one: "carta", other: "cartas" },
    pillarsTitle: "Lo que encontrás acá",
    pillars: [
      {
        icon: "layers",
        title: "Tiradas sin vueltas",
        text: "Elegí el formato, sacá cartas y leé cada posición como una pregunta. Claridad ahora, no después.",
      },
      {
        icon: "book",
        title: "Biblioteca de los 22",
        text: "Significados, símbolos y ejemplos del tarot de Marsella. Consultá cuando la carta gire y quieras ir a fondo.",
      },
      {
        icon: "journal",
        title: "Diario que muestra patrones",
        text: "Anotá lo que resonó. Días después ves lo que se repitió y dejás de pensarlo como coincidencia.",
      },
      {
        icon: "shield",
        title: "Espejo, no destino",
        text: "Tarot como lenguaje simbólico. Ayuda a nombrar, no decide por vos. Vos leés. Vos elegís.",
      },
    ],
    aboutTitle: "Tarot como herramienta. No como sentencia.",
    aboutText:
      "Mesa, estudio y diario en el mismo lugar. Tirás, interpretás, anotás, y volvés cuando la cabeza pida otra ronda.",
    aboutPoints: [
      "En la Tirada abrís la pregunta y ves qué responde.",
      "El Historial guarda lecturas y muestra las cartas que vuelven.",
      "El Diario transforma impresiones sueltas en patrones visibles.",
      "Aprender explica las posiciones para que leas con más confianza.",
    ],
    newsTitle: "Novedades",
    newsSubtitle: "Actualizaciones de la mesa, mejoras e ideas para usarla mejor.",
    newsSidebarTitle: "Últimas",
    newsSidebarHint: "Mirá todo en Inicio.",
  },
};

export const getHomeContent = (language: LanguageCode) =>
  homeContent[language] ?? homeContent.pt;
