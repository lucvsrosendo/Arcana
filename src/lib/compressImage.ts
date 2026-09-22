import Compressor from "compressorjs";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const MAX_NEWS_COVER_BYTES = 2.5 * 1024 * 1024;
const COVER_SAFE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const compressAvatarFile = (file: File) =>
  new Promise<File>((resolve, reject) => {
    if (file.size <= MAX_AVATAR_BYTES) {
      resolve(file);
      return;
    }

    new Compressor(file, {
      quality: 0.82,
      maxWidth: 512,
      maxHeight: 512,
      convertSize: MAX_AVATAR_BYTES,
      success(result) {
        const compressed =
          result instanceof File
            ? result
            : new File([result], file.name, { type: result.type || file.type });

        resolve(compressed);
      },
      error(error) {
        reject(error);
      },
    });
  });

export const compressNewsCoverFile = (file: File) =>
  new Promise<File>((resolve, reject) => {
    // Cropped covers are already sized; skip recompress when already safe.
    if (COVER_SAFE_TYPES.has(file.type) && file.size <= MAX_NEWS_COVER_BYTES) {
      resolve(file);
      return;
    }

    new Compressor(file, {
      quality: 0.82,
      maxWidth: 1600,
      maxHeight: 900,
      mimeType: "image/jpeg",
      convertSize: MAX_NEWS_COVER_BYTES,
      success(result) {
        const compressed =
          result instanceof File
            ? result
            : new File([result], file.name.replace(/\.\w+$/, ".jpg"), {
                type: result.type || "image/jpeg",
              });

        resolve(compressed);
      },
      error(error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "cover-compress-failed";
        reject(new Error(message));
      },
    });
  });
