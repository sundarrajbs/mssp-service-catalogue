import { Document, Image, Page, Text, View } from "@react-pdf/renderer";

import { priceTier } from "@/lib/domain/pricing";
import { SEVERITIES } from "@/lib/domain/schema";
import { formatHours, formatMinutes } from "@/lib/domain/sla";
import { INCLUSION_LABELS, PRICING_UNIT_LABELS, tierLabel, type Catalogue, type Service } from "@/lib/domain/types";
import { formatMoney, formatNumber } from "@/lib/format/currency";
import { NIST_COLOURS } from "@/lib/domain/nist";
import {
  brandColours,
  Bullets,
  Footer,
  INK,
  InclusionMark,
  MUTED,
  PANEL,
  RULE,
  styles,
  t,
  type BrandColours,
} from "./theme";

const TITLE = "Managed Security Services Catalogue";

export const COVERAGE_LABELS = { "8x5": "8×5 business hours", "12x6": "12×6 extended hours", "24x7": "24×7 always on" };
export const CADENCE_LABELS = { weekly: "Weekly", monthly: "Monthly", quarterly: "Quarterly" };

export interface PdfProps {
  catalogue: Catalogue;
  includePricing: boolean;
  generatedAt: Date;
}

/** Services that appear in at least one tier, in library order (all services if no tier uses any). */
export function servicesInCatalogue(catalogue: Catalogue): Service[] {
  const used = new Set(catalogue.tiers.flatMap((tier) => tier.services.map((ts) => ts.serviceId)));
  const inTiers = catalogue.services.filter((s) => used.has(s.id));
  return inTiers.length > 0 ? inTiers : catalogue.services;
}

export function CataloguePdf({ catalogue, includePricing, generatedAt }: PdfProps) {
  const colours = brandColours(catalogue.brandColour);
  const services = servicesInCatalogue(catalogue);
  const mspName = t(catalogue.mspName) || "Your MSSP";

  return (
    <Document title={`${mspName} – ${TITLE}`} author={mspName} creator="MSSP Catalogue Builder">
      <CoverPage catalogue={catalogue} colours={colours} generatedAt={generatedAt} serviceCount={services.length} />

      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Service tiers</Text>
        <Text style={styles.h1}>Tiers at a glance</Text>
        <Text style={styles.lead}>
          Each tier bundles a set of included services. Add-ons can be added to a tier for an additional fee.
        </Text>
        <ComparisonTable catalogue={catalogue} services={services} colours={colours} />
        <Footer mspName={mspName} title={TITLE} />
      </Page>

      {services.map((service) => (
        <ServicePage key={service.id} service={service} catalogue={catalogue} colours={colours} mspName={mspName} />
      ))}

      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Service levels</Text>
        <Text style={styles.h1}>Service level agreements</Text>
        <Text style={styles.lead}>
          Response is the time to acknowledge and begin work on an incident. Resolution is the target time to contain or
          resolve it. Targets apply within each tier&apos;s coverage hours.
        </Text>
        <SlaTable catalogue={catalogue} colours={colours} />
        <Footer mspName={mspName} title={TITLE} />
      </Page>

      {includePricing && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.eyebrow}>Commercials</Text>
          <Text style={styles.h1}>Indicative pricing</Text>
          <PricingSection catalogue={catalogue} colours={colours} />
          <Footer mspName={mspName} title={TITLE} />
        </Page>
      )}
    </Document>
  );
}

function CoverPage({
  catalogue,
  colours,
  generatedAt,
  serviceCount,
}: {
  catalogue: Catalogue;
  colours: BrandColours;
  generatedAt: Date;
  serviceCount: number;
}) {
  const mspName = t(catalogue.mspName) || "Your MSSP";
  const date = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(generatedAt);
  return (
    <Page size="A4" style={[styles.page, { padding: 0 }]}>
      <View style={{ backgroundColor: colours.brand, height: 420, padding: 56, justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {catalogue.logo ? (
            <View style={{ backgroundColor: "#ffffff", borderRadius: 8, padding: 10 }}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt attribute */}
              <Image src={catalogue.logo} style={{ maxWidth: 140, maxHeight: 64, objectFit: "contain" }} />
            </View>
          ) : (
            <Text style={{ fontSize: 14, fontWeight: 700, color: colours.onBrand }}>{mspName}</Text>
          )}
        </View>
        <View>
          <Text style={{ fontSize: 12, fontWeight: 700, color: colours.onBrand, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>
            {mspName}
          </Text>
          <Text style={{ fontSize: 36, fontWeight: 700, color: colours.onBrand, lineHeight: 1.15 }}>{TITLE}</Text>
        </View>
      </View>
      <View style={{ padding: 56, flexGrow: 1, justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", gap: 40 }}>
          <CoverStat label="Service tiers" value={String(catalogue.tiers.length)} />
          <CoverStat label="Services" value={String(serviceCount)} />
          <CoverStat label="Framework" value="NIST CSF 2.0" />
        </View>
        <Text style={{ fontSize: 10, color: MUTED }}>{date}</Text>
      </View>
    </Page>
  );
}

function CoverStat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={{ fontSize: 22, fontWeight: 700 }}>{value}</Text>
      <Text style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

export function ComparisonTable({
  catalogue,
  services,
  colours,
  compact = false,
  headerRows,
}: {
  catalogue: Catalogue;
  services: Service[];
  colours: BrandColours;
  compact?: boolean;
  /** Extra rows (price, SLA summary) shown above the services on the one-pager. */
  headerRows?: { label: string; values: string[] }[];
}) {
  const categories = [...new Set(services.map((s) => s.category))];
  const pad = compact ? 3.5 : 7;
  const fontSize = compact ? 8.5 : 9.5;
  const firstCol = { flex: compact ? 2.4 : 2.2 };

  return (
    <View style={styles.table}>
      <View style={[styles.row, { backgroundColor: colours.brand }]} fixed>
        <Text style={[styles.headCell, firstCol, { color: colours.onBrand, padding: pad + 1 }]}>Service</Text>
        {catalogue.tiers.map((tier) => (
          <Text key={tier.id} style={[styles.headCell, { flex: 1, textAlign: "center", color: colours.onBrand, padding: pad + 1 }]}>
            {t(tierLabel(tier))}
          </Text>
        ))}
      </View>
      {headerRows?.map((row) => (
        <View key={row.label} style={[styles.row, { backgroundColor: PANEL }]} wrap={false}>
          <Text style={[styles.cell, firstCol, { fontWeight: 700, padding: pad, fontSize }]}>{row.label}</Text>
          {row.values.map((value, i) => (
            <Text key={i} style={[styles.cell, { flex: 1, textAlign: "center", padding: pad, fontSize, fontWeight: 700 }]}>
              {value}
            </Text>
          ))}
        </View>
      ))}
      {categories.map((category) => (
        <View key={category}>
          {/* The one-pager skips category headings so it fits on a single page. */}
          {!compact && (
            <View style={styles.groupRow} wrap={false}>
              <Text style={[styles.groupCell, { paddingLeft: pad }]}>{t(category)}</Text>
            </View>
          )}
          {services
            .filter((s) => s.category === category)
            .map((service) => (
              <View key={service.id} style={styles.row} wrap={false}>
                <Text style={[styles.cell, firstCol, { padding: pad, fontSize }]}>{t(service.name)}</Text>
                {catalogue.tiers.map((tier) => (
                  <View key={tier.id} style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: pad }}>
                    <InclusionMark
                      inclusion={tier.services.find((ts) => ts.serviceId === service.id)?.inclusion}
                      colours={colours}
                    />
                  </View>
                ))}
              </View>
            ))}
        </View>
      ))}
    </View>
  );
}

function ServicePage({
  service,
  catalogue,
  colours,
  mspName,
}: {
  service: Service;
  catalogue: Catalogue;
  colours: BrandColours;
  mspName: string;
}) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={{ borderLeftWidth: 4, borderLeftColor: colours.brand, paddingLeft: 14, marginBottom: 18 }}>
        <Text style={styles.eyebrow}>
          {t(service.category)}
          {service.isAddOn ? "  ·  Add-on service" : ""}
        </Text>
        <Text style={[styles.h1, { marginTop: 4, marginBottom: 0 }]}>{t(service.name)}</Text>
      </View>

      {service.description.trim() !== "" && <Text style={[styles.body, { fontSize: 11.5, marginBottom: 8 }]}>{t(service.description)}</Text>}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8, marginBottom: 6 }}>
        {service.nistFunctions.map((fn) => (
          <View key={fn} style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: RULE, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: NIST_COLOURS[fn], marginRight: 5 }} />
            <Text style={{ fontSize: 8.5, color: INK }}>NIST CSF: {fn}</Text>
          </View>
        ))}
      </View>

      {service.deliverables.length > 0 && (
        <>
          <Text style={styles.h2}>What you get</Text>
          <Bullets items={service.deliverables} />
        </>
      )}
      {service.prerequisites.length > 0 && (
        <>
          <Text style={styles.h2}>What we need from you</Text>
          <Bullets items={service.prerequisites} />
        </>
      )}

      {catalogue.tiers.length > 0 && (
        <View wrap={false}>
          <Text style={styles.h2}>Availability by tier</Text>
          <View style={[styles.table, { flexDirection: "row" }]}>
            {catalogue.tiers.map((tier, i) => {
              const inclusion = tier.services.find((ts) => ts.serviceId === service.id)?.inclusion;
              return (
                <View
                  key={tier.id}
                  style={{ flex: 1, padding: 10, alignItems: "center", borderLeftWidth: i === 0 ? 0 : 1, borderLeftColor: RULE }}
                >
                  <Text style={{ fontSize: 9.5, fontWeight: 700, marginBottom: 6 }}>{t(tierLabel(tier))}</Text>
                  <InclusionMark inclusion={inclusion} colours={colours} />
                  <Text style={[styles.small, { marginTop: 4 }]}>{inclusion ? INCLUSION_LABELS[inclusion] : "Not offered"}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
      <Footer mspName={mspName} title={TITLE} />
    </Page>
  );
}

export function slaRows(catalogue: Catalogue): { label: string; values: string[]; group?: string }[] {
  const tiers = catalogue.tiers;
  return [
    { label: "Coverage hours", values: tiers.map((tier) => COVERAGE_LABELS[tier.sla.coverage]) },
    { label: "Reporting", values: tiers.map((tier) => CADENCE_LABELS[tier.sla.reportingCadence]) },
    ...SEVERITIES.map((sev) => ({
      group: "Response",
      label: `${sev} response`,
      values: tiers.map((tier) => formatMinutes(tier.sla.severities[sev].responseMinutes)),
    })),
    ...SEVERITIES.map((sev) => ({
      group: "Resolution",
      label: `${sev} resolution`,
      values: tiers.map((tier) => formatHours(tier.sla.severities[sev].resolutionHours)),
    })),
  ];
}

function SlaTable({ catalogue, colours }: { catalogue: Catalogue; colours: BrandColours }) {
  return (
    <View style={styles.table}>
      <View style={[styles.row, { backgroundColor: colours.brand }]}>
        <Text style={[styles.headCell, { flex: 1.4, color: colours.onBrand }]}>Measure</Text>
        {catalogue.tiers.map((tier) => (
          <Text key={tier.id} style={[styles.headCell, { flex: 1, textAlign: "center", color: colours.onBrand }]}>
            {t(tierLabel(tier))}
          </Text>
        ))}
      </View>
      {slaRows(catalogue).map((row, i) => (
        <View key={row.label} style={[styles.row, i % 2 === 1 ? { backgroundColor: PANEL } : {}]} wrap={false}>
          <Text style={[styles.cell, { flex: 1.4, fontWeight: 700 }]}>{row.label}</Text>
          {row.values.map((value, j) => (
            <Text key={j} style={[styles.cell, { flex: 1, textAlign: "center" }]}>
              {value}
            </Text>
          ))}
        </View>
      ))}
      <View style={{ padding: 8 }}>
        <Text style={styles.small}>P1 Critical · P2 High · P3 Medium · P4 Low</Text>
      </View>
    </View>
  );
}

function PricingSection({ catalogue, colours }: { catalogue: Catalogue; colours: BrandColours }) {
  const { sizing, currency, tiers, services } = catalogue;
  const priced = tiers.map((tier) => ({ tier, pricing: priceTier(tier, services, sizing) }));
  const money = (n: number) => formatMoney(n, currency);
  const addOnServices = services.filter((s) => priced.some((p) => p.pricing.addOns.some((a) => a.service.id === s.id)));

  return (
    <View>
      <Text style={styles.lead}>
        Based on {formatNumber(sizing.endpoints, currency)} endpoints, {formatNumber(sizing.users, currency)} users,{" "}
        {formatNumber(sizing.gbPerDay, currency)} GB of logs per day and a {sizing.contractMonths}-month term. Prices are
        indicative, exclude applicable taxes and are subject to a formal proposal.
      </Text>

      <View style={styles.table}>
        <View style={[styles.row, { backgroundColor: colours.brand }]}>
          <Text style={[styles.headCell, { flex: 1.4, color: colours.onBrand }]}> </Text>
          {tiers.map((tier) => (
            <Text key={tier.id} style={[styles.headCell, { flex: 1, textAlign: "right", color: colours.onBrand }]}>
              {t(tierLabel(tier))}
            </Text>
          ))}
        </View>
        {[
          { label: "Monthly price", values: priced.map((p) => money(p.pricing.monthlyPrice)), bold: true },
          { label: `Total over ${sizing.contractMonths} months`, values: priced.map((p) => money(p.pricing.contractPrice)) },
          {
            label: "Per endpoint per month",
            values: priced.map((p) =>
              p.pricing.monthlyPricePerEndpoint === null ? "—" : formatMoney(p.pricing.monthlyPricePerEndpoint, currency, { decimals: 2 }),
            ),
          },
        ].map((row) => (
          <View key={row.label} style={styles.row} wrap={false}>
            <Text style={[styles.cell, { flex: 1.4, fontWeight: 700 }]}>{row.label}</Text>
            {row.values.map((value, i) => (
              <Text key={i} style={[styles.cell, { flex: 1, textAlign: "right", fontWeight: row.bold ? 700 : 400, fontSize: row.bold ? 11 : 9.5 }]}>
                {value}
              </Text>
            ))}
          </View>
        ))}
      </View>

      {addOnServices.length > 0 && (
        <>
          <Text style={styles.h2}>Optional add-ons (monthly)</Text>
          <View style={styles.table}>
            <View style={[styles.row, { backgroundColor: PANEL }]}>
              <Text style={[styles.headCell, { flex: 1.4 }]}>Add-on</Text>
              {tiers.map((tier) => (
                <Text key={tier.id} style={[styles.headCell, { flex: 1, textAlign: "right" }]}>
                  {t(tierLabel(tier))}
                </Text>
              ))}
            </View>
            {addOnServices.map((service) => (
              <View key={service.id} style={styles.row} wrap={false}>
                <View style={{ flex: 1.4, padding: 7 }}>
                  <Text style={{ fontSize: 9.5 }}>{t(service.name)}</Text>
                  <Text style={styles.small}>{PRICING_UNIT_LABELS[service.pricingUnit]}</Text>
                </View>
                {priced.map(({ tier, pricing }) => {
                  const line = pricing.addOns.find((a) => a.service.id === service.id);
                  return (
                    <Text key={tier.id} style={[styles.cell, { flex: 1, textAlign: "right", color: line ? INK : MUTED }]}>
                      {line ? money(line.monthlyPrice) : "—"}
                    </Text>
                  );
                })}
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}
