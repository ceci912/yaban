export type Grade = "一年级" | "二年级" | "三年级";
export type Gender = "男孩" | "女孩" | "不便说明";
export type FocusRange = "少于 15 分钟" | "15–25 分钟" | "25–40 分钟" | "40 分钟以上";
export type GrowthGoal = "专注力" | "阅读表达" | "学习习惯" | "数学思维" | "情绪与自信";
export type SupportMode = "工作日时间有限" | "每天可以陪伴" | "主要由孩子独立完成";
export type TaskFeedback = "pending" | "done" | "hard" | "dislike";
export type PainPoint =
  | "注意力容易分散"
  | "倾听指令困难"
  | "生活自理较弱"
  | "作业习惯未建立"
  | "坐姿或握笔需要调整"
  | "拖拉磨蹭"
  | "时间观念较弱"
  | "依赖家长"
  | "不爱阅读"
  | "阅读理解过渡困难"
  | "作文表达困难"
  | "英语拼写困难"
  | "亲子沟通冲突"
  | "学习信心下降";

export type ChildProfile = {
  name: string;
  gender: Gender;
  grade: Grade;
  focus: FocusRange;
  interest: string;
  concern: string;
  goal: GrowthGoal;
  dailyMinutes: number;
  supportMode: SupportMode;
  painPoints: PainPoint[];
  weekdayTime: string;
  weekendTime: string;
};

export type SavedChild = {
  id: string;
  profile: ChildProfile;
  cycle: number;
  calendarToken: string;
  updatedAt: number;
};

export type WeeklyCheckin = {
  feedback: Record<string, TaskFeedback>;
  weeklyNote: string;
  childMood: "轻松" | "一般" | "有点抗拒";
};

export type GrowthTask = {
  id: string;
  day: string;
  tag: string;
  title: string;
  detail: string;
  minutes: number;
  color: "mint" | "peach" | "yellow";
  why: string;
};

export type GrowthPlan = {
  strengths: string[];
  priority: string;
  strategy: string;
  parentScript: string;
  evidence: string[];
  tasks: GrowthTask[];
  assessment: {
    summary: string;
    possibleCause: string;
    observeNext: string[];
  };
  painPointGuidance: Array<{
    label: PainPoint;
    observe: string;
    action: string;
    parentLanguage: string;
  }>;
  companionPlan: {
    mode: string;
    description: string;
    avoid: string[];
    doInstead: string[];
  };
  subjects: Array<{
    name: "语文" | "数学" | "英语";
    stageGoal: string;
    weeklyAction: string;
    parentCheck: string;
  }>;
  psychology: {
    theme: string;
    familyActions: string[];
    parentLanguage: string;
    boundary: string;
  };
  books: Array<{
    title: string;
    author: string;
    reason: string;
    readTogether: string;
  }>;
  monthPlan: Array<{
    week: string;
    focus: string;
    outcome: string;
  }>;
};
