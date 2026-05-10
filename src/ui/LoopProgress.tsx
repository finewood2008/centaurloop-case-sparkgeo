import { useLoopStore } from '../core/loopStore';
import { SPARK_GEO_LOOP_CONFIG } from '../core/loopConfigs';
import type { LoopStage } from '../core/types';

const STEPS = [
  { id: 'plan', label: '📋 规划', stages: ['planning', 'awaiting_plan_review'] as LoopStage[] },
  { id: 'generate', label: '✍️ 生成', stages: ['generating', 'awaiting_review'] as LoopStage[] },
  { id: 'publish', label: '📤 发布', stages: ['awaiting_publish'] as LoopStage[] },
  { id: 'feedback', label: '📊 反馈', stages: ['awaiting_feedback'] as LoopStage[] },
  { id: 'review', label: '🔍 复盘', stages: ['reviewing_auto', 'awaiting_memory', 'cycle_complete'] as LoopStage[] },
];

function getStepIndex(stage: LoopStage): number {
  return STEPS.findIndex((s) => s.stages.includes(stage));
}

export function LoopProgress() {
  const activeCycleId = useLoopStore((s) => s.activeCycleIds[SPARK_GEO_LOOP_CONFIG.id]);
  const cycle = useLoopStore((s) => activeCycleId ? s.cycles[activeCycleId] : null);

  if (!cycle) return null;

  const currentIndex = getStepIndex(cycle.stage);
  const isComplete = cycle.stage === 'cycle_complete';

  return (
    <div className="px-4 py-3 border-b border-spark-border bg-white">
      <div className="max-w-3xl mx-auto">
        {isComplete ? (
          <div className="text-center text-sm text-green-600 font-medium">✅ 本轮完成</div>
        ) : (
          <div className="flex items-center justify-between">
            {STEPS.map((step, i) => {
              const isDone = i < currentIndex;
              const isCurrent = i === currentIndex;
              const isFuture = i > currentIndex;

              return (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full transition-all ${
                        isDone
                          ? 'bg-green-500'
                          : isCurrent
                            ? 'bg-spark ring-4 ring-spark/20 animate-pulse'
                            : 'bg-gray-300'
                      }`}
                    />
                    <span
                      className={`text-xs mt-1 whitespace-nowrap ${
                        isCurrent ? 'text-spark font-medium' : isDone ? 'text-green-600' : 'text-spark-muted'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-1 mt-[-12px] ${
                        isDone ? 'bg-green-400' : isCurrent ? 'bg-spark/30' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
