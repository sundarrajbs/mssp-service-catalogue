import { PageHeader } from "./PageHeader";

export function ComingSoon({ title, phase }: { title: string; phase: number }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="text-muted-foreground rounded-xl border border-dashed p-12 text-center">
        This section arrives in Phase {phase}.
      </div>
    </>
  );
}
