# Progress Log

## Session: 2026-04-09

### Phase 5: Production Finish
- **Status:** in_progress
- Actions taken:
  - 重新核对当前未提交代码、规划文件和生产修复方向。
  - 读取 `supabase`、`writing-plans`、`planning-with-files`、`test-driven-development`、`verification-before-completion` 技能，收敛收尾流程。
  - 新建生产联调收尾计划文档 `docs/superpowers/plans/2026-04-09-production-finish.md`。
  - 将当前已知生产阻塞明确记录为：远端 Edge Functions 不能直接访问 `app_private` schema，必须改走 helper RPC。
  - 修复后台壳层无滚动条的问题：为 `admin-route-shell` 和 `admin-layout` 增加垂直滚动能力，同时保持学生端壳层不变。
- Files created/modified:
  - `docs/superpowers/plans/2026-04-09-production-finish.md` (created)
  - `task_plan.md` (updated)
  - `findings.md` (updated)
  - `progress.md` (updated)
  - `web/src/features/admin/styles.css` (updated)

### Phase 1: Requirements & Discovery
- **Status:** complete
- **Started:** 2026-04-09 18:16
- Actions taken:
  - 读取项目全局记忆与本项目已有 Supabase MCP 记忆。
  - 检查 `brainstorming`、`test-driven-development`、`writing-plans`、`planning-with-files`、`supabase` skill。
  - 核对当前目录与已有文件，确认仓库仍处于规划起步阶段。
  - 识别访问码泄露、题目公开读取和统计维度不足三类核心设计冲突。
- Files created/modified:
  - `task_plan.md` (created)
  - `findings.md` (created)
  - `progress.md` (created)

### Phase 2: Planning & Documentation
- **Status:** complete
- Actions taken:
  - 完成技术栈备选方案对比，并确定推荐方案。
  - 产出主技术文档，覆盖架构、数据库、RLS、Edge Functions、前端模块、测试与部署。
  - 将原始需求中的高风险点转化为“必须修正项”写入文档。
- Files created/modified:
  - `docs/online-exam-system-development-plan.md` (created)

### Phase 3: Delivery Preparation
- **Status:** complete
- Actions taken:
  - 回填 planning-with-files 三个记录文件。
  - 准备向用户说明文档位置与建议的下一步实现顺序。
  - 对主文档做覆盖性自检，确认包含技术选型、数据库、权限、安全、测试、阶段计划和验收标准。
  - 保存用户提供的苹果风格前端原型，登记为后续前端实现的视觉基准。
- Files created/modified:
  - `task_plan.md` (updated)
  - `findings.md` (updated)
  - `progress.md` (updated)
  - `docs/reference/nexus-class-prototype.html` (created)
  - `docs/online-exam-system-development-plan.md` (updated)

### Phase 4: Initial Implementation
- **Status:** in_progress
- Actions taken:
  - 开始按开发计划进入实现阶段。
  - 初始化 `web/` Vite React TypeScript 脚手架并安装测试依赖。
  - 先写失败测试，约束首页必须出现 `Nexus Class`、`Student Access`、`Administrator Portal` 三个原型入口。
  - 将用户给的静态 HTML 原型迁移为 React 版四视图应用壳层。
  - 初始化 `supabase/` 本地工程目录，为后续 migration 和 Edge Functions 做准备。
  - 确认从本轮开始，代码注释和实际显示文本统一使用 English。
  - 创建首个 Supabase migration，写入 public/private schema、级联删除约束和索引。
  - 添加 `supabase/seed.sql` placeholder，保证本地配置引用的 seed 文件存在。
  - 将下一段实现范围收敛为独立的 RLS migration slice：`is_admin()`、`exam_catalog`、RLS 和 policies。
  - 创建第二个 Supabase migration，写入 admin helper、public exam catalog view、table grants 和 RLS policies。
  - 规划下一段实现为 app/lib/api 基础设施 + Supabase function skeleton，不在这一轮实现完整评分逻辑。
  - 新增 router/providers/query client/env/supabase client 基础设施，并把原型壳层迁入 feature page。
  - 新增 exam API client 与测试，固定 catalog/start/submit 三条请求路径与 payload 结构。
  - 创建 `start-exam` 与 `submit-exam` 的 Supabase function skeleton，统一 method、JSON 解析和错误响应结构。
  - 为目录页接入真实 `exam_catalog` 查询通路，并在缺少环境变量时回退到本地 prototype catalog。
  - 为后端函数补上真实业务 helper：访问码 hash 校验、题目读取、答案比对和 submission 持久化骨架。
  - 收敛下一段实现计划：学生端真实考试流只覆盖 access form、question state、submit flow 和 result view。
  - 重新读取当前 shell page、API wrapper 和样式文件，确认最小变更边界仍可保持原型视觉结构不变。
  - 按 TDD 为学生端真实考试流新增两条页面级测试，覆盖 access form、start exam、submit exam 和 result summary。
  - 将 `NexusShellPage` 从静态 prototype 壳层升级为真实学生状态机，接入 access form、题目渲染、计时、答题状态和结果页。
  - 在缺少 Supabase 运行时环境时，为 start/submit 保留本地 prototype fallback，保证页面依然可演示。
  - 扩展 shell 样式，新增 access panel、result cards、text answer field 和状态按钮样式。
  - 补全 `examApi` 的响应类型定义，使前端提交结果页可以安全消费返回值。
  - 修复回归中暴露出的 TypeScript 推断问题后，再次完成全量测试与构建验证。
  - 回看主开发文档的任务序列后，将下一阶段收敛为本地 Supabase 联调基础：共享逻辑测试、seed 数据和环境模板。
  - 为共享逻辑新增后端测试，覆盖 `startExam` 的访问码校验和 `submitExam` 的评分/持久化行为。
  - 添加本地联调 seed 数据，写入固定 exam、questions、answers、submissions 和 `submission_items` 示例记录。
  - 新增 `web/.env.example` 和本地联调说明文档，明确本地 CLI 项目应使用 API URL 与 anon key。
  - 修正 seed 中的非法 UUID，并将后端逻辑测试移出 `web/src` 以避免污染前端 build 边界。
  - 重新完成全量测试、生产构建和 seed UUID 静态校验。
  - 基于主开发文档重新排序下一切片，决定先补管理员登录与后台壳层，再进入 analytics 实现。
  - 将新的 analytics 切片收敛为 read model、趋势图、热点表和 dashboard 接线，不扩到编辑器或 AI 导题。
  - 将新的 admin content slice 收敛为 exam editor 的读取基础与页面骨架，不在这一轮扩展到完整写回或 AI 导题。
  - 按 TDD 为 `examAdminApi` 和 `ExamEditorPage` 新增测试。
  - 新增 `examAdminApi`，实现试卷与题目快照到 editor read model 的映射，并保留 fallback。
  - 新增 `QuestionEditor` 和 `ExamEditorPage`，形成试卷编辑器第一版本地 draft 壳层。
  - 为 admin router 增加 `/admin/exams/:examId`，并从 dashboard 增加进入编辑器的内容入口。
  - 再次完成全量测试与构建验证，并记录持续存在的 chunk size warning。
  - 按 TDD 为 analytics read model 和管理员 dashboard 渲染新增测试。
  - 新增 `analyticsApi`，实现 submissions、submission_items、questions 三路数据到 dashboard read model 的映射。
  - 新增 `ScoreTrendChart` 和 `QuestionHeatTable`，把管理员后台从占位壳层升级为第一版统计视图。
  - 将 analytics 接入 `AdminDashboardPage`，渲染平均正确率、活跃学生、常见错题、趋势图和热点表。
  - 修复 analytics 测试的异步等待问题以及 Recharts tooltip 的类型兼容问题。
  - 再次完成全量测试与生产构建验证，并记录 chunk size warning。
  - 按 TDD 为管理员登录 API、管理员登录页和管理员后台页新增测试。
  - 新增 `adminLogin` API 封装，接入 Supabase Auth 的 sign-in、session 和 sign-out 行为，并用 `app_metadata.role` 做 admin 校验。
  - 新增管理员登录页、管理员后台壳层和独立 admin 路由。
  - 将登录页中的管理员入口改为右上角隐蔽入口，并接到 `/admin/login`。
  - 修复测试中的 Vitest hoist 限制和 Router 上下文问题后，完成全量测试与构建验证。
- Files created/modified:
  - `web/package.json` (updated)
  - `web/vite.config.ts` (updated)
  - `web/tsconfig.app.json` (updated)
  - `web/src/App.tsx` (rewritten)
  - `web/src/App.css` (rewritten)
  - `web/src/index.css` (rewritten)
  - `web/src/App.test.tsx` (created)
  - `web/src/test/setup.ts` (created)
  - `supabase/config.toml` (created by CLI)
  - `supabase/migrations/20260409183631_init_exam_schema.sql` (created)
  - `supabase/seed.sql` (created)
  - `supabase/migrations/20260409184020_rls_and_policies.sql` (created)
  - `web/src/app/providers.tsx` (created)
  - `web/src/app/router.tsx` (created)
  - `web/src/lib/query-client.ts` (created)
  - `web/src/lib/env.ts` (created)
  - `web/src/lib/supabase.ts` (created)
  - `web/src/features/exams/api/examApi.ts` (created)
  - `web/src/features/exams/api/examApi.test.ts` (created)
  - `web/src/features/exams/types.ts` (created)
  - `web/src/features/exams/hooks/useExamCatalog.ts` (created)
  - `web/src/features/shell/pages/NexusShellPage.tsx` (created)
  - `web/src/features/shell/styles.css` (created)
  - `web/src/lib/exam-api.ts` (created)
  - `supabase/functions/_shared/http.ts` (created)
  - `supabase/functions/_shared/exam-service.ts` (created)
  - `supabase/functions/start-exam/index.ts` (created)
  - `supabase/functions/submit-exam/index.ts` (created)
  - `task_plan.md` (updated)
  - `web/src/features/auth/api/adminLogin.ts` (created)
  - `web/src/features/auth/api/adminLogin.test.ts` (created)
  - `web/src/features/auth/pages/AdminLoginPage.tsx` (created)
  - `web/src/features/auth/pages/AdminLoginPage.test.tsx` (created)
  - `web/src/features/admin/components/AdminLayout.tsx` (created)
  - `web/src/features/admin/pages/AdminDashboardPage.tsx` (created)
  - `web/src/features/admin/pages/AdminDashboardPage.test.tsx` (created)
  - `web/src/features/admin/styles.css` (created)
  - `web/src/features/admin/api/analyticsApi.ts` (created)
  - `web/src/features/admin/api/analyticsApi.test.ts` (created)
  - `web/src/features/admin/components/ScoreTrendChart.tsx` (created)
  - `web/src/features/admin/components/QuestionHeatTable.tsx` (created)
  - `web/src/features/admin/pages/AdminDashboardPage.tsx` (updated)
  - `web/src/features/admin/pages/AdminDashboardPage.test.tsx` (updated)
  - `web/src/features/admin/styles.css` (updated)
  - `web/src/features/admin/api/examAdminApi.ts` (created)
  - `web/src/features/admin/api/examAdminApi.test.ts` (created)
  - `web/src/features/admin/components/QuestionEditor.tsx` (created)
  - `web/src/features/admin/pages/ExamEditorPage.tsx` (created)
  - `web/src/features/admin/pages/ExamEditorPage.test.tsx` (created)
  - `web/src/app/router.tsx` (updated)
  - `web/src/features/shell/pages/NexusShellPage.tsx` (updated)
  - `web/src/features/shell/pages/NexusShellPage.test.tsx` (updated)
  - `web/src/features/shell/styles.css` (updated)
  - `findings.md` (updated)
  - `findings.md` (updated)
  - `task_plan.md` (updated)
  - `web/src/features/shell/pages/NexusShellPage.test.tsx` (created)
  - `web/src/features/shell/pages/NexusShellPage.tsx` (rewritten)
  - `web/src/features/shell/styles.css` (updated)
  - `web/src/features/exams/api/examApi.ts` (updated)
  - `task_plan.md` (updated)
  - `supabase/seed.sql` (rewritten)
  - `web/.env.example` (created)
  - `docs/local-supabase-development.md` (created)
  - `web/tests/exam-service.test.ts` (created)
  - `findings.md` (updated)
  - `supabase/functions/save-exam-draft/index.ts` (created)
  - `supabase/functions/_shared/http.ts` (updated)
  - `supabase/functions/_shared/exam-service.ts` (updated)
  - `web/src/features/admin/api/examAdminApi.ts` (updated)
  - `web/src/features/admin/api/examAdminApi.test.ts` (updated)
  - `web/src/features/admin/pages/ExamEditorPage.tsx` (updated)
  - `web/src/features/admin/pages/ExamEditorPage.test.tsx` (updated)
  - `web/src/features/admin/styles.css` (updated)
  - `web/tests/exam-service.test.ts` (updated)
  - `web/src/features/admin/components/QuestionEditor.tsx` (updated)
  - `web/src/features/admin/pages/ExamEditorPage.tsx` (updated)
  - `web/src/features/admin/pages/ExamEditorPage.test.tsx` (updated)
  - `web/src/features/admin/api/examAdminApi.test.ts` (updated)
  - `supabase/functions/load-exam-draft/index.ts` (created)
  - `supabase/functions/save-exam-draft/index.ts` (updated)
  - `web/src/features/admin/components/QuestionEditor.tsx` (updated)
  - `web/src/features/admin/pages/ExamEditorPage.tsx` (updated)
  - `web/src/features/admin/pages/ExamEditorPage.test.tsx` (updated)
  - `web/src/features/admin/api/examAdminApi.ts` (updated)
  - `web/src/features/admin/api/examAdminApi.test.ts` (updated)
  - `web/src/features/admin/styles.css` (updated)
  - `web/tests/exam-service.test.ts` (updated)

  - `supabase/functions/create-exam-draft/index.ts` (created)
  - `supabase/functions/delete-exam-draft/index.ts` (created)
  - `supabase/functions/_shared/exam-service.ts` (updated)
  - `web/src/features/admin/api/examAdminApi.ts` (updated)
  - `web/src/features/admin/api/examAdminApi.test.ts` (updated)
  - `web/src/features/admin/pages/AdminDashboardPage.tsx` (updated)
  - `web/src/features/admin/pages/AdminDashboardPage.test.tsx` (updated)
  - `web/src/features/admin/pages/ExamEditorPage.tsx` (updated)
  - `web/src/features/admin/pages/ExamEditorPage.test.tsx` (updated)
  - `web/tests/exam-service.test.ts` (updated)
  - `findings.md` (updated)
  - `task_plan.md` (updated)
  - `docs/test-data/game-theory-midterm-sample.json` (created)
  - `.gitignore` (created)
  - `.github/workflows/deploy-pages.yml` (created)
  - `web/vite.config.ts` (updated)
  - `web/src/features/admin/api/examAdminApi.ts` (updated)
  - `web/src/features/admin/api/examAdminApi.test.ts` (updated)
  - `web/src/features/admin/pages/AdminDashboardPage.tsx` (updated)
  - `web/src/features/admin/pages/AdminDashboardPage.test.tsx` (updated)
  - `web/src/features/admin/styles.css` (updated)
  - `docs/online-exam-system-development-plan.md` (updated)
  - `task_plan.md` (updated)
  - `findings.md` (updated)

## Test Results
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| 规划记录模板读取 | 打开 planning-with-files 模板 | 能读取任务模板内容 | 初次路径错误，修正后读取成功 | ✓ |
| 项目状态检查 | `ls -la` | 确认当前目录主要为 agent skill 安装产物 | 确认尚无业务源码，可直接写规划文档 | ✓ |
| 主文档覆盖性检查 | `sed` 检查主文档 | 应包含修正项、schema、接口、测试、阶段计划 | 已覆盖所需章节 | ✓ |
| 前端原型落盘检查 | 创建原型 HTML 文件 | 本地存在可引用的视觉基准文件 | `docs/reference/nexus-class-prototype.html` 已创建 | ✓ |
| 首个前端测试 | `cd web && npm test` | 原型壳层相关测试通过 | 1 file / 1 test passed | ✓ |
| 前端生产构建 | `cd web && npm run build` | 产出可构建的静态资源 | Vite build 成功，输出到 `web/dist` | ✓ |
| Supabase 本地工程初始化 | `npx supabase init` | 创建本地 `supabase/` 工程目录 | `supabase/config.toml` 已生成 | ✓ |
| Schema migration file check | `rg` + `ls` on migration files | Six base tables and seed placeholder exist | Migration and `seed.sql` both present | ✓ |
| Frontend regression after schema work | `cd web && npm test && npm run build` | Existing frontend remains healthy | Tests and build both passed | ✓ |
| RLS migration file check | `rg` + `ls` on RLS migration | `is_admin`, `exam_catalog`, RLS and policies exist | Second migration created and contains expected objects | ✓ |
| Frontend regression after RLS work | `cd web && npm test && npm run build` | Existing frontend remains healthy | Tests and build both passed | ✓ |
| Exam API client tests | `cd web && npm test` | Catalog/start/submit request wrappers are covered | 2 files / 4 tests passed | ✓ |
| Function skeleton presence | `find supabase/functions -maxdepth 3 -type f` | Shared helper and two function entrypoints exist | `_shared/http.ts`, `start-exam`, `submit-exam` present | ✓ |
| Frontend regression after infrastructure slice | `cd web && npm run build` | Router/providers/api refactor still builds | Vite build passed | ✓ |
| Frontend regression after business slice | `cd web && npm test && npm run build` | Catalog hook and shell updates keep frontend healthy | 2 files / 4 tests passed; build passed | ✓ |
| Backend business helper presence | `rg` on shared helpers and entrypoints | Real start/submit logic exists beyond pure skeleton | `useExamCatalog`, `evaluateAnswer`, `startExam`, `submitExam` all present | ✓ |
| Student flow page tests (RED/GREEN) | `cd web && npm test -- src/features/shell/pages/NexusShellPage.test.tsx` | Access form and result flow are covered | 1 file / 2 tests passed after implementation | ✓ |
| Full frontend regression after student flow | `cd web && npm test && npm run build` | Entire frontend should stay healthy after shell rewrite | 3 files / 6 tests passed; Vite build passed | ✓ |
| Shared exam service tests | `cd web && npm test -- web/tests/exam-service.test.ts` | Start/submit backend logic should be covered without a live Supabase stack | 1 file / 4 tests passed | ✓ |
| Seed UUID validation | Python UUID check over `supabase/seed.sql` | All quoted UUID literals should be valid | 37 UUID strings validated successfully | ✓ |
| Full regression after local integration slice | `cd web && npm test && npm run build` | Frontend should remain healthy after new tests and env template | 4 files / 10 tests passed; Vite build passed | ✓ |
| Admin auth slice tests | `cd web && npm test -- src/features/auth/api/adminLogin.test.ts src/features/auth/pages/AdminLoginPage.test.tsx src/features/admin/pages/AdminDashboardPage.test.tsx` | Admin auth API, login page, and protected dashboard should be covered | 3 files / 8 tests passed | ✓ |
| Full regression after admin auth slice | `cd web && npm test && npm run build` | Frontend should remain healthy after admin routes and auth shell | 7 files / 18 tests passed; Vite build passed | ✓ |
| Analytics slice tests | `cd web && npm test -- src/features/admin/api/analyticsApi.test.ts src/features/admin/pages/AdminDashboardPage.test.tsx` | Analytics read model and dashboard rendering should be covered | 2 files / 3 tests passed | ✓ |
| Full regression after analytics slice | `cd web && npm test && npm run build` | Frontend should remain healthy after charts and analytics read model | 8 files / 19 tests passed; Vite build passed | ✓ |
| Exam editor foundation tests | `cd web && npm test -- src/features/admin/api/examAdminApi.test.ts src/features/admin/pages/ExamEditorPage.test.tsx` | Editor read model and page shell should be covered | 2 files / 2 tests passed | ✓ |
| Full regression after exam editor foundation | `cd web && npm test && npm run build` | Frontend should remain healthy after editor route and page shell | 10 files / 21 tests passed; Vite build passed | ✓ |
| Secure editor save tests | `cd web && npm test -- web/tests/exam-service.test.ts src/features/admin/api/examAdminApi.test.ts src/features/admin/pages/ExamEditorPage.test.tsx` | Admin save contract, shared save logic, and editor save interaction should be covered | 2 files / 5 tests passed | ✓ |
| Full regression after secure editor save slice | `cd web && npm test && npm run build` | Frontend should remain healthy after secure editor persistence wiring | 10 files / 25 tests passed; Vite build passed with chunk size warning | ✓ |
| Full editor answer-management tests | `cd web && npm test -- web/tests/exam-service.test.ts src/features/admin/api/examAdminApi.test.ts src/features/admin/pages/ExamEditorPage.test.tsx` | Secure draft load/save plus answer and explanation editing should be covered | 2 files / 6 tests passed | ✓ |
| Full regression after secure editor answer slice | `cd web && npm test && npm run build` | Frontend should remain healthy after private answer read/write integration | 10 files / 27 tests passed; Vite build passed with chunk size warning | ✓ |
| Question CRUD targeted tests | `cd web && npm test -- tests/exam-service.test.ts src/features/admin/api/examAdminApi.test.ts src/features/admin/pages/ExamEditorPage.test.tsx` | Secure create/delete question workflow should be covered across service, API, and page layers | 3 files / 17 tests passed | ✓ |
| Full regression after question CRUD slice | `cd web && npm test && npm run build` | Frontend should remain healthy after question create/delete workflow | 10 files / 32 tests passed; Vite build passed with chunk size warning | ✓ |
| Option editing targeted tests | `cd web && npm test -- tests/exam-service.test.ts src/features/admin/api/examAdminApi.test.ts src/features/admin/pages/ExamEditorPage.test.tsx` | Option text edits and add/remove option behavior should be covered across service, API, and page layers | 3 files / 22 tests passed | ✓ |
| Full regression after option editing slice | `cd web && npm test && npm run build` | Frontend should remain healthy after option editing workflow | 10 files / 37 tests passed; Vite build passed with chunk size warning | ✓ |
| Exam create/delete targeted tests | `cd web && npm test -- --run tests/exam-service.test.ts src/features/admin/api/examAdminApi.test.ts src/features/admin/pages/AdminDashboardPage.test.tsx src/features/admin/pages/ExamEditorPage.test.tsx` | Secure exam-level create/delete workflow should be covered across service, API, dashboard, and editor layers | 4 files / 30 tests passed | ✓ |
| Full regression after exam create/delete slice | `cd web && npm test && npm run build` | Frontend should remain healthy after exam-level create/delete workflow | 10 files / 43 tests passed; Vite build passed with chunk size warning | ✓ |
| Admin exam list targeted tests | `cd web && npm test -- --run src/features/admin/api/examAdminApi.test.ts src/features/admin/pages/AdminDashboardPage.test.tsx` | Admin dashboard should load and render a browsable exam list | 2 files / 13 tests passed | ✓ |
| Full regression after deployment-prep slice | `cd web && npm test && VITE_BASE_PATH=/nexus-class-exam-system/ npm run build` | Frontend should stay healthy after exam list and Pages config changes | 10 files / 45 tests passed; base-aware Vite build passed with chunk size warning | ✓ |
| GitHub Pages deployment | `gh repo create` + `gh run watch` + `curl -I` | Repo should exist, workflow should deploy, and site should return 200 | Repo created, deploy workflow succeeded, Pages URL returned HTTP 200 | ✓ |

## Error Log
| Timestamp | Error | Attempt | Resolution |
|-----------|-------|---------|------------|
| 2026-04-09 18:20 | 读取模板路径错误 | 1 | 改用 `/Users/Zhuanz/.agents/skills/planning-with-files/planning-with-files/templates/` |
| 2026-04-09 18:30 | Vitest setup 中 `expect` 未定义 | 1 | 在 `vite.config.ts` 中启用 `test.globals = true` |
| 2026-04-09 18:32 | `vite.config.ts` 的 `test` 字段类型报错导致 build 失败 | 1 | 将 `defineConfig` 改为从 `vitest/config` 导入 |
| 2026-04-09 18:36 | `npx supabase migration new` 解析到不存在的 `supabase@2.89.0` | 1 | 改用固定版本 `npx supabase@2.88.1 migration new ...` |
| 2026-04-09 15:15 | `vitest` 不支持 `--runInBand` | 1 | 改用 `npm test -- <file>` 运行单文件测试 |
| 2026-04-09 15:15 | 页面测试导入 `@testing-library/user-event` 失败 | 1 | 改用已安装的 `fireEvent` 完成交互测试 |
| 2026-04-09 15:19 | `NexusShellPage` 中 `map(normalizeQuestion)` 触发 TypeScript 交叉类型错误 | 1 | 将标准化函数签名改为接受 `content: unknown`，统一在函数内转换 |
| 2026-04-09 15:24 | 新增后端测试时相对路径多退一层，无法导入共享 exam service | 1 | 修正为从 `web/tests` 指向 `../../supabase/...` |
| 2026-04-09 15:24 | Fake Supabase client 未覆盖 `await query.select(...)` 的 thenable 查询路径 | 1 | 为测试查询对象补上 `then(...)`，模拟 Supabase promise-like query builder |
| 2026-04-09 15:26 | 后端测试放在 `web/src` 内导致前端 build 把 Supabase 共享文件一起纳入编译 | 1 | 将测试迁移到 `web/tests/`，恢复前端编译边界 |
| 2026-04-09 15:34 | 页面测试中的 `vi.mock` 工厂引用普通顶层变量，触发 hoist 初始化错误 | 1 | 改用 `vi.hoisted(...)` 创建 mock 函数引用 |
| 2026-04-09 15:35 | `NexusShellPage` 测试在新增 `useNavigate` 后缺少 Router 上下文 | 1 | 用 `MemoryRouter` 包裹页面测试 |
| 2026-04-09 15:40 | dashboard analytics 测试在异步 state 完成前就断言统计卡片 | 1 | 改为 `findByText` 等待 analytics 渲染完成 |
| 2026-04-09 15:41 | `Recharts` Tooltip formatter 的 TypeScript 类型比实现更严格 | 1 | 将 formatter 的 value 参数收宽为 `unknown`，避免 build 失败 |
| 2026-04-09 15:47 | editor 第一版需要展示题目，但当前没有安全的真实答案写回通道 | 1 | 本轮只做读取和本地 draft 编辑壳层，把真实 persistence 延后到下一切片 |
| 2026-04-09 15:52 | admin editor 需要真实保存，但浏览器不能直接写私有答案表或绕过管理员校验 | 1 | 增加 `save-exam-draft` Edge Function，在函数侧校验管理员会话，并只开放 title/stem 的最小写回面 |
| 2026-04-09 16:01 | 统一 lower-case 正确答案时污染了选项题的 option ID | 1 | 区分 text 关键字与 option IDs 的标准化逻辑，只对 text 题做 lower-case |
| 2026-04-09 16:06 | 题目新增测试最初漏掉了“完整列表同步语义”而导致误判 | 1 | 修正测试输入，保留未删除的既有题目，只把新增/删除行为各自单独验证 |
| 2026-04-09 16:10 | 页面层选项编辑测试最初失败，因为 UI 仍是静态选项标签 | 1 | 将选项渲染改为可编辑输入框，并补 Add/Remove Option 按钮与状态回写逻辑 |
| 2026-04-09 16:15 | 目标测试第一次运行使用了仓库根相对路径，Vitest 在 `web/` 下没有匹配到测试文件 | 1 | 改成 `tests/...` 和 `src/...` 的 `web` 目录内相对路径 |
| 2026-04-09 16:30 | GitHub Pages 首次 workflow 在 `Configure Pages` 失败，因为新仓库还没有 Pages site | 1 | 先用 `gh api -X POST repos/eruroueaito/nexus-class-exam-system/pages -f build_type=workflow` 创建站点，再重跑 workflow |

### Phase 5: Production Finish (continued)
- **Status:** complete
- Actions taken:
  - Confirmed all 3 remote migrations applied and 4 helper RPCs exist in production.
  - Deployed all 6 Edge Functions (start-exam v3, submit-exam v3, load-exam-draft v2, save-exam-draft v2, create-exam-draft v2, delete-exam-draft v2) via MCP with RPC-only service layer.
  - Ran smoke tests: start-exam → 200, submit-exam → 200 score=1.0 (3/3 correct, submission persisted), load-exam-draft → 401 without admin JWT (auth boundary verified).
  - Confirmed GitHub repository variables VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set.
  - Committed 17 files including helper migration, plan docs, and frontend test extensions.
  - Pushed to main; GitHub Actions workflow succeeded; Pages URL returns HTTP 200.
  - Documented production integration lessons in findings.md (app_private schema access, publishable key model, Edge Function security boundary).
- Files created/modified:
  - `supabase/migrations/20260409193000_private_helper_functions.sql` (committed)
  - `docs/superpowers/plans/2026-04-09-production-finish.md` (committed)
  - `web/src/features/admin/components/AiSyncPanel.tsx` (committed)
  - `web/src/features/admin/schemas/aiPayloadSchema.ts` (committed)
  - `findings.md` (updated with Production Integration Notes)
  - `progress.md` (updated)
  - `task_plan.md` (updated)

## Test Results (Production Smoke Tests — 2026-04-09)
| Test | Endpoint | Input | Expected | Actual | Status |
|------|----------|-------|----------|--------|--------|
| start-exam smoke | `/functions/v1/start-exam` | exam_id=11111111, password=123456, user=smoke-test-user | HTTP 200, 3 questions returned, no answers in response | 200, exam+questions payload, no correct_answer field | ✓ |
| submit-exam smoke | `/functions/v1/submit-exam` | exam_id=11111111, 3 correct answers | HTTP 200, score=1.0, submission_id written to DB | 200, score=1.0, correct_count=3, submission_id=5f50fb6c | ✓ |
| load-exam-draft auth boundary | `/functions/v1/load-exam-draft` | no Authorization header | HTTP 401 | 401 missing_authorization | ✓ |
| GitHub Pages deployment | https://eruroueaito.github.io/nexus-class-exam-system/ | GET / | HTTP 200 | 200 | ✓ |

## 5-Question Reboot Check
| Question | Answer |
|----------|--------|
| Where am I? | Phase 4: Initial Implementation |
| Where am I going? | 继续进入 AI 导题接口、打印导出、Playwright E2E 与 admin route 代码拆分 |
| What's the goal? | 为在线考试系统形成可落地的本地开发技术文档 |
| What have I learned? | 新仓库的 GitHub Pages 首次部署可能需要先手动创建 Pages site，之后 workflow 才能稳定工作；同时部署前最关键的后台补齐项是真实试卷列表而不是继续深挖局部编辑器细节 |
| What have I done? | 已保存原型、实现 React 壳层、创建 schema 与 RLS migrations、完成学生端真实考试流、本地联调基础、管理员登录壳层、后台 analytics 第一版、管理员编辑器的安全读写与试卷级 create/delete，补上后台试卷列表，完成 GitHub 仓库初始化与 GitHub Pages 部署，并生成了一套真实英文博弈论测试卷 JSON |

### Session: 2026-04-09 (Enhancement Round)
- **Status:** complete
- Actions taken:
  - Fixed admin console vertical scroll: added `align-items: flex-start` override for `.admin-route-shell .app-container` so tall content scrolls instead of clipping.
  - Fixed active student deduplication: `user_name.trim().toLowerCase()` normalization applied before counting unique students in `analyticsApi.ts`.
  - Added per-exam analytics switcher: `getExamAnalytics(examId?)` now filters submissions and questions by exam. Dashboard renders "All Exams / Exam1 / …" button group; switching reloads analytics.
  - Added wrong-answer drill-down: `QuestionHeatRow` now includes `wrongStudents?: string[]`. Clicking a row in `QuestionHeatTable` expands a pill list of students who answered incorrectly.
  - Added data source explanation: note below analytics grid identifies `submissions` and `submission_items` as the data source.
  - Added per-question time tracking: `NexusShellPage` now uses a `questionDisplayedAt` ref to accumulate per-question elapsed seconds. Timing flushes on navigation and before submit. Result page displays "Time: MM:SS" per result card.
  - Added per-question scoring display: quiz shows a point badge if `question.content.points` is set; result page shows "earned / total pts" per card.
  - Updated AI JSON import panel: default payload includes `"points": 10`; description notes the supported fields and question types.
  - Updated `AdminDashboardPage.test.tsx` to use `getAllByText` for exam title assertions (now appears in both switcher and exam list).
  - Committed (6842e6a) and pushed to `main`; GitHub Actions will redeploy to GitHub Pages.
- Files modified:
  - `web/src/features/admin/api/analyticsApi.ts` (dedup, wrongStudents, examId filter, sequential submission_items query)
  - `web/src/features/admin/components/AiSyncPanel.tsx` (points in default payload, format note)
  - `web/src/features/admin/components/QuestionHeatTable.tsx` (drill-down with Fragment + expandedQuestionId state)
  - `web/src/features/admin/pages/AdminDashboardPage.test.tsx` (updated assertions for duplicate exam title text)
  - `web/src/features/admin/pages/AdminDashboardPage.tsx` (exam switcher UI, data source note, selectedAnalyticsExamId state)
  - `web/src/features/admin/styles.css` (scrollbar fix, exam-switcher, analytics-source-note, drill-down styles)
  - `web/src/features/shell/pages/NexusShellPage.tsx` (useRef, questionTimings state, flushCurrentQuestionTiming, points display)
  - `web/src/features/shell/styles.css` (result-card__meta, result-card__timing, result-card__points, question-header, question-points)

## Test Results (Enhancement Round — 2026-04-09)
| Test | Command | Expected | Actual | Status |
|------|---------|----------|--------|--------|
| Full regression after enhancement round | `npx vitest run` | All tests pass | 10 files / 48 passed / 1 skipped | ✓ |
| TypeScript type check | `tsc --noEmit` | No type errors | No output (clean) | ✓ |

---
*Update after completing each phase or encountering errors*
