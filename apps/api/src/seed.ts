import { nanoid } from "nanoid";
import type {
  DailyPlan,
  DemoState,
  Goal,
  GoalProgressLog,
  GrowthDirection,
  GrowthEvent,
  Message,
  MetricSnapshot,
  OnboardingInput,
  ReportData,
  ReportItem,
  ReportPeriod,
  ReplyStyle,
  TrajectoryData,
  UserProfile,
} from "@bloom/shared";

const now = new Date("2026-07-14T09:00:00");

const formatDate = (offset: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() + offset);
  return date.toISOString();
};

const buildHighlight = (title: string, summary: string, detail: string): ReportItem => ({
  id: nanoid(),
  title,
  summary,
  detail,
});

const baseProfile: UserProfile = {
  completed: true,
  name: "Luna",
  username: "Luna",
  email: "luna@bloom.demo",
  avatarName: "L",
  age: 24,
  grade: "大四 / 职场过渡期",
  stage: "职场",
  growthDirection: "职业",
  longTermGoal: "进入字节产品团队，建立自己的用户分析方法论",
  currentChallenge: "最近在做竞品分析，但总觉得输出不够有洞察。",
  mainGoal: "进入字节产品团队，建立自己的用户分析方法论",
  mainProblem: "最近在做竞品分析，但总觉得输出不够有洞察。",
  joinedAt: formatDate(-20),
};

const goals: Goal[] = [
  {
    id: "goal-career",
    title: "进入字节产品团队",
    category: "职业",
    progress: 68,
    targetDate: "2026-12-18",
    streak: 16,
    note: "保持每周完成 1 次竞品拆解与 2 次用户访谈复盘。",
  },
  {
    id: "goal-analysis",
    title: "提升产品分析能力",
    category: "学习",
    progress: 75,
    targetDate: "2026-08-08",
    streak: 9,
    note: "建立自己的竞品分析框架并持续复用。",
  },
  {
    id: "goal-routine",
    title: "养成每日复盘习惯",
    category: "生活",
    progress: 80,
    targetDate: "2026-07-31",
    streak: 21,
    note: "每天晚间 23:30 前完成 1 条成长复盘。",
  },
  {
    id: "goal-exercise",
    title: "每周运动 3 次",
    category: "健康",
    progress: 60,
    targetDate: "2026-07-31",
    streak: 4,
    note: "通过轻有氧维持精力稳定。",
  },
];

const goalLogs: GoalProgressLog[] = [
  {
    id: nanoid(),
    goalId: "goal-analysis",
    note: "已经开始按用户价值 / 商业模式 / 差异化三层拆竞品分析。",
    progressDelta: 6,
    createdAt: formatDate(-2),
  },
];

const events: GrowthEvent[] = [
  {
    id: nanoid(),
    content: "完成了竞品分析框架搭建，把用户价值、商业模式和差异化维度拆开了。",
    date: formatDate(-4),
    source: "seed",
    emotion: "positive",
    category: "职业",
    goalIds: ["goal-career", "goal-analysis"],
    scoreDelta: 7,
    focusMinutes: 100,
  },
  {
    id: nanoid(),
    content: "今天看了 2 个产品经理 JD，感觉要求很高，有点焦虑。",
    date: formatDate(-3),
    source: "seed",
    emotion: "anxious",
    category: "职业",
    goalIds: ["goal-career"],
    scoreDelta: 3,
    focusMinutes: 60,
  },
  {
    id: nanoid(),
    content: "做了 1 次用户访谈记录复盘，整理出 5 个共性痛点。",
    date: formatDate(-2),
    source: "seed",
    emotion: "positive",
    category: "学习",
    goalIds: ["goal-analysis"],
    scoreDelta: 6,
    focusMinutes: 90,
  },
  {
    id: nanoid(),
    content: "晚上按时完成了每日复盘，也出去快走了 40 分钟。",
    date: formatDate(-1),
    source: "seed",
    emotion: "steady",
    category: "健康",
    goalIds: ["goal-routine", "goal-exercise"],
    scoreDelta: 5,
    focusMinutes: 40,
  },
];

const metrics = [
  { date: "7/10", score: 28, focusHours: 4.2, moodScore: 65, checkins: 1, events: 1 },
  { date: "7/11", score: 60, focusHours: 5.8, moodScore: 70, checkins: 1, events: 2 },
  { date: "7/12", score: 79, focusHours: 6.1, moodScore: 74, checkins: 2, events: 3 },
  { date: "7/13", score: 68, focusHours: 5.5, moodScore: 69, checkins: 1, events: 1 },
  { date: "7/14", score: 90, focusHours: 7.0, moodScore: 78, checkins: 2, events: 3 },
  { date: "7/15", score: 82, focusHours: 6.3, moodScore: 75, checkins: 1, events: 2 },
  { date: "7/16", score: 96, focusHours: 7.6, moodScore: 80, checkins: 2, events: 3 },
] as const;

const normalizedMetrics: MetricSnapshot[] = metrics.map((metric) => ({
  date: metric.date,
  growthScore: metric.score,
  focusHours: metric.focusHours,
  moodScore: metric.moodScore,
  checkins: metric.checkins,
  events: metric.events,
}));

const dailyPlan: DailyPlan = {
  focusTitle: "完成竞品分析框架搭建",
  focusSubtitle: "拆出用户价值、商业模式与差异化维度",
  timeBudgetMinutes: 90,
  deadline: "截止时间 今天 18:00",
  progress: 0,
  reminder: "你昨晚睡眠时长不错（6.1h），今天适合把需要深度思考的任务放在上午。",
  tasks: ["整理用户价值维度", "补充商业模式分析", "输出 3 个差异化结论"],
  schedule: [
    { id: nanoid(), title: "竞品分析学习", time: "10:00 - 11:30", tag: "重点任务", completed: false, source: "ai" },
    { id: nanoid(), title: "用户调研访谈", time: "14:30 - 16:00", tag: "用户洞察", completed: false, source: "manual" },
    { id: nanoid(), title: "每日复盘", time: "20:30 - 21:00", tag: "成长记录", completed: false, source: "manual" },
  ],
};

const threads = [
  {
    id: "thread-analysis",
    title: "竞品分析遇到的问题",
    preview: "我少拆了 3 个维度，但不知道如何判断是否有价值的结论。",
    updatedAt: formatDate(0),
    lastInputContent: "我少拆了 3 个维度，但不知道如何判断是否有价值的结论。",
    lastInputAt: formatDate(0),
  },
  {
    id: "thread-interview",
    title: "面试准备计划",
    preview: "下周要面字节产品岗，帮我制定复习计划。",
    updatedAt: formatDate(-1),
    lastInputContent: "下周要面字节产品岗，帮我制定复习计划。",
    lastInputAt: formatDate(-1),
  },
  {
    id: "thread-anxiety",
    title: "情绪有点低落",
    preview: "最近压力有点大，总想拖延。",
    updatedAt: formatDate(-2),
    lastInputContent: "最近压力有点大，总想拖延。",
    lastInputAt: formatDate(-2),
  },
];

const messages: Message[] = [
  {
    id: nanoid(),
    threadId: "thread-analysis",
    role: "user",
    content: "我少拆了 3 个维度，但不知道如何判断是否有价值的结论。",
    createdAt: formatDate(0),
  },
  {
    id: nanoid(),
    threadId: "thread-analysis",
    role: "assistant",
    content: "我理解你的感受，这通常是从信息收集转向分析判断时最容易卡住的地方。\n\n基于你之前提到的目标，以及现阶段在做的竞品分析，我建议先把判断拆成三个层次：用户价值维度、商业模式维度、差异化维度。每个层次只保留 1 个最能解释现象的结论。",
    createdAt: formatDate(0),
    summary: {
      memory: "你之前提到想进入字节产品团队，也一直在训练竞品分析能力。",
      emotion: "现在更像是分析压力，而不是能力不足。",
      progress: "你已经完成了记录和拆分，这说明方法感正在形成。",
      nextStep: "下一步只需要针对 3 个核心维度各补 1 个判断，不必一次拆完全部框架。",
      taskSuggestion: "明天先补齐用户价值维度，再用一句话写出结论。",
      scheduleSuggestion: "建议把竞品判断留到上午 10:00 的高专注时段。",
    },
  },
];

const defaultSettings = {
  reminderEnabled: true,
  reminderWindow: "09:00",
  eveningReviewTime: "21:00",
  voiceEnabled: true,
  imageEnabled: false,
  personalizedRhythm: true,
  darkMode: false,
  fontScale: "中" as const,
  replyStyle: "治愈陪伴" as const,
};

export const createEmptyState = (): DemoState => ({
  profile: null,
  goals: [],
  goalLogs: [],
  events: [],
  threads: [],
  messages: [],
  dailyPlan: null,
  metrics: [],
  settings: structuredClone(defaultSettings),
});

export const createInitialState = (): DemoState => ({
  profile: baseProfile,
  goals: structuredClone(goals),
  goalLogs: structuredClone(goalLogs),
  events: structuredClone(events),
  threads: structuredClone(threads),
  messages: structuredClone(messages),
  dailyPlan: structuredClone(dailyPlan),
  metrics: structuredClone(normalizedMetrics),
  settings: {
    reminderEnabled: true,
    reminderWindow: "09:00",
    eveningReviewTime: "21:00",
    voiceEnabled: true,
    imageEnabled: false,
    personalizedRhythm: true,
    darkMode: false,
    fontScale: "中",
    replyStyle: "治愈陪伴",
  },
});

export const createOnboardingProfile = (input: OnboardingInput): UserProfile => ({
  completed: true,
  name: input.name,
  username: input.username ?? input.name,
  email: input.email ?? `${(input.username ?? input.name).toLowerCase()}@bloom.demo`,
  avatarName: (input.username ?? input.name).slice(0, 1).toUpperCase(),
  age: input.age,
  grade: input.grade,
  stage: input.stage ?? "求职",
  growthDirection: input.growthDirection ?? "职业",
  longTermGoal: input.longTermGoal,
  currentChallenge: input.currentChallenge,
  mainGoal: input.mainGoal ?? input.longTermGoal,
  mainProblem: input.mainProblem ?? input.currentChallenge,
  joinedAt: new Date().toISOString(),
});

export const buildDailyPlanFromProfile = (profile: UserProfile): DailyPlan => ({
  focusTitle: `推进「${profile.mainGoal.slice(0, 12)}${profile.mainGoal.length > 12 ? "…" : ""}」`,
  focusSubtitle: `围绕${profile.growthDirection}方向，把今天最值得完成的任务拆成小步骤。`,
  timeBudgetMinutes: 75,
  deadline: "截止时间 今天 21:00",
  progress: 0,
  reminder: `我已经记住你最近最困扰的是「${profile.mainProblem}」，今天先做一个轻量但有效的动作。`,
  tasks: [
    "写下今天最关键的 1 个推进动作",
    "给自己预留 45 分钟深度专注时间",
    "睡前完成 1 条成长复盘",
  ],
  schedule: [
    { id: nanoid(), title: "核心成长任务", time: "09:30 - 10:45", tag: "今日重点", completed: false, source: "ai" },
    { id: nanoid(), title: "复盘与整理", time: "20:30 - 21:00", tag: "成长记录", completed: false, source: "manual" },
  ],
});

export const reportTemplates: Record<ReportPeriod, Omit<ReportData, "period">> = {
  week: {
    rangeLabel: "2026年5月13日 - 5月19日",
    title: "持续积累，开始形成自己的方法论",
    summary: "你本周在产品分析、用户访谈与复盘习惯上投入稳定，已经开始出现属于自己的分析视角。",
    score: 85,
    delta: 15,
    highlights: [
      buildHighlight("完成竞品分析框架搭建", "输出了更清晰的分析框架", "你已经不再只是堆信息，而是在逐步形成自己的分析判断方法。"),
      buildHighlight("深入学习用户访谈方法", "将访谈问题拆成结构化模块", "这会帮助你在后续求职或工作中更稳地做用户研究表达。"),
      buildHighlight("进行了 2 次用户访谈", "把原始记录复盘为共性洞察", "你开始能从杂乱输入里提炼结构化信息，这是明显进步。"),
      buildHighlight("保持 7 天连续记录", "成长开始形成节奏", "连续记录会让 Bloom 更懂你，也让你更容易看见自己的积累。"),
    ],
    stats: [
      { label: "专注时长", value: "12.6 h", hint: "+2.3h" },
      { label: "记录天数", value: "7 / 7", hint: "完整记录" },
      { label: "完成目标", value: "6 个", hint: "+2" },
      { label: "平均睡眠", value: "7.1 h", hint: "-0.8h" },
    ],
    nextSuggestion: "以下一周重点建议：继续打磨分析表达，并试着输出一份完整的产品洞察文档。",
  },
  month: {
    rangeLabel: "2026年5月",
    title: "成长曲线持续向上，节奏越来越稳",
    summary: "你已经把成长从偶发努力，变成了可持续的日常系统。",
    score: 88,
    delta: 12,
    highlights: [
      buildHighlight("连续 22 天成长记录", "成长已进入稳定节奏", "你已经开始把 Bloom 当成真正的成长伙伴，而不是偶发打开的工具。"),
      buildHighlight("完成 4 次深度复盘", "从记录走向洞察", "复盘内容开始出现明确的问题意识和方法提炼。"),
      buildHighlight("产品分析能力明显提升", "从收集信息走向判断信息", "你更擅长抓重点和下结论了。"),
    ],
    stats: [
      { label: "成长值", value: "312", hint: "+36" },
      { label: "活跃天数", value: "22", hint: "本月" },
      { label: "平均专注", value: "5.8 h", hint: "+0.7h" },
      { label: "完成里程碑", value: "4 个", hint: "稳定推进" },
    ],
    nextSuggestion: "下个月建议增加结构化输出，让学习积累更容易被看见。",
  },
  quarter: {
    rangeLabel: "2026 Q2",
    title: "你正在从“努力”走向“有方法地努力”",
    summary: "季度内你逐渐建立起成长结构，目标推进更稳定，情绪波动也在收敛。",
    score: 90,
    delta: 18,
    highlights: [
      buildHighlight("建立长期目标管理机制", "目标不再停留在口头", "你开始把长期目标拆成能被追踪的小里程碑。"),
      buildHighlight("形成固定复盘节奏", "成长开始沉淀", "持续复盘让你能看到方法和心态都在变化。"),
      buildHighlight("完成多次核心任务拆解", "行动更有结构", "这会显著降低拖延和目标失焦。"),
    ],
    stats: [
      { label: "成长值", value: "870", hint: "+120" },
      { label: "周完成率", value: "78%", hint: "+11%" },
      { label: "专注总时长", value: "71 h", hint: "+14h" },
      { label: "情绪稳定度", value: "82", hint: "+9" },
    ],
    nextSuggestion: "下一季度建议开始沉淀个人作品集，把成长成果转化为外部可见输出。",
  },
  year: {
    rangeLabel: "2026 全年",
    title: "你已经开始拥有自己的成长叙事",
    summary: "这一年里，你不只是完成任务，而是在逐步形成长期自我驱动系统。",
    score: 92,
    delta: 24,
    highlights: [
      buildHighlight("目标体系清晰", "开始围绕主目标组织行动", "长期目标与短期执行之间已经出现稳定关联。"),
      buildHighlight("坚持记录形成习惯", "成长留痕能力增强", "这是未来所有复盘和报告的基础。"),
      buildHighlight("关键能力出现持续提升", "开始看见自己的方法感", "你不只是做得更多，而是做得更清楚。"),
    ],
    stats: [
      { label: "成长值", value: "1240", hint: "+240" },
      { label: "记录周数", value: "38", hint: "高连续性" },
      { label: "目标完成率", value: "81%", hint: "+16%" },
      { label: "成长高光", value: "9 次", hint: "可沉淀" },
    ],
    nextSuggestion: "下一年建议把成长记录进一步结构化，形成属于你的长期成长年鉴。",
  },
};

export const categoryKeywords: Record<GrowthDirection, string[]> = {
  职业: ["面试", "岗位", "offer", "竞品", "产品", "JD", "分析", "访谈"],
  学习: ["学习", "课程", "读书", "笔记", "复盘", "方法"],
  健康: ["运动", "睡眠", "散步", "跑步", "饮食", "身体"],
  生活: ["习惯", "整理", "生活", "家务", "日常", "计划"],
};

export const replyStylePrompts: Record<ReplyStyle, string> = {
  治愈陪伴: "先共情，再肯定，最后给出柔和但明确的一步行动建议。",
  结构清晰: "用分点和层次表达，结论先行，建议具体可执行。",
  精准鼓励: "强调进展与优势，快速定位关键卡点，给出鼓励性行动指令。",
};
