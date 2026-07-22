# Bloom 项目现状 · 24 Jul 2026

## 部署架构
- 前端: GitHub Pages — https://alano-666.github.io/bloom_demo/
- 后端: Vercel Serverless — https://bloom-demo-api.vercel.app/api
- 认证/数据库: Supabase — https://vocywpbwyvrleswchjde.supabase.co
- 无 Render，无 Railway，无本地 SQLite 生产依赖

## 当前完成

### 1. 推荐的前端体验修正已经做完
- [x] 今日成长核心任务可点击"编辑任务"手动修改
- [x] 专注遮罩优化：暂停/结束带 loading、错误提示与关闭路径
- [x] 头像与用户名同步到侧栏
- [x] 移除了快速记录，所有输入收口到成长对话
- [x] 成长轨迹页面顶部按钮已移除，直接顺序展示
- [x] 对话列表显示标题 / 最后输入 / 更新时间
- [x] 日程项目区分 AI 解析 / 手动添加来源

### 2. 后端已具备真实 AI 入口
- [x] Bailian / Zhipu 双 provider + fallback
- [x] fallback 重写为 7 场景（代码报错、学习规划、知识问答等）、共情前置、陪伴感收尾
- [x] AI prompt builder 使用 Bloom 长期陪伴成长模板

### 3. 账户安全已落地
- [x] Supabase Auth（邮箱/密码）
- [x] 注册走 admin API 自动确认邮箱 + 下发 session token
- [x] 每次 API 请求验证 JWT（requireUser 中间件）
- [x] 按 userId 隔离成长状态

### 4. 对话与日程核心逻辑
- [x] 创建/删除对话（含二次确认，清理消息和事件）
- [x] 创建按钮防重复提交
- [x] 点击对话切换不再死循环
- [x] 日程的保存操作带 loading guard

### 5. 部署
- [x] GitHub Pages CI/CD 自动注入 VITE_API_BASE_URL
- [x] Vercel 一键部署（无 external db binary）
- [x] Railway workflow 已删除，所有 Render 引用已清理

## 部署验证
- 注册 → 登录 → bootstrap 返回正确用户数据
- 两个不同用户各自隔离
- 专注暂停/结束正常更新仪表盘
- 对话删除后重新拉取生命周期正常

## 已知待办
- 语音/文件/图片的上传只能在前端读取，未传给后端存储（前端 FileReader + Web Speech 在浏览器端完成文本提取后以文本形式发送）
- AI chat prompt 仍需在你配置 Bailian/Zhipu key 后才会使用真实大模型（当前为 fallback 规则输出）
- 标记进展后目标进度更新与仪表盘同步需再排查（目标表单已修好，进展弹窗尚未全局回写 store）
- 对话切换后 sidebar 不选中已在修复中
- 单个对话删除后 activeThread 清空逻辑仍在调试
