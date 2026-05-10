import { useState } from 'react';
import type { LoopMessage, UserAction } from '../protocol/types';

interface MemoryCardProps {
  message: LoopMessage;
  onAction: (action: UserAction) => void;
}

export function MemoryCard({ message, onAction }: MemoryCardProps) {
  const memories = message.metadata?.memories ?? [];
  const [decisions, setDecisions] = useState<Record<string, 'confirmed' | 'rejected'>>({});

  const toggleMemory = (id: string) => {
    setDecisions((prev) => ({
      ...prev,
      [id]: prev[id] === 'confirmed' ? 'rejected' : 'confirmed',
    }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-spark-border p-4 max-w-[85%] w-full">
      <p className="text-sm mb-3">{message.text}</p>

      <div className="space-y-2 mb-4">
        {memories.map((mem) => {
          const decided = decisions[mem.id];
          return (
            <div
              key={mem.id}
              onClick={() => toggleMemory(mem.id)}
              className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                decided === 'rejected'
                  ? 'bg-gray-50 opacity-50 line-through'
                  : decided === 'confirmed'
                    ? 'bg-spark-light'
                    : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <span className="text-sm mt-0.5">{decided === 'rejected' ? '❌' : '💡'}</span>
              <div>
                <p className="text-sm text-spark-text">{mem.content}</p>
                <span className="text-xs text-spark-muted">{mem.category}</span>
              </div>
            </div>
          );
        })}
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
