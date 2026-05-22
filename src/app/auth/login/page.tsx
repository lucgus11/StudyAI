"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Loader2, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";

// Composant séparé pour useSearchParams → doit être dans un Suspense
function LoginMessages() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const successParam = searchParams.get("success");

  if (!errorParam && !successParam) return null;

  return (
    <>
      {errorParam && (
        <div
          className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
          style={{
            backgroundColor: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#f87171",
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errorParam === "lien_invalide_ou_expire"
            ? "Le lien de confirmation est invalide ou a expiré. Réessaie de t'inscrire."
            : errorParam}
        </div>
      )}
      {successParam === "email_confirme" && (
        <div
          className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
          style={{
            backgroundColor: "rgba(16,185,129,0.1)",
            border: "1px solid rgba(16,185,129,0.3)",
            color: "#34d399",
          }}
        >
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Email confirmé ! Tu peux maintenant te connecter.
        </div>
      )}
    </>
  );
}

function LoginForm() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) throw error;
      toast.success("Connexion réussie !");
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur de connexion");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input pl-10"
            placeholder="ton@email.com"
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <label className="label">Mot de passe</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="input pl-10"
            placeholder="••••••••"
            disabled={loading}
          />
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {loading ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="card animate-slide-up">
      <h1 className="font-display text-2xl font-bold text-slate-50 mb-1">Connexion</h1>
      <p className="text-slate-400 text-sm mb-6">Accède à ton espace de révision</p>

      {/* useSearchParams doit être dans un Suspense en Next.js 14 */}
      <Suspense fallback={null}>
        <LoginMessages />
      </Suspense>

      <LoginForm />

      <p className="text-center text-sm text-slate-400 mt-5">
        Pas encore de compte ?{" "}
        <Link href="/auth/register" className="font-medium" style={{ color: "#818cf8" }}>
          S&apos;inscrire
        </Link>
      </p>
    </div>
  );
}
