/**
 * Client-side persistence for block review decisions, keyed by block id (stable
 * — blocks live in Postgres). The backend has no review endpoint yet, so this
 * survives reloads and history reopens on this browser only.
 */

export interface StoredReview {
  status: "approved" | "rejected";
  at: string; // ISO timestamp of the decision
}

const KEY = "medai-block-reviews";

function loadAll(): Record<string, StoredReview> {
  if (typeof localStorage === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function loadReview(blockId: string): StoredReview | null {
  return loadAll()[blockId] ?? null;
}

export function saveReview(blockId: string, status: StoredReview["status"]): StoredReview {
  const review: StoredReview = { status, at: new Date().toISOString() };
  if (typeof localStorage !== "undefined") {
    const all = loadAll();
    all[blockId] = review;
    localStorage.setItem(KEY, JSON.stringify(all));
  }
  return review;
}
