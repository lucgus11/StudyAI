"use client";

import { useOfflineCourses, useOnlineStatus } from "@/hooks";
import { Download, WifiOff, BookOpen, Trash2, Clock } from "lucide-react";
import { deleteOfflineCourse } from "@/lib/db/indexeddb";
import Link from "next/link";
import toast from "react-hot-toast";

export default function OfflinePage() {
  const { courses, loading, refresh } = useOfflineCourses();
  const isOnline = useOnlineStatus();

  const handleDelete = async (id: string, title: string) => {
    await deleteOfflineCourse(id);
    await refresh();
    toast.success(`"${title}" supprimé du cache`);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-fade-in">
      <div>
        <h1 className="section-title">📥 Cours hors-ligne</h1>
        <p className="text-slate-400 text-sm mt-1">
          Cours téléchargés disponibles sans connexion internet.
        </p>
      </div>

      {/* Status banner */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${
        isOnline
          ? "bg-accent-900/20 border-accent-700/30 text-accent-300"
          : "bg-warn-900/20 border-warn-700/30 text-warn-300"
      }`}>
        {isOnline ? (
          <>
            <div className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
            <p className="text-sm font-medium">
              Connecté — tes scores hors-ligne seront synchronisés automatiquement.
            </p>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm font-medium">
              Mode hors-ligne actif — seuls les cours téléchargés sont accessibles.
            </p>
          </>
        )}
      </div>

      {/* Course list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-surface-700 rounded w-1/2 mb-2" />
              <div className="h-3 bg-surface-800 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Download className="w-12 h-12 text-slate-600 mb-4" />
          <h2 className="font-display font-semibold text-lg text-slate-200 mb-2">
            Aucun cours téléchargé
          </h2>
          <p className="text-slate-400 text-sm max-w-xs mb-6">
            Sur la page d&apos;un cours, clique sur{" "}
            <span className="text-brand-400 font-medium">Télécharger hors-ligne</span> pour
            l&apos;avoir disponible sans connexion.
          </p>
          <Link href="/dashboard/courses" className="btn-primary">
            Voir mes cours
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="card flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-900/40 border border-brand-700/30 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-brand-400" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-100 truncate">{course.title}</p>
                <p className="text-xs text-slate-500">{course.subject}</p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {course.flashcards && (
                    <span className="text-xs text-slate-500">
                      {course.flashcards.length} flashcards
                    </span>
                  )}
                  {course.pdfBlob && (
                    <span className="text-xs text-accent-500">PDF disponible</span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-slate-600">
                    <Clock className="w-3 h-3" />
                    {new Date(course.cachedAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/dashboard/courses/${course.id}/flashcards`}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  Réviser
                </Link>
                <button
                  onClick={() => handleDelete(course.id, course.title)}
                  className="btn-ghost p-2 text-slate-600 hover:text-danger-400"
                  aria-label="Supprimer du cache"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
