/**
 * STUDYAI – IndexedDB Client (via idb library)
 *
 * Manages all offline data: cached courses, pending quiz scores,
 * and downloaded PDFs stored as Blobs.
 */

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { OfflineCourse, PendingScore } from "@/types";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

interface StudyAIDB extends DBSchema {
  courses: {
    key: string;
    value: OfflineCourse;
    indexes: { "by-subject": string };
  };
  pendingScores: {
    key: string;
    value: PendingScore;
    indexes: { "by-courseId": string };
  };
}

const DB_NAME = "studyai-offline";
const DB_VERSION = 1;

// ---------------------------------------------------------------------------
// Singleton DB connection
// ---------------------------------------------------------------------------

let _db: IDBPDatabase<StudyAIDB> | null = null;

async function getDB(): Promise<IDBPDatabase<StudyAIDB>> {
  if (_db) return _db;
  _db = await openDB<StudyAIDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Courses store
      if (!db.objectStoreNames.contains("courses")) {
        const store = db.createObjectStore("courses", { keyPath: "id" });
        store.createIndex("by-subject", "subject");
      }
      // Pending scores store
      if (!db.objectStoreNames.contains("pendingScores")) {
        const store = db.createObjectStore("pendingScores", { keyPath: "id" });
        store.createIndex("by-courseId", "courseId");
      }
    },
  });
  return _db;
}

// ---------------------------------------------------------------------------
// Courses API
// ---------------------------------------------------------------------------

/** Save or update a course for offline access */
export async function saveOfflineCourse(course: OfflineCourse): Promise<void> {
  const db = await getDB();
  await db.put("courses", { ...course, cachedAt: new Date().toISOString() });
}

/** Retrieve a single offline course by ID */
export async function getOfflineCourse(id: string): Promise<OfflineCourse | undefined> {
  const db = await getDB();
  return db.get("courses", id);
}

/** Retrieve all cached courses */
export async function getAllOfflineCourses(): Promise<OfflineCourse[]> {
  const db = await getDB();
  return db.getAll("courses");
}

/** Delete a cached course */
export async function deleteOfflineCourse(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("courses", id);
}

/** Check whether a course is cached */
export async function isCourseOffline(id: string): Promise<boolean> {
  const db = await getDB();
  const course = await db.get("courses", id);
  return course !== undefined;
}

// ---------------------------------------------------------------------------
// Pending Scores API (offline quiz results awaiting sync)
// ---------------------------------------------------------------------------

/** Save a quiz score that was completed offline */
export async function savePendingScore(score: PendingScore): Promise<void> {
  const db = await getDB();
  await db.put("pendingScores", score);
}

/** Retrieve all unsynced scores */
export async function getAllPendingScores(): Promise<PendingScore[]> {
  const db = await getDB();
  return db.getAll("pendingScores");
}

/** Remove a score after successful sync */
export async function deletePendingScore(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("pendingScores", id);
}

// ---------------------------------------------------------------------------
// Storage size estimate
// ---------------------------------------------------------------------------

export async function getStorageEstimate(): Promise<{ usage: number; quota: number }> {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    return { usage, quota };
  }
  return { usage: 0, quota: 0 };
}
