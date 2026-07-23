# Bloom 项目现状 · 25 Jul 2026

## 部署
- 前端: GitHub Pages → https://alano-666.github.io/bloom_demo/
- API:  Vercel Serverless → https://bloom-demo-api.vercel.app/api
- DB:   Supabase → https://vocywpbwyvrleswchjde.supabase.co

## 已知网络问题
- Vercel 域名 bloom-demo-api.vercel.app 从中国大陆网络直连**超时**
- GitHub Pages alano-666.github.io 间歇性可访问
- 挂梯子后全部正常
- 如果你的浏览器无法登录，请确保浏览器流量也经过梯子

## 当前实现的功能

### UI
- 核心任务可编辑标题（点击「编辑任务标题」）
- 专注模式：暂停/结束后 progress / 成长值 / 累计时长即时更新；失败时保留遮罩并显示错误
- 对话侧栏 hover 红色垃圾桶删除按钮，含二次确认 + 消息/事件清理
- 新建对话防重复提交（isSubmitting + 创建中...）
- 日程空标题时保存按钮 disabled；AI 来源统一标记为「AI 解析」而非 parsed
- 成长轨迹雷达维度从用户目标动态推导
- 习惯列表彩色编号卡片 + 情绪栏进度条
- 64px / 32px / 16px favicon + apple-touch-icon + manifest.json
- 语音 (Web Speech API) / 文件 (FileReader) / 图片 (base64) 上传入口
- 侧栏头像与用户名实时同步

### Backend
- Supabase Auth 注册（admin API 自动确认 + 签发 session token）
- requireUser 中间件验证 JWT
- 按 userId 隔离成长状态（bootstrap/session/goals/trajectory/reports/settings）
- DELETE /api/session/threads/:threadId 清理消息和事件
- POST /api/session/evening-summary 晚间总结 API（自动生成今日回顾 + 轻量追问）
- 目标历史追踪：修改 mainGoal/mainProblem 时记录 GoalHistoryEntry，显示在季报和年报中
- 日程 source 统一为 ai / manual
- fallback AI 覆盖 7 场景（代码报错/情绪波动/学习规划/复盘总结/知识问答/计划/默认）
- 雷达维度从用户目标文本动态推导（不再硬编码产品经理维度）

### 部署配置
- .github/workflows/deploy-pages.yml 自动注入 VITE_API_BASE_URL
- vercel.json 统一 API 路由
- express-rate-limit / bcryptjs 已移除，用 Node crypto 和内存限流替代
- Railway 工作流已删除，Render 引用全部清理
- CORS origin：https://alano-666.github.io
- Supabase RLS 已启用

### 已知问题
- bailian/zhipu API key 未在生产环境配置 → AI 回复走 fallback
- 文件/图片/语音上传只在前端提取文本发送，后端未存储原始文件
- 目标标记进展后 store 回写需再排查
- **中国网络无法直连 Vercel，需梯子或自定义域名**
