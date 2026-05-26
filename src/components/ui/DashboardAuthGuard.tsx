"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * Garde d'authentification côté CLIENT.
 * Le SDK Supabase JS lit la session depuis les cookies httpOnly via
 * le endpoint /auth/v1/user — plus fiable que la lecture server-side
 * immédiatement après un login.
 */
export default function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.replace("/auth/login");
      } else {
        setAuthenticated(true);
      }
      setChecking(false);
    };

    checkSession();

    // Écouter les changements de session (déconnexion, expiration)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.replace("/auth/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#020617" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#6366f1" }} />
          <p className="text-sm" style={{ color: "#64748b" }}>Chargement…</p>
        </div>
      </div>
    );
  }

  if (!authenticated) return null;

  return <>{children}</>;
}
