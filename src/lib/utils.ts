import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(dateStr));
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

export function getProgressColor(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'text-green-500';
    case 'IN_PROGRESS':
      return 'text-yellow-500';
    default:
      return 'text-muted-foreground';
  }
}

export function getProgressLabel(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'Concluído';
    case 'IN_PROGRESS':
      return 'Em andamento';
    default:
      return 'Não iniciado';
  }
}

export function getActivityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    MULTIPLE_CHOICE: 'Múltipla Escolha',
    MULTIPLE_SELECT: 'Múltipla Seleção',
    TRUE_FALSE: 'Verdadeiro ou Falso',
    ORDERING: 'Ordenação',
    TEXT_INPUT: 'Resposta Aberta',
    SCENARIO: 'Cenário',
    CHART_MARKUP: 'Marcação de Gráfico',
    RISK_CALCULATOR: 'Calculadora de Risco',
    SIM_TRADING_CHALLENGE: 'Simulação de Trading'
  };
  return labels[type] ?? type;
}
