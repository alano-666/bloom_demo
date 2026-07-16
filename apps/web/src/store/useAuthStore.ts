import { create } from "zustand";

interface RegisterDraft {
  email: string;
  username: string;
  verificationCode: string;
  grade: string;
  mainGoal: string;
  mainProblem: string;
}

interface AuthState {
  isAuthenticated: boolean;
  authMode: "login" | "register";
  email: string;
  username: string;
  countdown: number;
  registerDraft: RegisterDraft;
  setAuthMode: (mode: "login" | "register") => void;
  setCountdown: (value: number) => void;
  hydrate: () => void;
  login: (payload: { email: string; username?: string }) => void;
  syncProfile: (payload: { email?: string; username: string }) => void;
  logout: () => void;
  updateDraft: (payload: Partial<RegisterDraft>) => void;
}

const AUTH_KEY = "bloom-auth";

const persistAuth = (payload: Pick<AuthState, "isAuthenticated" | "email" | "username">) => {
  localStorage.setItem(AUTH_KEY, JSON.stringify(payload));
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  authMode: "login",
  email: "",
  username: "",
  countdown: 0,
  registerDraft: {
    email: "",
    username: "",
    verificationCode: "",
    grade: "",
    mainGoal: "",
    mainProblem: "",
  },
  setAuthMode: (authMode) => set({ authMode }),
  setCountdown: (countdown) => set({ countdown }),
  hydrate: () => {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { isAuthenticated: boolean; email: string; username: string };
      set({
        isAuthenticated: parsed.isAuthenticated,
        email: parsed.email,
        username: parsed.username,
      });
    } catch {
      localStorage.removeItem(AUTH_KEY);
    }
  },
  login: ({ email, username }) => {
    const payload = {
      isAuthenticated: true,
      email,
      username: username ?? email.split("@")[0] ?? "Bloom User",
    };
    persistAuth(payload);
    set(payload);
  },
  syncProfile: ({ email, username }) =>
    set((state) => {
      const payload = {
        isAuthenticated: state.isAuthenticated,
        email: email ?? state.email,
        username,
      };
      persistAuth(payload);
      return payload;
    }),
  logout: () => {
    localStorage.removeItem(AUTH_KEY);
    set({
      isAuthenticated: false,
      email: "",
      username: "",
      countdown: 0,
      authMode: "login",
      registerDraft: {
        email: "",
        username: "",
        verificationCode: "",
        grade: "",
        mainGoal: "",
        mainProblem: "",
      },
    });
  },
  updateDraft: (payload) =>
    set((state) => ({
      registerDraft: {
        ...state.registerDraft,
        ...payload,
      },
    })),
}));
