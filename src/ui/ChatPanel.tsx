import { useState, useRef, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';
import { useI18n } from '../i18n';
import { SPARK_GEO_LOOP_CONFIG } from '../core/loopConfigs';
import { LoopChatController } from '../protocol/loopChat';
import type { LoopChatSession, UserAction } from '../protocol/types';
import { ChatBubble } from './ChatBubble';
import { LoopProgress } from './LoopProgress';

interface ChatPanelProps {
  onOpenPublisher?: (cycleId: string) => void;
  publishDoneSignal?: number;
}

export function ChatPanel({ onOpenPublisher, publishDoneSignal = 0 }: ChatPanelProps) {
  const { locale, t } = useI18n();
  const [session, setSession] = useState<LoopChatSession | null>(null);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const controllerRef = useRef<LoopChatController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const handledPublishSignalRef = useRef(0);

  useEffect(() => {
    const ctrl = new LoopChatController(SPARK_GEO_LOOP_CONFIG, setSession, locale);
    controllerRef.current = ctrl;
    setSession(ctrl.getSession());
  }, [locale]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages.length]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !controllerRef.current || isProcessing) return;
    const text = input.trim();
    setInput('');
    setIsProcessing(true);
    try {
      await controllerRef.current.handleUserInput(text);
    } finally {
      setIsProcessing(false);
    }
  }, [input, isProcessing]);

  const handleAction = useCallback(async (action: UserAction) => {
    if (!controllerRef.current || isProcessing) return;
    if (action.type === 'open_publish_page') {
      const cycleId = controllerRef.current.getSession().cycleId;
      if (cycleId) onOpenPublisher?.(cycleId);
      return;
    }
    setIsProcessing(true);
    try {
      await controllerRef.current.handleAction(action);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, onOpenPublisher]);

  useEffect(() => {
    if (publishDoneSignal <= 0 || !controllerRef.current || isProcessing) return;
    if (handledPublishSignalRef.current === publishDoneSignal) return;
    handledPublishSignalRef.current = publishDoneSignal;
    setIsProcessing(true);
    controllerRef.current.handleAction({ type: 'mark_published' })
      .finally(() => setIsProcessing(false));
  }, [publishDoneSignal, isProcessing]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const isIdle = !session || session.status === 'idle' || session.status === 'complete';

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      <LoopProgress />
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {session?.messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} onAction={handleAction} />
        ))}
        {isProcessing && (
          <div className="flex items-center gap-2 text-spark-muted text-sm">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-spark rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-spark rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-spark rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-spark-border bg-white px-4 py-3">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isIdle ? t('chat.placeholderIdle') : t('chat.placeholderRunning')}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-spark-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-spark/30 focus:border-spark bg-white"
            style={{ minHeight: '42px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-spark text-white flex items-center justify-center hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-xs text-spark-muted mt-1 text-center">{t('chat.hint')}</p>
      </div>
    </div>
  );
}
