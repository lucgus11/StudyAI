import DashboardNav from "@/components/ui/DashboardNav";
import DashboardAuthGuard from "@/components/ui/DashboardAuthGuard";

// Forcer le rendu dynamique — empêche Next.js de pré-rendre
// statiquement les pages dashboard (qui nécessitent une session auth)
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardAuthGuard>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#020617" }}>
        <DashboardNav />
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full p-4 md:p-8 bg-mesh">
            {children}
          </div>
        </main>
      </div>
    </DashboardAuthGuard>
  );
}
