# Security Policy

## Supported Versions

This repository is an early public case project. Security fixes are currently applied to the latest `main` branch.

## Reporting a Vulnerability

Please do not disclose security-sensitive findings in public issues.

If you find a vulnerability, report it privately to the repository owner through GitHub. Include:

- A concise description
- Reproduction steps
- Potential impact
- Suggested mitigation, if available

## Security Notes

- Do not commit `.env`, `.env.local`, API keys, model provider tokens, Firecrawl keys, or platform credentials.
- The current Vite API routes are designed for local development and case demonstration.
- Before production deployment, move `/api/model`, `/api/firecrawl/scrape`, and `/api/published/read` to a hardened backend with authentication, rate limits, request validation, and workspace isolation.

---

# 安全策略

## 支持版本

当前仓库是早期公开案例项目。安全修复会应用到最新 `main` 分支。

## 报告漏洞

请不要在公开 Issue 中披露安全敏感问题。

如果发现漏洞，请通过 GitHub 私下联系仓库维护者，并包含：

- 简洁描述
- 复现步骤
- 潜在影响
- 可选的修复建议

## 安全说明

- 不要提交 `.env`、`.env.local`、API Key、模型服务 Token、Firecrawl Key 或平台账号凭据。
- 当前 Vite API 路由用于本地开发和案例演示。
- 生产部署前，应将 `/api/model`、`/api/firecrawl/scrape`、`/api/published/read` 迁移到具备鉴权、限流、请求校验和工作区隔离的后端。
