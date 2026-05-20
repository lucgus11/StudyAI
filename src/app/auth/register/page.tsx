"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Loader2, Mail, Lock, User } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.full_name },
        },
      });
      if (error) throw error;
      toast.success("Compte créé ! Vérifie ton email pour confirmer.");
      router.push("/auth/login");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card animate-slide-up">
      <h1 className="font-display text-2xl font-bold text-slate-50 mb-1">Créer un compte</h1>
      <p className="text-slate-400 text-sm mb-6">Commence à réviser intelligemment</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Prénom &amp; Nom</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="input pl-10"
              placeholder="Marie Dupont"
            />
          </div>
        </div>

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
              placeholder="8 caractères minimum"
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? "Création..." : "Créer mon compte"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-400 mt-5">
        Déjà un compte ?{" "}
        <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
