import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  BookOpen,
  X,
  Settings2,
  Calendar
} from 'lucide-react';
import { learningEndpoints } from '@/services/endpoints/learning.endpoints';
import { adminEndpoints } from '@/services/endpoints/admin.endpoints';
import type { Course } from '@/types/api';

// ─── Schema (definido dentro de CourseForm para usar t()) ───────────────────────

type FormData = { title: string; description: string; deadline?: string };

interface CourseFormProps {
  initial?: Course;
  onSave: (data: FormData) => Promise<unknown>;
  onCancel: () => void;
  loading: boolean;
}

function CourseForm({ initial, onSave, onCancel, loading }: CourseFormProps) {
  const { t } = useTranslation();

  const schema = z.object({
    title: z.string().min(3, t('admin.courses.validation.title')),
    description: z.string().min(10, t('admin.courses.validation.description')),
    deadline: z.string().optional()
  });

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial?.title ?? '',
      description: initial?.description ?? '',
      deadline: initial?.deadline
        ? new Date(initial.deadline).toISOString().slice(0, 16)
        : ''
    }
  });

  const handleSave = (data: FormData) => {
    return onSave({
      ...data,
      deadline: data.deadline ? new Date(data.deadline).toISOString() : undefined
    });
  };

  return (
    <form
      onSubmit={handleSubmit(handleSave)}
      className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm"
    >
      <div>
        <label className="mb-1 block text-sm font-medium">{t('admin.courses.form.title')}</label>
        <input
          placeholder={t('admin.courses.form.titlePlaceholder')}
          className="w-full rounded-lg border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          {...register('title')}
        />
        {errors.title && (
          <p className="mt-1 text-xs text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t('admin.courses.form.description')}</label>
        <textarea
          rows={3}
          placeholder={t('admin.courses.form.descriptionPlaceholder')}
          className="w-full resize-none rounded-lg border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          {...register('description')}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          {t('admin.courses.form.deadline')}
        </label>
        <input
          type="datetime-local"
          className="w-full rounded-lg border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          {...register('deadline')}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {t('admin.courses.form.deadlineHint')}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-accent"
        >
          {t('common.actions.cancel')}
        </button>
      </div>
    </form>
  );
}

export default function AdminCoursesPage() {
  const { t } = useTranslation();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const slug = tenantSlug ?? '';
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);

  // GET /courses — público
  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses', slug],
    queryFn: () => learningEndpoints.getCourses(slug)
  });

  // POST /courses — Bearer ADMIN
  const createMut = useMutation({
    mutationFn: (data: FormData) => adminEndpoints.createCourse(slug, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses', slug] });
      setCreating(false);
      toast.success(t('admin.courses.toast.created'));
    },
    onError: () => toast.error(t('admin.courses.toast.error'))
  });

  // PATCH /courses/:id — Bearer ADMIN
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      adminEndpoints.updateCourse(slug, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses', slug] });
      setEditing(null);
      toast.success('Curso atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar curso.')
  });

  // DELETE /courses/:id — Bearer ADMIN
  const deleteMut = useMutation({
    mutationFn: (id: string) => adminEndpoints.deleteCourse(slug, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses', slug] });
      toast.success('Curso excluído.');
    },
    onError: () => toast.error('Erro ao excluir curso.')
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">{t('admin.nav.manageCourses')}</h1>
          <p className="text-muted-foreground">
            Crie, edite e organize os cursos da plataforma.
          </p>
        </div>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Novo curso
          </button>
        )}
      </div>

      {creating && (
        <CourseForm
          onSave={(data) => createMut.mutateAsync(data)}
          onCancel={() => setCreating(false)}
          loading={createMut.isPending}
        />
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse h-20 rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {courses?.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              {editing?.id === course.id ? (
                <CourseForm
                  initial={course}
                  onSave={(data) =>
                    updateMut.mutateAsync({ id: course.id, data })
                  }
                  onCancel={() => setEditing(null)}
                  loading={updateMut.isPending}
                />
              ) : (
                <div className="flex items-center gap-4 rounded-2xl border bg-card px-5 py-4 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{course.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {course.description}
                    </p>
                    {course.deadline && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        Prazo: {new Date(course.deadline).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/t/${slug}/admin/courses/${course.id}/lessons`}
                      className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"
                      aria-label="Gerenciar módulos e aulas"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                      Gerenciar
                    </Link>
                    <Link
                      to={`/t/${slug}/admin/courses/${course.id}/periods`}
                      className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400 transition hover:bg-amber-500/20"
                      aria-label="Períodos avaliativos"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      Períodos
                    </Link>
                    <button
                      onClick={() => setEditing(course)}
                      className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir "${course.title}"?`))
                          deleteMut.mutate(course.id);
                      }}
                      className="rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Excluir"
                    >
                      {deleteMut.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {courses?.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              <BookOpen className="mx-auto mb-4 h-12 w-12 opacity-30" />
              <p>Nenhum curso criado ainda.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
