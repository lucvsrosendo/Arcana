export type CropAreaPixels = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const createImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("crop-image-load-failed")));
    // crossOrigin on blob:/data: URLs can break load or taint the canvas.
    if (/^https?:/i.test(src)) {
      image.crossOrigin = "anonymous";
    }
    image.src = src;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, mimeType: string, quality: number) =>
  new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), mimeType, quality);
  });

export const cropImageToFile = async (
  imageSrc: string,
  crop: CropAreaPixels,
  mimeType: string = "image/webp",
  fileName = `cover-crop-${Date.now()}.webp`,
): Promise<File> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const width = Math.max(1, Math.round(crop.width));
  const height = Math.max(1, Math.round(crop.height));

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("canvas-unavailable");
  }

  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    width,
    height,
  );

  let outputMime = mimeType;
  let outputName = fileName;
  let blob = await canvasToBlob(canvas, outputMime, 0.92);

  if (!blob && outputMime === "image/webp") {
    outputMime = "image/jpeg";
    outputName = fileName.replace(/\.webp$/i, ".jpg");
    blob = await canvasToBlob(canvas, outputMime, 0.92);
  }

  if (!blob) {
    throw new Error("crop-failed");
  }

  return new File([blob], outputName, { type: outputMime });
};
