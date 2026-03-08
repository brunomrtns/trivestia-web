import { Loader2, AlertTriangle, LockKeyhole } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ScenarioLoaderProps {
  error: string | null;
  onRetry?: () => void;
}

export function ScenarioLoader({ error, onRetry }: ScenarioLoaderProps) {
  const { t } = useTranslation();
  if (error === 'ALREADY_PASSED') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
          <LockKeyhole className="h-7 w-7 text-emerald-400" />
        </div>
        <h2 className="text-lg font-semibold">{t('sim.scenarioLoader.alreadyPassedTitle')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('sim.scenarioLoader.alreadyPassedDescription')}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/20">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold">{t('sim.scenarioLoader.errorTitle')}</h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-accent"
          >
            {t('sim.scenarioLoader.retryButton')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
