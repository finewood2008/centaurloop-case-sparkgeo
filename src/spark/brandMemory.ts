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
      scope: 'profile' as const,
      sourceTitle: '企业档案',
      tags: ['企业档案', brand.industry, brand.targetAudience].filter(Boolean),
    },
    {
      id: 'tone',
      category: 'preference' as const,
      content: brand.toneKeywords.length > 0
        ? `品牌调性偏好：${brand.toneKeywords.join('、')}`
        : '',
      scope: 'profile' as const,
      sourceTitle: '企业档案',
      tags: ['品牌调性', ...brand.toneKeywords],
    },
    {
      id: 'differentiators',
      category: 'fact' as const,
      content: brand.differentiators.length > 0
        ? `核心差异化：${brand.differentiators.join('；')}`
        : '',
      scope: 'profile' as const,
      sourceTitle: '企业档案',
      tags: ['核心差异化'],
    },
    {
      id: 'business-context',
      category: 'fact' as const,
      content: brand.businessContext ? `业务与内容需求：${brand.businessContext}` : '',
      scope: 'profile' as const,
      sourceTitle: '企业档案',
      tags: ['业务资料', '内容需求'],
    },
    {
      id: 'website-extract',
      category: 'fact' as const,
      content: brand.websiteExtract ? `官网摘要：${brand.websiteExtract}` : '',
      scope: 'profile' as const,
      sourceTitle: brand.websiteUrl || '官网资料',
      tags: ['官网资料'],
    },
  ];

  await syncAgentMemories('spark', BRAND_MEMORY_PREFIX, entries);
}
