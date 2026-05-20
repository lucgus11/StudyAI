"use client";

import { useEffect, useState } from "react";
import { Download, Trash2, CheckCircle, Loader2 } from "lucide-react";
import { useDownloadCourse } from "@/hooks";
import toast from "react-hot-toast";
import type { Course } from "@/types";

interface Props {
  course: Course;
}

export default function DownloadOfflineButton({ course }: Props) {
  const { downloading, cached, checkCached, download, remove } = useDownloadCourse();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    checkCached(course.id).then(() => setReady(true));
  }, [course.id, checkCached]);

  const isCached = cached[course.id] ?? false;
  const isDownloading = downloading[course.id] ?? false;

  const handleDownload = async () => {
    try {
      await download(course);
      toast.success("Cours téléchargé pour le mode hors-ligne !");
    } catch {
      toast.error("Erreur lors du téléchargement");
    }
  };

  const handleRemove = async () => {
    await remove(course.id);
    toast("Cours supprimé du cache hors-ligne", { icon: "🗑️" });
  };

  if (!ready) return null;

  if (isCached) {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs text-accent-400 font-medium">
          <CheckCircle className="w-3.5 h-3.5" />
          Disponible hors-ligne
        </span>
        <button
          onClick={handleRemove}
          className="btn-ghost p-1.5 text-slate-600 hover:text-danger-400"
          title="Supprimer du cache"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className="btn-secondary gap-2 text-xs"
    >
      {isDownloading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Download className="w-3.5 h-3.5" />
      )}
      {isDownloading ? "Téléchargement…" : "Hors-ligne"}
    </button>
  );
}
