/**
 * Who the signed-in doctor says they are: their name, and the clinical role the
 * app tailors itself to.
 *
 * Kept in this browser. The backend has no route that stores a doctor's own
 * name or clinical role — `GET /auth/me` answers email, subject and expiry, and
 * a member's `name`/`role` on the team screen are the workspace's record of
 * them, written by whoever invited them. When a profile route lands, this
 * module is the one place that changes.
 *
 * The key is the account it belongs to, so a shared workstation does not greet
 * the next doctor by the last one's name.
 *
 * This is **not** the team role. `owner`/`admin`/`clinician` decide what a
 * member may do and are granted by an owner; nothing a doctor types about
 * themselves may widen what the API lets them do.
 */

/** What the doctor does, for wording and defaults — never for permissions. */
export type ClinicalRole = "physician" | "resident" | "nurse" | "assistant" | "other";

export const CLINICAL_ROLES: ClinicalRole[] = [
  "physician",
  "resident",
  "nurse",
  "assistant",
  "other",
];

export interface DoctorProfile {
  name: string;
  role: ClinicalRole;
}

const KEY = "medai-profile";

function keyFor(account: string): string {
  return `${KEY}:${account.toLowerCase()}`;
}

export function loadProfile(account: string | null): DoctorProfile | null {
  if (!account) return null;
  try {
    const raw = localStorage.getItem(keyFor(account));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DoctorProfile>;
    const name = typeof parsed.name === "string" ? parsed.name.trim() : "";
    // An unknown role means a build that knew roles this one does not.
    const role = CLINICAL_ROLES.find((r) => r === parsed.role) ?? "other";
    return name ? { name, role } : null;
  } catch {
    // Corrupt or unreadable storage is a missing profile, not a broken app.
    return null;
  }
}

export function saveProfile(account: string | null, profile: DoctorProfile): void {
  if (!account) return;
  try {
    localStorage.setItem(keyFor(account), JSON.stringify(profile));
  } catch {
    // Private-mode storage refusals cost personalization, nothing more.
  }
}

export function forgetProfile(account: string | null): void {
  if (!account) return;
  try {
    localStorage.removeItem(keyFor(account));
  } catch {
    /* nothing to clean up */
  }
}

/** Initials for the avatar: from the name once there is one, else the address. */
export function initialsOf(profile: DoctorProfile | null, email: string | null): string {
  const source = profile?.name || email?.split("@")[0] || "";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0].toUpperCase());
  return letters.join("") || "MD";
}
