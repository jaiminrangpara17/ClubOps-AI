/**
 * Authentication contract shared with the backend.
 * Aligned with the ClubOps auth API (JWT Bearer); the backend remains the
 * single source of truth for these types — sync any change from Member 2.
 */

export const USER_ROLES = ["PRESIDENT", "EVENT_HEAD", "VOLUNTEER", "FACULTY"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organisation: string;
  avatarUrl?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  /** Remember the session across restarts (persistent storage vs tab session). */
  remember?: boolean;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  tokenType: "Bearer";
  expiresAt: string;
}

export interface GetCurrentUserResponse {
  user: User;
}
