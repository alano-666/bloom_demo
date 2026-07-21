import { Router, Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { demoStore } from "./store.js";
import rateLimit from "express-rate-limit";
import type { StoredUser } from "./user-store.js";

// Pluggable user store — set before routes are registered
let userStore: {
  findByEmail(email: string): StoredUser | undefined;
  create(user: { email: string; username: string; password_hash: string; grade: string; main_goal: string; main_problem: string }): StoredUser;
  updateFailedAttempts(email: string, attempts: number, lockedUntil: string | null): void;
  resetFailedAttempts(email: string): void;
} | null = null;

export function setUserStore(store: typeof userStore) {
  userStore = store;
}

function getStore() {
  if (!userStore) {
    const { createMemoryUserStore } = require("./memory-user-store.js");
    userStore = createMemoryUserStore();
  }
  return userStore!;
}

export const authRouter = Router();

// Rate limit: max 5 registration attempts per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "注册过于频繁，请稍后再试。", code: "IP_BLOCKED" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});

// Rate limit: max 10 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "登录尝试过于频繁，请 15 分钟后再试。", code: "IP_BLOCKED" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});

const registerSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  username: z.string().min(1, "用户名不能为空"),
  password: z.string().min(6, "密码至少需要 6 个字符"),
  grade: z.string().optional(),
  mainGoal: z.string().optional(),
  mainProblem: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(1, "请输入密码"),
});

// POST /api/auth/register
authRouter.post("/register", registerLimiter, async (req: Request, res: Response) => {
  try {
    const body = registerSchema.parse(req.body);
    const store = getStore();

    if (store.findByEmail(body.email)) {
      res.status(409).json({ error: "该邮箱已注册，请直接登录。", code: "EMAIL_EXISTS" });
      return;
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = store.create({
      email: body.email,
      username: body.username,
      password_hash: passwordHash,
      grade: body.grade ?? "",
      main_goal: body.mainGoal ?? "",
      main_problem: body.mainProblem ?? "",
    });

    const bootstrap = await demoStore.submitOnboarding({
      name: body.username,
      username: body.username,
      email: body.email,
      grade: body.grade ?? "未知",
      longTermGoal: body.mainGoal ?? "持续成长",
      currentChallenge: body.mainProblem ?? "探索方向",
      mainGoal: body.mainGoal,
      mainProblem: body.mainProblem,
    });

    res.json({ user: { id: user.id, email: body.email, username: body.username }, bootstrap });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(422).json({ error: err.issues[0].message, code: "VALIDATION_ERROR" });
      return;
    }
    console.error("Register error:", err);
    res.status(500).json({ error: "注册失败，请稍后再试。", code: "SERVER_ERROR" });
  }
});

// POST /api/auth/login
authRouter.post("/login", loginLimiter, async (req: Request, res: Response) => {
  try {
    const body = loginSchema.parse(req.body);
    const store = getStore();
    const user = store.findByEmail(body.email);

    if (!user) {
      res.status(401).json({ error: "邮箱或密码错误。", code: "INVALID_CREDENTIALS" });
      return;
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
      res.status(429).json({ error: `账号已被锁定，请 ${remainingMinutes} 分钟后再试。`, code: "ACCOUNT_LOCKED", lockedUntil: user.locked_until });
      return;
    }

    if (user.locked_until && new Date(user.locked_until) <= new Date()) {
      store.resetFailedAttempts(body.email);
      user.failed_attempts = 0;
      user.locked_until = null;
    }

    const valid = await bcrypt.compare(body.password, user.password_hash);
    if (!valid) {
      const newAttempts = user.failed_attempts + 1;
      if (newAttempts >= 5) {
        const lockUntil = new Date(Date.now() + 3 * 60 * 1000).toISOString();
        store.updateFailedAttempts(body.email, newAttempts, lockUntil);
        res.status(429).json({ error: "密码错误次数过多，账号已锁定，请 3 分钟后再试。", code: "ACCOUNT_LOCKED", lockedUntil: lockUntil });
        return;
      }
      store.updateFailedAttempts(body.email, newAttempts, null);
      const remaining = 5 - newAttempts;
      res.status(401).json({ error: `密码错误，还剩 ${remaining} 次尝试机会。`, code: "WRONG_PASSWORD", remainingAttempts: remaining });
      return;
    }

    store.resetFailedAttempts(body.email);

    const bootstrap = demoStore.bootstrap();
    res.json({
      user: { id: user.id, email: user.email, username: user.username, grade: user.grade, mainGoal: user.main_goal, mainProblem: user.main_problem },
      bootstrap,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(422).json({ error: err.issues[0].message, code: "VALIDATION_ERROR" });
      return;
    }
    console.error("Login error:", err);
    res.status(500).json({ error: "登录失败，请稍后再试。", code: "SERVER_ERROR" });
  }
});

// GET /api/auth/check
authRouter.get("/check", (_req: Request, res: Response) => {
  res.json({ ok: true, message: "Auth service is running" });
});
