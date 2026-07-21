import { Router } from "express";
import { z } from "zod";
import { createSupabaseAuthClient, isSupabaseConfigured } from "./supabase.js";

const registerSchema = z.object({
  email: z.string().email("请输入有效邮箱"),
  username: z.string().min(1),
  password: z.string().min(6, "密码至少需要 6 个字符"),
});

const loginSchema = z.object({
  email: z.string().email("请输入有效邮箱"),
  password: z.string().min(1),
});

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  try {
    const input = registerSchema.parse(req.body);
    const client = createSupabaseAuthClient();
    if (!client) {
      if (process.env.VERCEL) {
        res.status(503).json({ code: "AUTH_NOT_CONFIGURED", error: "线上身份服务尚未配置，请联系管理员。" });
        return;
      }
      const id = `local-${Buffer.from(input.email).toString("base64url")}`;
      res.json({ user: { id, email: input.email, username: input.username }, token: `local:${id}` });
      return;
    }
    const { data, error } = await client.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { username: input.username } },
    });
    if (error || !data.user) {
      res.status(400).json({ code: "REGISTER_FAILED", error: error?.message ?? "注册失败" });
      return;
    }
    res.json({
      user: { id: data.user.id, email: data.user.email, username: input.username },
      token: data.session?.access_token ?? null,
      requiresEmailConfirmation: !data.session,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(422).json({ code: "VALIDATION_ERROR", error: error.issues[0]?.message ?? "输入无效" });
      return;
    }
    throw error;
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const input = loginSchema.parse(req.body);
    const client = createSupabaseAuthClient();
    if (!client) {
      if (process.env.VERCEL) {
        res.status(503).json({ code: "AUTH_NOT_CONFIGURED", error: "线上身份服务尚未配置，请联系管理员。" });
        return;
      }
      const id = `local-${Buffer.from(input.email).toString("base64url")}`;
      res.json({ user: { id, email: input.email, username: input.email.split("@")[0] }, token: `local:${id}` });
      return;
    }
    const { data, error } = await client.auth.signInWithPassword(input);
    if (error || !data.user || !data.session) {
      res.status(401).json({ code: "INVALID_CREDENTIALS", error: "邮箱或密码错误。" });
      return;
    }
    res.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        username: String(data.user.user_metadata.username ?? data.user.email?.split("@")[0] ?? "Bloom User"),
      },
      token: data.session.access_token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(422).json({ code: "VALIDATION_ERROR", error: error.issues[0]?.message ?? "输入无效" });
      return;
    }
    throw error;
  }
});

authRouter.get("/check", (_req, res) => {
  res.json({ ok: true, provider: isSupabaseConfigured ? "supabase" : "local-development" });
});
