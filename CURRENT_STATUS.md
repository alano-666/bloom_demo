# Bloom 项目现状 · 24 Jul 2026

## 部署拓扑
前端：GitHub Pages — https://alano-666.github.io/bloom_demo/
后端：Vercel Serverless — https://bloom-demo-api.vercel.app/api
认证/数据库：Supabase — https://vocywpbwyvrleswchjde.supabase.co

## Render/Railway 清理
已删除所有 Render/Railway 工作流和代码引用，仅剩 ReactDOM.render() JavaScript API（非云服务商）。
无本地 SQLite 生产依赖。

## 当前功能

### 对话（SessionPage）
- 创建/删除对话（含二次确认，清理关联消息和事件）
- 创建按钮防重复提交
- 点击对话切换不发生死循环
- 语音（Web Speech API）、文件（FileReader）、图片（base64）上传入口
- AI 回复 fallback 覆盖 7 场景（代码报错/情绪波动/学习规划/复盘总结/知识问答/规划/默认），共情前置 + 陪伴感收尾
- 中间栏显示对话摘要（标题、最后输入、时间）

### Dashboard
- 核心任务可编辑标题和副标题
- 专注模式：暂停/结束后 progress、成长值、累计时长即时更新
- 专注失败时保留遮罩并显示错误，可手动关闭
- 日程抽屉：添加/修改/删除，区分 AI/手动来源，空状态禁用保存

### 轨迹/报告/目标
- 雷达维度动态从用户目标提取关键词
- 习惯以彩色编号卡片展示，情绪以渐变进度条展示
- 目标创建带错误反馈和空值校验

### 认证与数据隔离
- Supabase Auth 注册（admin auto-confirm + 自动签发 token）
- API 统一验证 JWT，按 userId 隔离成长状态
- 多用户数据互不串扰

### 部署 + 文档
- DEPLOYMENT.md 包含完整 Supabase/Vercel/Pages 配置
- GitHub Pages CI/CD 自动注入 VITE_API_BASE_URL
- Vercel 一键部署（无 external db binary）
- favicon：16/32/64px + apple-touch-icon + manifest
