import { useState, useEffect, useRef } from 'react';
import { Settings, Globe, BookOpen } from 'lucide-react';
import { useI18n } from '../i18n';
import { useLoopStore } from '../core/loopStore';
import { SPARK_GEO_LOOP_CONFIG } from '../core/loopConfigs';
import { ChatPanel } from './ChatPanel';
import { SettingsPanel } from './SettingsPanel';
import { RuntimeDropdown } from './RuntimeDropdown';
import { MemoryPanel } from './MemoryPanel';
import { ArticlePublisher } from './ArticlePublisher';

export function SparkShell() {
  const { t, toggleLocale } = useI18n();
  const [showSettings, setShowSettings] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
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
    <div className="flex flex-col h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-spark-border bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <span className="text-lg font-semibold text-spark-text">{t('app.title')}</span>
          <span className="text-xs text-spark-muted hidden sm:inline">{t('app.tagline')}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMemory(true)}
            className="p-2 rounded-lg text-spark-muted hover:bg-gray-100 transition-colors"
            title="记忆"
          >
            <BookOpen size={18} />
          </button>
          <button
            onClick={toggleLocale}
            className="p-2 rounded-lg text-spark-muted hover:bg-gray-100 transition-colors"
            title={t('app.language')}
          >
            <Globe size={18} />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg text-spark-muted hover:bg-gray-100 transition-colors"
            title={t('settings.title')}
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Main Chat */}
      <div className="flex-1 overflow-hidden">
        <ChatPanel
          onOpenPublisher={setPublisherCycleId}
          publishDoneSignal={publishDoneSignal}
        />
      </div>

      {/* Runtime Dropdown */}
      <RuntimeDropdown />

      {/* Panels */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      <MemoryPanel open={showMemory} onClose={() => setShowMemory(false)} />
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
