import { AlertCircle } from 'lucide-react';

interface ActivityErrorStateProps {
  title: string;
  description: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function ActivityErrorState({
  title,
  description,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary
}: ActivityErrorStateProps) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-7 w-7 text-destructive" />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>

      {(onPrimary || onSecondary) && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {onSecondary && secondaryLabel && (
            <button
              type="button"
              onClick={onSecondary}
              className="rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              {secondaryLabel}
            </button>
          )}
          {onPrimary && primaryLabel && (
            <button
              type="button"
              onClick={onPrimary}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {primaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
