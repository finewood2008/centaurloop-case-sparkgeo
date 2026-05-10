import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Locale = 'en' | 'zh-CN';

const STORAGE_KEY = 'spark_geo_locale';

const dictionaries = {
  en: {
    'app.title': 'Spark GEO',
    'app.tagline': 'AI-powered content growth workbench for new media.',
    'app.language': '中文',
    'app.github': 'GitHub',
    'runtime.title': 'Runtime',
    'runtime.center': 'Runtime center',
    'runtime.scan': 'Scan local runtimes',
    'runtime.connected': 'Selected',
    'runtime.unavailableShort': 'Unavailable',
    'runtime.availableShort': 'Available',
    'runtime.select': 'Use runtime',
    'runtime.configureHint': 'Set .env.local for OpenAI-compatible models, or start Ollama / LM Studio locally.',
    'runtime.real': 'Real model',
    'runtime.demo': 'Demo fallback',
    'runtime.checking': 'Checking runtime',
    'runtime.unavailable': 'Local model proxy unavailable. Running the full demo runtime.',
    'runtime.available': 'OpenAI-compatible model is configured.',
    'runtime.provider': 'Provider',
    'runtime.model': 'Model',
    'runtime.adapters': 'Adapter-ready',
    'runtime.planned': 'planned',
    'loop.contentGrowth': 'Content Growth Loop',
    'loop.contentGrowth.description': 'Plan multi-platform content each week, generate, review, publish, collect feedback, and refine strategy for the next cycle.',
    'chat.title': 'Loop conversation',
    'chat.reset': 'Reset conversation',
    'chat.placeholderIdle': 'Describe your content goal for this week...',
    'chat.placeholderRunning': 'Reply with approval, feedback, or a change request...',
    'chat.hint': 'Enter to send · Shift+Enter for newline',
    'settings.title': 'Settings',
    'settings.apiKey': 'API Key',
    'settings.model': 'Model Name',
    'settings.baseUrl': 'Base URL',
    'settings.save': 'Save',
    'settings.saved': 'Saved',
  },
  'zh-CN': {
    'app.title': 'Spark GEO',
    'app.tagline': '面向新媒体运营者的 AI 内容增长工作台。',
    'app.language': 'English',
    'app.github': 'GitHub',
    'runtime.title': 'Runtime',
    'runtime.center': 'Runtime Center',
    'runtime.scan': '扫描本机 Runtime',
    'runtime.connected': '当前选择',
    'runtime.unavailableShort': '不可用',
    'runtime.availableShort': '可用',
    'runtime.select': '使用该 runtime',
    'runtime.configureHint': '可在 .env.local 配置 OpenAI-compatible 模型，或在本机启动 Ollama / LM Studio。',
    'runtime.real': '真实模型',
    'runtime.demo': 'Demo 降级',
    'runtime.checking': '正在检查 runtime',
    'runtime.unavailable': '本地模型代理不可用，当前使用完整 demo runtime。',
    'runtime.available': 'OpenAI-compatible 模型已配置。',
    'runtime.provider': 'Provider',
    'runtime.model': 'Model',
    'runtime.adapters': 'Adapter-ready',
    'runtime.planned': 'planned',
    'loop.contentGrowth': '内容增长闭环',
    'loop.contentGrowth.description': '每周规划多平台内容，生成、审核、发布、收集反馈、复盘提炼策略，让下一轮内容更好。',
    'chat.title': '闭环对话',
    'chat.reset': '重置对话',
    'chat.placeholderIdle': '描述这周的内容增长目标…',
    'chat.placeholderRunning': '回复确认、反馈数据，或提出修改意见…',
    'chat.hint': 'Enter 发送 · Shift+Enter 换行',
    'settings.title': '设置',
    'settings.apiKey': 'API Key',
    'settings.model': '模型名称',
    'settings.baseUrl': 'Base URL',
    'settings.save': '保存',
    'settings.saved': '已保存',
  },
} as const;

type MessageKey = keyof typeof dictionaries.en;

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: MessageKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function readInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'zh-CN';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'en' ? 'en' : 'zh-CN';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readInitialLocale);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const setLocale = (next: Locale) => setLocaleState(next);
    return {
      locale,
      setLocale,
      toggleLocale: () => setLocaleState((current) => current === 'en' ? 'zh-CN' : 'en'),
      t: (key) => dictionaries[locale][key] ?? dictionaries.en[key],
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}

export function getLoopConfigLabel(_configId: string, locale: Locale): string {
  return dictionaries[locale]['loop.contentGrowth'];
}

export function getLoopConfigDescription(_configId: string, locale: Locale): string {
  return dictionaries[locale]['loop.contentGrowth.description'];
}

export function getOutputLanguageInstruction(locale: Locale): string {
  return locale === 'zh-CN'
    ? '请使用简体中文输出。'
    : 'Use clear, concise English for all user-facing output.';
}
