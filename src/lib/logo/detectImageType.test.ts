import { describe, expect, it } from "vitest";

import { detectImageType } from "./detectImageType";

const bytes = (...values: number[]) => new Uint8Array(values);
const text = (value: string) => new TextEncoder().encode(value);

describe("detectImageType", () => {
  it("recognises PNG and JPEG signatures", () => {
    expect(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0))).toBe("png");
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0))).toBe("jpeg");
  });

  it("recognises SVG, with or without an XML declaration, comments or doctype", () => {
    expect(detectImageType(text('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBe("svg");
    expect(detectImageType(text('﻿<?xml version="1.0"?>\n<!-- logo -->\n<svg>'))).toBe("svg");
    expect(detectImageType(text('<?xml version="1.0"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "x"><svg>'))).toBe("svg");
  });

  it("rejects other files, even when renamed", () => {
    expect(detectImageType(text("<html><script>alert(1)</script></html>"))).toBeNull();
    expect(detectImageType(text("%PDF-1.7"))).toBeNull();
    expect(detectImageType(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61))).toBeNull(); // GIF
    expect(detectImageType(bytes())).toBeNull();
  });

  it("does not treat an <svg> tag later in another document as an SVG file", () => {
    expect(detectImageType(text("<html><body><svg></svg></body></html>"))).toBeNull();
  });
});
