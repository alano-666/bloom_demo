import express from "express";
import cors from "cors";
import { z } from "zod";
import { loadLocalEnv } from "./load-env.js";
import type { ReportPeriod } from "@bloom/shared";
import { authRouter } from "./auth.js";
import { requireUser } from "./require-user.js";
import { userGrowthService } from "./user-growth-service.js";
import { isSupabaseConfigured } from "./supabase.js";

loadLocalEnv();

const app = express();
const port = process.env.PORT ?? 8787;
const allowedOrigins = new Set([
  "http://localhost:5173",
  "https://alano-666.github.io",
  ...(process.env.CORS_ORIGINS ?? "").split(",").map((item) => item.trim()).filter(Boolean),
]);

app.set("trust proxy", 1);
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)) }));
app.use(express.json());
app.use("/api/auth", authRouter);

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
  id: z.string(), type: z.enum(["file", "image", "audio"]), name: z.string(), previewText: z.string().optional(),
});
const profileSchema = z.object({
  name: z.string().min(1), username: z.string().min(1), grade: z.string().min(1), mainGoal: z.string().min(2), mainProblem: z.string().min(2),
});
const settingsSchema = z.object({
  reminderEnabled: z.boolean().optional(), reminderWindow: z.string().optional(), eveningReviewTime: z.string().optional(),
  voiceEnabled: z.boolean().optional(), imageEnabled: z.boolean().optional(), personalizedRhythm: z.boolean().optional(),
  darkMode: z.boolean().optional(), fontScale: z.enum(["小", "中", "大"]).optional(), replyStyle: z.enum(["治愈陪伴", "结构清晰", "精准鼓励"]).optional(),
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    storage: isSupabaseConfigured ? "supabase" : "memory-development",
    auth: isSupabaseConfigured ? "supabase" : "local-development",
    aiProvider: process.env.ALIBABA_BAILIAN_API_KEY ? "bailian" : process.env.ZAI_API_KEY ? "zhipu" : "fallback",
  });
});

app.use("/api", requireUser);
const userId = (req: express.Request) => req.userId!;

app.get("/api/bootstrap", async (req, res) => res.json(await userGrowthService.bootstrap(userId(req))));
app.post("/api/onboarding", async (req, res) => res.json(await userGrowthService.submitOnboarding(userId(req), onboardingSchema.parse(req.body))));
app.patch("/api/profile", async (req, res) => res.json(await userGrowthService.updateProfile(userId(req), profileSchema.parse(req.body))));
app.post("/api/events/quick-log", async (req, res) => res.json(await userGrowthService.parseQuickLog(userId(req), z.object({ content: z.string().min(1) }).parse(req.body).content)));
app.post("/api/events/quick-log/parse", async (req, res) => res.json(await userGrowthService.parseQuickLog(userId(req), z.object({ content: z.string().min(1) }).parse(req.body).content)));
app.get("/api/session/threads", async (req, res) => res.json(await userGrowthService.listThreads(userId(req))));
app.post("/api/session/threads", async (req, res) => res.json(await userGrowthService.createThread(userId(req), z.object({ title: z.string().min(1) }).parse(req.body).title)));
app.delete("/api/session/threads/:threadId", async (req, res) => res.json(await userGrowthService.deleteThread(userId(req), req.params.threadId)));
app.get("/api/session/:threadId", async (req, res) => res.json(await userGrowthService.getSession(userId(req), req.params.threadId)));
app.post("/api/session/message", async (req, res) => {
  const body = z.object({ threadId: z.string().min(1), content: z.string().min(1), attachments: z.array(attachmentSchema).optional() }).parse(req.body);
  res.json(await userGrowthService.postMessage(userId(req), body));
});
app.get("/api/trajectory", async (req, res) => res.json(await userGrowthService.buildTrajectory(userId(req))));
app.get("/api/reports", async (req, res) => {
  const period = z.enum(["week", "month", "quarter", "year"]).parse((req.query.period as ReportPeriod | undefined) ?? "week");
  res.json(await userGrowthService.buildReport(userId(req), period));
});
app.post("/api/dashboard/core-task/generate", async (req, res) => res.json(await userGrowthService.generateCoreTask(userId(req))));
app.post("/api/dashboard/core-task/decompose", async (req, res) => res.json(await userGrowthService.decomposeTask(userId(req))));
app.post("/api/dashboard/focus/complete", async (req, res) => {
  const body = z.object({ minutes: z.number().min(5).max(240), markDone: z.boolean().optional() }).parse(req.body);
  res.json(await userGrowthService.completeFocus(userId(req), body.minutes, body.markDone ?? true));
});
app.post("/api/dashboard/schedule", async (req, res) => {
  const body = z.object({ title: z.string().min(1), time: z.string().min(1) }).parse(req.body);
  res.json(await userGrowthService.addScheduleItem(userId(req), body.title, body.time));
});
app.patch("/api/dashboard/schedule/:taskId", async (req, res) => {
  const body = z.object({ title: z.string().min(1), time: z.string().min(1) }).parse(req.body);
  res.json(await userGrowthService.updateScheduleItem(userId(req), req.params.taskId, body.title, body.time));
});
app.delete("/api/dashboard/schedule/:taskId", async (req, res) => res.json(await userGrowthService.deleteScheduleItem(userId(req), req.params.taskId)));
app.get("/api/goals", async (req, res) => res.json(await userGrowthService.getGoals(userId(req))));
app.post("/api/goals", async (req, res) => res.json(await userGrowthService.createGoal(userId(req), z.object({ title: z.string().min(1), category: z.enum(["职业", "健康", "学习", "生活"]), targetDate: z.string().min(1), note: z.string().min(1) }).parse(req.body))));
app.post("/api/goals/:goalId/progress", async (req, res) => res.json(await userGrowthService.recordGoalProgress(userId(req), req.params.goalId, z.object({ note: z.string().min(1), progressDelta: z.number().min(1).max(20) }).parse(req.body))));
app.patch("/api/goals/:goalId", async (req, res) => res.json(await userGrowthService.updateGoal(userId(req), req.params.goalId, z.object({ progress: z.number().min(0).max(100) }).parse(req.body).progress)));
app.get("/api/settings", async (req, res) => res.json(await userGrowthService.getSettings(userId(req))));
app.patch("/api/settings", async (req, res) => res.json(await userGrowthService.updateSettings(userId(req), settingsSchema.parse(req.body))));

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof z.ZodError) {
    res.status(422).json({ code: "VALIDATION_ERROR", error: error.issues[0]?.message ?? "输入无效" });
    return;
  }
  console.error(error);
  res.status(500).json({ code: "SERVER_ERROR", error: "服务暂时不可用，请稍后重试。" });
});

export { app };
if (!process.env.VERCEL) {
  app.listen(port, () => console.log(`Bloom API listening on port ${port}`));
}
