import type { BootstrapResponse } from "@bloom/shared";

/**
 * Provides offline demo data when the backend is unreachable.
 * This ensures the app still shows content instead of blank pages.
 */
export function getOfflineBootstrap(email: string, username: string): BootstrapResponse {
  const name = username || email?.split("@")[0] || "Luna";
  return {
    hasOnboarded: true,
    profile: {
      completed: true,
      name,
      username: name,
      email: email || "user@bloom.demo",
      avatarName: name.slice(0, 1).toUpperCase(),
      age: 24,
      grade: "大四 / 职场过渡期",
      stage: "职场",
      growthDirection: "职业",
      longTermGoal: "进入产品团队，建立自己的分析方法论",
      currentChallenge: "最近在做竞品分析，但总觉得输出不够有洞察。",
      mainGoal: "进入产品团队，建立自己的分析方法论",
      mainProblem: "最近在做竞品分析，但总觉得输出不够有洞察。",
      joinedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    dashboard: {
      greeting: `早上好，${name}`,
      dateLabel: new Intl.DateTimeFormat("zh-CN", {
        year: "numeric", month: "long", day: "numeric", weekday: "short",
      }).format(new Date()),
      dailyPlan: {
        focusTitle: "完成竞品分析框架搭建",
        focusSubtitle: "拆出用户价值、商业模式与差异化维度",
        timeBudgetMinutes: 90,
        deadline: "截止时间 今天 18:00",
        progress: 0,
        reminder: "你昨晚睡眠时长不错（6.1h），今天适合把需要深度思考的任务放在上午。",
        tasks: ["整理用户价值维度", "补充商业模式分析", "输出 3 个差异化结论"],
        schedule: [
          { id: "off-s1", title: "竞品分析学习", time: "10:00 - 11:30", tag: "重点任务", completed: false, source: "ai" },
          { id: "off-s2", title: "用户调研访谈", time: "14:30 - 16:00", tag: "用户洞察", completed: false, source: "manual" },
          { id: "off-s3", title: "每日复盘", time: "20:30 - 21:00", tag: "成长记录", completed: false, source: "manual" },
        ],
      },
      growthScore: 90,
      growthScoreCap: 120,
      streakDays: 7,
      activeDays: 14,
      focusHours: 6.3,
      emotionLabel: "良好",
      emotionTrend: "比上周更积极",
      reminder: "你昨晚睡眠时长不错（6.1h），今天适合把需要深度思考的任务放在上午；当前虚拟屏幕时长约 6.2h，建议中午留 20 分钟远离屏幕。",
      screenHours: 6.2,
      sleepHours: 6.1,
    },
    recentThreads: [
      {
        id: "off-th1",
        title: "竞品分析遇到的问题",
        preview: "我少拆了 3 个维度，但不知道如何判断是否有价值的结论。",
        updatedAt: new Date().toISOString(),
        lastInputContent: "我少拆了 3 个维度，但不知道如何判断是否有价值的结论。",
        lastInputAt: new Date().toISOString(),
      },
      {
        id: "off-th2",
        title: "面试准备计划",
        preview: "下周要面字节产品岗，帮我制定复习计划。",
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        lastInputContent: "下周要面字节产品岗，帮我制定复习计划。",
        lastInputAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "off-th3",
        title: "情绪有点低落",
        preview: "最近压力有点大，总想拖延。",
        updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        lastInputContent: "最近压力有点大，总想拖延。",
        lastInputAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
    ],
    goals: [
      { id: "off-g1", title: "进入字节产品团队", category: "职业", progress: 68, targetDate: "2026-12-18", streak: 16, note: "保持每周完成 1 次竞品拆解与 2 次用户访谈复盘。" },
      { id: "off-g2", title: "提升产品分析能力", category: "学习", progress: 75, targetDate: "2026-08-08", streak: 9, note: "建立自己的竞品分析框架并持续复用。" },
      { id: "off-g3", title: "养成每日复盘习惯", category: "生活", progress: 80, targetDate: "2026-07-31", streak: 21, note: "每天晚间 23:30 前完成 1 条成长复盘。" },
      { id: "off-g4", title: "每周运动 3 次", category: "健康", progress: 60, targetDate: "2026-07-31", streak: 4, note: "通过轻有氧维持精力稳定。" },
    ],
    reportSummary: {
      period: "week",
      rangeLabel: "2026年7月7日 - 7月13日",
      title: "持续积累，开始形成自己的方法论",
      summary: "你本周在产品分析、用户访谈与复盘习惯上投入稳定，已经开始出现属于自己的分析视角。",
      score: 85,
      delta: 15,
      highlights: [
        { id: "off-h1", title: "完成竞品分析框架搭建", summary: "输出了更清晰的分析框架", detail: "你已经不再只是堆信息，而是在逐步形成自己的分析判断方法。" },
        { id: "off-h2", title: "深入学习用户访谈方法", summary: "将访谈问题拆成结构化模块", detail: "这会帮助你在后续求职或工作中更稳地做用户研究表达。" },
      ],
      stats: [
        { label: "专注时长", value: "12.6 h", hint: "+2.3h" },
        { label: "记录天数", value: "7 / 7", hint: "完整记录" },
        { label: "完成目标", value: "6 个", hint: "+2" },
        { label: "平均睡眠", value: "7.1 h", hint: "-0.8h" },
      ],
      nextSuggestion: "以下一周重点建议：继续打磨分析表达，并试着输出一份完整的产品洞察文档。",
    },
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
  };
}

export function getOfflineTrajectory() {
  return {
    tabs: ["本周任务完成趋势", "能力发展", "习惯养成", "情绪状态"],
    overview: { score: 312, delta: 15, days: 14, focusHours: 6.3 },
    trend: [
      { date: "7/10", score: 28, focusHours: 4.2 },
      { date: "7/11", score: 60, focusHours: 5.8 },
      { date: "7/12", score: 79, focusHours: 6.1 },
      { date: "7/13", score: 68, focusHours: 5.5 },
      { date: "7/14", score: 90, focusHours: 7.0 },
      { date: "7/15", score: 82, focusHours: 6.3 },
      { date: "7/16", score: 96, focusHours: 7.6 },
    ],
    radar: [
      { subject: "产品思维", current: 62, previous: 58 },
      { subject: "行动执行", current: 60, previous: 56 },
      { subject: "用户洞察", current: 59, previous: 54 },
      { subject: "情绪韧性", current: 57, previous: 52 },
      { subject: "结构表达", current: 56, previous: 53 },
    ],
    timeline: [
      { date: "7/13 15:30", title: "完成了竞品分析框架搭建，把用户价值、商业模式...", score: 7, tag: "职业" },
      { date: "7/12 10:05", title: "做了 1 次用户访谈记录复盘，整理出 5 个共性痛点。", score: 6, tag: "学习" },
      { date: "7/11 20:15", title: "晚上按时完成了每日复盘，也出去快走了 40 分钟。", score: 5, tag: "健康" },
    ],
    habits: ["连续记录每日复盘", "固定进行专注时段", "每周保持运动节奏"],
    emotions: [
      { label: "开心", count: 12 },
      { label: "平稳", count: 8 },
      { label: "焦虑", count: 4 },
      { label: "疲惫", count: 2 },
    ],
    healthCards: [],
  };
}

export function getOfflineReport(period: "week" | "month" | "quarter" | "year") {
  const reports = {
    week: {
      period: "week" as const,
      rangeLabel: "2026年7月7日 - 7月13日",
      title: "持续积累，开始形成自己的方法论",
      summary: "你本周在产品分析、用户访谈与复盘习惯上投入稳定，已经开始出现属于自己的分析视角。",
      score: 85,
      delta: 15,
      highlights: [
        { id: "off-rh1", title: "完成竞品分析框架搭建", summary: "输出了更清晰的分析框架", detail: "你已经不再只是堆信息，而是在逐步形成自己的分析判断方法。" },
        { id: "off-rh2", title: "深入学习用户访谈方法", summary: "将访谈问题拆成结构化模块", detail: "这会帮助你在后续求职或工作中更稳地做用户研究表达。" },
        { id: "off-rh3", title: "进行了 2 次用户访谈", summary: "把原始记录复盘为共性洞察", detail: "你开始能从杂乱输入里提炼结构化信息，这是明显进步。" },
        { id: "off-rh4", title: "保持 7 天连续记录", summary: "成长开始形成节奏", detail: "连续记录会让 Bloom 更懂你，也让你更容易看见自己的积累。" },
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
      period: "month" as const,
      rangeLabel: "2026年7月",
      title: "成长曲线持续向上，节奏越来越稳",
      summary: "你已经把成长从偶发努力，变成了可持续的日常系统。",
      score: 88,
      delta: 12,
      highlights: [
        { id: "off-rm1", title: "连续 22 天成长记录", summary: "成长已进入稳定节奏", detail: "你已经开始把 Bloom 当成真正的成长伙伴，而不是偶发打开的工具。" },
        { id: "off-rm2", title: "完成 4 次深度复盘", summary: "从记录走向洞察", detail: "复盘内容开始出现明确的问题意识和方法提炼。" },
        { id: "off-rm3", title: "产品分析能力明显提升", summary: "从收集信息走向判断信息", detail: "你更擅长抓重点和下结论了。" },
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
      period: "quarter" as const,
      rangeLabel: "2026 Q3",
      title: "你正在从「努力」走向「有方法地努力」",
      summary: "季度内你逐渐建立起成长结构，目标推进更稳定，情绪波动也在收敛。",
      score: 90,
      delta: 18,
      highlights: [
        { id: "off-rq1", title: "建立长期目标管理机制", summary: "目标不再停留在口头", detail: "你开始把长期目标拆成能被追踪的小里程碑。" },
        { id: "off-rq2", title: "形成固定复盘节奏", summary: "成长开始沉淀", detail: "持续复盘让你能看到方法和心态都在变化。" },
        { id: "off-rq3", title: "完成多次核心任务拆解", summary: "行动更有结构", detail: "这会显著降低拖延和目标失焦。" },
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
      period: "year" as const,
      rangeLabel: "2026 全年",
      title: "你已经开始拥有自己的成长叙事",
      summary: "这一年里，你不只是完成任务，而是在逐步形成长期自我驱动系统。",
      score: 92,
      delta: 24,
      highlights: [
        { id: "off-ry1", title: "目标体系清晰", summary: "开始围绕主目标组织行动", detail: "长期目标与短期执行之间已经出现稳定关联。" },
        { id: "off-ry2", title: "坚持记录形成习惯", summary: "成长留痕能力增强", detail: "这是未来所有复盘和报告的基础。" },
        { id: "off-ry3", title: "关键能力出现持续提升", summary: "开始看见自己的方法感", detail: "你不只是做得更多，而是做得更清楚。" },
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
  return reports[period];
}

export function getOfflineSession(threadId: string) {
  if (threadId === "off-th1") {
    return {
      thread: {
        id: "off-th1",
        title: "竞品分析遇到的问题",
        preview: "我少拆了 3 个维度，但不知道如何判断是否有价值的结论。",
        updatedAt: new Date().toISOString(),
        lastInputContent: "我少拆了 3 个维度，但不知道如何判断是否有价值的结论。",
        lastInputAt: new Date().toISOString(),
      },
      messages: [
        {
          id: "off-msg1",
          threadId: "off-th1",
          role: "user" as const,
          content: "我少拆了 3 个维度，但不知道如何判断是否有价值的结论。",
          createdAt: new Date().toISOString(),
        },
        {
          id: "off-msg2",
          threadId: "off-th1",
          role: "assistant" as const,
          content: "我理解你的感受，这通常是从信息收集转向分析判断时最容易卡住的地方。\n\n基于你之前提到的目标，我建议先把判断拆成三个层次：用户价值维度、商业模式维度、差异化维度。每个层次只保留 1 个最能解释现象的结论。",
          createdAt: new Date().toISOString(),
          summary: {
            memory: "你之前提到想进入字节产品团队，也一直在训练竞品分析能力。",
            emotion: "现在更像是分析压力，而不是能力不足。",
            progress: "你已经完成了记录和拆分，这说明方法感正在形成。",
            nextStep: "下一步只需要针对 3 个核心维度各补 1 个判断。",
            taskSuggestion: "明天先补齐用户价值维度，再用一句话写出结论。",
            scheduleSuggestion: "建议把竞品判断留到上午 10:00 的高专注时段。",
          },
        },
      ],
    };
  }
  return {
    thread: { id: threadId, title: "新对话", preview: "", updatedAt: new Date().toISOString(), lastInputContent: "", lastInputAt: new Date().toISOString() },
    messages: [],
  };
}
