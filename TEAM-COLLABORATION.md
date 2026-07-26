# 芽伴 Demo 团队协作说明

## 推荐分工（7人）

| 编号 | 代码负责人 | 负责模块 | 建议文件/目录 | 验收结果 |
|---|---|---|---|---|
| 1 | 技术负责人 | 项目结构、合并代码、发布、处理冲突 | `app/page.tsx`、`app/layout.tsx` | 主流程可运行、每晚产生稳定版本 |
| 2 | 首页负责人 | 品牌首页、产品介绍、开始体验入口 | `components/home/` | 手机和电脑端首页完整 |
| 3 | 测评负责人 | 孩子信息表单、题目、校验和进度 | `components/assessment/` | 表单可以填写并提交 |
| 4 | 报告负责人 | 成长画像、优势、待提升项 | `components/report/` | 能根据输入展示个性化画像 |
| 5 | 计划负责人 | 周计划、任务卡、完成状态和调整 | `components/plan/` | 能生成并展示一周行动 |
| 6 | AI与规则负责人 | 提示词、规则、示例数据、输出结构 | `lib/agent/`、`data/` | 相同输入能稳定输出结构化结果 |
| 7 | 测试与视觉负责人 | 样式规范、响应式、测试用例、Bug验收 | `app/globals.css`、`tests/` | 关键流程无阻塞、视觉统一 |

如果只有6人，由技术负责人兼任首页，其他分工不变。

## Git协作规则

1. `main` 只放能正常演示的版本，任何人不要直接修改。
2. 每个人从最新 `main` 建自己的分支：
   - `feat/home`
   - `feat/assessment`
   - `feat/report`
   - `feat/weekly-plan`
   - `feat/ai-rules`
   - `test/visual-qa`
3. 一项功能一个合并请求，不把无关修改混在一起。
4. 每天开始工作前同步一次 `main`，下班前提交可查看的版本。
5. 只有技术负责人合并代码；合并前至少由另一人试用一次。
6. 公共文件 `app/page.tsx` 和 `app/globals.css` 默认只有技术负责人修改；其他人新增自己的组件文件。

## 组件之间的数据约定

所有人先共同确定一份输入输出格式，再并行编码：

```ts
type ChildProfile = {
  name: string;
  grade: "一年级" | "二年级" | "三年级";
  focusMinutes: number;
  interests: string[];
  parentConcern: string;
};

type GrowthPlan = {
  strengths: string[];
  priority: string;
  parentStrategy: string;
  weeklyTasks: Array<{
    day: string;
    title: string;
    detail: string;
    minutes: number;
  }>;
};
```

前端表单只负责产出 `ChildProfile`；AI模块只负责把它转成 `GrowthPlan`；报告与周计划模块只负责展示 `GrowthPlan`。

## 每日协作节奏

- 上午10分钟：每人说清楚“今天交付什么、需要谁配合”。
- 下午固定时间：技术负责人合并已经验收的代码。
- 晚上15分钟：全员只走一遍核心流程，集中记录Bug，不在群里零散提需求。
- 需求和Bug统一写在任务表中，至少包含负责人、截止时间、验收标准和当前状态。

## 第一轮需要成员提交的内容

- 教育内容：1–3年级各3个典型问题、对应建议和不能说的话。
- 用户案例：至少5组匿名家庭案例，包含孩子情况、家长困扰和期望结果。
- AI规则：规划生成提示词、JSON输出格式、安全边界和兜底回答。
- 视觉素材：品牌色、字体建议、封面文案和2–3个参考产品。
- 测试用例：正常、信息缺失、家长期望过高、疑似需要专业帮助四类场景。
