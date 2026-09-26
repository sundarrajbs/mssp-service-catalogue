/** Picks black or white text for readable contrast on a hex background. */
export function readableTextColour(hex: string): "#ffffff" | "#0f172a" {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return "#ffffff";
  const value = parseInt(match[1], 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  return luminance > 0.4 ? "#0f172a" : "#ffffff";
}

/** Mixes two hex colours; `amount` is the share of `a` (0–1). Used for PDF tints. */
export function mixHex(a: string, b: string, amount: number): string {
  const parse = (hex: string) => {
    const value = parseInt(hex.replace("#", ""), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  };
  const [ca, cb] = [parse(a), parse(b)];
  const mixed = ca.map((channel, i) => Math.round(channel * amount + cb[i] * (1 - amount)));
  return `#${mixed.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
