import { useMemo, useState } from 'react';
import { Check, Copy, FileText, Image, Sparkles, X } from 'lucide-react';
import { useLoopStore } from '../core/loopStore';
import { generateArticleImageAsset, type ArticleImageAsset } from '../spark/articleImageService';
import { useWorkspaceSettingsStore } from '../spark/workspaceSettings';
import { MarkdownContent } from './MarkdownContent';

interface ArticlePublisherProps {
  cycleId: string;
  onClose: () => void;
  onComplete: () => void;
}

export function ArticlePublisher({ cycleId, onClose, onComplete }: ArticlePublisherProps) {
  const cycle = useLoopStore((s) => s.cycles[cycleId]);
  const updateTask = useLoopStore((s) => s.updateTask);
  const imageSettings = useWorkspaceSettingsStore((s) => s.settings);
  const tasks = useMemo(
    () => cycle?.tasks.filter((task) => task.status === 'confirmed' || task.status === 'published' || task.status === 'feedback_done') ?? [],
    [cycle],
  );
  const [selectedTaskId, setSelectedTaskId] = useState(() => tasks[0]?.id ?? '');
  const [copiedTaskId, setCopiedTaskId] = useState('');
  const [copiedPromptTaskId, setCopiedPromptTaskId] = useState('');
  const [imageAssets, setImageAssets] = useState<Record<string, ArticleImageAsset>>({});
  const [publishedIds, setPublishedIds] = useState<Set<string>>(
    () => new Set(tasks.filter((task) => task.publish?.published).map((task) => task.id)),
  );

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0];
  const selectedImageAsset = selectedTask ? imageAssets[selectedTask.id] : undefined;
  const allPublished = tasks.length > 0 && tasks.every((task) => publishedIds.has(task.id));

  if (!cycle || tasks.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <p className="text-sm text-spark-muted">当前没有可发布的内容。</p>
          <button onClick={onClose} className="mt-4 rounded-xl bg-spark px-4 py-2 text-sm text-white">
            返回
          </button>
        </div>
      </div>
    );
  }

  const handleCopy = async (taskId: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedTaskId(taskId);
    setTimeout(() => setCopiedTaskId(''), 1600);
  };

  const markPublished = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    setPublishedIds((prev) => new Set(prev).add(taskId));
    updateTask(cycleId, taskId, {
      status: 'published',
      publish: {
        published: true,
        platform: task?.appName,
        publishedAt: new Date().toISOString(),
      },
    });
  };

  const generateImage = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task?.draft) return;
    const asset = generateArticleImageAsset({
      title: task.draft.title,
      appName: task.appName,
      content: task.draft.content,
      settings: imageSettings,
    });
    setImageAssets((prev) => ({ ...prev, [taskId]: asset }));
  };

  const copyImagePrompt = async (taskId: string, prompt: string) => {
    await navigator.clipboard.writeText(prompt);
    setCopiedPromptTaskId(taskId);
    setTimeout(() => setCopiedPromptTaskId(''), 1600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FAFAF8]">
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-spark-border bg-white px-5 py-3">
          <div>
            <h1 className="text-lg font-semibold text-spark-text">文章发布页</h1>
            <p className="text-xs text-spark-muted">检查排版，复制正文，到目标平台人工发布后标记完成</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-spark-muted transition-colors hover:bg-gray-100">
            <X size={20} />
          </button>
        </header>

        <main className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border-r border-spark-border bg-white p-4">
            <div className="mb-3 text-xs font-medium uppercase text-spark-muted">待发布内容</div>
            <div className="space-y-2">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${
                    selectedTask?.id === task.id
                      ? 'border-spark bg-spark-light'
                      : 'border-spark-border hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-spark-text">{task.appName}</span>
                    {publishedIds.has(task.id) && <Check size={15} className="text-green-600" />}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-spark-muted">{task.draft?.title}</p>
                </button>
              ))}
            </div>
          </aside>

          <section className="min-h-0 overflow-y-auto p-6">
            {selectedTask?.draft && (
              <div className="mx-auto max-w-3xl">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-spark-light px-2.5 py-1 text-xs font-medium text-spark">
                      <FileText size={14} />
                      {selectedTask.appName}
                    </div>
                    <h2 className="text-2xl font-bold text-spark-text">{selectedTask.draft.title}</h2>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => generateImage(selectedTask.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-spark-border bg-white px-4 py-2 text-sm text-spark-text transition-colors hover:bg-gray-50"
                    >
                      <Sparkles size={16} />
                      自动配图
                    </button>
                    <button
                      onClick={() => handleCopy(selectedTask.id, selectedTask.draft?.content ?? '')}
                      className="inline-flex items-center gap-2 rounded-xl border border-spark-border bg-white px-4 py-2 text-sm text-spark-text transition-colors hover:bg-gray-50"
                    >
                      {copiedTaskId === selectedTask.id ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                      {copiedTaskId === selectedTask.id ? '已复制' : '复制正文'}
                    </button>
                    <button
                      onClick={() => markPublished(selectedTask.id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-spark px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
                    >
                      <Check size={16} />
                      {publishedIds.has(selectedTask.id) ? '已标记发布' : '标记已发布'}
                    </button>
                  </div>
                </div>

                {selectedImageAsset && (
                  <div className="mb-4 rounded-2xl border border-spark-border bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2 text-sm font-semibold text-spark-text">
                        <Image size={16} className="text-spark" />
                        文章配图
                      </div>
                      <button
                        onClick={() => copyImagePrompt(selectedTask.id, selectedImageAsset.prompt)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-spark-border px-3 py-1.5 text-xs text-spark-muted hover:bg-gray-50"
                      >
                        {copiedPromptTaskId === selectedTask.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                        {copiedPromptTaskId === selectedTask.id ? '提示词已复制' : '复制图片提示词'}
                      </button>
                    </div>
                    <img
                      src={selectedImageAsset.dataUrl}
                      alt={`${selectedTask.draft.title} cover`}
                      className="w-full rounded-xl border border-spark-border"
                    />
                    <p className="mt-2 text-xs leading-5 text-spark-muted">
                      {selectedImageAsset.engine} · {selectedImageAsset.model} · {selectedImageAsset.style}
                    </p>
                  </div>
                )}

                <article className="rounded-2xl border border-spark-border bg-white p-6 shadow-sm">
                  <MarkdownContent content={selectedTask.draft.content} />
                </article>
              </div>
            )}
          </section>
        </main>

        <footer className="flex items-center justify-between border-t border-spark-border bg-white px-5 py-3">
          <p className="text-sm text-spark-muted">
            已标记 {publishedIds.size} / {tasks.length} 篇
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-xl border border-spark-border px-4 py-2 text-sm text-spark-muted hover:bg-gray-50">
              暂不完成
            </button>
            <button
              onClick={onComplete}
              disabled={!allPublished}
              className="rounded-xl bg-spark px-5 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-40"
            >
              完成发布，回到闭环
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
