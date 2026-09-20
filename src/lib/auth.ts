import type { UserRole } from "@/types";

/** Display labels for backend role codes. Backend stays authoritative. */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  PRESIDENT: "President",
  EVENT_HEAD: "Event Head",
  VOLUNTEER: "Volunteer",
  FACULTY: "Faculty Advisor",
};

export function getUserRoleLabel(role: UserRole): string {
  return USER_ROLE_LABELS[role] ?? role;
}

/** Lightweight email format check for forms (not a deliverability check). */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please sign in again.";
