import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';

interface SearchOverlayProps {
  onClose: () => void;
  onSearch: (symbol: string) => void;
}

export function SearchOverlay({ onClose, onSearch }: SearchOverlayProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim().toUpperCase());
      onClose();
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center pt-20 bg-background/20 backdrop-blur-[2px]">
      <div className="w-full max-w-lg mx-4 bg-card border border-border rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-200">
        <form onSubmit={handleSubmit} className="flex items-center gap-3 p-4">
          <Search className="h-5 w-5 text-primary" />
          <input
            autoFocus
            type="text"
            placeholder={t('sim.terminal.search.placeholder')}
            className="flex-1 bg-transparent border-none focus:ring-0 text-base font-bold text-foreground placeholder:text-muted-foreground"
            value={query}
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
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            {t('sim.terminal.search.recentTitle')}
          </div>
          <div className="flex flex-wrap gap-2">
            {['BTC/USD', 'ETH/USD', 'EUR/USD', 'AAPL', 'TSLA'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onSearch(s);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg border border-border bg-muted/30 text-xs font-bold hover:bg-muted transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
