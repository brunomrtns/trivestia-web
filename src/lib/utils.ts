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


