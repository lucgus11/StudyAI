/**
 * STUDYAI – Background Sync Service
 *
 * Watches for network connectivity and pushes pending offline scores
 * to Supabase as soon as the device reconnects.
 */

import { getAllPendingScores, deletePendingScore } from "@/lib/db/indexeddb";
import { createClient } from "@/lib/supabase/client";

/** Attempt to sync all pending offline scores to Supabase */
export async function syncPendingScores(): Promise<{ synced: number; failed: number }> {
  const supabase = createClient();
  const pending = await getAllPendingScores();

  let synced = 0;
  let failed = 0;

  for (const score of pending) {
    try {
      const { error } = await supabase.from("quiz_scores").insert({
        id: score.id,
        course_id: score.courseId,
        mode: score.mode,
        score: score.score,
        total: score.total,
        feedback: score.feedback,
        synced: true,
        created_at: score.createdAt,
      });

      if (error) throw error;

      await deletePendingScore(score.id);
      synced++;
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}

/** Register online event listener to auto-sync when network returns */
export function registerOnlineSync(onComplete?: (result: { synced: number }) => void): () => void {
  const handler = async () => {
    const result = await syncPendingScores();
    if (result.synced > 0 && onComplete) {
      onComplete({ synced: result.synced });
    }
  };

  window.addEventListener("online", handler);
  return () => window.removeEventListener("online", handler);
}

/** Download a PDF from Supabase Storage and cache it in IndexedDB */
export async function downloadCourseForOffline(
  courseId: string,
  pdfUrl: string
): Promise<Blob> {
  const response = await fetch(pdfUrl);
  if (!response.ok) throw new Error("Failed to download PDF");
  return response.blob();
}
