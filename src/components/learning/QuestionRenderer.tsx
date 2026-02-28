import { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';
import type { ActivityType, Question, Answer } from '@/types/api';
import { MultipleChoiceRenderer } from './MultipleChoiceRenderer';
import { MultipleSelectRenderer } from './MultipleSelectRenderer';
import { TextInputRenderer } from './TextInputRenderer';
import { OrderingRenderer } from './OrderingRenderer';
import { ChartMarkupRenderer } from './ChartMarkupRenderer';
import { RiskCalculatorRenderer } from './RiskCalculatorRenderer';
import type {
  SingleSelectAnswer,
  MultiSelectAnswer,
  TextInputAnswer,
  OrderingAnswer,
  ChartMarkupAnswer,
  RiskCalculatorAnswer,
  ChartMarkupFeedback,
  RiskCalculatorFeedback
} from '@/types/api';

interface Props {
  activityType: ActivityType;
  question: Question;
  value: Answer | null;
  onChange: (answer: Answer) => void;
  feedback?: Record<string, unknown> | null;
}

// ─── Lightbox simples para imagem da questão ─────────────────────────────────

function QuestionImage({ url }: { url: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="relative my-3 overflow-hidden rounded-xl border bg-muted/30">
        <img
          src={url}
          alt="Imagem da questão"
          className="max-h-64 w-full cursor-zoom-in object-contain transition-opacity hover:opacity-90"
          onClick={() => setOpen(true)}
        />
        <button
          onClick={() => setOpen(true)}
          className="absolute right-2 top-2 rounded-lg bg-black/40 p-1.5 text-white backdrop-blur-sm hover:bg-black/60"
          title="Ampliar imagem"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={url}
            alt="Imagem da questão — ampliada"
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

/**
 * Dispatcher central: renderiza o renderer correto com base em activity.type.
 * Não existe Question.type — o tipo é herdado da Activity.
 * Se question.imageUrl estiver preenchido, exibe a imagem acima do renderer.
 */
export function QuestionRenderer({
  activityType,
  question,
  value,
  onChange,
  feedback
}: Props) {
  const questionImage =
    question.imageUrl && activityType !== 'CHART_MARKUP' ? (
      <QuestionImage url={question.imageUrl} />
    ) : null;

  const renderer = (() => {
    switch (activityType) {
      case 'MULTIPLE_CHOICE':
        return (
          <MultipleChoiceRenderer
            question={question}
            value={value as SingleSelectAnswer | null}
            onChange={onChange}
          />
        );

      case 'TRUE_FALSE':
      case 'SCENARIO':
        return (
          <MultipleChoiceRenderer
            question={question}
            value={value as SingleSelectAnswer | null}
            onChange={onChange}
            trueFalse={activityType === 'TRUE_FALSE'}
          />
        );

      case 'MULTIPLE_SELECT':
        return (
          <MultipleSelectRenderer
            question={question}
            value={value as MultiSelectAnswer | null}
            onChange={onChange}
          />
        );

      case 'ORDERING':
        return (
          <OrderingRenderer
            question={question}
            value={value as OrderingAnswer | null}
            onChange={onChange}
          />
        );

      case 'TEXT_INPUT':
        return (
          <TextInputRenderer
            question={question}
            value={value as TextInputAnswer | null}
            onChange={onChange}
          />
        );

      case 'CHART_MARKUP':
        // ChartMarkup já gerencia sua própria imagem internamente
        return (
          <ChartMarkupRenderer
            question={question}
            value={value as ChartMarkupAnswer | null}
            onChange={onChange}
            feedback={feedback as ChartMarkupFeedback | null}
          />
        );

      case 'RISK_CALCULATOR':
        return (
          <RiskCalculatorRenderer
            question={question}
            value={value as RiskCalculatorAnswer | null}
            onChange={onChange}
            feedback={feedback as RiskCalculatorFeedback | null}
          />
        );

      default:
        return (
          <p className="text-sm text-muted-foreground">
            Tipo de questão não suportado: {activityType}
          </p>
        );
    }
  })();

  return (
    <div>
      {questionImage}
      {renderer}
    </div>
  );
}

