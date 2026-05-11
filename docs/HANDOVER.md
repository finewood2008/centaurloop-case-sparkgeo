# SparkGEO Agent Handover

Last updated: 2026-05-11

Current release: `v0.2.0`

Repository: `finewood2008/centaurloop-case-sparkgeo`

This document is the fastest entry point for another engineer or agent taking over SparkGEO development.

## Current Product State

SparkGEO is the first public CentaurLoop case project. It is a local React/Vite prototype that demonstrates a complete content-growth loop:

1. User gives a weekly content goal.
2. AI plans a multi-platform content mix.
3. Human approves the plan.
4. AI generates formatted Markdown drafts.
5. Human reviews drafts.
6. Generated drafts enter the article publishing page.
7. Human manually publishes on external platforms.
8. User pastes published article URLs.
9. AI reads public pages and extracts feedback signals.
10. AI reviews the cycle and proposes memories.
11. Human approves memories for future loops.

The project is suitable for local demos and product exploration. It is not yet a production SaaS.

## Runbook

Use these commands from the repo root:

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5191
npm run typecheck
npm run build
```

The local app is usually tested at:

```text
http://127.0.0.1:5191/
```

GitHub Actions currently runs typecheck and build on `main`.

## Architecture Map

- `src/core/`: reusable CentaurLoop state machine, planner, executor, reviewer, notifier, and store.
- `src/core/loopConfigs/sparkGeoLoop.ts`: SparkGEO-specific loop gates and configuration.
- `src/protocol/loopChat.ts`: maps engine state and user actions into conversational UI messages.
- `src/ui/`: product surfaces, including chat, settings, memory panel, onboarding, content cards, and article publisher.
- `src/spark/`: SparkGEO services for brand memory, Firecrawl/web ingestion, article images, workspace settings, and published-link feedback.
- `src/adapters/`: replaceable runtime, AI client, memory, and tool-registry adapters.
- `vite.config.ts`: local API routes for model calls, runtime scan/connect, Firecrawl scrape, and published page reading.

## Settings Contract

Settings are split by user intent:

- **Workflow Preferences**: platforms, UI/output language, writing style, depth, CTA, emoji level.
- **Model and Integrations**: text runtime foundation selection and Firecrawl integration.
- **BYOK**: two independent credential groups.
- **Image Generation**: image style, ratio, and prompt preferences only.

Do not merge text and image credentials. They are intentionally independent.

### Text Runtime / BYOK Text

Text BYOK can become the active runtime foundation. It is read by `src/adapters/runtime.ts`.

Local storage keys:

```text
spark_geo_runtime_id
spark_geo_api_key
spark_geo_base_url
spark_geo_model
```

Runtime behavior:

- `local-demo` is always available as the built-in experience runtime.
- `user-settings` represents BYOK text runtime.
- `readUserModelConfig()` only returns BYOK text config when `spark_geo_runtime_id === "user-settings"`.
- If a real runtime fails, `ai-client` falls back to built-in generation so the loop does not freeze.

### Image BYOK

Image BYOK is only for article image assist. It must not affect the text runtime.

Local storage keys and workspace fields:

```text
spark_geo_image_api_key
spark_geo_image_base_url
workspaceSettings.imageEngine
workspaceSettings.imageModel
workspaceSettings.imageStyle
workspaceSettings.imageRatio
workspaceSettings.imagePromptHint
```

Current implementation:

- `articleImageService` generates a deterministic SVG cover preview and a reusable image prompt.
- It includes image engine/model/style/ratio metadata.
- It does not call a real image API yet.

Next image work should add a real image-generation adapter that reads `spark_geo_image_api_key` and `spark_geo_image_base_url`, then falls back to the current deterministic preview if unavailable.

## Memory Contract

Memory is currently localStorage-based through `src/adapters/memory.ts`.

UI organization in `MemoryPanel`:

1. **Current Cycle** first: live operational memory for the active loop.
2. **All Memory** second: wiki-style long-term memory graph.
3. **Company Profile** third: stable company profile, manual notes, website import, and PDF/TXT upload.

Company-profile enrichment belongs in the Company Profile tab, not first-run onboarding.

## Publishing and Feedback Contract

Publishing stays manual for this case:

- Generated drafts go to `ArticlePublisher`.
- User reviews formatting, copies content, and marks items as published.
- The app then asks for published URLs.
- `publishedFeedbackService` and the local Vite API read public pages and extract feedback.

Do not add full automatic publishing unless the product direction changes.

## Validation Checklist

Before handing work back, run:

```bash
npm run typecheck
npm run build
```

For UI changes, also verify in the browser:

- Settings opens as a floating modal and is not covered at the top.
- The four Settings tabs exist: Workflow Preferences, Model and Integrations, BYOK, Image Generation.
- Model and Integrations has runtime cards and Firecrawl only.
- BYOK has separate text and image credential cards.
- Image Generation has only style, ratio, and prompt preference controls.
- The content loop can reach the publishing page.
- Article image assist still shows selected image engine/model metadata.
- Console has no runtime errors.

## Known Boundaries

- No deployable backend yet; Vite local API routes are the adapter layer.
- No authentication, workspace isolation, or durable server-side memory.
- No real automatic third-party publishing.
- No real image API call yet; article image generation is a deterministic preview plus prompt.
- Published-link feedback depends on public page readability and is not platform-metric complete.
- API keys are stored in browser localStorage for local prototype convenience; production needs secure storage.

## Recommended Next Work

1. Add a real image-generation adapter behind the existing image BYOK fields.
2. Move runtime, memory, cycles, and feedback persistence to a backend.
3. Add a small settings test harness or component tests for the runtime/BYOK split.
4. Improve published-link feedback extraction for platform-specific public pages.
5. Add versioned sample flows or fixtures so future agents can quickly validate the full CentaurLoop path.

---

# 中文交接摘要

SparkGEO 当前是 `v0.2.0` 的 CentaurLoop 案例原型，已经稳定了内容规划、人工审核、文章发布页、发布链接反馈、实时记忆板和设置模型。

最重要的产品边界：

- `模型与集成` 只管文本运行时和 Firecrawl。
- `BYOK` 里有两套独立凭据：文本生成和图片生成。
- 图片 Key 不复用文本 Key。
- `图片生成` 只管风格、比例和提示词偏好。
- 发布仍然是人工步骤，反馈通过用户粘贴发布链接后抓取。
- 记忆板固定在对话右侧，顺序是本轮、全部、企业档案。

接手后优先看：

- `src/ui/SettingsPanel.tsx`
- `src/adapters/runtime.ts`
- `src/spark/articleImageService.ts`
- `src/ui/MemoryPanel.tsx`
- `src/protocol/loopChat.ts`
- `vite.config.ts`

每次交付前至少运行：

```bash
npm run typecheck
npm run build
```
