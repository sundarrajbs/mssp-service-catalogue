import { Document, Image, Page, Text, View } from "@react-pdf/renderer";

import { priceTier } from "@/lib/domain/pricing";
import { formatHours, formatMinutes } from "@/lib/domain/sla";
import { formatMoney, formatNumber } from "@/lib/format/currency";
import { CADENCE_LABELS, ComparisonTable, servicesInCatalogue, type PdfProps } from "./CataloguePdf";
import { brandColours, CheckMark, MUTED, styles, t } from "./theme";

const COVERAGE_SHORT = { "8x5": "8×5", "12x6": "12×6", "24x7": "24×7" };

/** A single landscape page for sales conversations. */
export function OnePagerPdf({ catalogue, includePricing, generatedAt }: PdfProps) {
  const colours = brandColours(catalogue.brandColour);
  const mspName = t(catalogue.mspName) || "Your MSSP";
  const { tiers, services, sizing, currency } = catalogue;

  const headerRows = [
    ...(includePricing
      ? [
          {
            label: "Monthly price",
            values: tiers.map((tier) => formatMoney(priceTier(tier, services, sizing).monthlyPrice, currency)),
          },
        ]
      : []),
    { label: "Coverage hours", values: tiers.map((tier) => COVERAGE_SHORT[tier.sla.coverage]) },
    {
      label: "P1 response / resolution",
      values: tiers.map(
        (tier) =>
          `${formatMinutes(tier.sla.severities.P1.responseMinutes)} / ${formatHours(tier.sla.severities.P1.resolutionHours)}`,
      ),
    },
    { label: "Reporting", values: tiers.map((tier) => CADENCE_LABELS[tier.sla.reportingCadence]) },
  ];

  return (
    <Document title={`${mspName} – Service tiers`} author={mspName} creator="MSSP Catalogue Builder">
      <Page size="A4" orientation="landscape" style={[styles.page, { paddingTop: 28, paddingBottom: 28, paddingHorizontal: 32 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt attribute */}
            {catalogue.logo && <Image src={catalogue.logo} style={{ maxWidth: 90, maxHeight: 36, objectFit: "contain" }} />}
            <View>
              <Text style={{ fontSize: 16, fontWeight: 700 }}>{mspName}</Text>
              <Text style={{ fontSize: 9.5, color: MUTED }}>Managed security service tiers</Text>
            </View>
          </View>
          <View style={{ width: 40, height: 4, backgroundColor: colours.brand, borderRadius: 2 }} />
        </View>

        <ComparisonTable
          catalogue={catalogue}
          services={servicesInCatalogue(catalogue)}
          colours={colours}
          compact
          headerRows={headerRows}
        />

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <CheckMark colour={colours.brand} size={9} />
            <Text style={styles.small}>
              Included · Add-on: available at extra cost · —: not offered
              {includePricing
                ? ` · Indicative monthly prices for ${formatNumber(sizing.endpoints, currency)} endpoints, excluding taxes`
                : ""}
            </Text>
          </View>
          <Text style={styles.small}>
            {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(generatedAt)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
