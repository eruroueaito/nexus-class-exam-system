# Task Plan: Online Exam System Planning Docs

## Goal
为基于 GitHub Pages + Supabase 的在线考试/作业系统整理一份可直接执行的本地开发技术文档，并同步维护项目级规划记录文件。

## Current Phase
Phase 5

## Phases

### Phase 1: Requirements & Discovery
- [x] 理解用户目标与业务边界
- [x] 识别原始方案中的安全与数据建模冲突
- [x] 记录关键发现到 findings.md
- **Status:** complete

### Phase 2: Planning & Structure
- [x] 完成技术栈对比与推荐方案
- [x] 明确数据库、RLS、Edge Function、前端模块边界
- [x] 确定本地文档结构
- **Status:** complete

### Phase 3: Documentation
- [x] 创建主技术文档
- [x] 补充实施阶段、测试策略、验收标准
- [x] 给出可执行的目录与文件规划
- [x] 保存用户提供的前端原型并登记为视觉基准
- **Status:** complete

### Phase 4: Verification
- [x] 运行脚手架与测试验证命令
- [x] 校对数据库基础文件、原型和主文档的一致性
- [x] 记录实现阶段遇到的问题
- [x] 完成学生端真实考试流第一版并通过前端回归
- [x] 完成本地 Supabase 联调基础：seed、环境模板和共享逻辑测试
- [x] 完成管理员登录与后台壳层第一版
- [x] 完成管理员 analytics 第一版
- **Status:** in_progress

### Phase 5: Delivery
- [x] 写入最终生产联调收尾计划
- [x] 完成修复版 Edge Functions 远端重发与烟测
- [x] 完成 GitHub Pages 与 Supabase 线上联调验证
- [x] 回填卡点、经验和最终状态到本地文档
- [ ] 持久化本轮项目记忆
- **Status:** complete

## Key Questions
1. 如何在 GitHub Pages 前端前提下，保证题目与答案不直接暴露给学生？
2. 原始 4 张表是否足够支撑错题解析展示与后台题目错误率统计？
3. 管理端批量导题与 AI 同步入口应该放在 RPC、Edge Function 还是前端直接写库？

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| 推荐使用 `Vite + React + TypeScript + Tailwind + Supabase + Edge Functions` | 满足 GitHub Pages 静态托管约束，同时保留足够灵活的后端能力 |
| 学生流量一律经由 Edge Functions 获取题目与提交答案 | 若直接开放 `questions`/`answers` 查询，会破坏访问码与答案隔离 |
| 在原始 4 表之外增加 `submission_items` 支撑错题率统计 | 仅靠 `submissions` 总分无法计算单题错误率或持久化解析快照 |
| 将试卷访问码从 `exams` 主表拆到私有访问表或至少以 hash 私存 | 避免公开试卷列表时泄露访问码 |
| 随机打乱题目采用 Fisher-Yates 而非 `array.sort(() => Math.random() - 0.5)` | 后者分布有偏且可预期性更差，不适合考试场景 |
| 开发阶段的代码注释和界面显示文本统一使用 English | 遵循用户最新要求，避免中英文混杂 |
| 权限层单独放在第二个 migration 中实现 | 让 schema 与 access control 分离，便于回滚、审查和后续调试 |
| 前端先补 router/providers/lib/api 基础设施，再接真实业务逻辑 | 先稳定入口和数据调用边界，后续页面拆分和 API 接线更顺畅 |
| 前端目录页在缺少 Supabase env 时降级到 prototype catalog | 保持本地原型可用，同时为真实线上数据接线留出稳定入口 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| 读取 planning-with-files 模板时使用了错误路径 | 1 | 改为使用 `/Users/Zhuanz/.agents/skills/...` 下的实际模板路径 |

## Notes
- 当前处于实现阶段，优先完成数据库 foundation slice。
- 本轮代码注释、SQL 注释和界面实际显示文本统一使用 English。
- 数据库基础 migration 与 seed placeholder 已落盘，下一步是 RLS migration。
- 当前这一小段实现只做权限层，不混入 Edge Function 业务逻辑。
- `is_admin()`、`exam_catalog` 和基础 RLS/policies 已落盘，下一步切到 Edge Function skeleton。
- 当前这一轮会先补 app/lib/api 基础设施，再落 `start_exam` / `submit_exam` 的 skeleton。
- router/providers、exam API client 和 function skeleton 已落盘，下一步可开始填真实 catalog/start/submit 逻辑。
- `start-exam` 已接入真实 exam/question/access 查询，`submit-exam` 已接入真实 answer 读取与 submission 持久化骨架。
- 当前实施 slice 已切换到真实学生考试流，目标是完成 access form、question rendering、answer state、submit flow 和 result view。
- 这一轮先按 TDD 锁定单条 happy path，再做最小实现，不提前扩展管理员模块。
- 学生端第一版真实考试流已落盘并通过测试，下一段实现应转向本地 Supabase 联调、管理员统计页数据接线和题型细化。
- 下一阶段计划已收敛为“本地联调基础设施”：
- 1. 为 `startExam` / `submitExam` 增加共享逻辑测试。
- 2. 为本地数据库补可直接复用的 seed 数据。
- 3. 为前端补本地 Supabase 环境模板，方便切换真实联调。
- 上述本地联调基础已落盘并验证通过，下一阶段应切到真实 analytics/read model 与管理员后台接线。
- 下一实施切片调整为 Task 9 的前置最小版本：先实现管理员登录与后台壳层，再进入 analytics，避免未鉴权先做统计接口的边界错位。
- Task 9 的前置最小版本已落盘并通过测试，下一阶段应进入管理员 analytics/read model 与图表组件接线。
- 当前 analytics 切片的范围限定为：
- 1. 统计数据 read model
- 2. 趋势图和错题热点表
- 3. `AdminDashboardPage` 接线
- 不在这一轮扩展试卷编辑器、AI 导题或数据库 schema 变更。
- analytics 第一版已落盘并通过测试，下一阶段应进入试卷编辑器、analytics 优化和 admin route 级代码拆分。
- 下一实施切片限定为 Task 10 的基础版：
- 1. `examAdminApi` 读取试卷与题目快照
- 2. `ExamEditorPage` 路由与页面骨架
- 3. `QuestionEditor` 第一版表单壳层
- 4. 从 dashboard 进入 exam editor
- 暂不在这一轮实现完整写回、删除联动或 AI 导题。
- 试卷编辑器基础壳层已完成，当前切片改为“安全写回最小闭环”：
- 1. 为 admin editor 增加受限保存接口
- 2. 只保存 `exam title` 与 `question stem`
- 3. 保持 `answers_library` 继续留在服务端私有边界
- 4. 下一阶段再扩展答案编辑、AI 导题与 admin route 代码拆分
- 当前切片已推进为“完整题目编辑最小闭环”：
- 1. 受限读取完整 exam draft
- 2. 读取 `answers_library` 中的正确答案与解析
- 3. 在编辑器里按题型编辑正确答案
- 4. 通过受限 Edge Function 保存题干、答案与解析
- 5. 下一阶段进入试卷新增/删除、AI 导题与 admin route 代码拆分
- 题目编辑闭环已继续扩展为“题目 CRUD 最小闭环”：
- 1. 本地新增 radio / checkbox / text 题目草稿
- 2. 本地删除题目草稿
- 3. 通过受限保存接口同步新增题目与答案记录
- 4. 通过受限保存接口删除缺失题目并依赖级联清理答案
- 5. 下一阶段进入题目选项可编辑、试卷级新增/删除、AI 导题与 admin route 代码拆分
- 题目编辑闭环已进一步扩展为“题目内容维护最小闭环”：
- 1. 编辑单选/多选题的选项文本
- 2. 为单选/多选题新增选项
- 3. 为单选/多选题删除选项
- 4. 删除选项时同步清理失效的正确答案选择
- 5. 下一阶段进入试卷级新增/删除、AI 导题与 admin route 代码拆分
- 当前切片已推进为“试卷级 create/delete 最小闭环”：
- 1. dashboard 增加受限 `Create New Exam`
- 2. editor 增加受限 `Delete Exam`
- 3. 新增 `create-exam-draft` / `delete-exam-draft` Edge Functions
- 4. 服务端统一处理试卷草稿创建、默认访问记录和级联删除
- 5. 下一阶段进入试卷列表、AI 导题与 admin route 代码拆分
- 当前切片已推进为“部署前收尾闭环”：
- 1. dashboard 增加真实试卷列表
- 2. 对照最初开发文档标记已完成项与未完成项
- 3. 新增 GitHub Pages workflow 与 `vite.config.ts` base 配置
- 4. 初始化 git、创建 GitHub 仓库并完成 Pages 部署
- 5. 生成真实英文博弈论试题 JSON 作为联调测试数据
- 6. 下一阶段进入 AI 导题、打印导出与 admin route 代码拆分
- 当前最终收尾切片限定为生产联调闭环：
- 1. 用 helper RPC 替代 Edge Function 中对 `app_private` 的直接访问
- 2. 将修复版函数全量重发到远端 Supabase
- 3. 对学生开始考试、提交考试和管理员读取试卷做真实烟测
- 4. 将通过验证的前端代码推送到 GitHub Pages
- 5. 把生产卡点、修复路径、key 使用边界和经验总结写回本地文档
- 当前问题修复切片已进一步细化为：
- 1. 学生端试卷列表必须渲染全部 active exams，而不是只取第一个 active exam
- 2. `Assignment Access` modal 改为更不透明的独立浮层
- 3. 学生名改为可选，后端空值统一回落到 `Guest Student`
- 4. admin 滚动条轨道完全弱化，只保留更细的 thumb
- 5. editor 增加 `Publish / Unpublish`，明确用 `is_active` 控制前台是否可见
- 当前补丁轮的收尾范围已确认：
- 1. editor 增加返回 dashboard 的明确入口
- 2. admin 滚动条只保留内层滚动，并通过遮罩压回玻璃面板层级内
- 3. submit 失败时保持在 quiz 视图，不再复用 access modal 错误通道
- 4. 学生结果页升级为更接近 admin console 的详细回顾视图
- 文档中会显式标记对原始需求的必要修正点，避免后续实现时返工。
