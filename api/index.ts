import express from "express";
import cors from "cors";
import { z } from "zod";
import type {
  CreateGoalInput,
  GoalProgressInput,
  OnboardingInput,
  ReportPeriod,
  SessionMessageInput,
  ThreadCreateInput,
  UpdateProfileInput,
} from "@bloom/shared";
import { demoStore } from "./apps/api/src/store.ts";

const app = express();
app.use(cors());
app.use(express.json());

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
  res.json({ ok: true });
});

app.get("/api/bootstrap", (_req, res) => {
  res.json(demoStore.bootstrap());
});

app.post("/api/onboarding", async (req, res) => {
  const input = onboardingSchema.parse(req.body);
  res.json(await demoStore.submitOnboarding(input));
});

app.patch("/api/profile", async (req, res) => {
  const input = z.object({ name: z.string().min(1), username: z.string().min(1), grade: z.string().min(1), mainGoal: z.string().min(2), mainProblem: z.string().min(2) }).parse(req.body);
  res.json(await demoStore.updateProfile(input));
});

app.post("/api/events/quick-log", async (req, res) => {
  const body = z.object({ content: z.string().min(1) }).parse(req.body);
  res.json(await demoStore.parseQuickLog(body.content));
});

app.post("/api/events/quick-log/parse", async (req, res) => {
  const body = z.object({ content: z.string().min(1) }).parse(req.body);
  res.json(await demoStore.parseQuickLog(body.content));
});

app.get("/api/session/threads", (_req, res) => { res.json(demoStore.listThreads()); });
app.post("/api/session/threads", (req, res) => {
  const body = z.object({ title: z.string().min(1) }).parse(req.body);
  res.json(demoStore.createThread(body.title));
});
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
app.post("/api/dashboard/schedule", (req, res) => {
  const body = z.object({ title: z.string().min(1), time: z.string().min(1) }).parse(req.body);
  res.json(demoStore.addScheduleItem(body.title, body.time));
});
app.patch("/api/dashboard/schedule/:taskId", (req, res) => {
  const body = z.object({ title: z.string().min(1), time: z.string().min(1) }).parse(req.body);
  res.json(demoStore.updateScheduleItem(req.params.taskId, body.title, body.time));
});
app.delete("/api/dashboard/schedule/:taskId", (req, res) => { res.json(demoStore.deleteScheduleItem(req.params.taskId)); });

app.get("/api/goals", (_req, res) => { res.json(demoStore.getState().goals); });
app.post("/api/goals", (req, res) => {
  const body = z.object({ title: z.string().min(1), category: z.enum(["职业", "健康", "学习", "生活"]), targetDate: z.string().min(1), note: z.string().min(1) }).parse(req.body);
  res.json(demoStore.createGoal(body));
});
app.post("/api/goals/:goalId/progress", (req, res) => {
  const body = z.object({ note: z.string().min(1), progressDelta: z.number().min(1).max(20) }).parse(req.body);
  res.json(demoStore.recordGoalProgress(req.params.goalId, body));
});
app.patch("/api/goals/:goalId", (req, res) => {
  const body = z.object({ progress: z.number().min(0).max(100) }).parse(req.body);
  res.json(demoStore.updateGoal(req.params.goalId, body.progress));
});

app.get("/api/settings", (_req, res) => { res.json(demoStore.getState().settings); });
app.patch("/api/settings", (req, res) => {
  const body = z.object({
    reminderEnabled: z.boolean().optional(), reminderWindow: z.string().optional(), eveningReviewTime: z.string().optional(),
    voiceEnabled: z.boolean().optional(), imageEnabled: z.boolean().optional(), personalizedRhythm: z.boolean().optional(),
    darkMode: z.boolean().optional(), fontScale: z.enum(["小", "中", "大"]).optional(), replyStyle: z.enum(["治愈陪伴", "结构清晰", "精准鼓励"]).optional(),
  }).parse(req.body);
  res.json(demoStore.updateSettings(body));
});

export default app;
