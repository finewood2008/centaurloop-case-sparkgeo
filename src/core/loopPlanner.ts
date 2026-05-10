/**
 * Centaur Loop Engine — 循环规划器
 */

import { getClientAsync, extractModelText } from '../adapters/ai-client';
import { findTool } from '../adapters/tool-registry';
import type {
  CentaurLoopConfig,
  LoopCyclePlan,
  LoopPlanContext,
  LoopPlanResult,
  LoopTask,
} from './types';

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

  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      const parsed = JSON.parse(braceMatch[0]);
      if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
    } catch { /* fall through */ }
  }

  return null;
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

function wantsEnglish(context: LoopPlanContext): boolean {
  return /English/i.test(context.outputLanguage ?? '');
}

function buildPlanPrompt(
  config: CentaurLoopConfig,
  goal: string,
  context: LoopPlanContext,
): string {
  const availableApps: string[] = [];
  for (const phase of config.aiWorkPhases) {
    for (const toolId of phase.appToolIds) {
      const tool = findTool(toolId);
      if (tool) {
        const fields = tool.inputSchema
          .map((f) => `  - ${f.id}（${f.label}${f.required ? '，必填' : ''}）`)
          .join('\n');
        availableApps.push(
          `工具 toolId="${tool.id}" 名称="${tool.name}"\n输入字段：\n${fields}`,
        );
      }
    }
  }

  return [
    context.outputLanguage ? `Output language instruction: ${context.outputLanguage}` : '',
    'Return JSON only. Do not wrap it in markdown.',
    `你是 Centaur Loop Engine 的「${config.name}」闭环规划器。`,
    `闭环定义：${config.description}`,
    `周期：${config.cyclePeriod === 'daily' ? '每天' : config.cyclePeriod === 'weekly' ? '每周' : '每两周'}`,
    '',
    '可调用的 AI 应用：',
    availableApps.length > 0 ? availableApps.join('\n\n') : '（用 prompt 直接生成）',
    '',
    `老板目标：${goal}`,
    context.ownerContext ? `老板偏好：\n${context.ownerContext}` : '',
    context.businessContext ? `企业资料摘要：\n${context.businessContext}` : '',
    context.memories.length > 0 ? `已有记忆：\n${context.memories.join('\n')}` : '',
    context.previousSuggestion ? `上轮复盘建议：${context.previousSuggestion}` : '',
    '',
    '请输出 JSON：',
    '{ "summary": "...", "platforms": [...], "keywords": [...], "tasks": [{ "appToolId": "...", "appName": "...", "artifactType": "...", "inputParams": {...} }] }',
  ].filter(Boolean).join('\n');
}

const VALID_ARTIFACT_TYPES = new Set([
  'article', 'social_post',
  'seo_article', 'geo_content', 'content_plan', 'review_report',
  'video_strategy', 'video_script', 'video_generation_brief',
  'mixed_video_package', 'publish_package',
]);

function normalizeTasks(rawTasks: unknown[], configId: string): LoopTask[] {
  const now = Date.now();
  return rawTasks.map((raw, index) => {
    const t = raw as Record<string, unknown>;
    const appToolId = String(t.appToolId ?? '');
    const appName = String(t.appName ?? appToolId);
    const artifactType = VALID_ARTIFACT_TYPES.has(String(t.artifactType ?? ''))
      ? (String(t.artifactType) as LoopTask['artifactType'])
      : 'article';

    const rawParams = (t.inputParams && typeof t.inputParams === 'object')
      ? t.inputParams as Record<string, unknown>
      : {};
    const inputParams: Record<string, string> = {};
    const tool = findTool(appToolId);
    if (tool) {
      const validKeys = new Set(tool.inputSchema.map((f) => f.id));
      for (const [key, value] of Object.entries(rawParams)) {
        if (validKeys.has(key)) inputParams[key] = String(value ?? '');
      }
    } else {
      for (const [key, value] of Object.entries(rawParams)) {
        inputParams[key] = String(value ?? '');
      }
    }

    return {
      id: `${configId}-task-${index}-${now.toString(36)}`,
      cycleId: '',
      appToolId,
      appName,
      artifactType,
      status: 'pending' as const,
      inputParams,
    };
  });
}

function buildFallbackPlan(
  config: CentaurLoopConfig,
  goal: string,
  context: LoopPlanContext,
): LoopPlanResult {
  const english = wantsEnglish(context);
  const rawTasks = english ? [
    {
      appToolId: 'xiaohongshu-note',
      appName: 'Xiaohongshu Note',
      artifactType: 'social_post',
      inputParams: { topic: goal, style: 'practical and concise', keywords: 'AI, content growth, workflow' },
    },
    {
      appToolId: 'wechat-article',
      appName: 'WeChat Article',
      artifactType: 'article',
      inputParams: { topic: goal, keywords: 'AI content growth', tone: 'professional and practical', wordCount: '1200' },
    },
    {
      appToolId: 'moments-post',
      appName: 'Moments Post',
      artifactType: 'social_post',
      inputParams: { topic: goal, occasion: 'weekly update' },
    },
  ] : [
    {
      appToolId: 'xiaohongshu-note',
      appName: '小红书笔记',
      artifactType: 'social_post',
      inputParams: { topic: goal, style: '实战干货', keywords: 'AI,内容增长,工作流' },
    },
    {
      appToolId: 'wechat-article',
      appName: '公众号文章',
      artifactType: 'article',
      inputParams: { topic: goal, keywords: 'AI内容增长', tone: '专业实用', wordCount: '1200' },
    },
    {
      appToolId: 'moments-post',
      appName: '朋友圈文案',
      artifactType: 'social_post',
      inputParams: { topic: goal, occasion: '本周内容发布' },
    },
  ];

  const platforms = english ? ['Xiaohongshu', 'WeChat', 'Moments'] : ['小红书', '公众号', '朋友圈'];
  const keywords = english ? ['AI content growth', 'human-in-the-loop', 'workflow'] : ['AI内容增长', '人机协同', '闭环工作流'];
  const summary = english
    ? `Create a three-platform content loop around: ${goal}. Start with a short social hook, then a deeper article, then a concise distribution post.`
    : `围绕「${goal}」先做一轮三平台内容闭环：小红书负责吸引注意，公众号承接深度解释，朋友圈做轻量扩散。`;

  return {
    plan: {
      summary,
      taskCount: rawTasks.length,
      platforms,
      keywords,
    },
    tasks: normalizeTasks(rawTasks, config.id),
  };
}

export async function planLoop(
  config: CentaurLoopConfig,
  goal: string,
  context: LoopPlanContext,
): Promise<LoopPlanResult> {
  const client = await getClientAsync();
  const prompt = buildPlanPrompt(config, goal, context);

  let raw: unknown;
  try {
    raw = await withTimeout(client.models.invoke({ prompt }), 10_000);
  } catch {
    return buildFallbackPlan(config, goal, context);
  }

  const text = extractModelText(raw);
  if (!text) return buildFallbackPlan(config, goal, context);

  const parsed = extractJsonObject(text);
  if (!parsed) return buildFallbackPlan(config, goal, context);

  const summary = String(parsed.summary ?? goal);
  const platforms = Array.isArray(parsed.platforms) ? (parsed.platforms as unknown[]).map(String) : [];
  const keywords = Array.isArray(parsed.keywords) ? (parsed.keywords as unknown[]).map(String) : undefined;
  const rawTasks = Array.isArray(parsed.tasks) ? (parsed.tasks as unknown[]) : [];
  const tasks = normalizeTasks(rawTasks, config.id);
  if (tasks.length === 0) return buildFallbackPlan(config, goal, context);

  const plan: LoopCyclePlan = { summary, taskCount: tasks.length, platforms, keywords };
  return { plan, tasks };
}
