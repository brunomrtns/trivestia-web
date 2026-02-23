import type { Question, TextInputAnswer } from '@/types/api';

interface Props {
  question: Question;
  value: TextInputAnswer | null;
  onChange: (answer: TextInputAnswer) => void;
}

export function TextInputRenderer({ value, onChange }: Props) {
  return (
    <textarea
      rows={4}
      placeholder="Escreva sua resposta aqui..."
      value={value?.text ?? ''}
      onChange={(e) => onChange({ text: e.target.value })}
      className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2"
    />
  );
}
