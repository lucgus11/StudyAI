import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardNav from "@/components/ui/DashboardNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return (
    <div className="flex h-screen bg-surface-950 overflow-hidden">
      {/* Sidebar */}
      <DashboardNav user={user} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full p-4 md:p-8 bg-mesh">
          {children}
        </div>
      </main>
    </div>
  );
}
