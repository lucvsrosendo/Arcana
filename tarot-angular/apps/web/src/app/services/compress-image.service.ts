import { Injectable } from "@angular/core";
import Compressor from "compressorjs";

@Injectable({ providedIn: "root" })
export class CompressImageService {
  compress(file: File, maxWidth = 512): Promise<Blob> {
    return new Promise((resolve, reject) => {
      new Compressor(file, {
        maxWidth,
        maxHeight: maxWidth,
        quality: 0.82,
        mimeType: "image/jpeg",
        success: (result) => resolve(result as Blob),
        error: (error) => reject(error),
      });
    });
  }
}
