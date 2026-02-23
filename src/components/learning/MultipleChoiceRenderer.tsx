import type { Question, SingleSelectAnswer } from '@/types/api';
import { cn } from '@/lib/utils';

interface Props {
  question: Question;
  value: SingleSelectAnswer | null;
  onChange: (answer: SingleSelectAnswer) => void;
  trueFalse?: boolean; // limita as opções a 2 (TRUE_FALSE / SCENARIO)
}

export function MultipleChoiceRenderer({ question, value, onChange, trueFalse }: Props) {
  const options = trueFalse ? question.options.slice(0, 2) : question.options;

  return (
    <div className="space-y-3">
      {options.map((opt) => {
        const selected = value?.selectedOptionId === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange({ selectedOptionId: opt.id })}
            className={cn(
              'w-full rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all',
              selected
                ? 'border-primary bg-primary/10 text-primary'
                : 'hover:border-primary/40 hover:bg-accent',
            )}
          >
            <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold">
              {String.fromCharCode(65 + question.options.indexOf(opt))}
            </span>
            {opt.text}
          </button>
        );
      })}
    </div>
  );
}
