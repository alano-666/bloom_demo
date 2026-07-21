import { Router, type NextFunction, type Request, type Response } from "express";
import { randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { z } from "zod";
import { demoStore } from "./store.js";
import { createMemoryUserStore } from "./memory-user-store.js";

const scryptAsync = promisify(scrypt);
const defaultUserStore = createMemoryUserStore();

let userStore = defaultUserStore;

export function setUserStore(store: typeof defaultUserStore) {
  userStore = store;
}

async function hashPassword(password: string) {
  const salt = randomUUID().replaceAll("-", "");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hash, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

type RateWindow = { hits: number[] };
const rateWindows = new Map<string, RateWindow>();

function limitByIp(prefix: string, windowMs: number, max: number, message: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${prefix}:${ip}`;
    const window = rateWindows.get(key) ?? { hits: [] };
    window.hits = window.hits.filter((hit) => now - hit < windowMs);
    if (window.hits.length >= max) {
      res.status(429).json({ error: message, code: "IP_BLOCKED" });
      return;
    }
    window.hits.push(now);
    rateWindows.set(key, window);
    next();
  };
}

const registerLimiter = limitByIp("register", 60 * 60 * 1000, 5, "注册过于频繁，请稍后再试。");
const loginLimiter = limitByIp("login", 15 * 60 * 1000, 10, "登录尝试过于频繁，请 15 分钟后再试。");

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

export const authRouter = Router();

authRouter.post("/register", registerLimiter, async (req, res) => {
  try {
    const body = registerSchema.parse(req.body);
    if (userStore.findByEmail(body.email)) {
      res.status(409).json({ error: "该邮箱已注册，请直接登录。", code: "EMAIL_EXISTS" });
      return;
    }

    const user = userStore.create({
      email: body.email,
      username: body.username,
      password_hash: await hashPassword(body.password),
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

    res.json({ user: { id: user.id, email: user.email, username: user.username }, bootstrap });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(422).json({ error: error.issues[0]?.message ?? "输入无效", code: "VALIDATION_ERROR" });
      return;
    }
    console.error("Register error:", error);
    res.status(500).json({ error: "注册失败，请稍后再试。", code: "SERVER_ERROR" });
  }
});

authRouter.post("/login", loginLimiter, async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = userStore.findByEmail(body.email);
    if (!user) {
      res.status(401).json({ error: "邮箱或密码错误。", code: "INVALID_CREDENTIALS" });
      return;
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutes = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
      res.status(429).json({ error: `账号已被锁定，请 ${minutes} 分钟后再试。`, code: "ACCOUNT_LOCKED", lockedUntil: user.locked_until });
      return;
    }
    if (user.locked_until) {
      userStore.resetFailedAttempts(user.email);
      user.failed_attempts = 0;
      user.locked_until = null;
    }

    if (!(await verifyPassword(body.password, user.password_hash))) {
      const attempts = user.failed_attempts + 1;
      if (attempts >= 5) {
        const lockedUntil = new Date(Date.now() + 3 * 60 * 1000).toISOString();
        userStore.updateFailedAttempts(user.email, attempts, lockedUntil);
        res.status(429).json({ error: "密码错误次数过多，账号已锁定，请 3 分钟后再试。", code: "ACCOUNT_LOCKED", lockedUntil });
        return;
      }
      userStore.updateFailedAttempts(user.email, attempts, null);
      res.status(401).json({ error: `密码错误，还剩 ${5 - attempts} 次尝试机会。`, code: "WRONG_PASSWORD", remainingAttempts: 5 - attempts });
      return;
    }

    userStore.resetFailedAttempts(user.email);
    res.json({
      user: { id: user.id, email: user.email, username: user.username, grade: user.grade, mainGoal: user.main_goal, mainProblem: user.main_problem },
      bootstrap: demoStore.bootstrap(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(422).json({ error: error.issues[0]?.message ?? "输入无效", code: "VALIDATION_ERROR" });
      return;
    }
    console.error("Login error:", error);
    res.status(500).json({ error: "登录失败，请稍后再试。", code: "SERVER_ERROR" });
  }
});

authRouter.get("/check", (_req, res) => {
  res.json({ ok: true, storage: "memory" });
});
