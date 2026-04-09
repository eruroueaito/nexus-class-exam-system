# Online Exam System Development Plan

> **For agentic workers:** REQUIRED: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个基于 GitHub Pages + Supabase 的在线考试/作业系统，保证题目、答案、权限与成绩分析解耦，支持学生答题与管理员维护题库。

**Architecture:** 前端为静态 React 应用，部署到 GitHub Pages；学生侧所有敏感读取与批改动作统一经过 Supabase Edge Functions；管理员侧通过 Supabase Auth + RLS + 受限 RPC/表操作维护题库与查看分析。

**Tech Stack:** Vite, React, TypeScript, Tailwind CSS, React Router, TanStack Query, Supabase Auth, Supabase Postgres, Supabase Edge Functions, Recharts, Vitest, Testing Library, Playwright

---

## 1. 文档定位

本文档既是架构说明，也是本地开发计划。目标不是只给出概念图，而是让后续实现者可以按阶段逐步落地，不需要额外再补“这一步应该做什么”。

本文档默认以下前提成立：
- 项目使用 GitHub Pages 托管静态前端。
- Supabase 已可用，且当前 Codex 环境已完成 Supabase MCP 登录。
- 第一阶段接受“先完成核心考试流，再做数据分析增强与导出体验优化”的迭代策略。

## 1.1 当前前端视觉基准

用户已经提供一份苹果风格的前端原型，后续前端开发必须以它为直接参考基线，而不是重新自由发挥。

原型文件：
- `docs/reference/nexus-class-prototype.html`

实现约束：
- 保留低饱和浅色背景、液态玻璃面板、蓝色强调色和柔和模糊背景团块。
- 保留登录、试卷列表、答题页、管理员后台四个核心视图的整体氛围与层级关系。
- 允许为真实业务接线做结构性调整，但不要偏离这份原型的视觉语言。
- 在 React 实现里要把内联样式抽为可维护的组件样式和设计 token。

## 2. 原始需求中的必须修正项

以下 4 点不是可选优化，而是要先修正，否则后续实现必然返工。

### 2.1 `questions` 表不能对学生直接开放 `SELECT`

原需求写了“`questions` 表所有人可 `SELECT`”。这会直接破坏访问码机制，因为任何人都能绕过弹窗，直接从浏览器请求全部题目。

结论：
- 学生端不能直接查 `questions` 表。
- 学生进入考试时必须调用后端受控接口，由后端验证访问码后再返回题目。

### 2.2 `exams.access_password` 不能跟试卷列表放在同一张公开表里

首页需要展示试卷列表。如果匿名用户可以直接从 `exams` 表读取，而访问码也存在同一行，浏览器就可以顺手把访问码读出来。

结论：
- 试卷基本信息与访问码信息必须拆分。
- 推荐新增私有表 `app_private.exam_access` 保存密码 hash。

### 2.3 仅有 `submissions` 不足以支撑“各题错误率”分析

`submissions` 只有总分和时长，只能看一次提交的总体成绩，无法回答：
- 哪道题最常错？
- 学生在哪些题上选择了什么答案？
- 某次结果页重新打开时如何展示逐题解析快照？

结论：
- 必须增加 `submission_items` 表保存逐题作答结果与解析快照。

### 2.4 题目随机化不要使用 `array.sort(() => Math.random() - 0.5)`

这个写法简单，但分布有偏，而且结果不稳定。

结论：
- 实现时应使用 Fisher-Yates 洗牌算法。
- 若后续需要“同一学生在一次考试内稳定顺序”，可把随机种子扩展到提交会话层。

## 3. 技术栈评估

### 方案 A：Vite + React + TypeScript + Tailwind + Supabase

优点：
- 与你的要求完全一致。
- React 生态对表单、图表、后台管理、状态管理最成熟。
- GitHub Pages 部署成本最低。
- 后续接入 AI 导题、图表分析和复杂交互更顺手。

缺点：
- 需要自己处理 GitHub Pages 的路由兼容、环境变量和静态资源基路径。
- 学生敏感流程必须通过 Edge Functions，不能偷懒走前端直连查库。

### 方案 B：Next.js + Supabase + Vercel

优点：
- 服务端路由、鉴权和 API 聚合更自然。
- 题目读取和批改更容易通过 server route 实现。

缺点：
- 不符合“前端放 GitHub Pages”的部署前提。
- 引入 SSR/ISR 后，系统复杂度、部署绑定度和维护成本明显上升。

### 方案 C：Astro + React Islands + Supabase

优点：
- 首页展示与静态内容性能好。
- 如果系统更偏内容站点而不是交互系统，会比较轻。

缺点：
- 本项目有较重的考试交互、后台管理、图表和状态同步，最终仍会落回 React islands。
- 心智成本比直接 React 更高，不够“最简单够用”。

### 推荐结论

推荐采用 **方案 A：Vite + React + TypeScript + Tailwind + Supabase**。

理由：
- 成熟度高。
- 社区支持强。
- 与项目复杂度匹配。
- 部署简单。
- 对后续 AI 管理入口、图表、管理员后台和 GitHub Pages 兼容性最好。

## 4. 推荐架构

### 4.1 逻辑分层

1. 前端静态层：
   - GitHub Pages 托管。
   - 负责 UI、路由、状态管理、调用 Supabase Auth 和 Edge Functions。

2. 受控应用服务层：
   - 使用 Supabase Edge Functions。
   - 负责学生进入考试、拉取题目、提交批改、写入成绩。
   - 使用 service role 读取私有答案和访问码 hash。

3. 数据层：
   - Supabase Postgres 保存试卷、题目、答案、提交记录、逐题记录。
   - RLS 保护管理员操作与分析数据。

4. 管理接口层：
   - 管理员登录后，直接通过 Supabase JS 读写可控表。
   - 批量 AI 同步通过受限 RPC `upsert_exam_data` 处理。

### 4.2 学生流与管理员流分离

学生流：
- 只看试卷列表。
- 输入姓名与访问码。
- 通过 `start_exam` Edge Function 获取题目。
- 通过 `submit_exam` Edge Function提交答案并获取批改结果。

管理员流：
- 通过 Supabase Auth 登录。
- 直接管理试卷、题目、答案、成绩统计。
- 调用 `upsert_exam_data` 批量同步题库。

这个分层可以避免一个常见错误：为了图省事，把学生和管理员都放到同一套前端直连数据库权限模型里，最后导致题目或答案暴露。

## 5. 数据模型

## 5.1 核心表与支持表

### `public.exams`
用途：试卷元信息。

字段：
- `id UUID PRIMARY KEY`
- `title TEXT NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `is_active BOOLEAN NOT NULL DEFAULT true`

说明：
- 不在这张表保存访问码明文。
- 首页可以公开展示这张表的非敏感字段。

### `app_private.exam_access`
用途：试卷访问控制。

字段：
- `exam_id UUID PRIMARY KEY REFERENCES public.exams(id) ON DELETE CASCADE`
- `password_hash TEXT NOT NULL`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

说明：
- 存访问码 hash，而不是明文。
- 只允许 Edge Functions 或管理员读取。

### `public.questions`
用途：题干与展示信息。

字段：
- `id UUID PRIMARY KEY`
- `exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE`
- `content JSONB NOT NULL`
- `type TEXT NOT NULL CHECK (type IN ('radio', 'checkbox', 'text'))`
- `order_index INTEGER NOT NULL DEFAULT 0`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

说明：
- `ON DELETE CASCADE` 满足删除试卷同步删除题目。
- `content` 不存正确答案。

推荐 `content` 结构：

```json
{
  "stem": "What is 2 + 2?",
  "options": [
    { "id": "A", "text": "3" },
    { "id": "B", "text": "4" },
    { "id": "C", "text": "5" }
  ],
  "media": [],
  "hint": null,
  "points": 1
}
```

### `app_private.answers_library`
用途：答案库与解析。

字段：
- `id UUID PRIMARY KEY`
- `question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE`
- `correct_answer JSONB NOT NULL`
- `explanation TEXT NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

说明：
- 这张表应放在私有 schema。
- 删除题目后自动级联删除答案。

### `public.submissions`
用途：一次考试提交的总记录。

字段：
- `id UUID PRIMARY KEY`
- `exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE`
- `user_name TEXT NOT NULL`
- `score DOUBLE PRECISION NOT NULL`
- `duration INTEGER NOT NULL`
- `submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()`

### `public.submission_items`
用途：逐题作答快照与统计基础。

字段：
- `id UUID PRIMARY KEY`
- `submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE`
- `question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE`
- `user_answer JSONB NOT NULL`
- `is_correct BOOLEAN NOT NULL`
- `correct_answer_snapshot JSONB NOT NULL`
- `explanation_snapshot TEXT NOT NULL`
- `answered_at TIMESTAMPTZ NOT NULL DEFAULT now()`

说明：
- 这张表是后台做错题率分析的关键。
- 即便题库以后被修改，历史提交也能保留当时的正确答案与解析快照。

## 5.2 必要索引

- `questions(exam_id, order_index)`
- `answers_library(question_id)`
- `submissions(exam_id, submitted_at desc)`
- `submission_items(question_id, is_correct)`
- `submission_items(submission_id)`

## 5.3 可选视图

### `public.exam_catalog`
用途：首页公开试卷列表。

字段：
- `id`
- `title`
- `created_at`
- `is_active`

说明：
- 前端首页只读这类安全字段。
- 不直接暴露 `exam_access` 或其他私有信息。

## 6. 权限控制与安全设计

## 6.1 管理员身份

管理员通过 Supabase Auth 登录。

角色来源：
- 使用 `app_metadata.role = 'admin'`
- 禁止把权限判断建立在 `user_metadata` 上

推荐辅助函数：
- `app.is_admin()` 返回当前 JWT 是否为管理员

## 6.2 RLS 原则

### `public.exams`
- 匿名/普通用户：可读取公开字段对应的视图，不直接读表
- 管理员：可 `SELECT/INSERT/UPDATE/DELETE`

### `public.questions`
- 学生：禁止直接 `SELECT`
- 管理员：可 `SELECT/INSERT/UPDATE/DELETE`

### `app_private.answers_library`
- 学生：全部禁止
- 管理员：可读写
- Edge Functions：通过 service role 访问

### `public.submissions`
- 学生匿名：默认不开放历史查询
- 管理员：可读
- `submit_exam` Edge Function：可插入

### `public.submission_items`
- 学生匿名：默认不开放历史查询
- 管理员：可读
- `submit_exam` Edge Function：可插入

## 6.3 必须遵守的安全规则

- 前端永远不持有 `service_role`。
- `answers_library` 不放在浏览器可直接查询的公开路径里。
- 访问码只存 hash。
- Edge Function 中记录评分时，必须以数据库真实答案为准，不相信前端传来的题型、分值或正确答案。
- 若后续新增视图，注意 Postgres 视图默认可能绕过 RLS；需要显式按 Supabase/Postgres 版本处理权限。

## 7. 后端接口设计

## 7.1 学生接口一：`start_exam`

类型：Supabase Edge Function

职责：
- 接收 `exam_id`、`user_name`、`access_password`
- 验证试卷是否开放
- 校验访问码 hash
- 读取该试卷题目
- 返回打乱前或原始题目数组，由前端再做 Fisher-Yates 洗牌

请求示例：

```json
{
  "exam_id": "uuid",
  "user_name": "Alice",
  "access_password": "123456"
}
```

响应示例：

```json
{
  "exam": {
    "id": "uuid",
    "title": "Math Quiz"
  },
  "questions": [
    {
      "id": "uuid-q1",
      "type": "radio",
      "content": {
        "stem": "What is 2 + 2?",
        "options": [
          { "id": "A", "text": "3" },
          { "id": "B", "text": "4" }
        ]
      }
    }
  ]
}
```

失败条件：
- 试卷不存在
- 试卷未开放
- 访问码错误
- 用户名为空

## 7.2 学生接口二：`submit_exam`

类型：Supabase Edge Function

职责：
- 接收答题结果
- 读取私有答案库
- 计算正确率
- 写入 `submissions`
- 写入 `submission_items`
- 返回结果页所需数据

请求示例：

```json
{
  "exam_id": "uuid",
  "user_name": "Alice",
  "duration": 412,
  "answers": {
    "question_uuid_1": ["B"],
    "question_uuid_2": ["A", "C"],
    "question_uuid_3": "free text answer"
  }
}
```

响应示例：

```json
{
  "submission_id": "uuid-submission",
  "score": 0.83,
  "correct_count": 5,
  "total_count": 6,
  "items": [
    {
      "question_id": "uuid-q1",
      "user_answer": ["B"],
      "correct_answer": ["B"],
      "is_correct": true,
      "explanation": "Because 2 + 2 = 4."
    }
  ]
}
```

## 7.3 管理员接口：`upsert_exam_data`

类型：Supabase RPC

职责：
- 管理员批量创建/更新试卷、题目、答案解析
- 当 `question.id` 已存在时更新
- 当不存在时插入
- 永远不允许把正确答案写入 `questions.content`

调用方：
- 仅管理员后台可调用
- 调用前先做 JSON Schema 校验

推荐输入结构：

```json
{
  "exam": {
    "id": "optional-uuid",
    "title": "Biology Quiz",
    "is_active": true,
    "access_password": "optional plain password for rotation"
  },
  "questions": [
    {
      "id": "optional-uuid",
      "type": "radio",
      "order_index": 1,
      "content": {
        "stem": "Question text",
        "options": [
          { "id": "A", "text": "Option A" }
        ]
      },
      "answer": {
        "correct_answer": ["A"],
        "explanation": "Simple explanation for international students."
      }
    }
  ]
}
```

## 8. 前端模块设计

## 8.1 路由

- `/#/`：试卷列表页
- `/#/exam/:examId`：答题页
- `/#/result/:submissionId`：结果页
- `/#/admin/login`：管理员登录入口
- `/#/admin`：管理员首页
- `/#/admin/exams/:examId`：试卷编辑页

说明：
- GitHub Pages 推荐 `HashRouter`。
- 如果以后换自定义域名和 404 fallback，可再切回 `BrowserRouter`。

## 8.2 前端目录规划

```text
src/
  app/
    router.tsx
    providers.tsx
  components/
    ui/
    layout/
  features/
    exams/
      api/
      components/
      hooks/
      pages/
      types.ts
    admin/
      api/
      components/
      hooks/
      pages/
      schemas.ts
    auth/
      api/
      hooks/
  lib/
    supabase.ts
    query-client.ts
    env.ts
    shuffle.ts
    timer.ts
    errors.ts
  styles/
    index.css
```

## 8.3 页面职责

### 首页
- 拉取公开试卷目录
- 展示试卷卡片
- 点击后弹出访问码 + 姓名 Modal

### 答题页
- 初始化 Fisher-Yates 洗牌
- 启动 `performance.now()` 计时
- 展示进度条、计时器、题目列表
- 本地维护答案状态

### 结果页
- 显示正确率
- 显示逐题正误、正确答案、解析
- 支持打印样式

### 管理后台
- 登录态检测
- 试卷 CRUD
- 题目 CRUD
- AI JSON 导题入口
- 趋势图与错题率分析

## 9. 本地开发环境

## 9.1 推荐工具

- Node.js LTS
- npm
- Supabase CLI
- Codex + Supabase MCP

## 9.2 初始化步骤

- [ ] `npm create vite@latest web -- --template react-ts`
- [ ] 进入 `web/` 后安装依赖
- [ ] 安装 `tailwindcss`、`@supabase/supabase-js`、`@tanstack/react-query`、`react-router-dom`、`zod`、`recharts`
- [ ] 初始化 Supabase 本地项目：`supabase init`
- [ ] 启动本地服务：`supabase start`
- [ ] 创建 `.env.local`：
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] 配置 GitHub Pages 构建和 `vite.config.ts` 的 `base`

## 9.3 仓库建议结构

```text
/
  docs/
  web/
  supabase/
    functions/
      start-exam/
      submit-exam/
    migrations/
    seed.sql
  task_plan.md
  findings.md
  progress.md
```

## 10. 测试策略

## 10.1 总原则

实现阶段遵守 TDD：
- 先写失败测试
- 确认失败
- 写最小实现
- 再验证通过

## 10.2 前端测试

工具：
- Vitest
- React Testing Library

覆盖重点：
- 访问码弹窗校验
- 题型渲染
- 计时器显示
- 提交按钮启用/禁用逻辑
- 结果页解析渲染

## 10.3 后端测试

覆盖重点：
- `start_exam` 对错误访问码返回 401/403
- `submit_exam` 正确写入 `submissions`
- `submit_exam` 正确写入 `submission_items`
- 单选、多选、文本题评分逻辑
- 题目与答案的级联删除

建议方式：
- Edge Functions 单元测试
- 本地 Supabase 集成测试
- 用 SQL 查询验证数据库最终状态

## 10.4 E2E 测试

工具：
- Playwright

最少覆盖 3 条主链路：
- 学生从首页进入考试并提交
- 管理员登录后创建试卷并新增题目
- AI JSON 导题后可在后台看到结果并能被学生端读取

## 11. 分阶段实施计划

## 11.0 当前实现状态快照

截至当前本地实现，以下模块已经完成第一版：
- 学生端公开试卷目录、访问码进入、答题、提交与结果反馈
- Supabase schema、RLS、`start-exam`、`submit-exam`
- 管理员登录、analytics 第一版、题目编辑、题目 CRUD、选项编辑
- 试卷级创建与删除

当前仍未完成、但不阻塞本次可部署演示的部分：
- AI JSON 导题入口与 `upsert_exam_data`
- Playwright E2E 测试
- 打印导出体验的完整实现
- admin 区域路由级代码拆分与 bundle 优化

本次上线前的最小补齐项：
- 管理后台真实试卷列表
- GitHub Pages workflow 与 `vite.config.ts` 的 `base` 配置
- 一份真实可复用的英文经济学博弈论测试卷样本

### Task 1: 初始化前端与 Supabase 项目骨架

**Files:**
- Create: `web/package.json`
- Create: `web/src/main.tsx`
- Create: `web/src/app/router.tsx`
- Create: `supabase/config.toml`

- [ ] 创建 Vite React TypeScript 项目
- [ ] 安装 Tailwind 与基础依赖
- [ ] 保存并登记用户提供的前端原型，作为实现参考
- [ ] 初始化 Supabase 本地目录
- [ ] 跑通前端开发服务器与本地 Supabase
- [ ] 提交一次初始化 commit

### Task 2: 建立数据库迁移与基础 schema

**Files:**
- Create: `supabase/migrations/0001_init_exam_schema.sql`
- Create: `supabase/seed.sql`

- [ ] 先写 schema 验证清单
- [ ] 创建 `exams`、`exam_access`、`questions`、`answers_library`、`submissions`、`submission_items`
- [ ] 添加外键与索引
- [ ] 本地执行迁移
- [ ] 用 SQL 验证级联删除

### Task 3: 配置 RLS 与管理员角色策略

**Files:**
- Modify: `supabase/migrations/0001_init_exam_schema.sql`
- Create: `supabase/migrations/0002_rls_and_policies.sql`

- [ ] 定义 `is_admin()` 辅助函数
- [ ] 开启所有相关表的 RLS
- [ ] 配置管理员读写策略
- [ ] 配置匿名/学生的最小权限策略
- [ ] 验证匿名用户无法直接读取题目与答案

### Task 4: 实现公开试卷目录读取

**Files:**
- Create: `web/src/features/exams/api/listExamCatalog.ts`
- Create: `web/src/features/exams/pages/ExamCatalogPage.tsx`
- Create: `web/src/features/exams/components/ExamAccessModal.tsx`

- [ ] 先写首页渲染测试
- [ ] 实现试卷目录接口
- [ ] 实现试卷卡片和访问码弹窗
- [ ] 验证空列表、未开放试卷、加载失败三种状态

### Task 5: 实现 `start_exam` Edge Function

**Files:**
- Create: `supabase/functions/start-exam/index.ts`
- Create: `web/src/features/exams/api/startExam.ts`

- [ ] 先写错误访问码与成功返回题目的测试
- [ ] 实现访问码 hash 校验
- [ ] 实现题目查询与响应映射
- [ ] 前端接入开始考试接口
- [ ] 验证学生无法绕过接口直接读题

### Task 6: 实现答题页与本地作答状态

**Files:**
- Create: `web/src/features/exams/pages/ExamPage.tsx`
- Create: `web/src/features/exams/components/QuestionRenderer.tsx`
- Create: `web/src/lib/shuffle.ts`
- Create: `web/src/lib/timer.ts`

- [ ] 先写题型渲染与答题状态测试
- [ ] 实现 Fisher-Yates 洗牌
- [ ] 实现计时器与进度条
- [ ] 实现单选、多选、文本题录入
- [ ] 验证刷新和异常退出的最小容错策略

### Task 7: 实现 `submit_exam` Edge Function

**Files:**
- Create: `supabase/functions/submit-exam/index.ts`
- Create: `web/src/features/exams/api/submitExam.ts`

- [ ] 先写评分逻辑测试
- [ ] 实现答案读取、评分、提交记录写入
- [ ] 写入 `submission_items`
- [ ] 返回正确答案与解析
- [ ] 验证前端无法获取未提交题目的答案

### Task 8: 实现结果页与打印导出

**Files:**
- Create: `web/src/features/exams/pages/ResultPage.tsx`
- Create: `web/src/styles/print.css`

- [ ] 先写结果页渲染测试
- [ ] 展示总体正确率与逐题反馈
- [ ] 添加打印样式
- [ ] 验证浏览器打印输出与单文件 HTML 方案

### Task 9: 实现管理员登录与后台框架

**Files:**
- Create: `web/src/features/auth/api/adminLogin.ts`
- Create: `web/src/features/admin/pages/AdminDashboardPage.tsx`
- Create: `web/src/features/admin/components/AdminLayout.tsx`

- [ ] 先写管理员登录态测试
- [ ] 接入 Supabase Auth
- [ ] 实现隐藏入口与后台布局
- [ ] 验证非管理员无法进入后台

### Task 10: 实现试卷与题目管理界面

**Files:**
- Create: `web/src/features/admin/pages/ExamEditorPage.tsx`
- Create: `web/src/features/admin/components/QuestionEditor.tsx`
- Create: `web/src/features/admin/api/examAdminApi.ts`

- [ ] 先写新增/编辑题目测试
- [ ] 实现试卷 CRUD
- [ ] 实现题目与答案编辑
- [ ] 验证删除试卷会联动删除题目与答案

### Task 11: 实现 AI JSON 导题入口

**Files:**
- Create: `web/src/features/admin/components/AiSyncPanel.tsx`
- Create: `web/src/features/admin/schemas/aiPayloadSchema.ts`
- Create: `supabase/migrations/0003_upsert_exam_data.sql`

- [ ] 先写 JSON 校验测试
- [ ] 用 Zod 校验 AI 输入
- [ ] 实现 `upsert_exam_data` RPC
- [ ] 显示导入结果与错误信息

### Task 12: 实现数据分析与图表

**Files:**
- Create: `web/src/features/admin/components/ScoreTrendChart.tsx`
- Create: `web/src/features/admin/components/QuestionHeatTable.tsx`
- Create: `web/src/features/admin/api/analyticsApi.ts`

- [ ] 先写统计数据映射测试
- [ ] 实现成绩趋势图
- [ ] 实现题目错误率表格/热度视图
- [ ] 验证空数据与大数据量表现

### Task 13: 部署到 GitHub Pages

**Files:**
- Create: `.github/workflows/deploy-pages.yml`
- Modify: `web/vite.config.ts`

- [ ] 配置 build 脚本
- [ ] 配置 GitHub Pages workflow
- [ ] 设置 repo base path
- [ ] 验证首次部署、刷新路由和资源路径

推荐实现说明：
- `router` 继续使用 `HashRouter`
- `vite.config.ts` 从环境变量读取 `base`
- GitHub Actions 在构建阶段注入 `VITE_BASE_PATH=/<repo-name>/`
- 部署产物目录为 `web/dist`

测试数据建议：
- 使用 `docs/test-data/game-theory-midterm-sample.json` 作为真实联调题库样本

## 12. 验收标准

满足以下条件才算第一版可交付：
- 学生不能通过浏览器直查题目表或答案表。
- 输入正确访问码后能开始答题。
- 提交后立即得到正确率与逐题解析。
- 删除试卷后，题目与答案自动级联删除。
- 管理员可登录后台并维护试卷与题目。
- 后台可查看成绩趋势和各题错误率。
- AI JSON 导题能成功创建或更新题目。
- GitHub Pages 可正常访问前端。

## 13. 风险与规避

### 风险 1：把学生查询直接连到公开表

后果：
- 访问码失效
- 题目泄露

规避：
- 学生流一律走 Edge Functions

### 风险 2：只保留总成绩，不保留逐题结果

后果：
- 无法做题目错误率分析
- 无法可靠回放历史结果

规避：
- 增加 `submission_items`

### 风险 3：把访问码明文放到公开查询里

后果：
- 浏览器中可直接看到访问码

规避：
- 独立私有访问表 + hash

### 风险 4：管理员权限绑定到 `user_metadata`

后果：
- 用户可自行篡改元数据导致越权

规避：
- 只认 `app_metadata.role`

## 14. 建议的实现顺序

如果下一步开始开发，按这个顺序推进最稳：

1. 数据库 schema 与 RLS
2. `start_exam`
3. 答题页
4. `submit_exam`
5. 结果页
6. 管理员登录
7. 题库管理
8. AI 导题
9. 数据分析
10. GitHub Pages 部署

这样可以先把最关键的“学生可考试 + 后端能安全批改”跑通，再叠加后台能力。
