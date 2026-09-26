export type LogoImageType = "png" | "jpeg" | "svg";

/**
 * Identifies an image from its first bytes rather than trusting the file's
 * extension or browser-reported MIME type, which are easy to fake.
 */
export function detectImageType(bytes: Uint8Array): LogoImageType | null {
  const startsWith = (...signature: number[]) => signature.every((byte, i) => bytes[i] === byte);

  if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "png";
  if (startsWith(0xff, 0xd8, 0xff)) return "jpeg";

  // SVG is text: allow an optional BOM, whitespace, XML declaration, comments or doctype before <svg.
  const head = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(0, 1024)).replace(/^﻿/, "");
  if (/^\s*(<\?xml[\s\S]*?\?>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(head)) {
    return "svg";
  }
  return null;
}
