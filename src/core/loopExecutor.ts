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
    raw = await client.models.invoke({ prompt });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`内容生成失败：${message}`);
  }

  const text = extractModelText(raw);
  if (!text) throw new Error('模型未返回文本');

  const { title, content, fields } = normalizeModelContent(text, task.appName);

  return {
    title,
    content,
    preview: truncate(content, 200),
    fields,
    generatedAt: new Date().toISOString(),
  };
}
