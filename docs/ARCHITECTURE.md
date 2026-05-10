# Architecture

SparkGEO is organized around one product idea: a CentaurLoop is a business cycle where AI advances work until a human gate is required, then continues after the human decision.

## Layers

```text
UI layer
  ChatPanel, cards, onboarding, settings, live memory workspace, publishing page

Protocol layer
  LoopChatController
  Translates user text and button actions into loop actions

Core engine
  loopEngine
  loopPlanner
  loopExecutor
  loopReviewer
  loopNotifier
  loopStore

Adapters
  ai-client
  runtime
  memory
  tool-registry

SparkGEO services
  brandStore
  brandMemory
  firecrawlService
  memoryIngestionService
  articleImageService
  publishedFeedbackService
```

## Loop State Machine

```mermaid
stateDiagram-v2
  [*] --> planning
  planning --> awaiting_plan_review
  awaiting_plan_review --> generating
  generating --> awaiting_review
  awaiting_review --> awaiting_publish
  awaiting_publish --> awaiting_feedback
  awaiting_feedback --> reviewing_auto
  reviewing_auto --> awaiting_memory
  awaiting_memory --> cycle_complete
  reviewing_auto --> cycle_complete
```

## Human Gates

| Gate | Stage | Purpose |
| --- | --- | --- |
| Plan review | `awaiting_plan_review` | Human approves the content plan. |
| Draft review | `awaiting_review` | Human reviews generated drafts. |
| Publishing | `awaiting_publish` | Human publishes through the internal publishing workspace. |
| Feedback | `awaiting_feedback` | Human pastes published links; AI crawls feedback. |
| Memory review | `awaiting_memory` | Human approves lessons before they become memory. |

## Runtime Model

The app can run in two modes:

- **Demo mode**: deterministic local responses for product walkthroughs.
- **Real model mode**: OpenAI-compatible chat completion API through user settings or environment variables.

The runtime adapter is intentionally thin so the model provider can be replaced without changing the loop engine.

## Memory Model

The current case stores memory in browser `localStorage`.

Memory entries now carry lightweight metadata such as `scope`, `sourceTitle`, `sourceCycleId`, and `tags`. That lets the UI distinguish current-cycle lessons, company profile knowledge, and general long-term memory without requiring a backend schema.

Memory sources include:

- Brand profile
- Company-profile web imports
- Uploaded PDF/TXT company documents
- Brand tone and preferences
- Cycle review lessons
- Facts learned from prior performance
- Corrections approved by the human

This is enough for a local case project. A production version should move memory to a durable backend with workspace ownership and retrieval quality controls.

The memory workspace is intentionally visible beside the conversation and is ordered by operational priority:

1. **Current cycle**: live goal, retrieved memories, plan, drafts, feedback signals, review summary, and pending memory candidates.
2. **All memory**: a wiki-style graph that links memory nodes through category, company profile scope, and source metadata.
3. **Company profile**: editable startup profile plus manual notes, website import, and PDF/TXT upload.

## Article Image Assist

The publishing page reads image preferences from workspace settings and generates:

- A cover preview for the selected article
- A reusable image generation prompt
- Model, style, and ratio metadata

The current implementation uses a local deterministic SVG preview. A production adapter can replace `articleImageService` with a real image generation API while keeping the same UI contract.

## Published Link Feedback

Published link feedback has three steps:

1. User pastes the public URL for each published artifact.
2. The local Vite API reads public page text from `/api/published/read`.
3. AI extracts visible metrics or qualitative signals and writes feedback back to the matching task.

This design keeps publishing manual while making feedback collection less tedious than hand-entered metrics.

---

# 架构说明

SparkGEO 围绕一个产品思想组织：CentaurLoop 是一个业务周期，AI 会自动推进工作，直到遇到需要人类决策的卡点；人类处理后，AI 继续推进。

## 分层

```text
UI 层
  ChatPanel、卡片、启动引导、设置、实时记忆工作区、文章发布页

协议层
  LoopChatController
  把用户文字和按钮动作翻译成闭环动作

核心引擎
  loopEngine
  loopPlanner
  loopExecutor
  loopReviewer
  loopNotifier
  loopStore

适配层
  ai-client
  runtime
  memory
  tool-registry

SparkGEO 服务
  brandStore
  brandMemory
  firecrawlService
  memoryIngestionService
  articleImageService
  publishedFeedbackService
```

## 闭环状态机

```mermaid
stateDiagram-v2
  [*] --> planning
  planning --> awaiting_plan_review
  awaiting_plan_review --> generating
  generating --> awaiting_review
  awaiting_review --> awaiting_publish
  awaiting_publish --> awaiting_feedback
  awaiting_feedback --> reviewing_auto
  reviewing_auto --> awaiting_memory
  awaiting_memory --> cycle_complete
  reviewing_auto --> cycle_complete
```

## 人工卡点

| 卡点 | 阶段 | 作用 |
| --- | --- | --- |
| 计划确认 | `awaiting_plan_review` | 人确认内容计划。 |
| 草稿审核 | `awaiting_review` | 人审核 AI 生成的草稿。 |
| 发布 | `awaiting_publish` | 人通过内部发布工作台完成发布。 |
| 反馈 | `awaiting_feedback` | 人粘贴发布链接，AI 抓取反馈。 |
| 记忆确认 | `awaiting_memory` | 人确认经验是否沉淀为长期记忆。 |

## Runtime 模型

应用支持两种模式：

- **Demo 模式**：用于产品演示的确定性本地响应。
- **真实模型模式**：通过用户设置或环境变量接入 OpenAI-compatible chat completion API。

Runtime adapter 故意保持轻量，使模型服务可以替换，而不影响闭环引擎。

## 记忆模型

当前案例使用浏览器 `localStorage` 存储记忆。

记忆条目现在带有轻量元数据，例如 `scope`、`sourceTitle`、`sourceCycleId` 和 `tags`。这样 UI 可以区分本轮复盘记忆、企业档案资料和普通长期记忆，而不需要马上引入后端 schema。

记忆来源包括：

- 品牌档案
- 企业档案网页导入
- 上传的 PDF/TXT 企业资料
- 品牌调性和偏好
- 每轮复盘经验
- 历史表现事实
- 人类确认过的纠正

这足够支撑本地案例项目。生产版本应迁移到具备工作区归属和检索质量控制的持久化后端。

记忆工作区会常驻在对话右侧，并按真实使用优先级组织：

1. **本轮**：实时展示目标、调用过的历史记忆、计划、草稿、反馈信号、复盘摘要和待确认记忆。
2. **全部**：用类似 wiki 的关系图，把记忆节点按分类、企业档案作用域和来源元数据连接起来。
3. **企业档案**：维护启动时输入的档案，并提供手动补充、官网抓取、PDF/TXT 上传。

## 文章配图辅助

发布页会读取工作台图片偏好，并生成：

- 当前文章的封面预览
- 可复用的图片生成提示词
- 模型、风格和比例元数据

当前实现使用本地确定性 SVG 预览。生产适配器可以把 `articleImageService` 替换为真实图片生成 API，同时保持 UI 契约不变。

## 发布链接反馈

发布链接反馈分三步：

1. 用户为每个已发布内容粘贴公开 URL。
2. 本地 Vite API 通过 `/api/published/read` 读取公开页面文本。
3. AI 提取公开指标或定性信号，并写回对应任务。

这个设计保留人工发布边界，同时避免让用户繁琐地手填指标。
