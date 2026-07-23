import type {
  CreateGoalInput,
  DailyTask,
  DashboardData,
  DecomposeTaskResponse,
  DemoState,
  FocusCompleteResponse,
  Goal,
  GoalProgressInput,
  GrowthDirection,
  GrowthEvent,
  Message,
  MetricSnapshot,
  OnboardingInput,
  PostMessageResponse,
  QuickLogParseResponse,
  ReportData,
  ReportPeriod,
  SessionMessageInput,
  TrajectoryData,
  UpdateProfileInput,
  UserProfile,
} from "@bloom/shared";
import { nanoid } from "nanoid";
import {
  buildDailyPlanFromProfile,
  categoryKeywords,
  createInitialState,
  createOnboardingProfile,
  deriveRadarDimensions,
  reportTemplates,
} from "./seed.js";
import { aiProvider } from "./ai/provider.js";

const emotionMap = {
  positive: { label: "良好", trend: "比上周更积极" },
  steady: { label: "平稳", trend: "近 7 天较为稳定" },
  anxious: { label: "波动", trend: "最近 2 天有点焦虑" },
  tired: { label: "疲惫", trend: "需要适当减压" },
} as const;

const formatDateLabel = (date = new Date()) => {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
};

const normalizeMetricDate = (date = new Date()) => `${date.getMonth() + 1}/${date.getDate()}`;

export class DemoStore {
  private state: DemoState;

  constructor(initialState: DemoState = createInitialState()) {
    this.state = structuredClone(initialState);
  }

  snapshot() {
    return structuredClone(this.state);
  }

  getState() {
    return this.state;
  }

  bootstrap() {
    return {
      hasOnboarded: Boolean(this.state.profile?.completed),
      profile: this.state.profile,
      dashboard: this.state.profile ? this.buildDashboard() : null,
      recentThreads: this.state.threads,
      goals: this.state.goals,
      reportSummary: this.state.profile ? this.buildReport("week") : null,
      settings: this.state.settings,
    };
  }

  async submitOnboarding(input: OnboardingInput) {
    const profile = createOnboardingProfile(input);
    const fresh = createInitialState();
    this.state = {
      ...fresh,
      profile,
      goals: [],
      goalLogs: [],
      events: [],
      threads: [],
      messages: [],
      metrics: [],
      dailyPlan: buildDailyPlanFromProfile(profile),
    };

    const starterThreadId = "thread-welcome";
    const welcomeMessage = `我已经记住了你的长期目标：${profile.mainGoal}。接下来我会帮助你把这个目标拆解成每天可以完成的小步骤。`;

    this.state.threads = [
      {
        id: starterThreadId,
        title: "欢迎来到 Bloom",
        preview: welcomeMessage,
        updatedAt: new Date().toISOString(),
        lastInputContent: welcomeMessage,
        lastInputAt: new Date().toISOString(),
      },
      ...this.state.threads.filter((thread) => thread.id !== starterThreadId),
    ];

    this.state.messages = [
      {
        id: nanoid(),
        threadId: starterThreadId,
        role: "assistant",
        content: welcomeMessage,
        createdAt: new Date().toISOString(),
        summary: {
          memory: `我会围绕你的长期目标「${profile.mainGoal}」持续陪你推进。`,
          emotion: `我也记住了你最近最困扰的是「${profile.mainProblem}」。`,
          progress: "先从一个最轻量但高价值的行动开始。",
          nextStep: "今天先完成 1 次关键记录，建立第一天的成长轨迹。",
          taskSuggestion: "把目标拆成 1 个今天能完成的小动作。",
          scheduleSuggestion: "优先把高认知负荷任务放到上午。",
        },
      },
    ];

    await this.generateCoreTask();
    return this.bootstrap();
  }

  async updateProfile(input: UpdateProfileInput) {
    if (!this.state.profile) return this.bootstrap();
    const previousGoal = this.state.profile.mainGoal;
    const previousProblem = this.state.profile.mainProblem;
    const hasGoalChange = input.mainGoal !== previousGoal;
    const hasProblemChange = input.mainProblem !== previousProblem;

    this.state.profile = {
      ...this.state.profile,
      name: input.name,
      username: input.username,
      avatarName: input.username.slice(0, 1).toUpperCase(),
      grade: input.grade,
      mainGoal: input.mainGoal,
      mainProblem: input.mainProblem,
      longTermGoal: input.mainGoal,
      currentChallenge: input.mainProblem,
    };

    if (hasGoalChange || hasProblemChange) {
      this.state.goalHistory.push({
        id: nanoid(),
        timestamp: new Date().toISOString(),
        previousGoal,
        newGoal: input.mainGoal,
        previousProblem,
        newProblem: input.mainProblem,
      });
    }

    await this.generateCoreTask();
    return this.bootstrap();
  }

  listThreads() {
    return this.state.threads;
  }

  createThread(title: string) {
    const thread = {
      id: nanoid(),
      title,
      preview: "新的成长会话，准备开始。",
      updatedAt: new Date().toISOString(),
      lastInputContent: "",
      lastInputAt: new Date().toISOString(),
    };
    this.state.threads.unshift(thread);
    const session = { thread, messages: [] as Message[] };
    return {
      thread,
      session,
      threads: this.state.threads,
    };
  }

  deleteThread(threadId: string) {
    this.state.threads = this.state.threads.filter((item) => item.id !== threadId);
    this.state.messages = this.state.messages.filter((message) => message.threadId !== threadId);
    this.state.events = this.state.events.filter((event) => !event.content.includes(threadId));
    return { ok: true };
  }

  getSession(threadId: string) {
    const thread = this.state.threads.find((item) => item.id === threadId) ?? this.state.threads[0];
    const messages = this.state.messages.filter((message) => message.threadId === thread.id);
    return { thread, messages };
  }

  createGoal(input: CreateGoalInput) {
    const goal: Goal = {
      id: nanoid(),
      title: input.title,
      category: input.category,
      progress: 0,
      targetDate: input.targetDate,
      streak: 0,
      note: input.note,
    };
    this.state.goals.unshift(goal);
    return this.state.goals;
  }

  async recordGoalProgress(goalId: string, input: GoalProgressInput) {
    const goal = this.state.goals.find((item) => item.id === goalId);
    if (!goal) return await this.getGoalProgressPayload();

    const delta = Math.max(1, Math.min(20, input.progressDelta));
    this.state.goalLogs.unshift({
      id: nanoid(),
      goalId,
      note: input.note,
      progressDelta: delta,
      createdAt: new Date().toISOString(),
    });

    const event: GrowthEvent = {
      id: nanoid(),
      content: input.note,
      date: new Date().toISOString(),
      source: "goal-progress",
      emotion: "positive",
      category: goal.category,
      goalIds: [goalId],
      scoreDelta: 6,
      focusMinutes: 35,
    };

    this.state.events.unshift(event);
    this.state.goals = this.state.goals.map((item) =>
      item.id === goalId ? { ...item, progress: Math.min(100, item.progress + delta), streak: item.streak + 1 } : item,
    );
    this.bumpMetrics(event);
    return await this.getGoalProgressPayload();
  }

  async generateCoreTask() {
    const profile = this.state.profile as UserProfile;
    const result = await aiProvider.generateCoreTask({
      user: this.buildAiUserContext(),
      recentThreads: this.state.threads.slice(0, 4).map((thread) => ({ title: thread.title })),
      recentEvents: this.state.events.slice(0, 6).map((event) => event.content),
      goals: this.state.goals.map((goal) => ({
        title: goal.title,
        category: goal.category,
        progress: goal.progress,
        note: goal.note,
      })),
    });

    this.state.dailyPlan = {
      focusTitle: result.focusTitle,
      focusSubtitle: result.focusSubtitle,
      timeBudgetMinutes: result.timeBudgetMinutes,
      deadline: result.deadline,
      progress: 0,
      reminder: result.reminder,
      tasks: result.tasks,
      schedule: this.state.dailyPlan?.schedule ?? buildDailyPlanFromProfile(profile).schedule,
    };

    return this.state.dailyPlan;
  }

  async decomposeTask(): Promise<DecomposeTaskResponse> {
    const plan = this.state.dailyPlan ?? (await this.generateCoreTask());
    const result = await aiProvider.decomposeTask({
      user: this.buildAiUserContext(),
      currentTask: plan,
    });
    this.state.dailyPlan = { ...plan, tasks: result.tasks };
    return result;
  }

  async parseQuickLog(content: string): Promise<QuickLogParseResponse> {
    const parsed = await aiProvider.parseRecord({
      user: this.buildAiUserContext(),
      content,
    });
    const event = this.createEvent(content, "quick-log", parsed.category, parsed.emotion, 4, parsed.category === "健康" ? 40 : 55);
    this.state.events.unshift(event);
    this.bumpGoals(event);
    this.bumpMetrics(event);

    const addedSchedule = parsed.suggestedScheduleTitles.map((title) => ({
      id: nanoid(),
      title,
      time: "18:30 - 19:00",
      tag: "AI 解析",
      completed: false,
      source: "ai" as const,
    })) satisfies DailyTask[];

    this.state.dailyPlan = {
      ...(this.state.dailyPlan ?? (await this.generateCoreTask())),
      schedule: [...addedSchedule, ...(this.state.dailyPlan?.schedule ?? [])],
    };

    return {
      parsedSummary: parsed.summary,
      addedSchedule,
      bootstrap: this.bootstrap(),
      trajectory: this.buildTrajectory(),
      reportSummary: this.buildReport("week"),
    };
  }

  async completeFocus(minutes: number, markDone = true): Promise<FocusCompleteResponse> {
    const safeMinutes = Math.max(5, minutes);
    const event: GrowthEvent = {
      id: nanoid(),
      content: `完成了 ${safeMinutes} 分钟专注时段。`,
      date: new Date().toISOString(),
      source: "focus",
      emotion: "positive",
      category: this.state.profile?.growthDirection ?? "职业",
      goalIds: this.state.goals.slice(0, 1).map((goal) => goal.id),
      scoreDelta: 5,
      focusMinutes: safeMinutes,
    };
    this.state.events.unshift(event);
    this.bumpGoals(event);
    this.bumpMetrics(event);
    if (this.state.dailyPlan) {
      const progress = markDone
        ? 100
        : Math.min(100, Math.round((safeMinutes / Math.max(1, this.state.dailyPlan.timeBudgetMinutes)) * 100));
      this.state.dailyPlan = {
        ...this.state.dailyPlan,
        progress,
      };
    }
    return {
      dashboard: this.buildDashboard(),
      goals: this.state.goals,
      reportSummary: this.buildReport("week"),
      trajectory: this.buildTrajectory(),
    };
  }

  addScheduleItem(title: string, time: string) {
    const task: DailyTask = {
      id: nanoid(),
      title,
      time,
      tag: "手动添加",
      completed: false,
      source: "manual",
    };
    this.state.dailyPlan = {
      ...(this.state.dailyPlan ?? buildDailyPlanFromProfile(this.state.profile as UserProfile)),
      schedule: [...(this.state.dailyPlan?.schedule ?? []), task],
    };
    return this.buildDashboard();
  }

  updateScheduleItem(taskId: string, title: string, time: string) {
    if (!this.state.dailyPlan) return this.buildDashboard();
    this.state.dailyPlan = {
      ...this.state.dailyPlan,
      schedule: this.state.dailyPlan.schedule.map((task) =>
        task.id === taskId ? { ...task, title, time } : task,
      ),
    };
    return this.buildDashboard();
  }

  deleteScheduleItem(taskId: string) {
    if (!this.state.dailyPlan) return this.buildDashboard();
    this.state.dailyPlan = {
      ...this.state.dailyPlan,
      schedule: this.state.dailyPlan.schedule.filter((task) => task.id !== taskId),
    };
    return this.buildDashboard();
  }

  async postMessage(input: SessionMessageInput): Promise<PostMessageResponse> {
    const userMessage: Message = {
      id: nanoid(),
      threadId: input.threadId,
      role: "user",
      content: input.content,
      createdAt: new Date().toISOString(),
      attachments: input.attachments,
    };

    const thread = this.state.threads.find((item) => item.id === input.threadId) ?? this.state.threads[0];
    const result = await aiProvider.chatReply({
      user: this.buildAiUserContext(),
      thread: {
        title: thread?.title ?? "成长会话",
        latestUserContent: input.content,
        latestAssistantContent: this.state.messages.filter((message) => message.threadId === input.threadId && message.role === "assistant").slice(-1)[0]?.content,
      },
      goals: this.state.goals.map((goal) => ({
        title: goal.title,
        category: goal.category,
        progress: goal.progress,
        note: goal.note,
      })),
      latestMessage: input.content,
    });

    const event = this.createEvent(input.content, "session", result.category, result.emotion, result.scoreDelta, result.focusMinutes);
    const assistantMessage: Message = {
      id: nanoid(),
      threadId: input.threadId,
      role: "assistant",
      content: result.assistantText,
      createdAt: new Date().toISOString(),
      summary: result.summary,
      attachments: input.attachments,
    };

    this.state.messages.push(userMessage, assistantMessage);
    this.state.events.unshift(event);
    this.bumpGoals(event);
    this.bumpMetrics(event);

    const threadIndex = this.state.threads.findIndex((item) => item.id === input.threadId);
    if (threadIndex >= 0) {
      this.state.threads[threadIndex] = {
        ...this.state.threads[threadIndex],
        preview: input.content,
        updatedAt: new Date().toISOString(),
        lastInputContent: input.content,
        lastInputAt: new Date().toISOString(),
      };
    }

    if (result.suggestedSchedule?.length) {
      const scheduleItems = result.suggestedSchedule.map((item) => ({
        id: nanoid(),
        title: item.title,
        time: item.time,
        tag: item.tag || "AI 建议",
        completed: false,
        source: "ai" as const,
      })) satisfies DailyTask[];
      this.state.dailyPlan = {
        ...(this.state.dailyPlan ?? buildDailyPlanFromProfile(this.state.profile as UserProfile)),
        schedule: [...scheduleItems, ...(this.state.dailyPlan?.schedule ?? [])],
      };
    }

    this.state.threads.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));

    return {
      session: this.getSession(input.threadId),
      dashboard: this.buildDashboard(),
      goals: this.state.goals,
      reportSummary: this.buildReport("week"),
      trajectory: this.buildTrajectory(),
    };
  }

  eveningSummary() {
    const name = this.state.profile?.name ?? "Bloom 用户";
    const todayLabel = normalizeMetricDate(new Date());
    const todaysMessages = this.state.messages.filter(
      (message) => new Date(message.createdAt).toDateString() === new Date().toDateString(),
    );
    const todaysEvents = this.state.events.filter(
      (event) => new Date(event.date).toDateString() === new Date().toDateString(),
    );
    const plan = this.state.dailyPlan ?? buildDailyPlanFromProfile(this.state.profile as UserProfile);
    const latestMetric = this.state.metrics[this.state.metrics.length - 1];
    const todayFocusMin = todaysEvents.reduce((sum, event) => sum + event.focusMinutes, 0);
    const todayDelta = todaysEvents.reduce((sum, event) => sum + event.scoreDelta, 0);
    const emotionLabel = latestMetric
      ? latestMetric.moodScore >= 75
        ? "良好"
        : latestMetric.moodScore >= 60
          ? "平稳"
          : "波动"
      : "平稳";

    // Pick a lightweight follow-up question based on today's messages
    let followUp = "今天有什么特别想记录的吗？";
    const userMessages = todaysMessages.filter((msg) => msg.role === "user").map((msg) => msg.content).join(" ");
    if (userMessages.length > 20) {
      if (/报错|bug|error|卡|不会|不懂|难/.test(userMessages)) followUp = "白天提到的那个卡点，现在回头看看，有没有新的思路？";
      else if (/完成|做完|搞定|学会|跑通了/.test(userMessages)) followUp = "今天完成的事情里，哪一件让你最有收获感？";
      else if (/计划|安排|节奏|接下来/.test(userMessages)) followUp = "明天的重点有想好怎么排吗？需要我帮你梳理一下吗？";
      else followUp = "今天学的东西里，有没有哪个点让你觉得特别有意思或特别困惑的？";
    }

    const summaryContent = `晚上好 ${name}，这是今天的 Bloom 晚间小结 🌙

📋 今日核心任务：「${plan.focusTitle.slice(0, 30)}」— 进度 ${plan.progress}%

📊 今日数据：
  - 专注时长：${todayFocusMin} 分钟
  - 成长值变化：+${todayDelta} 分
  - 情绪状态：${emotionLabel}
  ${todaysEvents.filter((e) => e.source === "focus").length ? "- 完成专注时段：" + todaysEvents.filter((e) => e.source === "focus").length + " 次" : ""}

🌱 一个小问题：
  ${followUp}`;

    let summaryThreadId = "thread-evening-summary";
    const existingThread = this.state.threads.find((thread) => thread.id === summaryThreadId);
    if (!existingThread) {
      this.state.threads.unshift({
        id: summaryThreadId,
        title: "晚间成长总结",
        preview: summaryContent.slice(0, 60),
        updatedAt: new Date().toISOString(),
        lastInputContent: summaryContent.slice(0, 60),
        lastInputAt: new Date().toISOString(),
      });
    } else {
      const tIndex = this.state.threads.findIndex((thread) => thread.id === summaryThreadId);
      if (tIndex >= 0) {
        const thread = this.state.threads[tIndex];
        this.state.threads[tIndex] = {
          ...thread,
          preview: summaryContent.slice(0, 60),
          updatedAt: new Date().toISOString(),
          lastInputContent: summaryContent.slice(0, 60),
          lastInputAt: new Date().toISOString(),
        };
      }
    }

    const assistantMessage: Message = {
      id: nanoid(),
      threadId: summaryThreadId,
      role: "assistant",
      content: summaryContent,
      createdAt: new Date().toISOString(),
      summary: {
        memory: `今日晚间总结：${plan.focusTitle.slice(0, 30)}`,
        emotion: `${emotionLabel}，${todayDelta > 0 ? "今天有正向推进" : "继续稳步前行"}`,
        progress: `今日任务进度 ${plan.progress}%，专注 ${todayFocusMin}分钟`,
        nextStep: followUp,
        taskSuggestion: "完成晚间复盘并记录今天的收获",
        scheduleSuggestion: "明天继续推进核心任务",
      },
    };
    this.state.messages.push(assistantMessage);

    return {
      threadId: summaryThreadId,
      session: this.getSession(summaryThreadId),
    };
  }

  updateGoal(goalId: string, progress: number) {
    this.state.goals = this.state.goals.map((goal) =>
      goal.id === goalId ? { ...goal, progress: Math.max(0, Math.min(100, progress)) } : goal,
    );
    return this.state.goals;
  }

  updateSettings(payload: Partial<DemoState["settings"]>) {
    this.state.settings = { ...this.state.settings, ...payload };
    return this.state.settings;
  }

  buildDashboard(): DashboardData {
    const latestMetric = this.state.metrics[this.state.metrics.length - 1] ?? {
      date: normalizeMetricDate(new Date()),
      growthScore: 0,
      focusHours: 0,
      moodScore: 70,
      checkins: 0,
      events: 0,
    };
    const latestEvent = this.state.events[0];
    const emotion = latestEvent ? emotionMap[latestEvent.emotion] : emotionMap.steady;
    const name = this.state.profile?.name ?? "Luna";
    const activeDays = this.state.metrics.filter((item) => item.checkins > 0).length;
    const totalFocusHours = Number(this.state.metrics.reduce((sum, item) => sum + item.focusHours, 0).toFixed(1));
    const streakDays = this.deriveStreakDays();
    const screenHours = this.deriveScreenHours();
    const sleepHours = this.deriveSleepHours();

    return {
      greeting: `早上好，${name}`,
      dateLabel: formatDateLabel(new Date()),
      dailyPlan: this.state.dailyPlan ?? buildDailyPlanFromProfile(this.state.profile as UserProfile),
      growthScore: latestMetric.growthScore,
      growthScoreCap: 120,
      streakDays,
      activeDays,
      focusHours: totalFocusHours,
      emotionLabel: emotion.label,
      emotionTrend: this.deriveEmotionTrend(),
      reminder: this.buildReminderText(),
      screenHours,
      sleepHours,
    };
  }

  buildTrajectory(): TrajectoryData {
    const goalsText = this.state.goals.concat([]).map((goal) => goal.title + goal.note + goal.category).join(" ");
    const profileMainGoal = (this.state.profile?.mainGoal ?? "") + (this.state.profile?.mainProblem ?? "");
    const allText = goalsText + profileMainGoal;

    const dims = deriveRadarDimensions(allText);
    const radar = dims.map((dim) => ({
      subject: dim.label,
      current: this.deriveRadarScore(dim.keywords, dim.baseline),
      previous: Math.max(48, dim.baseline - 4),
    }));

    return {
      tabs: ["本周任务完成趋势", "能力发展", "习惯养成", "情绪状态"],
      overview: {
        score: this.state.metrics.reduce((sum, item) => sum + item.growthScore, 0),
        delta: this.deriveTrajectoryDelta(),
        days: this.state.metrics.filter((item) => item.checkins > 0).length,
        focusHours: Number(this.state.metrics.reduce((sum, item) => sum + item.focusHours, 0).toFixed(1)),
      },
      trend: this.state.metrics.slice(-7).map((item) => ({
        date: item.date,
        score: item.growthScore,
        focusHours: item.focusHours,
      })),
      radar,
      timeline: this.state.events.slice(0, 5).map((event) => ({
        date: new Date(event.date).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        title: event.content,
        score: event.scoreDelta,
        tag: event.category,
      })),
      habits: this.deriveHabits(),
      emotions: this.deriveEmotionSummary(),
      healthCards: [],
    };
  }

  buildReport(period: ReportPeriod): ReportData {
    const template = reportTemplates[period];
    const scoreBoost = Math.min(8, Math.floor(this.state.events.length / 3));
    const recordDays = this.state.metrics.filter((item) => item.checkins > 0).length;
    const totalFocusHours = Number(this.state.metrics.reduce((sum, item) => sum + item.focusHours, 0).toFixed(1));
    const completedGoals = this.state.goals.filter((goal) => goal.progress >= 100).length;
    const averageSleep = this.deriveSleepHours();
    const keyEvents = this.deriveKeyEvents();
    const dominantEmotion = this.getDominantEmotion();
    const periodLabel = period === "week" ? "周" : period === "month" ? "月" : period === "quarter" ? "季度" : "年度";

    let synthesizedTitle = this.deriveReportTitle(period, dominantEmotion);
    let synthesizedSummary = this.deriveReportSummary(period, dominantEmotion, recordDays, totalFocusHours);
    let synthesizedNextSuggestion = this.deriveNextSuggestion(dominantEmotion);

    try {
      const synthesizedPromise = aiProvider.synthesizeReport({
        user: this.buildAiUserContext(),
        periodLabel,
        dominantEmotion: dominantEmotion === "positive" ? "积极" : dominantEmotion === "anxious" ? "焦虑" : dominantEmotion === "tired" ? "疲惫" : "平稳",
        stats: [
          `专注时长 ${totalFocusHours.toFixed(1)}h`,
          `记录天数 ${recordDays}`,
          `完成目标 ${completedGoals}`,
          `平均睡眠 ${averageSleep.toFixed(1)}h`,
        ],
        highlights: keyEvents.map((item) => `${item.title}：${item.summary}`),
      });
      // async synthesis is prepared in provider, but report currently uses deterministic derived values for stability
    } catch {
      // keep derived copy
    }

    const goalHistoryCount = this.state.goalHistory.length;
    const recentGoalChanges = this.state.goalHistory.slice(-3);

    if ((period === "quarter" || period === "year") && recentGoalChanges.length) {
      const latest = recentGoalChanges[recentGoalChanges.length - 1];
      keyEvents.push({
        id: latest.id,
        title: "目标方向调整",
        summary: `从「${latest.previousGoal.slice(0, 12)}…」→「${latest.newGoal.slice(0, 12)}…」`,
        detail: `${new Date(latest.timestamp).toLocaleDateString("zh-CN")}：你重新校准了目标方向。从「${latest.previousGoal}」转向「${latest.newGoal}」，这是对自我认知的一次深化。`,
      });
      if (goalHistoryCount >= 2) {
        synthesizedTitle = "在持续校准中找到更清晰的方向";
        synthesizedNextSuggestion = this.deriveNextSuggestion(dominantEmotion) + " 你已经在目标校准上迭代了多次，建议把当前方向沉淀为可量化的里程碑。";
      }
    }

    const stats: { label: string; value: string; hint: string }[] = [
      { label: "专注时长", value: `${totalFocusHours.toFixed(1)} h`, hint: `+${Math.max(0.6, scoreBoost / 2).toFixed(1)}h` },
      { label: "记录天数", value: `${recordDays} / ${Math.max(recordDays, 7)}`, hint: recordDays >= 5 ? "稳定记录" : "继续保持" },
      { label: "完成目标", value: `${completedGoals} 个`, hint: `进行中 ${this.state.goals.length - completedGoals}` },
      { label: "平均睡眠", value: `${averageSleep.toFixed(1)} h`, hint: "虚拟数据" },
    ];
    if (goalHistoryCount > 0 && (period === "quarter" || period === "year")) {
      stats.push({ label: "目标迭代", value: `${goalHistoryCount} 次`, hint: "持续校准方向" });
    }

    return {
      period,
      rangeLabel: template.rangeLabel,
      title: synthesizedTitle,
      summary: synthesizedSummary,
      score: template.score + scoreBoost,
      delta: this.deriveTrajectoryDelta(),
      highlights: keyEvents.length ? keyEvents : template.highlights,
      stats,
      nextSuggestion: synthesizedNextSuggestion,
    };
  }

  private createEvent(
    content: string,
    source: GrowthEvent["source"],
    category?: GrowthDirection | "情绪",
    emotion?: GrowthEvent["emotion"],
    scoreDelta?: number,
    focusMinutes?: number,
  ): GrowthEvent {
    const resolvedCategory = category ?? this.classifyCategory(content);
    const resolvedEmotion = emotion ?? this.detectEmotion(content);
    const goalIds = this.matchGoals(content, resolvedCategory);
    const resolvedScore = scoreDelta ?? (resolvedEmotion === "positive" ? 6 : resolvedEmotion === "steady" ? 4 : resolvedEmotion === "anxious" ? 3 : 2);
    const resolvedFocus = focusMinutes ?? (resolvedCategory === "健康" ? 40 : resolvedCategory === "学习" ? 80 : 60);

    return {
      id: nanoid(),
      content,
      date: new Date().toISOString(),
      source,
      emotion: resolvedEmotion,
      category: resolvedCategory,
      goalIds,
      scoreDelta: resolvedScore,
      focusMinutes: resolvedFocus,
    };
  }

  private classifyCategory(content: string): GrowthDirection | "情绪" {
    const matched = (Object.entries(categoryKeywords) as [GrowthDirection, string[]][]).find(([, keywords]) =>
      keywords.some((keyword) => content.includes(keyword)),
    );

    if (matched) return matched[0];
    if (["焦虑", "迷茫", "压力", "难过", "没动力"].some((keyword) => content.includes(keyword))) {
      return "情绪";
    }
    return this.state.profile?.growthDirection ?? "职业";
  }

  private detectEmotion(content: string): GrowthEvent["emotion"] {
    if (["焦虑", "压力", "紧张", "迷茫"].some((keyword) => content.includes(keyword))) return "anxious";
    if (["累", "困", "没动力", "拖延"].some((keyword) => content.includes(keyword))) return "tired";
    if (["完成", "进展", "学会", "顺利", "不错"].some((keyword) => content.includes(keyword))) return "positive";
    return "steady";
  }

  private matchGoals(content: string, category: GrowthDirection | "情绪") {
    const directMatches = this.state.goals
      .filter((goal) => goal.category === category || goal.title.split("").some((segment) => content.includes(segment)))
      .map((goal) => goal.id);

    return directMatches.length ? directMatches : this.state.goals.slice(0, 1).map((goal) => goal.id);
  }

  buildReminderText() {
    const { reminderEnabled } = this.state.settings;
    if (!reminderEnabled) return "提醒已关闭，但 Bloom 仍会在你主动记录时持续更新成长状态。";

    const screenHours = this.deriveScreenHours();
    const sleepHours = this.deriveSleepHours();
    const dominantEmotion = this.getDominantEmotion();
    const latestTask = this.state.dailyPlan?.focusTitle ?? "今天的核心任务";

    if (sleepHours < 6.5) {
      return `你昨晚睡眠只有 ${sleepHours}h，今天建议把「${latestTask}」拆小一点，优先完成最关键的 1 步。`;
    }
    if (screenHours > 7) {
      return `当前虚拟屏幕时长约 ${screenHours}h，建议在继续推进「${latestTask}」前先远离屏幕 20 分钟，重启注意力。`;
    }
    if (dominantEmotion === "anxious") {
      return `你最近有些焦虑，建议先把「${latestTask}」拆成 1 个 20 分钟动作，先启动再追求完整。`;
    }
    if (dominantEmotion === "tired") {
      return `你最近略显疲惫，建议把高认知负荷任务放到最清醒的时段，再留出缓冲时间做复盘。`;
    }
    return `你昨晚睡眠时长不错（${sleepHours}h），今天适合把需要深度思考的任务放在上午；当前虚拟屏幕时长约 ${screenHours}h，建议中午留 20 分钟远离屏幕。`;
  }

  private buildAiUserContext() {
    const profile = this.state.profile as UserProfile;
    return {
      name: profile.name,
      username: profile.username,
      grade: profile.grade,
      mainGoal: profile.mainGoal,
      mainProblem: profile.mainProblem,
      growthDirection: profile.growthDirection,
      replyStyle: this.state.settings.replyStyle,
    };
  }

  private deriveStreakDays() {
    let streak = 0;
    for (let index = this.state.metrics.length - 1; index >= 0; index -= 1) {
      if (this.state.metrics[index].checkins > 0) streak += 1;
      else break;
    }
    return streak;
  }

  private deriveScreenHours() {
    const focusBursts = this.state.events.filter((event) => event.source === "focus").length;
    return Number(Math.max(3.8, 7.2 - focusBursts * 0.2).toFixed(1));
  }

  private deriveSleepHours() {
    const recoverySignals = this.state.events.filter((event) => event.category === "健康").length;
    return Number(Math.min(8.2, 6.4 + recoverySignals * 0.15).toFixed(1));
  }

  private deriveEmotionTrend() {
    const dominant = this.getDominantEmotion();
    if (dominant === "anxious") return "最近 2 天有点焦虑";
    if (dominant === "tired") return "需要适当减压";
    if (dominant === "positive") return "比上周更积极";
    return "近 7 天较为稳定";
  }

  private deriveTrajectoryDelta() {
    const recent = this.state.metrics.slice(-7);
    const previous = this.state.metrics.slice(-14, -7);
    const recentAverage = recent.length ? recent.reduce((sum, item) => sum + item.growthScore, 0) / recent.length : 0;
    const previousAverage = previous.length ? previous.reduce((sum, item) => sum + item.growthScore, 0) / previous.length : 0;
    return Math.max(0, Math.round(recentAverage - previousAverage));
  }

  private deriveRadarScore(keywords: string[], baseline: number) {
    const text = [
      ...this.state.events.slice(0, 12).map((event) => event.content),
      ...this.state.goals.map((goal) => `${goal.title} ${goal.note}`),
      ...this.state.messages.slice(-12).map((message) => message.content),
    ].join(" ");
    const matches = keywords.filter((keyword) => text.includes(keyword)).length;
    const completedWeight = this.state.goals.filter((goal) => goal.progress >= 60).length * 2;
    return Math.min(92, baseline + matches * 4 + completedWeight + Math.floor(this.state.events.length / 5));
  }

  private deriveHabits() {
    const habits = [
      this.state.events.filter((event) => event.content.includes("复盘") || event.category === "生活").length >= 2 ? "连续记录每日复盘" : null,
      this.state.events.filter((event) => event.source === "focus").length >= 2 ? "固定进行专注时段" : null,
      this.state.events.filter((event) => event.category === "健康").length >= 2 ? "每周保持运动节奏" : null,
      this.state.messages.filter((message) => message.role === "user" && (message.content.includes("整理") || message.content.includes("计划"))).length >= 2
        ? "睡前整理第二天重点"
        : null,
    ].filter(Boolean) as string[];
    return habits.length ? habits : ["持续记录成长对话", "保持目标推进节奏"];
  }

  private deriveEmotionSummary() {
    const counts = {
      开心: this.state.events.filter((event) => event.emotion === "positive").length,
      平稳: this.state.events.filter((event) => event.emotion === "steady").length,
      焦虑: this.state.events.filter((event) => event.emotion === "anxious").length,
      疲惫: this.state.events.filter((event) => event.emotion === "tired").length,
    };
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([label, count]) => ({ label, count }));
  }

  private deriveKeyEvents() {
    return this.state.events
      .map((event) => {
        const keywordBoost = ["面试", "offer", "决定", "突破", "复盘", "完成"].filter((keyword) => event.content.includes(keyword)).length;
        const goalBoost = event.goalIds.length * 2;
        const emotionBoost = event.emotion === "anxious" || event.emotion === "positive" ? 2 : 0;
        const total = event.scoreDelta + keywordBoost + goalBoost + emotionBoost;
        return {
          id: event.id,
          title: event.content.slice(0, 18) + (event.content.length > 18 ? "…" : ""),
          summary: `${event.category} · ${total >= 8 ? "关键事件" : event.scoreDelta >= 5 ? "高价值推进" : "持续积累"}`,
          detail: `${new Date(event.date).toLocaleString("zh-CN")}：${event.content}`,
          total,
        };
      })
      .filter((item) => item.total >= 6)
      .sort((a, b) => b.total - a.total)
      .slice(0, 4)
      .map(({ total, ...rest }) => rest);
  }

  private getDominantEmotion() {
    const sorted = this.deriveEmotionSummary().sort((a, b) => b.count - a.count);
    if (!sorted.length) return "steady" as const;
    if (sorted[0].label === "开心") return "positive" as const;
    if (sorted[0].label === "焦虑") return "anxious" as const;
    if (sorted[0].label === "疲惫") return "tired" as const;
    return "steady" as const;
  }

  private deriveReportTitle(period: ReportPeriod, dominantEmotion: "positive" | "steady" | "anxious" | "tired") {
    if (dominantEmotion === "anxious") {
      return period === "week" ? "在波动中重新建立结构和节奏" : "你正在把焦虑转化成更清晰的行动";
    }
    if (dominantEmotion === "positive") {
      return period === "week" ? "持续积累，开始看见更清晰的进步" : "你正在把努力沉淀成真正的方法感";
    }
    return period === "week" ? "稳定推进，成长节奏正在形成" : "你已经进入了更稳定的成长周期";
  }

  private deriveReportSummary(period: ReportPeriod, dominantEmotion: "positive" | "steady" | "anxious" | "tired", recordDays: number, totalFocusHours: number) {
    const cadence = recordDays >= 5 ? "已经形成了较稳定的记录节奏" : "正在逐步形成记录习惯";
    const focus = totalFocusHours >= 15 ? "专注投入也在增加" : "专注投入仍有提升空间";
    if (dominantEmotion === "anxious") {
      return `本${period === "week" ? "周" : "阶段"}你在焦虑感和行动推进之间来回拉扯，但 ${cadence}，${focus}，说明你已经开始把压力转化成更具体的行动。`;
    }
    if (dominantEmotion === "positive") {
      return `本${period === "week" ? "周" : "阶段"}你整体状态更积极，${cadence}，${focus}，成长开始从零散努力走向可复用的方法。`;
    }
    return `本${period === "week" ? "周" : "阶段"}你整体推进较为稳定，${cadence}，${focus}，说明你正在逐步建立自己的成长节奏。`;
  }

  private deriveNextSuggestion(dominantEmotion: "positive" | "steady" | "anxious" | "tired") {
    if (dominantEmotion === "anxious") {
      return "下一阶段建议优先做结构化表达训练，并把高焦虑任务拆成更小的步骤。";
    }
    if (dominantEmotion === "tired") {
      return "下一阶段建议先减轻任务密度，把高认知负荷动作集中在最清醒的时段完成。";
    }
    if (dominantEmotion === "positive") {
      return "下一阶段建议把最近的高质量输入整理成可复用模板，放大这段时间的正向积累。";
    }
    return "下一阶段建议继续保持记录与专注节奏，并尝试把关键结论沉淀成更结构化输出。";
  }

  private async getGoalProgressPayload() {
    return {
      goals: this.state.goals,
      dashboard: this.buildDashboard(),
      trajectory: this.buildTrajectory(),
      reportSummary: this.buildReport("week"),
    };
  }

  private bumpGoals(event: GrowthEvent) {
    const increment = event.emotion === "positive" ? 4 : 2;
    this.state.goals = this.state.goals.map((goal) =>
      event.goalIds.includes(goal.id)
        ? {
            ...goal,
            progress: Math.min(100, goal.progress + increment),
            streak: goal.streak + 1,
          }
        : goal,
    );
  }

  private bumpMetrics(event: GrowthEvent) {
    const todayLabel = normalizeMetricDate(new Date());
    const latest = this.state.metrics[this.state.metrics.length - 1];
    const conversationScore = Math.min(8, Math.max(2, Math.round(event.content.length / 18)));
    const focusScore = Math.min(8, Math.max(1, Math.round(event.focusMinutes / 15)));
    const goalScore = event.goalIds.length ? Math.min(6, event.goalIds.length * 2) : 1;
    const reflectionScore = event.content.includes("复盘") || event.content.includes("总结") ? 5 : event.emotion === "anxious" ? 2 : 3;
    const computedGrowthDelta = Math.min(
      20,
      Math.round(0.3 * conversationScore + 0.35 * focusScore + 0.2 * goalScore + 0.15 * reflectionScore + event.scoreDelta / 2),
    );

    if (!latest || latest.date !== todayLabel) {
      const next: MetricSnapshot = {
        date: todayLabel,
        growthScore: Math.min(120, computedGrowthDelta),
        focusHours: Number((event.focusMinutes / 60).toFixed(1)),
        moodScore: event.emotion === "positive" ? 78 : event.emotion === "anxious" ? 58 : 70,
        checkins: 1,
        events: 1,
      };
      this.state.metrics.push(next);
      return;
    }

    const next: MetricSnapshot = {
      ...latest,
      growthScore: Math.min(120, latest.growthScore + computedGrowthDelta),
      focusHours: Number((latest.focusHours + event.focusMinutes / 60).toFixed(1)),
      moodScore:
        event.emotion === "positive"
          ? Math.min(100, latest.moodScore + 3)
          : event.emotion === "anxious"
            ? Math.max(45, latest.moodScore - 2)
            : latest.moodScore,
      checkins: latest.checkins + 1,
      events: latest.events + 1,
    };
    this.state.metrics[this.state.metrics.length - 1] = next;
  }
}
