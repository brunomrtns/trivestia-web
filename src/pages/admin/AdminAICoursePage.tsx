import { useState, useRef, useCallback } from 'react';
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
  Upload,
  Trash2,
} from 'lucide-react';
import { aiCourseEndpoints } from '@/services/endpoints/ai-course.endpoints';
import type {
  CourseGenStatus,
  CourseGenerationRequest,
  CourseGenDocType,
  CourseGenDocument,
} from '@/types/api';

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

const DOC_TYPE_CONFIG: Record<CourseGenDocType, { label: string; color: string }> = {
  PROVA: { label: 'Prova', color: 'bg-blue-100 text-blue-700' },
  GABARITO: { label: 'Gabarito', color: 'bg-green-100 text-green-700' },
  LEI: { label: 'Lei', color: 'bg-purple-100 text-purple-700' },
  APOIO: { label: 'Apoio', color: 'bg-gray-100 text-gray-700' },
};

const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.md', '.html', '.htm'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 20;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function DocTypeBadge({ type }: { type: CourseGenDocType }) {
  const cfg = DOC_TYPE_CONFIG[type];
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function ScanStatusIcon({ status }: { status: string }) {
  if (status === 'CLEAN') return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
  if (status === 'PENDING') return <Clock className="h-3.5 w-3.5 text-yellow-500" />;
  return <XCircle className="h-3.5 w-3.5 text-red-500" />;
}

function DocumentUploadSection({ slug, requestId }: { slug: string; requestId: string }) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<CourseGenDocType>('APOIO');
  const [dragOver, setDragOver] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [selectedProvaId, setSelectedProvaId] = useState('');
  const [selectedGabaritoId, setSelectedGabaritoId] = useState('');

  const docsQuery = useQuery({
    queryKey: ['ai-course-docs', slug, requestId],
    queryFn: () => aiCourseEndpoints.listDocuments(slug, requestId),
    enabled: !!slug && !!requestId,
  });

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => {
      const fd = new FormData();
      for (const f of files) fd.append('files', f);
      fd.append('docType', docType);
      return aiCourseEndpoints.uploadDocuments(slug, requestId, fd);
    },
    onSuccess: (result) => {
      setPendingFiles([]);
      qc.invalidateQueries({ queryKey: ['ai-course-docs', slug, requestId] });
      if (result.accepted.length > 0) {
        toast.success(`${result.accepted.length} arquivo(s) enviado(s) com sucesso`);
      }
      for (const e of result.errors) {
        toast.error(`${e.filename}: ${e.error}`);
      }
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error) ?? 'Erro ao enviar arquivos');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: string) =>
      aiCourseEndpoints.deleteDocument(slug, requestId, docId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-course-docs', slug, requestId] });
      toast.success('Documento removido');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error) ?? 'Erro ao remover documento');
    },
  });

  const linkMutation = useMutation({
    mutationFn: ({ provaId, gabaritoId }: { provaId: string; gabaritoId: string }) =>
      aiCourseEndpoints.linkDocuments(slug, requestId, provaId, gabaritoId),
    onSuccess: () => {
      setSelectedProvaId('');
      setSelectedGabaritoId('');
      qc.invalidateQueries({ queryKey: ['ai-course-docs', slug, requestId] });
      toast.success('Prova e gabarito vinculados');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error) ?? 'Erro ao vincular documentos');
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: (docId: string) =>
      aiCourseEndpoints.unlinkDocument(slug, requestId, docId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-course-docs', slug, requestId] });
      toast.success('Vínculo removido');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error) ?? 'Erro ao desvincular');
    },
  });

  const validateFiles = useCallback((files: File[]): File[] => {
    const valid: File[] = [];
    for (const f of files) {
      const ext = `.${f.name.split('.').pop()?.toLowerCase() ?? ''}`;
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        toast.error(`${f.name}: tipo não suportado. Use PDF, TXT, MD, HTML`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name}: excede 10MB`);
        continue;
      }
      valid.push(f);
    }
    return valid;
  }, []);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files);
    const currentCount = (docsQuery.data?.length ?? 0) + pendingFiles.length;
    if (currentCount + selected.length > MAX_FILES) {
      toast.error(`Máximo de ${MAX_FILES} documentos por solicitação`);
      return;
    }
    const valid = validateFiles(selected);
    setPendingFiles((prev) => [...prev, ...valid]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const docs = docsQuery.data ?? [];
  const totalCount = docs.length + pendingFiles.length;

  return (
    <div className="mt-3 space-y-3 border-t pt-3">
      <h4 className="text-sm font-semibold">Documentos</h4>

      <div className="flex items-center gap-2">
        <select
          data-testid="ai-docs-type-select"
          value={docType}
          onChange={(e) => setDocType(e.target.value as CourseGenDocType)}
          className="rounded-md border bg-background px-2 py-1.5 text-sm"
        >
          <option value="APOIO">Apoio</option>
          <option value="PROVA">Prova</option>
          <option value="GABARITO">Gabarito</option>
          <option value="LEI">Lei</option>
        </select>
        <span className="text-xs text-muted-foreground">{totalCount}/{MAX_FILES}</span>
      </div>

      <div
        data-testid="ai-docs-upload"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition ${
          dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
      >
        <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Arraste arquivos ou clique para selecionar
        </p>
        <p className="text-xs text-muted-foreground">PDF, TXT, MD, HTML — máx 10MB cada</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md,.html,.htm"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {pendingFiles.length > 0 && (
        <div className="space-y-1">
          {pendingFiles.map((f, i) => (
            <div key={i} className="flex items-center justify-between rounded border bg-background px-2 py-1 text-sm">
              <span className="truncate">{f.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{formatFileSize(f.size)}</span>
                <button
                  onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-muted-foreground hover:text-red-500"
                >
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => uploadMutation.mutate(pendingFiles)}
            disabled={uploadMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {uploadMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            Enviar {pendingFiles.length} arquivo(s)
          </button>
        </div>
      )}

      {docs.length > 0 && (
        <div className="space-y-1">
          {docs.map((doc) => (
            <div
              key={doc.id}
              data-testid="ai-docs-row"
              className="flex items-center justify-between rounded border bg-background px-2 py-1.5 text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{doc.filename}</span>
                <DocTypeBadge type={doc.docType} />
                {doc.groupId && (
                  <span className="inline-flex items-center rounded bg-primary/10 px-1 py-0.5 text-[9px] text-primary">
                    vinculado
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">{formatFileSize(doc.fileSize)}</span>
                <ScanStatusIcon status={doc.scanStatus} />
                {doc.groupId && (
                  <button
                    onClick={() => unlinkMutation.mutate(doc.id)}
                    disabled={unlinkMutation.isPending}
                    className="text-xs text-muted-foreground hover:text-orange-500 disabled:opacity-50"
                    title="Desvincular"
                  >
                    Desvincular
                  </button>
                )}
                <button
                  onClick={() => deleteMutation.mutate(doc.id)}
                  disabled={deleteMutation.isPending}
                  className="text-muted-foreground hover:text-red-500 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(() => {
        const provas = docs.filter((d) => d.docType === 'PROVA' && !d.groupId);
        const gabaritos = docs.filter((d) => d.docType === 'GABARITO' && !d.groupId);
        if (provas.length === 0 && gabaritos.length === 0) return null;
        return (
          <div className="border-t pt-3 space-y-2">
            <h4 className="text-sm font-semibold">Vincular Prova e Gabarito</h4>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-muted-foreground">Prova</label>
                <select
                  value={selectedProvaId}
                  onChange={(e) => setSelectedProvaId(e.target.value)}
                  className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                >
                  <option value="">Selecione...</option>
                  {provas.map((p) => (
                    <option key={p.id} value={p.id}>{p.filename}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-muted-foreground">Gabarito</label>
                <select
                  value={selectedGabaritoId}
                  onChange={(e) => setSelectedGabaritoId(e.target.value)}
                  className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                >
                  <option value="">Selecione...</option>
                  {gabaritos.map((g) => (
                    <option key={g.id} value={g.id}>{g.filename}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => linkMutation.mutate({ provaId: selectedProvaId, gabaritoId: selectedGabaritoId })}
                disabled={!selectedProvaId || !selectedGabaritoId || linkMutation.isPending}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {linkMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Vincular'}
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function RequestCard({ request, slug }: { request: CourseGenerationRequest; slug: string }) {
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
      {request.status === 'PENDING' && (
        <DocumentUploadSection slug={slug} requestId={request.id} />
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [docType, setDocType] = useState<CourseGenDocType>('APOIO');
  const [submitting, setSubmitting] = useState(false);

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

  const validateFile = useCallback((f: File): boolean => {
    const ext = `.${f.name.split('.').pop()?.toLowerCase() ?? ''}`;
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`${f.name}: tipo não suportado. Use PDF, TXT, MD, HTML`);
      return false;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast.error(`${f.name}: excede 10MB`);
      return false;
    }
    return true;
  }, []);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files);
    if (selectedFiles.length + selected.length > MAX_FILES) {
      toast.error(`Máximo de ${MAX_FILES} documentos por solicitação`);
      return;
    }
    const valid = selected.filter(validateFile);
    setSelectedFiles((prev) => [...prev, ...valid]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const request = await aiCourseEndpoints.createRequest(slug, data.briefing, data.includeVideo);

      if (selectedFiles.length > 0) {
        const fd = new FormData();
        for (const f of selectedFiles) fd.append('files', f);
        fd.append('docType', docType);
        try {
          const result = await aiCourseEndpoints.uploadDocuments(slug, request.id, fd);
          if (result.accepted.length > 0) {
            toast.success(`Solicitação criada com ${result.accepted.length} documento(s)`);
          }
          for (const e of result.errors) {
            toast.error(`${e.filename}: ${e.error}`);
          }
        } catch (uploadErr) {
          toast.warning('Solicitação criada, mas falha ao enviar documentos');
        }
      } else {
        toast.success('Solicitação de curso criada com sucesso!');
      }

      reset();
      setSelectedFiles([]);
      qc.invalidateQueries({ queryKey: ['ai-course-requests', slug] });
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error) ?? 'Erro ao criar solicitação de curso');
    } finally {
      setSubmitting(false);
    }
  };

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
                    Opcionalmente, envie documentação de apoio (provas, gabaritos,
                    leis, materiais)
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
              onSubmit={handleSubmit(onSubmit)}
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
                  disabled={submitting}
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

              <div className="space-y-3 border-t pt-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Documentação (opcional)</h3>
                  <span className="text-xs text-muted-foreground">{selectedFiles.length}/{MAX_FILES}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Tipo:</span>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as CourseGenDocType)}
                    className="rounded-md border bg-background px-2 py-1 text-sm"
                  >
                    <option value="APOIO">Material de apoio</option>
                    <option value="PROVA">Prova</option>
                    <option value="GABARITO">Gabarito</option>
                    <option value="LEI">Legislação</option>
                  </select>
                </div>

                <div
                  data-testid="ai-docs-upload"
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition ${
                    dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                  }`}
                >
                  <Upload className="mx-auto h-5 w-5 text-muted-foreground" />
                  <p className="mt-1 text-sm text-muted-foreground">
                    Arraste arquivos ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground">PDF, TXT, MD, HTML — máx 10MB cada</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.txt,.md,.html,.htm"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-1">
                    {selectedFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between rounded border bg-background px-2 py-1 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{f.name}</span>
                          <DocTypeBadge type={docType} />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">{formatFileSize(f.size)}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                            className="text-muted-foreground hover:text-red-500"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? (
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
            <RequestCard key={req.id} request={req} slug={slug} />
          ))}
        </div>
      )}
    </div>
  );
}
