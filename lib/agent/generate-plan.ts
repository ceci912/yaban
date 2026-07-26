import type {
  ChildProfile,
  GrowthPlan,
  GrowthTask,
  TaskFeedback,
} from "./types";

const gradeCopy = {
  一年级: "先建立安全感与完成体验，不追求速度和数量",
  二年级: "在稳定习惯上增加表达与独立性",
  三年级: "帮助孩子学会拆解任务、复盘方法",
};

const goalLibrary: Record<ChildProfile["goal"], Omit<GrowthTask, "id" | "day" | "minutes" | "color">> = {
  专注力: {
    tag: "练专注",
    title: "一件事小挑战",
    detail: "开始前一起说出唯一目标，计时结束后由孩子自己检查并打勾。",
    why: "用清晰、短时、可完成的任务建立专注信心。",
  },
  阅读表达: {
    tag: "会表达",
    title: "三句话讲给家长听",
    detail: "读完后只讲清楚：谁、发生了什么、我最喜欢哪里。",
    why: "低压力复述比连续追问更容易形成表达习惯。",
  },
  学习习惯: {
    tag: "会准备",
    title: "两分钟学习启动仪式",
    detail: "孩子自己准备纸笔、关掉干扰，并说出今天先完成哪一件事。",
    why: "把提醒变成固定流程，逐步减少对家长催促的依赖。",
  },
  数学思维: {
    tag: "想一想",
    title: "生活里的数学侦探",
    detail: "从家里找一个数学问题，让孩子先说思路，再决定是否计算。",
    why: "把数学从答题转向观察、推理和解释。",
  },
  情绪与自信: {
    tag: "看见自己",
    title: "今天我做成的一小步",
    detail: "睡前由孩子说一件努力过的小事，家长只描述看到的过程。",
    why: "具体地看见努力，比笼统表扬更能积累自我效能感。",
  },
};

function baseMinutes(profile: ChildProfile) {
  const focusLimit =
    profile.focus === "少于 15 分钟" ? 10 :
    profile.focus === "15–25 分钟" ? 15 :
    profile.focus === "25–40 分钟" ? 25 : 30;
  return Math.max(8, Math.min(profile.dailyMinutes, focusLimit));
}

function adaptTask(task: GrowthTask, feedback: TaskFeedback | undefined, interest: string): GrowthTask {
  if (feedback === "hard") {
    return {
      ...task,
      title: `${task.title} · 轻量版`,
      detail: `先只做一半：${task.detail}`,
      minutes: Math.max(6, Math.round(task.minutes * 0.65)),
      why: "上次家长反馈偏难，本周先降低门槛，优先找回完成感。",
    };
  }
  if (feedback === "dislike") {
    return {
      ...task,
      title: `用“${interest || "孩子喜欢的事"}”换个玩法`,
      detail: `把本次目标融入${interest || "孩子熟悉的活动"}，让孩子自己选择画、说或动手完成。`,
      why: "上次孩子兴趣较低，本周改用兴趣驱动而不增加难度。",
    };
  }
  if (feedback === "done") {
    return {
      ...task,
      detail: `${task.detail} 完成后，请孩子说一句“我用了什么办法”。`,
      minutes: task.minutes + 2,
      why: "上次顺利完成，本周只增加一点点复盘，不突然加量。",
    };
  }
  return task;
}

export function generatePlan(
  profile: ChildProfile,
  feedback: Record<string, TaskFeedback> = {},
  cycle = 1,
): GrowthPlan {
  const minutes = baseMinutes(profile);
  const name = profile.name.trim() || "孩子";
  const core = goalLibrary[profile.goal];
  const concernText = profile.concern.trim() || `希望改善${profile.goal}`;

  const rawTasks: GrowthTask[] = [
    {
      id: "start",
      day: cycle === 1 ? "周一" : "下周一",
      tag: "轻启动",
      title: `${minutes}分钟可完成目标`,
      detail: `开始前让${name}自己选一个${minutes}分钟内能完成的小目标，家长不追加任务。`,
      minutes,
      color: "mint",
      why: `结合当前专注时长“${profile.focus}”，先保证任务可完成。`,
    },
    {
      id: "goal",
      day: cycle === 1 ? "周三" : "下周三",
      ...core,
      minutes: Math.min(profile.dailyMinutes, minutes + 5),
      color: "peach",
    },
    {
      id: "interest",
      day: cycle === 1 ? "周六" : "下周六",
      tag: "兴趣迁移",
      title: `把“${profile.interest || "喜欢的事"}”变成一次表达`,
      detail: `请${name}围绕${profile.interest || "最近喜欢的内容"}完成一张图、三个发现或一分钟讲解，形式由孩子选择。`,
      minutes: Math.min(profile.dailyMinutes + 5, 35),
      color: "yellow",
      why: "从已有兴趣出发，更容易让孩子主动开始并坚持完成。",
    },
  ];

  return {
    strengths: [
      `对“${profile.interest || "身边事物"}”有天然兴趣`,
      profile.focus === "少于 15 分钟" ? "适合短任务、即时反馈" : "已经具备一段稳定投入时间",
    ],
    priority: `${profile.goal}：${concernText}`,
    strategy: `${gradeCopy[profile.grade]}。家庭陪伴方式按“${profile.supportMode}”设计，每次控制在约 ${profile.dailyMinutes} 分钟。`,
    parentScript: `可以说：“我看到你刚才用了自己的办法。你想保持这样，还是下次换一种？”`,
    evidence: [profile.grade, profile.focus, `每天约${profile.dailyMinutes}分钟`, profile.supportMode],
    tasks: rawTasks.map((task) => adaptTask(task, feedback[task.id], profile.interest)),
  };
}

