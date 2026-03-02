import { Clock, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { LessonUnlockDTO } from '@/types/api';

interface Props {
  unlock: LessonUnlockDTO;
  className?: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function LessonLockBadge({ unlock, className = '' }: Props) {
  if (unlock.unlocked) return null;

  switch (unlock.reason) {
    case 'COURSE_EXPIRED':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive ${className}`}
          title="O prazo deste curso foi encerrado."
        >
          <AlertTriangle className="h-3 w-3" />
          Prazo encerrado
        </span>
      );

    case 'NOT_AVAILABLE_YET': {
      const availableFrom = unlock.detail?.availableFrom as string | undefined;
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 ${className}`}
          title={availableFrom ? `Disponível em ${formatDate(availableFrom)}` : 'Ainda não disponível'}
        >
          <Clock className="h-3 w-3" />
          {availableFrom
            ? `Disponível em ${formatDate(availableFrom)}`
            : 'Ainda não disponível'}
        </span>
      );
    }

    case 'PREREQUISITE_NOT_MET': {
      const title = unlock.detail?.prerequisiteLessonTitle as string | undefined;
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-600 dark:text-orange-400 ${className}`}
          title={title ? `Complete "${title}" primeiro` : 'Complete o pré-requisito primeiro'}
        >
          <CheckCircle2 className="h-3 w-3" />
          {title ? `Complete "${title}"` : 'Pré-requisito pendente'}
        </span>
      );
    }

    case 'PREVIOUS_LESSON_INCOMPLETE':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ${className}`}
          title="Complete a aula anterior para continuar."
        >
          <Lock className="h-3 w-3" />
          Complete a aula anterior
        </span>
      );

    default:
      return null;
  }
}
