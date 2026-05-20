/**
 * STUDYAI – Custom React Hooks
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getAllOfflineCourses,
  isCourseOffline,
  saveOfflineCourse,
  deleteOfflineCourse,
} from "@/lib/db/indexeddb";
import { downloadCourseForOffline, registerOnlineSync } from "@/lib/db/sync";
import type { Profile, Course, OfflineCourse } from "@/types";

// ---------------------------------------------------------------------------
// useAuth – current user session
// ---------------------------------------------------------------------------

export function useAuth() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({
          id: user.id,
          email: user.email ?? "",
          full_name: user.user_metadata?.full_name ?? null,
          avatar_url: user.user_metadata?.avatar_url ?? null,
          created_at: user.created_at,
        });
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? "",
          full_name: session.user.user_metadata?.full_name ?? null,
          avatar_url: session.user.user_metadata?.avatar_url ?? null,
          created_at: session.user.created_at,
        });
      } else {
        setUser(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  return { user, loading, signOut };
}

// ---------------------------------------------------------------------------
// useOnlineStatus – network connectivity
// ---------------------------------------------------------------------------

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

// ---------------------------------------------------------------------------
// useOfflineSync – auto-sync when online
// ---------------------------------------------------------------------------

export function useOfflineSync(onSynced?: (count: number) => void) {
  useEffect(() => {
    const unregister = registerOnlineSync(({ synced }) => {
      if (onSynced) onSynced(synced);
    });
    return unregister;
  }, [onSynced]);
}

// ---------------------------------------------------------------------------
// useOfflineCourses – list of locally cached courses
// ---------------------------------------------------------------------------

export function useOfflineCourses() {
  const [courses, setCourses] = useState<OfflineCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const all = await getAllOfflineCourses();
    setCourses(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { courses, loading, refresh };
}

// ---------------------------------------------------------------------------
// useDownloadCourse – download + cache a course for offline use
// ---------------------------------------------------------------------------

export function useDownloadCourse() {
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [cached, setCached] = useState<Record<string, boolean>>({});

  const checkCached = useCallback(async (courseId: string) => {
    const result = await isCourseOffline(courseId);
    setCached((prev) => ({ ...prev, [courseId]: result }));
    return result;
  }, []);

  const download = useCallback(
    async (course: Course) => {
      setDownloading((prev) => ({ ...prev, [course.id]: true }));
      try {
        let pdfBlob: Blob | undefined;
        if (course.pdf_url) {
          pdfBlob = await downloadCourseForOffline(course.id, course.pdf_url);
        }

        const offlineCourse: OfflineCourse = {
          id: course.id,
          title: course.title,
          subject: course.subject,
          pdfBlob,
          summary: course.summary,
          glossary: course.glossary,
          key_concepts: course.key_concepts,
          flashcards: course.flashcards,
          quiz_questions: course.quiz_questions,
          cachedAt: new Date().toISOString(),
        };

        await saveOfflineCourse(offlineCourse);
        setCached((prev) => ({ ...prev, [course.id]: true }));
      } finally {
        setDownloading((prev) => ({ ...prev, [course.id]: false }));
      }
    },
    []
  );

  const remove = useCallback(async (courseId: string) => {
    await deleteOfflineCourse(courseId);
    setCached((prev) => ({ ...prev, [courseId]: false }));
  }, []);

  return { downloading, cached, checkCached, download, remove };
}
