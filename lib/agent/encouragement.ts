import type { ChildProfile, GrowthTask, TaskFeedback } from "./types";

export type EncouragementTone = "warm" | "brief" | "challenge";

type EncouragementInput = {
  profile: ChildProfile;
  task: GrowthTask;
  feedback: TaskFeedback;
  tone?: EncouragementTone;
};

export type Encouragement = {
  script: string;
  reason: string;
  avoid: string;
};

const abilityByGoal: Record<ChildProfile["goal"], string> = {
  专注力: "把注意力放回眼前这件事",
  阅读表达: "整理并表达自己的想法",
  学习习惯: "安排和完成自己的事情",
  数学思维: "观察、推理和寻找办法",
  情绪与自信: "看见自己的努力并继续尝试",
};

function doneScript(name: string, task: GrowthTask, ability: string, tone: EncouragementTone) {
  if (tone === "brief") {
    return `${name}，我看到你完成了“${task.title}”。你刚才用的办法很有效。`;
  }
  if (tone === "challenge") {
    return `${name}，我看到你完成了“${task.title}”，也在练习${ability}。你愿意说说哪一步最有用吗？`;
  }
  return `${name}，我看到你刚才认真完成了“${task.title}”。这说明你正在学会${ability}，我很欣赏你投入的过程。`;
}

function hardScript(name: string, task: GrowthTask, tone: EncouragementTone) {
  if (tone === "brief") {
    return `${name}，这里确实有点难，但你已经开始尝试了。我们先做一小步。`;
  }
  if (tone === "challenge") {
    return `${name}，我看到“${task.title}”有点难，但你没有马上放下。你想自己再试一小步，还是让我陪你一起？`;
  }
  return `${name}，刚才有些地方不容易，我也看到你已经在想办法了。今天不用一下子做好，我们先完成你觉得可以的一小步。`;
}

function dislikeScript(name: string, profile: ChildProfile, tone: EncouragementTone) {
  const interest = profile.interest.trim() || "你喜欢的方式";
  if (tone === "brief") {
    return `${name}，谢谢你告诉我不喜欢。目标不变，方法可以换。`;
  }
  if (tone === "challenge") {
    return `${name}，这种做法你不喜欢，我们换条路。要不要试试把“${interest}”放进来，由你选怎么完成？`;
  }
  return `${name}，我发现这种方式你好像不太喜欢，谢谢你让我知道真实感受。我们可以换成和“${interest}”有关的玩法，你来选一种。`;
}

export function createEncouragement({
  profile,
  task,
  feedback,
  tone = "warm",
}: EncouragementInput): Encouragement | null {
  if (feedback === "pending") return null;

  const name = profile.name.trim() || "孩子";
  const ability = abilityByGoal[profile.goal];

  if (feedback === "done") {
    return {
      script: doneScript(name, task, ability, tone),
      reason: `先描述完成“${task.title}”的事实，再指出孩子正在形成的能力，不把肯定停留在“真棒”。`,
      avoid: "不要马上追加任务，也不要用“你本来就很聪明”代替对过程的肯定。",
    };
  }

  if (feedback === "hard") {
    return {
      script: hardScript(name, task, tone),
      reason: "孩子觉得困难时，先接住感受并缩小下一步，比催促坚持更容易保住行动意愿。",
      avoid: "不要说“这很简单”“再认真一点就会了”，也不要直接替孩子完成。",
    };
  }

  return {
    script: dislikeScript(name, profile, tone),
    reason: `尊重“不喜欢”，同时保留成长目标，并借助孩子对“${profile.interest || "熟悉事物"}”的兴趣更换路径。`,
    avoid: "不要把不喜欢解释成懒惰，也不要用比较或奖励强迫孩子继续。",
  };
}
