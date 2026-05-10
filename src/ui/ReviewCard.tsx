import type { LoopMessage } from '../protocol/types';

interface ReviewCardProps {
  message: LoopMessage;
}

export function ReviewCard({ message }: ReviewCardProps) {
  const review = message.metadata?.review;
  if (!review) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-spark-border p-4 max-w-[85%] w-full">
      <h3 className="font-semibold text-spark-text mb-3">📋 {review.summary}</h3>

      {review.effectivePoints.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-green-700 mb-1">有效点</h4>
          <ul className="space-y-1">
            {review.effectivePoints.map((p, i) => (
              <li key={i} className="text-sm text-spark-text flex items-start gap-1.5">
                <span className="text-green-500 mt-0.5">✅</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {review.ineffectivePoints.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-amber-700 mb-1">待改进</h4>
          <ul className="space-y-1">
            {review.ineffectivePoints.map((p, i) => (
              <li key={i} className="text-sm text-spark-text flex items-start gap-1.5">
                <span className="text-amber-500 mt-0.5">⚠️</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {review.dataHighlights.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-blue-700 mb-1">数据亮点</h4>
          <ul className="space-y-1">
            {review.dataHighlights.map((d, i) => (
              <li key={i} className="text-sm text-spark-text flex items-start gap-1.5">
                <span className="text-blue-500 mt-0.5">📈</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {review.nextSuggestion && (
        <div className="pt-3 border-t border-spark-border">
          <h4 className="text-xs font-medium text-spark mb-1">下轮建议</h4>
          <p className="text-sm text-spark-text">{review.nextSuggestion}</p>
        </div>
      )}
    </div>
  );
}
