import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IndicatorsPanelProps {
  onClose: () => void;
  activeIndicators: {
    ma: boolean;
    ema: boolean;
    rsi: boolean;
  };
  onToggle: (id: 'ma' | 'ema' | 'rsi') => void;
}

export function IndicatorsPanel({
  onClose,
  activeIndicators,
  onToggle
}: IndicatorsPanelProps) {
  const { t } = useTranslation();

  const indicators = [
    {
      id: 'ma',
      nameKey: 'sim.terminal.indicatorsPanel.items.ma.name',
      descriptionKey: 'sim.terminal.indicatorsPanel.items.ma.description',
      color: '#f59e0b'
    },
    {
      id: 'ema',
      nameKey: 'sim.terminal.indicatorsPanel.items.ema.name',
      descriptionKey: 'sim.terminal.indicatorsPanel.items.ema.description',
      color: '#8b5cf6'
    },
    {
      id: 'rsi',
      nameKey: 'sim.terminal.indicatorsPanel.items.rsi.name',
      descriptionKey: 'sim.terminal.indicatorsPanel.items.rsi.description',
      color: '#3b82f6'
    }
  ] as const;

  return (
    <div className="absolute top-4 right-4 z-40 w-80 bg-card border border-border rounded-xl shadow-2xl animate-in slide-in-from-right-4 fade-in duration-300">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
          {t('sim.terminal.indicatorsPanel.title')}
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-2 space-y-1">
        {indicators.map((ind) => {
          const isActive = activeIndicators[ind.id];
          return (
            <button
              key={ind.id}
              onClick={() => onToggle(ind.id)}
              className={cn(
                'w-full flex items-center justify-between p-3 rounded-lg text-left transition',
                isActive
                  ? 'bg-primary/10 border-primary/20 shadow-sm'
                  : 'hover:bg-muted'
              )}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: ind.color }}
                  />
                  <span className="text-xs font-bold">{t(ind.nameKey)}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {t(ind.descriptionKey)}
                </p>
              </div>
              {isActive && <Check className="h-4 w-4 text-primary" />}
            </button>
          );
        })}
      </div>

      <div className="p-4 bg-muted/30 rounded-b-xl border-t border-border">
        <p className="text-[10px] text-muted-foreground text-center italic">
          {t('sim.terminal.indicatorsPanel.hint')}
        </p>
      </div>
    </div>
  );
}
