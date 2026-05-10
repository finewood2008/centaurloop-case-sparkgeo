import { getClientAsync, extractModelText } from '../adapters/ai-client';

interface CrawlResult {
  success: boolean;
  content: string;
  title?: string;
  error?: string;
}

export interface BrandExtract {
  brandName: string;
  industry: string;
  targetAudience: string;
  toneKeywords: string[];
  differentiators: string[];
  businessSummary: string;
}

export async function crawlWebsite(url: string, firecrawlKey: string): Promise<CrawlResult> {
  try {
    const response = await fetch('/api/firecrawl/scrape', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url, firecrawlKey }),
    });

    const result = await response.json() as {
      success?: boolean;
      data?: { markdown?: string; metadata?: { title?: string } };
      error?: string;
    };

    if (!response.ok || !result.success) {
      return { success: false, content: '', error: result.error ?? `抓取失败 (${response.status})` };
    }

    return {
      success: true,
      content: result.data?.markdown ?? '',
      title: result.data?.metadata?.title,
    };
  } catch (error) {
    return { success: false, content: '', error: error instanceof Error ? error.message : '网络错误' };
  }
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

export async function extractBrandFromContent(
  content: string,
  url: string,
): Promise<BrandExtract> {
  const truncated = content.slice(0, 8000);

  const prompt = [
    '你是品牌分析专家。请根据以下网页内容提炼品牌信息。',
    `网页 URL：${url}`,
    '',
    '网页内容：',
    truncated,
    '',
    '请输出 JSON（不要用 markdown 包裹）：',
    '{ "brandName": "...", "industry": "...", "targetAudience": "...", "toneKeywords": ["...", "..."], "differentiators": ["...", "..."], "businessSummary": "200字以内的业务摘要" }',
  ].join('\n');

  const client = await getClientAsync();
  const raw = await client.models.invoke({ prompt });
  const text = extractModelText(raw);
  const parsed = extractJsonObject(text);

  if (!parsed) {
    return {
      brandName: '',
      industry: '',
      targetAudience: '',
      toneKeywords: [],
      differentiators: [],
      businessSummary: text.slice(0, 500),
    };
  }

  return {
    brandName: String(parsed.brandName ?? ''),
    industry: String(parsed.industry ?? ''),
    targetAudience: String(parsed.targetAudience ?? ''),
    toneKeywords: Array.isArray(parsed.toneKeywords) ? (parsed.toneKeywords as unknown[]).map(String) : [],
    differentiators: Array.isArray(parsed.differentiators) ? (parsed.differentiators as unknown[]).map(String) : [],
    businessSummary: String(parsed.businessSummary ?? ''),
  };
}
