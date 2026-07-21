import type { NextFunction, Request, Response } from "express";
import { createSupabaseAuthClient, isSupabaseConfigured } from "./supabase.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function requireUser(req: Request, res: Response, next: NextFunction) {
  const authorization = req.header("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) {
    res.status(401).json({ code: "UNAUTHORIZED", error: "请先登录后再访问。" });
    return;
  }

  if (!isSupabaseConfigured && token.startsWith("local:") && !process.env.VERCEL) {
    req.userId = token.slice(6);
    next();
    return;
  }

  const client = createSupabaseAuthClient();
  if (!client) {
    res.status(503).json({ code: "AUTH_NOT_CONFIGURED", error: "线上身份服务尚未配置。" });
    return;
  }

  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ code: "INVALID_SESSION", error: "登录状态已失效，请重新登录。" });
    return;
  }
  req.userId = data.user.id;
  next();
}
