import type { DemoState } from "@bloom/shared";
import { createSupabaseAdminClient, isSupabaseConfigured } from "./supabase.js";
import { createEmptyState } from "./seed.js";

const memoryStates = new Map<string, DemoState>();

function normalizeState(state: Partial<DemoState> | null | undefined): DemoState | null {
  if (!state) return null;
  const base = createEmptyState();
  return {
    ...base,
    ...state,
    goals: state.goals ?? base.goals,
    goalLogs: state.goalLogs ?? base.goalLogs,
    goalHistory: state.goalHistory ?? base.goalHistory,
    events: state.events ?? base.events,
    threads: state.threads ?? base.threads,
    messages: state.messages ?? base.messages,
    metrics: state.metrics ?? base.metrics,
    settings: { ...base.settings, ...(state.settings ?? {}) },
  };
}

export const userStateRepository = {
  async get(userId: string): Promise<DemoState | null> {
    if (!isSupabaseConfigured) return normalizeState(memoryStates.get(userId)) ?? null;
    const client = createSupabaseAdminClient();
    if (!client) return null;
    const { data, error } = await client
      .from("user_growth_states")
      .select("state")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return normalizeState((data?.state as Partial<DemoState> | undefined) ?? null);
  },

  async set(userId: string, state: DemoState): Promise<void> {
    const normalized = normalizeState(state)!;
    if (!isSupabaseConfigured) {
      memoryStates.set(userId, structuredClone(normalized));
      return;
    }
    const client = createSupabaseAdminClient();
    if (!client) throw new Error("Supabase is not configured");
    const { error } = await client.from("user_growth_states").upsert(
      { user_id: userId, state: normalized, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
    if (error) throw error;
  },
};
