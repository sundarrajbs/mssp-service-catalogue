import { BuilderShell } from "@/components/layout/BuilderShell";
import { PreviewBanner } from "@/components/preview/PreviewBanner";
import { PreviewProvider } from "@/components/preview/PreviewProvider";
import { PreviewSidebarFooter } from "@/components/preview/PreviewSidebarFooter";

export default function PreviewLayout({ children }: LayoutProps<"/preview">) {
  return (
    <PreviewProvider>
      <BuilderShell mode="preview" banner={<PreviewBanner />} footer={<PreviewSidebarFooter />}>
        {children}
      </BuilderShell>
    </PreviewProvider>
  );
}
