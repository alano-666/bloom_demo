import type { DemoState } from "@bloom/shared";
import { createSupabaseAdminClient, isSupabaseConfigured } from "./supabase.js";

const memoryStates = new Map<string, DemoState>();

export const userStateRepository = {
  async get(userId: string): Promise<DemoState | null> {
    if (!isSupabaseConfigured) return memoryStates.get(userId) ?? null;
    const client = createSupabaseAdminClient();
    if (!client) return null;
    const { data, error } = await client
      .from("user_growth_states")
      .select("state")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return (data?.state as DemoState | undefined) ?? null;
  },

  async set(userId: string, state: DemoState): Promise<void> {
    if (!isSupabaseConfigured) {
      memoryStates.set(userId, structuredClone(state));
      return;
    }
    const client = createSupabaseAdminClient();
    if (!client) throw new Error("Supabase is not configured");
    const { error } = await client.from("user_growth_states").upsert(
      { user_id: userId, state, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
    if (error) throw error;
  },
};
