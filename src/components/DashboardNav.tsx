"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useOnlineStatus } from "@/hooks";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  WifiOff,
  LogOut,
  Download,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/courses", label: "Mes cours", icon: BookOpen },
  { href: "/dashboard/planner", label: "Planificateur", icon: Calendar },
  { href: "/dashboard/offline", label: "Hors-ligne", icon: Download },
];

interface Props {
  user: User;
}

export default function DashboardNav({ user }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const isOnline = useOnlineStatus();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-surface-900 border-r border-surface-800 p-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-slate-50">StudyAI</span>
        </div>

        {/* Online/offline indicator */}
        <div className={clsx(
          "flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-xs font-medium",
          isOnline
            ? "bg-accent-900/20 text-accent-400 border border-accent-700/30"
            : "bg-danger-900/20 text-danger-400 border border-danger-700/30"
        )}>
          {isOnline ? (
            <><span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />En ligne</>
          ) : (
            <><WifiOff className="w-3 h-3" />Mode hors-ligne</>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-brand-600/20 text-brand-300 border border-brand-600/30"
                    : "text-slate-400 hover:text-slate-100 hover:bg-surface-800"
                )}
              >
                <Icon className={clsx("w-4 h-4", active ? "text-brand-400" : "")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-surface-800 pt-4 mt-4">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {(user.user_metadata?.full_name || user.email || "?")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-100 truncate">
                {user.user_metadata?.full_name || "Étudiant"}
              </p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="btn-ghost w-full justify-start gap-2 text-slate-500">
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-900 border-t border-surface-800 flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-150",
                active ? "text-brand-400" : "text-slate-500"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
