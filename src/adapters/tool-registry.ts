/**
 * Spark GEO Tool Registry
 */

export type AIToolInputType = 'text' | 'textarea' | 'select';

export interface AIToolInputField {
  id: string;
  label: string;
  type: AIToolInputType;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}

export interface AIToolDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  inputSchema: AIToolInputField[];
  outputInstruction: string;
}

export type AIToolInputValues = Record<string, string>;

export const TOOL_CATALOG: AIToolDefinition[] = [
  {
    id: 'xiaohongshu-note',
    name: '小红书笔记',
    description: '生成适合小红书的种草/干货笔记',
    icon: '📕',
    inputSchema: [
      { id: 'topic', label: '主题', type: 'text', required: true },
      { id: 'style', label: '风格', type: 'text', placeholder: '种草/干货/测评/故事' },
      { id: 'keywords', label: '关键词', type: 'text' },
    ],
    outputInstruction: '输出 JSON：{ "title": "...", "body": "...(含emoji和换行)", "tags": [...], "cta": "...", "coverPrompt": "..." }',
  },
  {
    id: 'wechat-article',
    name: '公众号文章',
    description: '生成深度公众号文章',
    icon: '📝',
    inputSchema: [
      { id: 'topic', label: '主题', type: 'text', required: true },
      { id: 'keywords', label: 'SEO关键词', type: 'text' },
      { id: 'tone', label: '语气', type: 'text', placeholder: '专业/轻松/故事化' },
      { id: 'wordCount', label: '目标字数', type: 'text', placeholder: '1500' },
    ],
    outputInstruction: '输出 JSON：{ "title": "...", "body": "...(markdown)", "summary": "...", "cta": "..." }',
  },
  {
    id: 'moments-post',
    name: '朋友圈文案',
    description: '生成适合朋友圈的短文案',
    icon: '💬',
    inputSchema: [
      { id: 'topic', label: '主题', type: 'text', required: true },
      { id: 'occasion', label: '场景', type: 'text', placeholder: '日常/活动/节日/产品' },
    ],
    outputInstruction: '输出 JSON：{ "body": "...(200字以内，适合朋友圈)", "coverPrompt": "..." }',
  },
  {
    id: 'douyin-caption',
    name: '抖音文案',
    description: '生成抖音视频文案和标签',
    icon: '🎵',
    inputSchema: [
      { id: 'topic', label: '视频主题', type: 'text', required: true },
      { id: 'hook', label: '开头钩子', type: 'text' },
    ],
    outputInstruction: '输出 JSON：{ "title": "...", "body": "...", "tags": [...], "hook": "..." }',
  },
  {
    id: 'seo-article',
    name: 'SEO/GEO 文章',
    description: '生成搜索引擎和AI引擎优化的长文',
    icon: '🔍',
    inputSchema: [
      { id: 'keyword', label: '目标关键词', type: 'text', required: true },
      { id: 'outline', label: '大纲', type: 'textarea' },
      { id: 'targetEngine', label: '目标引擎', type: 'text', placeholder: '百度/Google/Perplexity/ChatGPT' },
    ],
    outputInstruction: '输出 JSON：{ "title": "...", "body": "...(markdown, 2000字以上)", "metaDescription": "...", "h2Headings": [...] }',
  },
  {
    id: 'zhihu-answer',
    name: '知乎回答',
    description: '生成知乎风格的深度回答',
    icon: '💡',
    inputSchema: [
      { id: 'question', label: '问题', type: 'text', required: true },
      { id: 'angle', label: '回答角度', type: 'text' },
    ],
    outputInstruction: '输出 JSON：{ "body": "...(知乎风格，有论据有案例)", "summary": "..." }',
  },
];

export function findTool(toolId: string): AIToolDefinition | undefined {
  return TOOL_CATALOG.find((t) => t.id === toolId);
}
