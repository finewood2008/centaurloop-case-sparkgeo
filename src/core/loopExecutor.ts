/**
 * Centaur Loop Engine — 任务执行器
 */

import { getClientAsync, extractModelText } from '../adapters/ai-client';
import { findTool } from '../adapters/tool-registry';
import type { LoopExecuteContext, LoopTask, LoopTaskDraft } from './types';

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('模型响应超时')), timeoutMs);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
  } catch { /* fall through */ }

  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
    } catch { /* fall through */ }
  }

  return null;
}

function extractTitle(text: string, appName: string): string {
  const firstLine = text.split('\n').find((l) => l.trim().length > 0);
  if (firstLine) {
    const cleaned = firstLine.replace(/^#+\s*/, '').replace(/^\*+\s*/, '').trim();
    if (cleaned.length > 0 && cleaned.length < 80) return cleaned;
  }
  return `${appName} · 草稿`;
}

function normalizeModelContent(text: string, appName: string): {
  title: string;
  content: string;
  fields?: Record<string, string | string[] | undefined>;
} {
  const parsed = extractJsonObject(text);
  if (!parsed) {
    return { title: extractTitle(text, appName), content: text };
  }

  const title = String(parsed.title ?? parsed.summary ?? `${appName} · 草稿`).trim();
  const body = String(parsed.body ?? parsed.content ?? parsed.answer ?? '').trim();
  const cta = String(parsed.cta ?? '').trim();
  const tags = Array.isArray(parsed.tags) ? (parsed.tags as unknown[]).map(String) : [];
  const metaDescription = String(parsed.metaDescription ?? '').trim();
  const h2Headings = Array.isArray(parsed.h2Headings) ? (parsed.h2Headings as unknown[]).map(String) : [];

  const sections = [
    title ? `# ${title}` : '',
    metaDescription ? `> ${metaDescription}` : '',
    body,
    h2Headings.length > 0 ? ['## 内容结构', ...h2Headings.map((item) => `- ${item}`)].join('\n') : '',
    cta ? `## 下一步\n${cta}` : '',
    tags.length > 0 ? tags.map((tag) => tag.startsWith('#') ? tag : `#${tag}`).join(' ') : '',
  ].filter(Boolean);

  return {
    title,
    content: sections.join('\n\n'),
    fields: {
      tags,
      cta,
      coverPrompt: typeof parsed.coverPrompt === 'string' ? parsed.coverPrompt : undefined,
      metaDescription,
    },
  };
}

function formatInputs(tool: { inputSchema: { id: string; label: string }[] }, input: Record<string, string>): string {
  return tool.inputSchema
    .map((field) => {
      const value = input[field.id]?.trim();
      return `${field.label}：${value || '未填写'}`;
    })
    .join('\n');
}

function fallbackDraft(task: LoopTask, context: LoopExecuteContext): LoopTaskDraft {
  const topic = Object.values(task.inputParams).find((value) => value.trim()) ?? task.appName;
  const english = /English/i.test(context.outputLanguage ?? '');

  const content = english ? [
    `# ${topic}`,
    '',
    '## Why This Matters',
    `This piece is built for ${task.appName}. It explains the core idea in a practical way and keeps the reader close to the business outcome.`,
    '',
    '## Key Points',
    '- Start from the audience pain point.',
    '- Show how the workflow removes repeated manual effort.',
    '- Make the human approval step clear so the content feels credible.',
    '- End with a simple next action.',
    '',
    '## Suggested CTA',
    'Save this for your next content planning session, or use it as the starting point for a deeper article.',
  ].join('\n') : [
    `# ${topic}`,
    '',
    '## 为什么这个话题值得发',
    `这篇内容面向「${task.appName}」发布，先把用户真正关心的问题讲清楚，再把 SparkGEO 的人机协同闭环自然带出来。`,
    '',
    '## 核心表达',
    '- 从目标用户的具体痛点切入，不直接堆概念。',
    '- 强调 AI 负责推进，人负责判断和确认。',
    '- 说明发布、反馈、复盘和记忆如何形成下一轮增长。',
    '- 结尾给一个轻量行动建议，方便用户继续沟通或转化。',
    '',
    '## 互动引导',
    '如果你也想把内容生产从一次性生成变成可复盘的增长闭环，可以先从本周的一组内容开始跑。',
  ].join('\n');

  return {
    title: String(topic).replace(/^#+\s*/, '').slice(0, 80) || `${task.appName} · 草稿`,
    content,
    preview: truncate(content, 200),
    fields: {
      cta: english
        ? 'Use this as the starting point for a deeper content loop.'
        : '从本周的一组内容开始跑闭环。',
      coverPrompt: english
        ? `A clean editorial cover for ${topic}, showing human-in-the-loop AI content workflow`
        : `${topic} 的内容封面，体现人机协同、内容增长闭环、清晰专业`,
    },
    generatedAt: new Date().toISOString(),
  };
}

export async function executeTask(
  task: LoopTask,
  context: LoopExecuteContext,
): Promise<LoopTaskDraft> {
  const tool = findTool(task.appToolId);

  const client = await getClientAsync();

  const prompt = [
    context.outputLanguage ? `Output language instruction: ${context.outputLanguage}` : '',
    '你是 Centaur Loop Engine 的内容生成引擎。',
    `应用名称：${task.appName}`,
    tool ? `应用说明：${tool.description}` : '',
    context.ownerContext ? `老板偏好：\n${context.ownerContext}` : '',
    context.businessContext ? `企业资料摘要：\n${context.businessContext}` : '',
    context.memories.length > 0 ? `已有记忆：\n${context.memories.join('\n')}` : '',
    tool ? `用户输入：\n${formatInputs(tool, task.inputParams)}` : `用户输入：\n${JSON.stringify(task.inputParams)}`,
    tool ? `工具字段参考：${tool.outputInstruction}` : '',
    '最终请直接输出可发布的 Markdown 正文，不要只返回裸 JSON。',
    '正文需要有清晰标题、分段、小标题或列表；适合发布页直接展示和复制。',
  ].filter(Boolean).join('\n\n');

  let raw: unknown;
  try {
    raw = await withTimeout(client.models.invoke({ prompt }), 12_000);
  } catch {
    return fallbackDraft(task, context);
  }

  const text = extractModelText(raw);
  if (!text) return fallbackDraft(task, context);

  const { title, content, fields } = normalizeModelContent(text, task.appName);

  return {
    title,
    content,
    preview: truncate(content, 200),
    fields,
    generatedAt: new Date().toISOString(),
  };
}
