import type { ChatReplyResult, CoreTaskResult, ParsedRecordResult, TaskDecompositionResult } from "./types.js";

export const fallbackAi = {
  chatReply(input: {
    latestMessage: string;
    user: { mainGoal: string; mainProblem: string; replyStyle: string };
  }): ChatReplyResult {
    const lead =
      input.user.replyStyle === "结构清晰"
        ? "我先帮你把问题拆开来看。"
        : input.user.replyStyle === "精准鼓励"
          ? "你已经在靠近目标了，我们直接抓最关键的一步。"
          : "我在，这件事我们可以温和但清楚地往前推。";

    return {
      reply: `${lead}\n\n你之前提到的长期目标是「${input.user.mainGoal}」，而你现在输入的是：「${input.latestMessage}」。这说明你正在围绕真正重要的事情行动。`,
      emotion: input.latestMessage.includes("焦虑") || input.latestMessage.includes("压力") ? "看起来你现在有点焦虑，但这更像阶段性卡点。" : "你的状态总体平稳，适合继续推进。",
      progress: `这条输入与目标「${input.user.mainGoal}」直接相关，也回应了你最近的困扰「${input.user.mainProblem}」。`,
      nextStep: "下一步建议：把这个问题拆成一个今天就能完成的小动作，再在晚上复盘它的结果。",
      taskSuggestion: "建议把这件事收敛成今天唯一的重点行动。",
      scheduleSuggestion: "建议今晚预留 30 分钟低打扰时间来推进这件事。",
      category: "职业",
      suggestedMetric: "中",
    };
  },
  generateCoreTask(input: {
    user: { mainGoal: string; mainProblem: string; growthDirection: string };
    recentThreads: { title: string }[];
  }): CoreTaskResult {
    const topic = input.recentThreads[0]?.title ?? input.user.mainGoal;
    return {
      title: `围绕「${topic.slice(0, 12)}${topic.length > 12 ? "…" : ""}」推进核心动作`,
      subtitle: `结合你最近提到的主要问题，围绕${input.user.growthDirection}方向完成一个高价值动作。`,
      estimatedMinutes: 80,
      reason: `优先处理「${input.user.mainProblem}」会更直接推动长期目标。`,
    };
  },
  decomposeTask(input: { taskTitle: string }): TaskDecompositionResult {
    return {
      tasks: [
        `先用 10 分钟写清楚：${input.taskTitle}`,
        "再用 25 分钟补齐 2 个核心支撑材料",
        "最后用 15 分钟把结论写成 3 句能表达的观点",
      ],
      summary: "Bloom 已经把当前任务拆成更容易开始的三个动作，建议从第一步直接启动。",
    };
  },
  parseRecord(input: { content: string }): ParsedRecordResult {
    const category = input.content.includes("运动") || input.content.includes("睡眠") ? "健康" : input.content.includes("学习") ? "学习" : "职业";
    const emotion = input.content.includes("焦虑") || input.content.includes("压力") ? "anxious" : input.content.includes("完成") ? "positive" : "steady";
    return {
      summary: `Bloom 已识别这条记录与「${category}」方向相关，并会同步更新日程与成长数据。`,
      category,
      emotion,
      suggestedScheduleTitles: [`补充行动：${input.content.slice(0, 12)}${input.content.length > 12 ? "…" : ""}`],
    };
  },
};
