import axios from "axios";
import type {
  BootstrapResponse,
  CreateGoalInput,
  CreateThreadResponse,
  DashboardData,
  DecomposeTaskResponse,
  FocusCompleteResponse,
  Goal,
  GoalProgressInput,
  PostMessageResponse,
  QuickLogParseResponse,
  ReportData,
  ReportPeriod,
  SessionResponse,
  ThreadCreateInput,
  TrajectoryData,
  UpdateProfileInput,
  UserSettings,
  SessionMessageInput,
} from "@bloom/shared";

import { useAuthStore } from "@/store/useAuthStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.PROD ? "/api" : "http://localhost:8787/api"),
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const apiClient = {
  // Auth endpoints
  register: async (payload: { email: string; username: string; password: string }) =>
    (await api.post<{ user: { id: string; email: string; username: string }; token: string | null; requiresEmailConfirmation?: boolean }>("/auth/register", payload)).data,
  login: async (email: string, password: string) =>
    (await api.post<{ user: { id: string; email: string; username: string }; token: string }>("/auth/login", { email, password })).data,

  getBootstrap: async () => (await api.get<BootstrapResponse>("/bootstrap")).data,
  submitOnboarding: async (payload: Parameters<typeof api.post<BootstrapResponse>>[1]) => (await api.post<BootstrapResponse>("/onboarding", payload)).data,
  updateProfile: async (payload: UpdateProfileInput) => (await api.patch<BootstrapResponse>("/profile", payload)).data,
  quickLog: async (content: string) => (await api.post<BootstrapResponse>("/events/quick-log", { content })).data,
  parseQuickLog: async (content: string) => (await api.post<QuickLogParseResponse>("/events/quick-log/parse", { content })).data,
  getThreads: async () => (await api.get<BootstrapResponse["recentThreads"]>("/session/threads")).data,
  createThread: async (payload: ThreadCreateInput) => (await api.post<CreateThreadResponse>("/session/threads", payload)).data,
  deleteThread: async (threadId: string) => (await api.delete<{ ok: boolean }>(`/session/threads/${threadId}`)).data,
  getSession: async (threadId: string) => (await api.get<SessionResponse>(`/session/${threadId}`)).data,
  postMessage: async (payload: SessionMessageInput) => (await api.post<PostMessageResponse>("/session/message", payload)).data,
  generateCoreTask: async () => (await api.post<DashboardData["dailyPlan"]>("/dashboard/core-task/generate")).data,
  decomposeTask: async () => (await api.post<DecomposeTaskResponse>("/dashboard/core-task/decompose")).data,
  completeFocus: async (minutes: number, markDone = true) => (await api.post<FocusCompleteResponse>("/dashboard/focus/complete", { minutes, markDone })).data,
  addScheduleItem: async (title: string, time: string) => (await api.post<DashboardData>("/dashboard/schedule", { title, time })).data,
  updateScheduleItem: async (taskId: string, title: string, time: string) => (await api.patch<DashboardData>(`/dashboard/schedule/${taskId}`, { title, time })).data,
  deleteScheduleItem: async (taskId: string) => (await api.delete<DashboardData>(`/dashboard/schedule/${taskId}`)).data,
  getTrajectory: async () => (await api.get<TrajectoryData>("/trajectory")).data,
  getReport: async (period: ReportPeriod) => (await api.get<ReportData>(`/reports?period=${period}`)).data,
  createGoal: async (payload: CreateGoalInput) => (await api.post<Goal[]>("/goals", payload)).data,
  updateGoal: async (goalId: string, progress: number) => (await api.patch<Goal[]>(`/goals/${goalId}`, { progress })).data,
  recordGoalProgress: async (goalId: string, payload: GoalProgressInput) =>
    (await api.post<{ goals: Goal[]; dashboard: DashboardData; trajectory: TrajectoryData; reportSummary: ReportData }>(`/goals/${goalId}/progress`, payload)).data,
  updateSettings: async (payload: Partial<UserSettings>) => (await api.patch<UserSettings>("/settings", payload)).data,
};
