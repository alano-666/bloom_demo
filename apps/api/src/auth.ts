import { Router } from "express";
import { z } from "zod";
import { createSupabaseAdminClient, createSupabaseAuthClient } from "./supabase.js";

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
    const adminClient = createSupabaseAdminClient();
    const anonClient = createSupabaseAuthClient();
    if (!adminClient || !anonClient) {
      res.status(503).json({ code: "AUTH_NOT_CONFIGURED", error: "线上身份服务尚未配置。" });
      return;
    }

    // Use admin API to create user (bypasses rate limits, auto-confirms email)
    const { data: adminUser, error: adminError } = await adminClient.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { username: input.username },
    });

    if (adminError || !adminUser?.user) {
      res.status(400).json({ code: "REGISTER_FAILED", error: adminError?.message ?? "注册失败" });
      return;
    }

    // Sign in as the user to get a session token
    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (signInError || !signInData?.session) {
      // User created but sign-in failed — still return success, frontend will prompt login
      res.json({
        user: { id: adminUser.user.id, email: adminUser.user.email, username: input.username },
        token: null,
        requiresEmailConfirmation: false,
      });
      return;
    }

    res.json({
      user: { id: signInData.user.id, email: signInData.user.email, username: input.username },
      token: signInData.session.access_token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(422).json({ code: "VALIDATION_ERROR", error: error.issues[0]?.message ?? "输入无效" });
      return;
    }
    console.error("Register error:", error);
    res.status(500).json({ code: "SERVER_ERROR", error: "服务暂时不可用。" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const input = loginSchema.parse(req.body);
    const client = createSupabaseAuthClient();
    if (!client) {
      res.status(503).json({ code: "AUTH_NOT_CONFIGURED", error: "线上身份服务尚未配置。" });
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
    console.error("Login error:", error);
    res.status(500).json({ code: "SERVER_ERROR", error: "服务暂时不可用。" });
  }
});

authRouter.get("/check", (_req, res) => {
  res.json({ ok: true, provider: "supabase" });
});
