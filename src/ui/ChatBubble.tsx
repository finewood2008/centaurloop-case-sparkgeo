import type { LoopMessage, UserAction } from '../protocol/types';
import { PlanCard } from './PlanCard';
import { ContentCard } from './ContentCard';
import { FeedbackForm } from './FeedbackForm';
import { ReviewCard } from './ReviewCard';
import { MemoryCard } from './MemoryCard';

interface ChatBubbleProps {
  message: LoopMessage;
  onAction: (action: UserAction) => void;
}

export function ChatBubble({ message, onAction }: ChatBubbleProps) {
  const isHuman = message.role === 'human';
  const isSystem = message.role === 'system';

  if (message.type === 'plan_card' && message.metadata?.plan) {
    return (
      <div className="flex justify-start">
        <PlanCard message={message} onAction={onAction} />
      </div>
    );
  }

  if (message.type === 'draft_card' && message.metadata?.draft) {
    return (
      <div className="flex justify-start">
        <ContentCard message={message} onAction={onAction} />
      </div>
    );
  }

  if (message.type === 'feedback_request') {
    return (
      <div className="flex justify-start">
        <FeedbackForm message={message} onAction={onAction} />
      </div>
    );
  }

  if (message.type === 'review_card' && message.metadata?.review) {
    return (
      <div className="flex justify-start">
        <ReviewCard message={message} />
      </div>
    );
  }

  if (message.type === 'memory_card' && message.metadata?.memories) {
    return (
      <div className="flex justify-start">
        <MemoryCard message={message} onAction={onAction} />
      </div>
    );
  }

  if (message.type === 'progress') {
    return (
      <div className="flex justify-start">
        <div className="bg-gray-50 rounded-2xl px-4 py-3 max-w-[85%] text-sm text-spark-muted">
          {message.text}
        </div>
      </div>
    );
  }

  if (message.type === 'cycle_complete') {
    return (
      <div className="flex justify-start">
        <div className="bg-spark-light rounded-2xl px-4 py-3 max-w-[85%] border border-spark/20">
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
          {message.metadata?.actions && (
            <div className="flex flex-wrap gap-2 mt-3">
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
      </div>
    );
  }

  if (message.type === 'quick_actions' && message.metadata?.actions) {
    return (
      <div className="flex justify-start">
        <div className="bg-gray-50 rounded-2xl px-4 py-3 max-w-[85%]">
          <p className="text-sm mb-3">{message.text}</p>
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
        </div>
      </div>
    );
  }

  if (message.type === 'publish_card') {
    return (
      <div className="flex justify-start">
        <div className="bg-gray-50 rounded-2xl px-4 py-3 max-w-[85%]">
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
          {message.metadata?.actions && (
            <div className="flex flex-wrap gap-2 mt-3">
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
      </div>
    );
  }

  return (
    <div className={`flex ${isHuman ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`rounded-2xl px-4 py-2.5 max-w-[85%] text-sm whitespace-pre-wrap ${
          isHuman
            ? 'bg-spark text-white'
            : isSystem
              ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
              : 'bg-gray-100 text-spark-text'
        }`}
      >
        {message.text}
        {!isHuman && message.metadata?.actions && (
          <div className="flex flex-wrap gap-2 mt-3">
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
    </div>
  );
}
