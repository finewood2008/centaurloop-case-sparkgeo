import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OutputLanguage = 'zh-CN' | 'en' | 'auto';

export interface WorkspaceSettings {
  enabledPlatforms: string[];
  outputLanguage: OutputLanguage;
  writingStyle: string;
  contentDepth: string;
  ctaStyle: string;
  emojiLevel: string;
  imageEngine: string;
  imageModel: string;
  imageStyle: string;
  imageRatio: string;
  imagePromptHint: string;
}

interface WorkspaceSettingsState {
  settings: WorkspaceSettings;
  updateSettings: (updates: Partial<WorkspaceSettings>) => void;
  togglePlatform: (platform: string) => void;
}

export const PLATFORM_OPTIONS = [
  '小红书',
  '公众号',
  '朋友圈',
  '抖音',
  '知乎',
  'SEO/GEO 文章',
];

export const WRITING_STYLE_OPTIONS = [
  '专业可信',
  '实战干货',
  '故事化',
  '轻松亲和',
  '高端克制',
  '强观点',
];

export const CONTENT_DEPTH_OPTIONS = [
  '短平快',
  '标准深度',
  '深度长文',
];

export const CTA_STYLE_OPTIONS = [
  '自然关注',
  '预约咨询',
  '下载资料',
  '私信转化',
  '品牌认知',
];

export const EMOJI_LEVEL_OPTIONS = [
  '少量',
  '适中',
  '丰富',
];

export const IMAGE_STYLE_OPTIONS = [
  '现代科技',
  '杂志封面',
  '极简商务',
  '温暖手绘',
  '数据可视化',
  '赛博霓虹',
];

export const IMAGE_ENGINE_OPTIONS = [
  'OpenAI Images',
  'Flux / Black Forest Labs',
  'Stable Diffusion',
  'Midjourney',
  'Ideogram',
  'Replicate',
  '自定义 OpenAI-compatible',
];

export const IMAGE_RATIO_OPTIONS = [
  '4:3',
  '1:1',
  '16:9',
  '3:4',
];

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  enabledPlatforms: ['小红书', '公众号', '朋友圈'],
  outputLanguage: 'zh-CN',
  writingStyle: '实战干货',
  contentDepth: '标准深度',
  ctaStyle: '自然关注',
  emojiLevel: '适中',
  imageEngine: 'OpenAI Images',
  imageModel: 'gpt-image-2',
  imageStyle: '现代科技',
  imageRatio: '4:3',
  imagePromptHint: '',
};

export const useWorkspaceSettingsStore = create<WorkspaceSettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_WORKSPACE_SETTINGS,
      updateSettings: (updates) => {
        set((state) => ({ settings: { ...state.settings, ...updates } }));
      },
      togglePlatform: (platform) => {
        set((state) => {
          const exists = state.settings.enabledPlatforms.includes(platform);
          const enabledPlatforms = exists
            ? state.settings.enabledPlatforms.filter((item) => item !== platform)
            : [...state.settings.enabledPlatforms, platform];
          return {
            settings: {
              ...state.settings,
              enabledPlatforms: enabledPlatforms.length > 0 ? enabledPlatforms : [platform],
            },
          };
        });
      },
    }),
    {
      name: 'spark_geo_workspace_settings',
      merge: (persisted, current) => {
        const state = persisted as Partial<WorkspaceSettingsState> | undefined;
        return {
          ...current,
          ...state,
          settings: {
            ...DEFAULT_WORKSPACE_SETTINGS,
            ...current.settings,
            ...state?.settings,
          },
        };
      },
    },
  ),
);

export function formatWorkspacePreferences(settings: WorkspaceSettings): string {
  return [
    `优先发布平台：${settings.enabledPlatforms.join('、')}`,
    `输出语言：${settings.outputLanguage === 'auto' ? '跟随界面语言' : settings.outputLanguage === 'zh-CN' ? '简体中文' : 'English'}`,
    `语言风格：${settings.writingStyle}`,
    `内容深度：${settings.contentDepth}`,
    `CTA 方式：${settings.ctaStyle}`,
    `Emoji 使用：${settings.emojiLevel}`,
    `配图引擎：${settings.imageEngine}`,
    `配图模型：${settings.imageModel}`,
    `配图风格：${settings.imageStyle}`,
    `图片比例：${settings.imageRatio}`,
    settings.imagePromptHint ? `配图补充要求：${settings.imagePromptHint}` : '',
  ].filter(Boolean).join('\n');
}

export function readWorkspaceSettings(): WorkspaceSettings {
  return useWorkspaceSettingsStore.getState().settings;
}
