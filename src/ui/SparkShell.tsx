import { useState, useEffect, useRef } from 'react';
import { Settings } from 'lucide-react';
import { useI18n } from '../i18n';
import { useLoopStore } from '../core/loopStore';
import { SPARK_GEO_LOOP_CONFIG } from '../core/loopConfigs';
import { ChatPanel } from './ChatPanel';
import { SettingsPanel } from './SettingsPanel';
import { MemoryPanel } from './MemoryPanel';
import { ArticlePublisher } from './ArticlePublisher';

export function SparkShell() {
  const { t } = useI18n();
  const [showSettings, setShowSettings] = useState(false);
  const [publisherCycleId, setPublisherCycleId] = useState<string | null>(null);
  const [publishDoneSignal, setPublishDoneSignal] = useState(0);
  const registered = useRef(false);

  useEffect(() => {
    if (!registered.current) {
      useLoopStore.getState().registerLoop(SPARK_GEO_LOOP_CONFIG);
      registered.current = true;
    }
  }, []);

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-[#FAFAF8] pt-[env(safe-area-inset-top)]">
      {/* Header */}
      <header className="shrink-0 border-b border-spark-border bg-white/80 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-none items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <span className="text-lg font-semibold text-spark-text">{t('app.title')}</span>
            <span className="text-xs text-spark-muted hidden sm:inline">{t('app.tagline')}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg text-spark-muted hover:bg-gray-100 transition-colors"
              title={t('settings.title')}
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main workspace */}
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_420px] overflow-hidden">
        <div className="min-w-0 overflow-hidden">
          <ChatPanel
            onOpenPublisher={setPublisherCycleId}
            publishDoneSignal={publishDoneSignal}
          />
        </div>
        <MemoryPanel />
      </div>

      {/* Panels */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      {publisherCycleId && (
        <ArticlePublisher
          cycleId={publisherCycleId}
          onClose={() => setPublisherCycleId(null)}
          onComplete={() => {
            setPublisherCycleId(null);
            setPublishDoneSignal((value) => value + 1);
          }}
        />
      )}
    </div>
  );
}
