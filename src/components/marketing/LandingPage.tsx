import Link from "next/link";
import {
  ArrowRightIcon,
  CalculatorIcon,
  CheckIcon,
  FileDownIcon,
  KeyboardIcon,
  LayersIcon,
  LibraryIcon,
  LockKeyholeIcon,
  MonitorIcon,
  RadarIcon,
  ShieldCheckIcon,
  TabletIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: LibraryIcon,
    title: "Start from a service library",
    text: "Fifteen vendor-neutral managed security services, from 24×7 monitoring to DPDP and SEBI CSCRF compliance reporting. Edit them to match how you deliver.",
  },
  {
    icon: LayersIcon,
    title: "Shape tiers and SLAs",
    text: "Drag services into Essential, Advanced and Premium tiers, mark add-ons, and set response and resolution targets for each severity.",
  },
  {
    icon: CalculatorIcon,
    title: "Price it and check coverage",
    text: "Size the customer, set margins and see monthly and contract prices in ₹ or $. A NIST CSF 2.0 heatmap shows where each tier has gaps.",
  },
  {
    icon: FileDownIcon,
    title: "Hand over a branded catalogue",
    text: "Export a PDF catalogue in the MSSP's colours and logo, plus a one-page tier comparison for the sales team.",
  },
];

const WORKSHOP_FEATURES = [
  { icon: MonitorIcon, title: "Projector-friendly", text: "Large type, generous spacing and the MSSP's brand colour throughout." },
  { icon: TabletIcon, title: "Works on an iPad", text: "Touch drag-and-drop and a layout that fits tablets in portrait or landscape." },
  { icon: KeyboardIcon, title: "Keyboard accessible", text: "Every action, including drag-and-drop, works from the keyboard." },
];

export function LandingPage({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-semibold">
            <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
              <LayersIcon className="size-4.5" aria-hidden />
            </span>
            MSSP Catalogue Builder
          </Link>
          <nav aria-label="Site" className="flex items-center gap-1 sm:gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/preview">Preview</Link>
            </Button>
            {signedIn ? (
              <Button asChild>
                <Link href="/app/library">Open your catalogues</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/sign-up">Get started</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-28">
          <div>
            <p className="text-primary mb-4 text-sm font-semibold tracking-wide uppercase">For managed security service providers</p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Design, tier and price your security services in one workshop
            </h1>
            <p className="text-muted-foreground mt-6 max-w-xl text-lg leading-relaxed">
              Build a managed security service catalogue live with your team, then leave with a branded PDF ready to take
              to customers.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link href={signedIn ? "/app/library" : "/sign-up"}>
                  {signedIn ? "Open your catalogues" : "Get started free"}
                  <ArrowRightIcon aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
                <Link href="/preview">Try the preview</Link>
              </Button>
            </div>
            <p className="text-muted-foreground mt-4 text-sm">The preview needs no account.</p>
          </div>
          <TierPreviewIllustration />
        </section>

        <section aria-labelledby="how-heading" className="bg-muted/40 border-y">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6">
            <h2 id="how-heading" className="text-3xl font-semibold tracking-tight">
              How it works
            </h2>
            <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="bg-card rounded-xl border p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="text-muted-foreground text-sm font-medium">Step {i + 1}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="workshop-heading" className="mx-auto max-w-6xl px-5 py-20 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 id="workshop-heading" className="text-3xl font-semibold tracking-tight">
                Built for the workshop room
              </h2>
              <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
                One person drives on the big screen while the MSSP team talks. Every change updates prices, SLAs and NIST
                coverage instantly, so decisions happen in the room.
              </p>
            </div>
            <ul className="grid gap-5">
              {WORKSHOP_FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-4">
                  <Icon className="text-primary mt-0.5 size-6 shrink-0" aria-hidden />
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="secure-heading" className="bg-muted/40 border-y">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-20 sm:px-6 lg:flex-row lg:items-center">
            <ShieldCheckIcon className="text-primary size-14 shrink-0" aria-hidden />
            <div>
              <h2 id="secure-heading" className="text-3xl font-semibold tracking-tight">
                Private by design
              </h2>
              <ul className="text-muted-foreground mt-4 grid gap-2 leading-relaxed sm:grid-cols-2">
                {[
                  "Each catalogue is visible only to the account that created it, enforced in the database.",
                  "Sign in with a one-time email link or a password; sessions live in secure, HTTP-only cookies.",
                  "No tracking scripts and no third-party code in the page.",
                  "Export everything as JSON at any time, and delete your account whenever you like.",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <LockKeyholeIcon className="text-primary mt-1 size-4 shrink-0" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight">Ready for your next partner workshop?</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="h-12 px-6 text-base">
              <Link href={signedIn ? "/app/library" : "/sign-up"}>{signedIn ? "Open your catalogues" : "Create your account"}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
              <Link href="/preview">Explore the preview</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-5 py-8 text-sm sm:px-6">
          <p>MSSP Catalogue Builder</p>
          <p>Service content is vendor-neutral. NIST CSF is a framework of the U.S. National Institute of Standards and Technology.</p>
        </div>
      </footer>
    </div>
  );
}

/** A simple, decorative sketch of a tier comparison (not real data). */
function TierPreviewIllustration() {
  const rows: [string, (boolean | "addon")[]][] = [
    ["24×7 monitoring", [true, true, true]],
    ["Detection & response", ["addon", true, true]],
    ["Threat hunting", [false, false, true]],
    ["IR retainer", [false, "addon", true]],
    ["Compliance reporting", ["addon", "addon", true]],
  ];
  return (
    <div className="bg-card rounded-2xl border p-6 shadow-lg" aria-hidden>
      <div className="mb-4 flex items-center gap-2">
        <RadarIcon className="text-primary size-5" />
        <p className="font-semibold">Tiers at a glance</p>
      </div>
      <div className="grid grid-cols-[1.6fr_repeat(3,1fr)] gap-y-1 text-sm">
        <span />
        {["Essential", "Advanced", "Premium"].map((t) => (
          <span key={t} className="bg-primary text-primary-foreground rounded-md py-1.5 text-center text-xs font-semibold first-of-type:ml-1">
            {t}
          </span>
        ))}
        {rows.map(([label, cells]) => (
          <div key={label} className="contents">
            <span className="border-b py-2.5 pr-2">{label}</span>
            {cells.map((cell, i) => (
              <span key={i} className="flex items-center justify-center border-b py-2.5">
                {cell === true ? (
                  <CheckIcon className="text-primary size-4" strokeWidth={3} />
                ) : cell === "addon" ? (
                  <span className="bg-primary/10 rounded px-1.5 text-[11px] font-medium">Add-on</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        {["₹2.7 L", "₹8.8 L", "₹16.5 L"].map((price) => (
          <div key={price} className="bg-muted/60 rounded-lg py-2">
            <p className="font-semibold">{price}</p>
            <p className="text-muted-foreground text-[11px]">per month</p>
          </div>
        ))}
      </div>
    </div>
  );
}
