import { create } from "zustand";
import type {
  BootstrapResponse,
  CreateThreadResponse,
  DashboardData,
  Goal,
  PostMessageResponse,
  ReportData,
  SessionResponse,
  TrajectoryData,
  UserProfile,
  UserSettings,
} from "@bloom/shared";

interface BloomState {
  bootstrap: BootstrapResponse | null;
  session: SessionResponse | null;
  trajectory: TrajectoryData | null;
  report: ReportData | null;
  activeThreadId: string | null;
  profileModalOpen: boolean;
  setBootstrap: (payload: BootstrapResponse) => void;
  setSession: (payload: SessionResponse) => void;
  setTrajectory: (payload: TrajectoryData) => void;
  setReport: (payload: ReportData) => void;
  setActiveThreadId: (threadId: string | null) => void;
  setProfileModalOpen: (open: boolean) => void;
  mergeFromMessage: (payload: PostMessageResponse) => void;
  mergeQuickLog: (payload: { bootstrap: BootstrapResponse; trajectory: TrajectoryData; reportSummary: ReportData }) => void;
  setCreatedThread: (payload: CreateThreadResponse) => void;
  updateSettings: (settings: UserSettings) => void;
  updateProfile: (profile: UserProfile) => void;
  updateGoals: (goals: Goal[]) => void;
  updateDashboard: (dashboard: DashboardData) => void;
}

export const useBloomStore = create<BloomState>((set) => ({
  bootstrap: null,
  session: null,
  trajectory: null,
  report: null,
  activeThreadId: null,
  profileModalOpen: false,
  setBootstrap: (payload) =>
    set((state) => ({
      bootstrap: payload,
      report: payload.reportSummary ?? null,
      activeThreadId: state.activeThreadId ?? payload.recentThreads[0]?.id ?? null,
    })),
  setSession: (payload) => set({ session: payload, activeThreadId: payload.thread.id }),
  setTrajectory: (payload) => set({ trajectory: payload }),
  setReport: (payload) => set({ report: payload }),
  setActiveThreadId: (threadId) => set({ activeThreadId: threadId }),
  setProfileModalOpen: (open) => set({ profileModalOpen: open }),
  mergeFromMessage: (payload) =>
    set((state) => ({
      session: payload.session,
      trajectory: payload.trajectory,
      report: payload.reportSummary,
      activeThreadId: payload.session.thread.id,
      bootstrap: state.bootstrap
        ? {
            ...state.bootstrap,
            dashboard: payload.dashboard,
            goals: payload.goals,
            reportSummary: payload.reportSummary,
            recentThreads: state.bootstrap.recentThreads.map((thread) =>
              thread.id === payload.session.thread.id ? payload.session.thread : thread,
            ),
          }
        : state.bootstrap,
    })),
  mergeQuickLog: (payload) =>
    set({
      bootstrap: payload.bootstrap,
      trajectory: payload.trajectory,
      report: payload.reportSummary,
    }),
  setCreatedThread: (payload) =>
    set((state) => ({
      session: payload.session,
      activeThreadId: payload.thread.id,
      bootstrap: state.bootstrap
        ? {
            ...state.bootstrap,
            recentThreads: payload.threads,
          }
        : state.bootstrap,
    })),
  updateSettings: (settings) =>
    set((state) => ({
      bootstrap: state.bootstrap ? { ...state.bootstrap, settings } : state.bootstrap,
    })),
  updateProfile: (profile) =>
    set((state) => ({
      bootstrap: state.bootstrap ? { ...state.bootstrap, profile } : state.bootstrap,
    })),
  updateGoals: (goals) =>
    set((state) => ({
      bootstrap: state.bootstrap ? { ...state.bootstrap, goals } : state.bootstrap,
    })),
  updateDashboard: (dashboard) =>
    set((state) => ({
      bootstrap: state.bootstrap ? { ...state.bootstrap, dashboard } : state.bootstrap,
    })),
}));
