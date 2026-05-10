import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { LoopMessage, UserAction } from '../protocol/types';
import { MarkdownContent } from './MarkdownContent';

interface ContentCardProps {
  message: LoopMessage;
  onAction: (action: UserAction) => void;
}

export function ContentCard({ message, onAction }: ContentCardProps) {
  const draft = message.metadata?.draft;
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!draft) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draft.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-spark-border p-4 max-w-[85%] w-full">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h4 className="font-semibold text-spark-text text-sm">{draft.title}</h4>
          <span className="text-xs px-2 py-0.5 bg-spark-light text-spark rounded-full">{draft.appName}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 p-1.5 rounded-lg text-spark-muted hover:bg-gray-100 transition-colors"
          title="Copy"
        >
          {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
        </button>
      </div>

      <div className="text-sm text-spark-text mt-2">
        {expanded ? (
          <MarkdownContent content={draft.content} compact />
        ) : (
          <p className="text-spark-muted">{message.text.split('\n').slice(2).join('\n')}</p>
        )}
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-spark mt-2 hover:underline"
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expanded ? '收起' : '展开全文'}
      </button>

      {message.metadata?.actions && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-spark-border">
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
