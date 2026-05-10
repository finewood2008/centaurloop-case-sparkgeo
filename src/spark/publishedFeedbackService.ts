import { extractModelText, getClientAsync } from '../adapters/ai-client';

export interface PublishedFeedbackAnalysis {
  publishedUrl: string;
  platform?: string;
  title?: string;
  summary: string;
  views?: number;
  likes?: number;
  favorites?: number;
  comments?: number;
  shares?: number;
  completionRate?: number;
  rating?: 'good' | 'ok' | 'bad';
  signals: string[];
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

  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      const parsed = JSON.parse(braceMatch[0]);
      if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
    } catch { /* fall through */ }
  }

  return null;
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizeRating(value: unknown): 'good' | 'ok' | 'bad' | undefined {
  return value === 'good' || value === 'ok' || value === 'bad' ? value : undefined;
}

export async function readPublishedUrl(url: string): Promise<{ title?: string; text: string }> {
  const response = await fetch('/api/published/read', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ url }),
  });
  const payload = await response.json().catch(() => null) as {
    title?: string;
    text?: string;
    error?: string;
  } | null;

  if (!response.ok || !payload?.text) {
    throw new Error(payload?.error ?? `抓取失败 (${response.status})`);
  }

  return { title: payload.title, text: payload.text };
}

export async function analyzePublishedUrl(params: {
  url: string;
  appName: string;
  draftTitle?: string;
  draftContent?: string;
}): Promise<PublishedFeedbackAnalysis> {
  const page = await readPublishedUrl(params.url);
  const client = await getClientAsync();
  const prompt = [
    '你是 Spark GEO 的已发布文章链接反馈分析器。',
    '任务：根据用户贴入的已发布文章链接页面内容，提取可见的表现数据和内容反馈。',
    '如果页面没有公开展示阅读/点赞/评论等数据，就不要编造数字；可以基于内容完整度、标题清晰度、互动引导给出 rating 和 signals。',
    '',
    `发布平台/任务：${params.appName}`,
    `发布链接：${params.url}`,
    params.draftTitle ? `原始草稿标题：${params.draftTitle}` : '',
    params.draftContent ? `原始草稿摘要：${params.draftContent.slice(0, 1200)}` : '',
    '',
    `抓取标题：${page.title ?? '无'}`,
    '抓取正文：',
    page.text.slice(0, 8000),
    '',
    '只输出 JSON：',
    '{ "platform": "...", "title": "...", "summary": "...", "views": null, "likes": null, "favorites": null, "comments": null, "shares": null, "completionRate": null, "rating": "good|ok|bad", "signals": ["...", "..."] }',
  ].filter(Boolean).join('\n');

  const raw = await client.models.invoke({ prompt });
  const text = extractModelText(raw);
  const parsed = extractJsonObject(text);

  if (!parsed) {
    return {
      publishedUrl: params.url,
      title: page.title,
      summary: text || '已抓取链接，但模型没有返回结构化反馈。',
      rating: 'ok',
      signals: [],
    };
  }

  return {
    publishedUrl: params.url,
    platform: String(parsed.platform ?? params.appName),
    title: String(parsed.title ?? page.title ?? ''),
    summary: String(parsed.summary ?? '已完成链接反馈分析'),
    views: numberOrUndefined(parsed.views),
    likes: numberOrUndefined(parsed.likes),
    favorites: numberOrUndefined(parsed.favorites),
    comments: numberOrUndefined(parsed.comments),
    shares: numberOrUndefined(parsed.shares),
    completionRate: numberOrUndefined(parsed.completionRate),
    rating: normalizeRating(parsed.rating) ?? 'ok',
    signals: Array.isArray(parsed.signals) ? (parsed.signals as unknown[]).map(String) : [],
  };
}
