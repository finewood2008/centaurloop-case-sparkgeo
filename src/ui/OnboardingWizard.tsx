import { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { useBrandStore, type BrandProfile } from '../spark/brandStore';
import { syncBrandProfileToMemory } from '../spark/brandMemory';

const TONE_OPTIONS = ['专业', '亲和', '干货', '活泼', '高端', '朴实', '幽默', '严肃'];

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const setBrand = useBrandStore((s) => s.setBrand);

  const [brandName, setBrandName] = useState('');
  const [industry, setIndustry] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [toneKeywords, setToneKeywords] = useState<string[]>(['专业', '干货']);
  const [differentiators, setDifferentiators] = useState('');
  const [businessContext, setBusinessContext] = useState('');

  const toggleTone = (tone: string) => {
    setToneKeywords((prev) =>
      prev.includes(tone) ? prev.filter((t) => t !== tone) : [...prev, tone],
    );
  };

  const finish = () => {
    const profile: BrandProfile = {
      brandName: brandName.trim() || '我的品牌',
      industry: industry.trim(),
      targetAudience: targetAudience.trim(),
      toneKeywords,
      differentiators: differentiators.trim()
        ? differentiators.split('\n').map((s) => s.trim()).filter(Boolean)
        : [],
      businessContext: businessContext.trim(),
      setupCompleted: true,
      updatedAt: new Date().toISOString(),
    };
    setBrand(profile);
    void syncBrandProfileToMemory(profile);
    onComplete();
  };

  const canProceed = brandName.trim() && targetAudience.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4">
      <div className="w-full max-w-xl rounded-2xl border border-spark-border bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-spark-border px-5 py-4">
          <div>
            <h1 className="text-base font-semibold text-spark-text">快速建立品牌记忆</h1>
            <p className="text-xs text-spark-muted">后续也可以在设置和记忆里继续补充</p>
          </div>
          <button
            onClick={finish}
            className="rounded-lg p-1.5 text-spark-muted transition-colors hover:bg-gray-100"
            title="跳过"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="mb-5 flex items-center gap-2">
            {[0, 1].map((i) => (
              <span
                key={i}
                className={`h-2 w-10 rounded-full ${i <= step ? 'bg-spark' : 'bg-gray-200'}`}
              />
            ))}
          </div>

          {step === 0 && (
            <div className="space-y-5">
              <div>
                <div className="mb-3 text-4xl">🔥</div>
                <h2 className="text-2xl font-bold text-spark-text">Spark GEO</h2>
                <p className="mt-2 text-sm leading-6 text-spark-muted">
                  先用一小段信息建立品牌记忆。官网抓取、Firecrawl Key 和模型设置放到后续设置里处理，不打断首次启动。
                </p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 rounded-xl bg-spark px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-600"
              >
                开始 <ArrowRight size={16} />
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-spark-text">品牌名称 *</label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                    placeholder="如：CentaurLoop"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-spark-text">行业</label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                    placeholder="如：AI SaaS / 教育 / 本地生活"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-spark-text">目标受众 *</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                  placeholder="如：想用 AI 提升工作流的创始人和运营负责人"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-spark-text">品牌调性</label>
                <div className="flex flex-wrap gap-2">
                  {TONE_OPTIONS.map((tone) => (
                    <button
                      key={tone}
                      onClick={() => toggleTone(tone)}
                      className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
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
                <label className="mb-1 block text-sm font-medium text-spark-text">用自然语言描述你的需求</label>
                <textarea
                  value={businessContext}
                  onChange={(e) => setBusinessContext(e.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                  placeholder="比如：我们想把 CentaurLoop 讲清楚，先做一个 Spark GEO 案例，用内容增长闭环证明 AI employee 可以和人协作完成业务周期。"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-spark-text">核心差异化</label>
                <textarea
                  value={differentiators}
                  onChange={(e) => setDifferentiators(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                  placeholder="每行一条，可后续补充"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep(0)}
                  className="rounded-xl border border-spark-border px-4 py-2 text-sm text-spark-muted transition-colors hover:bg-gray-50"
                >
                  返回
                </button>
                <button
                  onClick={finish}
                  disabled={!canProceed}
                  className="flex-1 rounded-xl bg-spark py-2 font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-40"
                >
                  保存到记忆并开始
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
