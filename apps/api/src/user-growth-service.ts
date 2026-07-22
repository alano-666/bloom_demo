import type {
  CreateGoalInput,
  GoalProgressInput,
  OnboardingInput,
  ReportPeriod,
  SessionMessageInput,
  UpdateProfileInput,
} from "@bloom/shared";
import { createEmptyState } from "./seed.js";
import { DemoStore } from "./store.js";
import { userStateRepository } from "./user-state-repository.js";

async function loadStore(userId: string) {
  const state = await userStateRepository.get(userId);
  return new DemoStore(state ?? createEmptyState());
}

async function mutate<T>(userId: string, action: (store: DemoStore) => T | Promise<T>) {
  const store = await loadStore(userId);
  const result = await action(store);
  await userStateRepository.set(userId, store.snapshot());
  return result;
}

export const userGrowthService = {
  async bootstrap(userId: string) {
    return (await loadStore(userId)).bootstrap();
  },
  async submitOnboarding(userId: string, input: OnboardingInput) {
    return mutate(userId, (store) => store.submitOnboarding(input));
  },
  async updateProfile(userId: string, input: UpdateProfileInput) {
    return mutate(userId, (store) => store.updateProfile(input));
  },
  async listThreads(userId: string) {
    return (await loadStore(userId)).listThreads();
  },
  async createThread(userId: string, title: string) {
    return mutate(userId, (store) => store.createThread(title));
  },
  async getSession(userId: string, threadId: string) {
    return (await loadStore(userId)).getSession(threadId);
  },
  async postMessage(userId: string, input: SessionMessageInput) {
    return mutate(userId, (store) => store.postMessage(input));
  },
  async deleteThread(userId: string, threadId: string) {
    return mutate(userId, (store) => store.deleteThread(threadId));
  },
  async buildTrajectory(userId: string) {
    return (await loadStore(userId)).buildTrajectory();
  },
  async buildReport(userId: string, period: ReportPeriod) {
    return (await loadStore(userId)).buildReport(period);
  },
  async generateCoreTask(userId: string) {
    return mutate(userId, (store) => store.generateCoreTask());
  },
  async decomposeTask(userId: string) {
    return mutate(userId, (store) => store.decomposeTask());
  },
  async completeFocus(userId: string, minutes: number, markDone: boolean) {
    return mutate(userId, (store) => store.completeFocus(minutes, markDone));
  },
  async addScheduleItem(userId: string, title: string, time: string) {
    return mutate(userId, (store) => store.addScheduleItem(title, time));
  },
  async updateScheduleItem(userId: string, taskId: string, title: string, time: string) {
    return mutate(userId, (store) => store.updateScheduleItem(taskId, title, time));
  },
  async deleteScheduleItem(userId: string, taskId: string) {
    return mutate(userId, (store) => store.deleteScheduleItem(taskId));
  },
  async getGoals(userId: string) {
    return (await loadStore(userId)).getState().goals;
  },
  async createGoal(userId: string, input: CreateGoalInput) {
    return mutate(userId, (store) => store.createGoal(input));
  },
  async recordGoalProgress(userId: string, goalId: string, input: GoalProgressInput) {
    return mutate(userId, (store) => store.recordGoalProgress(goalId, input));
  },
  async updateGoal(userId: string, goalId: string, progress: number) {
    return mutate(userId, (store) => store.updateGoal(goalId, progress));
  },
  async getSettings(userId: string) {
    return (await loadStore(userId)).getState().settings;
  },
  async updateSettings(userId: string, input: Parameters<DemoStore["updateSettings"]>[0]) {
    return mutate(userId, (store) => store.updateSettings(input));
  },
  async parseQuickLog(userId: string, content: string) {
    return mutate(userId, (store) => store.parseQuickLog(content));
  },
};
