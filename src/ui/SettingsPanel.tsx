import { useState } from 'react';
import type { ReactNode } from 'react';
import { Image, Loader2, Settings2, SlidersHorizontal, X } from 'lucide-react';
import { useI18n, type Locale } from '../i18n';
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

type Tab = 'workflow' | 'models' | 'image';

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

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { t, locale, setLocale } = useI18n();
  const [tab, setTab] = useState<Tab>('workflow');
  const [saved, setSaved] = useState(false);
  const settings = useWorkspaceSettingsStore((s) => s.settings);
  const updateSettings = useWorkspaceSettingsStore((s) => s.updateSettings);
  const togglePlatform = useWorkspaceSettingsStore((s) => s.togglePlatform);

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('spark_geo_api_key') ?? '');
  const [model, setModel] = useState(() => localStorage.getItem('spark_geo_model') ?? 'gpt-4o-mini');
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem('spark_geo_base_url') ?? 'https://api.openai.com/v1');
  const [fcKey, setFcKey] = useState(() => localStorage.getItem('spark_geo_firecrawl_key') ?? '');
  const [fcTesting, setFcTesting] = useState(false);
  const [fcResult, setFcResult] = useState('');

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const handleSaveModel = () => {
    localStorage.setItem('spark_geo_api_key', apiKey);
    localStorage.setItem('spark_geo_model', model);
    localStorage.setItem('spark_geo_base_url', baseUrl);
    localStorage.setItem('spark_geo_firecrawl_key', fcKey);
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
    { id: 'image', label: '图片生成', icon: <Image size={15} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-3">
          <div>
            <h2 className="text-lg font-semibold text-spark-text">{t('settings.title')}</h2>
            <p className="text-xs text-spark-muted">控制内容策略、模型运行时、配图模型和抓取集成</p>
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
            <div className="grid gap-6 md:grid-cols-2">
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-spark-text">文本模型</h3>
                <div>
                  <label className="mb-1 block text-sm font-medium text-spark-text">API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                    placeholder="sk-..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-spark-text">模型名称</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                    placeholder="gpt-4o-mini"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-spark-text">Base URL</label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    className="w-full rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                    placeholder="https://api.openai.com/v1"
                  />
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-spark-text">图片生成模型</h3>
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
                  <label className="mb-1 block text-sm font-medium text-spark-text">图片模型名称</label>
                  <input
                    type="text"
                    value={settings.imageModel}
                    onChange={(event) => updateSettings({ imageModel: event.target.value })}
                    className="w-full rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                    placeholder="gpt-image-2 / flux-pro / stable-diffusion-xl"
                  />
                </div>
                <p className="text-sm leading-6 text-spark-muted">
                  这里配置图片生成的供应商或兼容引擎；风格、比例和提示词要求放在“图片生成”页。
                </p>
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
                当前版本会在文章发布页生成可预览的封面图和图片提示词；图片生成引擎和模型名称请在“模型与集成”里配置。
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-spark-border px-6 py-4">
          <span className="text-xs text-spark-muted">{saved ? '已保存' : '设置会即时生效，模型密钥需要点击保存'}</span>
          <button
            onClick={handleSaveModel}
            className="rounded-xl bg-spark px-5 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            {saved ? '已保存' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  );
}
