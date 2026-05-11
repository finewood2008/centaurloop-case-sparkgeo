import { useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Cpu, Image, KeyRound, Loader2, RefreshCcw, Settings2, SlidersHorizontal, X } from 'lucide-react';
import { useRuntimeStatus } from '../hooks/useRuntimeStatus';
import { useI18n, type Locale } from '../i18n';
import type { RuntimeConnector } from '../adapters/runtime';
import {
  CONTENT_DEPTH_OPTIONS,
  CTA_STYLE_OPTIONS,
  EMOJI_LEVEL_OPTIONS,
  IMAGE_ENGINE_OPTIONS,
  IMAGE_RATIO_OPTIONS,
  IMAGE_STYLE_OPTIONS,
  PLATFORM_OPTIONS,
  useWorkspaceSettingsStore,
  WRITING_STYLE_OPTIONS,
} from '../spark/workspaceSettings';

interface SettingsPanelProps {
  onClose: () => void;
}

type Tab = 'workflow' | 'models' | 'byok' | 'image';

const CUSTOM_RUNTIME_ID = 'user-settings';
const RUNTIME_STORAGE_KEY = 'spark_geo_runtime_id';
const BYOK_MODEL_OPTIONS = [
  'gpt-4o-mini',
  'gpt-4o',
  'gpt-4.1-mini',
  'gpt-4.1',
  'gpt-4.1-nano',
  'o4-mini',
  'deepseek-chat',
  'qwen-plus',
  'glm-4.5',
  'claude-sonnet-4-5',
];
const BYOK_IMAGE_MODEL_OPTIONS = [
  'gpt-image-2',
  'gpt-image-1',
  'flux-pro',
  'stable-diffusion-xl',
  'ideogram-v3',
  'imagen-4',
];

function OptionButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
        active
          ? 'bg-spark text-white'
          : 'border border-spark-border text-spark-muted hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}

function runtimeDisplayLabel(connector: RuntimeConnector): string {
  if (connector.id === 'local-demo') return '内置体验运行时';
  if (connector.id === CUSTOM_RUNTIME_ID) return 'BYOK OpenAI-compatible 模型';
  return connector.label;
}

function runtimeDisplayMessage(connector: RuntimeConnector): string {
  if (connector.id === 'local-demo') return '无需密钥，用于首次体验和离线演示。';
  if (connector.id === CUSTOM_RUNTIME_ID) {
    return connector.available
      ? '使用 BYOK 页的文本模型配置作为模型底座。'
      : '在 BYOK 页填写 API Key、Base URL 和模型名称后可启用。';
  }
  return connector.message.replace(/\bdemo\b/gi, 'built-in');
}

function runtimeKindLabel(connector: RuntimeConnector): string {
  if (connector.id === 'local-demo') return '内置';
  if (connector.id === CUSTOM_RUNTIME_ID) return 'BYOK';
  if (connector.kind === 'ollama') return '本地';
  if (connector.kind === 'openai-compatible') return '兼容';
  return '规划中';
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { t, locale, setLocale } = useI18n();
  const [tab, setTab] = useState<Tab>('workflow');
  const [saved, setSaved] = useState(false);
  const settings = useWorkspaceSettingsStore((s) => s.settings);
  const updateSettings = useWorkspaceSettingsStore((s) => s.updateSettings);
  const togglePlatform = useWorkspaceSettingsStore((s) => s.togglePlatform);
  const runtime = useRuntimeStatus();

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('spark_geo_api_key') ?? '');
  const [model, setModel] = useState(() => localStorage.getItem('spark_geo_model') ?? 'gpt-4o-mini');
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem('spark_geo_base_url') ?? 'https://api.openai.com/v1');
  const [imageApiKey, setImageApiKey] = useState(() => localStorage.getItem('spark_geo_image_api_key') ?? '');
  const [imageBaseUrl, setImageBaseUrl] = useState(() => localStorage.getItem('spark_geo_image_base_url') ?? 'https://api.openai.com/v1');
  const [fcKey, setFcKey] = useState(() => localStorage.getItem('spark_geo_firecrawl_key') ?? '');
  const [fcTesting, setFcTesting] = useState(false);
  const [fcResult, setFcResult] = useState('');

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const persistModelFields = () => {
    localStorage.setItem('spark_geo_api_key', apiKey);
    localStorage.setItem('spark_geo_model', model);
    localStorage.setItem('spark_geo_base_url', baseUrl);
    localStorage.setItem('spark_geo_image_api_key', imageApiKey);
    localStorage.setItem('spark_geo_image_base_url', imageBaseUrl);
    localStorage.setItem('spark_geo_firecrawl_key', fcKey);
  };

  const handleSaveModel = async () => {
    persistModelFields();
    await runtime.rescan();
    flashSaved();
  };

  const handleUseCustomModel = async () => {
    persistModelFields();
    if (apiKey.trim()) {
      localStorage.setItem(RUNTIME_STORAGE_KEY, CUSTOM_RUNTIME_ID);
      await runtime.rescan();
    }
    flashSaved();
  };

  const handleSelectRuntime = async (runtimeId: string) => {
    await runtime.selectRuntime(runtimeId);
    flashSaved();
  };

  const handleTestFc = async () => {
    if (!fcKey.trim()) return;
    setFcTesting(true);
    setFcResult('');
    try {
      const res = await fetch('/api/firecrawl/scrape', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com', firecrawlKey: fcKey }),
      });
      setFcResult(res.ok ? 'Firecrawl 连接成功' : `Firecrawl 连接失败 (${res.status})`);
    } catch {
      setFcResult('Firecrawl 连接失败');
    } finally {
      setFcTesting(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: 'workflow', label: '工作流偏好', icon: <SlidersHorizontal size={15} /> },
    { id: 'models', label: '模型与集成', icon: <Settings2 size={15} /> },
    { id: 'byok', label: 'BYOK', icon: <KeyRound size={15} /> },
    { id: 'image', label: '图片生成', icon: <Image size={15} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 px-4 py-4 sm:py-8" onClick={onClose}>
      <div
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl sm:max-h-[calc(100dvh-4rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-3">
          <div>
            <h2 className="text-lg font-semibold text-spark-text">{t('settings.title')}</h2>
            <p className="text-xs text-spark-muted">控制内容策略、模型运行时、BYOK、配图偏好和抓取集成</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="mx-6 flex border-b border-spark-border">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
                tab === item.id
                  ? 'border-b-2 border-spark text-spark'
                  : 'text-spark-muted hover:text-spark-text'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'workflow' && (
            <div className="space-y-6">
              <section>
                <h3 className="mb-2 text-sm font-semibold text-spark-text">发布平台</h3>
                <div className="flex flex-wrap gap-2">
                  {PLATFORM_OPTIONS.map((platform) => (
                    <OptionButton
                      key={platform}
                      active={settings.enabledPlatforms.includes(platform)}
                      onClick={() => togglePlatform(platform)}
                    >
                      {platform}
                    </OptionButton>
                  ))}
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-spark-text">界面语言</label>
                  <select
                    value={locale}
                    onChange={(event) => setLocale(event.target.value as Locale)}
                    className="w-full rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                  >
                    <option value="zh-CN">简体中文</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-spark-text">内容输出语言</label>
                  <select
                    value={settings.outputLanguage}
                    onChange={(event) => updateSettings({ outputLanguage: event.target.value as typeof settings.outputLanguage })}
                    className="w-full rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                  >
                    <option value="auto">跟随界面语言</option>
                    <option value="zh-CN">简体中文</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-spark-text">语言风格</h3>
                <div className="flex flex-wrap gap-2">
                  {WRITING_STYLE_OPTIONS.map((style) => (
                    <OptionButton
                      key={style}
                      active={settings.writingStyle === style}
                      onClick={() => updateSettings({ writingStyle: style })}
                    >
                      {style}
                    </OptionButton>
                  ))}
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-spark-text">内容深度</label>
                  <select
                    value={settings.contentDepth}
                    onChange={(event) => updateSettings({ contentDepth: event.target.value })}
                    className="w-full rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                  >
                    {CONTENT_DEPTH_OPTIONS.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-spark-text">CTA 目标</label>
                  <select
                    value={settings.ctaStyle}
                    onChange={(event) => updateSettings({ ctaStyle: event.target.value })}
                    className="w-full rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                  >
                    {CTA_STYLE_OPTIONS.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-spark-text">Emoji 使用</label>
                  <select
                    value={settings.emojiLevel}
                    onChange={(event) => updateSettings({ emojiLevel: event.target.value })}
                    className="w-full rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                  >
                    {EMOJI_LEVEL_OPTIONS.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
              </section>
            </div>
          )}

          {tab === 'models' && (
            <div className="space-y-6">
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-spark-text">底层运行时</h3>
                    <p className="mt-1 text-sm text-spark-muted">选择 SparkGEO 调用的模型底座；BYOK 的 Key、文本模型和图片模型在 BYOK 页配置。</p>
                  </div>
                  <button
                    onClick={() => void runtime.rescan()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-spark-border px-3 py-2 text-sm text-spark-muted hover:bg-gray-50"
                  >
                    <RefreshCcw size={14} />
                    重新扫描
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {runtime.connectors.map((connector) => {
                    const selected = connector.id === runtime.selectedRuntimeId;
                    const connecting = runtime.connectingRuntimeId === connector.id;
                    return (
                      <button
                        key={connector.id}
                        onClick={() => void handleSelectRuntime(connector.id)}
                        disabled={!connector.available || connecting}
                        className={`rounded-2xl border p-3 text-left transition-colors ${
                          selected
                            ? 'border-spark bg-spark-light'
                            : connector.available
                              ? 'border-spark-border bg-white hover:bg-gray-50'
                              : 'border-spark-border bg-gray-50 opacity-70'
                        }`}
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-lg p-1.5 ${selected ? 'bg-white text-spark' : 'bg-gray-100 text-spark-muted'}`}>
                              <Cpu size={15} />
                            </span>
                            <div>
                              <div className="text-sm font-semibold text-spark-text">{runtimeDisplayLabel(connector)}</div>
                              <div className="mt-0.5 text-xs text-spark-muted">{connector.model}</div>
                            </div>
                          </div>
                          {connecting ? (
                            <Loader2 size={16} className="animate-spin text-spark" />
                          ) : selected ? (
                            <Check size={16} className="text-spark" />
                          ) : null}
                        </div>
                        <div className="mb-2 flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${connector.available ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-[11px] text-spark-muted">
                            {connector.available ? '可用' : '未连接'} · {runtimeKindLabel(connector)}
                          </span>
                        </div>
                        <p className="text-xs leading-5 text-spark-muted">{runtimeDisplayMessage(connector)}</p>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-spark-text">网页抓取集成</h3>
                <p className="text-sm leading-6 text-spark-muted">
                  Firecrawl Key 用于在记忆板块抓取官网或资料页；没有配置时，系统会尝试使用基础网页读取。
                </p>
                <div>
                  <label className="mb-1 block text-sm font-medium text-spark-text">Firecrawl API Key</label>
                  <input
                    type="password"
                    value={fcKey}
                    onChange={(e) => setFcKey(e.target.value)}
                    className="w-full rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                    placeholder="fc-..."
                  />
                </div>
                <button
                  onClick={handleTestFc}
                  disabled={fcTesting || !fcKey.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-spark-border px-4 py-2 text-sm text-spark-muted hover:bg-gray-50 disabled:opacity-40"
                >
                  {fcTesting ? <Loader2 size={14} className="animate-spin" /> : null}
                  {fcTesting ? '测试中' : '测试 Firecrawl'}
                </button>
                {fcResult && (
                  <p className={`text-sm ${fcResult.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>
                    {fcResult}
                  </p>
                )}
              </section>
            </div>
          )}

          {tab === 'byok' && (
            <div className="space-y-6">
              <section className="space-y-4 rounded-2xl border border-spark-border bg-[#FBFBF8] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold tracking-wide text-spark-text">BYOK 文本生成</h3>
                    <p className="mt-1 text-sm leading-6 text-spark-muted">
                      Bring Your Own Key。把你自己的 OpenAI-compatible Key 和文本模型作为 SparkGEO 的底层运行时。
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-spark-muted">
                    {runtime.selectedRuntimeId === CUSTOM_RUNTIME_ID ? '当前底座' : '可选底座'}
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-spark-text">API Key</label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full rounded-xl border border-spark-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                      placeholder="sk-..."
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-spark-text">文本模型选择 / 名称</label>
                    <input
                      type="text"
                      list="byok-model-options"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full rounded-xl border border-spark-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                      placeholder="gpt-4o-mini"
                    />
                    <datalist id="byok-model-options">
                      {BYOK_MODEL_OPTIONS.map((item) => <option key={item} value={item} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-spark-text">Base URL</label>
                    <input
                      type="text"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      className="w-full rounded-xl border border-spark-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                      placeholder="https://api.openai.com/v1"
                    />
                  </div>
                </div>
                <button
                  onClick={() => void handleUseCustomModel()}
                  disabled={!apiKey.trim()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-spark px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-40"
                >
                  <Cpu size={15} />
                  保存并使用 BYOK 文本模型
                </button>
                <p className="text-xs leading-5 text-spark-muted">
                  BYOK 文本模型会作为一个可选择的底座出现在“模型与集成”的运行时列表里；如果请求失败，系统会自动回到内置体验生成，避免流程卡住。
                </p>
              </section>

              <section className="space-y-4 rounded-2xl border border-spark-border bg-white p-4">
                <div>
                  <h3 className="text-sm font-semibold tracking-wide text-spark-text">BYOK 图片生成</h3>
                  <p className="mt-1 text-sm leading-6 text-spark-muted">
                    图片生成也采用 BYOK。这里保存图片供应商、Key、Base URL 和模型名称；当前发布页会读取供应商和模型用于预览与提示词。
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-spark-text">图片生成引擎</label>
                    <select
                      value={settings.imageEngine}
                      onChange={(event) => updateSettings({ imageEngine: event.target.value })}
                      className="w-full rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                    >
                      {IMAGE_ENGINE_OPTIONS.map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-spark-text">图片模型选择 / 名称</label>
                    <input
                      type="text"
                      list="byok-image-model-options"
                      value={settings.imageModel}
                      onChange={(event) => updateSettings({ imageModel: event.target.value })}
                      className="w-full rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                      placeholder="gpt-image-2 / flux-pro / stable-diffusion-xl"
                    />
                    <datalist id="byok-image-model-options">
                      {BYOK_IMAGE_MODEL_OPTIONS.map((item) => <option key={item} value={item} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-spark-text">图片 API Key</label>
                    <input
                      type="password"
                      value={imageApiKey}
                      onChange={(e) => setImageApiKey(e.target.value)}
                      className="w-full rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                      placeholder="sk- / provider key"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-spark-text">图片 Base URL</label>
                    <input
                      type="text"
                      value={imageBaseUrl}
                      onChange={(e) => setImageBaseUrl(e.target.value)}
                      className="w-full rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                      placeholder="https://api.openai.com/v1"
                    />
                  </div>
                </div>
                <button
                  onClick={() => void handleSaveModel()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-spark-border px-4 py-2 text-sm font-medium text-spark-text hover:bg-gray-50"
                >
                  <Image size={15} />
                  保存 BYOK 图片生成设置
                </button>
                <p className="text-xs leading-5 text-spark-muted">
                  当前版本的发布页先生成本地封面预览和可复制图片提示词；真实图片 API 接入时会读取这组 BYOK 配置。
                </p>
              </section>
            </div>
          )}

          {tab === 'image' && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-spark-text">图片风格</label>
                  <select
                    value={settings.imageStyle}
                    onChange={(event) => updateSettings({ imageStyle: event.target.value })}
                    className="w-full rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                  >
                    {IMAGE_STYLE_OPTIONS.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-spark-text">默认比例</label>
                  <select
                    value={settings.imageRatio}
                    onChange={(event) => updateSettings({ imageRatio: event.target.value })}
                    className="w-full rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                  >
                    {IMAGE_RATIO_OPTIONS.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-spark-text">配图补充要求</label>
                <textarea
                  value={settings.imagePromptHint}
                  onChange={(event) => updateSettings({ imagePromptHint: event.target.value })}
                  rows={4}
                  className="w-full rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                  placeholder="例如：避免真人脸，偏产品感，多留白，适合小红书封面..."
                />
              </div>
              <div className="rounded-xl bg-gray-50 p-3 text-sm leading-6 text-spark-muted">
                当前版本会在文章发布页生成可预览的封面图和图片提示词；图片生成引擎、模型和 Key 请在“BYOK”页配置。
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-spark-border px-6 py-4">
          <span className="text-xs text-spark-muted">{saved ? '已保存' : '设置会即时生效，BYOK 密钥需要点击保存'}</span>
          <button
            onClick={() => void handleSaveModel()}
            className="rounded-xl bg-spark px-5 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            {saved ? '已保存' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  );
}
