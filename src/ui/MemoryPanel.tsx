import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  CircleDashed,
  FileUp,
  Globe2,
  Loader2,
  Network,
  PencilLine,
  RefreshCcw,
  Save,
  Sparkles,
} from 'lucide-react';
import { listAgentMemories, storeAgentMemory, type MemoryEntry } from '../adapters/memory';
import { useLoopStore } from '../core/loopStore';
import { SPARK_GEO_LOOP_CONFIG } from '../core/loopConfigs';
import type { LoopCycle } from '../core/types';
import { syncBrandProfileToMemory } from '../spark/brandMemory';
import { useBrandStore, type BrandProfile } from '../spark/brandStore';
import {
  importDocumentMemoryResult,
  importWebsiteMemoryResult,
  type MemoryImportResult,
} from '../spark/memoryIngestionService';

type MemoryTab = 'cycle' | 'all' | 'profile';

interface CycleSignal {
  id: string;
  label: string;
  content: string;
  meta: string;
  status: 'active' | 'used' | 'candidate' | 'saved';
}

interface ProfileDraft {
  brandName: string;
  industry: string;
  targetAudience: string;
  toneKeywords: string;
  differentiators: string;
  businessContext: string;
  websiteUrl: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  lesson: '经验',
  fact: '事实',
  preference: '偏好',
  correction: '纠正',
};

const EMPTY_PROFILE: BrandProfile = {
  brandName: '',
  industry: '',
  targetAudience: '',
  toneKeywords: [],
  differentiators: [],
  businessContext: '',
  websiteUrl: '',
  websiteExtract: '',
  setupCompleted: true,
  updatedAt: '',
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function profileToDraft(brand: BrandProfile | null): ProfileDraft {
  return {
    brandName: brand?.brandName ?? '',
    industry: brand?.industry ?? '',
    targetAudience: brand?.targetAudience ?? '',
    toneKeywords: brand?.toneKeywords.join('、') ?? '',
    differentiators: brand?.differentiators.join('\n') ?? '',
    businessContext: brand?.businessContext ?? '',
    websiteUrl: brand?.websiteUrl ?? '',
  };
}

function draftToProfile(draft: ProfileDraft, current: BrandProfile | null): BrandProfile {
  return {
    ...(current ?? EMPTY_PROFILE),
    brandName: draft.brandName.trim() || '我的品牌',
    industry: draft.industry.trim(),
    targetAudience: draft.targetAudience.trim(),
    toneKeywords: draft.toneKeywords
      .split(/[、,，\n]/)
      .map((item) => item.trim())
      .filter(Boolean),
    differentiators: draft.differentiators
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
    businessContext: draft.businessContext.trim(),
    websiteUrl: draft.websiteUrl.trim(),
    setupCompleted: true,
    updatedAt: new Date().toISOString(),
  };
}

function buildImportNote(result: MemoryImportResult): string {
  const details = result.drafts
    .slice(0, 5)
    .map((draft) => `- ${draft.content}`)
    .join('\n');
  return `资料补充：${result.sourceTitle}\n${details}`;
}

function appendBlock(current: string, next: string): string {
  const compact = next.trim();
  if (!compact) return current;
  return [current.trim(), compact].filter(Boolean).join('\n\n');
}

function buildCycleSignals(cycle: LoopCycle | null): CycleSignal[] {
  if (!cycle) return [];

  const signals: CycleSignal[] = [
    {
      id: 'goal',
      label: '本轮目标',
      content: cycle.goal,
      meta: `第 ${cycle.cycleNumber} 轮 · ${cycle.stage}`,
      status: 'active',
    },
  ];

  for (const [index, memory] of (cycle.usedMemories ?? []).entries()) {
    signals.push({
      id: `used-${index}`,
      label: '已调用历史记忆',
      content: memory,
      meta: '规划和生成时已注入',
      status: 'used',
    });
  }

  if (cycle.plan) {
    signals.push({
      id: 'plan',
      label: '本轮计划记忆',
      content: `${cycle.plan.summary}${cycle.plan.keywords?.length ? `\n关键词：${cycle.plan.keywords.join('、')}` : ''}`,
      meta: `平台：${cycle.plan.platforms.join('、') || '待定'}`,
      status: 'active',
    });
  }

  const readyDrafts = cycle.tasks.filter((task) => task.draft);
  if (readyDrafts.length > 0) {
    signals.push({
      id: 'drafts',
      label: '内容产出状态',
      content: readyDrafts.map((task) => `${task.appName}：${task.draft?.title ?? '草稿已生成'}`).join('\n'),
      meta: `${readyDrafts.length} 篇草稿进入审核或发布流程`,
      status: 'active',
    });
  }

  const feedbacks = cycle.tasks
    .filter((task) => task.feedback)
    .map((task) => `${task.appName}：${task.feedback?.reviewSummary || task.feedback?.publishedUrl || '已记录反馈'}`);
  if (feedbacks.length > 0) {
    signals.push({
      id: 'feedback',
      label: '反馈信号',
      content: feedbacks.join('\n'),
      meta: '发布链接抓取后实时进入复盘',
      status: 'active',
    });
  }

  if (cycle.review) {
    signals.push({
      id: 'review',
      label: '本轮复盘摘要',
      content: cycle.review.summary,
      meta: '复盘结果可继续沉淀为长期记忆',
      status: 'candidate',
    });
  }

  for (const candidate of cycle.memoryCandidates) {
    signals.push({
      id: candidate.id,
      label: candidate.status === 'confirmed' ? '已确认记忆' : candidate.status === 'rejected' ? '已忽略候选' : '待确认记忆',
      content: candidate.content,
      meta: CATEGORY_LABELS[candidate.category] ?? candidate.category,
      status: candidate.status === 'confirmed' ? 'saved' : 'candidate',
    });
  }

  return signals;
}

function cycleStatusLabel(cycle: LoopCycle | null): string {
  if (!cycle) return '等待本轮目标';
  if (cycle.stage === 'cycle_complete') return '本轮已完成';
  if (cycle.stage.startsWith('awaiting_')) return '等待人工确认';
  return 'AI 正在更新';
}

function CycleSignalCard({ signal }: { signal: CycleSignal }) {
  const tone = {
    active: 'border-spark/30 bg-spark-light',
    used: 'border-blue-100 bg-blue-50',
    candidate: 'border-amber-100 bg-amber-50',
    saved: 'border-green-100 bg-green-50',
  }[signal.status];

  return (
    <article className={`rounded-xl border p-3 ${tone}`}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-spark-text">{signal.label}</span>
        <span className="shrink-0 text-[11px] text-spark-muted">{signal.meta}</span>
      </div>
      <p className="whitespace-pre-line text-sm leading-5 text-spark-text">{signal.content}</p>
    </article>
  );
}

function MemoryWikiGraph({ memories, brand }: { memories: MemoryEntry[]; brand: BrandProfile | null }) {
  const graph = useMemo(() => {
    const visible = memories.slice(0, 14);
    const categories = Array.from(new Set(visible.map((memory) => memory.category))).slice(0, 4);
    const categoryPositions = [
      { x: 50, y: 16 },
      { x: 84, y: 46 },
      { x: 54, y: 84 },
      { x: 16, y: 48 },
    ];
    const memoryPositions = visible.map((_, index) => {
      const angle = (-90 + (360 / Math.max(visible.length, 1)) * index) * (Math.PI / 180);
      return {
        x: 50 + Math.cos(angle) * 34,
        y: 52 + Math.sin(angle) * 31,
      };
    });

    const nodes = [
      {
        id: 'brand',
        label: brand?.brandName || '企业档案',
        x: 50,
        y: 51,
        className: 'border-spark bg-white text-spark-text shadow-sm',
      },
      ...categories.map((category, index) => ({
        id: `cat-${category}`,
        label: CATEGORY_LABELS[category] ?? category,
        x: categoryPositions[index].x,
        y: categoryPositions[index].y,
        className: 'border-orange-200 bg-orange-50 text-orange-800',
      })),
      ...visible.map((memory, index) => ({
        id: memory.id,
        label: memory.content,
        x: memoryPositions[index].x,
        y: memoryPositions[index].y,
        className: memory.scope === 'profile'
          ? 'border-blue-200 bg-blue-50 text-blue-900'
          : memory.scope === 'cycle'
            ? 'border-green-200 bg-green-50 text-green-900'
            : 'border-gray-200 bg-white text-spark-text',
      })),
    ];

    const edges = [
      ...visible.map((memory) => ({
        from: `cat-${memory.category}`,
        to: memory.id,
      })),
      ...visible
        .filter((memory) => memory.scope === 'profile' || memory.id.startsWith('brand:'))
        .map((memory) => ({ from: 'brand', to: memory.id })),
    ];

    return { nodes, edges };
  }, [brand, memories]);

  const getNode = (id: string) => graph.nodes.find((node) => node.id === id);

  if (memories.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-spark-border p-4 text-center text-sm text-spark-muted">
        还没有足够的长期记忆形成关系图。
      </div>
    );
  }

  return (
    <div className="relative h-72 overflow-hidden rounded-2xl border border-spark-border bg-[#FBFBF8]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {graph.edges.map((edge) => {
          const from = getNode(edge.from);
          const to = getNode(edge.to);
          if (!from || !to) return null;
          return (
            <line
              key={`${edge.from}-${edge.to}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="#E5E7EB"
              strokeWidth="0.7"
            />
          );
        })}
      </svg>
      {graph.nodes.map((node) => (
        <div
          key={node.id}
          className={`absolute max-w-[118px] -translate-x-1/2 -translate-y-1/2 rounded-full border px-2.5 py-1 text-center text-[11px] leading-4 ${node.className}`}
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          title={node.label}
        >
          <span className="block truncate">{node.label}</span>
        </div>
      ))}
    </div>
  );
}

export function MemoryPanel() {
  const [tab, setTab] = useState<MemoryTab>('cycle');
  const [allMemories, setAllMemories] = useState<MemoryEntry[]>([]);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(() => profileToDraft(null));
  const [extraProfileNote, setExtraProfileNote] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [importResult, setImportResult] = useState('');
  const [importError, setImportError] = useState('');

  const brand = useBrandStore((state) => state.brand);
  const setBrand = useBrandStore((state) => state.setBrand);
  const activeCycleId = useLoopStore((state) => state.activeCycleIds[SPARK_GEO_LOOP_CONFIG.id]);
  const cycle = useLoopStore((state) => (activeCycleId ? state.cycles[activeCycleId] : null));
  const cycleSignals = useMemo(() => buildCycleSignals(cycle), [cycle]);
  const memoryCandidateCount = cycle?.memoryCandidates.filter((item) => item.status === 'pending').length ?? 0;

  const refreshMemories = async () => {
    setAllMemories(await listAgentMemories('spark', 120));
  };

  useEffect(() => {
    setProfileDraft(profileToDraft(brand));
  }, [brand?.updatedAt]);

  useEffect(() => {
    void refreshMemories();
  }, [activeCycleId, memoryCandidateCount, brand?.updatedAt, cycle?.stage, cycle?.tasks.length]);

  const profileMemories = useMemo(
    () => allMemories.filter((memory) => memory.scope === 'profile' || memory.id.startsWith('brand:')),
    [allMemories],
  );

  const grouped = useMemo(() => {
    return allMemories.reduce<Record<string, MemoryEntry[]>>((acc, memory) => {
      (acc[memory.category] ??= []).push(memory);
      return acc;
    }, {});
  }, [allMemories]);

  const saveProfile = async (overrideDraft?: ProfileDraft) => {
    setSavingProfile(true);
    try {
      const next = draftToProfile(overrideDraft ?? profileDraft, brand);
      setBrand(next);
      await syncBrandProfileToMemory(next);
      setImportResult('企业档案已保存，并同步为长期记忆');
      setImportError('');
      await refreshMemories();
    } finally {
      setSavingProfile(false);
    }
  };

  const appendImportedProfile = async (result: MemoryImportResult, sourceUrl?: string) => {
    const importedNote = buildImportNote(result);
    const nextDraft: ProfileDraft = {
      ...profileDraft,
      websiteUrl: sourceUrl ?? profileDraft.websiteUrl,
      businessContext: appendBlock(profileDraft.businessContext, importedNote),
    };
    setProfileDraft(nextDraft);

    const nextBrand = draftToProfile(nextDraft, brand);
    nextBrand.websiteExtract = result.drafts.slice(0, 3).map((draft) => draft.content).join('；');
    setBrand(nextBrand);
    await syncBrandProfileToMemory(nextBrand);
  };

  const handleImportWebsite = async () => {
    const url = websiteUrl.trim() || profileDraft.websiteUrl.trim();
    if (!url) return;
    setImporting(true);
    setImportError('');
    setImportResult('');
    try {
      const result = await importWebsiteMemoryResult(url);
      await appendImportedProfile(result, url);
      setImportResult(`已从网页提取 ${result.count} 条企业记忆`);
      setWebsiteUrl('');
      await refreshMemories();
      setTab('profile');
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
      const result = await importDocumentMemoryResult(file);
      await appendImportedProfile(result);
      setImportResult(`已从文档提取 ${result.count} 条企业记忆`);
      await refreshMemories();
      setTab('profile');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : '文档导入失败');
    } finally {
      setImporting(false);
    }
  };

  const handleAppendNote = async () => {
    const note = extraProfileNote.trim();
    if (!note) return;
    const nextDraft = {
      ...profileDraft,
      businessContext: appendBlock(profileDraft.businessContext, `手动补充：${note}`),
    };
    setProfileDraft(nextDraft);
    setExtraProfileNote('');
    await storeAgentMemory('spark', `企业档案补充：${note}`, 'fact', {
      scope: 'profile',
      sourceTitle: '手动补充',
      tags: ['企业档案'],
    });
    await saveProfile(nextDraft);
  };

  const tabItems: Array<{ id: MemoryTab; label: string; count: number }> = [
    { id: 'cycle', label: '本轮', count: cycleSignals.length },
    { id: 'all', label: '全部', count: allMemories.length },
    { id: 'profile', label: '企业档案', count: profileMemories.length },
  ];

  return (
    <aside className="flex w-[420px] flex-shrink-0 flex-col border-l border-spark-border bg-white">
      <div className="border-b border-spark-border px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-spark-text">记忆板</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                动态
              </span>
            </div>
            <p className="mt-0.5 text-xs text-spark-muted">本轮信号、长期 wiki、企业档案</p>
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

      <div className="grid grid-cols-3 border-b border-spark-border px-3 pt-2">
        {tabItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`rounded-t-xl px-2 py-2 text-sm font-medium transition-colors ${
              tab === item.id
                ? 'bg-spark-light text-spark'
                : 'text-spark-muted hover:bg-gray-50 hover:text-spark-text'
            }`}
          >
            <span>{item.label}</span>
            <span className="ml-1 text-[11px] opacity-70">{item.count}</span>
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === 'cycle' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-spark-border bg-[#FBFBF8] p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CircleDashed size={16} className="text-spark" />
                  <span className="text-sm font-semibold text-spark-text">本轮实时记忆</span>
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-[11px] text-spark-muted">
                  {cycleStatusLabel(cycle)}
                </span>
              </div>
              <p className="text-xs leading-5 text-spark-muted">
                随着对话推进，目标、调用过的历史记忆、计划、草稿、反馈和复盘候选会在这里即时出现。
              </p>
            </div>

            {cycleSignals.length > 0 ? (
              <div className="space-y-2">
                {cycleSignals.map((signal) => (
                  <CycleSignalCard key={signal.id} signal={signal} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-spark-border p-5 text-center">
                <Sparkles className="mx-auto mb-2 text-spark-muted" size={20} />
                <p className="text-sm text-spark-muted">开始一轮内容任务后，本轮记忆会自动出现在这里。</p>
              </div>
            )}
          </div>
        )}

        {tab === 'all' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Network size={17} className="text-spark" />
              <div>
                <h3 className="text-sm font-semibold text-spark-text">长期记忆 Wiki</h3>
                <p className="text-xs text-spark-muted">按企业档案、分类和循环复盘建立轻量关系。</p>
              </div>
            </div>

            <MemoryWikiGraph memories={allMemories} brand={brand} />

            {allMemories.length > 0 ? (
              <div className="space-y-4">
                {Object.entries(grouped).map(([category, entries]) => (
                  <section key={category}>
                    <h4 className="mb-2 text-xs font-medium uppercase text-spark-muted">
                      {CATEGORY_LABELS[category] ?? category}
                    </h4>
                    <div className="space-y-2">
                      {entries.map((entry) => (
                        <article key={entry.id} className="rounded-xl bg-gray-50 p-3">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="text-[11px] text-spark-muted">
                              {entry.sourceTitle || (entry.scope === 'cycle' ? '循环复盘' : '长期记忆')}
                            </span>
                            <span className="shrink-0 text-[11px] text-spark-muted">{formatDate(entry.createdAt)}</span>
                          </div>
                          <p className="text-sm leading-5 text-spark-text">{entry.content}</p>
                          {entry.tags && entry.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {entry.tags.slice(0, 4).map((tag) => (
                                <span key={tag} className="rounded-full bg-white px-2 py-0.5 text-[11px] text-spark-muted">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <p className="mt-8 text-center text-sm text-spark-muted">还没有沉淀的长期记忆。</p>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div className="space-y-4">
            <section className="rounded-2xl border border-spark-border bg-spark-light p-3">
              <div className="mb-2 flex items-center gap-2">
                <Building2 size={16} className="text-spark" />
                <h3 className="text-sm font-semibold text-spark-text">{brand?.brandName || '企业档案'}</h3>
              </div>
              <p className="text-xs leading-5 text-spark-muted">
                启动时输入的品牌信息会在这里维护。网页抓取、PDF/TXT 上传和手动补充都只进入企业档案页。
              </p>
            </section>

            <section className="space-y-3 rounded-2xl border border-spark-border p-3">
              <div className="flex items-center gap-2">
                <PencilLine size={15} className="text-spark-muted" />
                <h4 className="text-sm font-semibold text-spark-text">档案字段</h4>
              </div>
              <div className="grid gap-2">
                <input
                  value={profileDraft.brandName}
                  onChange={(event) => setProfileDraft((draft) => ({ ...draft, brandName: event.target.value }))}
                  className="rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                  placeholder="品牌名称"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={profileDraft.industry}
                    onChange={(event) => setProfileDraft((draft) => ({ ...draft, industry: event.target.value }))}
                    className="rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                    placeholder="行业"
                  />
                  <input
                    value={profileDraft.targetAudience}
                    onChange={(event) => setProfileDraft((draft) => ({ ...draft, targetAudience: event.target.value }))}
                    className="rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                    placeholder="目标受众"
                  />
                </div>
                <input
                  value={profileDraft.toneKeywords}
                  onChange={(event) => setProfileDraft((draft) => ({ ...draft, toneKeywords: event.target.value }))}
                  className="rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                  placeholder="品牌调性，用顿号或逗号分隔"
                />
                <textarea
                  value={profileDraft.differentiators}
                  onChange={(event) => setProfileDraft((draft) => ({ ...draft, differentiators: event.target.value }))}
                  rows={3}
                  className="rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                  placeholder="核心差异化，每行一条"
                />
                <textarea
                  value={profileDraft.businessContext}
                  onChange={(event) => setProfileDraft((draft) => ({ ...draft, businessContext: event.target.value }))}
                  rows={5}
                  className="rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                  placeholder="业务背景、内容需求、禁忌和转化目标"
                />
              </div>
              <button
                onClick={() => void saveProfile()}
                disabled={savingProfile}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-spark px-3 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {savingProfile ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                保存企业档案
              </button>
            </section>

            <section className="space-y-3 rounded-2xl border border-spark-border p-3">
              <h4 className="text-sm font-semibold text-spark-text">补充更多企业资料</h4>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe2 className="absolute left-3 top-2.5 text-spark-muted" size={15} />
                  <input
                    type="url"
                    value={websiteUrl || profileDraft.websiteUrl}
                    onChange={(event) => {
                      setWebsiteUrl(event.target.value);
                      setProfileDraft((draft) => ({ ...draft, websiteUrl: event.target.value }));
                    }}
                    className="w-full rounded-xl border border-spark-border py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                    placeholder="抓取官网或资料页"
                  />
                </div>
                <button
                  onClick={handleImportWebsite}
                  disabled={importing || !(websiteUrl.trim() || profileDraft.websiteUrl.trim())}
                  className="rounded-xl bg-spark px-3 py-2 text-sm text-white hover:bg-orange-600 disabled:opacity-40"
                >
                  {importing ? <Loader2 size={16} className="animate-spin" /> : '抓取'}
                </button>
              </div>

              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-spark-border px-3 py-2 text-sm text-spark-muted hover:bg-gray-50">
                <FileUp size={16} />
                上传 PDF / TXT 提取企业记忆
                <input
                  type="file"
                  accept=".pdf,.txt,.md,text/plain,application/pdf"
                  className="hidden"
                  onChange={(event) => void handleFileChange(event.target.files?.[0])}
                />
              </label>

              <textarea
                value={extraProfileNote}
                onChange={(event) => setExtraProfileNote(event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-spark-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                placeholder="直接补充一条企业档案，例如禁用说法、核心客户、产品边界"
              />
              <button
                onClick={handleAppendNote}
                disabled={!extraProfileNote.trim() || savingProfile}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-spark-border px-3 py-2 text-sm font-medium text-spark-text hover:bg-gray-50 disabled:opacity-40"
              >
                <CheckCircle2 size={15} />
                补充到企业档案
              </button>

              {importResult && <p className="text-xs text-green-600">{importResult}</p>}
              {importError && <p className="text-xs text-red-500">{importError}</p>}
            </section>
          </div>
        )}
      </div>
    </aside>
  );
}
