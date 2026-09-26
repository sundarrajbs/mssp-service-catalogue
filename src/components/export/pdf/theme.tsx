import { Font, Path, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";

import { mixHex, readableTextColour } from "@/lib/color/contrast";
import { cleanText } from "@/lib/sanitize";
import type { Inclusion } from "@/lib/domain/types";

let fontsRegistered = false;

/**
 * Inter is split into two subsets; listing both as the font family lets
 * react-pdf fall back to the extended subset for characters like ₹.
 */
export function registerPdfFonts(baseUrl: string) {
  if (fontsRegistered) return;
  const src = (file: string) => `${baseUrl}/fonts/${file}`;
  Font.register({
    family: "Inter",
    fonts: [
      { src: src("inter-latin-400-normal.woff"), fontWeight: 400 },
      { src: src("inter-latin-700-normal.woff"), fontWeight: 700 },
    ],
  });
  Font.register({
    family: "InterExt",
    fonts: [
      { src: src("inter-latin-ext-400-normal.woff"), fontWeight: 400 },
      { src: src("inter-latin-ext-700-normal.woff"), fontWeight: 700 },
    ],
  });
  // Don't hyphenate words mid-line.
  Font.registerHyphenationCallback((word) => [word]);
  fontsRegistered = true;
}

export const FONT_FAMILY = ["Inter", "InterExt"] as unknown as string;

export const INK = "#0f172a";
export const MUTED = "#64748b";
export const RULE = "#e2e8f0";
export const PANEL = "#f8fafc";

export interface BrandColours {
  brand: string;
  onBrand: string;
  tint: string;
}

export function brandColours(brand: string): BrandColours {
  return { brand, onBrand: readableTextColour(brand), tint: mixHex(brand, "#ffffff", 0.1) };
}

/** Every user-entered string goes through this before it reaches a PDF. */
export const t = (value: string) => cleanText(value);

export const styles = StyleSheet.create({
  page: { fontFamily: FONT_FAMILY, fontSize: 10, color: INK, paddingTop: 48, paddingBottom: 64, paddingHorizontal: 48 },
  eyebrow: { fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: MUTED },
  h1: { fontSize: 24, fontWeight: 700, marginBottom: 6 },
  h2: { fontSize: 13, fontWeight: 700, marginBottom: 6, marginTop: 18 },
  lead: { fontSize: 11, color: MUTED, lineHeight: 1.5, marginBottom: 18 },
  body: { fontSize: 10.5, lineHeight: 1.55 },
  small: { fontSize: 8.5, color: MUTED },
  bulletRow: { flexDirection: "row", marginBottom: 4 },
  bulletDot: { width: 12, fontSize: 10.5 },
  table: { borderWidth: 1, borderColor: RULE, borderRadius: 4 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: RULE },
  headCell: { padding: 7, fontSize: 9.5, fontWeight: 700 },
  cell: { padding: 7, fontSize: 9.5 },
  groupRow: { flexDirection: "row", backgroundColor: PANEL, borderBottomWidth: 1, borderBottomColor: RULE },
  groupCell: { padding: 5, paddingLeft: 7, fontSize: 8, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 0.6 },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: MUTED,
    borderTopWidth: 1,
    borderTopColor: RULE,
    paddingTop: 8,
  },
});

export function Footer({ mspName, title }: { mspName: string; title: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>
        {t(mspName)} · {title}
      </Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

export function CheckMark({ colour, size = 11 }: { colour: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 12.5l5 5L20 6.5" stroke={colour} strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** ✓ / Add-on / — as used in the app's comparison matrix. */
export function InclusionMark({ inclusion, colours }: { inclusion: Inclusion | undefined; colours: BrandColours }) {
  if (inclusion === "included") return <CheckMark colour={colours.brand} />;
  if (inclusion === "addOn") {
    return (
      <Text style={{ fontSize: 8, fontWeight: 700, color: INK, backgroundColor: colours.tint, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 }}>
        Add-on
      </Text>
    );
  }
  return <Text style={{ color: "#94a3b8" }}>—</Text>;
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletRow} wrap={false}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={[styles.body, { flex: 1 }]}>{t(item)}</Text>
        </View>
      ))}
    </View>
  );
}
