import { Injectable } from "@angular/core";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { majorArcana, type ReadingRecord } from "@tarot/core";

type ExportLabels = {
  documentTitle: string;
  combinationsTitle: string;
  shareTitle: string;
  imageFilename: string;
  pdfFilename: string;
  dateLocale: string;
};

const defaultLabels: ExportLabels = {
  documentTitle: "Tiragem de Tarot",
  combinationsTitle: "Combinacoes",
  shareTitle: "Minha tiragem de Tarot",
  imageFilename: "tiragem-tarot.png",
  pdfFilename: "tiragem-tarot.pdf",
  dateLocale: "pt-BR",
};

@Injectable({ providedIn: "root" })
export class ExportReadingService {
  async shareReadingImage(element: HTMLElement, record: ReadingRecord, labels = defaultLabels) {
    const blob = await this.renderElementToBlob(element);
    const file = new File([blob], labels.imageFilename, { type: "image/png" });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: labels.shareTitle,
        files: [file],
      });
      return;
    }

    this.downloadBlob(blob, labels.imageFilename);
  }

  async downloadReadingPdf(record: ReadingRecord, labels = defaultLabels) {
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const margin = 48;
    let y = margin;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text(labels.documentTitle, margin, y);
    y += 28;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text(
      new Date(record.createdAt).toLocaleString(labels.dateLocale),
      margin,
      y,
    );
    y += 18;

    if (record.question) {
      y = this.wrapPdfText(pdf, `Pergunta: ${record.question}`, margin, y, 500, 14);
      y += 8;
    }

    pdf.setFont("helvetica", "bold");
    pdf.text(record.spreadTitle, margin, y);
    y += 18;
    pdf.setFont("helvetica", "normal");

    for (const card of record.cards) {
      const line = `${card.position}: ${card.cardName}${card.reversed ? " (invertida)" : ""}`;
      y = this.wrapPdfText(pdf, line, margin, y, 500, 14);
    }

    if (record.combinations.length > 0) {
      y += 10;
      pdf.setFont("helvetica", "bold");
      pdf.text(labels.combinationsTitle, margin, y);
      y += 16;
      pdf.setFont("helvetica", "normal");

      for (const combo of record.combinations) {
        y = this.wrapPdfText(pdf, combo, margin, y, 500, 14);
      }
    }

    pdf.save(labels.pdfFilename);
  }

  async copyReadingSummary(record: ReadingRecord) {
    const lines = [
      record.spreadTitle,
      record.question ? `Pergunta: ${record.question}` : null,
      ...record.cards.map(
        (card) => `${card.position}: ${card.cardName}${card.reversed ? " (invertida)" : ""}`,
      ),
      record.combinations.length ? `Combinacoes: ${record.combinations.join(" | ")}` : null,
    ].filter(Boolean);

    await navigator.clipboard.writeText(lines.join("\n"));
  }

  getCardImageSrc(cardId: string) {
    return (
      majorArcana.find((card) => card.id === cardId)?.image ?? `/tarot/cards/${cardId}.png`
    );
  }

  private async renderElementToBlob(element: HTMLElement) {
    const dataUrl = await toPng(element, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#0e0e10",
    });

    const response = await fetch(dataUrl);
    return response.blob();
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private wrapPdfText(
    pdf: jsPDF,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
  ) {
    const lines = pdf.splitTextToSize(text, maxWidth) as string[];
    pdf.text(lines, x, y);
    return y + lines.length * lineHeight;
  }
}
