import type { ArcanaArtwork } from "../types/tarot";

type ArtworkInput = {
  name: string;
  number: number;
  artwork: ArcanaArtwork;
};

const romanNumerals = [
  "0",
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
  "XIII",
  "XIV",
  "XV",
  "XVI",
  "XVII",
  "XVIII",
  "XIX",
  "XX",
  "XXI",
];

const escapeSvgText = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const motifMarkup = (motif: ArcanaArtwork["motif"]) => {
  if (motif === "triangle") {
    return `<path d="M360 236 594 752 126 752Z" fill="rgba(252,224,142,.14)" stroke="#2a211b" stroke-width="16"/>
    <path d="M360 315 500 715 220 715Z" fill="rgba(70,42,35,.16)" stroke="#f4d58b" stroke-width="7"/>
    <path d="M260 520h200M320 420l-55 210M400 420l55 210" stroke="#efe0b4" stroke-width="12" stroke-linecap="round"/>
    <circle cx="360" cy="530" r="56" fill="url(#halo)" stroke="#2a211b" stroke-width="8"/>`;
  }

  if (motif === "pillar") {
    return `<rect x="142" y="252" width="94" height="555" rx="32" fill="#d8c7a7" stroke="#2b211d" stroke-width="12"/>
    <rect x="484" y="252" width="94" height="555" rx="32" fill="#9fb0c8" stroke="#2b211d" stroke-width="12"/>
    <path d="M190 260v540M532 260v540" stroke="rgba(255,255,255,.36)" stroke-width="8"/>
    <path d="M225 500h270" stroke="#f3d88f" stroke-width="13" stroke-linecap="round"/>
    <path d="M250 802c45-82 96-124 110-124s65 42 110 124" fill="#4a352e" stroke="#2b211d" stroke-width="10"/>`;
  }

  if (motif === "wave") {
    return `<path d="M112 706c92-120 172 110 260 0s160-112 236 0v146H112Z" fill="#527987" stroke="#2a211b" stroke-width="11"/>
    <path d="M100 680c90-120 180 120 270 0s174-110 260 0" fill="none" stroke="#efe0b4" stroke-width="15" stroke-linecap="round"/>
    <path d="M132 770c72-78 145 72 220 0s144-78 216 0" fill="none" stroke="rgba(255,255,255,.42)" stroke-width="9" stroke-linecap="round"/>
    <circle cx="360" cy="470" r="112" fill="url(#halo)" stroke="#2a211b" stroke-width="10"/>`;
  }

  if (motif === "sun") {
    return `<circle cx="360" cy="530" r="145" fill="#e9c75f" stroke="#2a211b" stroke-width="13"/>
    <path d="M360 254v-82M360 887v-82M90 530h86M630 530h-86M170 342l65 65M550 342l-65 65M170 758l65-65M550 758l-65-65" stroke="#f2dda2" stroke-width="15" stroke-linecap="round"/>
    <circle cx="312" cy="500" r="16" fill="#2a211b"/><circle cx="408" cy="500" r="16" fill="#2a211b"/>
    <path d="M305 574c38 36 82 36 120 0" fill="none" stroke="#2a211b" stroke-width="10" stroke-linecap="round"/>`;
  }

  if (motif === "gate") {
    return `<path d="M162 835V394c0-142 100-238 198-238s198 96 198 238v441" fill="#9b7b55" stroke="#2a211b" stroke-width="14"/>
    <path d="M242 835V424c0-82 48-146 118-146s118 64 118 146v411" fill="#211b1b" stroke="#f0d68b" stroke-width="8"/>
    <path d="M210 392h300M198 828h324" stroke="#2a211b" stroke-width="16" stroke-linecap="round"/>
    <circle cx="360" cy="430" r="42" fill="#d7b15e" stroke="#2a211b" stroke-width="7"/>`;
  }

  return `<circle cx="360" cy="530" r="220" fill="rgba(246,220,150,.18)" stroke="#2a211b" stroke-width="14"/>
  <circle cx="360" cy="530" r="122" fill="url(#halo)" stroke="#f0d68b" stroke-width="8"/>
  <path d="M360 310c72 72 138 138 0 440-138-302-72-368 0-440Z" fill="rgba(255,255,255,.12)" stroke="#2a211b" stroke-width="8"/>`;
};

export const createArcanaArtwork = ({ name, number, artwork }: ArtworkInput) => {
  const [primary, secondary, ink] = artwork.palette;
  const safeName = escapeSvgText(name);
  const roman = romanNumerals[number] ?? artwork.symbol;
  const displayNumber = String(number).padStart(2, "0");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 1080" role="img" aria-label="${safeName}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${primary}"/>
      <stop offset=".52" stop-color="${secondary}"/>
      <stop offset="1" stop-color="${ink}"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="38%" r="68%">
      <stop offset="0" stop-color="#fff3bd"/>
      <stop offset=".58" stop-color="#c89a58"/>
      <stop offset="1" stop-color="${secondary}"/>
    </radialGradient>
    <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e9d6b2"/>
      <stop offset=".62" stop-color="#b99372"/>
      <stop offset="1" stop-color="#705143"/>
    </linearGradient>
    <filter id="paper">
      <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="${number + 7}" result="noise"/>
      <feColorMatrix in="noise" type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 .16"/>
      </feComponentTransfer>
      <feBlend in2="SourceGraphic" mode="multiply"/>
    </filter>
    <filter id="ink">
      <feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="${number + 19}"/>
      <feDisplacementMap in="SourceGraphic" scale="2.2"/>
    </filter>
    <pattern id="dots" width="84" height="84" patternUnits="userSpaceOnUse">
      <circle cx="13" cy="16" r="6" fill="#e7d4a4" opacity=".42"/>
      <circle cx="66" cy="62" r="5" fill="#9fd1ca" opacity=".34"/>
    </pattern>
  </defs>
  <rect width="720" height="1080" rx="42" fill="#151111"/>
  <rect x="18" y="18" width="684" height="1044" rx="36" fill="#1f1a18" stroke="#4c3c32" stroke-width="10"/>
  <rect x="30" y="30" width="660" height="1020" rx="31" fill="url(#dots)" opacity=".86"/>
  <g opacity=".92">
    ${Array.from({ length: 10 }, (_, index) => {
      const x = index % 2 === 0 ? 58 : 662;
      const y = 86 + index * 92;
      const colors = ["#b0c7d6", "#d9a5bd", "#8abf99", "#d9c071", "#8b79b7"];
      return `<circle cx="${x}" cy="${y}" r="22" fill="${colors[index % colors.length]}" stroke="#2b211d" stroke-width="6"/><circle cx="${x - 6}" cy="${y - 6}" r="6" fill="#fff9d5" opacity=".5"/>`;
    }).join("")}
  </g>
  <path d="M272 42c36 44 92 44 128 0" fill="#d0a04e" stroke="#2b211d" stroke-width="8"/>
  <path d="M288 1038c34-42 90-42 124 0" fill="#7b6ac0" stroke="#2b211d" stroke-width="8"/>
  <rect x="92" y="78" width="536" height="814" rx="30" fill="url(#panel)" stroke="#2b211d" stroke-width="13" filter="url(#paper)"/>
  <rect x="118" y="106" width="484" height="758" rx="22" fill="url(#bg)" opacity=".52"/>
  <rect x="130" y="120" width="460" height="734" rx="18" fill="rgba(255,238,195,.14)" stroke="rgba(255,245,210,.38)" stroke-width="5"/>
  <g filter="url(#ink)">
    <circle cx="360" cy="210" r="72" fill="#f1d58a" stroke="#2a211b" stroke-width="9"/>
    <text x="360" y="235" fill="#2a211b" font-family="Georgia, serif" font-size="74" font-weight="900" text-anchor="middle">${roman}</text>
    ${motifMarkup(artwork.motif)}
    <text x="360" y="620" fill="#fff4c7" stroke="#2a211b" stroke-width="10" paint-order="stroke" font-family="Georgia, serif" font-size="112" font-weight="900" text-anchor="middle" dominant-baseline="middle">${roman}</text>
  </g>
  <rect x="72" y="900" width="576" height="116" rx="22" fill="#241b18" stroke="#5f4a3a" stroke-width="7"/>
  <text x="104" y="966" fill="#f2d79a" font-family="Georgia, serif" font-size="39" font-weight="700">${displayNumber} - ${safeName}</text>
  <path d="M92 872h536" stroke="#e5c26a" stroke-width="5" opacity=".58"/>
  <rect x="38" y="38" width="644" height="1004" rx="30" fill="none" stroke="rgba(255,245,210,.18)" stroke-width="5"/>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
