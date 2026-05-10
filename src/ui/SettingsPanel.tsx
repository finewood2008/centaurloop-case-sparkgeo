import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useI18n } from '../i18n';
import { useBrandStore } from '../spark/brandStore';
import { syncBrandProfileToMemory } from '../spark/brandMemory';

interface SettingsPanelProps {
  onClose: () => void;
}

const TONE_OPTIONS = ['专业', '亲和', '干货', '活泼', '高端', '朴实', '幽默', '严肃'];

type Tab = 'model' | 'firecrawl' | 'brand';

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('model');

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('spark_geo_api_key') ?? '');
  const [model, setModel] = useState(() => localStorage.getItem('spark_geo_model') ?? 'gpt-4o-mini');
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem('spark_geo_base_url') ?? 'https://api.openai.com/v1');
  const [saved, setSaved] = useState(false);

  const [fcKey, setFcKey] = useState(() => localStorage.getItem('spark_geo_firecrawl_key') ?? '');
  const [fcTesting, setFcTesting] = useState(false);
  const [fcResult, setFcResult] = useState('');

  const brand = useBrandStore((s) => s.brand);
  const updateBrand = useBrandStore((s) => s.updateBrand);
  const [brandName, setBrandName] = useState(brand?.brandName ?? '');
  const [industry, setIndustry] = useState(brand?.industry ?? '');
  const [targetAudience, setTargetAudience] = useState(brand?.targetAudience ?? '');
  const [toneKeywords, setToneKeywords] = useState<string[]>(brand?.toneKeywords ?? []);
  const [differentiators, setDifferentiators] = useState(brand?.differentiators?.join('\n') ?? '');
  const [businessCtx, setBusinessCtx] = useState(brand?.businessContext ?? '');

  const handleSaveModel = () => {
    localStorage.setItem('spark_geo_api_key', apiKey);
    localStorage.setItem('spark_geo_model', model);
    localStorage.setItem('spark_geo_base_url', baseUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveFc = () => {
    localStorage.setItem('spark_geo_firecrawl_key', fcKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
      setFcResult(res.ok ? '连接成功' : `连接失败 (${res.status})`);
    } catch {
      setFcResult('连接失败');
    } finally {
      setFcTesting(false);
    }
  };

  const handleSaveBrand = () => {
    const updates = {
      brandName,
      industry,
      targetAudience,
      toneKeywords,
      differentiators: differentiators.split('\n').map((s) => s.trim()).filter(Boolean),
      businessContext: businessCtx,
    };
    updateBrand(updates);
    if (brand) {
      void syncBrandProfileToMemory({
        ...brand,
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleTone = (tone: string) => {
    setToneKeywords((prev) =>
      prev.includes(tone) ? prev.filter((t) => t !== tone) : [...prev, tone],
    );
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'model', label: 'AI 模型' },
    { id: 'firecrawl', label: 'Firecrawl' },
    { id: 'brand', label: '品牌档案' },
  ];

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-lg font-semibold text-spark-text">{t('settings.title')}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-spark-border mx-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'text-spark border-b-2 border-spark'
                  : 'text-spark-muted hover:text-spark-text'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {tab === 'model' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-spark-text mb-1 block">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full border border-spark-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                  placeholder="sk-..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-spark-text mb-1 block">模型名称</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full border border-spark-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                  placeholder="gpt-4o-mini"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-spark-text mb-1 block">Base URL</label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full border border-spark-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                  placeholder="https://api.openai.com/v1"
                />
              </div>
              <button
                onClick={handleSaveModel}
                className="w-full py-2 rounded-xl bg-spark text-white font-medium hover:bg-orange-600 transition-colors"
              >
                {saved ? '已保存' : '保存'}
              </button>
            </div>
          )}

          {tab === 'firecrawl' && (
            <div className="space-y-4">
              <p className="text-sm text-spark-muted">
                Firecrawl 用于自动抓取你的官网数据。在 <span className="text-spark">firecrawl.dev</span> 注册获取免费 API Key。
              </p>
              <div>
                <label className="text-sm font-medium text-spark-text mb-1 block">Firecrawl API Key</label>
                <input
                  type="password"
                  value={fcKey}
                  onChange={(e) => setFcKey(e.target.value)}
                  className="w-full border border-spark-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                  placeholder="fc-..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveFc}
                  className="flex-1 py-2 rounded-xl bg-spark text-white font-medium hover:bg-orange-600 transition-colors"
                >
                  {saved ? '已保存' : '保存'}
                </button>
                <button
                  onClick={handleTestFc}
                  disabled={fcTesting || !fcKey.trim()}
                  className="px-4 py-2 rounded-xl border border-spark-border text-sm text-spark-muted hover:bg-gray-50 disabled:opacity-40 flex items-center gap-1.5"
                >
                  {fcTesting ? <><Loader2 size={14} className="animate-spin" /> 测试中</> : '测试连接'}
                </button>
              </div>
              {fcResult && (
                <p className={`text-sm ${fcResult.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>
                  {fcResult}
                </p>
              )}
            </div>
          )}

          {tab === 'brand' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-spark-text mb-1 block">品牌名称</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full border border-spark-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-spark-text mb-1 block">行业</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full border border-spark-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-spark-text mb-1 block">目标受众</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full border border-spark-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-spark-text mb-1 block">品牌调性</label>
                <div className="flex flex-wrap gap-2">
                  {TONE_OPTIONS.map((tone) => (
                    <button
                      key={tone}
                      onClick={() => toggleTone(tone)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        toneKeywords.includes(tone)
                          ? 'bg-spark text-white'
                          : 'border border-spark-border text-spark-muted hover:bg-gray-50'
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-spark-text mb-1 block">核心差异化</label>
                <textarea
                  value={differentiators}
                  onChange={(e) => setDifferentiators(e.target.value)}
                  rows={2}
                  className="w-full border border-spark-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-spark-text mb-1 block">业务资料</label>
                <textarea
                  value={businessCtx}
                  onChange={(e) => setBusinessCtx(e.target.value)}
                  rows={4}
                  className="w-full border border-spark-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                />
              </div>
              <button
                onClick={handleSaveBrand}
                className="w-full py-2 rounded-xl bg-spark text-white font-medium hover:bg-orange-600 transition-colors"
              >
                {saved ? '已保存' : '保存品牌信息'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
