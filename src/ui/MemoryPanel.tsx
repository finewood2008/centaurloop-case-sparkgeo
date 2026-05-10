import { useEffect, useMemo, useState } from 'react';
import { FileUp, Globe2, Loader2, RefreshCcw } from 'lucide-react';
import { listAgentMemories, type MemoryEntry } from '../adapters/memory';
import { useLoopStore } from '../core/loopStore';
import { SPARK_GEO_LOOP_CONFIG } from '../core/loopConfigs';
import { useBrandStore } from '../spark/brandStore';
import { importDocumentMemories, importWebsiteMemories } from '../spark/memoryIngestionService';

export function MemoryPanel() {
  const [tab, setTab] = useState<'profile' | 'cycle' | 'all'>('profile');
  const [allMemories, setAllMemories] = useState<MemoryEntry[]>([]);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState('');
  const [importError, setImportError] = useState('');

  const brand = useBrandStore((s) => s.brand);
  const activeCycleId = useLoopStore((s) => s.activeCycleIds[SPARK_GEO_LOOP_CONFIG.id]);
  const cycle = useLoopStore((s) => activeCycleId ? s.cycles[activeCycleId] : null);
  const usedMemories = cycle?.usedMemories ?? [];
  const memoryCandidateCount = cycle?.memoryCandidates.filter((item) => item.status === 'pending').length ?? 0;

  const refreshMemories = async () => {
    setAllMemories(await listAgentMemories('spark', 80));
  };

  useEffect(() => {
    void refreshMemories();
  }, [activeCycleId, memoryCandidateCount, brand?.updatedAt]);

  const categoryLabels: Record<string, string> = {
    lesson: '经验',
    fact: '事实',
    preference: '偏好',
    correction: '纠正',
  };

  const grouped = useMemo(() => {
    return allMemories.reduce<Record<string, MemoryEntry[]>>((acc, memory) => {
      (acc[memory.category] ??= []).push(memory);
      return acc;
    }, {});
  }, [allMemories]);

  const handleImportWebsite = async () => {
    const url = websiteUrl.trim();
    if (!url) return;
    setImporting(true);
    setImportError('');
    setImportResult('');
    try {
      const count = await importWebsiteMemories(url);
      setImportResult(`已从网页提取 ${count} 条记忆`);
      setWebsiteUrl('');
      await refreshMemories();
      setTab('all');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : '网页导入失败');
    } finally {
      setImporting(false);
    }
  };

  const handleFileChange = async (file?: File) => {
    if (!file) return;
    setImporting(true);
    setImportError('');
    setImportResult('');
    try {
      const count = await importDocumentMemories(file);
      setImportResult(`已从文档提取 ${count} 条记忆`);
      await refreshMemories();
      setTab('all');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : '文档导入失败');
    } finally {
      setImporting(false);
    }
  };

  return (
    <aside className="flex w-[360px] flex-shrink-0 flex-col border-l border-spark-border bg-white">
      <div className="border-b border-spark-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-spark-text">记忆</h2>
            <p className="text-xs text-spark-muted">品牌档案、导入资料和闭环经验</p>
          </div>
          <button
            onClick={() => void refreshMemories()}
            className="rounded-lg p-1.5 text-spark-muted hover:bg-gray-100"
            title="刷新记忆"
          >
            <RefreshCcw size={16} />
          </button>
        </div>
      </div>

      <div className="flex border-b border-spark-border">
        {(['profile', 'cycle', 'all'] as const).map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === item
                ? 'border-b-2 border-spark text-spark'
                : 'text-spark-muted hover:text-spark-text'
            }`}
          >
            {item === 'profile' ? '企业档案' : item === 'cycle' ? '本轮' : '全部'}
          </button>
        ))}
      </div>

      <div className="space-y-3 border-b border-spark-border p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Globe2 className="absolute left-3 top-2.5 text-spark-muted" size={15} />
            <input
              type="url"
              value={websiteUrl}
              onChange={(event) => setWebsiteUrl(event.target.value)}
              className="w-full rounded-xl border border-spark-border py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
              placeholder="抓取网页成为记忆"
            />
          </div>
          <button
            onClick={handleImportWebsite}
            disabled={importing || !websiteUrl.trim()}
            className="rounded-xl bg-spark px-3 py-2 text-sm text-white hover:bg-orange-600 disabled:opacity-40"
          >
            {importing ? <Loader2 size={16} className="animate-spin" /> : '抓取'}
          </button>
        </div>

        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-spark-border px-3 py-2 text-sm text-spark-muted hover:bg-gray-50">
          <FileUp size={16} />
          上传 PDF / TXT 提取记忆
          <input
            type="file"
            accept=".pdf,.txt,.md,text/plain,application/pdf"
            className="hidden"
            onChange={(event) => void handleFileChange(event.target.files?.[0])}
          />
        </label>

        {importResult && <p className="text-xs text-green-600">{importResult}</p>}
        {importError && <p className="text-xs text-red-500">{importError}</p>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === 'profile' && (
          <div className="space-y-3">
            <div className="rounded-xl bg-spark-light p-3">
              <h3 className="text-sm font-semibold text-spark-text">{brand?.brandName || '未设置品牌'}</h3>
              <p className="mt-1 text-xs leading-5 text-spark-muted">
                {brand?.industry || '行业未设置'} · {brand?.targetAudience || '目标受众未设置'}
              </p>
            </div>
            <div className="rounded-xl border border-spark-border p-3">
              <h4 className="mb-2 text-xs font-semibold text-spark-muted">品牌调性</h4>
              <div className="flex flex-wrap gap-1.5">
                {(brand?.toneKeywords.length ? brand.toneKeywords : ['暂未设置']).map((tone) => (
                  <span key={tone} className="rounded-full bg-gray-100 px-2 py-1 text-xs text-spark-muted">
                    {tone}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-spark-border p-3">
              <h4 className="mb-2 text-xs font-semibold text-spark-muted">核心差异化</h4>
              {brand?.differentiators.length ? (
                <ul className="space-y-1">
                  {brand.differentiators.map((item) => (
                    <li key={item} className="text-sm leading-5 text-spark-text">- {item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-spark-muted">暂无差异化信息，可从网页或 PDF 导入。</p>
              )}
            </div>
            {brand?.businessContext && (
              <div className="rounded-xl border border-spark-border p-3">
                <h4 className="mb-2 text-xs font-semibold text-spark-muted">业务资料</h4>
                <p className="text-sm leading-6 text-spark-text">{brand.businessContext}</p>
              </div>
            )}
          </div>
        )}

        {tab === 'cycle' && (
          usedMemories.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-spark-muted">本轮规划参考了 {usedMemories.length} 条历史经验</p>
              {usedMemories.map((memory, index) => (
                <div key={`${memory}-${index}`} className="rounded-xl bg-spark-light p-3">
                  <p className="text-sm leading-5 text-spark-text">{memory}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-center text-sm text-spark-muted">本轮还没有使用历史记忆。</p>
          )
        )}

        {tab === 'all' && (
          allMemories.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(grouped).map(([category, entries]) => (
                <section key={category}>
                  <h3 className="mb-2 text-xs font-medium uppercase text-spark-muted">
                    {categoryLabels[category] ?? category}
                  </h3>
                  <div className="space-y-2">
                    {entries.map((entry) => (
                      <div key={entry.id} className="rounded-xl bg-gray-50 p-3">
                        <p className="text-sm leading-5 text-spark-text">{entry.content}</p>
                        <p className="mt-1 text-xs text-spark-muted">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-center text-sm text-spark-muted">还没有沉淀的经验。</p>
          )
        )}
      </div>
    </aside>
  );
}
