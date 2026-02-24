import { useState } from 'react';
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
  Route
} from 'lucide-react';
import { learningEndpoints } from '@/services/endpoints/learning.endpoints';
import { adminEndpoints } from '@/services/endpoints/admin.endpoints';
import { cn, getActivityTypeLabel } from '@/lib/utils';
import type {
  Module,
  Lesson,
  ActivitySummary,
  ActivityType
} from '@/types/api';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const moduleSchema = z.object({
  title: z.string().min(2, 'Mínimo 2 caracteres'),
  order: z.coerce.number().min(1, 'Mínimo 1')
});
type ModuleForm = z.infer<typeof moduleSchema>;

const lessonSchema = z.object({
  title: z.string().min(2, 'Mínimo 2 caracteres'),
  order: z.coerce.number().min(1, 'Mínimo 1')
});
type LessonForm = z.infer<typeof lessonSchema>;

const activitySchema = z.object({
  title: z.string().min(2, 'Mínimo 2 caracteres'),
  order: z.coerce.number().min(1, 'Mínimo 1'),
  type: z.enum([
    'MULTIPLE_CHOICE',
    'MULTIPLE_SELECT',
    'TRUE_FALSE',
    'ORDERING',
    'TEXT_INPUT',
    'SCENARIO'
  ] as const)
});
type ActivityForm = z.infer<typeof activitySchema>;

const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: 'MULTIPLE_CHOICE', label: 'Múltipla Escolha' },
  { value: 'MULTIPLE_SELECT', label: 'Múltipla Seleção' },
  { value: 'TRUE_FALSE', label: 'Verdadeiro/Falso' },
  { value: 'ORDERING', label: 'Ordenação' },
  { value: 'TEXT_INPUT', label: 'Resposta Aberta' },
  { value: 'SCENARIO', label: 'Cenário' }
];

const TYPE_COLORS: Record<ActivityType, string> = {
  MULTIPLE_CHOICE: 'bg-blue-500/10 text-blue-600 border-blue-200',
  MULTIPLE_SELECT: 'bg-purple-500/10 text-purple-600 border-purple-200',
  TRUE_FALSE: 'bg-green-500/10 text-green-600 border-green-200',
  ORDERING: 'bg-orange-500/10 text-orange-600 border-orange-200',
  TEXT_INPUT: 'bg-pink-500/10 text-pink-600 border-pink-200',
  SCENARIO: 'bg-yellow-500/10 text-yellow-700 border-yellow-200'
};

// ─── ActivityRow ─────────────────────────────────────────────────────────────

function ActivityRow({
  lessonId,
  activity,
  onDelete,
  isDeleting
}: {
  lessonId: string;
  activity: ActivitySummary;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-background px-4 py-2.5">
      <Zap className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate text-sm font-medium">
        {activity.title}
      </span>
      <span
        className={cn(
          'shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium',
          TYPE_COLORS[activity.type] ?? 'bg-muted text-muted-foreground'
        )}
      >
        {getActivityTypeLabel(activity.type)}
      </span>
      <Link
        to={`/admin/lessons/${lessonId}/activities/${activity.id}/questions`}
        className="flex shrink-0 items-center gap-1 rounded-lg border px-3 py-1 text-xs font-medium transition hover:bg-accent"
      >
        <HelpCircle className="h-3 w-3" />
        Questões
      </Link>
      <button
        onClick={onDelete}
        disabled={isDeleting}
        className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
        aria-label="Excluir atividade"
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
  courseId,
  moduleId,
  lesson,
  onDeleteLesson,
  isDeletingLesson
}: {
  courseId: string;
  moduleId: string;
  lesson: Lesson;
  onDeleteLesson: (id: string) => void;
  isDeletingLesson: boolean;
}) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [addingActivity, setAddingActivity] = useState(false);
  const [editingLesson, setEditingLesson] = useState(false);

  const { data: activities, isLoading: loadingActivities } = useQuery({
    queryKey: ['admin-activities', lesson.id],
    queryFn: () => learningEndpoints.getActivities(lesson.id),
    enabled: expanded
  });

  const actForm = useForm<ActivityForm>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: '',
      order: (activities?.length ?? 0) + 1,
      type: 'MULTIPLE_CHOICE'
    }
  });

  const lessonEditForm = useForm<LessonForm>({
    resolver: zodResolver(lessonSchema),
    defaultValues: { title: lesson.title, order: lesson.order }
  });

  const createActivityMut = useMutation({
    mutationFn: (data: ActivityForm) =>
      adminEndpoints.createActivity(lesson.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-activities', lesson.id] });
      setAddingActivity(false);
      actForm.reset({ title: '', order: 1, type: 'MULTIPLE_CHOICE' });
      toast.success('Atividade criada!');
    },
    onError: () => toast.error('Erro ao criar atividade.')
  });

  const deleteActivityMut = useMutation({
    mutationFn: (id: string) => adminEndpoints.deleteActivity(lesson.id, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-activities', lesson.id] });
      toast.success('Atividade excluída.');
    },
    onError: () => toast.error('Erro ao excluir atividade.')
  });

  const updateLessonMut = useMutation({
    mutationFn: (data: LessonForm) =>
      adminEndpoints.updateLesson(moduleId, lesson.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-lessons', moduleId] });
      setEditingLesson(false);
      toast.success('Aula atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar aula.')
  });

  return (
    <div className="rounded-xl border bg-card">
      {/* Lesson header */}
      {editingLesson ? (
        <form
          onSubmit={lessonEditForm.handleSubmit((d) =>
            updateLessonMut.mutate(d)
          )}
          className="flex flex-wrap items-center gap-3 p-3"
        >
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
            Salvar
          </button>
          <button
            type="button"
            onClick={() => setEditingLesson(false)}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            Cancelar
          </button>
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
          <Link
            to={`/admin/courses/${courseId}/lessons/${lesson.id}/steps`}
            className="flex shrink-0 items-center gap-1 rounded-lg border px-3 py-1 text-xs font-medium transition hover:bg-accent"
          >
            <Route className="h-3 w-3" />
            Etapas
          </Link>
          <button
            onClick={() => {
              setEditingLesson(true);
              setExpanded(true);
            }}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Editar aula"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Excluir aula "${lesson.title}"?`))
                onDeleteLesson(lesson.id);
            }}
            disabled={isDeletingLesson}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
            aria-label="Excluir aula"
          >
            {isDeletingLesson ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      )}

      {/* Activities */}
      {expanded && (
        <div className="space-y-2 border-t px-4 pb-4 pt-3">
          {loadingActivities ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {activities?.map((act) => (
                <ActivityRow
                  key={act.id}
                  lessonId={lesson.id}
                  activity={act}
                  onDelete={() => {
                    if (confirm(`Excluir atividade "${act.title}"?`))
                      deleteActivityMut.mutate(act.id);
                  }}
                  isDeleting={
                    deleteActivityMut.isPending &&
                    deleteActivityMut.variables === act.id
                  }
                />
              ))}
              {activities?.length === 0 && (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  Nenhuma atividade nesta aula.
                </p>
              )}
            </>
          )}

          {/* Add activity form */}
          {addingActivity ? (
            <form
              onSubmit={actForm.handleSubmit((d) =>
                createActivityMut.mutate(d)
              )}
              className="mt-1 flex flex-wrap items-end gap-3 rounded-xl border bg-muted/30 p-3"
            >
              <div className="flex-1 min-w-[140px]">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Título
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
              <div className="w-16">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Ordem
                </label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  {...actForm.register('order')}
                />
              </div>
              <div className="flex-1 min-w-[160px]">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Tipo
                </label>
                <select
                  className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  {...actForm.register('type')}
                >
                  {ACTIVITY_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createActivityMut.isPending}
                  className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {createActivityMut.isPending && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingActivity(false);
                    actForm.reset();
                  }}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setAddingActivity(true)}
              className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar atividade
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ModuleSection ────────────────────────────────────────────────────────────

function ModuleSection({
  courseId,
  module,
  onDeleteModule,
  isDeletingModule
}: {
  courseId: string;
  module: Module;
  onDeleteModule: (id: string) => void;
  isDeletingModule: boolean;
}) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [addingLesson, setAddingLesson] = useState(false);
  const [editingModule, setEditingModule] = useState(false);

  const { data: lessons, isLoading: loadingLessons } = useQuery({
    queryKey: ['admin-lessons', module.id],
    queryFn: () => learningEndpoints.getLessons(module.id),
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
      adminEndpoints.createLesson(module.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-lessons', module.id] });
      setAddingLesson(false);
      lessonForm.reset({ title: '', order: 1 });
      toast.success('Aula criada!');
    },
    onError: () => toast.error('Erro ao criar aula.')
  });

  const deleteLessonMut = useMutation({
    mutationFn: (id: string) => adminEndpoints.deleteLesson(module.id, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-lessons', module.id] });
      toast.success('Aula excluída.');
    },
    onError: () => toast.error('Erro ao excluir aula.')
  });

  const updateModuleMut = useMutation({
    mutationFn: (data: ModuleForm) =>
      adminEndpoints.updateModule(courseId, module.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-modules', courseId] });
      setEditingModule(false);
      toast.success('Módulo atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar módulo.')
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
            Salvar
          </button>
          <button
            type="button"
            onClick={() => setEditingModule(false)}
            className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Cancelar
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
                Módulo {module.order}
              </p>
            </div>
          </button>
          <button
            onClick={() => {
              setEditingModule(true);
              setExpanded(true);
            }}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Editar módulo"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (
                confirm(
                  `Excluir módulo "${module.title}"? Todas as aulas serão removidas.`
                )
              )
                onDeleteModule(module.id);
            }}
            disabled={isDeletingModule}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
            aria-label="Excluir módulo"
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
                  Nenhuma aula neste módulo.
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
                  Título da Aula
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
                  Ordem
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
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingLesson(false);
                    lessonForm.reset();
                  }}
                  className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-accent"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setAddingLesson(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-2.5 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <Plus className="h-4 w-4" />
              Adicionar aula
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminLessonsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [addingModule, setAddingModule] = useState(false);

  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => learningEndpoints.getCourse(courseId!),
    enabled: !!courseId
  });

  const { data: modules, isLoading: loadingModules } = useQuery({
    queryKey: ['admin-modules', courseId],
    queryFn: () => learningEndpoints.getModules(courseId!),
    enabled: !!courseId
  });

  const moduleForm = useForm<ModuleForm>({
    resolver: zodResolver(moduleSchema),
    defaultValues: { title: '', order: (modules?.length ?? 0) + 1 }
  });

  const createModuleMut = useMutation({
    mutationFn: (data: ModuleForm) =>
      adminEndpoints.createModule(courseId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-modules', courseId] });
      setAddingModule(false);
      moduleForm.reset({ title: '', order: 1 });
      toast.success('Módulo criado!');
    },
    onError: () => toast.error('Erro ao criar módulo.')
  });

  const deleteModuleMut = useMutation({
    mutationFn: (id: string) => adminEndpoints.deleteModule(courseId!, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-modules', courseId] });
      toast.success('Módulo excluído.');
    },
    onError: () => toast.error('Erro ao excluir módulo.')
  });

  return (
    <div className="space-y-6">
      {/* Header + Breadcrumb */}
      <div>
        <button
          onClick={() => navigate('/admin/courses')}
          className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar aos cursos
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
              Gerencie os módulos, aulas e atividades deste curso.
            </p>
          </div>
          {!addingModule && (
            <button
              onClick={() => setAddingModule(true)}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Novo módulo
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
              Título do Módulo
            </label>
            <input
              placeholder="Ex: Fundamentos de Análise"
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
            <label className="mb-1 block text-sm font-medium">Ordem</label>
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
              Salvar
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingModule(false);
                moduleForm.reset();
              }}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Cancelar
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
              <p>Nenhum módulo criado ainda.</p>
              <button
                onClick={() => setAddingModule(true)}
                className="mt-3 text-sm font-medium text-primary hover:underline"
              >
                Criar primeiro módulo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
