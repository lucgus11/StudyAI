"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Plus, X } from "lucide-react";
import toast from "react-hot-toast";

export default function UploadCourseButton() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "uploading" | "analyzing">("idle");
  const [form, setForm] = useState({ title: "", subject: "" });
  const [file, setFile] = useState<File | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") {
      toast.error("Seuls les fichiers PDF sont acceptés");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (20 Mo max)");
      return;
    }
    setFile(f);
    if (!form.title) setForm((prev) => ({ ...prev, title: f.name.replace(".pdf", "") }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.subject) {
      toast.error("Remplis le titre et la matière");
      return;
    }

    setLoading(true);
    setStep("uploading");

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("subject", form.subject);
      if (file) formData.append("pdf", file);

      setStep("analyzing");
      const res = await fetch("/api/courses", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Erreur serveur");

      toast.success("Cours créé et analysé par l'IA !");
      setOpen(false);
      setForm({ title: "", subject: "" });
      setFile(null);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du traitement");
    } finally {
      setLoading(false);
      setStep("idle");
    }
  };

  const stepLabels = {
    idle: "",
    uploading: "Téléversement du PDF…",
    analyzing: "L'IA analyse ton cours (peut prendre 30s)…",
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="w-4 h-4" />
        Ajouter un cours
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface-900 border border-surface-700 rounded-2xl p-6 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-bold text-slate-50">
                Ajouter un cours
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="btn-ghost p-1.5"
                disabled={loading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Titre du cours</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input"
                  placeholder="Ex : Analyse mathématique – Séries de Fourier"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="label">Matière</label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="input"
                  placeholder="Ex : Mathématiques, Droit, Biologie…"
                  disabled={loading}
                />
              </div>

              {/* PDF upload zone */}
              <div>
                <label className="label">PDF du cours (optionnel – 20 Mo max)</label>
                <div
                  onClick={() => !loading && fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                    file
                      ? "border-brand-600/60 bg-brand-900/10"
                      : "border-surface-600 hover:border-brand-600/40 hover:bg-brand-900/5"
                  } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {file ? (
                    <div className="flex items-center justify-center gap-2 text-brand-300">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {file.name}
                      </span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">
                        Clique pour sélectionner un PDF
                      </p>
                    </>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFile}
                  className="hidden"
                />
              </div>

              {loading && (
                <div className="flex items-center gap-2 text-sm text-brand-300 bg-brand-900/20 rounded-lg p-3 border border-brand-700/30">
                  <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                  {stepLabels[step]}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-secondary flex-1"
                  disabled={loading}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {loading ? "Traitement…" : "Créer le cours"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
