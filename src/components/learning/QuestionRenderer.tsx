import type { ActivityType, Question, Answer } from '@/types/api';
import { MultipleChoiceRenderer } from './MultipleChoiceRenderer';
import { MultipleSelectRenderer } from './MultipleSelectRenderer';
import { TextInputRenderer } from './TextInputRenderer';
import { OrderingRenderer } from './OrderingRenderer';
import type {
  SingleSelectAnswer,
  MultiSelectAnswer,
  TextInputAnswer,
  OrderingAnswer
} from '@/types/api';

interface Props {
  activityType: ActivityType;
  question: Question;
  value: Answer | null;
  onChange: (answer: Answer) => void;
}

/**
 * Dispatcher central: renderiza o renderer correto com base em activity.type.
 * Não existe Question.type — o tipo é herdado da Activity.
 */
export function QuestionRenderer({
  activityType,
  question,
  value,
  onChange
}: Props) {
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

    default:
      return (
        <p className="text-sm text-muted-foreground">
          Tipo de questão não suportado: {activityType}
        </p>
      );
  }
}
