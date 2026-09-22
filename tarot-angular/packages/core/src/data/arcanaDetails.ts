import type { LanguageCode, TarotCardId } from "../types/tarot";

type LocalizedText = Record<LanguageCode, string>;

export type ArcanaDetail = {
  symbols: Record<LanguageCode, string[]>;
  correspondences: {
    element: LocalizedText;
    planetOrSign: string;
    hebrewLetter: string;
    path: string;
  };
  readingExample: LocalizedText;
};

const localizedList = (
  pt: string[],
  en: string[],
  es: string[],
): Record<LanguageCode, string[]> => ({ pt, en, es });

const localized = (pt: string, en: string, es: string): LocalizedText => ({
  pt,
  en,
  es,
});

export const arcanaDetails: Record<TarotCardId, ArcanaDetail> = {
  "the-fool": {
    symbols: localizedList(["precipicio", "bolsa", "cão", "vento"], ["cliff", "bag", "dog", "wind"], ["precipicio", "bolsa", "perro", "viento"]),
    correspondences: { element: localized("Ar", "Air", "Aire"), planetOrSign: "Uranus / Air", hebrewLetter: "Aleph", path: "Kether - Chokmah" },
    readingExample: localized("Em uma tiragem de decisão, O Louco pede um primeiro passo leve, mas não uma aposta cega.", "In a decision spread, The Fool asks for a light first step, not a blind wager.", "En una tirada de decisión, El Loco pide un primer paso ligero, no una apuesta ciega."),
  },
  "the-magician": {
    symbols: localizedList(["mesa", "bastão", "mãos", "ferramentas"], ["table", "wand", "hands", "tools"], ["mesa", "vara", "manos", "herramientas"]),
    correspondences: { element: localized("Mercúrio", "Mercury", "Mercurio"), planetOrSign: "Mercury", hebrewLetter: "Beth", path: "Kether - Binah" },
    readingExample: localized("Quando aparece no presente, O Mago recomenda transformar intenção em ação concreta.", "In the present position, The Magician turns intention into concrete action.", "En el presente, El Mago convierte intención en acción concreta."),
  },
  "the-high-priestess": {
    symbols: localizedList(["véu", "pilares", "lua", "livro"], ["veil", "pillars", "moon", "book"], ["velo", "pilares", "luna", "libro"]),
    correspondences: { element: localized("Lua", "Moon", "Luna"), planetOrSign: "Moon", hebrewLetter: "Gimel", path: "Kether - Tiphareth" },
    readingExample: localized("Em amor, ela sugere observar silêncios antes de exigir respostas.", "In love, she suggests observing silence before demanding answers.", "En el amor, sugiere observar silencios antes de exigir respuestas."),
  },
  "the-empress": {
    symbols: localizedList(["jardim", "trono", "trigo", "gestação"], ["garden", "throne", "wheat", "gestation"], ["jardin", "trono", "trigo", "gestacion"]),
    correspondences: { element: localized("Vênus", "Venus", "Venus"), planetOrSign: "Venus", hebrewLetter: "Daleth", path: "Chokmah - Binah" },
    readingExample: localized("Como conselho, pede nutrir algo real: corpo, vínculo, casa ou projeto.", "As advice, she asks you to nourish something real: body, bond, home, or project.", "Como consejo, pide nutrir algo real: cuerpo, vínculo, casa o proyecto."),
  },
  "the-emperor": {
    symbols: localizedList(["trono", "montanha", "cetro", "limite"], ["throne", "mountain", "scepter", "boundary"], ["trono", "montaña", "cetro", "limite"]),
    correspondences: { element: localized("Fogo cardinal", "Cardinal fire", "Fuego cardinal"), planetOrSign: "Aries", hebrewLetter: "Tzaddi / Heh", path: "Chokmah - Tiphareth" },
    readingExample: localized("No trabalho, indica que a visão precisa virar regra, prazo e responsabilidade.", "At work, vision must become rules, deadlines, and responsibility.", "En el trabajo, la visión debe volverse regla, plazo y responsabilidad."),
  },
  "the-hierophant": {
    symbols: localizedList(["templo", "chaves", "benção", "tradição"], ["temple", "keys", "blessing", "tradition"], ["templo", "llaves", "bendicion", "tradicion"]),
    correspondences: { element: localized("Terra fixa", "Fixed earth", "Tierra fija"), planetOrSign: "Taurus", hebrewLetter: "Vav", path: "Chokmah - Chesed" },
    readingExample: localized("Em espiritualidade, favorece estudo, linhagem e prática com método.", "In spirituality, it favors study, lineage, and practice with method.", "En espiritualidad, favorece estudio, linaje y práctica con método."),
  },
  "the-lovers": {
    symbols: localizedList(["escolha", "duplo caminho", "anjo", "aliança"], ["choice", "two paths", "angel", "union"], ["eleccion", "dos caminos", "angel", "alianza"]),
    correspondences: { element: localized("Ar mutável", "Mutable air", "Aire mutable"), planetOrSign: "Gemini", hebrewLetter: "Zayin", path: "Binah - Tiphareth" },
    readingExample: localized("Em uma Cruz Celta, costuma revelar onde desejo e valor precisam concordar.", "In a Celtic Cross, it often shows where desire and values must agree.", "En una Cruz Celta, suele mostrar donde deseo y valor deben concordar."),
  },
  "the-chariot": {
    symbols: localizedList(["carruagem", "duas forças", "armadura", "direção"], ["chariot", "two forces", "armor", "direction"], ["carro", "dos fuerzas", "armadura", "direccion"]),
    correspondences: { element: localized("Água cardinal", "Cardinal water", "Agua cardinal"), planetOrSign: "Cancer", hebrewLetter: "Cheth", path: "Binah - Geburah" },
    readingExample: localized("Como futuro, fala de avanço se houver foco e condução emocional.", "As future, it speaks of progress if focus and emotional steering are present.", "Como futuro, habla de avance si hay foco y conducción emocional."),
  },
  strength: {
    symbols: localizedList(["leão", "mãos abertas", "respiração", "domínio gentil"], ["lion", "open hands", "breath", "gentle mastery"], ["leon", "manos abiertas", "respiracion", "dominio gentil"]),
    correspondences: { element: localized("Fogo fixo", "Fixed fire", "Fuego fijo"), planetOrSign: "Leo", hebrewLetter: "Teth", path: "Chesed - Geburah" },
    readingExample: localized("Quando surge como desafio, pede firmeza sem força bruta.", "As a challenge, it asks for firmness without brute force.", "Como desafio, pide firmeza sin fuerza bruta."),
  },
  "the-hermit": {
    symbols: localizedList(["lanterna", "montanha", "manto", "silêncio"], ["lantern", "mountain", "cloak", "silence"], ["linterna", "montaña", "manto", "silencio"]),
    correspondences: { element: localized("Terra mutável", "Mutable earth", "Tierra mutable"), planetOrSign: "Virgo", hebrewLetter: "Yod", path: "Chesed - Tiphareth" },
    readingExample: localized("No diário, pode marcar um período em que respostas amadurecem no recolhimento.", "In the journal, it can mark a period where answers ripen in retreat.", "En el diario, puede marcar un periodo donde respuestas maduran en retiro."),
  },
  "wheel-of-fortune": {
    symbols: localizedList(["roda", "ciclos", "quatro guardiões", "retorno"], ["wheel", "cycles", "four guardians", "return"], ["rueda", "ciclos", "cuatro guardianes", "retorno"]),
    correspondences: { element: localized("Júpiter", "Jupiter", "Jupiter"), planetOrSign: "Jupiter", hebrewLetter: "Kaph", path: "Chesed - Netzach" },
    readingExample: localized("Em histórico recorrente, mostra padrões que voltam pedindo nova resposta.", "When recurring in history, it shows patterns returning for a new response.", "Cuando se repite en el historial, muestra patrones que vuelven pidiendo nueva respuesta."),
  },
  justice: {
    symbols: localizedList(["balança", "espada", "contrato", "verdade"], ["scales", "sword", "contract", "truth"], ["balanza", "espada", "contrato", "verdad"]),
    correspondences: { element: localized("Ar cardinal", "Cardinal air", "Aire cardinal"), planetOrSign: "Libra", hebrewLetter: "Lamed", path: "Geburah - Tiphareth" },
    readingExample: localized("Em relações, pede acordos explícitos e consequências proporcionais.", "In relationships, it asks for explicit agreements and proportionate consequences.", "En relaciones, pide acuerdos explícitos y consecuencias proporcionadas."),
  },
  "the-hanged-man": {
    symbols: localizedList(["suspensão", "inversão", "entrega", "aura"], ["suspension", "inversion", "surrender", "halo"], ["suspension", "inversion", "entrega", "aura"]),
    correspondences: { element: localized("Água", "Water", "Agua"), planetOrSign: "Water / Neptune", hebrewLetter: "Mem", path: "Geburah - Hod" },
    readingExample: localized("Como conselho, recomenda trocar insistência por perspectiva.", "As advice, it recommends trading insistence for perspective.", "Como consejo, recomienda cambiar insistencia por perspectiva."),
  },
  death: {
    symbols: localizedList(["foice", "ossos", "portal", "renovação"], ["scythe", "bones", "gate", "renewal"], ["guadaña", "huesos", "portal", "renovacion"]),
    correspondences: { element: localized("Água fixa", "Fixed water", "Agua fija"), planetOrSign: "Scorpio", hebrewLetter: "Nun", path: "Tiphareth - Netzach" },
    readingExample: localized("No passado, pode indicar um fim que ainda reorganiza a pergunta.", "In the past, it can indicate an ending still reorganizing the question.", "En el pasado, puede indicar un final que aún reorganiza la pregunta."),
  },
  temperance: {
    symbols: localizedList(["taças", "mistura", "ponte", "alquimia"], ["cups", "blending", "bridge", "alchemy"], ["copas", "mezcla", "puente", "alquimia"]),
    correspondences: { element: localized("Fogo mutável", "Mutable fire", "Fuego mutable"), planetOrSign: "Sagittarius", hebrewLetter: "Samekh", path: "Tiphareth - Yesod" },
    readingExample: localized("Em conselho diário, transforma excesso em ajuste pequeno e repetível.", "In daily advice, it turns excess into a small repeatable adjustment.", "En consejo diario, convierte exceso en ajuste pequeño y repetible."),
  },
  "the-devil": {
    symbols: localizedList(["correntes", "chifres", "desejo", "pacto"], ["chains", "horns", "desire", "pact"], ["cadenas", "cuernos", "deseo", "pacto"]),
    correspondences: { element: localized("Terra cardinal", "Cardinal earth", "Tierra cardinal"), planetOrSign: "Capricorn", hebrewLetter: "Ayin", path: "Tiphareth - Hod" },
    readingExample: localized("Como sombra, pergunta qual prazer virou prisão por falta de consciência.", "As shadow, it asks which pleasure became a prison through lack of awareness.", "Como sombra, pregunta que placer se volvió prisión por falta de conciencia."),
  },
  "the-tower": {
    symbols: localizedList(["raio", "torre", "queda", "verdade súbita"], ["lightning", "tower", "fall", "sudden truth"], ["rayo", "torre", "caida", "verdad subita"]),
    correspondences: { element: localized("Marte", "Mars", "Marte"), planetOrSign: "Mars", hebrewLetter: "Peh", path: "Netzach - Hod" },
    readingExample: localized("Com A Estrela, pode indicar ruptura seguida de cura realista.", "With The Star, it can indicate rupture followed by realistic healing.", "Con La Estrella, puede indicar ruptura seguida de sanación realista."),
  },
  "the-star": {
    symbols: localizedList(["estrela", "água derramada", "nudez", "esperança"], ["star", "poured water", "nakedness", "hope"], ["estrella", "agua vertida", "desnudez", "esperanza"]),
    correspondences: { element: localized("Ar fixo", "Fixed air", "Aire fijo"), planetOrSign: "Aquarius", hebrewLetter: "Tzaddi / Heh", path: "Netzach - Yesod" },
    readingExample: localized("Como resultado, mostra cura possível se o próximo passo for simples e honesto.", "As outcome, it shows possible healing if the next step is simple and honest.", "Como resultado, muestra cura posible si el próximo paso es simple y honesto."),
  },
  "the-moon": {
    symbols: localizedList(["lua", "cães", "caminho", "água profunda"], ["moon", "dogs", "path", "deep water"], ["luna", "perros", "camino", "agua profunda"]),
    correspondences: { element: localized("Água mutável", "Mutable water", "Agua mutable"), planetOrSign: "Pisces", hebrewLetter: "Qoph", path: "Netzach - Malkuth" },
    readingExample: localized("Em perguntas confusas, pede checar fatos antes de chamar ansiedade de intuição.", "In confused questions, it asks you to check facts before calling anxiety intuition.", "En preguntas confusas, pide verificar hechos antes de llamar intuición a la ansiedad."),
  },
  "the-sun": {
    symbols: localizedList(["sol", "criança", "clareza", "jardim"], ["sun", "child", "clarity", "garden"], ["sol", "niño", "claridad", "jardin"]),
    correspondences: { element: localized("Sol", "Sun", "Sol"), planetOrSign: "Sun", hebrewLetter: "Resh", path: "Hod - Yesod" },
    readingExample: localized("Quando aparece no presente, favorece transparência e alegria prática.", "In the present, it favors transparency and practical joy.", "En el presente, favorece transparencia y alegria practica."),
  },
  judgement: {
    symbols: localizedList(["trombeta", "despertar", "chamado", "renascimento"], ["trumpet", "awakening", "calling", "rebirth"], ["trompeta", "despertar", "llamado", "renacimiento"]),
    correspondences: { element: localized("Fogo / Espírito", "Fire / Spirit", "Fuego / Espiritu"), planetOrSign: "Fire / Pluto", hebrewLetter: "Shin", path: "Hod - Malkuth" },
    readingExample: localized("No futuro, sinaliza revisão madura e resposta a algo que já estava claro.", "In the future, it signals mature review and response to something already clear.", "En el futuro, señala revisión madura y respuesta a algo que ya estaba claro."),
  },
  "the-world": {
    symbols: localizedList(["coroa", "dança", "quatro seres", "integração"], ["wreath", "dance", "four beings", "integration"], ["corona", "danza", "cuatro seres", "integracion"]),
    correspondences: { element: localized("Saturno / Terra", "Saturn / Earth", "Saturno / Tierra"), planetOrSign: "Saturn / Earth", hebrewLetter: "Tau", path: "Yesod - Malkuth" },
    readingExample: localized("Como resultado, indica fechamento de ciclo e integração do aprendizado.", "As outcome, it indicates cycle completion and integration of learning.", "Como resultado, indica cierre de ciclo e integración del aprendizaje."),
  },
};

export const glossaryTerms: Array<{
  term: LocalizedText;
  definition: LocalizedText;
}> = [
  {
    term: localized("Arcano", "Arcana", "Arcano"),
    definition: localized("Um símbolo maior da jornada psíquica, espiritual e prática.", "A major symbol of the psychic, spiritual, and practical journey.", "Un símbolo mayor de la jornada psíquica, espiritual y práctica."),
  },
  {
    term: localized("Tiragem", "Spread", "Tirada"),
    definition: localized("O arranjo de posições que transforma cartas em uma pergunta organizada.", "The layout of positions that turns cards into an organized question.", "El arreglo de posiciones que convierte cartas en una pregunta organizada."),
  },
  {
    term: localized("Posição", "Position", "Posición"),
    definition: localized("A função de cada carta dentro da leitura: passado, desafio, conselho ou resultado.", "The function of each card within the reading: past, challenge, advice, or outcome.", "La función de cada carta dentro de la lectura: pasado, desafío, consejo o resultado."),
  },
  {
    term: localized("Sombra", "Shadow", "Sombra"),
    definition: localized("O uso inconsciente ou defensivo da energia de uma carta.", "The unconscious or defensive use of a card's energy.", "El uso inconsciente o defensivo de la energía de una carta."),
  },
  {
    term: localized("Correspondência", "Correspondence", "Correspondencia"),
    definition: localized("Uma relação simbólica com planetas, signos, letras, elementos ou caminhos.", "A symbolic relation with planets, signs, letters, elements, or paths.", "Una relación simbólica con planetas, signos, letras, elementos o caminos."),
  },
  {
    term: localized("Intuição", "Intuition", "Intuición"),
    definition: localized("Percepção sutil que deve conversar com contexto, cuidado e responsabilidade.", "Subtle perception that should speak with context, care, and responsibility.", "Percepción sutil que debe conversar con contexto, cuidado y responsabilidad."),
  },
];
