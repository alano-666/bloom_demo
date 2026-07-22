import type { ChatReplyResult, CoreTaskResult, ParsedRecordResult, TaskDecompositionResult } from "./types.js";

function determineCategory(content: string): string {
  if (/运动|睡眠|跑步|饮食|身体|健康|锻炼|健身/.test(content)) return "健康";
  if (/学习|课程|读书|笔记|方法|教程|看书|视频|资料|文档/.test(content)) return "学习";
  if (/生活|习惯|日常|计划|复盘|整理/.test(content)) return "生活";
  if (/焦虑|压力|紧张|迷茫|情绪|没动力|难过|累|烦/.test(content)) return "情绪";
  return "职业";
}

function determineEmotion(content: string): string {
  if (/焦虑|压力|紧张|急|慌|崩/.test(content)) return "anxious";
  if (/累|困|没动力|疲惫|乏|拖延|不想/.test(content)) return "tired";
  if (/完成|进展|顺利|不错|搞定|好了|学会|开心/.test(content)) return "positive";
  return "steady";
}

export const fallbackAi = {
  chatReply(input: {
    latestMessage: string;
    user: { mainGoal: string; mainProblem: string; replyStyle: string };
  }): ChatReplyResult {
    const msg = input.latestMessage;
    const domain = determineCategory(msg);

    if (/代码|报错|bug|error|exception|null|编译|运行|语法/.test(msg)) {
      return {
        reply: "这是 NullPointerException 空指针异常, Java 最高频的报错之一.\n\n根因: Java 的 String / 对象是引用类型, 当变量为 null 时调用方法就会触发空指针. 这和 Python 里 None 拼接字符串直接转字符串的逻辑完全不同, 是从 Python / C++ 转到 Java 很容易踩的坑.\n\n修正:\n1. 先做非空判断 -- if (obj != null) 是最直接的防护\n2. 也可以用 Objects.toString(obj) 兜底\n3. 写后端代码时, 包装类, 集合调用方法前都要判空 -- 空指针是后端 Top1 异常\n\n排查口诀: 看到 NullPointer, 先找报错行里所有点操作的对象, 哪个是 null 就修哪个.",
        emotion: "报错不是坏事, 每次 Debug 都是加深理解的机会.",
        progress: "排查这类报错本身就是后端开发的必经之路, 解决一次以后就能秒定位.",
        nextStep: "按上面的思路修改代码后重新运行, 看是否还有同类报错.",
        taskSuggestion: "把修正后的代码写好, 跑通后记下这次错误类型和排查思路.",
        scheduleSuggestion: "建议今晚预留 30 分钟低打扰时间来推进这件事",
        category: "学习",
        suggestedMetric: "中",
      };
    }

    if (/学不动|学不进去|难|慢|好累|坚持|不行了|焦虑|压力大|崩溃/.test(msg)) {
      return {
        reply: "太正常了, 高强度技术学习和反复调试本身就极耗心力, 脑子过载完全是生理反应, 不是你学不会.\n\n不用硬撑, 给你两个方向选一个: 要么现在停 20 分钟站起来走两步, 喝水听点轻松的; 要么换一个比当前任务轻很多的小动作 -- 比如写几行简单的 Demo, 用代码手感把状态拉回来.\n\n进度快慢完全没关系, 我们是长期补栈, 不是冲刺. 我全程在, 任何时候你想继续了, 随时丢问题过来.",
        emotion: "你现在的焦虑其实恰好说明你在乎这件事, 不是你能力不够.",
        progress: "虽然状态波动, 但你的日志里仍保留了学习的连续性, 说明节奏本身是稳的.",
        nextStep: "先歇一会儿, 然后挑一个最小的动作重启 -- 哪怕只是打开 IDE 写一句 Hello.",
        taskSuggestion: "放一个极低门槛动作: 只写 5 行 Demo 找找手感.",
        scheduleSuggestion: "暂停今晚的硬性学习安排, 改做 15 分钟轻量回顾即可",
        category: "情绪",
        suggestedMetric: "低",
      };
    }

    if (/计划|安排|节奏|进度|学什么|怎么学|接下来|路线/.test(msg)) {
      const isBackend = /后端|Java|开发|编程|Spring|数据库/.test(input.user.mainGoal);
      return {
        reply: isBackend
          ? "能集中精力把学习规划这件事拆明白, 这个方向本身就跑对了.\n\n拆轻重:\n- 已有编程基础的部分(变量/循环/分支/基本 OOP)可以倍速过, 重点是和你熟悉语言的差异点\n- 核心模块(框架机制/底层原理/设计模式)需要慢下来每学一个写一段 Demo\n- 容易混淆的是跨语言差异 -- 比如值传递和引用的区别, 容器底层实现的区别\n\n三条执行规则:\n1. 每个核心知识点写 10 行以内 Demo 验证理解\n2. 暂时听不懂的底层原理先截图, 学到后面往回看自然懂\n3. 晚上留 30 分钟手绘一张架构图复盘\n\n今天全程跟着你的节奏, 卡壳了随时说."
          : "先把目标拆成轻重缓急是最高效的开始.\n\n拆轻重:\n- 通用基础部分可以快进\n- 核心方法论部分慢下节奏每步复盘\n- 容易混淆的概念单独对比\n\n三条执行规则:\n1. 每学完一个模块用一句话总结核心\n2. 不理解的地方先标记, 不打断整体节奏\n3. 晚上留 30 分钟快速复盘\n\n我全程跟你的节奏, 卡壳了随时说.",
        emotion: "你的规划状态总体平稳, 目标明确.",
        progress: "能主动拆规划本身就是最高效的学习行为, 说明方法感在形成.",
        nextStep: "挑今天计划里最核心的一个知识点, 先动手写几行 Demo.",
        taskSuggestion: isBackend ? "把今天核心知识点的 Demo 代码写好并跑通." : "把今天计划里最重要的一个模块先学完并做笔记.",
        scheduleSuggestion: "早上高专注时段优先学核心内容, 下午做辅助练习",
        category: "学习",
        suggestedMetric: "中",
      };
    }

    if (/复盘|总结|搞完|做完了|学完了|完成了/.test(msg)) {
      return {
        reply: "恭喜啃完这个模块! " + input.user.mainGoal.slice(0, 20) + " 的路径上又往前迈了一步, 进度非常稳.\n\n核心梳理:\n- 体系架构: 这个阶段学到的核心概念是什么 -- 先理清主干\n- 高频实操点: 哪些地方是后端开发里真的每天在用的 -- 这些优先打牢\n- 容易掌握不牢的薄弱点: 面试和实际开发里容易被问住的环节 -- 标记出来后续二刷\n\n巩固小任务: 围绕这个模块写一个微型 Demo, 把常用 API 都用一遍就彻底熟了.\n\n接下来可以衔接下一个模块, 继续按这个节奏走就行.",
        emotion: "稳步推进的状态很好, 保持节奏.",
        progress: "完成一个模块的复盘本身就是在把方法沉淀为体系.",
        nextStep: "围绕刚完成的模块写一个微型 Demo, 把核心 API 都用一遍.",
        taskSuggestion: "写一个涵盖本模块核心知识点的微型 Demo.",
        scheduleSuggestion: "今晚留 30 分钟低打扰时间做复盘总结",
        category: "学习",
        suggestedMetric: "中",
      };
    }

    if (/是什么|区别|怎么|为什么|底层|原理|概念|面试/.test(msg)) {
      return {
        reply: "这个问题问得好, 我先给最核心的答案, 再分层讲清楚.\n\n核心结论: 这个知识点的本质是理解它在整个技术体系里起什么作用.\n\n分层拆解:\n1. 定义层面 -- 先理解它是什么和为什么需要它\n2. 特性层面 -- 关键规则和边界条件\n3. 对比层面 -- 跟你已经会的东西有什么区别, 减少记忆成本\n4. 场景层面 -- 这个知识点在实际开发中怎么用\n\n面试高频考点, 建议理解后能用代码讲出来.",
        emotion: "你的状态总体平稳, 适合继续推进.",
        progress: "主动追问概念和原理, 说明在往深层理解走, 这是从会用走向懂的标志.",
        nextStep: "把刚才的核心结论用自己的话写下来, 最好配一行代码示例.",
        taskSuggestion: "写一个包含这个知识点的微型 Demo, 验证理解.",
        scheduleSuggestion: "今晚预留 30 分钟低打扰时间来推进这件事",
        category: "学习",
        suggestedMetric: "中",
      };
    }

    return {
      reply: (input.user.replyStyle === "结构清晰" ? "我帮你先把这个拆开来看." : "我在, 我们可以从容地把这件事理清楚.") + "\n\n你之前提到的长期目标是 " + input.user.mainGoal.slice(0, 24) + ", 当前输入是 " + msg.slice(0, 24) + ". 这说明你在围绕真正重要的事情行动.\n\n建议从这个角度切入: 先把核心问题定义清楚, 再拆成可操作的小步骤. 每一步不用大, 但每一步都要有明确的产出.\n\n我全程在, 任何时候需要更深地拆解某个点, 直接把问题丢过来.",
      emotion: "你的状态总体平稳, 适合继续推进.",
      progress: "这条输入与目标 " + input.user.mainGoal.slice(0, 16) + " 直接相关.",
      nextStep: "把这个问题拆成一个今天能完成的小动作.",
      taskSuggestion: "把当前话题的核心动作完成并做简要记录.",
      scheduleSuggestion: "今晚预留 30 分钟低打扰时间来推进这件事",
      category: domain as any,
      suggestedMetric: "中",
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
