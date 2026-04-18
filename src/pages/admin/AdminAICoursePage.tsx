import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Sparkles,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { aiCourseEndpoints } from '@/services/endpoints/ai-course.endpoints';
import type { CourseGenStatus, CourseGenerationRequest } from '@/types/api';

function getApiErrorMessage(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined;
  }
  const withResponse = error as { response?: { data?: { message?: string } } };
  return withResponse.response?.data?.message;
}

const STATUS_CONFIG: Record<
  CourseGenStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: 'Aguardando processamento',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    icon: <Clock className="h-4 w-4" />,
  },
  PROCESSING: {
    label: 'Gerando curso...',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
  },
  IMPORTING: {
    label: 'Importando para plataforma...',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    icon: <RefreshCw className="h-4 w-4 animate-spin" />,
  },
  COMPLETED: {
    label: 'Curso gerado com sucesso!',
    color: 'text-green-600 bg-green-50 border-green-200',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  FAILED: {
    label: 'Falha na geração',
    color: 'text-red-600 bg-red-50 border-red-200',
    icon: <XCircle className="h-4 w-4" />,
  },
};

function StatusBadge({ status }: { status: CourseGenStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${config.color}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

function RequestTimeline({
  history,
}: {
  history: CourseGenerationRequest['statusHistory'];
}) {
  return (
    <div className="space-y-2">
      {history.map((entry, i) => (
        <div key={entry.id} className="flex items-start gap-3">
          <div className="mt-1.5 h-2 w-2 rounded-full bg-current text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{STATUS_CONFIG[entry.status].label}</p>
            {entry.detail && (
              <p className="text-xs text-muted-foreground">{entry.detail}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {new Date(entry.createdAt).toLocaleString('pt-BR')}
            </p>
          </div>
          {i < history.length - 1 && (
            <div className="absolute ml-1 mt-3 h-4 w-px bg-border" />
          )}
        </div>
      ))}
    </div>
  );
}

function RequestCard({ request }: { request: CourseGenerationRequest }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <StatusBadge status={request.status} />
            <span className="text-xs text-muted-foreground">
              {new Date(request.createdAt).toLocaleString('pt-BR')}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {request.briefing}
          </p>
          {request.errorMessage && (
            <p className="mt-1 text-xs text-red-500">{request.errorMessage}</p>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-2 text-xs text-muted-foreground hover:text-foreground"
        >
          {expanded ? 'Recolher' : 'Detalhes'}
        </button>
      </div>
      {expanded && (
        <div className="mt-3 border-t pt-3">
          <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Histórico
          </h4>
          <RequestTimeline history={request.statusHistory} />
        </div>
      )}
    </div>
  );
}

type FormData = {
  briefing: string;
  includeVideo: boolean;
};

export default function AdminAICoursePage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const slug = tenantSlug ?? '';
  const qc = useQueryClient();

  const availabilityQuery = useQuery({
    queryKey: ['ai-course-availability', slug],
    queryFn: () => aiCourseEndpoints.getAvailability(slug),
    enabled: !!slug,
  });

  const requestsQuery = useQuery({
    queryKey: ['ai-course-requests', slug],
    queryFn: () => aiCourseEndpoints.listRequests(slug),
    enabled: !!slug,
    refetchInterval: 30_000,
  });

  const hasActiveRequest = requestsQuery.data?.some((r) =>
    ['PENDING', 'PROCESSING', 'IMPORTING'].includes(r.status)
  );

  const schema = z.object({
    briefing: z
      .string()
      .min(20, 'Descreva o curso com pelo menos 20 caracteres')
      .max(2000, 'O briefing deve ter no máximo 2000 caracteres'),
    includeVideo: z.boolean().default(false),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      includeVideo: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      aiCourseEndpoints.createRequest(slug, data.briefing, data.includeVideo),
    onSuccess: () => {
      toast.success('Solicitação de curso criada com sucesso!');
      reset();
      qc.invalidateQueries({ queryKey: ['ai-course-requests', slug] });
    },
    onError: (error: unknown) => {
      toast.error(
        getApiErrorMessage(error) ?? 'Erro ao criar solicitação de curso'
      );
    },
  });

  const isEnabled = availabilityQuery.data?.enabled ?? false;
  const isLoading =
    availabilityQuery.isLoading || requestsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Gerar Curso com IA</h1>
          <p className="text-sm text-muted-foreground">
            Crie um curso completo automaticamente usando inteligência artificial
          </p>
        </div>
      </div>

      {!isEnabled ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-yellow-500" />
          <h2 className="text-lg font-semibold text-yellow-800">
            Serviço Temporariamente Indisponível
          </h2>
          <p className="mt-1 text-sm text-yellow-700">
            A geração de cursos com IA está pausada no momento. Tente novamente
            mais tarde.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="font-medium">Como funciona</h3>
                <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                  <li>
                    Descreva o curso que deseja criar com o máximo de detalhes
                    possível
                  </li>
                  <li>
                    Nossa IA analisará sua descrição e gerará um curso completo
                    com módulos, aulas e atividades
                  </li>
                  <li>
                    O prazo de entrega é de até <strong>2 dias úteis</strong>
                  </li>
                  <li>
                    O custo do curso gerado é de <strong>$40 dólares</strong>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {hasActiveRequest && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                Você já possui uma solicitação em andamento. Aguarde a conclusão
                antes de criar uma nova.
              </p>
            </div>
          )}

          {!hasActiveRequest && (
            <form
              onSubmit={handleSubmit((data) => createMutation.mutate(data))}
              className="space-y-4 rounded-lg border bg-card p-4"
            >
              <div>
                <label
                  htmlFor="briefing"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Descreva o curso que deseja criar
                </label>
                <textarea
                  id="briefing"
                  {...register('briefing')}
                  rows={6}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: Curso introdutório sobre análise técnica de ações para iniciantes. Deve cobrir: conceitos básicos de gráficos, suporte e resistência, médias móveis, RSI, MACD, volumes. Com exemplos práticos do mercado brasileiro (B3)..."
                  disabled={createMutation.isPending}
                />
                {errors.briefing && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.briefing.message}
                  </p>
                )}
              </div>
              <label className="flex items-center gap-3 rounded-md border bg-background px-3 py-2.5 cursor-pointer hover:bg-accent/50 transition">
                <input
                  type="checkbox"
                  {...register('includeVideo')}
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <span className="text-sm font-medium">Incluir vídeo de introdução por módulo</span>
                  <p className="text-xs text-muted-foreground">
                    Gera um vídeo 1080p de introdução para cada módulo do curso (processamento adicional)
                  </p>
                </div>
              </label>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Solicitar Criação do Curso
              </button>
            </form>
          )}
        </>
      )}

      {requestsQuery.data && requestsQuery.data.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Histórico de Solicitações</h2>
          {requestsQuery.data.map((req) => (
            <RequestCard key={req.id} request={req} />
          ))}
        </div>
      )}
    </div>
  );
}
