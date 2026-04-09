# Findings & Decisions

## Requirements
- 前端部署在 GitHub Pages，后端使用 Supabase。
- 管理员通过 Supabase Auth 登录，学生通过试卷访问码进入答题。
- 题目、答案、成绩、解析、后台统计必须解耦。
- 正确答案不能直接暴露给前端。
- 提交后需要立即返回得分、正确答案与解析。
- 后台需要查看成绩趋势和各题错误率。
- 管理端需要提供 AI 文本入口，支持按 JSON 协议批量同步题目与答案。
- 第一阶段要求先完成数据库、RLS、前端基础栈和连接能力。
- 开发过程中的代码注释和实际显示给用户的文本统一使用 English。

## Research Findings
- Supabase MCP 在当前 Codex 环境中已经连通并通过 OAuth，可继续用于后续 SQL、表结构与函数检查。
- 用户提供了一份苹果风格前端原型，后续 React 前端实现应以该原型为视觉和交互基准，不再自行重新定义整体风格。
- `apple-flat-frontend` 本地 skill 在当前环境缺失，因此本轮实现改为以用户提供的原型文件作为唯一视觉基线。
- `npx supabase migration new` 默认解析到了不存在的 `supabase@2.89.0`，需要显式使用已验证可用的 `npx supabase@2.88.1 ...`。
- 原始方案中“`questions` 表所有人可 `SELECT`”与“试卷访问码控制进入考试”是冲突的；如果学生能直接查表，就不需要访问码。
- 若 `exams` 表保存 `access_password`，同时首页又从 `exams` 公开读取列表，访问码会被前端直接看到；访问码必须拆分到私有表或至少改为 hash 并禁止匿名读取该列。
- 仅保留 `submissions` 总分记录，无法实现“各题错误率”统计，因此至少还需要 `submission_items` 这张支持性表。
- 学生答题流最适合通过 Edge Functions 完成“开始考试”和“提交批改”，管理员批量导题可使用 RPC 或受限 Edge Function。
- Supabase 权限判断应使用 `app_metadata.role=admin`，不应依赖 `user_metadata`。
- GitHub Pages 环境下前端路由推荐 `HashRouter`，避免静态托管的 404 刷新问题。

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| 前端采用 React + TypeScript | 管理后台、答题流程、图表和表单都偏交互型，React 生态最成熟 |
| 使用 Tailwind CSS | 满足用户指定方案，并能快速建立统一设计 token |
| 学生端只调用 Edge Functions，不直接查询题目或答案表 | 将敏感逻辑保留在后端，避免浏览器可见数据泄露 |
| 管理端采用 Supabase Auth + RLS + 受限 RPC | 管理员需要高频增删改查，直接使用受控数据接口效率更高 |
| 采用 `submission_items` 保存逐题作答快照 | 满足错题率分析、错题回放、结果页导出三类需求 |
| 首批前端实现先以 CSS 设计 token + React 状态切换复刻原型壳层 | 先把视觉与信息架构固定，再拆细组件和真实数据接入 |
| 实现阶段统一使用 English 注释与界面文案 | 与用户指定的开发语言规范保持一致 |
| RLS、admin helper 和 public catalog view 放进单独 migration | 使数据库结构和权限策略分层，更容易验证和排错 |
| `start-exam` 和 `submit-exam` 先搭 skeleton，只固定 method/payload/error contract | 先稳定接口边界，再逐步填充访问码验证和评分逻辑 |
| 目录页查询使用真实 `exam_catalog`，但在无环境变量时回落到本地 prototype 数据 | 避免开发期因缺少配置导致整个前端不可用 |
| 学生端真实考试流继续沿用单页 prototype shell，不额外拆新页面 | 先复用已确认的视觉基线，降低当前阶段的重构成本 |
| 学生端在无 Supabase env 时仍保留本地 start/submit fallback | 让前端在本地开发时始终可演示、可测试、可构建 |
| 本地联调阶段优先补 `seed.sql`、共享逻辑测试和 `.env` 模板 | 这样能先跑通真实数据闭环，再进入管理员统计与更细的题型增强 |
| 本地 Supabase CLI 项目应继续使用 `anon` key 供前端联调 | 官方文档说明 CLI/self-hosted 环境没有 hosted publishable key，当前变量名只作为前端兼容壳层保留 |
| 管理员 analytics 之前应先补管理员登录与后台壳层 | 统计接口和后台读模型必须有正确的鉴权边界，不应在未建立 admin shell 前直接暴露 |
| 管理员入口改为登录页右上角的隐蔽入口，并切到独立 `/admin/login` / `/admin` 路由 | 这与原始需求更一致，也让学生壳层和管理员壳层分层更清楚 |
| analytics 第一版先在前端构建 read model，再接图表和热点表 | 这样可以先锁住数据契约，不需要先引入新的数据库对象或 RPC |
| 管理员 dashboard 在无可用 Supabase 数据时应保留 analytics fallback | 保持后台演示能力，也能让组件测试独立于真实登录环境 |
| 试卷编辑器第一版应先做“读取 + 本地 draft 编辑壳层”，暂不直接写回 | 这样能先把页面结构和数据契约固定住，再决定写回接口是走表操作、RPC 还是 Edge Function |
| dashboard 到 exam editor 先用明确的内容入口跳转 | 管理员流程从“看统计”进入“改内容”更自然，也更利于后续拆分 admin route |
| 编辑器真实写回先走受限 Edge Function，而不是浏览器直写私有表 | `app_private.answers_library` 与管理员权限校验都必须保留在服务端，浏览器只发送规范化 draft payload |
| 第一版保存能力只覆盖 `exam title` 与 `question stem` | 先打通最小安全闭环，再决定答案编辑与批量同步的数据协议 |
| 编辑器读取私有答案也必须走受限 Edge Function | 浏览器不能直接读取 `answers_library`，即便当前用户是管理员，也不应突破 private schema 边界 |
| 题型相关的正确答案编辑应按最小可用方式分流 | `radio` 用单选、`checkbox` 用多选、`text` 用逗号分隔的 accepted answers，先满足维护效率再考虑更复杂的富编辑体验 |
| 编辑器新增题目时，最简单可靠的做法是前端先生成稳定 draft UUID | 这样浏览器和受限保存函数之间不需要额外的临时 ID 映射协议，保存时可直接插入正式记录 |
| 编辑器保存采用“完整题目列表同步”语义 | payload 中缺失的题目会被视为删除，后端统一做 insert / update / delete，同步逻辑更稳定 |
| 选项编辑不需要新增后端接口 | 当前受限保存合同已经携带完整 `options` 数组，前端只需把本地选项编辑状态纳入现有 save payload |
| 删除选项时必须同步清理失效的正确答案值 | 否则保存后会出现答案引用不存在选项的坏数据，前端应在本地状态层先做清理 |
| 试卷级新增/删除也必须继续走受限 Edge Function | 浏览器不能直接写 `exams` 与 `app_private.exam_access`，管理员会话校验和默认访问记录创建都应放在服务端 |
| 试卷草稿创建的最小可用合同只需要 `title + inactive status + default password hash` | 这样可以先打通 dashboard 到 editor 的创建流，不必等试卷列表和密码编辑器一起完成 |
| 删除试卷应依赖数据库级联约束而不是前端手工多次删除 | `exams -> questions -> answers_library` 与 `exam_access` 的清理应由数据库关系兜底，前端只发单次删除请求 |
| 部署前最值得补齐的后台能力是真实试卷列表，而不是继续深挖编辑器局部交互 | 文档要求后台具备试卷 CRUD，试卷列表是管理员导航和演示闭环的最低前提 |
| GitHub Pages 在新仓库上可能需要先创建 Pages site，随后 workflow 才能正常 deploy | 仓库首次部署时 `actions/configure-pages` 可能因为站点不存在而失败，需要先将 Pages build type 初始化为 `workflow` |
| `vite.config.ts` 的 `base` 最稳妥的做法是从环境变量读取 | 本地开发可保持 `/`，GitHub Actions 则注入 `/<repo-name>/`，避免把仓库名写死在源码里 |
| 真实测试题数据应先落成独立 JSON fixture，而不是直接塞进 seed 或硬编码 fallback | 这样便于后续 AI 导题、人工导入和回归测试复用，也不会污染默认演示数据 |
| 远端 Supabase Edge Functions 通过 Data API 直接访问自定义 `app_private` schema 会触发 `Invalid schema: app_private` | 按官方建议改为通过 `public` schema 下的 `SECURITY DEFINER` helper RPC 间接访问私有表，避免直接暴露自定义 schema |
| GitHub Pages 前端必须只使用 publishable key，而不是 secret key | 浏览器只负责 Auth、公开数据和函数调用；答案、访问码和管理员高权限写入必须经由 Edge Functions 或受限 RPC |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| 原始 4 表方案与分析需求不完全匹配 | 在文档中保留 4 张核心业务表，同时增加必要的支持表并说明原因 |
| 需求中将 “RPC” 与 “Edge Function” 混用 | 文档中拆成“管理员 RPC”和“学生 Edge Function”两类接口 |
| `vitest` 不支持 `--runInBand` | 改用 `npm test -- <file>` 的单文件运行方式 |
| 新增页面测试时缺少 `@testing-library/user-event` | 直接改用已安装的 `fireEvent`，避免增加额外依赖 |
| `startExam` 的真实返回类型与 prototype fallback 混合后触发 TypeScript map 推断冲突 | 将题目标准化函数的 `content` 参数收窄为 `unknown`，在函数内部统一转换 |
| `submission_items.id` 初版 seed 使用了非 UUID 前缀 | 改为合法 UUID 字符串，并额外运行静态 UUID 校验脚本 |
| 把后端共享逻辑测试放进 `web/src` 会污染前端 TypeScript build 边界 | 将测试移到 `web/tests/`，保留 Vitest 能力但不影响应用构建 |
| `NexusShellPage` 引入 `useNavigate` 后，旧页面测试缺少 Router 上下文 | 在页面测试外层补上 `MemoryRouter` |
| Vitest 对 `vi.mock` 工厂的提升规则导致页面测试中的 mock 变量初始化时报错 | 改用 `vi.hoisted(...)` 创建 mock 引用 |
| 引入 `recharts` 后，生产 bundle 明显增大并持续触发 chunk size warning | 记录为后续优化项，下一阶段应优先考虑 admin route 级代码拆分 |
| `Recharts` 的 `Tooltip` formatter 类型比运行时约束更严格 | 将 formatter 入参收宽到 `unknown`，用字符串化输出兼容类型系统 |
| 目前真实管理员题目编辑还缺安全写回路径 | `app_private.answers_library` 不在公开 schema 中，后续要么补受限 RPC/Edge Function，要么引入专门的 admin write interface |
| 编辑器写回如果直接整段覆盖 `content`，会丢失未来扩展字段 | 当前保存逻辑改为先读取已有 `content` 再 merge `stem/options`，保留 `media`、`hint` 等后续字段空间 |
| 正确答案标准化如果对所有题型统一 lower-case，会污染单选/多选题的选项 ID | 现在只对 `text` 题关键字做 lower-case 归一化，选项题保留原始 option ID 大小写 |
| 题目删除应优先删除 `questions` 表记录，而不是单独清理 `answers_library` | 当前 schema 已有 `ON DELETE CASCADE`，利用数据库约束比手工双删更稳妥 |
| 选项新增的最小实现可以按 `A/B/C/...` 顺序生成新 option ID | 这足够支撑当前后台维护流，后续若支持重排再考虑更复杂的稳定 ID 策略 |
| 目标测试首次运行时把路径写成了仓库根相对路径，Vitest 在 `web/` 内无法匹配测试文件 | 改为 `tests/...` 和 `src/...` 的 `web` 目录内相对路径 |
| GitHub Pages 首次 workflow 运行在 `Configure Pages` 失败 | 使用本地 `gh api -X POST repos/<owner>/<repo>/pages -f build_type=workflow` 先创建 Pages site，再重跑 workflow |

## Resources
- Frontend prototype: `/Users/Zhuanz/AI coding/Carol's test/docs/reference/nexus-class-prototype.html`
- Base schema migration: `/Users/Zhuanz/AI coding/Carol's test/supabase/migrations/20260409183631_init_exam_schema.sql`
- Seed placeholder: `/Users/Zhuanz/AI coding/Carol's test/supabase/seed.sql`
- Supabase skill: `/Users/Zhuanz/AI coding/Carol's test/.agents/skills/supabase/SKILL.md`
- Brainstorming skill: `/Users/Zhuanz/.agents/skills/superpowers/brainstorming/SKILL.md`
- Writing plans skill: `/Users/Zhuanz/.agents/skills/superpowers/writing-plans/SKILL.md`
- Planning-with-files skill: `/Users/Zhuanz/.agents/skills/planning-with-files/planning-with-files/SKILL.md`
- Codex config: `/Users/Zhuanz/.codex/config.toml`

## Production Integration Notes

### Why `Invalid schema: app_private` happened and how it was fixed

Supabase Edge Functions use the Supabase client library to connect to the database. By default, the client only exposes schemas listed in the Data API allow-list (`public` and `storage`). When function code called `client.schema('app_private').from('exam_access')`, Supabase rejected the call with `Invalid schema: app_private` because custom private schemas are not in the allow-list and cannot be added there without making them publicly accessible — which defeats the purpose of keeping them private.

**Fix:** All access to `app_private` tables is now routed through `SECURITY DEFINER` helper functions in the `public` schema. These functions are:
- `get_exam_access_password_hash(target_exam_id)` — reads `exam_access.password_hash`
- `list_exam_answer_records(target_exam_id)` — reads `answers_library` joined to `questions`
- `create_exam_access_record(target_exam_id, target_password_hash)` — inserts into `exam_access`
- `upsert_answer_record(target_question_id, target_correct_answer, target_explanation)` — upserts into `answers_library`

Each helper has `EXECUTE` granted only to `service_role` and revoked from `public`, so browser clients cannot call them directly even if they somehow know the function name.

### Why the frontend must only use the publishable key, not the secret key

The `service_role` (secret) key bypasses all Row Level Security policies. If it were embedded in the frontend JavaScript bundle, any user who opens browser devtools could extract it and gain unrestricted read/write access to the entire database — including private answers, all student submissions, and admin credentials.

The publishable key is an unprivileged API key that respects RLS. The frontend uses it for:
- `supabase.auth.*` — sign-in and session management (admin login page)
- `supabase.from('exam_catalog')` — public exam list (allowed by anon SELECT policy)
- Calling Edge Function URLs with the key in the `apikey` header — functions internally create a `service_role` client from environment variables, which never leave the server

### Why sensitive logic must go through Edge Functions or helper RPCs

Three categories of operations cannot safely run in the browser:

1. **Access password verification** — The stored password hash must never be returned to the browser. The `start-exam` function receives the plaintext password, computes the hash server-side, compares it against the stored hash via RPC, and only then returns the question list.

2. **Answer evaluation and submission scoring** — Correct answers are stored in `app_private.answers_library`. The `submit-exam` function reads them via `list_exam_answer_records` RPC, evaluates each answer, and writes the scored `submission_items`. The browser never sees the correct answers before or during the exam.

3. **Admin write operations** — Creating, updating, and deleting exams and questions requires both a verified admin session (`app_metadata.role === 'admin'`) and service-role-level writes to `app_private`. The `requireAdminUser` helper verifies the session using the user's JWT, then the function switches to a service-role client for the actual database writes.

## Visual/Browser Findings
- 本轮任务未使用浏览器可视化探索。

---
*Update this file after every 2 view/browser/search operations*
*This prevents visual information from being lost*
