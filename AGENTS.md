# AGENTS.md

## 优先级

- 本文件是当前项目的高优先级协作约束。
- 若用户明确指令与本文件冲突，以用户最新明确指令为准。
- 不要在未获明确要求时自动提交、推送、创建 PR 或修改 Git 历史。

## Git 与提交

- 每次编码完成后不要自动执行 `git commit`。
- 只有当用户明确要求“提交代码”时，才允许提交。
- 提交必须使用当前项目的 commitlint 约束：
    - 优先使用 `pnpm commit`。
    - 提交前先用 `printf '<commit message>\n' | pnpm exec commitlint` 校验提交信息。
    - 提交信息使用 Conventional Commits，例如 `feat: ...`、`fix: ...`、`chore: ...`。
- 不要提交 `node_modules`、本地缓存、临时文件或未确认的生成物。
- 不要执行 `git reset --hard`、`git checkout --`、强制推送等破坏性操作，除非用户明确要求并确认。

## 需求拆解与 Superpowers

- 每个需求都尽量先使用 Superpowers 工作流进行拆解、规划和验证。
- 开始任务前先检查并使用适用 skill，尤其是：
    - `using-superpowers`
    - `brainstorming`
    - `writing-plans`
    - `test-driven-development`
    - `systematic-debugging`
    - `verification-before-completion`
    - `requesting-code-review`
- 对 Vue、Vite、Vitest、pnpm、Electron Forge、Tailwind、可访问性等任务，优先使用项目内 `.codex/skills/` 中对应 skills。
- 复杂需求应拆成可验证任务；存在 2 个以上可并行的独立任务时，优先使用子智能体执行和复核。
- 如果当前环境没有可用子智能体能力，则以内联方式执行，但保留任务拆解、验证和复核步骤。

## 编码与验证

- 编码前先理解现有结构，遵循当前项目模式，不做无关重构。
- 新功能或 bugfix 应优先采用 TDD：先写能失败的测试或检查，再实现。
- 编码后的自动化验证必须使用当前项目工具：
    - ESLint：`pnpm -r --if-present run lint`
    - Prettier：`pnpm exec prettier --check .`
    - 测试：优先运行相关包的 `test:run`，必要时运行 `pnpm -r --if-present run test:run`
    - Commitlint：提交前校验提交信息
- 不要用 `pnpm -r --if-present run format` 作为纯验证命令，因为它会改写文件；只有在明确需要格式化时才运行。
- 如果验证失败，先定位根因，不要盲目修复。

## 项目约定

- 当前项目是 `pnpm` monorepo。
- 桌面端位于 `apps/desktop`，使用 Electron Forge + Vite + Vue 3。
- 服务端位于 `apps/server`，保留 Next.js 结构。
- 包管理使用 `pnpm`，不要混用 `npm install`、`yarn` 或其他包管理器。
- 依赖变更必须更新并提交 `pnpm-lock.yaml`。
- 需要联网安装依赖或访问外部资源时，先说明原因并按权限流程请求授权。

## 工作区安全

- 修改前检查 `git status --short`，识别用户已有改动。
- 不要覆盖、回滚或删除非本次任务产生的用户改动。
- 只编辑当前需求相关文件。
- 对生成目录、缓存和临时文件保持谨慎，提交前确认暂存区内容。
