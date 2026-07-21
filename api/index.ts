/**
 * Standalone Vercel serverless entry point.
 * Does NOT use better-sqlite3 (native addon) — uses in-memory store instead.
 */
import express from "express";
import cors from "cors";
import { z } from "zod";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import type {
  CreateGoalInput,
  GoalProgressInput,
  OnboardingInput,
  ReportPeriod,
  SessionMessageInput,
  ThreadCreateInput,
  UpdateProfileInput,
} from "@bloom/shared";
import { demoStore } from "./apps/api/src/store.js";

const app = express();
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());

// ---------- In-memory user store (no SQLite on Vercel) ----------
interface DbUser {
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

const users = new Map<string, DbUser>(); // email -> user
let nextUserId = 1;

// ---------- Rate limiters ----------
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "注册过于频繁，请稍后再试。", code: "IP_BLOCKED" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "登录尝试过于频繁，请 15 分钟后再试。", code: "IP_BLOCKED" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});

// ---------- Auth routes ----------
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
app.post("/api/auth/register", registerLimiter, async (req, res) => {
  try {
    const body = registerSchema.parse(req.body);
    if (users.has(body.email)) {
      res.status(409).json({ error: "该邮箱已注册，请直接登录。", code: "EMAIL_EXISTS" });
      return;
    }
    const passwordHash = await bcrypt.hash(body.password, 12);
    const id = nextUserId++;
    users.set(body.email, {
      id,
      email: body.email,
      username: body.username,
      password_hash: passwordHash,
      failed_attempts: 0,
      locked_until: null,
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

    res.json({ user: { id, email: body.email, username: body.username }, bootstrap });
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
app.post("/api/auth/login", loginLimiter, async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = users.get(body.email);

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
      user.failed_attempts = 0;
      user.locked_until = null;
    }

    const valid = await bcrypt.compare(body.password, user.password_hash);
    if (!valid) {
      user.failed_attempts += 1;
      if (user.failed_attempts >= 5) {
        user.locked_until = new Date(Date.now() + 3 * 60 * 1000).toISOString();
        res.status(429).json({ error: "密码错误次数过多，账号已锁定，请 3 分钟后再试。", code: "ACCOUNT_LOCKED", lockedUntil: user.locked_until });
        return;
      }
      const remaining = 5 - user.failed_attempts;
      res.status(401).json({ error: `密码错误，还剩 ${remaining} 次尝试机会。`, code: "WRONG_PASSWORD", remainingAttempts: remaining });
      return;
    }

    user.failed_attempts = 0;
    user.locked_until = null;

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

// Health check
app.get("/api/auth/check", (_req, res) => {
  res.json({ ok: true, message: "Auth service is running" });
});

// ---------- Core API routes ----------
const onboardingSchema = z.object({
  name: z.string().min(1),
  username: z.string().optional(),
  email: z.string().email().optional(),
  age: z.number().min(16).max(80).optional(),
  grade: z.string().min(1),
  stage: z.enum(["学生", "求职", "职场", "创业"]).optional(),
  growthDirection: z.enum(["职业", "健康", "学习", "生活"]).optional(),
  longTermGoal: z.string().min(2),
  currentChallenge: z.string().min(2),
  mainGoal: z.string().optional(),
  mainProblem: z.string().optional(),
});

const attachmentSchema = z.object({
  id: z.string(),
  type: z.enum(["file", "image", "audio"]),
  name: z.string(),
  previewText: z.string().optional(),
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, aiProvider: process.env.ALIBABA_BAILIAN_API_KEY ? "bailian" : process.env.ZAI_API_KEY ? "zhipu" : "fallback" });
});

app.get("/api/bootstrap", (_req, res) => { res.json(demoStore.bootstrap()); });
app.post("/api/onboarding", async (req, res) => { res.json(await demoStore.submitOnboarding(onboardingSchema.parse(req.body))); });
app.patch("/api/profile", async (req, res) => { res.json(await demoStore.updateProfile(z.object({ name: z.string().min(1), username: z.string().min(1), grade: z.string().min(1), mainGoal: z.string().min(2), mainProblem: z.string().min(2) }).parse(req.body))); });
app.post("/api/events/quick-log", async (req, res) => { res.json(await demoStore.parseQuickLog(z.object({ content: z.string().min(1) }).parse(req.body).content)); });
app.post("/api/events/quick-log/parse", async (req, res) => { res.json(await demoStore.parseQuickLog(z.object({ content: z.string().min(1) }).parse(req.body).content)); });
app.get("/api/session/threads", (_req, res) => { res.json(demoStore.listThreads()); });
app.post("/api/session/threads", (req, res) => { res.json(demoStore.createThread(z.object({ title: z.string().min(1) }).parse(req.body).title)); });
app.get("/api/session/:threadId", (req, res) => { res.json(demoStore.getSession(req.params.threadId)); });
app.post("/api/session/message", async (req, res) => {
  const body = z.object({ threadId: z.string().min(1), content: z.string().min(1), attachments: z.array(attachmentSchema).optional() }).parse(req.body);
  res.json(await demoStore.postMessage(body));
});
app.get("/api/trajectory", (_req, res) => { res.json(demoStore.buildTrajectory()); });
app.get("/api/reports", (req, res) => {
  const period = z.enum(["week", "month", "quarter", "year"]).parse((req.query.period as ReportPeriod | undefined) ?? "week");
  res.json(demoStore.buildReport(period));
});
app.post("/api/dashboard/core-task/generate", async (_req, res) => { res.json(await demoStore.generateCoreTask()); });
app.post("/api/dashboard/core-task/decompose", async (_req, res) => { res.json(await demoStore.decomposeTask()); });
app.post("/api/dashboard/focus/complete", async (req, res) => {
  const body = z.object({ minutes: z.number().min(5).max(240), markDone: z.boolean().optional() }).parse(req.body);
  res.json(await demoStore.completeFocus(body.minutes, body.markDone ?? true));
});
app.post("/api/dashboard/schedule", (req, res) => { res.json(demoStore.addScheduleItem(z.object({ title: z.string().min(1), time: z.string().min(1) }).parse(req.body).title, req.body.time)); });
app.patch("/api/dashboard/schedule/:taskId", (req, res) => { res.json(demoStore.updateScheduleItem(req.params.taskId, z.object({ title: z.string().min(1), time: z.string().min(1) }).parse(req.body).title, req.body.time)); });
app.delete("/api/dashboard/schedule/:taskId", (req, res) => { res.json(demoStore.deleteScheduleItem(req.params.taskId)); });
app.get("/api/goals", (_req, res) => { res.json(demoStore.getState().goals); });
app.post("/api/goals", (req, res) => { res.json(demoStore.createGoal(z.object({ title: z.string().min(1), category: z.enum(["职业", "健康", "学习", "生活"]), targetDate: z.string().min(1), note: z.string().min(1) }).parse(req.body))); });
app.post("/api/goals/:goalId/progress", (req, res) => { res.json(demoStore.recordGoalProgress(req.params.goalId, z.object({ note: z.string().min(1), progressDelta: z.number().min(1).max(20) }).parse(req.body))); });
app.patch("/api/goals/:goalId", (req, res) => { res.json(demoStore.updateGoal(req.params.goalId, z.object({ progress: z.number().min(0).max(100) }).parse(req.body).progress)); });
app.get("/api/settings", (_req, res) => { res.json(demoStore.getState().settings); });
app.patch("/api/settings", (req, res) => {
  res.json(demoStore.updateSettings(z.object({
    reminderEnabled: z.boolean().optional(), reminderWindow: z.string().optional(), eveningReviewTime: z.string().optional(),
    voiceEnabled: z.boolean().optional(), imageEnabled: z.boolean().optional(), personalizedRhythm: z.boolean().optional(),
    darkMode: z.boolean().optional(), fontScale: z.enum(["小", "中", "大"]).optional(), replyStyle: z.enum(["治愈陪伴", "结构清晰", "精准鼓励"]).optional(),
  }).parse(req.body)));
});

export default app;
