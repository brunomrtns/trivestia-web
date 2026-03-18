import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  BookOpen,
  FileText,
  Zap,
  HelpCircle,
  GripVertical,
  Video,
  Image,
  Lock,
  ShieldCheck,
  FileUp,
  ExternalLink
} from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { learningEndpoints } from '@/services/endpoints/learning.endpoints';
import { adminEndpoints } from '@/services/endpoints/admin.endpoints';
import { FileUploadService } from '@/services/FileUploadService';
import { StepFormModal } from '@/components/admin/StepFormModal';
import { cn } from '@/lib/utils';
import type {
  Module,
  Lesson,
  ActivityType,
  ActivityReviewPolicy,
  LessonStepDTO,
  StepType
} from '@/types/api';

// ─── Types ───────────────────────────────────────────────────────────────────

type ModuleForm = { title: string; order: number };

type LessonForm = {
  title: string;
  order: number;
  availableFrom?: string;
  prerequisiteLessonId?: string;
  prerequisiteMinScore?: number;
  videoUrl?: string | null;
  materialUrl?: string | null;
};

type ActivityForm = {
  title: string;
  order: number;
  type: ActivityType;
  reviewPolicy: ActivityReviewPolicy;
  reviewAfterDate?: string | null;
};

const TYPE_COLORS: Record<ActivityType, string> = {
  MULTIPLE_CHOICE: 'bg-blue-500/10 text-blue-600 border-blue-200',
  MULTIPLE_SELECT: 'bg-purple-500/10 text-purple-600 border-purple-200',
  TRUE_FALSE: 'bg-green-500/10 text-green-600 border-green-200',
  ORDERING: 'bg-orange-500/10 text-orange-600 border-orange-200',
  TEXT_INPUT: 'bg-pink-500/10 text-pink-600 border-pink-200',
  SCENARIO: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  CHART_MARKUP: 'bg-teal-500/10 text-teal-600 border-teal-200',
  RISK_CALCULATOR: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
  SIM_TRADING_CHALLENGE: 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
};

const STEP_ICON: Record<StepType, React.ReactNode> = {
  ACTIVITY: <Zap className="h-4 w-4 shrink-0 text-amber-500" />,
  CONTENT_TEXT: <FileText className="h-4 w-4 shrink-0 text-blue-500" />,
  CONTENT_VIDEO: <Video className="h-4 w-4 shrink-0 text-purple-500" />,
  CONTENT_IMAGE: <Image className="h-4 w-4 shrink-0 text-green-500" />
};

const STEP_BADGE_COLOR: Record<StepType, string> = {
  ACTIVITY: 'bg-amber-500/10 text-amber-700 border-amber-200',
  CONTENT_TEXT: 'bg-blue-500/10 text-blue-700 border-blue-200',
  CONTENT_VIDEO: 'bg-purple-500/10 text-purple-700 border-purple-200',
  CONTENT_IMAGE: 'bg-green-500/10 text-green-700 border-green-200'
};

// ─── SortableStepRow ──────────────────────────────────────────────────────────

function SortableStepRow({
  slug,
  lessonId,
  step,
  onEdit,
  onDelete,
  isDeleting
}: {
  slug: string;
  lessonId: string;
  step: LessonStepDTO;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const { t } = useTranslation();
  const STEP_LABEL: Record<StepType, string> = {
    ACTIVITY: t('admin.lessons.stepType.activity'),
    CONTENT_TEXT: t('admin.lessons.stepType.text'),
    CONTENT_VIDEO: t('admin.lessons.stepType.video'),
    CONTENT_IMAGE: t('admin.lessons.stepType.image')
  };
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: step.id, disabled: step.isVirtual });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined
  };

  const activityId =
    step.type === 'ACTIVITY'
      ? (step.content as { activityId?: string }).activityId
      : undefined;

  // For ACTIVITY steps, extract the activity type from content if available
  const activityType =
    step.type === 'ACTIVITY'
      ? (step.content as { activityType?: ActivityType }).activityType
      : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2.5"
    >
      {/* Drag handle — disabled for virtual steps */}
      <button
        {...(step.isVirtual ? {} : { ...attributes, ...listeners })}
        disabled={step.isVirtual}
        className={cn(
          'rounded p-0.5 text-muted-foreground/40',
          step.isVirtual
            ? 'cursor-default opacity-30'
            : 'cursor-grab touch-none hover:text-muted-foreground active:cursor-grabbing'
        )}
        aria-label={t('admin.lessons.aria.drag')}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {STEP_ICON[step.type]}

      <span className="flex-1 truncate text-sm font-medium">{step.title}</span>

      {/* Activity type badge (if available in content) */}
      {step.type === 'ACTIVITY' && activityType && (
        <span
          className={cn(
            'shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium',
            TYPE_COLORS[activityType] ?? 'bg-muted text-muted-foreground'
          )}
        >
          {t(`common.activityTypes.${activityType}`, { defaultValue: activityType })}
        </span>
      )}

      {/* Step type badge */}
      <span
        className={cn(
          'shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium',
          STEP_BADGE_COLOR[step.type]
        )}
      >
        {STEP_LABEL[step.type]}
      </span>

      {/* Questões link for ACTIVITY steps */}
      {step.type === 'ACTIVITY' && activityId && (
        <Link
          to={`/t/${slug}/admin/lessons/${lessonId}/activities/${activityId}/questions`}
          className="flex shrink-0 items-center gap-1 rounded-lg border px-3 py-1 text-xs font-medium transition hover:bg-accent"
        >
          <HelpCircle className="h-3 w-3" />
          {t('admin.lessons.questionsLink')}
        </Link>
      )}

      {/* Edit button for non-virtual content steps */}
      {!step.isVirtual && step.type !== 'ACTIVITY' && (
        <button
          onClick={onEdit}
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          aria-label={t('admin.lessonSteps.aria.edit')}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}

      <button
        onClick={onDelete}
        disabled={isDeleting}
        className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
        aria-label={t('admin.lessonSteps.aria.delete')}
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

// ─── LessonSection ────────────────────────────────────────────────────────────

function LessonSection({
  slug,
  courseId,
  moduleId,
  lesson,
  onDeleteLesson,
  isDeletingLesson
}: {
  slug: string;
  courseId: string;
  moduleId: string;
  lesson: Lesson;
  onDeleteLesson: (id: string) => void;
  isDeletingLesson: boolean;
}) {
  const qc = useQueryClient();
  const { t } = useTranslation();
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [materialProgress, setMaterialProgress] = useState<number | null>(null);

  const lessonSchema = z.object({
    title: z.string().min(2, t('admin.lessons.validation.title')),
    order: z.coerce.number().min(1, t('admin.lessons.validation.order')),
    availableFrom: z.string().optional(),
    prerequisiteLessonId: z.string().optional(),
    prerequisiteMinScore: z.coerce.number().min(0).max(100).optional(),
    videoUrl: z.string().optional().nullable(),
    materialUrl: z.string().optional().nullable()
  });
  const activitySchema = z.object({
    title: z.string().min(2, t('admin.lessons.validation.title')),
    order: z.coerce.number().min(1, t('admin.lessons.validation.order')),
    type: z.enum([
      'MULTIPLE_CHOICE',
      'MULTIPLE_SELECT',
      'TRUE_FALSE',
      'ORDERING',
      'TEXT_INPUT',
      'SCENARIO',
      'CHART_MARKUP',
      'RISK_CALCULATOR',
      'SIM_TRADING_CHALLENGE'
    ] as const),
    reviewPolicy: z
      .enum(['IMMEDIATE', 'AFTER_DATE', 'NEVER'] as const)
      .default('IMMEDIATE'),
    reviewAfterDate: z.string().optional().nullable()
  });
  const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
    {
      value: 'MULTIPLE_CHOICE',
      label: t('admin.lessons.activityType.multipleChoice')
    },
    {
      value: 'MULTIPLE_SELECT',
      label: t('admin.lessons.activityType.multipleSelect')
    },
    { value: 'TRUE_FALSE', label: t('admin.lessons.activityType.trueFalse') },
    { value: 'ORDERING', label: t('admin.lessons.activityType.ordering') },
    { value: 'TEXT_INPUT', label: t('admin.lessons.activityType.textInput') },
    { value: 'SCENARIO', label: t('admin.lessons.activityType.scenario') },
    {
      value: 'CHART_MARKUP',
      label: t('admin.lessons.activityType.chartMarkup')
    },
    {
      value: 'RISK_CALCULATOR',
      label: t('admin.lessons.activityType.riskCalculator')
    },
    {
      value: 'SIM_TRADING_CHALLENGE',
      label: t('admin.lessons.activityType.simTrading')
    }
  ];
  const REVIEW_POLICIES: { value: ActivityReviewPolicy; label: string }[] = [
    { value: 'IMMEDIATE', label: t('admin.lessons.reviewPolicy.immediate') },
    { value: 'AFTER_DATE', label: t('admin.lessons.reviewPolicy.afterDate') },
    { value: 'NEVER', label: t('admin.lessons.reviewPolicy.never') }
  ];
  const [expanded, setExpanded] = useState(false);
  const [editingLesson, setEditingLesson] = useState(false);
  const [showAccessRules, setShowAccessRules] = useState(false);
  const [addingStep, setAddingStep] = useState(false);
  const [stepKind, setStepKind] = useState<'ACTIVITY' | 'CONTENT'>('ACTIVITY');
  const [editingStep, setEditingStep] = useState<LessonStepDTO | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [localSteps, setLocalSteps] = useState<LessonStepDTO[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { data: timeline, isLoading: loadingSteps } = useQuery({
    queryKey: ['admin-timeline', slug, lesson.id],
    queryFn: () => learningEndpoints.getTimeline(slug, lesson.id),
    enabled: expanded
  });

  // Sync local state when data arrives
  useEffect(() => {
    if (timeline?.steps) setLocalSteps(timeline.steps);
  }, [timeline?.steps]);

  const generateMut = useMutation({
    mutationFn: () => adminEndpoints.generateSteps(slug, lesson.id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['admin-timeline', slug, lesson.id] }),
    onError: () =>
      qc.invalidateQueries({ queryKey: ['admin-timeline', slug, lesson.id] })
  });

  // Auto-materialize: whenever there are virtual steps, create real steps for them silently
  useEffect(() => {
    if (!timeline) return;
    const hasVirtual = timeline.steps.some((s) => s.isVirtual);
    if (hasVirtual && !generateMut.isPending) {
      generateMut.mutate();
    }
  }, [timeline]); // eslint-disable-line react-hooks/exhaustive-deps

  const reorderMut = useMutation({
    mutationFn: (orders: { stepId: string; order: number }[]) =>
      adminEndpoints.reorderSteps(slug, lesson.id, orders),
    onError: () => {
      toast.error(t('admin.lessonSteps.toast.reorderError'));
      if (timeline?.steps) setLocalSteps(timeline.steps);
    }
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = localSteps.findIndex((s) => s.id === String(active.id));
    const newIdx = localSteps.findIndex((s) => s.id === String(over.id));
    const reordered = arrayMove(localSteps, oldIdx, newIdx);
    setLocalSteps(reordered);

    if (reordered.some((s) => s.isVirtual)) {
      toast.info(t('admin.lessonSteps.toast.materializationPending'));
      return;
    }

    reorderMut.mutate(
      reordered.map((s, i) => ({ stepId: s.id, order: i + 1 }))
    );
  }

  const deleteStepMut = useMutation({
    mutationFn: async ({
      stepId,
      type,
      activityId
    }: {
      stepId: string;
      type: StepType;
      activityId?: string;
    }) => {
      await adminEndpoints.deleteStep(slug, lesson.id, stepId);
      if (type === 'ACTIVITY' && activityId) {
        await adminEndpoints
          .deleteActivity(slug, lesson.id, activityId)
          .catch(() => {});
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-timeline', slug, lesson.id] });
      toast.success(t('admin.lessonSteps.toast.deleted'));
    },
    onError: () => toast.error(t('admin.lessonSteps.toast.deleteError'))
  });

  // ─── Activity form ──────────────────────────────────────────────────────────
  const actForm = useForm<ActivityForm>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: '',
      order: 1,
      type: 'MULTIPLE_CHOICE',
      reviewPolicy: 'IMMEDIATE',
      reviewAfterDate: null
    }
  });

  const createActivityStepMut = useMutation({
    mutationFn: async (data: ActivityForm) => {
      const activity = await adminEndpoints.createActivity(
        slug,
        lesson.id,
        data
      );
      await adminEndpoints.createStep(slug, lesson.id, {
        type: 'ACTIVITY',
        title: activity.title,
        content: { activityId: activity.id, activityType: activity.type },
        order: (localSteps.length ?? 0) + 1
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-timeline', slug, lesson.id] });
      setAddingStep(false);
      actForm.reset({
        title: '',
        order: 1,
        type: 'MULTIPLE_CHOICE',
        reviewPolicy: 'IMMEDIATE',
        reviewAfterDate: null
      });
      toast.success(t('admin.lessons.toast.activityAdded'));
    },
    onError: () => toast.error(t('admin.lessons.toast.activityAddError'))
  });

  const createContentStepMut = useMutation({
    mutationFn: (data: { type: StepType; title: string }) =>
      adminEndpoints.createStep(slug, lesson.id, {
        type: data.type,
        title: data.title,
        content: {},
        order: (localSteps.length ?? 0) + 1
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-timeline', slug, lesson.id] });
      setAddingStep(false);
      toast.success(t('admin.stepForm.toast.created'));
    },
    onError: () => toast.error(t('admin.stepForm.toast.createError'))
  });

  // ─── Lesson edit form ───────────────────────────────────────────────────────
  const lessonEditForm = useForm<LessonForm>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: lesson.title,
      order: lesson.order,
      availableFrom: lesson.availableFrom
        ? new Date(lesson.availableFrom).toISOString().slice(0, 16)
        : '',
      prerequisiteLessonId: lesson.prerequisiteLessonId ?? '',
      prerequisiteMinScore: lesson.prerequisiteMinScore ?? 0,
      videoUrl: lesson.videoUrl ?? null,
      materialUrl: lesson.materialUrl ?? null
    }
  });

  // Load all lessons in the same course for prereq selector
  const { data: courseData } = useQuery({
    queryKey: ['course-full', slug, courseId],
    queryFn: () => learningEndpoints.getCourse(slug, courseId),
    enabled: editingLesson
  });

  const allCourseLessons =
    courseData?.modules?.flatMap((m) =>
      (m.lessons ?? []).map((l) => ({ ...l, moduleTitle: m.title }))
    ) ?? [];

  const updateLessonMut = useMutation({
    mutationFn: (data: LessonForm) =>
      adminEndpoints.updateLesson(slug, moduleId, lesson.id, {
        title: data.title,
        order: data.order,
        videoUrl: data.videoUrl,
        materialUrl: data.materialUrl,
        availableFrom: data.availableFrom
          ? new Date(data.availableFrom).toISOString()
          : null,
        prerequisiteLessonId: data.prerequisiteLessonId || null,
        prerequisiteMinScore:
          data.prerequisiteMinScore != null
            ? Number(data.prerequisiteMinScore)
            : null
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-lessons', slug, moduleId] });
      setEditingLesson(false);
      toast.success(t('admin.lessons.toast.lessonUpdated'));
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(
        e?.response?.data?.message ?? t('admin.lessons.toast.lessonUpdateError')
      )
  });

  const hasVirtualSteps = localSteps.some((s) => s.isVirtual);

  return (
    <div className="rounded-xl border bg-card">
      {/* Lesson header */}
      {editingLesson ? (
        <form
          onSubmit={lessonEditForm.handleSubmit((d) =>
            updateLessonMut.mutate(d)
          )}
          className="space-y-3 p-3"
        >
          {/* Basic fields row */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              className="flex-1 min-w-[160px] rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              {...lessonEditForm.register('title')}
            />
            <input
              type="number"
              min={1}
              className="w-16 rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              {...lessonEditForm.register('order')}
            />
            <button
              type="submit"
              disabled={updateLessonMut.isPending}
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
            >
              {updateLessonMut.isPending && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              {t('admin.stepForm.saveButton')}
            </button>
            <button
              type="button"
              onClick={() => setEditingLesson(false)}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent"
            >
              {t('common.actions.cancel')}
            </button>
          </div>

          {/* Access Rules accordion */}
          <div className="rounded-lg border bg-muted/30">
            <button
              type="button"
              onClick={() => setShowAccessRules(!showAccessRules)}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              {showAccessRules ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              <ShieldCheck className="h-3.5 w-3.5" />
              {t('admin.lessons.accessRules.title')}
            </button>
            {showAccessRules && (
              <div className="border-t px-3 pb-3 pt-2.5 space-y-3">
                {/* availableFrom */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {t('admin.lessons.accessRules.availableFrom')}
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                    {...lessonEditForm.register('availableFrom')}
                  />
                </div>

                {/* prerequisiteLessonId */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    {t('admin.lessons.accessRules.prerequisiteLesson')}
                  </label>
                  <select
                    className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                    {...lessonEditForm.register('prerequisiteLessonId')}
                  >
                    <option value="">{t('admin.lessons.accessRules.noPrerequisite')}</option>
                    {allCourseLessons
                      .filter((l) => l.id !== lesson.id)
                      .map((l) => (
                        <option key={l.id} value={l.id}>
                          [{l.moduleTitle}] {l.title}
                        </option>
                      ))}
                  </select>
                </div>

                {/* prerequisiteMinScore */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {t('admin.lessons.accessRules.minScore')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    className="w-24 rounded-lg border bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                    {...lessonEditForm.register('prerequisiteMinScore')}
                  />
                </div>
              </div>
            )}
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex flex-1 items-center gap-2 text-left"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate text-sm font-medium">
              {lesson.title}
            </span>
            <span className="text-xs text-muted-foreground">
              #{lesson.order}
            </span>
          </button>
          <button
            onClick={() => {
              setEditingLesson(true);
              setExpanded(true);
            }}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label={t('admin.lessons.aria.editLesson')}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              if (
                confirm(
                  t('admin.lessons.confirmDeleteLesson', {
                    title: lesson.title
                  })
                )
              )
                onDeleteLesson(lesson.id);
            }}
            disabled={isDeletingLesson}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
            aria-label={t('admin.lessons.aria.deleteLesson')}
          >
            {isDeletingLesson ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      )}

      {/* Steps list */}
      {expanded && (
        <div className="space-y-2 border-t px-4 pb-4 pt-3">
          {loadingSteps ? (
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              {t('admin.lessons.loadingSteps')}
            </div>
          ) : (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={localSteps.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {localSteps.map((step) => (
                    <SortableStepRow
                      key={step.id}
                      slug={slug}
                      lessonId={lesson.id}
                      step={step}
                      onEdit={() => setEditingStep(step)}
                      onDelete={() => {
                        if (
                          !confirm(
                            t('admin.lessons.confirmDeleteStep', {
                              title: step.title
                            })
                          )
                        )
                          return;
                        const activityId =
                          step.type === 'ACTIVITY'
                            ? (step.content as { activityId?: string })
                                .activityId
                            : undefined;
                        deleteStepMut.mutate({
                          stepId: step.id,
                          type: step.type,
                          activityId
                        });
                      }}
                      isDeleting={
                        deleteStepMut.isPending &&
                        (deleteStepMut.variables as { stepId: string })
                          ?.stepId === step.id
                      }
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {localSteps.length === 0 && (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  {t('admin.lessonSteps.empty.title')}
                </p>
              )}

              {hasVirtualSteps && (
                <p className="flex items-center gap-1.5 py-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Preparando drag &amp; drop…
                </p>
              )}
            </>
          )}

          {/* Add step form */}
          {addingStep ? (
            <div className="mt-1 rounded-xl border bg-muted/30 p-3">
              {/* Kind selector */}
              <div className="mb-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStepKind('ACTIVITY')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                    stepKind === 'ACTIVITY'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'hover:bg-accent'
                  )}
                >
                  <Zap className="h-3.5 w-3.5" />
                  {t('admin.lessons.stepType.activity')}
                </button>
                <button
                  type="button"
                  onClick={() => setStepKind('CONTENT')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                    stepKind === 'CONTENT'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'hover:bg-accent'
                  )}
                >
                  <FileText className="h-3.5 w-3.5" />
                  {t('admin.stepForm.contentLabel')}
                </button>
              </div>

              {/* ── Activity form ── */}
              {stepKind === 'ACTIVITY' && (
                <form
                  onSubmit={actForm.handleSubmit((d) =>
                    createActivityStepMut.mutate(d)
                  )}
                  className="flex flex-wrap items-end gap-3"
                >
                  <div className="flex-1 min-w-[140px]">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      {t('admin.stepForm.titleLabel')}
                    </label>
                    <input
                      className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                      {...actForm.register('title')}
                    />
                    {actForm.formState.errors.title && (
                      <p className="mt-0.5 text-xs text-destructive">
                        {actForm.formState.errors.title.message}
                      </p>
                    )}
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      {t('admin.stepForm.typeLabel')}
                    </label>
                    <select
                      className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                      {...actForm.register('type')}
                    >
                      {ACTIVITY_TYPES.slice()
                        .sort((a, b) =>
                          a.label.localeCompare(b.label, 'pt-BR', {
                            sensitivity: 'base'
                          })
                        )
                        .map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      {t('admin.lessons.activityForm.reviewLabel')}
                    </label>
                    <select
                      className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                      {...actForm.register('reviewPolicy')}
                    >
                      {REVIEW_POLICIES.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {actForm.watch('reviewPolicy') === 'AFTER_DATE' && (
                    <div className="flex-1 min-w-[160px]">
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        {t('admin.lessons.activityForm.releaseReviewAt')}
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                        {...actForm.register('reviewAfterDate')}
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={createActivityStepMut.isPending}
                      className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                    >
                      {createActivityStepMut.isPending && (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                      {t('admin.stepForm.saveButton')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddingStep(false);
                        actForm.reset();
                      }}
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                    >
                      {t('common.actions.cancel')}
                    </button>
                  </div>
                </form>
              )}

              {/* ── Content step form ── */}
              {stepKind === 'CONTENT' && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-muted-foreground">
                    {t('admin.lessons.contentStepHint')}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAddingStep(false);
                        setShowContentModal(true);
                      }}
                      className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                    >
                      <Plus className="h-3 w-3" />
                      {t('admin.lessons.addContentButton')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingStep(false)}
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                    >
                      {t('common.actions.cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setAddingStep(true)}
              className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('admin.lessons.addStepButton')}
            </button>
          )}
        </div>
      )}

      {/* Edit content step modal */}
      {editingStep !== null && (
        <StepFormModal
          slug={slug}
          lessonId={lesson.id}
          step={editingStep}
          nextOrder={localSteps.length + 1}
          queryKey={['admin-timeline', slug, lesson.id]}
          onClose={() => setEditingStep(null)}
        />
      )}

      {/* Create content step modal */}
      {showContentModal && (
        <StepFormModal
          slug={slug}
          lessonId={lesson.id}
          nextOrder={localSteps.length + 1}
          queryKey={['admin-timeline', slug, lesson.id]}
          onClose={() => setShowContentModal(false)}
        />
      )}
    </div>
  );
}

// ─── ModuleSection ────────────────────────────────────────────────────────────

function ModuleSection({
  slug,
  courseId,
  module,
  onDeleteModule,
  isDeletingModule
}: {
  slug: string;
  courseId: string;
  module: Module;
  onDeleteModule: (id: string) => void;
  isDeletingModule: boolean;
}) {
  const qc = useQueryClient();
  const { t } = useTranslation();
  const lessonSchema = z.object({
    title: z.string().min(2, t('admin.lessons.validation.title')),
    order: z.coerce.number().min(1, t('admin.lessons.validation.order')),
    availableFrom: z.string().optional(),
    prerequisiteLessonId: z.string().optional(),
    prerequisiteMinScore: z.coerce.number().min(0).max(100).optional()
  });
  const moduleSchema = z.object({
    title: z.string().min(2, t('admin.lessons.validation.title')),
    order: z.coerce.number().min(1, t('admin.lessons.validation.order'))
  });
  const [expanded, setExpanded] = useState(false);
  const [addingLesson, setAddingLesson] = useState(false);
  const [editingModule, setEditingModule] = useState(false);

  const { data: lessons, isLoading: loadingLessons } = useQuery({
    queryKey: ['admin-lessons', slug, module.id],
    queryFn: () => learningEndpoints.getLessons(slug, module.id),
    enabled: expanded
  });

  const lessonForm = useForm<LessonForm>({
    resolver: zodResolver(lessonSchema),
    defaultValues: { title: '', order: (lessons?.length ?? 0) + 1 }
  });

  const moduleEditForm = useForm<ModuleForm>({
    resolver: zodResolver(moduleSchema),
    defaultValues: { title: module.title, order: module.order }
  });

  const createLessonMut = useMutation({
    mutationFn: (data: LessonForm) =>
      adminEndpoints.createLesson(slug, module.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-lessons', slug, module.id] });
      setAddingLesson(false);
      lessonForm.reset({ title: '', order: 1 });
      toast.success(t('admin.lessons.toast.lessonCreated'));
    },
    onError: () => toast.error(t('admin.lessons.toast.lessonCreateError'))
  });

  const deleteLessonMut = useMutation({
    mutationFn: (id: string) =>
      adminEndpoints.deleteLesson(slug, module.id, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-lessons', slug, module.id] });
      toast.success(t('admin.lessons.toast.lessonDeleted'));
    },
    onError: () => toast.error(t('admin.lessons.toast.lessonDeleteError'))
  });

  const updateModuleMut = useMutation({
    mutationFn: (data: ModuleForm) =>
      adminEndpoints.updateModule(slug, courseId, module.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-modules', slug, courseId] });
      setEditingModule(false);
      toast.success(t('admin.lessons.toast.moduleUpdated'));
    },
    onError: () => toast.error(t('admin.lessons.toast.moduleUpdateError'))
  });

  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      {/* Module header */}
      {editingModule ? (
        <form
          onSubmit={moduleEditForm.handleSubmit((d) =>
            updateModuleMut.mutate(d)
          )}
          className="flex flex-wrap items-center gap-3 p-4"
        >
          <input
            className="flex-1 min-w-[160px] rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            {...moduleEditForm.register('title')}
          />
          <input
            type="number"
            min={1}
            className="w-16 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            {...moduleEditForm.register('order')}
          />
          <button
            type="submit"
            disabled={updateModuleMut.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {updateModuleMut.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {t('admin.stepForm.saveButton')}
          </button>
          <button
            type="button"
            onClick={() => setEditingModule(false)}
            className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            {t('common.actions.cancel')}
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-3 px-5 py-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex flex-1 items-center gap-3 text-left"
          >
            {expanded ? (
              <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            )}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">{module.title}</p>
              <p className="text-xs text-muted-foreground">
                {t('admin.lessons.moduleLabel', { order: module.order })}
              </p>
            </div>
          </button>
          <button
            onClick={() => {
              setEditingModule(true);
              setExpanded(true);
            }}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label={t('admin.lessons.aria.editModule')}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (
                confirm(
                  t('admin.lessons.confirmDeleteModule', {
                    title: module.title
                  })
                )
              )
                onDeleteModule(module.id);
            }}
            disabled={isDeletingModule}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
            aria-label={t('admin.lessons.aria.deleteModule')}
          >
            {isDeletingModule ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      )}

      {/* Lessons */}
      {expanded && (
        <div className="space-y-3 border-t px-5 pb-5 pt-4">
          {loadingLessons ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {lessons?.map((lesson) => (
                <LessonSection
                  key={lesson.id}
                  slug={slug}
                  courseId={courseId}
                  moduleId={module.id}
                  lesson={lesson}
                  onDeleteLesson={(id) => deleteLessonMut.mutate(id)}
                  isDeletingLesson={
                    deleteLessonMut.isPending &&
                    deleteLessonMut.variables === lesson.id
                  }
                />
              ))}
              {lessons?.length === 0 && (
                <p className="py-2 text-center text-sm text-muted-foreground">
                  {t('admin.lessons.emptyModule')}
                </p>
              )}
            </>
          )}

          {/* Add lesson form */}
          {addingLesson ? (
            <form
              onSubmit={lessonForm.handleSubmit((d) =>
                createLessonMut.mutate(d)
              )}
              className="flex flex-wrap items-end gap-3 rounded-xl border bg-muted/30 p-4"
            >
              <div className="flex-1 min-w-[160px]">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t('admin.lessons.lessonTitle')}
                </label>
                <input
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  {...lessonForm.register('title')}
                />
                {lessonForm.formState.errors.title && (
                  <p className="mt-0.5 text-xs text-destructive">
                    {lessonForm.formState.errors.title.message}
                  </p>
                )}
              </div>
              <div className="w-20">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t('admin.lessons.moduleOrder')}
                </label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  {...lessonForm.register('order')}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createLessonMut.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {createLessonMut.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {t('admin.stepForm.saveButton')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingLesson(false);
                    lessonForm.reset();
                  }}
                  className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent"
                >
                  {t('common.actions.cancel')}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setAddingLesson(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-2.5 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <Plus className="h-4 w-4" />
              {t('admin.lessons.addLessonButton')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminLessonsPage() {
  const { courseId, tenantSlug } = useParams<{
    courseId: string;
    tenantSlug: string;
  }>();
  const slug = tenantSlug ?? '';
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { t } = useTranslation();
  const moduleSchema = z.object({
    title: z.string().min(2, t('admin.lessons.validation.title')),
    order: z.coerce.number().min(1, t('admin.lessons.validation.order'))
  });
  const [addingModule, setAddingModule] = useState(false);

  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: ['course', slug, courseId],
    queryFn: () => learningEndpoints.getCourse(slug, courseId!),
    enabled: !!courseId
  });

  const { data: modules, isLoading: loadingModules } = useQuery({
    queryKey: ['admin-modules', slug, courseId],
    queryFn: () => learningEndpoints.getModules(slug, courseId!),
    enabled: !!courseId
  });

  const moduleForm = useForm<ModuleForm>({
    resolver: zodResolver(moduleSchema),
    defaultValues: { title: '', order: (modules?.length ?? 0) + 1 }
  });

  const createModuleMut = useMutation({
    mutationFn: (data: ModuleForm) =>
      adminEndpoints.createModule(slug, courseId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-modules', slug, courseId] });
      setAddingModule(false);
      moduleForm.reset({ title: '', order: 1 });
      toast.success(t('admin.lessons.toast.moduleCreated'));
    },
    onError: () => toast.error(t('admin.lessons.toast.moduleCreateError'))
  });

  const deleteModuleMut = useMutation({
    mutationFn: (id: string) =>
      adminEndpoints.deleteModule(slug, courseId!, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-modules', slug, courseId] });
      toast.success(t('admin.lessons.toast.moduleDeleted'));
    },
    onError: () => toast.error(t('admin.lessons.toast.moduleDeleteError'))
  });

  return (
    <div className="space-y-6">
      {/* Header + Breadcrumb */}
      <div>
        <button
          onClick={() => navigate(`/t/${slug}/admin/courses`)}
          className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('app.course.backToCourses')}
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">
              {loadingCourse ? (
                <span className="inline-block h-8 w-48 animate-pulse rounded bg-muted" />
              ) : (
                course?.title
              )}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {t('admin.lessons.courseSubtitle')}
            </p>
          </div>
          {!addingModule && (
            <button
              onClick={() => setAddingModule(true)}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              {t('admin.lessons.newModuleButton')}
            </button>
          )}
        </div>
      </div>

      {/* Add module form */}
      {addingModule && (
        <form
          onSubmit={moduleForm.handleSubmit((d) => createModuleMut.mutate(d))}
          className="flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-5 shadow-sm"
        >
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm font-medium">
              {t('admin.lessons.moduleTitle')}
            </label>
            <input
              placeholder={t('admin.lessons.moduleTitlePlaceholder')}
              className="w-full rounded-lg border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              {...moduleForm.register('title')}
            />
            {moduleForm.formState.errors.title && (
              <p className="mt-1 text-xs text-destructive">
                {moduleForm.formState.errors.title.message}
              </p>
            )}
          </div>
          <div className="w-24">
            <label className="mb-1 block text-sm font-medium">
              {t('admin.lessons.moduleOrder')}
            </label>
            <input
              type="number"
              min={1}
              className="w-full rounded-lg border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              {...moduleForm.register('order')}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createModuleMut.isPending}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {createModuleMut.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {t('admin.stepForm.saveButton')}
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingModule(false);
                moduleForm.reset();
              }}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              {t('common.actions.cancel')}
            </button>
          </div>
        </form>
      )}

      {/* Modules list */}
      {loadingModules ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {modules?.map((mod) => (
            <ModuleSection
              key={mod.id}
              slug={slug}
              courseId={courseId!}
              module={mod}
              onDeleteModule={(id) => deleteModuleMut.mutate(id)}
              isDeletingModule={
                deleteModuleMut.isPending &&
                deleteModuleMut.variables === mod.id
              }
            />
          ))}
          {modules?.length === 0 && !addingModule && (
            <div className="py-16 text-center text-muted-foreground">
              <BookOpen className="mx-auto mb-4 h-12 w-12 opacity-30" />
              <p>{t('admin.lessons.noModules')}</p>
              <button
                onClick={() => setAddingModule(true)}
                className="mt-3 text-sm font-medium text-primary hover:underline"
              >
                {t('admin.lessons.createFirstModule')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
