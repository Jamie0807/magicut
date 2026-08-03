# Magicut

Magicut 是一个 AI 驱动的桌面端智能视频剪辑平台，面向短视频创作者、课程内容创作者和需要快速组织音视频素材的个人工作流。
它把文稿、口播配音、本地视频素材和可编辑时间线串成一条自动化创作流程：用户输入文稿或上传口播音频，选择本地素材目录后，由桌面端调度视频创作 agent，生成可继续编辑的视频工程。

这个项目是一个纯 vibe coding 推进的项目：需求、架构、界面和功能都在与 AI 编程助手的持续协作中迭代完成，重点是用真实开发节奏探索 AI Agent 如何参与桌面端智能剪辑产品的构建。

## 项目定位

Magicut 是一款面向短视频创作者的 AI 智能剪辑桌面应用。它通过多节点视频创作 Agent，把文稿输入、本地素材匹配、分镜规划、TTS 配音、字幕生成和时间线工程组织串联起来，帮助用户自动完成从创意输入到可编辑视频工程的初步生成，把更多创意决策留给人，减少重复性的剪辑准备工作。

当前仓库实现的是 Vue 3 + Electron Forge 版本。它的核心方向是让大模型能力适配剪辑 workflow，把创意输入、本地素材、口播配音、字幕和工程时间线接成一条可继续编辑的桌面端工作流。

## 当前进度

已经具备的基础能力：

- pnpm monorepo 工程结构。
- Electron Forge + Vite + Vue 3 桌面端。
- Next.js 服务端目录占位，当前主要开发重心仍在桌面端。
- 视频工程数据结构与校验包 `@magicut/video-project`。
- LangGraph 风格的视频创作 agent 包 `@magicut/video-agent`。
- 桌面端创建页、工作台项目列表、编辑器基础界面。
- 本地素材目录扫描、视频素材匹配、分镜规划、TTS 配音、工程保存的基础链路。
- 独立智能体运行页 `/create/runs/:runId`，用于展示创建过程、分镜确认、阶段进度和完成后的编辑器入口。
- Agent 运行事件支持 `model.stream.*` 流式公开阶段报告，并可把运行会话持久化到视频工程的 `ai.conversation`。
- `magicut-media://` 本地媒体协议，用于在 Electron 中预览项目视频、配音和缩略图素材。
- 编辑器内真实素材预览、播放/暂停、字幕浮层、时间线播放头和分镜高亮。

未完成能力统一记录在这里：

- 视频最终合成与导出能力还不完整。
- 编辑器内部分高级操作仍是界面或基础状态，尚未全部接入真实编辑行为。
- agent 生成结果仍需要更多真实素材、模型和 TTS 场景验证。
- 服务端应用目前保留结构，尚未作为主流程依赖。

## 技术栈

### 工程与包管理

- Monorepo：`pnpm` workspace，工作区包含 `apps/*` 和 `packages/*`。
- 包管理：统一使用 `pnpm`，根目录提供桌面端、服务端、测试、lint、格式检查和提交相关脚本。
- Workspace 配置：`pnpm-workspace.yaml` 使用 hoisted node linker，并为 Electron、esbuild、sharp 等原生依赖声明 allow builds。
- 开发语言：TypeScript 是主要开发语言。

### 桌面端

- 应用位置：`apps/desktop`。
- 桌面运行时：Electron `38.4.0`，负责窗口管理、IPC、本地文件能力和 `magicut-media://` 本地媒体协议。
- 桌面工程：Electron Forge `7.10.2`，负责开发启动、打包、maker 配置和 Vite 插件集成。
- 构建工具：Vite `7.1.12` + `@vitejs/plugin-vue` `6.0.1`，分别支撑 renderer、main、preload 的开发与构建。
- 前端框架：Vue `3.5.22` + Vue Router `4.5.1`。
- 状态管理：当前没有引入 Pinia 或 Vuex，主要使用 Vue 3 Composition API 的 `shallowRef`、`computed`、`watch` 以及少量手写轻量 store。
- 路由方案：Vue Router 4 + `createWebHashHistory()`，适配 Electron 桌面端本地路由。
- 样式方案：Tailwind CSS `4.1.x` + `@tailwindcss/vite`，使用 Tailwind v4 CSS-first 入口和组件内 utility class。
- 测试工具：Vitest，用于桌面端流程、IPC、媒体协议和核心 UI 状态测试。

### 前端状态、路由与样式

- 页面局部状态直接保留在 Vue SFC 中，例如创建页、工作台、编辑器播放状态和配置面板状态。
- 跨页面共享状态目前只在必要处抽成轻量模块 store，例如 `apps/desktop/renderer/stores/agent-run-store.ts` 负责 agent run 事件聚合、确认/取消、运行页状态和会话持久化。
- 当前阶段暂不使用 Pinia；后续如果项目列表缓存、当前项目、agent run、用户配置、编辑器配置等跨页面状态继续扩大，可以再逐步迁移到 Pinia setup store。
- 路由集中定义在 `apps/desktop/renderer/router/index.ts`，当前包含创建页、工作台、运行页和编辑器路由。
- 全局样式入口为 `apps/desktop/renderer/index.css`，通过 `@import 'tailwindcss';` 启用 Tailwind CSS v4，并用 `@layer base` / `@layer utilities` 放置少量全局样式和动画。

### 智能创作与工程数据

- Agent 包：`packages/video-agent`，封装视频创作 agent、模型 provider、TTS provider、素材扫描和流程节点。
- Agent 技术：LangGraph、LangChain OpenAI-compatible provider、Zod、dotenv、ws。
- 工程数据包：`packages/video-project`，定义视频工程 schema、fixture 和校验逻辑。
- 数据校验：使用 Zod 约束 agent 输出和视频工程结构，保证桌面端可消费、可预览、可继续编辑。

### 服务端

- 应用位置：`apps/server`。
- 技术栈：Next.js `15` + React `19`。
- 当前角色：保留服务端工程结构，主流程目前以桌面端为核心，后续可承载账号、素材管理、云端任务或发布能力。

### 质量与协作

- 静态检查：ESLint。
- 格式化：Prettier。
- 单元测试：Vitest。
- 提交规范：commitlint + Commitizen，提交入口为 `pnpm commit`。
- 拼写检查：cspell。
- Agent 协作规范：根目录 `AGENTS.md`。

## 目录结构

```text
.
├── apps
│   ├── desktop          # Electron Forge + Vite + Vue 3 桌面端
│   └── server           # Next.js 服务端结构
├── packages
│   ├── video-agent      # 视频创作 agent、模型/TTS provider、流程节点
│   └── video-project    # 视频工程 schema、fixture、校验
├── .codex/skills        # 当前项目使用的 Codex skills
├── AGENTS.md            # 项目内 Agent 协作约束
├── pnpm-workspace.yaml
└── package.json
```

## 环境要求

### 本地开发

- Node.js：建议使用当前 Electron/Vite/Next 工具链兼容的 LTS 版本。
- pnpm：本项目只使用 pnpm 管理依赖和 workspace，不混用 npm 或 yarn。
- Git：用于版本管理、commitlint hook 和 `pnpm commit` 交互式提交。
- 操作系统：macOS、Windows、Linux 均可用于开发 Electron 应用；当前打包脚本主要覆盖 macOS 与 Windows。
- Electron 二进制：`pnpm start` 前会执行 `apps/desktop/scripts/ensure-electron-installed.mjs` 检查 Electron 安装状态。如果 Electron 安装损坏，请按终端提示重新安装依赖。

### 本地素材

- 创建流程需要选择一个本地素材目录。
- 素材目录应包含 `.mp4`、`.mov`、`.m4v` 或 `.webm` 视频文件。
- Electron 需要当前系统用户具备该目录读取权限。
- 生成后的工程会通过 `magicut-media://` 协议读取项目内视频、缩略图和配音素材。

### 必需的模型与 TTS 配置

完整智能创作流程依赖真实 LLM 和 TTS 服务。首次运行前必须在本地环境文件中配置模型服务信息，否则桌面端可以启动，但 agent 生成配音、分镜规划等真实链路无法跑通。

```bash
LLM_MODEL=your-llm-model
TTS_MODEL=your-tts-model
BASE_URL=https://your-model-provider.example.com/api
API_KEY=your-local-api-key
```

桌面端启动时会按顺序查找根目录下的 `.env.local`、`.env`、`env`。仓库提供 `.env.example` 作为模板，请不要提交真实密钥。

## 安装与启动

安装依赖：

```bash
pnpm i
```

启动桌面端：

```bash
pnpm start
```

等价命令：

```bash
pnpm dev:desktop
```

启动服务端开发模式：

```bash
pnpm dev:server
```

## 常用命令

```bash
# 桌面端开发
pnpm start

# 运行全部测试
pnpm test:run

# 运行全部 lint
pnpm lint

# 检查格式
pnpm exec prettier --check .

# 打包桌面端
pnpm package

# 生成安装产物
pnpm make
```

桌面端单包命令：

```bash
pnpm --filter @magicut/desktop test:run
pnpm --filter @magicut/desktop lint
pnpm --filter @magicut/desktop package:mac
pnpm --filter @magicut/desktop package:win
```

核心包命令：

```bash
pnpm --filter @magicut/video-agent test:run
pnpm --filter @magicut/video-agent typecheck
pnpm --filter @magicut/video-project test:run
pnpm --filter @magicut/video-project typecheck
```

## 基础使用流程

当前桌面端主流程大致如下：

1. 启动桌面端应用。
2. 在创建页输入文稿，或选择口播音频入口。
3. 选择配音音色。
4. 选择本地视频素材目录。
5. 点击创建，等待 agent 扫描素材、规划分镜、匹配素材、生成配音并保存工程。
6. 在工作台打开生成的项目。
7. 在编辑器中预览真实素材、查看分镜字幕和时间线轨道。

如果本地素材目录无法读取，请优先确认：

- 输入的是目录路径，不是单个视频文件路径。
- 目录存在，并且当前系统用户有读取权限。
- 目录内包含 `.mp4`、`.mov`、`.m4v` 或 `.webm` 视频文件。

## Git 与提交约定

本项目使用 commitlint 和 Commitizen。提交前建议先检查提交信息：

```bash
printf 'feat: add something\n' | pnpm exec commitlint
```

正式提交使用：

```bash
pnpm commit
```

提交信息使用 Conventional Commits，例如：

- `feat: add project preview`
- `fix: repair electron install check`
- `docs: update readme`

## 开发约定

- 使用 pnpm，不混用 npm 或 yarn。
- 依赖变更需要同步提交 `pnpm-lock.yaml`。
- 不提交 `node_modules`、本地缓存、真实密钥或临时文件。
- 修改代码后优先运行：

```bash
pnpm -r --if-present run lint
pnpm exec prettier --check .
pnpm -r --if-present run test:run
```

- 不把 `pnpm -r --if-present run format` 当作纯验证命令，因为它会改写文件。

## 当前状态说明

这个仓库现阶段适合验证桌面端核心创作流程和继续迭代 AI 剪辑工作流；尚未完成的能力统一记录在上方 `当前进度` 小节。
