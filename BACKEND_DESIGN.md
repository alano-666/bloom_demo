# Bloom 后端规范设计文档

## 1. 目标
本文件用于统一说明 Bloom 当前后端的：
- 数据模型
- 数据之间的关系
- 核心计算公式
- 数据流走向
- AI 参与点
- 当前 Demo 与未来生产化的边界

当前实现定位：
- **前端可展示 Demo + 真实大模型接入入口**
- 核心 AI Provider：**阿里百炼**
- 备用 Provider：**智谱 AI**
- 最终兜底：**fallback 规则逻辑**

---

## 2. 后端职责总览
后端不是简单返回假数据，而是一个围绕成长对话运转的**状态引擎**：

1. 接收用户对话输入
2. 调用 AI / fallback 进行结构化理解
3. 更新成长事件、目标进度、日程、指标快照
4. 聚合出 Dashboard / Trajectory / Report 所需数据
5. 把结果统一返回前端展示

新增两项已落地职责：
6. 记录用户 `mainGoal / mainProblem` 的历史变化，用于季报/年报展示方向变化
7. 在晚间复盘时间生成“晚间成长总结”消息，沉淀到专门线程中，体现长期陪伴价值

---

## 3. 核心数据模型

### 3.1 用户画像 `UserProfile`
描述用户长期成长背景。

关键字段：
- `name` / `username`
- `grade`
- `growthDirection`
- `mainGoal`
- `mainProblem`
- `joinedAt`

用途：
- 任务生成
- AI 回复上下文
- 报告总结
- 目标优先级判断
- 晚间总结生成时的个性化称呼与追问方向

---

### 3.2 历史对话 `ConversationThread` / `Message`
#### Thread
- `id`
- `title`
- `preview`
- `updatedAt`
- `lastInputContent`
- `lastInputAt`

#### Message
- `id`
- `threadId`
- `role`
- `content`
- `createdAt`
- `attachments`
- `summary`

用途：
- 作为最重要的原始输入源
- 支撑对话列表、会话详情、AI 记忆回调
- 作为晚间总结的“今日对话素材”

新增线程约定：
- `thread-evening-summary`：晚间成长总结线程，后端每天生成总结时写入该线程

---

### 3.3 目标体系 `Goal` / `GoalProgressLog`
#### Goal
- `id`
- `title`
- `category`
- `progress`
- `targetDate`
- `streak`
- `note`

#### GoalProgressLog
- `id`
- `goalId`
- `note`
- `progressDelta`
- `createdAt`

用途：
- 目标看板展示
- 与成长事件、成长值联动
- 为报告与轨迹提供“推进证据”

---

### 3.4 目标历史 `GoalHistoryEntry`
当用户在个人信息里修改近期目标或当前困扰时，系统记录一条历史。

字段：
- `id`
- `timestamp`
- `previousGoal`
- `newGoal`
- `previousProblem`
- `newProblem`

用途：
- 季报 / 年报中展示“目标方向调整”
- 统计用户目标迭代次数
- 体现长期成长中的方向校准能力

---

### 3.5 成长事件 `GrowthEvent`
每次重要输入、目标推进、专注结束，最终都会沉淀成标准事件。

关键字段：
- `id`
- `content`
- `date`
- `source`
- `emotion`
- `category`
- `goalIds`
- `scoreDelta`
- `focusMinutes`

用途：
- 成长轨迹时间轴
- 报告亮点
- 关键事件判定
- Dashboard 状态推导
- 晚间总结的数据来源

补充来源：
- `evening-summary`：晚间总结消息本身可视为一种特殊成长事件来源（当前实现为消息写入，后续可扩展为独立 event）

---

### 3.6 今日任务与日程 `DailyPlan` / `DailyTask`
#### DailyPlan
- `focusTitle`
- `focusSubtitle`
- `timeBudgetMinutes`
- `deadline`
- `progress`
- `reminder`
- `tasks`
- `schedule`

#### DailyTask
- `title`
- `time`
- `tag`
- `completed`
- `source`（`manual` / `ai`）

用途：
- 今日成长页的核心任务和日程安排
- 区分用户手动添加和 AI 解析来源
- 晚间总结中展示今日核心任务与完成进度

---

### 3.7 每日指标快照 `MetricSnapshot`
这是所有可视化与指标聚合的核心来源。

字段：
- `date`
- `growthScore`
- `focusHours`
- `moodScore`
- `checkins`
- `events`

用途：
- Dashboard 指标
- 本周成长曲线
- 周/月/季/年报告统计
- streak / active days / delta 计算
- 晚间总结中展示“今日成长值变化 / 主情绪 / 专注时长”

---

## 4. 数据关系说明

### 关系总览
- **UserProfile** 影响 `DailyPlan` 生成、AI 回复、Goal 判断、Report 总结
- **Message** 是最主要的原始输入源
- **Message → GrowthEvent**：每次有效对话都会提炼成一条或多条成长事件
- **GrowthEvent → MetricSnapshot**：事件更新成长值、专注时长、情绪得分
- **GrowthEvent → Goal**：命中目标时，推动目标进度与 streak
- **GrowthEvent → Trajectory / Report**：用于关键事件、习惯、情绪、亮点生成
- **GoalProgressLog → GrowthEvent**：手动目标推进会反向生成成长事件
- **DailyTask** 可来自 AI 或用户手动添加，并与事件/目标形成上下文关系
- **GoalHistoryEntry → Report**：目标变化会在季报/年报中作为 highlight 与 stats 展示
- **Today(Messages + Events + Metrics + DailyPlan) → Evening Summary**：每天晚间从这四类数据聚合出一条总结消息写入 thread-evening-summary

---

## 5. 核心计算逻辑

## 5.1 成长值 `growthScore`
### 当前公式
成长值按事件驱动更新，已拆成多因子规则：

- `conversationScore`：用户输入长度与有效表达程度
- `focusScore`：专注时长贡献
- `goalScore`：命中目标数量贡献
- `reflectionScore`：是否包含复盘 / 总结 / 情绪整理
- `event.scoreDelta`：AI / fallback 对本次事件重要性的基础评分

### 当前后端近似公式
```text
growthDelta =
  0.30 * conversationScore +
  0.35 * focusScore +
  0.20 * goalScore +
  0.15 * reflectionScore +
  event.scoreDelta / 2
```

### 解释
- 用户只是随便发一句话，不会得到高成长值
- 用户完成专注、复盘、目标推进，会得到更高成长值
- 成长值上限当前按 Demo 规则限制在 `120`

---

## 5.2 连续成长天数 `streakDays`
### 当前规则
根据 `MetricSnapshot` 倒序检查：
- 如果当天 `checkins > 0`，视为有效成长日
- 连续有效成长日数量即为 `streakDays`

---

## 5.3 活跃天数 `activeDays`
### 当前规则
统计所有 `MetricSnapshot` 中：
- `checkins > 0` 的天数总和

---

## 5.4 累计专注时长 `focusHours`
### 当前规则
对全部 `MetricSnapshot.focusHours` 做累加：
```text
totalFocusHours = Σ metric.focusHours
```

---

## 5.5 虚拟屏幕时长 `screenHours`
### 当前规则
按最近的专注行为反推：
- 专注越多，虚拟屏幕时长越低
- 当前下限为 `3.8h`

示意：
```text
screenHours = max(3.8, 7.2 - focusBursts * 0.2)
```

---

## 5.6 虚拟睡眠时长 `sleepHours`
### 当前规则
按健康类事件数反推：
- 健康行为越多，虚拟睡眠时长略微提升
- 当前上限为 `8.2h`

示意：
```text
sleepHours = min(8.2, 6.4 + recoverySignals * 0.15)
```

---

## 5.7 情绪趋势 `emotionTrend`
### 当前规则
先统计最近事件的情绪分布，得到 `dominantEmotion`：
- `positive`
- `steady`
- `anxious`
- `tired`

再映射为展示文案：
- `positive` → 比上周更积极
- `anxious` → 最近 2 天有点焦虑
- `tired` → 需要适当减压
- `steady` → 近 7 天较为稳定

---

## 5.8 轨迹变化值 `trajectory.overview.delta`
### 当前规则
- 最近 7 天成长值平均数
- 对比前 7 天成长值平均数
- 差值作为 delta

```text
delta = avg(recent 7 days growthScore) - avg(previous 7 days growthScore)
```

---

## 5.9 雷达图 `radar`
### 当前规则
每个能力维度分数由以下因素共同推导：
- 最近事件文本关键词命中
- 目标标题/备注关键词命中
- 最近消息文本关键词命中
- 较高进度目标数量权重

当前维度：
- 不再固定为产品经理词汇
- 根据用户目标/困扰文本动态推导，如：编程能力 / 后端工程 / 学习能力 / 执行行动 / 情绪韧性 / 健康生活 等

---

## 5.10 晚间总结 `eveningSummary()`
### 当前规则
每晚通过前端定时器触发 `POST /api/session/evening-summary`，后端即时生成总结：

输入来源：
- 今日 `messages`
- 今日 `events`
- 今日 `dailyPlan`
- 最新 `MetricSnapshot`

输出结构：
- 今日核心任务与进度
- 今日专注时长与成长值变化
- 今日主情绪
- 一条轻量追问（根据今日消息内容生成）

线程规则：
- 自动创建 / 复用 `thread-evening-summary`
- 消息写入 `messages`，并更新 thread preview/updatedAt

---

## 5.11 目标历史在报告中的体现
### 当前规则
在 `buildReport("quarter" | "year")` 中：
- 若 `goalHistory` 非空，取最近 1~3 条变化
- 追加一条 `highlights`：
  - 标题：`目标方向调整`
  - 摘要：`从「旧目标」→「新目标」`
- 若变更次数 >= 2：
  - `title` 改为“在持续校准中找到更清晰的方向”
  - `nextSuggestion` 增强为“建议将当前方向沉淀为可量化的里程碑”
- 在 `stats` 中增加：
```text
{ label: "目标迭代", value: "N 次", hint: "持续校准方向" }
```
