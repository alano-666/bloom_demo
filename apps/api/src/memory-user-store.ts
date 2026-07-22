/**
 * In-memory user store — works in Vercel serverless, local dev.
 * No native dependencies. Data is lost on process restart.
 */
import type { StoredUser } from "./user-store.js";

export function createMemoryUserStore() {
  const users = new Map<string, StoredUser>();
  let nextId = 1;

  return {
    findByEmail(email: string): StoredUser | undefined {
      return users.get(email);
    },

    create(user: { email: string; username: string; password_hash: string; grade: string; main_goal: string; main_problem: string }): StoredUser {
      const stored: StoredUser = {
        id: nextId++,
        email: user.email,
        username: user.username,
        password_hash: user.password_hash,
        failed_attempts: 0,
        locked_until: null,
        grade: user.grade,
        main_goal: user.main_goal,
        main_problem: user.main_problem,
      };
      users.set(user.email, stored);
      return stored;
    },

    updateFailedAttempts(email: string, attempts: number, lockedUntil: string | null) {
      const u = users.get(email);
      if (u) {
        u.failed_attempts = attempts;
        u.locked_until = lockedUntil;
      }
    },

    resetFailedAttempts(email: string) {
      const u = users.get(email);
      if (u) {
        u.failed_attempts = 0;
        u.locked_until = null;
      }
    },
  };
}
