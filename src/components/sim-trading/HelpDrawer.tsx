import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Portal } from '@/components/ui/Portal';
import {
  X,
  HelpCircle,
  BookOpen,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  DollarSign,
  BarChart3,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Props ────────────────────────────────────────────────────────────────────

interface HelpDrawerProps {
  open: boolean;
  onClose: () => void;
  onRestartTutorial?: () => void;
}

// ─── Glossary ─────────────────────────────────────────────────────────────────

interface GlossaryEntry {
  key: string;
  icon?: React.ReactNode;
  category: 'ordens' | 'conceitos' | 'indicadores';
}

const GLOSSARY: GlossaryEntry[] = [
  // Ordens
  {
    key: 'buy',
    icon: <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />,
    category: 'ordens'
  },
  {
    key: 'sell',
    icon: <TrendingDown className="h-3.5 w-3.5 text-red-400" />,
    category: 'ordens'
  },
  {
    key: 'market',
    icon: <DollarSign className="h-3.5 w-3.5 text-primary" />,
    category: 'ordens'
  },
  {
    key: 'limit',
    icon: <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />,
    category: 'ordens'
  },
  {
    key: 'stop',
    icon: <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />,
    category: 'ordens'
  },
  {
    key: 'sl',
    icon: <ShieldCheck className="h-3.5 w-3.5 text-red-400" />,
    category: 'ordens'
  },
  {
    key: 'tp',
    icon: <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />,
    category: 'ordens'
  },
  // Conceitos
  {
    key: 'pnl',
    icon: <DollarSign className="h-3.5 w-3.5 text-foreground" />,
    category: 'conceitos'
  },
  {
    key: 'equity',
    icon: <BarChart3 className="h-3.5 w-3.5 text-primary" />,
    category: 'conceitos'
  },
  {
    key: 'position',
    icon: <BarChart3 className="h-3.5 w-3.5 text-foreground" />,
    category: 'conceitos'
  },
  {
    key: 'fee',
    icon: <DollarSign className="h-3.5 w-3.5 text-orange-400" />,
    category: 'conceitos'
  },
  {
    key: 'slippage',
    icon: <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />,
    category: 'conceitos'
  },
  {
    key: 'spread',
    icon: <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />,
    category: 'conceitos'
  },
  // Indicadores
  {
    key: 'drawdown',
    icon: <AlertTriangle className="h-3.5 w-3.5 text-red-400" />,
    category: 'indicadores'
  },
  {
    key: 'winrate',
    icon: <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />,
    category: 'indicadores'
  },
  {
    key: 'sharpe',
    icon: <BarChart3 className="h-3.5 w-3.5 text-blue-400" />,
    category: 'indicadores'
  },
  {
    key: 'profitfactor',
    icon: <DollarSign className="h-3.5 w-3.5 text-emerald-400" />,
    category: 'indicadores'
  }
];

const CATEGORIES = [
  { key: 'ordens' as const, i18nKey: 'orders', icon: BookOpen },
  { key: 'conceitos' as const, i18nKey: 'concepts', icon: HelpCircle },
  { key: 'indicadores' as const, i18nKey: 'indicators', icon: BarChart3 }
];

// ─── Component ────────────────────────────────────────────────────────────────

export function HelpDrawer({
  open,
  onClose,
  onRestartTutorial
}: HelpDrawerProps) {
  const { t } = useTranslation();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    'ordens'
  );

  if (!open) return null;

  return (
    <Portal>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold">{t('sim.help.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Quick tips */}
          <div className="border-b px-4 py-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t('sim.help.quickTipsTitle')}
            </h3>
            <div className="space-y-2 text-sm">
              <QuickTip emoji="" text={t('sim.help.quickTips.tip1')} />
              <QuickTip emoji="" text={t('sim.help.quickTips.tip2')} />
              <QuickTip emoji="" text={t('sim.help.quickTips.tip3')} />
              <QuickTip emoji="" text={t('sim.help.quickTips.tip4')} />
              <QuickTip emoji="" text={t('sim.help.quickTips.tip5')} />
              <QuickTip emoji="" text={t('sim.help.quickTips.tip6')} />
            </div>
          </div>

          {/* Glossary accordion */}
          <div className="px-4 py-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t('sim.help.glossaryTitle')}
            </h3>

            {CATEGORIES.map((cat) => {
              const items = GLOSSARY.filter((g) => g.category === cat.key);
              const isExpanded = expandedCategory === cat.key;

              return (
                <div key={cat.key} className="mb-2">
                  <button
                    onClick={() =>
                      setExpandedCategory(isExpanded ? null : cat.key)
                    }
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-accent"
                  >
                    <cat.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-left">
                      {t(`sim.help.categories.${cat.i18nKey}`)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {items.length}
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 text-muted-foreground transition-transform',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  </button>

                  {isExpanded && (
                    <div className="mt-1 space-y-1.5 pl-2">
                      {items.map((entry) => (
                        <div
                          key={entry.key}
                          className="rounded-lg border bg-card p-3"
                        >
                          <div className="flex items-center gap-2">
                            {entry.icon}
                            <span className="text-sm font-semibold">
                              {t(`sim.help.glossary.${entry.key}.term`)}
                            </span>
                          </div>
                          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                            {t(`sim.help.glossary.${entry.key}.description`)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-3">
          {onRestartTutorial && (
            <button
              onClick={() => {
                onRestartTutorial();
                onClose();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-accent"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t('sim.help.restartTutorialButton')}
            </button>
          )}
        </div>
      </div>
    </Portal>
  );
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function QuickTip({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2">
      <span className="text-base">{emoji}</span>
      <span className="text-muted-foreground">{text}</span>
    </div>
  );
}
