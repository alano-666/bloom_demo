# Bloom 完整配置文档

## 项目概览

Bloom 是一个 AI 成长陪伴应用，帮助用户记录目标、与 AI 对话、追踪成长轨迹并生成周期报告。

**技术栈**：React 19 + TypeScript + Vite（前端）、Express 5 + TypeScript（后端）、Supabase（认证与数据库）、Vercel（后端部署）、GitHub Pages（前端部署）

**仓库**：`https://github.com/alano-666/bloom_demo`

**前端 URL**：`https://alano-666.github.io/bloom_demo/`

**后端 API**：`https://bloom-demo-api.vercel.app/api`

---

## 本地开发

```bash
git clone https://github.com/alano-666/bloom_demo.git
cd bloom_demo
npm install
npm run dev
```

### 环境变量（本地 `.env.local`）

```
SUPABASE_URL=https://vocywpbwyvrleswchjde.supabase.co
SUPABASE_ANON_KEY=sb_publishable_dExAy3q8ibqaV2IX48tccA_WRREG50b
SUPABASE_SERVICE_ROLE_KEY=从 Supabase 后台获取
ALIBABA_BAILIAN_API_KEY=...
ZAI_API_KEY=...
CORS_ORIGINS=http://localhost:5173
```

不配置 Supabase 也可以本地运行，会自动回退到内存存储模式。

---

## 1. Supabase 配置

### 项目信息

| 配置项 | 值 |
|---|---|
| Project URL | `https://vocywpbwyvrleswchjde.supabase.co` |
| Anon Key | `sb_publishable_dExAy3q8ibqaV2IX48tccA_WRREG50b` |
| Service Role Key | 从 Supabase 项目后台获取 |

### 数据库迁移

在 Supabase SQL Editor 中执行：

```sql
create table if not exists public.user_growth_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_growth_states enable row level security;

create policy "users read own growth state"
on public.user_growth_states for select
using (auth.uid() = user_id);

create policy "users insert own growth state"
on public.user_growth_states for insert
with check (auth.uid() = user_id);

create policy "users update own growth state"
on public.user_growth_states for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

### Auth 设置

- Authentication → Providers → Email：已启用
- Email confirm：注册时自动确认（通过 admin API）

---

## 2. Vercel 后端配置

### 项目信息

| 配置项 | 值 |
|---|---|
| 项目名 | `bloom-demo-api` |
| Framework | Other |
| Root Directory | `.` |
| Node.js | 22.x |
| Build Command | `npm run build --workspace @bloom/shared && npm run build --workspace @bloom/api` |
| Output Directory | `.` |
| Install Command | `npm install` |

### 环境变量（Production）

| Key | 说明 |
|---|---|
| `SUPABASE_URL` | `https://vocywpbwyvrleswchjde.supabase.co` |
| `SUPABASE_ANON_KEY` | `sb_publishable_dExAy3q8ibqaV2IX48tccA_WRREG50b` |
| `SUPABASE_SERVICE_ROLE_KEY` | 从 Supabase 后台获取 |
| `CORS_ORIGINS` | `https://alano-666.github.io` |
| `ALIBABA_BAILIAN_API_KEY` | 可选，Bailian AI API key |
| `ZAI_API_KEY` | 可选，智谱 AI API key |

### Deployment Protection

- SSO Protection：已关闭
- Git Fork Protection：已开启

---

## 3. GitHub Pages 前端配置

### Workflow：`.github/workflows/deploy-pages.yml`

- 构建时注入 `VITE_API_BASE_URL=https://bloom-demo-api.vercel.app/api`
- 产物目录：`apps/web/dist`

---

## 4. AI 回复模板

AI 回复遵循长期陪伴成长・全场景回答模板，涵盖 8 个场景：

1. **学习规划类** — 日计划 / 阶段计划 / 路线咨询
2. **知识点疑问类** — 语法 / 原理 / 多语言对比
3. **代码报错类** — Debug / 排错 / 运行异常
4. **学习状态波动类** — 疲惫 / 焦虑 / 效率低
5. **复盘总结类** — 当日复盘 / 阶段复盘
6. **面试/考点类** — 考点梳理 / 面试题准备
7. **决策选择类** — 技术选型 / 学习优先级
8. **项目实操类** — 练手项目推荐 / 实现思路

模板文件定义在 `apps/api/src/ai/prompt-builder.ts`，语气基调：沉稳务实、共情前置、技术干货为主、无空洞鸡汤、结尾带陪伴感收尾。

---

## 5. 测试账号

当前无固定测试账号。每个用户通过注册页面独立注册，数据按 `user_id` 隔离存储在 Supabase。

如需快速体验，可在注册页面用任意真实格式邮箱注册（如 `test@example.com`），密码 6 位以上。

---

## 6. 验证清单

- [ ] 注册两个不同账户，分别填写不同的成长目标
- [ ] 退出后分别登录，确认 Dashboard / 会话 / 目标 / 轨迹 / 报告互不串数据
- [ ] 专注页测试暂停与结束：暂停按时长更新进度，结束进度变为 100%
- [ ] 今日任务可点击"编辑任务"手动修改标题和副标题
- [ ] 轨迹页能力雷达维度随用户目标动态变化
- [ ] 习惯和情绪展示使用进度条与编号的增强 UI
- [ ] 新建目标可正常保存（带错误提示）
- [ ] Vercel Functions 日志中无 401、500 或 CORS 错误
- [ ] `/api/health` 返回 `{"storage":"supabase","auth":"supabase"}`
