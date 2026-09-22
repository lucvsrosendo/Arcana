import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { majorArcana } from "../data/majorArcana";
import type { ReadingRecord } from "../types/tarot";

type ExportLabels = {
  documentTitle: string;
  combinationsTitle: string;
  shareTitle: string;
  imageFilename: string;
  pdfFilename: string;
  dateLocale: string;
  reversedLabel?: string;
};

const defaultExportLabels: ExportLabels = {
  documentTitle: "Tiragem de Tarot",
  combinationsTitle: "Combinacoes",
  shareTitle: "Minha tiragem de Tarot",
  imageFilename: "tiragem-tarot.png",
  pdfFilename: "tiragem-tarot.pdf",
  dateLocale: "pt-BR",
  reversedLabel: "invertida",
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    if (!src.startsWith("data:")) {
      image.crossOrigin = "anonymous";
    }
    image.onload = () => resolve(image);
    image.onerror = () => {
      console.warn("Failed to load card image for export", src);
      resolve(null);
    };
    image.src = src;
  });

const getCardImageSrc = (cardId: string) =>
  majorArcana.find((card) => card.id === cardId)?.image ??
  `/tarot/cards/${cardId}.webp`;

const wrapText = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) => {
  const words = text.split(/\s+/);
  let line = "";
  let nextY = y;

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && line) {
      context.fillText(line, x, nextY);
      line = word;
      nextY += lineHeight;
      return;
    }

    line = testLine;
  });

  if (line) {
    context.fillText(line, x, nextY);
  }

  return nextY + lineHeight;
};

const buildReadingCanvas = async (
  record: ReadingRecord,
  labels: ExportLabels,
): Promise<HTMLCanvasElement | null> => {
  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.ready;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = Math.max(1240, 580 + record.cards.length * 138);

  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  context.fillStyle = "#0e0e10";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "rgba(250,250,252,.18)";
  context.lineWidth = 2;
  context.strokeRect(54, 54, canvas.width - 108, canvas.height - 108);

  context.fillStyle = "#fafafc";
  context.font = "700 56px 'Cormorant Garamond', Georgia, serif";
  context.fillText(record.spreadTitle, 96, 150);
  context.fillStyle = "#a1a1aa";
  context.font = "24px 'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', Arial, sans-serif";
  context.fillText(
    new Date(record.createdAt).toLocaleString(labels.dateLocale),
    96,
    196,
  );

  const imageMap = new Map<string, HTMLImageElement | null>();
  await Promise.all(
    record.cards.map(async (card) => {
      const image = await loadImage(getCardImageSrc(card.cardId));
      imageMap.set(card.cardId, image);
    }),
  );

  let y = 280;
  record.cards.forEach((card, index) => {
    context.fillStyle = "rgba(250,250,252,.04)";
    context.fillRect(96, y - 42, 1088, 106);
    const cardImage = imageMap.get(card.cardId);
    if (cardImage) {
      context.save();
      if (card.reversed) {
        context.translate(112 + 26, y - 38 + 39);
        context.rotate(Math.PI);
        context.drawImage(cardImage, -26, -39, 52, 78);
      } else {
        context.drawImage(cardImage, 112, y - 38, 52, 78);
      }
      context.restore();
    } else {
      context.strokeStyle = "rgba(250,250,252,.2)";
      context.strokeRect(112, y - 38, 52, 78);
    }
    context.fillStyle = "#a1a1aa";
    context.font = "700 25px 'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', Arial, sans-serif";
    context.fillText(`${index + 1}. ${card.position}`, 184, y - 4);
    context.fillStyle = "#fafafc";
    context.font = "700 33px 'Cormorant Garamond', Georgia, serif";
    const reverseSuffix = card.reversed
      ? ` (${labels.reversedLabel ?? defaultExportLabels.reversedLabel})`
      : "";
    context.fillText(
      `${String(card.number).padStart(2, "0")} - ${card.cardName}${reverseSuffix}`,
      500,
      y,
    );
    y += 138;
  });

  if (record.combinations.length > 0) {
    context.fillStyle = "#d4af5f";
    context.font = "700 28px 'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', Arial, sans-serif";
    context.fillText(labels.combinationsTitle, 96, y + 10);
    context.fillStyle = "#e4e4e7";
    context.font = "24px 'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', Arial, sans-serif";
    y += 58;
    record.combinations.forEach((combination) => {
      y = wrapText(context, combination, 96, y, 1010, 32);
    });
  }

  return canvas;
};

const buildReadingExportElement = (
  record: ReadingRecord,
  labels: ExportLabels,
) => {
  const root = document.createElement("div");
  root.style.cssText =
    "width:1280px;padding:48px;background:#0e0e10;color:#fafafc;font-family:'Plus Jakarta Sans',system-ui,sans-serif;";

  const title = document.createElement("h1");
  title.style.cssText =
    "margin:0 0 8px;font:700 56px 'Cormorant Garamond',Georgia,serif;color:#fafafc;";
  title.textContent = record.spreadTitle;
  root.appendChild(title);

  const date = document.createElement("p");
  date.style.cssText = "margin:0 0 32px;color:#a1a1aa;font-size:24px;";
  date.textContent = new Date(record.createdAt).toLocaleString(labels.dateLocale);
  root.appendChild(date);

  record.cards.forEach((card, index) => {
    const row = document.createElement("div");
    row.style.cssText =
      "display:flex;gap:16px;align-items:center;margin-bottom:16px;padding:12px;background:rgba(250,250,252,.04);";
    const position = document.createElement("span");
    position.style.cssText = "min-width:180px;color:#a1a1aa;font-weight:700;font-size:20px;";
    position.textContent = `${index + 1}. ${card.position}`;
    const name = document.createElement("span");
    name.style.cssText = "font:700 32px 'Cormorant Garamond',Georgia,serif;";
    const reverseSuffix = card.reversed
      ? ` (${labels.reversedLabel ?? defaultExportLabels.reversedLabel})`
      : "";
    name.textContent = `${String(card.number).padStart(2, "0")} - ${card.cardName}${reverseSuffix}`;
    row.append(position, name);
    root.appendChild(row);
  });

  if (record.combinations.length > 0) {
    const comboTitle = document.createElement("p");
    comboTitle.style.cssText = "margin:24px 0 8px;color:#d4af5f;font-weight:700;font-size:24px;";
    comboTitle.textContent = labels.combinationsTitle;
    root.appendChild(comboTitle);
    record.combinations.forEach((combination) => {
      const line = document.createElement("p");
      line.style.cssText = "margin:0 0 8px;color:#e4e4e7;font-size:20px;line-height:1.4;";
      line.textContent = combination;
      root.appendChild(line);
    });
  }

  root.style.position = "fixed";
  root.style.left = "-10000px";
  root.style.top = "0";
  document.body.appendChild(root);
  return root;
};

export const shareReadingImage = async (
  record: ReadingRecord,
  labels: ExportLabels = defaultExportLabels,
) => {
  let blob: Blob | null = null;

  if (typeof document !== "undefined") {
    const exportNode = buildReadingExportElement(record, labels);
    try {
      const dataUrl = await toPng(exportNode, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#0e0e10",
      });
      const response = await fetch(dataUrl);
      blob = await response.blob();
    } catch {
      blob = null;
    } finally {
      exportNode.remove();
    }
  }

  if (!blob) {
    const canvas = await buildReadingCanvas(record, labels);
    if (!canvas) {
      return;
    }

    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png", 0.92),
    );
  }

  if (!blob) {
    return;
  }

  const file = new File([blob], labels.imageFilename, { type: "image/png" });
  const navigatorWithShare = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };

  if (
    navigator.share &&
    (!navigatorWithShare.canShare || navigatorWithShare.canShare({ files: [file] }))
  ) {
    await navigator.share({
      title: labels.shareTitle,
      text: record.spreadTitle,
      files: [file],
    });
    return;
  }

  downloadBlob(blob, labels.imageFilename);
};

export const downloadReadingPdf = async (
  record: ReadingRecord,
  labels: ExportLabels = defaultExportLabels,
) => {
  const canvas = await buildReadingCanvas(record, labels);
  if (!canvas) {
    return;
  }

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter",
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 36;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;
  const scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
  const width = canvas.width * scale;
  const height = canvas.height * scale;

  pdf.addImage(
    imgData,
    "PNG",
    (pageWidth - width) / 2,
    margin,
    width,
    height,
    undefined,
    "FAST",
  );
  pdf.save(labels.pdfFilename);
};

export const copyReadingSummary = async (
  record: ReadingRecord,
  labels: ExportLabels = defaultExportLabels,
) => {
  const lines = [
    `${labels.documentTitle}: ${record.spreadTitle}`,
    new Date(record.createdAt).toLocaleString(labels.dateLocale),
    "",
    ...record.cards.map((card, index) => {
      const reverseSuffix = card.reversed
        ? ` (${labels.reversedLabel ?? defaultExportLabels.reversedLabel})`
        : "";
      return `${index + 1}. ${card.position}: ${String(card.number).padStart(2, "0")} - ${card.cardName}${reverseSuffix}`;
    }),
  ];

  if (record.combinations.length > 0) {
    lines.push("", `${labels.combinationsTitle}:`, ...record.combinations);
  }

  await navigator.clipboard.writeText(lines.join("\n"));
};
