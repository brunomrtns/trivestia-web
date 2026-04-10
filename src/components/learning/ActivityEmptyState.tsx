import { FileQuestion } from 'lucide-react';

export function ActivityEmptyState() {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="h-7 w-7 text-muted-foreground/60" />
      </div>
      <p className="text-base font-medium">Atividade sem questões</p>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Esta atividade ainda não possui perguntas disponíveis.
      </p>
    </div>
  );
}
