# Contributing to CentaurLoop Case: SparkGEO

Thank you for your interest in contributing.

## Scope

SparkGEO is a case project for the CentaurLoop pattern. Contributions should keep the project focused on:

- Human-in-the-loop AI workflows
- Content planning, drafting, publishing, feedback, review, and memory
- Clean local demo experience
- Replaceable runtime and adapter boundaries
- Clear documentation for product and engineering readers

## Development Setup

```bash
npm install
npm run dev
```

Before opening a pull request, run:

```bash
npm run typecheck
npm run build
```

## Pull Request Guidelines

- Keep changes focused and explain the product reason.
- Update documentation when behavior changes.
- Avoid committing local environment files, generated build output, or secrets.
- Keep the demo runtime deterministic enough for repeatable walkthroughs.
- For new integrations, keep adapter boundaries explicit.

## Issue Guidelines

When reporting a bug, include:

- Expected behavior
- Actual behavior
- Steps to reproduce
- Browser and runtime configuration
- Any relevant console or terminal output

Feature requests should describe the workflow being improved and where it fits in the loop.

---

# 贡献指南

感谢你对 SparkGEO 的兴趣。

## 项目边界

SparkGEO 是 CentaurLoop 模式的案例项目。贡献内容应聚焦：

- 人机协同 AI 工作流
- 内容规划、生成、发布、反馈、复盘、记忆
- 清晰稳定的本地演示体验
- 可替换的 runtime 和 adapter 边界
- 面向产品和工程读者的文档

## 本地开发

```bash
npm install
npm run dev
```

提交 Pull Request 前请运行：

```bash
npm run typecheck
npm run build
```

## Pull Request 要求

- 保持改动聚焦，并说明产品原因。
- 行为变化时同步更新文档。
- 不提交本地环境文件、构建产物或密钥。
- 保持 demo runtime 可重复演示。
- 新增集成时保持 adapter 边界清晰。

## Issue 要求

报告 bug 时请包含：

- 预期行为
- 实际行为
- 复现步骤
- 浏览器和 runtime 配置
- 相关 console 或 terminal 输出

功能建议请说明它改善的是闭环中的哪一个工作流。
