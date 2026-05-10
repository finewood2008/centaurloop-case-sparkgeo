# Upgrade Notes

## 2026-05-11 — Runtime Settings Consolidation

- Moved runtime selection from the floating bottom-right control into **Settings -> Model and Integrations**.
- Added runtime foundation cards for built-in experience, environment-configured OpenAI-compatible models, Ollama, LM Studio, and custom OpenAI-compatible models.
- Added a custom model flow where users can save API key, base URL, and model name, then use that configuration as the active runtime foundation.
- Removed the floating runtime dropdown from the main workspace.
- Replaced user-facing demo wording with built-in experience/runtime wording.

## 2026-05-11 — Image Engine Setting

- Added an image generation engine selector under **Settings -> Model and Integrations**.
- Moved image model naming into the same model/integration area so image provider and model are configured together.
- Kept image style, aspect ratio, and prompt preference controls under **Settings -> Image Generation**.
- Article image prompts and publishing-page metadata now include both engine and model.

## 2026-05-11 — Memory Workspace Redesign

This upgrade reshapes the right-side memory workspace around how an operator actually uses SparkGEO during a loop.

### What Changed

- The memory panel now opens on **Current Cycle** first, so the user sees the live memory state of the active conversation before anything else.
- Current-cycle memory updates as the loop progresses: goal, retrieved history, plan, drafts, feedback signals, review summary, and pending memory candidates are shown as a live stream.
- **All Memory** now includes a wiki-style relationship graph that connects company profile, memory categories, imported knowledge, and cycle lessons.
- **Company Profile** moved to the third tab and became the only place for company-profile enrichment.
- Company profile enrichment now supports manual notes, website crawling or reading, and PDF/TXT upload from inside the profile tab.
- Memory records now carry lightweight metadata: `scope`, `sourceTitle`, `sourceCycleId`, and `tags`.

### Product Impact

- Users can watch memory change while they talk to SparkGEO, instead of opening a drawer or searching through a flat list.
- The memory model now separates short-term cycle context from long-term knowledge and stable company profile facts.
- Imported websites and documents are framed as company-profile enrichment, not generic memory ingestion.
- The graph view gives users a first version of a knowledge-base/wiki mental model after multiple loops.

### Developer Notes

- `src/ui/MemoryPanel.tsx` owns the new tab order and graph presentation.
- `src/adapters/memory.ts` remains localStorage-based, but supports optional metadata for future backend migration.
- `src/spark/memoryIngestionService.ts` now exposes result-returning import helpers so the UI can update both memory and company profile.
- `src/core/loopEngine.ts` marks confirmed review memories with cycle metadata.

---

# 升级说明

## 2026-05-11 — 运行时设置整合

- 把右下角悬浮运行时选择整合进 **设置 -> 模型与集成**。
- 增加运行时底座卡片：内置体验、环境变量 OpenAI-compatible、Ollama、LM Studio、自定义 OpenAI-compatible。
- 增加自定义模型流程，用户可以保存 API Key、Base URL 和模型名称，并直接把它设为当前运行时底座。
- 移除主界面右下角的运行时下拉入口。
- 用户界面不再显示 demo 字样，统一改为内置体验/运行时表述。

## 2026-05-11 — 图片引擎设置

- 在 **设置 -> 模型与集成** 中增加图片生成引擎选择。
- 图片模型名称也放到同一个模型/集成区域，让图片供应商和模型一起配置。
- 图片风格、比例和提示词偏好继续保留在 **设置 -> 图片生成**。
- 文章配图提示词和发布页元数据现在会同时显示引擎和模型。

## 2026-05-11 — 记忆工作区重构

这次升级把右侧记忆工作区调整成更符合 SparkGEO 实际操作流程的结构。

### 改了什么

- 记忆面板默认先展示 **本轮**，用户能最先看到当前对话和当前循环产生的记忆变化。
- 本轮记忆会随着闭环推进动态变化：目标、调用过的历史记忆、计划、草稿、反馈信号、复盘摘要和待确认记忆都会实时出现。
- **全部** 记忆增加了类似 wiki 的关系图，把企业档案、记忆分类、导入资料和循环经验连接起来。
- **企业档案** 调整到第三个标签页，并成为补充企业资料的唯一入口。
- 企业档案支持手动补充、官网/资料页抓取、PDF/TXT 上传。
- 记忆记录增加轻量元数据：`scope`、`sourceTitle`、`sourceCycleId`、`tags`。

### 产品影响

- 用户可以边沟通边看到记忆变化，不需要打开抽屉或翻平铺列表。
- 记忆模型开始区分本轮上下文、长期知识和稳定企业档案。
- 网页和文档导入被明确定位为企业档案补充，而不是泛化的资料入口。
- 多轮沟通以后，全部记忆页可以形成知识库/wiki 的早期形态。

### 开发说明

- `src/ui/MemoryPanel.tsx` 负责新的标签顺序和图形化表达。
- `src/adapters/memory.ts` 仍使用 localStorage，但已经支持未来后端迁移所需的可选元数据。
- `src/spark/memoryIngestionService.ts` 增加返回导入结果的 helper，方便 UI 同时更新记忆和企业档案。
- `src/core/loopEngine.ts` 会给已确认的复盘记忆写入循环来源元数据。
