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
  intro: string;
  primaryAction: string;
  secondaryAction: string;
  dailyTitle: string;
  dailyText: string;
  dailyOpenLabel: string;
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
    intro:
      "Tiragem rápida, 22 arcanos Marseille e um diário pra notar padrões. Sem previsão. Só espelho — e a próxima decisão fica mais clara.",
    primaryAction: "Fazer uma tiragem",
    secondaryAction: "Aprender a ler",
    dailyTitle: "Carta de hoje",
    dailyText: "Um símbolo pra calibrar o dia. Leva segundos. Fica na cabeça o resto da tarde.",
    dailyOpenLabel: "Abrir minha carta",
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
        text: "Significados, símbolos e exemplos em Marseille. Consulte quando a carta virar e você quiser ir fundo.",
      },
      {
        icon: "journal",
        title: "Diário que mostra padrão",
        text: "Anote o que bateu. Dias depois você vê o que se repetiu — e para de achar que é só coincidência.",
      },
      {
        icon: "shield",
        title: "Espelho, não destino",
        text: "Tarot como linguagem simbólica. Ajuda a nomear. Não decide por você. Você lê. Você escolhe.",
      },
    ],
    aboutTitle: "Tarot como ferramenta. Não como sentença.",
    aboutText:
      "Mesa, estudo e diário no mesmo lugar. Você tira, interpreta, anota — e volta quando a cabeça pedir outra rodada.",
    aboutPoints: [
      "Tiragem é o espaço pra abrir a pergunta e ver o que responde.",
      "Histórico guarda leituras e mostra cartas que voltam.",
      "Diário transforma impressão solta em padrão visível.",
      "Aprender explica posições pra você ler com mais confiança.",
    ],
    newsTitle: "Novidades",
    newsSubtitle: "Atualizações da mesa, melhorias e ideias pra usar melhor.",
    newsSidebarTitle: "Últimas",
    newsSidebarHint: "Veja tudo na Home.",
  },
  en: {
    brandName: "Major Arcana",
    title: "Name what you already feel.",
    intro:
      "Quick spreads, 22 Marseille arcana, and a journal to spot patterns. Not prediction — a mirror so the next call gets clearer.",
    primaryAction: "Do a reading",
    secondaryAction: "Learn to read",
    dailyTitle: "Today's card",
    dailyText: "One symbol to set the tone. Takes seconds. Stays with you all afternoon.",
    dailyOpenLabel: "Open my card",
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
        text: "Note what hit. Days later you see what repeated — and stop calling it coincidence.",
      },
      {
        icon: "shield",
        title: "Mirror, not fate",
        text: "Tarot as symbolic language. It helps you name things. It doesn't decide for you.",
      },
    ],
    aboutTitle: "Tarot as a tool. Not a sentence.",
    aboutText:
      "Table, study, and journal in one place. Draw, interpret, note — come back when your head wants another round.",
    aboutPoints: [
      "Reading is where you open the question and see what answers.",
      "History keeps readings and shows cards that return.",
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
    title: "Ordena lo que ya sentis.",
    intro:
      "Tirada rapida, 22 arcanos Marseille y un diário para notar patrones. Sin prediccion. Solo espejo — y la proxima decision queda mas clara.",
    primaryAction: "Hacer una tirada",
    secondaryAction: "Aprender a leer",
    dailyTitle: "Carta de hoy",
    dailyText: "Un simbolo para calibrar el dia. Toma segundos. Se te queda en la cabeza toda la tarde.",
    dailyOpenLabel: "Abrir mi carta",
    pillarsTitle: "Lo que encontras aca",
    pillars: [
      {
        icon: "layers",
        title: "Tiradas sin vueltas",
        text: "Elegi el formato, saca cartas y lee cada posicion como una pregunta. Claridad ahora, no despues.",
      },
      {
        icon: "book",
        title: "Biblioteca de los 22",
        text: "Significados, simbolos y ejemplos Marseille. Consulta cuando la carta gire y quieras ir a fondo.",
      },
      {
        icon: "journal",
        title: "Diário que muestra patron",
        text: "Anota lo que pego. Dias despues ves lo que se repitio — y dejas de pensarlo coincidencia.",
      },
      {
        icon: "shield",
        title: "Espejo, no destino",
        text: "Tarot como lenguaje simbolico. Ayuda a nombrar. No decide por vos. Vos lees. Vos elegis.",
      },
    ],
    aboutTitle: "Tarot como herramienta. No como sentencia.",
    aboutText:
      "Mesa, estudio y diário en el mismo lugar. Tiras, interpretas, anotas — y volves cuando la cabeza pida otra ronda.",
    aboutPoints: [
      "Tirada es el espacio para abrir la pregunta y ver que responde.",
      "El Historial guarda lecturas y muestra cartas que vuelven.",
      "El Diário transforma impresion suelta en patron visible.",
      "Aprender explica posiciones para que leas con mas confianza.",
    ],
    newsTitle: "Novedades",
    newsSubtitle: "Actualizaciones de la mesa, mejoras e ideas para usarla mejor.",
    newsSidebarTitle: "Ultimas",
    newsSidebarHint: "Mira todo en Inicio.",
  },
};

export const getHomeContent = (language: LanguageCode) =>
  homeContent[language] ?? homeContent.pt;
