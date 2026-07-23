import type { ChatReplyResult, CoreTaskResult, ParsedRecordResult, TaskDecompositionResult } from "./types.js";
import type { PrimaryIntent } from "@bloom/shared";
import { nanoid } from "nanoid";

function determineCategory(content: string): string {
  if (/运动|睡眠|跑步|饮食|身体|健康|锻炼|健身/.test(content)) return "健康";
  if (/学习|课程|读书|笔记|方法|教程|看书|视频|资料|文档|语法|集合|接口|抽象类|异常|java|python|c\+\+|后端/.test(content)) return "学习";
  if (/生活|习惯|日常|计划|复盘|整理/.test(content)) return "生活";
  if (/焦虑|压力|紧张|迷茫|情绪|没动力|难过|累|烦/.test(content)) return "情绪";
  return "职业";
}

function determineEmotion(content: string): string {
  if (/焦虑|压力|紧张|急|慌|崩/.test(content)) return "anxious";
  if (/累|困|没动力|疲惫|乏|拖延|不想/.test(content)) return "tired";
  if (/完成|进展|顺利|不错|搞定|好了|学会|开心|去玩|放松/.test(content)) return "positive";
  return "steady";
}

function determineIntent(content: string): PrimaryIntent {
  if (/代码|报错|bug|error|exception|null|编译|运行|语法错误|空指针/.test(content)) return "tech_help";
  if (/学不动|学不进去|好累|坚持不住|焦虑|压力大|崩溃|迷茫/.test(content)) return "emotion_support";
  if (/计划|安排|节奏|进度|学什么|怎么学|接下来|路线|先学/.test(content)) return "study_planning";
  if (/复盘|总结|搞完|做完了|学完了|完成了|帮我梳理/.test(content)) return "review_reflection";
  if (/项目|功能|接口|模块|上线|推进了|跑通|实现了/.test(content)) return "project_progress";
  if (/目标变了|不想继续原来的方向|改一下目标|最近困扰变了/.test(content)) return "goal_shift";
  if (/困难|瓶颈|不知道怎么|有什么办法|请教|问问|聊天|想分享|心得|感悟|感受|启发/.test(content)) return "light_companion";
  if (/今天|刚刚|下班|去玩|回温|温习|推进|处理了|做了/.test(content)) return "daily_log";
  return "light_companion";
}

function extractTopics(content: string): string[] {
  const topics: string[] = [];
  if (/Java|java|语法|集合|接口|抽象类|异常/.test(content)) topics.push("Java基础");
  if (/AI项目|AI|项目|接口|功能|模块/.test(content)) topics.push("AI项目");
  if (/后端|Spring|数据库|MySQL|Redis/.test(content)) topics.push("后端开发");
  if (/情绪|焦虑|压力|放松|去玩|休息/.test(content)) topics.push("情绪状态");
  return topics.length ? topics : ["成长记录"];
}

export const fallbackAi = {
  chatReply(input: {
    latestMessage: string;
    user: { mainGoal: string; mainProblem: string; replyStyle: string };
  }): ChatReplyResult {
    const msg = input.latestMessage;
    const intent = determineIntent(msg);
    const category = determineCategory(msg);
    const emotion = determineEmotion(msg);
    const topics = extractTopics(msg);
    const followUp = "如果继续往下聊，你最想接着说今天的哪个部分？";
    const hasBlocker = /报错|卡|不会|不懂|难|焦虑|压力/.test(msg);
    const hasProgress = /推进|完成|温习|回温|跑通|实现|学了|做了/.test(msg);

    const extraction = {
      primaryIntent: intent,
      secondaryIntent: intent === "daily_log" && /项目/.test(msg) ? "project_progress" : undefined,
      confidence: 0.82,
      topics,
      emotion: (emotion === "positive" ? "positive" : emotion === "anxious" ? "anxious" : emotion === "tired" ? "tired" : "steady") as any,
      hasProgress,
      hasBlocker,
      hasGoalChange: intent === "goal_shift",
      turnStage: (followUp ? "follow_up_waiting" : "resolved") as import("@bloom/shared").TurnStage,
      followUpAnswered: false,
      progressSummary: hasProgress ? `提到了 ${topics.join("、")} 的推进` : undefined,
      blockerSummary: hasBlocker ? "存在卡点或压力信号" : undefined,
      reflectionSummary: intent === "review_reflection" || intent === "daily_log" ? "包含当日记录/复盘信息" : undefined,
      mentionedGoal: intent === "goal_shift" ? msg : undefined,
      mentionedProblem: hasBlocker ? msg : undefined,
      suggestedFollowUp: followUp,
    };

    if (intent === "daily_log") {
      return {
        reply: "今天其实过得挺扎实的。你一边回温了基础内容，一边还在推进自己的项目，这说明你不是只停留在学概念，而是在把知识往真实产出上接。" +
          "\n\n如果把今天拆开看：\n- 回温基础，是在稳住底层能力\n- 推进项目，是在把能力往实战里落\n- 下班去玩，也是在给自己留恢复空间，这对长期坚持很重要。" +
          "\n\n我更想追问一句：" + followUp,
        emotion: emotion === "positive" ? "今天整体状态偏积极，也有一点完成后的放松感。" : "你的状态总体平稳，今天有真实推进。",
        progress: hasProgress ? `今天的输入里同时包含了「${topics.join(" / ")}」的推进信号。` : `今天的记录和长期目标「${input.user.mainGoal}」是相关的。`,
        nextStep: "把今天最值得记住的一步记录下来，明天就更容易接着往前走。",
        taskSuggestion: /项目/.test(msg) ? "把今天推进项目中最关键的一步记录下来。" : "把今天学到的一个核心点写成 3 句话复盘。",
        scheduleSuggestion: "明天预留 20~30 分钟，先从今天最顺手的那一小步重新启动。",
        category,
        suggestedMetric: hasProgress ? "高" : "中",
        detectedIntent: intent,
        extractedTopic: topics.join("、"),
        followUpQuestion: followUp,
        hasBlocker,
        extraction,
      };
    }

    if (intent === "project_progress") {
      return {
        reply: "我能看出来你今天不是在空转，而是在实打实推进项目。对你这样的成长阶段来说，项目推进的价值很高，因为它会把原本零散的知识真正串起来。" +
          "\n\n如果把今天的价值说清楚：\n- 你不是只在学，而是在产出\n- 你不是只会做 Demo，而是在形成自己的问题解决路径\n- 每推进一个模块，都会反过来暴露下一轮最值得补的基础" +
          "\n\n接下来最值得继续追的，是：" + followUp,
        emotion: emotion === "positive" ? "今天的状态偏积极，像是看见了一点项目推进的手感。" : "状态总体稳定，但项目里可能还有一些没彻底解决的小卡点。",
        progress: `今天最明显的进展来自「${topics.join("、")}」相关的项目动作。`,
        nextStep: "把今天推进项目时最卡的一处和最顺的一处各记一条，明天就更容易承接。",
        taskSuggestion: "把今天项目推进里最关键的一步写进项目日志。",
        scheduleSuggestion: "明天优先把当前项目里最卡的一个点单独拆开推进。",
        category,
        suggestedMetric: "高",
        detectedIntent: intent,
        extractedTopic: topics.join("、"),
        followUpQuestion: followUp,
        hasBlocker,
        extraction,
      };
    }

    if (intent === "emotion_support") {
      return {
        reply: "这种状态非常正常，尤其是当你一边想补基础、一边又希望项目能往前跑的时候，大脑会很容易过载。" +
          "\n\n你现在不需要硬撑着把效率拉满，更重要的是先把节奏找回来。给你两个轻量选择：\n- 先停 15~20 分钟，让身体和注意力放松一下\n- 或者只做一个最低门槛动作，比如改 1 个小 bug、写 5 行 Demo，把自己从停滞里拽回来" +
          "\n\n我会更关心的是：" + followUp,
        emotion: "你现在更像是在经历阶段性的疲惫或焦虑，而不是能力不够。",
        progress: "虽然状态起伏，但你愿意把它说出来，本身就是在进行有效的自我觉察。",
        nextStep: "不要要求自己立刻恢复满状态，先完成一个最小动作就够了。",
        taskSuggestion: "先完成一个 5 分钟能做完的小动作，把节奏重新接上。",
        scheduleSuggestion: "今晚不再硬赶进度，把学习缩到 15 分钟以内，留更多恢复空间。",
        category,
        suggestedMetric: "低",
        detectedIntent: intent,
        extractedTopic: topics.join("、"),
        followUpQuestion: followUp,
        hasBlocker: true,
        extraction,
      };
    }

    if (intent === "review_reflection") {
      return {
        reply: "这一轮你不是只是做完了事情，而是在开始把过程变成可复盘的材料，这一步很重要。" +
          "\n\n如果把今天/这一阶段的意义梳理一下：\n- 你已经有了真实推进\n- 也开始能看见哪些环节顺、哪些环节卡\n- 这正是从“忙碌”走向“成长”的分界点" +
          "\n\n我想顺着问一句：" + followUp,
        emotion: "你的状态是稳的，而且已经开始形成自己的节奏。",
        progress: "你现在不只是做事，也在开始看见自己的推进路径。",
        nextStep: "把这次复盘里最值得保留的一点写下来，明天继续沿着那一点推进。",
        taskSuggestion: "用 3 句话写下今天最重要的一个收获和一个卡点。",
        scheduleSuggestion: "明天开始前先看一眼今天的复盘，再决定第一步做什么。",
        category,
        suggestedMetric: "中",
        detectedIntent: intent,
        extractedTopic: topics.join("、"),
        followUpQuestion: followUp,
        hasBlocker,
        extraction,
      };
    }

    if (intent === "study_planning") {
      return {
        reply: "你现在最需要的不是再堆很多任务，而是把学习顺序排得更顺手。" +
          "\n\n我会建议按轻重来：\n- 通用语法和你熟悉的部分可以快速过\n- 跟后端真正强相关的模块要慢下来做 Demo\n- 容易反复卡住的点，要单独拆出来复盘" +
          "\n\n如果按你当前阶段，我会把重点继续放在：" + topics.join("、") + "。" +
          "\n\n接下来我想确认的是：" + followUp,
        emotion: "你的规划感是在线的，这很好。",
        progress: "你已经在从“盲学”走向“有顺序地学”。",
        nextStep: "今天先只定一个模块，把它学透，不急着铺开太多。",
        taskSuggestion: "把接下来一到两天最关键的学习点列成清单。",
        scheduleSuggestion: "把最烧脑的内容放到你最清醒的时段。",
        category,
        suggestedMetric: "中",
        detectedIntent: intent,
        extractedTopic: topics.join("、"),
        followUpQuestion: followUp,
        hasBlocker,
        extraction,
      };
    }

    if (intent === "tech_help") {
      return {
        reply: "这个问题问得很对，我先给结论，再帮你拆层次。" +
          "\n\n核心上，你现在问的不是一个孤立知识点，而是它在整个技术体系里怎么和你已有基础接上。" +
          "\n\n可以这样理解：\n1. 先定义它是什么\n2. 再看关键规则和边界\n3. 再和你熟悉的语言或经验对比\n4. 最后落到真实开发或项目里怎么用" +
          "\n\n如果你愿意，我下一轮可以直接按“结论 → 对比 → 代码示例”的方式继续帮你展开。",
        emotion: "你现在更像是在往深层理解走，而不是只停留在会用。",
        progress: "愿意追问原理本身就是能力升级的信号。",
        nextStep: "把你最想弄懂的那个点再具体说一句，我就按代码和场景继续拆。",
        taskSuggestion: "把这个概念对应的一个最小 Demo 写出来，边写边理解。",
        scheduleSuggestion: "今晚留 20 分钟，只围绕这一个点做定向理解。",
        category,
        suggestedMetric: "中",
        detectedIntent: intent,
        extractedTopic: topics.join("、"),
        followUpQuestion: followUp,
        hasBlocker,
        extraction,
      };
    }

    return {
      reply: (input.user.replyStyle === "结构清晰" ? "我先帮你把这件事梳理一下。" : "我在，我们可以慢慢把这件事说清楚。") +
        "\n\n你刚刚说的内容，其实已经和你的长期目标「" + input.user.mainGoal + "」有连接。" +
        " 我更关心的是，今天这件事对你来说代表的是推进、卡点，还是一种状态变化。" +
        "\n\n如果你愿意，我们可以顺着刚才这句话继续往下聊：" + followUp,
      emotion: "你的状态总体平稳，适合继续推进。",
      progress: "这条输入和你当前的成长主线是相关的。",
      nextStep: "把这句话背后的关键点再多展开一点，我们就能更准确地拆下一步。",
      taskSuggestion: "先把今天最想说清楚的一件事补充完整。",
      scheduleSuggestion: "今晚留一点低打扰时间，把今天最重要的一件事说清楚。",
      category: category as any,
      suggestedMetric: "中",
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
      subtitle: "结合你最近提到的主要问题, 围绕" + input.user.growthDirection + "方向完成一个高价值动作.",
      estimatedMinutes: 80,
      reason: "优先处理 " + input.user.mainProblem.slice(0, 20) + " 会更直接推动长期目标.",
    };
  },

  decomposeTask(input: { taskTitle: string }): TaskDecompositionResult {
    return {
      tasks: [
        "先用 10 分钟写清楚: " + input.taskTitle.slice(0, 16),
        "再用 25 分钟补齐 2 个核心支撑材料",
        "最后用 15 分钟把结论写成 3 句能表达的观点",
      ],
      summary: "Bloom 已经把当前任务拆成更容易开始的三个动作, 建议从第一步直接启动.",
    };
  },

  parseRecord(input: { content: string }): ParsedRecordResult {
    const category = determineCategory(input.content);
    const emotion = determineEmotion(input.content);
    return {
      summary: "Bloom 已识别这条记录与 " + category + " 方向相关, 并会同步更新日程与成长数据.",
      category,
      emotion,
      suggestedScheduleTitles: ["补充行动: " + input.content.slice(0, 12) + (input.content.length > 12 ? "..." : "")],
    };
  },
};
