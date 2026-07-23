import type { ChatReplyResult, CoreTaskResult, ParsedRecordResult, TaskDecompositionResult } from "./types.js";
import type { PrimaryIntent } from "@bloom/shared";

function determineIntent(content: string): PrimaryIntent {
  const c = content.toLowerCase();

  // Tech / code help: mentions technical error or concept questions
  if (/报错|bug|error|exception|null|空指针|编译不|运行不了|为什么这样写|怎么改|怎么优化|是什么|区别|原理|底层|源码|怎么实现|怎么用|语法|不会写|看不懂|不明白/.test(c)) return "tech_help";

  // Emotion / struggling
  if (/学不动|不想学|好累|坚持不|崩溃|焦虑|压力|迷茫|没动力|想放弃|学不进去|太难|跟不上|我是不是不适合|没进步|卡住了/.test(c)) return "emotion_support";

  // Planning
  if (/怎么安排|怎么学|学什么|先学|接下来|路线|计划|节奏|时间不够|不知道怎么|如何入|方向|推荐|建议|哪个好/.test(c)) return "study_planning";

  // Review
  if (/总结|复盘|梳理|回顾|这周|这个月|这段时间|学到|收获|完成了|搞完了|做完了/.test(c)) return "review_reflection";

  // Project
  if (/项目|上线|部署|发布|功能做|模块写|接口调|跑通了|实现了|做完了|写完了/.test(c)) return "project_progress";

  // Goal change
  if (/目标变|不想继续|换方向|改目标|新目标|不想做|想转|调整方向/.test(c)) return "goal_shift";

  // Daily log: short message about what happened today
  if (/今天|刚刚|上午|下午|晚上|昨天|学了|做了|去了|处理|搞定|完成|看完|看完|写了/.test(c)) return "daily_log";

  // Short message: still likely daily log or casual check-in
  if (c.length < 12) return "daily_log";

  // Medium-length message with no clear tech keywords: probably sharing progress/thoughts
  return "daily_log";
}

function determineEmotion(content: string): string {
  const c = content.toLowerCase();
  if (/崩溃|绝望|想放弃|不行了|受不了/.test(c)) return "anxious";
  if (/焦虑|压力|紧张|担心|害怕|慌|烦/.test(c)) return "anxious";
  if (/好累|累死|没力气|不想动|困|拖|懒/.test(c)) return "tired";
  if (/开心|高兴|不错|搞定|好了|学会了|跑通|顺利|成就感|爽/.test(c)) return "positive";
  return "steady";
}

function extractTopics(content: string): string[] {
  const t: string[] = [];
  if (/java|spring|mybatis|mysql|redis|后端|服务|接口|api/.test(content.toLowerCase())) t.push("后端开发");
  if (/python|c\+\+|算法|数据结构|机器学习|深度学习|ai|模型|nlp|llm|transformer|大模型/.test(content.toLowerCase())) t.push("AI与算法");
  if (/前端|react|vue|css|html|js|javascript|组件|页面/.test(content.toLowerCase())) t.push("前端开发");
  if (/项目|部署|上线|产品|需求|设计|用户体验/.test(content)) t.push("项目推进");
  if (/语法|基础|入门|教程|书籍|视频|课程|练习|题/.test(content)) t.push("基础学习");
  if (/面试|简历|offer|求职|跳槽|笔试/.test(content)) t.push("求职准备");
  if (/运动|跑步|健身|睡眠|身体|饮食/.test(content)) t.push("健康生活");
  if (/焦虑|压力|情绪|心态|状态/.test(content)) t.push("情绪状态");
  return t.length ? t : ["成长记录"];
}

function genFollowUp(intent: PrimaryIntent, content: string): string {
  switch (intent) {
    case "daily_log": return "今天推进的这些里，哪一块让你觉得最有收获？";
    case "project_progress": return "这个项目接下来最值得继续推进的是哪块？";
    case "emotion_support": return "要不要先把节奏收一收，只做一件最小的事？";
    case "study_planning": return "你更想先打基础，还是直接做项目带动学习？";
    case "review_reflection": return "这段经历里，最值得记住的一点是什么？";
    case "goal_shift": return "新的方向里，你最想先验证的第一个动作是什么？";
    case "tech_help": return "你更想先弄懂原理层面，还是先解决手头这个问题？";
    default: return "接下来你想继续往前推进，还是先停下来梳理一下？";
  }
}

export const fallbackAi = {
  chatReply(input: {
    latestMessage: string;
    user: { mainGoal: string; mainProblem: string; replyStyle: string };
  }): ChatReplyResult {
    const msg = input.latestMessage;
    const intent = determineIntent(msg);
    const emotion = determineEmotion(msg);
    const topics = extractTopics(msg);
    const followUp = genFollowUp(intent, msg);
    const hasBlocker = /卡|不会|不懂|报错|烦|焦虑|压力|不知道怎么|没办法/.test(msg);
    const hasProgress = /完成|推进|搞定|做了|学了|跑通|实现|写好|看完|写完|学会/.test(msg);
    const extraction = {
      primaryIntent: intent,
      confidence: 0.78,
      topics,
      emotion: (emotion === "positive" ? "positive" : emotion === "anxious" ? "anxious" : emotion === "tired" ? "tired" : "steady") as any,
      hasProgress,
      hasBlocker,
      hasGoalChange: intent === "goal_shift",
      turnStage: "follow_up_waiting" as import("@bloom/shared").TurnStage,
      followUpAnswered: false,
      progressSummary: hasProgress ? `涉及 ${topics.join("、")}` : undefined,
      blockerSummary: hasBlocker ? "存在卡点" : undefined,
      suggestedFollowUp: followUp,
    };

    // --- tech_help ---
    if (intent === "tech_help") {
      return {
        reply:  "这个问题值得花时间搞清楚。\n\n"
              + "先给你核心结论：这不是你一个人卡，而是从会用走向真懂时的必经阶段。\n\n"
              + "你可以先试着用自己的一句话把这个问题说清楚，然后写一个最小 Demo 跑通，比看一百遍文档都有用。\n\n"
              + followUp,
        emotion: "你在主动追问原理，这不是卡壳，是在升级。",
        progress: "遇到问题愿意深挖，本身就是成长信号。",
        nextStep: "先用一句话说清问题，再写最小 Demo 验证。",
        taskSuggestion: "写一个 10 行的 Demo 验证你对这个问题的理解。",
        scheduleSuggestion: "留 30 分钟专注调试这块。",
        category: "学习",
        suggestedMetric: "中",
        detectedIntent: intent,
        extractedTopic: topics.join("、"),
        followUpQuestion: followUp,
        hasBlocker,
        extraction,
      };
    }

    // --- emotion_support ---
    if (intent === "emotion_support") {
      return {
        reply:  "我听到了。这种状态完全正常，不是你的能力问题。\n\n"
              + "高强度学习中最容易被忽略的不是知识难度，而是情绪和体力的自然消耗。\n\n"
              + "今天不用再逼自己往前冲，只做一件最小的事就够了。哪怕只是打开 IDE 写 5 行 Demo，也是在重新建立节奏感。\n\n"
              + followUp,
        emotion: "更像阶段性的疲劳，不是你不够好。",
        progress: "你愿意说出来，这本身就是一种有效自我觉察。",
        nextStep: "休整一下，然后只做一个最小动作重启。",
        taskSuggestion: "只做一件 5 分钟能完成的小事。",
        scheduleSuggestion: "今晚把学习压缩到 15 分钟，留更多恢复时间。",
        category: "情绪",
        suggestedMetric: "低",
        detectedIntent: intent,
        extractedTopic: topics.join("、"),
        followUpQuestion: followUp,
        hasBlocker: true,
        extraction,
      };
    }

    // --- study_planning ---
    if (intent === "study_planning") {
      return {
        reply:  "你现在最需要的不是更多任务，而是更清晰的先后顺序。\n\n"
              + "先把你要学的东西分成三层：\n"
              + "1. 跟你已有基础差距不大的 → 快速过\n"
              + "2. 跟你的核心方向强相关的 → 慢下来做 Demo\n"
              + "3. 容易反复卡住的 → 单独拆出来复盘\n\n"
              + "按这个顺序来，压力会小很多。\n\n"
              + followUp,
        emotion: "你在主动规划，方向感是对的。",
        progress: "从「盲目学」到「有顺序地学」是很大的进步。",
        nextStep: "今天就只定一个模块深入，不贪多。",
        taskSuggestion: "把接下来 1-2 天的核心学习点列出来。",
        scheduleSuggestion: "高难度内容放在你最清醒的时间段。",
        category: "学习",
        suggestedMetric: "中",
        detectedIntent: intent,
        extractedTopic: topics.join("、"),
        followUpQuestion: followUp,
        hasBlocker,
        extraction,
      };
    }

    // --- review_reflection ---
    if (intent === "review_reflection") {
      return {
        reply:  "这种感觉很重要——你不是在做完就忘了，而是在把经历变成可回顾的材料。\n\n"
              + "如果让我帮你总结：你已经不是只在「做事情」，而是开始「看见自己怎么做事」。这一步，本身就是从执行层跳到成长层的分界线。\n\n"
              + followUp,
        emotion: "状态稳的，而且有了自己的节奏感。",
        progress: "你在从忙碌走向真正的成长。",
        nextStep: "把这次复盘里最有价值的一个点写下来，明天围绕它继续。",
        taskSuggestion: "用 3 句话记下最重要的收获和一个卡点。",
        scheduleSuggestion: "明天开始时先看今天的复盘，再决定第一步。",
        category: "学习",
        suggestedMetric: "中",
        detectedIntent: intent,
        extractedTopic: topics.join("、"),
        followUpQuestion: followUp,
        hasBlocker,
        extraction,
      };
    }

    // --- project_progress ---
    if (intent === "project_progress") {
      return {
        reply:  "能做到这一步，说明你已经开始把学的东西往真实产出上接了，这个价值比单纯学知识点高很多。\n\n"
              + "每推进一个模块，也会反过来暴露下一轮最值得补的基础。\n\n"
              + followUp,
        emotion: "像是看见了一点项目推进的手感。",
        progress: `最明显的进展在 ${topics.join("、")} 这块。`,
        nextStep: "把今天最卡的一点和最顺的一点各记下来。",
        taskSuggestion: "把今天项目的关键推进写进日志。",
        scheduleSuggestion: "明天优先拆掉项目里最卡的一个点。",
        category: "学习",
        suggestedMetric: "高",
        detectedIntent: intent,
        extractedTopic: topics.join("、"),
        followUpQuestion: followUp,
        hasBlocker,
        extraction,
      };
    }

    // --- goal_shift ---
    if (intent === "goal_shift") {
      return {
        reply:  "方向变了很正常，不是反复横跳，而是你对自我的认知在加深。\n\n"
              + "我会把你这次的变化记下来，未来在报告里你会看到这些转折其实都是成长留下的痕迹。\n\n"
              + followUp,
        emotion: "这是思考后的主动调整，不是摇摆。",
        progress: "你在更清晰地定义自己想要什么。",
        nextStep: "先把新方向拆成一件今天就能动手的小事。",
        taskSuggestion: "写下新方向的第一步具体动作。",
        scheduleSuggestion: "这周花 1-2 天验证新方向是否顺手。",
        category: "生活",
        suggestedMetric: "中",
        detectedIntent: intent,
        extractedTopic: topics.join("、"),
        followUpQuestion: followUp,
        hasBlocker: false,
        extraction,
      };
    }

    // --- daily_log (and default fallback) ---
    return {
      reply:  "我听到了。\n\n"
            + `你提到的这些和你的长期目标「${input.user.mainGoal}」是相关的。`
            + (hasProgress ? "今天有明显的推进信号，这很好。" : "不管是推进还是表达，都是成长的一部分。")
            + "\n\n" + followUp,
      emotion: hasProgress ? "今天有真实推进，状态在线。" : "你的状态总体平稳。",
      progress: hasProgress ? `涉及 ${topics.join("、")}，有推进信号。` : "已记录到今天的成长数据中。",
      nextStep: "明天可以从今天最顺手的那一点继续启动。",
      taskSuggestion: "把今天的一件小收获记下来，明天更容易承接。",
      scheduleSuggestion: "明天预留 20 分钟，从今天最顺手的那一点启动。",
      category: "学习",
      suggestedMetric: hasProgress ? "中" : "中",
      detectedIntent: intent,
      extractedTopic: topics.join("、"),
      followUpQuestion: followUp,
      hasBlocker,
      extraction,
    };
  },

  generateCoreTask(input: {
    user: { mainGoal: string; mainProblem: string; growthDirection: string };
    recentThreads: { title: string }[];
  }): CoreTaskResult {
    const topic = input.recentThreads[0]?.title ?? input.user.mainGoal;
    return {
      title: topic.slice(0, 16) + (topic.length > 16 ? "..." : ""),
      subtitle: "结合你最近提到的主要问题, 围绕" + input.user.growthDirection + "方向完成一个高价值动作。",
      estimatedMinutes: 80,
      reason: "优先处理 " + input.user.mainProblem.slice(0, 20) + " 会更直接推动长期目标。",
    };
  },

  decomposeTask(input: { taskTitle: string }): TaskDecompositionResult {
    return {
      tasks: [
        "先用 10 分钟写清楚: " + input.taskTitle.slice(0, 16),
        "再用 25 分钟补齐 2 个核心支撑材料",
        "最后用 15 分钟把结论写成 3 句能表达的观点",
      ],
      summary: "Bloom 已经把当前任务拆成更容易开始的三个动作, 建议从第一步直接启动。",
    };
  },

  parseRecord(input: { content: string }): ParsedRecordResult {
    const emotion = determineEmotion(input.content);
    const topics = extractTopics(input.content);
    return {
      summary: "Bloom 已识别这条记录与 " + topics.join("、") + " 相关。",
      category: "学习",
      emotion,
      suggestedScheduleTitles: ["补充行动: " + input.content.slice(0, 12) + (input.content.length > 12 ? "..." : "")],
    };
  },
};
