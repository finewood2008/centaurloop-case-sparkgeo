import { useState } from 'react';
import { Cpu, ChevronDown, ChevronUp, Check, Loader2 } from 'lucide-react';
import { useRuntimeStatus } from '../hooks/useRuntimeStatus';

export function RuntimeDropdown() {
  const runtime = useRuntimeStatus();
  const [open, setOpen] = useState(false);

  const modeColor = runtime.mode === 'real' ? 'bg-green-500' : 'bg-amber-400';

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white shadow-lg border border-spark-border text-sm hover:shadow-xl transition-shadow"
      >
        <Cpu size={16} className="text-spark-muted" />
        <span className={`w-2 h-2 rounded-full ${modeColor}`} />
        <span className="text-spark-muted text-xs">
          {runtime.mode === 'real' ? runtime.model : 'Demo'}
        </span>
        {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-72 bg-white rounded-2xl shadow-xl border border-spark-border p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-spark-text">Runtime</span>
            <button
              onClick={() => runtime.rescan()}
              className="text-xs text-spark hover:underline"
            >
              Rescan
            </button>
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {runtime.connectors.map((c) => (
              <button
                key={c.id}
                onClick={async () => {
                  if (c.available && c.id !== runtime.selectedRuntimeId) {
                    await runtime.selectRuntime(c.id);
                  }
                }}
                disabled={!c.available || runtime.connectingRuntimeId === c.id}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                  c.id === runtime.selectedRuntimeId
                    ? 'bg-spark-light border border-spark/30'
                    : c.available
                      ? 'hover:bg-gray-50'
                      : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-spark-text">{c.label}</span>
                  {c.id === runtime.selectedRuntimeId && <Check size={14} className="text-spark" />}
                  {runtime.connectingRuntimeId === c.id && <Loader2 size={14} className="animate-spin text-spark" />}
                </div>
                <span className="text-xs text-spark-muted">{c.model}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
