/**
 * Abstract user store — supports in-memory Map on Vercel.
 */

export interface StoredUser {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  failed_attempts: number;
  locked_until: string | null;
  grade: string;
  main_goal: string;
  main_problem: string;
}

export interface UserStore {
  findByEmail(email: string): StoredUser | undefined;
  create(user: Omit<StoredUser, "id" | "failed_attempts" | "locked_until">): StoredUser;
  updateFailedAttempts(email: string, attempts: number, lockedUntil: string | null): void;
  resetFailedAttempts(email: string): void;
}
