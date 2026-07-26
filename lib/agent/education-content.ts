import type { ChildProfile, GrowthPlan } from "./types";

const subjectPlans: Record<ChildProfile["grade"], GrowthPlan["subjects"]> = {
  一年级: [
    { name: "语文", stageGoal: "愿意开口读、听懂并说清一件小事", weeklyAction: "每天亲子朗读10分钟，选一句喜欢的话再说一遍", parentCheck: "不考字词数量，只看是否愿意读、愿意说" },
    { name: "数学", stageGoal: "建立数感，能用自己的话解释简单问题", weeklyAction: "用餐具、台阶或零花钱完成一次生活数学游戏", parentCheck: "先问“你怎么想”，再看答案" },
    { name: "英语", stageGoal: "保持听说兴趣，积累熟悉的声音和表达", weeklyAction: "每周3次、每次8分钟听唱或看图说词", parentCheck: "不要求默写，以敢听、敢模仿为主" },
  ],
  二年级: [
    { name: "语文", stageGoal: "提升流畅阅读与三句话复述能力", weeklyAction: "每天阅读15分钟，每周选一次讲清人物、事件和感受", parentCheck: "关注表达是否更完整，不逐句纠错" },
    { name: "数学", stageGoal: "理解运算意义，形成检查与表达思路的习惯", weeklyAction: "每周做2次生活应用题，并让孩子口头解释一种解法", parentCheck: "错题先找思路断点，不立刻告诉答案" },
    { name: "英语", stageGoal: "积累常用语块，建立稳定听说输入", weeklyAction: "每周3次听读，选5个常用表达放进生活对话", parentCheck: "先听懂和敢说，再逐步关注准确度" },
  ],
  三年级: [
    { name: "语文", stageGoal: "读懂段落重点，形成简单阅读笔记", weeklyAction: "每周完成2次阅读卡：一句概要、一个问题、一点感受", parentCheck: "检查是否抓住重点，不追求篇幅" },
    { name: "数学", stageGoal: "能拆解两步问题，并检查计算与条件", weeklyAction: "每周选2题画图或列步骤，再用一句话解释为什么", parentCheck: "重点看步骤与检查方法，不只看正确率" },
    { name: "英语", stageGoal: "从词句积累过渡到短句表达", weeklyAction: "每周围绕一个生活主题听读，并完成30秒口头表达", parentCheck: "允许停顿和看提示，逐渐减少依赖" },
  ],
};

const bookPlans: Record<ChildProfile["grade"], GrowthPlan["books"]> = {
  一年级: [
    { title: "《小巴掌童话》", author: "张秋生", reason: "篇幅短、想象丰富，适合建立自主阅读信心", readTogether: "每次一篇，选一个最喜欢的画面说给家长听" },
    { title: "《没头脑和不高兴》", author: "任溶溶", reason: "幽默故事帮助孩子理解习惯与合作", readTogether: "读后聊“如果是我，我会怎么做”" },
    { title: "《小彗星旅行记》", author: "徐刚", reason: "用故事带动自然科学兴趣", readTogether: "边读边画一条小彗星旅行路线" },
  ],
  二年级: [
    { title: "《小马过河》", author: "彭文席", reason: "帮助孩子理解独立判断与尝试", readTogether: "让孩子说出不同角色为什么给出不同答案" },
    { title: "《大头儿子和小头爸爸》", author: "郑春华", reason: "贴近家庭生活，适合练习人物与事件复述", readTogether: "每章用三句话讲给家人听" },
    { title: "《趣味数学百科图典》", author: "田翔仁", reason: "把数学概念放进图像和生活场景", readTogether: "每周挑一个问题，在家里找对应例子" },
  ],
  三年级: [
    { title: "《格林童话》", author: "格林兄弟", reason: "故事结构清楚，适合比较人物选择与结果", readTogether: "每篇找出一次关键选择，并说说如果改变会怎样" },
    { title: "《安徒生童话》", author: "安徒生", reason: "情感层次丰富，适合培养共情与文本感受", readTogether: "摘一句有感受的话，说明为什么" },
    { title: "《稻草人》", author: "叶圣陶", reason: "语言优美，帮助孩子从情节阅读走向情感理解", readTogether: "完成一句概要和一个想问的问题" },
  ],
};

export function createEducationModules(profile: ChildProfile) {
  const name = profile.name.trim() || "孩子";
  const concern = profile.concern.trim() || `希望提升${profile.goal}`;
  const emotionalConcern = /情绪|哭|怕|焦虑|生气|自信|同学|抗拒/.test(concern);

  return {
    assessment: {
      summary: `${name}当前最适合从“优势兴趣 + 小步完成”进入成长计划。家长描述的主要场景是：${concern}。`,
      possibleCause: `这不是医学诊断。根据“${profile.focus}”的投入时长和“${profile.supportMode}”的家庭条件，当前表现可能同时受到任务难度、启动方式、兴趣连接和亲子互动影响。`,
      observeNext: [
        "同一行为在作业、阅读和兴趣活动中是否一致",
        "任务开始前、进行中、结束后分别发生了什么",
        "调整时长或表达方式后，孩子是否更容易完成",
      ],
    },
    subjects: subjectPlans[profile.grade].map((item) =>
      item.name === "语文" && profile.goal === "阅读表达"
        ? { ...item, stageGoal: `${item.stageGoal}（本月优先目标）` }
        : item,
    ),
    psychology: {
      theme: emotionalConcern ? "情绪识别、表达与安全感" : "成长型思维与完成信心",
      familyActions: emotionalConcern
        ? ["先帮孩子说出情绪，不急着讲道理", "把问题缩小到当下能做的一步", "情绪平稳后再一起复盘"]
        : ["每天描述一次孩子真实的努力过程", "允许孩子选择任务顺序或完成形式", "把错误说成一次信息，而不是能力评价"],
      parentLanguage: emotionalConcern
        ? "“我看到这件事让你很难受。我们先缓一缓，你希望我陪着，还是给你一点空间？”"
        : "“这次还没完成，但你已经找到了一种不合适的方法。我们换一个小一点的办法试试。”",
      boundary: "本模块仅用于家庭教育支持，不进行心理疾病诊断；若孩子的痛苦持续影响日常生活、学习或安全，请及时联系学校及具备资质的专业人员。",
    },
    books: bookPlans[profile.grade],
    monthPlan: [
      { week: "第1周", focus: "看见真实行为", outcome: "完成3次轻任务并记录孩子反应" },
      { week: "第2周", focus: `聚焦${profile.goal}`, outcome: "找到一种孩子愿意重复的方法" },
      { week: "第3周", focus: "从兴趣迁移能力", outcome: `用“${profile.interest || "孩子的兴趣"}”带动一次学习表达` },
      { week: "第4周", focus: "家庭复盘与调整", outcome: "保留有效动作，删除无效或压力过大的任务" },
    ],
  };
}

