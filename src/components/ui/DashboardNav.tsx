"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useOnlineStatus } from "@/hooks";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, BookOpen, Calendar, WifiOff,
  LogOut, Download, Zap,
} from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/courses", label: "Mes cours", icon: BookOpen },
  { href: "/dashboard/planner", label: "Planificateur", icon: Calendar },
  { href: "/dashboard/offline", label: "Hors-ligne", icon: Download },
];

export default function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const isOnline = useOnlineStatus();
  const [userInfo, setUserInfo] = useState<{ email: string; name: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserInfo({
          email: session.user.email ?? "",
          name: session.user.user_metadata?.full_name ?? "",
        });
      }
    });
  }, [supabase]);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  };

  const initial = (userInfo?.name || userInfo?.email || "?")[0].toUpperCase();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r p-4"
        style={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-2 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #6366f1, #10b981)" }}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-slate-50">StudyAI</span>
        </div>

        {/* Online indicator */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-xs font-medium"
          style={isOnline
            ? { backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399" }
            : { backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
          {isOnline
            ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />En ligne</>
            : <><WifiOff className="w-3 h-3" />Mode hors-ligne</>}
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link key={item.href} href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  active ? "text-indigo-300" : "text-slate-400 hover:text-slate-100"
                )}
                style={active ? { backgroundColor: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" } : {}}>
                <Icon className={clsx("w-4 h-4", active ? "text-indigo-400" : "")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="pt-4 mt-4" style={{ borderTop: "1px solid #1e293b" }}>
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #6366f1, #10b981)" }}>
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-100 truncate">{userInfo?.name || "Étudiant"}</p>
              <p className="text-xs text-slate-500 truncate">{userInfo?.email}</p>
            </div>
          </div>
          <button onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-sm text-slate-500 hover:text-slate-300 transition-colors">
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2"
        style={{ backgroundColor: "#0f172a", borderTop: "1px solid #1e293b" }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          return (
            <Link key={item.href} href={item.href}
              className={clsx("flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all",
                active ? "text-indigo-400" : "text-slate-500")}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
