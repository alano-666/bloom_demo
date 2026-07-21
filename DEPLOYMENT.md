# Bloom Vercel + Supabase 部署

## 1. 创建 Supabase 项目

1. 在 Supabase 创建项目。
2. 打开 SQL Editor，执行：
   `supabase/migrations/202607210001_user_growth_states.sql`
3. 在 Authentication → Providers 中启用 Email。
4. Demo 阶段若希望注册后立即进入，可关闭 Confirm email；正式环境建议开启邮件确认。

## 2. 配置 Vercel 后端

在 Vercel `bloom_demo` 项目的 Production 环境添加：

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ORIGINS=https://alano-666.github.io`
- `ALIBABA_BAILIAN_API_KEY`（可选）

`SUPABASE_SERVICE_ROLE_KEY` 只能配置在 Vercel，禁止添加到 `VITE_*` 或提交到 Git。

重新部署后检查：

```text
https://bloom-demo-git-main-alano-s-projects.vercel.app/api/health
```

预期包含：

```json
{"ok":true,"storage":"supabase","auth":"supabase"}
```

如果返回 `memory-development`，说明 Supabase 环境变量未配置完整，用户数据会在 Vercel 冷启动时丢失。

## 3. GitHub Pages 前端

`.github/workflows/deploy-pages.yml` 已指向 Vercel API。推送 main 后，Pages 会重新构建。

## 4. 验证

1. 注册两个不同账户，填写不同目标。
2. 退出后分别登录，确认 Dashboard / 会话 / 目标 / 轨迹 / 报告互不串数据。
3. 专注页分别测试暂停与结束：暂停按时长更新进度，结束进度变为 100%。
4. 在 Vercel Functions 日志中确认没有 401、500 或 CORS 错误。
