import type {
  AICoreTaskResult,
  AIDecomposeResult,
  AIConversationResult,
  AiProvider,
  ChatReplyResult,
  CoreTaskResult,
  ParsedRecordResult,
  ReportSynthesisResult,
  TaskDecompositionResult,
} from "./types.js";
import { buildChatPrompt, buildCoreTaskPrompt, buildDecomposePrompt, buildParsePrompt, buildReportPrompt } from "./prompt-builder.js";
import { zhipuClient } from "./providers/zhipu-client.js";
import { bailianClient } from "./providers/bailian-client.js";
import { fallbackAi } from "./fallback.js";

const normalizeEmotion = (value: string): "positive" | "steady" | "anxious" | "tired" => {
  if (["positive", "积极", "开心", "正向", "理解支持", "稳步提升"].includes(value)) return "positive";
  if (["anxious", "焦虑", "紧张"].includes(value)) return "anxious";
  if (["tired", "疲惫", "没动力"].includes(value)) return "tired";
  return "steady";
};

const normalizeCategory = (value: string): "职业" | "健康" | "学习" | "生活" | "情绪" => {
  if (["职业", "求职", "工作", "面试准备"].includes(value)) return "职业";
  if (["学习", "读书", "课程"].includes(value)) return "学习";
  if (["健康", "运动", "睡眠"].includes(value)) return "健康";
  if (["生活", "习惯", "日常"].includes(value)) return "生活";
  return "情绪";
};

const toScoreDelta = (emotion: "positive" | "steady" | "anxious" | "tired") => {
  if (emotion === "positive") return 7;
  if (emotion === "anxious") return 3;
  if (emotion === "tired") return 2;
  return 4;
};

const thisMetricDelta = (value: string | undefined, emotion: "positive" | "steady" | "anxious" | "tired") => {
  if (value?.includes("高")) return 8;
  if (value?.includes("低")) return 3;
  return toScoreDelta(emotion);
};

const toFocusMinutes = (category: "职业" | "健康" | "学习" | "生活" | "情绪") => {
  if (category === "学习") return 70;
  if (category === "健康") return 40;
  if (category === "情绪") return 25;
  return 55;
};

const hasBailian = () => Boolean(process.env.ALIBABA_BAILIAN_API_KEY);
const hasZhipu = () => Boolean(process.env.ZAI_API_KEY);

const liveClient = {
  chatReply: async (prompt: string): Promise<ChatReplyResult> => {
    if (hasBailian()) return bailianClient.chatReply(prompt);
    if (hasZhipu()) return zhipuClient.chatReply(prompt);
    throw new Error("No live AI provider configured");
  },
  coreTask: async (prompt: string): Promise<CoreTaskResult> => {
    if (hasBailian()) return bailianClient.coreTask(prompt);
    if (hasZhipu()) return zhipuClient.coreTask(prompt);
    throw new Error("No live AI provider configured");
  },
  decomposeTask: async (prompt: string): Promise<TaskDecompositionResult> => {
    if (hasBailian()) return bailianClient.decomposeTask(prompt);
    if (hasZhipu()) return zhipuClient.decomposeTask(prompt);
    throw new Error("No live AI provider configured");
  },
  parseRecord: async (prompt: string): Promise<ParsedRecordResult> => {
    if (hasBailian()) return bailianClient.parseRecord(prompt);
    if (hasZhipu()) return zhipuClient.parseRecord(prompt);
    throw new Error("No live AI provider configured");
  },
  synthesizeReport: async (prompt: string): Promise<ReportSynthesisResult> => {
    if (hasBailian()) return bailianClient.parseRecord(prompt) as unknown as Promise<ReportSynthesisResult>;
    if (hasZhipu()) return zhipuClient.parseRecord(prompt) as unknown as Promise<ReportSynthesisResult>;
    throw new Error("No live AI provider configured");
  },
};

export const aiProvider: AiProvider = {
  async chatReply(input: Parameters<AiProvider["chatReply"]>[0]): Promise<AIConversationResult> {
    try {
      const result = await liveClient.chatReply(
        buildChatPrompt({
          user: input.user,
          thread: input.thread,
          goals: input.goals,
          latestMessage: input.latestMessage,
        }),
      );

      const emotion = normalizeEmotion(result.emotion);
      const category = normalizeCategory(result.category ?? "情绪");
      return {
        assistantText: result.reply,
        summary: {
          memory: result.reply,
          emotion: result.emotion,
          progress: result.progress,
          nextStep: result.nextStep,
          taskSuggestion: result.taskSuggestion,
          scheduleSuggestion: result.scheduleSuggestion,
          detectedIntent: result.detectedIntent,
          extractedTopic: result.extractedTopic,
          followUpQuestion: result.followUpQuestion,
          hasBlocker: result.hasBlocker,
        },
        extraction: result.extraction,
        category,
        emotion,
        scoreDelta: thisMetricDelta(result.suggestedMetric, emotion),
        focusMinutes: toFocusMinutes(category),
        suggestedSchedule: result.scheduleSuggestion
          ? [
              {
                title: result.scheduleSuggestion,
                time: "19:30 - 20:00",
                tag: "AI 建议",
              },
            ]
          : undefined,
      };
    } catch {
      const fallback = fallbackAi.chatReply({
        latestMessage: input.latestMessage,
        user: {
          mainGoal: input.user.mainGoal,
          mainProblem: input.user.mainProblem,
          replyStyle: input.user.replyStyle,
        },
      });
      const emotion = normalizeEmotion(fallback.emotion);
      const category = normalizeCategory(fallback.category ?? "职业");
      return {
        assistantText: fallback.reply,
        summary: {
          memory: fallback.reply,
          emotion: fallback.emotion,
          progress: fallback.progress,
          nextStep: fallback.nextStep,
          taskSuggestion: fallback.taskSuggestion,
          scheduleSuggestion: fallback.scheduleSuggestion,
          detectedIntent: fallback.detectedIntent,
          extractedTopic: fallback.extractedTopic,
          followUpQuestion: fallback.followUpQuestion,
          hasBlocker: fallback.hasBlocker,
        },
        extraction: fallback.extraction,
        category,
        emotion,
        scoreDelta: toScoreDelta(emotion),
        focusMinutes: toFocusMinutes(category),
        suggestedSchedule: fallback.scheduleSuggestion
          ? [
              {
                title: fallback.scheduleSuggestion,
                time: "19:30 - 20:00",
                tag: "AI 建议",
              },
            ]
          : undefined,
      };
    }
  },

  async generateCoreTask(input: Parameters<AiProvider["generateCoreTask"]>[0]): Promise<AICoreTaskResult> {
    try {
      const result = await liveClient.coreTask(
        buildCoreTaskPrompt({
          user: input.user,
          recentThreads: input.recentThreads,
          recentEvents: input.recentEvents,
        }),
      );
      return {
        focusTitle: result.title,
        focusSubtitle: result.subtitle,
        timeBudgetMinutes: Math.max(25, Math.min(120, result.estimatedMinutes || 75)),
        deadline: "截止时间 今天 20:30",
        tasks: [result.reason || "先梳理背景", "再补充关键支撑", "最后形成可表达结论"],
        reminder: `${input.user.name}，今天优先把与「${input.user.mainGoal}」最相关的动作完成。`,
      };
    } catch {
      const fallback = fallbackAi.generateCoreTask({
        user: {
          mainGoal: input.user.mainGoal,
          mainProblem: input.user.mainProblem,
          growthDirection: input.user.growthDirection,
        },
        recentThreads: input.recentThreads,
      });
      return {
        focusTitle: fallback.title,
        focusSubtitle: fallback.subtitle,
        timeBudgetMinutes: fallback.estimatedMinutes,
        deadline: "截止时间 今天 20:30",
        tasks: [fallback.reason || "先梳理背景", "再补充关键支撑", "最后形成可表达结论"],
        reminder: `${input.user.name}，今天优先把与「${input.user.mainGoal}」最相关的动作完成。`,
      };
    }
  },

  async decomposeTask(input: Parameters<AiProvider["decomposeTask"]>[0]): Promise<AIDecomposeResult> {
    try {
      const result = await liveClient.decomposeTask(
        buildDecomposePrompt({
          user: input.user,
          taskTitle: input.currentTask.focusTitle,
          taskSubtitle: input.currentTask.focusSubtitle,
        }),
      );
      return {
        tasks: result.tasks,
        summary: result.summary,
      };
    } catch {
      const fallback = fallbackAi.decomposeTask({ taskTitle: input.currentTask.focusTitle });
      return {
        tasks: fallback.tasks,
        summary: fallback.summary,
      };
    }
  },

  async parseRecord(input: Parameters<AiProvider["parseRecord"]>[0]) {
    try {
      const result = await liveClient.parseRecord(
        buildParsePrompt({
          user: input.user,
          content: input.content,
        }),
      );
      return {
        summary: result.summary,
        category: normalizeCategory(result.category),
        emotion: normalizeEmotion(result.emotion),
        suggestedScheduleTitles: result.suggestedScheduleTitles,
      };
    } catch {
      const fallback = fallbackAi.parseRecord({ content: input.content });
      return {
        summary: fallback.summary,
        category: normalizeCategory(fallback.category),
        emotion: normalizeEmotion(fallback.emotion),
        suggestedScheduleTitles: fallback.suggestedScheduleTitles,
      };
    }
  },

  async synthesizeReport(input: Parameters<AiProvider["synthesizeReport"]>[0]) {
    try {
      return await liveClient.synthesizeReport(
        buildReportPrompt({
          periodLabel: input.periodLabel,
          mainGoal: input.user.mainGoal,
          mainProblem: input.user.mainProblem,
          dominantEmotion: input.dominantEmotion,
          stats: input.stats,
          highlights: input.highlights,
        }),
      );
    } catch {
      return {
        title: input.dominantEmotion === "焦虑" ? "在波动中重新建立结构和节奏" : "持续积累，开始看见更清晰的进步",
        summary: `本${input.periodLabel}你围绕「${input.user.mainGoal}」持续推进，${input.highlights[0] ?? "也开始出现更清晰的成长信号"}。`,
        nextSuggestion: input.dominantEmotion === "焦虑" ? "优先拆小高压力任务，并保留固定复盘时段。" : "继续保持记录与专注节奏，把高质量输入沉淀成自己的表达模板。",
      };
    }
  },
};
