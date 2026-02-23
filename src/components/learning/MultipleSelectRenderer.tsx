import type { Question, MultiSelectAnswer } from '@/types/api';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Props {
  question: Question;
  value: MultiSelectAnswer | null;
  onChange: (answer: MultiSelectAnswer) => void;
}

export function MultipleSelectRenderer({ question, value, onChange }: Props) {
  const selected = value?.selectedOptionIds ?? [];

  const toggle = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    onChange({ selectedOptionIds: next });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Selecione todas que se aplicam</p>
      {question.options.map((opt) => {
        const isSelected = selected.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all',
              isSelected
                ? 'border-primary bg-primary/10 text-primary'
                : 'hover:border-primary/40 hover:bg-accent',
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
                isSelected ? 'border-primary bg-primary' : 'border-muted-foreground',
              )}
            >
              {isSelected && <Check className="h-3 w-3 text-white" />}
            </span>
            {opt.text}
          </button>
        );
      })}
    </div>
  );
}
