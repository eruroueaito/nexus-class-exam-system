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
| 后台页面内容增长后不能依赖全局页面滚动 | 当前全局 `body` 仍为 `overflow: hidden`，后台壳层必须自己提供 `overflow-y: auto` 才能稳定显示滚动条 |
| `Question Heat` 与 `Score Trend` 并排时，长题干会把题目分析区压得太窄 | 对管理后台来说，题目热点比横向对称更重要，改成纵向堆叠并让 `Question Heat` 全宽更稳定 |
| 学生端访问表单作为页面内嵌块时，视觉层级不够清晰 | 把 `Assignment Access` 提升为带遮罩的独立 modal，能更明确地区分“选试卷”和“输入凭证”两个步骤 |
| 当前项目如果要重置 analytics 展示，最直接的方法是清空 `submissions` 与 `submission_items` | 统计全部来自这两张表，清空后前台和后台都会立即回到“无历史答题数据”的状态 |
| 为了让本地 fallback、seed 数据和线上行为一致，新增试卷时需要同时改三层 | 至少要同步 `supabase/seed.sql`、前端 fallback catalog，以及远端 Supabase 数据 |
| 前台“只看到一张试卷”并不是线上 catalog 缺数据 | 根因是 `NexusShellPage` 只取了第一张 active exam 和第一张 inactive exam，而不是渲染完整列表 |
| 密码 `123` 在线上对第二张宏观经济学试卷已经生效 | 真实 `start-exam` 调用已成功返回 5 道题；用户感知异常主要来自前端列表逻辑和姓名必填校验 |

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
| 学生结果页虽然给了滚动条样式，但若没有把结果内容包进 `flex: 1 / min-height: 0 / overflow: hidden` 的内层壳层，浏览器仍可能不出现实际滚动条 | 结果页新增 `result-body` 和 `result-scroll-shell`，把滚动责任收回到内部列表容器 |
| `Question Heat` 只有错题率和错误学生名字时，管理员无法看出学生到底选了哪个选项 | `submission_items.user_answer` 进入 analytics read model，展开区显示原题、错误学生答案和选项分布 |
| 管理员写操作在失败时静默回落为本地“成功”结果，会造成前端显示已保存但后台其实没写入 | `saveExamEditorData`、`createExamDraft`、`deleteExamDraft` 改为在 Edge Function 出错时直接抛错 |
| 匿名学生统一回落成 `Guest Student` 后，analytics 会把多个匿名提交误合并成同一个人 | 后台 analytics 对匿名学生改用 `submission_id` 建唯一身份，并显示 `Guest Student • xxxx` |
| 管理员密码设置不能直接读写 `app_private.exam_access`，否则会重现生产环境的私有 schema 访问问题 | 新增 `public.upsert_exam_access_password_hash(...)` 的 `SECURITY DEFINER` helper RPC，由 `save-exam-draft` 间接调用 |

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

## Current UI / Product Findings
- 前台“只显示一个考试”不是远端数据缺失，而是 `NexusShellPage` 只渲染了第一个 active exam 和第一个 inactive exam。远端 `exam_catalog` 实际已返回 3 个 active exams。
- 密码 `123` 在线上 `start-exam` 已验证可用；用户看到“密码不对”更可能是前端当时仍强制要求 `user_name`，或仍停留在旧 Pages 缓存版本。
- 原有 `Assignment Access` 浮层之所以看起来“粘在背景上”，根因是 overlay 仍然半透明并叠加 blur；将 overlay 改为近乎不透明后，modal 层级感明显更清晰。
- admin 后台此前缺少显式发布语义，导致“后台可见”和“前台可见”的边界只能依赖隐式 `is_active` 数据状态。新增 `Publish / Unpublish` 后，这个边界才真正闭环。
- 远端 `start-exam` 已通过生产烟测验证：当请求体中省略 `user_name` 时，当前生产函数会回退为 `Guest Student`，说明匿名姓名策略已经真正生效，而不仅是本地代码已改。
- “提交后又回到 Assignment Access 并显示 500” 的直接根因是前端错误处理：`handleSubmitExam` 在 catch 分支里把错误写进 `accessError`，再把视图切回 `exam-list`，于是学生会看到 access modal 和一条与提交失败无关的验证错误。远端 `submit-exam` 本身对宏观经济学试卷已验证可用。
- admin 视觉上的滚动条违和感，根因不是 thumb 颜色，而是外层 `admin-route-shell` 和内层 `admin-layout` 都可能参与滚动，导致滚动条贴在最外层背景边缘。将滚动责任收回到 `admin-layout` 后，遮罩层才能正确把滚动条压到玻璃面板之下。
- 图四里微观试卷再次返回 `403` 的原因不是缓存或前端，而是线上 `app_private.exam_access` 对该试卷的密码哈希确实还没同步成 `123`。这个远端数据现已修正，`start-exam` 对三张卷都应接受 `123`。
- 学生首页里“Student Access” 单独入口块会制造空白层级和视觉噪音。将首页直接收敛为试卷列表后，入口逻辑和视觉结构都更稳定，且不再需要额外的返回层级。
- 管理员图表更适合展示分布而不是按日期趋势线。当前数据量较小时，折线趋势容易误导；成绩分布柱状图更符合“考试系统后台”这一语境。
- `Question Heat` 中如果只展示 `A/B/C` 这类选项 ID，管理员仍然无法快速理解错误答案含义。当前 read model 已额外拼接对应选项文本，例如 `A · Money already spent`。
- 本轮代码审查后，未再发现新的阻塞级前后端联动 bug；当前剩余主要是 bundle 过大导致的 chunk size warning，属于性能优化项，不影响正确性。
- 学生结果页“没有解析”的 P0 根因已确认不是后端。线上 `submit-exam` 对 `Game Theory - Midterm Assessment` 真实返回了 `12` 条 `items`，且每条都包含 `explanation`。问题出在前端结果页的嵌套 flex + 内层滚动壳层：结果列表被限制在不可见区域，但外层结果页本身又没有承担滚动责任，因此用户只能看到顶部摘要卡片。
- 本次 P0 修复策略是反向简化布局：让 `view-section--result` 自己负责滚动，撤掉结果列表自身的独立滚动与高度竞争。对于长试卷结果页，这种“单滚动容器”比“外层固定 + 内层 flex 滚动壳”更稳健，尤其在 GitHub Pages 线上真实视口里不容易出现内容被吃掉但本地测试仍通过的假象。
- 密码模块的正确安全模型不是“读写当前密码”，而是“显示是否已配置 + 输入新密码轮换”。当前系统只保存 hash，因此管理员界面不应也无法安全回显当前明文密码。
- 代码审查后保留一个非阻塞风险：`getExamEditorData()` 在函数调用失败时仍会回退到本地 fallback snapshot，这对开发演示友好，但对严格生产诊断不够透明。若后续继续收尾，优先把它改成“仅在缺少环境变量时 fallback，远端错误则显式报错”。
- 仓库根 `README.md` 虽然已经描述了关键目录，但多个高价值目录缺少目录级 `README.md`，导致新 AI 只能依靠文件名猜测用途，尤其是 `supabase/migrations/`、`supabase/functions/` 和 `web/tests/` 这类需要明确边界与规则的目录。
- 这类“目录存在但缺说明”的问题不会立即破坏运行，但会显著降低二次迁移、代码审查和 agent handoff 的效率；最合适的修复方式不是扩写根 README，而是给每个关键目录增加就地说明文件。

---
*Update this file after every 2 view/browser/search operations*
*This prevents visual information from being lost*
