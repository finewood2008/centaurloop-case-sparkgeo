import { extractModelText, getClientAsync } from '../adapters/ai-client';
import { storeAgentMemory, type MemoryCategory } from '../adapters/memory';
import { crawlWebsite } from './firecrawlService';
import { readPublishedUrl } from './publishedFeedbackService';

export interface MemoryDraft {
  content: string;
  category: MemoryCategory;
}

function extractJsonArray(text: string): unknown[] | null {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { memories?: unknown[] }).memories)) {
      return (parsed as { memories: unknown[] }).memories;
    }
  } catch { /* fall through */ }

  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { memories?: unknown[] }).memories)) {
        return (parsed as { memories: unknown[] }).memories;
      }
    } catch { /* fall through */ }
  }

  return null;
}

function normalizeCategory(value: unknown): MemoryCategory {
  if (value === 'preference' || value === 'fact' || value === 'lesson' || value === 'correction') return value;
  return 'fact';
}

function fallbackMemory(text: string, sourceTitle: string): MemoryDraft[] {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (!compact) return [];
  return [{
    category: 'fact',
    content: `${sourceTitle}：${compact.slice(0, 280)}`,
  }];
}

export async function extractMemoryDrafts(params: {
  sourceTitle: string;
  sourceType: 'website' | 'document';
  text: string;
}): Promise<MemoryDraft[]> {
  const text = params.text.trim();
  if (!text) return [];

  const prompt = [
    '你是 Spark GEO 记忆提取器。',
    '请从资料中提取 3-8 条对后续内容规划和生成有帮助的长期记忆。',
    '只保留稳定事实、品牌偏好、受众画像、产品差异化、内容禁忌、转化目标或明确纠正。',
    '不要提取临时噪音，不要编造资料中没有的信息。',
    '',
    `资料来源：${params.sourceTitle}`,
    `资料类型：${params.sourceType}`,
    '',
    text.slice(0, 9000),
    '',
    '只输出 JSON：',
    '{ "memories": [{ "content": "...", "category": "fact|preference|lesson|correction" }] }',
  ].join('\n');

  try {
    const client = await getClientAsync();
    const raw = await client.models.invoke({ prompt });
    const responseText = extractModelText(raw);
    const parsed = extractJsonArray(responseText);
    if (!parsed) return fallbackMemory(text, params.sourceTitle);
    return parsed.map((item) => {
      const record = item as Record<string, unknown>;
      return {
        content: String(record.content ?? '').trim(),
        category: normalizeCategory(record.category),
      };
    }).filter((item) => item.content);
  } catch {
    return fallbackMemory(text, params.sourceTitle);
  }
}

export async function storeMemoryDrafts(drafts: MemoryDraft[]): Promise<number> {
  let count = 0;
  for (const draft of drafts) {
    const result = await storeAgentMemory('spark', draft.content, draft.category);
    if (result.ok) count += 1;
  }
  return count;
}

export async function importWebsiteMemories(url: string): Promise<number> {
  const firecrawlKey = localStorage.getItem('spark_geo_firecrawl_key') ?? '';
  let title = url;
  let text = '';

  if (firecrawlKey.trim()) {
    const result = await crawlWebsite(url, firecrawlKey.trim());
    if (!result.success) throw new Error(result.error ?? '网页抓取失败');
    title = result.title ?? url;
    text = result.content;
  } else {
    const result = await readPublishedUrl(url);
    title = result.title ?? url;
    text = result.text;
  }

  const drafts = await extractMemoryDrafts({ sourceTitle: title, sourceType: 'website', text });
  return storeMemoryDrafts(drafts);
}

function extractTextFromPdfLikeBytes(bytes: ArrayBuffer): string {
  const raw = new TextDecoder('latin1').decode(bytes);
  const literalStrings = Array.from(raw.matchAll(/\(([^()]{2,500})\)/g))
    .map((match) => match[1])
    .join(' ');
  const readableRuns = Array.from(raw.matchAll(/[A-Za-z0-9\u4e00-\u9fff][A-Za-z0-9\u4e00-\u9fff\s,.;:!?()[\]'"%#@/&+-]{20,}/g))
    .map((match) => match[0])
    .join(' ');
  return `${literalStrings} ${readableRuns}`
    .replace(/\\[rn]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function importDocumentMemories(file: File): Promise<number> {
  const isText = file.type.startsWith('text/') || /\.(md|txt)$/i.test(file.name);
  const text = isText
    ? await file.text()
    : extractTextFromPdfLikeBytes(await file.arrayBuffer());

  if (!text.trim()) {
    throw new Error('没有从文档中读取到可用文本。扫描版 PDF 需要后续接入 OCR。');
  }

  const drafts = await extractMemoryDrafts({
    sourceTitle: file.name,
    sourceType: 'document',
    text,
  });
  return storeMemoryDrafts(drafts);
}
