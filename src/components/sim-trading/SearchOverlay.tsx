import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, AlertCircle } from 'lucide-react';

interface SearchOverlayProps {
  onClose: () => void;
  onSearch: (symbol: string) => boolean | Promise<boolean>;
  supportedSymbols?: string[];
  activeSymbol?: string;
  loading?: boolean;
  // Phase 1: Symbol switching mode control
  challengeMode?: boolean;
  allowSymbolSwitching?: boolean;
}

const RECENT_SYMBOLS = ['BTC/USD', 'ETH/USD', 'EUR/USD', 'AAPL', 'TSLA'];

export function SearchOverlay({
  onClose,
  onSearch,
  supportedSymbols = [],
  activeSymbol,
  loading = false,
  challengeMode = false,
  allowSymbolSwitching = true
}: SearchOverlayProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const supportedSet = new Set(supportedSymbols.map((s) => s.toUpperCase()));
  const normalizedActiveSymbol = activeSymbol?.toUpperCase();

  // Phase 1: Challenge mode with switching disabled — show locked state
  const isLocked = challengeMode && !allowSymbolSwitching;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !loading && !isLocked) {
      const maybeHandled = onSearch(query.trim().toUpperCase());
      if (typeof maybeHandled === 'boolean') {
        if (maybeHandled) onClose();
        return;
      }
      maybeHandled.then((handled) => {
        if (handled) onClose();
      });
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center pt-20 bg-background/20 backdrop-blur-[2px]">
      <div className="w-full max-w-lg mx-4 bg-card border border-border rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-200">
        {/* Locked State: CHALLENGE with switching disabled */}
        {isLocked ? (
          <div className="p-6 text-center space-y-4">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">
              {t('sim.terminal.symbolLocked')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('sim.terminal.symbolLockedMessage')}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 p-2 rounded-lg hover:bg-muted text-muted-foreground transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <>
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-3 p-4"
            >
              <Search className="h-5 w-5 text-primary" />
              <input
                autoFocus
                type="text"
                placeholder={t('sim.terminal.search.placeholder')}
                className="flex-1 bg-transparent border-none focus:ring-0 text-base font-bold text-foreground placeholder:text-muted-foreground"
                value={query}
                disabled={loading}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            </form>

            <div className="px-4 pb-4">
              {normalizedActiveSymbol && (
                <div className="mb-3 text-[11px] font-semibold text-muted-foreground">
                  {t('sim.terminal.activeSymbolLabel')}:&nbsp;
                  <span className="rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 font-bold text-primary">
                    {normalizedActiveSymbol}
                  </span>
                </div>
              )}

              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                {t('sim.terminal.search.recentTitle')}
              </div>
              <div className="flex flex-wrap gap-2">
                {RECENT_SYMBOLS.map((s) => {
                  const isSupported = supportedSet.has(s.toUpperCase());
                  const isActive = normalizedActiveSymbol === s.toUpperCase();
                  const isButtonDisabled = !isSupported || loading;

                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={isButtonDisabled}
                      onClick={() => {
                        const maybeHandled = onSearch(s);
                        if (typeof maybeHandled === 'boolean') {
                          if (maybeHandled) onClose();
                          return;
                        }
                        maybeHandled.then((handled) => {
                          if (handled) onClose();
                        });
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                        isActive
                          ? 'border-primary/60 bg-primary/15 text-primary'
                          : isSupported
                            ? 'border-border bg-muted/30 hover:bg-muted'
                            : 'border-border/40 bg-muted/10 text-muted-foreground/60 cursor-not-allowed'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
