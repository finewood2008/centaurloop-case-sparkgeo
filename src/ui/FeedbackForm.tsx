import { useMemo, useState } from 'react';
import { Check, Link, Loader2, Sparkles } from 'lucide-react';
import { useLoopStore } from '../core/loopStore';
import type { LoopMessage, UserAction } from '../protocol/types';
import { analyzePublishedUrl, type PublishedFeedbackAnalysis } from '../spark/publishedFeedbackService';

interface FeedbackFormProps {
  message: LoopMessage;
  onAction: (action: UserAction) => void;
}

type AnalysisState = Record<string, PublishedFeedbackAnalysis>;
type ErrorState = Record<string, string>;

export function FeedbackForm({ message, onAction }: FeedbackFormProps) {
  const cycleId = message.metadata?.cycleId;
  const cycle = useLoopStore((s) => cycleId ? s.cycles[cycleId] : null);
  const tasks = useMemo(
    () => cycle?.tasks.filter((task) => task.status === 'published' || task.status === 'confirmed' || task.status === 'feedback_done') ?? [],
    [cycle],
  );

  const [urls, setUrls] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const task of tasks) initial[task.id] = task.feedback?.publishedUrl ?? '';
    return initial;
  });
  const [analyzingId, setAnalyzingId] = useState('');
  const [analyses, setAnalyses] = useState<AnalysisState>({});
  const [errors, setErrors] = useState<ErrorState>({});

  const analyzedCount = Object.keys(analyses).length;

  const analyzeTask = async (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    const url = urls[taskId]?.trim();
    if (!task || !url) return;

    setAnalyzingId(taskId);
    setErrors((prev) => ({ ...prev, [taskId]: '' }));

    try {
      const result = await analyzePublishedUrl({
        url,
        appName: task.appName,
        draftTitle: task.draft?.title,
        draftContent: task.draft?.content,
      });
      setAnalyses((prev) => ({ ...prev, [taskId]: result }));
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        [taskId]: error instanceof Error ? error.message : '抓取失败',
      }));
    } finally {
      setAnalyzingId('');
    }
  };

  const handleSubmit = () => {
    const taskFeedbacks = Object.entries(analyses).map(([taskId, analysis]) => ({
      taskId,
      publishedUrl: analysis.publishedUrl,
      platform: analysis.platform,
      views: analysis.views,
      likes: analysis.likes,
      favorites: analysis.favorites,
      comments: analysis.comments,
      shares: analysis.shares,
      completionRate: analysis.completionRate,
      rating: analysis.rating,
      note: [
        analysis.summary,
        analysis.signals.length > 0 ? `AI 信号：${analysis.signals.join('；')}` : '',
      ].filter(Boolean).join('\n'),
    }));

    onAction({
      type: 'submit_feedback',
      payload: { taskFeedbacks },
    });
  };

  return (
    <div className="w-full max-w-[90%] rounded-2xl border border-spark-border bg-white p-4 shadow-sm">
      <div className="mb-4">
        <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-spark-text">
          <Sparkles size={16} className="text-spark" />
          AI 自动抓取发布反馈
        </div>
        <p className="text-sm leading-6 text-spark-muted">{message.text}</p>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => {
          const analysis = analyses[task.id];
          const error = errors[task.id];
          const isAnalyzing = analyzingId === task.id;

          return (
            <div key={task.id} className="rounded-xl border border-spark-border p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-spark-text">{task.appName}</div>
                  <div className="line-clamp-1 text-xs text-spark-muted">{task.draft?.title}</div>
                </div>
                {analysis && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs text-green-700">
                    <Check size={13} />
                    已分析
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link className="absolute left-3 top-2.5 text-spark-muted" size={15} />
                  <input
                    type="url"
                    value={urls[task.id] ?? ''}
                    onChange={(event) => setUrls((prev) => ({ ...prev, [task.id]: event.target.value }))}
                    className="w-full rounded-xl border border-spark-border py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30"
                    placeholder="粘贴这篇内容发布后的链接"
                  />
                </div>
                <button
                  onClick={() => analyzeTask(task.id)}
                  disabled={isAnalyzing || !urls[task.id]?.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-spark px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-40"
                >
                  {isAnalyzing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  {isAnalyzing ? '抓取中' : 'AI 抓取反馈'}
                </button>
              </div>

              {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

              {analysis && (
                <div className="mt-3 rounded-xl bg-gray-50 p-3">
                  <p className="text-sm text-spark-text">{analysis.summary}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[
                      ['阅读', analysis.views],
                      ['点赞', analysis.likes],
                      ['收藏', analysis.favorites],
                      ['评论', analysis.comments],
                      ['转发', analysis.shares],
                    ].map(([label, value]) => (
                      value === undefined ? null : (
                        <span key={label} className="rounded-full bg-white px-2 py-1 text-xs text-spark-muted">
                          {label} {value}
                        </span>
                      )
                    ))}
                    <span className="rounded-full bg-white px-2 py-1 text-xs text-spark-muted">
                      评价 {analysis.rating === 'good' ? '好' : analysis.rating === 'bad' ? '差' : '一般'}
                    </span>
                  </div>
                  {analysis.signals.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {analysis.signals.map((signal, index) => (
                        <li key={index} className="text-xs text-spark-muted">- {signal}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-spark-border pt-3">
        <span className="text-xs text-spark-muted">已完成 {analyzedCount} / {tasks.length} 篇链接反馈分析</span>
        <div className="flex gap-2">
          {message.metadata?.actions?.map((action) => (
            <button
              key={action.id}
              onClick={() => onAction(action.action)}
              className="rounded-lg border border-spark-border px-4 py-1.5 text-sm text-spark-muted transition-colors hover:bg-gray-50"
            >
              {action.label}
            </button>
          ))}
          <button
            onClick={handleSubmit}
            disabled={tasks.length === 0 || analyzedCount < tasks.length}
            className="rounded-lg bg-spark px-4 py-1.5 text-sm text-white transition-colors hover:bg-orange-600 disabled:opacity-40"
          >
            提交 AI 反馈
          </button>
        </div>
      </div>
    </div>
  );
}
