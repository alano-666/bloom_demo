export type Stage = "学生" | "求职" | "职场" | "创业";
export type GrowthDirection = "职业" | "健康" | "学习" | "生活";
export type Emotion = "positive" | "steady" | "anxious" | "tired";
export type EventSource = "quick-log" | "session" | "seed" | "goal-progress" | "focus";
export type MessageRole = "user" | "assistant";
export type ReportPeriod = "week" | "month" | "quarter" | "year";
export type ReplyStyle = "治愈陪伴" | "结构清晰" | "精准鼓励";
export type AttachmentType = "file" | "image" | "audio";

export interface UserProfile {
  completed: boolean;
  name: string;
  username: string;
  email: string;
  avatarName: string;
  age?: number;
  grade: string;
  stage: Stage;
  growthDirection: GrowthDirection;
  longTermGoal: string;
  currentChallenge: string;
  mainGoal: string;
  mainProblem: string;
  joinedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  category: GrowthDirection;
  progress: number;
  targetDate: string;
  streak: number;
  note: string;
}

export interface GoalProgressLog {
  id: string;
  goalId: string;
  note: string;
  progressDelta: number;
  createdAt: string;
}

export interface GrowthEvent {
  id: string;
  content: string;
  date: string;
  source: EventSource;
  emotion: Emotion;
  category: GrowthDirection | "情绪";
  goalIds: string[];
  scoreDelta: number;
  focusMinutes: number;
}

export interface ConversationThread {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  lastInputContent?: string;
  lastInputAt?: string;
}

export interface AttachmentMeta {
  id: string;
  type: AttachmentType;
  name: string;
  previewText?: string;
}

export interface MessageSummary {
  memory: string;
  emotion: string;
  progress: string;
  nextStep: string;
  taskSuggestion?: string;
  scheduleSuggestion?: string;
}

export interface Message {
  id: string;
  threadId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  summary?: MessageSummary;
  attachments?: AttachmentMeta[];
}

export interface DailyTask {
  id: string;
  title: string;
  time: string;
  tag: string;
  completed: boolean;
  source?: "manual" | "ai" | "parsed";
}

export interface DailyPlan {
  focusTitle: string;
  focusSubtitle: string;
  timeBudgetMinutes: number;
  deadline: string;
  progress: number;
  reminder: string;
  tasks: string[];
  schedule: DailyTask[];
}

export interface MetricSnapshot {
  date: string;
  growthScore: number;
  focusHours: number;
  moodScore: number;
  checkins: number;
  events: number;
}

export interface UserSettings {
  reminderEnabled: boolean;
  reminderWindow: string;
  eveningReviewTime: string;
  voiceEnabled: boolean;
  imageEnabled: boolean;
  personalizedRhythm: boolean;
  darkMode: boolean;
  fontScale: "小" | "中" | "大";
  replyStyle: ReplyStyle;
}

export interface DashboardData {
  greeting: string;
  dateLabel: string;
  dailyPlan: DailyPlan;
  growthScore: number;
  growthScoreCap: number;
  streakDays: number;
  activeDays: number;
  focusHours: number;
  emotionLabel: string;
  emotionTrend: string;
  reminder: string;
  screenHours: number;
  sleepHours: number;
}

export interface StatBlock {
  label: string;
  value: string;
  hint: string;
}

export interface ReportItem {
  id: string;
  title: string;
  summary: string;
  detail: string;
}

export interface ReportData {
  period: ReportPeriod;
  rangeLabel: string;
  title: string;
  summary: string;
  score: number;
  delta: number;
  highlights: ReportItem[];
  stats: StatBlock[];
  nextSuggestion: string;
}

export interface TrendPoint {
  date: string;
  score: number;
  focusHours: number;
}

export interface RadarPoint {
  subject: string;
  current: number;
  previous: number;
}

export interface TimelineItem {
  date: string;
  title: string;
  score: number;
  tag: string;
}

export interface TrajectoryData {
  tabs: string[];
  overview: {
    score: number;
    delta: number;
    days: number;
    focusHours: number;
  };
  trend: TrendPoint[];
  radar: RadarPoint[];
  timeline: TimelineItem[];
  habits: string[];
  emotions: { label: string; count: number }[];
  healthCards: StatBlock[];
}

export interface BootstrapResponse {
  hasOnboarded: boolean;
  profile: UserProfile | null;
  dashboard: DashboardData | null;
  recentThreads: ConversationThread[];
  goals: Goal[];
  reportSummary: ReportData | null;
  settings: UserSettings;
}

export interface SessionResponse {
  thread: ConversationThread;
  messages: Message[];
}

export interface QuickLogParseResponse {
  parsedSummary: string;
  addedSchedule: DailyTask[];
  bootstrap: BootstrapResponse;
  trajectory: TrajectoryData;
  reportSummary: ReportData;
}

export interface PostMessageResponse {
  session: SessionResponse;
  dashboard: BootstrapResponse["dashboard"];
  goals: Goal[];
  reportSummary: ReportData;
  trajectory: TrajectoryData;
}

export interface FocusCompleteResponse {
  dashboard: DashboardData;
  goals: Goal[];
  reportSummary: ReportData;
  trajectory: TrajectoryData;
}

export interface CreateThreadResponse {
  thread: ConversationThread;
  session: SessionResponse;
  threads: ConversationThread[];
}

export interface DecomposeTaskResponse {
  tasks: string[];
  summary: string;
}

export interface GoalHistoryEntry {
  id: string;
  timestamp: string;
  previousGoal: string;
  newGoal: string;
  previousProblem: string;
  newProblem: string;
}

export interface DemoState {
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

export interface OnboardingInput {
  name: string;
  username?: string;
  email?: string;
  age?: number;
  grade: string;
  stage?: Stage;
  growthDirection?: GrowthDirection;
  longTermGoal: string;
  currentChallenge: string;
  mainGoal?: string;
  mainProblem?: string;
}

export interface CreateGoalInput {
  title: string;
  category: GrowthDirection;
  targetDate: string;
  note: string;
}

export interface GoalProgressInput {
  note: string;
  progressDelta: number;
}

export interface ThreadCreateInput {
  title: string;
}

export interface SessionMessageInput {
  threadId: string;
  content: string;
  attachments?: AttachmentMeta[];
}

export interface UpdateProfileInput {
  name: string;
  username: string;
  grade: string;
  mainGoal: string;
  mainProblem: string;
}
