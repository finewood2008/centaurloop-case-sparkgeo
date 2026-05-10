import { syncAgentMemories } from '../adapters/memory';
import type { BrandProfile } from './brandStore';

const BRAND_MEMORY_PREFIX = 'brand:';

export async function syncBrandProfileToMemory(brand: BrandProfile): Promise<void> {
  const entries = [
    {
      id: 'profile',
      category: 'fact' as const,
      content: [
        `品牌档案：${brand.brandName || '未命名品牌'}`,
        brand.industry ? `行业：${brand.industry}` : '',
        brand.targetAudience ? `目标受众：${brand.targetAudience}` : '',
      ].filter(Boolean).join('；'),
    },
    {
      id: 'tone',
      category: 'preference' as const,
      content: brand.toneKeywords.length > 0
        ? `品牌调性偏好：${brand.toneKeywords.join('、')}`
        : '',
    },
    {
      id: 'differentiators',
      category: 'fact' as const,
      content: brand.differentiators.length > 0
        ? `核心差异化：${brand.differentiators.join('；')}`
        : '',
    },
    {
      id: 'business-context',
      category: 'fact' as const,
      content: brand.businessContext ? `业务与内容需求：${brand.businessContext}` : '',
    },
    {
      id: 'website-extract',
      category: 'fact' as const,
      content: brand.websiteExtract ? `官网摘要：${brand.websiteExtract}` : '',
    },
  ];

  await syncAgentMemories('spark', BRAND_MEMORY_PREFIX, entries);
}
