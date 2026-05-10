# Upgrade Notes

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
