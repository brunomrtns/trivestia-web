import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronLeft,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  GripVertical,
  FileText,
  Video,
  Image,
  Zap,
  Sparkles,
  X
} from 'lucide-react';
import { stepsEndpoints } from '@/services/endpoints/steps.endpoints';
import { StepFormModal } from '@/components/admin/StepFormModal';
import { cn } from '@/lib/utils';
import type {
  LessonStepDTO,
  StepType
} from '@/types/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_TYPES: {
  value: StepType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: 'CONTENT_TEXT', label: 'Texto', icon: FileText },
  { value: 'CONTENT_VIDEO', label: 'Vídeo', icon: Video },
  { value: 'CONTENT_IMAGE', label: 'Imagem', icon: Image },
  { value: 'ACTIVITY', label: 'Atividade', icon: Zap }
];

const STEP_LABELS: Record<StepType, string> = {
  CONTENT_TEXT: 'Texto',
  CONTENT_VIDEO: 'Vídeo',
  CONTENT_IMAGE: 'Imagem',
  ACTIVITY: 'Atividade'
};

const STEP_ICONS: Record<
  StepType,
  React.ComponentType<{ className?: string }>
> = {
  CONTENT_TEXT: FileText,
  CONTENT_VIDEO: Video,
  CONTENT_IMAGE: Image,
  ACTIVITY: Zap
};



// ─── SortableStepRow ──────────────────────────────────────────────────────────

function SortableStepRow({
  step,
  onEdit,
  onDelete,
  isDeleting
}: {
  step: LessonStepDTO;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: step.id });

  const Icon = STEP_ICONS[step.type];

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm"
    >
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">{step.title}</p>
        <p className="text-xs text-muted-foreground">
          {STEP_LABELS[step.type]}
          {step.estimatedMinutes ? ` · ${step.estimatedMinutes} min` : ''}
          {step.isOptional ? ' · Opcional' : ''}
        </p>
      </div>

      <span className="shrink-0 text-xs text-muted-foreground">
        #{step.order}
      </span>

      <button
        onClick={onEdit}
        className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
        aria-label="Editar etapa"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>

      <button
        onClick={onDelete}
        disabled={isDeleting}
        className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
        aria-label="Excluir etapa"
      >
        {isDeleting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminLessonStepsPage() {
  const { lessonId, courseId, tenantSlug } = useParams<{
    lessonId: string;
    courseId: string;
    tenantSlug: string;
  }>();
  const slug = tenantSlug ?? '';
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingStep, setEditingStep] = useState<LessonStepDTO | undefined>();

  // ── Queries ──────────────────────────────────────────────────────────────────────

  const { data: timeline, isLoading } = useQuery({
    queryKey: ['admin-steps', slug, lessonId],
    queryFn: () => stepsEndpoints.getTimeline(slug, lessonId!),
    enabled: !!lessonId
  });

  const steps = timeline?.steps ?? [];
  const isVirtual = steps.length > 0 && steps[0]?.isVirtual;

  // ── Mutations ────────────────────────────────────────────────────────────

  const deleteMut = useMutation({
    mutationFn: (stepId: string) =>
      stepsEndpoints.deleteStep(slug, lessonId!, stepId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-steps', slug, lessonId] });
      toast.success('Etapa excluída.');
    },
    onError: () => toast.error('Erro ao excluir etapa.')
  });

  const reorderMut = useMutation({
    mutationFn: (orders: { stepId: string; order: number }[]) =>
      stepsEndpoints.reorderSteps(slug, lessonId!, { orders }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-steps', slug, lessonId] });
      toast.success('Ordem atualizada!');
    },
    onError: () => toast.error('Erro ao reordenar.')
  });

  const generateMut = useMutation({
    mutationFn: () => stepsEndpoints.generateSteps(slug, lessonId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-steps', slug, lessonId] });
      toast.success('Etapas geradas a partir das atividades!');
    },
    onError: () => toast.error('Erro ao gerar etapas.')
  });

  // ── Drag & Drop ─────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = steps.findIndex((s) => s.id === active.id);
      const newIndex = steps.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(steps, oldIndex, newIndex);
      const orders = reordered.map((s, i) => ({ stepId: s.id, order: i + 1 }));
      reorderMut.mutate(orders);
    },
    [steps, reorderMut]
  );

  return (
    <div className="container max-w-3xl py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        {courseId ? (
          <Link
            to={`/t/${slug}/admin/courses/${courseId}/lessons`}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar às aulas
          </Link>
        ) : (
          <Link
            to={`/t/${slug}/admin/courses`}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Cursos
          </Link>
        )}
      </nav>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Etapas da aula</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {timeline?.lesson.title ?? 'Carregando...'}
          </p>
        </div>

        <div className="flex gap-2">
          {(isVirtual || steps.length === 0) && (
            <button
              onClick={() => generateMut.mutate()}
              disabled={generateMut.isPending}
              className="flex items-center gap-1.5 rounded-xl border bg-card px-4 py-2.5 text-sm font-medium shadow-sm transition hover:bg-accent disabled:opacity-60"
            >
              {generateMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Gerar das atividades
            </button>
          )}
          <button
            onClick={() => {
              setEditingStep(undefined);
              setShowForm(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Nova etapa
          </button>
        </div>
      </div>

      {/* Virtual banner */}
      {isVirtual && (
        <div className="mb-6 rounded-xl border border-yellow-300/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
          <strong>Etapas virtuais:</strong> Esta aula ainda não possui etapas
          persistidas. As etapas abaixo são geradas automaticamente a partir das
          atividades. Clique em "Gerar das atividades" para persistir.
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Steps list with DnD */}
      {!isLoading && steps.length > 0 && !isVirtual && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={steps.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {steps.map((step) => (
                <SortableStepRow
                  key={step.id}
                  step={step}
                  onEdit={() => {
                    setEditingStep(step);
                    setShowForm(true);
                  }}
                  onDelete={() => {
                    if (confirm(`Excluir etapa "${step.title}"?`))
                      deleteMut.mutate(step.id);
                  }}
                  isDeleting={
                    deleteMut.isPending && deleteMut.variables === step.id
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Virtual steps (no DnD) */}
      {!isLoading && isVirtual && (
        <div className="space-y-2 opacity-70">
          {steps.map((step) => {
            const Icon = STEP_ICONS[step.type];
            return (
              <div
                key={step.id}
                className="flex items-center gap-3 rounded-xl border border-dashed bg-card px-4 py-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {STEP_LABELS[step.type]}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  #{step.order}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && steps.length === 0 && (
        <div className="py-20 text-center text-muted-foreground">
          <FileText className="mx-auto mb-4 h-12 w-12 opacity-30" />
          <p>Nenhuma etapa nesta aula.</p>
          <p className="mt-1 text-xs">
            Crie etapas manualmente ou gere a partir das atividades.
          </p>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <StepFormModal
          slug={slug}
          lessonId={lessonId!}
          step={editingStep}
          nextOrder={steps.length + 1}
          queryKey={['admin-steps', slug, lessonId]}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
