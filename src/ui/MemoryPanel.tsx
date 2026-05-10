import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useLoopStore } from '../core/loopStore';
import { listAgentMemories, type MemoryEntry } from '../adapters/memory';
import { SPARK_GEO_LOOP_CONFIG } from '../core/loopConfigs';

interface MemoryPanelProps {
  open: boolean;
  onClose: () => void;
}

export function MemoryPanel({ open, onClose }: MemoryPanelProps) {
  const [tab, setTab] = useState<'cycle' | 'all'>('cycle');
  const [allMemories, setAllMemories] = useState<MemoryEntry[]>([]);

  const activeCycleId = useLoopStore((s) => s.activeCycleIds[SPARK_GEO_LOOP_CONFIG.id]);
  const cycle = useLoopStore((s) => activeCycleId ? s.cycles[activeCycleId] : null);
  const usedMemories = cycle?.usedMemories ?? [];

  useEffect(() => {
    if (open && tab === 'all') {
      listAgentMemories('spark', 50).then(setAllMemories);
    }
  }, [open, tab]);

  const categoryLabels: Record<string, string> = {
    lesson: '经验',
    fact: '事实',
    preference: '偏好',
    correction: '纠正',
  };

  const grouped = allMemories.reduce<Record<string, MemoryEntry[]>>((acc, m) => {
    (acc[m.category] ??= []).push(m);
    return acc;
  }, {});

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />
      <div
        className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 flex flex-col transition-transform"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-spark-border">
          <h2 className="font-semibold text-spark-text">记忆</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b border-spark-border">
          {(['cycle', 'all'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                tab === t
                  ? 'text-spark border-b-2 border-spark'
                  : 'text-spark-muted hover:text-spark-text'
              }`}
            >
              {t === 'cycle' ? '本轮记忆' : '全部记忆'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'cycle' ? (
            usedMemories.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-spark-muted mb-2">
                  本轮规划参考了 {usedMemories.length} 条历史经验
                </p>
                {usedMemories.map((m, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-spark-light rounded-lg">
                    <span className="text-sm">💡</span>
                    <p className="text-sm text-spark-text">{m}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-spark-muted text-center mt-8">
                第一轮还没有历史经验，跑完一轮后就会有了
              </p>
            )
          ) : (
            allMemories.length > 0 ? (
              <div className="space-y-4">
                {Object.entries(grouped).map(([category, entries]) => (
                  <div key={category}>
                    <h3 className="text-xs font-medium text-spark-muted mb-2 uppercase">
                      {categoryLabels[category] ?? category}
                    </h3>
                    <div className="space-y-1.5">
                      {entries.map((entry) => (
                        <div key={entry.id} className="p-2 bg-gray-50 rounded-lg">
                          <p className="text-sm text-spark-text">{entry.content}</p>
                          <p className="text-xs text-spark-muted mt-1">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-spark-muted text-center mt-8">
                还没有沉淀的经验，完成第一轮闭环后会开始积累
              </p>
            )
          )}
        </div>
      </div>
    </>
  );
}
