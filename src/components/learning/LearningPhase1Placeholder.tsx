import { AlertTriangle } from 'lucide-react';

interface LearningPhase1PlaceholderProps {
  componentName: string;
}

export function LearningPhase1Placeholder({
  componentName
}: LearningPhase1PlaceholderProps) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div
        className="max-w-xl rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-900"
        role="alert"
      >
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-4 w-4" />
          Learning V2 placeholder active
        </div>
        <p className="text-sm">
          TODO(phase-2+): `{componentName}` is still a phase-1 placeholder and
          must not be treated as production-ready learning experience.
        </p>
      </div>
    </div>
  );
}
