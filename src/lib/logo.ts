import { MAX_LOGO_DATA_URL_LENGTH } from "@/lib/domain/schema";

export const ACCEPTED_LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml"] as const;
export const MAX_LOGO_BYTES = 500 * 1024;
const MAX_LOGO_PIXELS = 512;

export class LogoError extends Error {}

/**
 * Validates an uploaded logo and redraws it onto a canvas as a PNG.
 * Redrawing sanitises every format: an SVG loaded as an <img> can't run scripts
 * or load external resources, and only its pixels survive. It also strips
 * metadata and caps the size.
 */
export async function processLogoFile(file: File): Promise<string> {
  if (!(ACCEPTED_LOGO_TYPES as readonly string[]).includes(file.type)) {
    throw new LogoError("Choose a PNG, JPG or SVG image.");
  }
  if (file.size > MAX_LOGO_BYTES) {
    throw new LogoError("The logo must be 500 KB or smaller.");
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    // SVGs without explicit dimensions report 0 × 0; give them a sensible size.
    const width = image.naturalWidth || MAX_LOGO_PIXELS;
    const height = image.naturalHeight || MAX_LOGO_PIXELS;
    const scale = Math.min(1, MAX_LOGO_PIXELS / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new LogoError("Your browser couldn't process this image.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    let dataUrl = canvas.toDataURL("image/png");
    if (dataUrl.length > MAX_LOGO_DATA_URL_LENGTH) {
      // Very detailed images: fall back to JPEG on white.
      context.globalCompositeOperation = "destination-over";
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    }
    if (dataUrl.length > MAX_LOGO_DATA_URL_LENGTH) throw new LogoError("This image is too detailed to use as a logo.");
    return dataUrl;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new LogoError("This file couldn't be read as an image."));
    image.src = src;
  });
}
