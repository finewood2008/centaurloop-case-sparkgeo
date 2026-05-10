import type { LoopMessage, UserAction } from '../protocol/types';

interface PlanCardProps {
  message: LoopMessage;
  onAction: (action: UserAction) => void;
}

export function PlanCard({ message, onAction }: PlanCardProps) {
  const plan = message.metadata?.plan;
  if (!plan) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-spark-border p-4 max-w-[85%] w-full">
      <h3 className="font-semibold text-spark-text mb-2">📋 {plan.summary}</h3>

      {plan.platforms.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {plan.platforms.map((p) => (
            <span key={p} className="px-2 py-0.5 bg-spark-light text-spark text-xs rounded-full">
              {p}
            </span>
          ))}
        </div>
      )}

      {plan.keywords && plan.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {plan.keywords.map((k) => (
            <span key={k} className="px-2 py-0.5 bg-gray-100 text-spark-muted text-xs rounded-full">
              #{k}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-1.5 mb-4">
        {plan.tasks.map((task, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-5 h-5 rounded-full bg-spark-light text-spark text-xs flex items-center justify-center font-medium">
              {i + 1}
            </span>
            <span className="text-spark-text">{task.appName}</span>
            <span className="text-xs text-spark-muted">({task.artifactType})</span>
          </div>
        ))}
      </div>

      {message.metadata?.actions && (
        <div className="flex flex-wrap gap-2">
          {message.metadata.actions.map((action) => (
            <button
              key={action.id}
              onClick={() => onAction(action.action)}
              className={action.variant === 'primary'
                ? 'px-4 py-1.5 rounded-lg bg-spark text-white text-sm hover:bg-orange-600 transition-colors'
                : 'px-4 py-1.5 rounded-lg border border-spark-border text-sm text-spark-muted hover:bg-gray-50 transition-colors'}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
