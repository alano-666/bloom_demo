# 成长对话重构 · 接口协议定义（API Contract）+ 数据库表结构草案 + 前端渲染规范

## 1. 目标
本文件用于把 Bloom 的“成长对话”从单次问答，升级为：
- 可识别用户对话意图
- 可抽取成长信息并入库
- 可形成回合记忆
- 可驱动 Dashboard / Trajectory / Report / Evening Summary 的长期陪伴系统

此文档是工程实现视角的接口与结构说明。

---

## 2. API Contract

### 2.1 POST /api/session/message

**作用**
- 接收用户发送的一条成长对话消息
- 完成：消息入库、意图识别、成长抽取、AI 回复生成、成长状态联动更新

**Request**
```json
{
  "threadId": "thread-123",
  "content": "今天温习了一些语法部分，然后推进了自己的AI项目，下班去玩啦",
  "attachments": [
    {
      "id": "att-1",
      "type": "file",
      "name": "notes.md",
      "previewText": "今天总结了 Java 语法..."
    }
  ]
}
```

**Response**
```json
{
  "session": {
    "thread": {
      "id": "thread-123",
      "title": "成长会话",
      "preview": "今天温习了一些语法部分...",
      "updatedAt": "2026-07-25T13:00:00.000Z",
      "lastInputContent": "今天温习了一些语法部分...",
      "lastInputAt": "2026-07-25T13:00:00.000Z"
    },
    "messages": [
      {
        "id": "msg-user-1",
        "threadId": "thread-123",
        "role": "user",
        "content": "今天温习了一些语法部分，然后推进了自己的AI项目，下班去玩啦",
        "createdAt": "2026-07-25T13:00:00.000Z"
      },
      {
        "id": "msg-ai-1",
        "threadId": "thread-123",
        "role": "assistant",
        "content": "今天其实过得挺扎实的......",
        "createdAt": "2026-07-25T13:00:01.000Z",
        "summary": {
          "memory": "最近在同步补语法和推进 AI 项目",
          "emotion": "状态总体平稳，带一点完成后的放松感",
          "progress": "今天同时完成了基础回温和项目推进",
          "nextStep": "明天可以只抓一个最卡的项目点继续推进",
          "taskSuggestion": "记录今天 AI 项目里最有成就感的一步",
          "scheduleSuggestion": "明晚预留 20 分钟回顾今天推进的部分"
        }
      }
    ]
  },
  "dashboard": { "...": "..." },
  "goals": [],
  "reportSummary": { "...": "..." },
  "trajectory": { "...": "..." }
}
```

---

### 2.2 POST /api/session/evening-summary

**作用**
- 读取用户当日的消息、事件、专注与任务进度
- 自动生成一条晚间成长总结
- 写入“晚间成长总结”线程

**Request**
```json
{}
```

**Response**
```json
{
  "threadId": "thread-evening-summary",
  "session": {
    "thread": {
      "id": "thread-evening-summary",
      "title": "晚间成长总结",
      "preview": "晚上好，今天的 Bloom 小结...",
      "updatedAt": "2026-07-25T22:00:00.000Z",
      "lastInputContent": "晚上好，今天的 Bloom 小结...",
      "lastInputAt": "2026-07-25T22:00:00.000Z"
    },
    "messages": [
      {
        "id": "msg-evening-1",
        "threadId": "thread-evening-summary",
        "role": "assistant",
        "content": "晚上好，今天的 Bloom 小结我帮你整理好了 🌙...",
        "createdAt": "2026-07-25T22:00:00.000Z",
        "summary": {
          "memory": "今日晚间总结：完成核心任务",
          "emotion": "平稳，今天有正向推进",
          "progress": "今日任务进度 65%，专注 75 分钟",
          "nextStep": "今天学的哪个点最顺畅？",
          "taskSuggestion": "记录今天的一个收获",
          "scheduleSuggestion": "明天继续推进核心任务"
        }
      }
    ]
  }
}
```

---

### 2.3 PATCH /api/profile

**作用**
- 更新用户个人信息
- 若 `mainGoal` / `mainProblem` 发生变化，自动写入 `GoalHistoryEntry`

**Request**
```json
{
  "name": "阿泽",
  "username": "阿泽",
  "grade": "职场三年",
  "mainGoal": "成为后端工程师",
  "mainProblem": "后端基础薄弱"
}
```

**Response**
```json
{
  "hasOnboarded": true,
  "profile": { "...": "..." },
  "dashboard": { "...": "..." },
  "recentThreads": [],
  "goals": [],
  "reportSummary": { "...": "..." },
  "settings": { "...": "..." }
}
```

---

## 3. 数据结构草案

### 3.1 GoalHistoryEntry
```ts
interface GoalHistoryEntry {
  id: string;
  timestamp: string;
  previousGoal: string;
  newGoal: string;
  previousProblem: string;
  newProblem: string;
}
```

### 3.2 ConversationExtraction（建议新增）
```ts
interface ConversationExtraction {
  id: string;
  threadId: string;
  messageId: string;
  createdAt: string;

  primaryIntent:
    | "daily_log"
    | "tech_help"
    | "study_planning"
    | "emotion_support"
    | "review_reflection"
    | "project_progress"
    | "goal_shift"
    | "light_companion";

  secondaryIntent?: string;
  confidence: number;

  topics: string[];
  emotion: "positive" | "steady" | "anxious" | "tired";
  hasProgress: boolean;
  hasBlocker: boolean;
  hasGoalChange: boolean;

  progressSummary?: string;
  blockerSummary?: string;
  reflectionSummary?: string;
  mentionedGoal?: string;
  mentionedProblem?: string;
  suggestedFollowUp?: string;
}
```

### 3.3 GrowthEvent 扩展
```ts
interface GrowthEvent {
  id: string;
  content: string;
  date: string;
  source: "session" | "focus" | "goal-progress" | "evening-summary" | "profile-update";
  emotion: Emotion;
  category: GrowthDirection | "情绪";
  goalIds: string[];
  scoreDelta: number;
  focusMinutes: number;
  eventType?: "study" | "project" | "reflection" | "emotion" | "goal-shift";
}
```

### 3.4 DemoState 扩展
```ts
interface DemoState {
  profile: UserProfile | null;
  goals: Goal[];
  goalLogs: GoalProgressLog[];
  goalHistory: GoalHistoryEntry[];
  events: GrowthEvent[];
  threads: ConversationThread[];
  messages: Message[];
  dailyPlan: DailyPlan | null;
  metrics: MetricSnapshot[];
  settings: UserSettings;
}
```

---

## 4. 后端状态机设计

### 4.1 消息处理状态机
```text
[用户输入]
   ↓
消息入库
   ↓
意图识别
   ↓
成长抽取
   ↓
AI 回复生成
   ↓
写入 assistant 消息
   ↓
写入 GrowthEvent / MetricSnapshot / GoalHistory / Memory
   ↓
返回 session + dashboard + trajectory + reportSummary
```

### 4.2 线程模式
```ts
type ConversationThreadMode =
  | "normal"
  | "evening-summary"
  | "review"
  | "project-follow-up";
```

### 4.3 回合状态
```ts
type TurnStage =
  | "user_input"
  | "assistant_response"
  | "follow_up_waiting"
  | "resolved";
```

---

## 5. 前端渲染规范

### 5.1 SessionPage

#### 普通 assistant 消息
- 左侧气泡
- 文本为主
- 下方渲染 summary 信息卡片

#### 晚间总结消息
- 使用特殊卡片样式：
  - 淡紫色渐变背景
  - 月亮 / 星星 icon
  - 标题 `晚间成长总结`
  - 内容结构：今日任务、今日数据、轻追问

#### 信息卡片（MessageSummary）
分 2～4 个 block 展示，不再机械重复主回复。
优先级：
1. 进展判断
2. 情绪识别
3. 下一步建议
4. 轻追问 / 任务建议 / 日程建议

---

### 5.2 线程列表
每个线程展示：
- 标题
- 最后一句输入/总结 preview
- 更新时间
- 若为 `thread-evening-summary`，额外显示月亮标识

---

### 5.3 晚间提醒
当 `eveningReviewTime` 到达时：
- 前端浏览器 Notification：`Bloom：来看看今天的成长小结 🌙`
- 用户点击后打开 SessionPage
- 前端调用 `POST /api/session/evening-summary`
- 自动切换到 `thread-evening-summary`

---

## 6. 工程实现顺序建议

### Phase 1
- Message intent 分类重构
- ConversationExtraction 数据结构与后端抽取
- MessageSummary 精简，避免重复主回复

### Phase 2
- GoalHistory 写入与报告展示
- Evening Summary API + 晚间线程

### Phase 3
- SessionPage 晚间总结卡片渲染
- Notification 和 evening thread 自动切换

### Phase 4
- 回合记忆（follow_up_waiting / resolved）
- 长期主题记忆（7~14 天主题聚合）

---

## 7. 当前工程状态（实现进度）
- [x] GoalHistoryEntry 类型已加入 `packages/shared/src/types.ts`
- [x] `updateProfile()` 已写入 goalHistory
- [x] `buildReport("quarter"|"year")` 已展示目标历史摘要
- [x] `POST /api/session/evening-summary` 已实现并部署
- [x] `useLocalReminder` 已支持晚间提醒通知
- [ ] ConversationExtraction 仍未正式入库（当前为下一阶段）
- [ ] SessionPage 晚间总结专用 UI 卡片仍未独立组件化
- [ ] 回合状态机（follow_up_waiting / resolved）仍未实现
