"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, Plus, X, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { extractTextFromPDFClient } from "@/lib/pdf/extract";
import toast from "react-hot-toast";

interface Props { onSuccess?: () => void; }

export default function UploadCourseButton({ onSuccess }: Props = {}) {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "reading" | "uploading" | "analyzing">("idle");
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
    if (!form.title) setForm((prev) => ({ ...prev, title: f.name.replace(".pdf", "").replace(/_/g, " ") }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.subject) {
      toast.error("Remplis le titre et la matière");
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non authentifié");
      const token = session.access_token;

      let pdfPath: string | null = null;
      let pdfUrl: string | null = null;
      let extractedText = "";

      if (file) {
        // Étape 1 : Lire et extraire le texte du PDF côté navigateur
        setStep("reading");
        extractedText = await extractTextFromPDFClient(file);

        if (!extractedText || extractedText.length < 100) {
          toast("PDF lu mais peu de texte extrait — l'IA utilisera ses connaissances sur le sujet", { icon: "⚠️" });
          extractedText = "";
        } else {
          toast.success(`PDF lu : ${extractedText.length} caractères extraits`);
        }

        // Étape 2 : Upload du fichier PDF vers Supabase Storage
        setStep("uploading");
        const fileName =
          session.user.id +
          "/" +
          Date.now() +
          "_" +
          file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("course-pdfs")
          .upload(fileName, file, { contentType: "application/pdf", upsert: false });

        if (uploadError) throw new Error("Upload échoué: " + uploadError.message);
        pdfPath = uploadData.path;

        const { data: urlData } = supabase.storage
          .from("course-pdfs")
          .getPublicUrl(pdfPath);
        pdfUrl = urlData.publicUrl;
      }

      // Étape 3 : Envoyer titre, matière ET texte extrait à l'API
      setStep("analyzing");
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
        },
        body: JSON.stringify({
          title: form.title,
          subject: form.subject,
          pdfPath,
          pdfUrl,
          extractedText, // Le texte réel du PDF !
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur serveur");

      toast.success("Cours créé et analysé par l'IA !");
      setOpen(false);
      setForm({ title: "", subject: "" });
      setFile(null);
      if (onSuccess) onSuccess();
      else window.location.reload();

    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du traitement");
    } finally {
      setLoading(false);
      setStep("idle");
    }
  };

  const stepLabels: Record<string, string> = {
    idle: "",
    reading: "Lecture du PDF en cours…",
    uploading: "Téléversement du PDF…",
    analyzing: "L'IA analyse ton cours (30s max)…",
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="w-4 h-4" />
        Ajouter un cours
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-2xl animate-slide-up"
            style={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-bold text-slate-50">
                Ajouter un cours
              </h2>
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="text-slate-400 hover:text-slate-100 p-1 transition-colors"
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
                  placeholder="Ex : Les institutions de la Ve République"
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
                  placeholder="Ex : Droit constitutionnel, Géographie…"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="label">
                  PDF du cours{" "}
                  <span className="text-indigo-400 font-normal">(recommandé — 20 Mo max)</span>
                </label>
                <div
                  onClick={() => !loading && fileRef.current?.click()}
                  className="border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all"
                  style={{
                    borderColor: file ? "#6366f1" : "#334155",
                    backgroundColor: file ? "rgba(99,102,241,0.05)" : "transparent",
                  }}
                >
                  {file ? (
                    <div className="flex items-center justify-center gap-2" style={{ color: "#a5b4fc" }}>
                      <FileText className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm font-medium truncate max-w-[220px]">{file.name}</span>
                      <span className="text-xs text-slate-500">
                        ({(file.size / 1024 / 1024).toFixed(1)} Mo)
                      </span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748b" }} />
                      <p className="text-sm text-slate-400">
                        Clique pour sélectionner un PDF
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Le texte sera extrait et analysé par l'IA
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
                <div
                  className="flex items-center gap-2 text-sm p-3 rounded-lg"
                  style={{
                    color: "#a5b4fc",
                    backgroundColor: "rgba(99,102,241,0.1)",
                    border: "1px solid rgba(99,102,241,0.3)",
                  }}
                >
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
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
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
