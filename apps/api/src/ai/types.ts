import type {
  DailyPlan,
  DailyTask,
  Emotion,
  Goal,
  GrowthDirection,
  MessageSummary,
  UserProfile,
  UserSettings,
} from "@bloom/shared";

export interface AiThreadContext {
  title: string;
  latestUserContent?: string;
  latestAssistantContent?: string;
}

export interface AiGoalContext {
  title: string;
  category: GrowthDirection;
  progress: number;
  note: string;
}

export interface AiUserContext {
  name: string;
  username: string;
  grade: string;
  mainGoal: string;
  mainProblem: string;
  growthDirection: GrowthDirection;
  replyStyle: UserSettings["replyStyle"];
}

export interface ChatReplyResult {
  reply: string;
  emotion: string;
  progress: string;
  nextStep: string;
  taskSuggestion?: string;
  scheduleSuggestion?: string;
  category?: string;
  suggestedMetric?: string;
}

export interface CoreTaskResult {
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  reason?: string;
}

export interface TaskDecompositionResult {
  tasks: string[];
  summary: string;
}

export interface ParsedRecordResult {
  summary: string;
  category: string;
  emotion: string;
  suggestedScheduleTitles: string[];
}

export interface ReportSynthesisResult {
  title: string;
  summary: string;
  nextSuggestion: string;
}

export interface AIConversationResult {
  assistantText: string;
  summary: MessageSummary;
  category: GrowthDirection | "情绪";
  emotion: Emotion;
  scoreDelta: number;
  focusMinutes: number;
  suggestedSchedule?: Pick<DailyTask, "title" | "time" | "tag">[];
}

export interface AICoreTaskResult {
  focusTitle: string;
  focusSubtitle: string;
  timeBudgetMinutes: number;
  deadline: string;
  tasks: string[];
  reminder: string;
}

export interface AIDecomposeResult {
  tasks: string[];
  summary: string;
}

export interface AIConversationContext {
  profile: UserProfile;
  settings: UserSettings;
  input: string;
  thread: AiThreadContext;
  goals: AiGoalContext[];
}

export interface AICoreTaskContext {
  profile: UserProfile;
  settings: UserSettings;
  recentThreads: AiThreadContext[];
  recentEvents: string[];
  goals: Goal[];
}

export interface AIDecomposeContext {
  profile: UserProfile;
  settings: UserSettings;
  currentTask: DailyPlan;
}

export interface AIParseRecordContext {
  user: AiUserContext;
  content: string;
}

export interface AiProvider {
  chatReply(input: {
    user: AiUserContext;
    thread: AiThreadContext;
    goals: AiGoalContext[];
    latestMessage: string;
  }): Promise<AIConversationResult>;
  generateCoreTask(input: {
    user: AiUserContext;
    goals: AiGoalContext[];
    recentThreads: AiThreadContext[];
    recentEvents: string[];
  }): Promise<AICoreTaskResult>;
  decomposeTask(input: {
    user: AiUserContext;
    currentTask: DailyPlan;
  }): Promise<AIDecomposeResult>;
  parseRecord(input: AIParseRecordContext): Promise<ParsedRecordResult & { category: GrowthDirection | "情绪"; emotion: Emotion }>;
  synthesizeReport(input: {
    user: AiUserContext;
    periodLabel: string;
    stats: string[];
    highlights: string[];
    dominantEmotion: string;
  }): Promise<ReportSynthesisResult>;
}
