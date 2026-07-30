import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useNavigate } from 'react-router-dom';
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
  Settings2,
  Calendar,
  ImagePlus,
  Sparkles
} from 'lucide-react';
import { learningEndpoints } from '@/services/endpoints/learning.endpoints';
import { adminEndpoints } from '@/services/endpoints/admin.endpoints';
import { FileUploadService } from '@/services/FileUploadService';
import type { Course } from '@/types/api';

function getApiErrorMessage(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return undefined;
  }
  const withResponse = error as { response?: { data?: { message?: string } } };
  return withResponse.response?.data?.message;
}

// Helper para construir URLs de storage
const getStorageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  // Usa window.location.origin para montar a URL absoluta
  return `${window.location.origin}/trivestia/storage${path}`;
};

// ─── Schema (definido dentro de CourseForm para usar t()) ───────────────────────

type FormData = {
  title: string;
  description: string;
  deadline?: string;
  thumbnailUrl?: string | null;
};

interface CourseFormProps {
  initial?: Course;
  onSave: (data: FormData) => Promise<unknown>;
  onCancel: () => void;
  loading: boolean;
  slug: string;
}

function CourseForm({
  initial,
  onSave,
  onCancel,
  loading,
  slug
}: CourseFormProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    getStorageUrl(initial?.thumbnailUrl)
  );

  const schema = z.object({
    title: z.string().min(3, t('admin.courses.validation.title')),
    description: z.string().min(10, t('admin.courses.validation.description')),
    deadline: z.string().optional(),
    thumbnailUrl: z.string().optional().nullable()
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial?.title ?? '',
      description: initial?.description ?? '',
      thumbnailUrl: initial?.thumbnailUrl ?? null,
      deadline: initial?.deadline
        ? new Date(initial.deadline).toISOString().slice(0, 16)
        : ''
    }
  });

  const handleSave = (data: FormData) => {
    return onSave({
      ...data,
      deadline: data.deadline
        ? new Date(data.deadline).toISOString()
        : undefined
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadProgress(0);
      const res = await FileUploadService.upload(
        slug,
        file,
        'courses/thumbnails',
        (pct) => setUploadProgress(pct)
      );
      setValue('thumbnailUrl', res.path, { shouldDirty: true });
      setPreviewUrl(res.url);
      toast.success('Thumbnail enviada com sucesso!');
    } catch (error) {
      toast.error('Falha ao enviar a imagem.');
      console.error('Erro ao enviar thumbnail:', error);
    } finally {
      setUploadProgress(null);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleSave)}
      className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm"
    >
      <div className="flex flex-col md:flex-row gap-6">
        {/* Thumbnail Picker */}
        <div className="shrink-0">
          <label className="mb-1.5 block text-sm font-medium">Thumbnail</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative flex h-32 w-56 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-muted/30 transition hover:border-primary/50 hover:bg-muted/50"
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Thumbnail"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <ImagePlus className="h-8 w-8 opacity-40" />
                <span className="text-xs">Upload imagem</span>
              </div>
            )}

            {uploadProgress !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                <div className="w-2/3 space-y-1.5">
                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-center text-[10px] font-bold text-white">
                    {uploadProgress}%
                  </p>
                </div>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {previewUrl && (
            <button
              type="button"
              onClick={() => {
                setPreviewUrl(null);
                setValue('thumbnailUrl', null, { shouldDirty: true });
              }}
              className="mt-2 text-xs text-destructive hover:underline"
            >
              Remover imagem
            </button>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t('admin.courses.form.title')}
            </label>
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
            <label className="mb-1 block text-sm font-medium">
              {t('admin.courses.form.description')}
            </label>
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
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 border-t pt-4">
        <div className="w-full max-w-xs">
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            {t('admin.courses.form.deadline')}
          </label>
          <input
            type="datetime-local"
            className="w-full rounded-lg border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            {...register('deadline')}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('admin.courses.page.saveButton')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border px-6 py-2 text-sm font-medium transition hover:bg-accent"
          >
            {t('common.actions.cancel')}
          </button>
        </div>
      </div>
    </form>
  );
}

export default function AdminCoursesPage() {
  const { t } = useTranslation();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const slug = tenantSlug ?? '';
  const qc = useQueryClient();
  const navigate = useNavigate();
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
    onError: (error: unknown) =>
      toast.error(getApiErrorMessage(error) ?? t('admin.courses.toast.error'))
  });

  // PATCH /courses/:id — Bearer ADMIN
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      adminEndpoints.updateCourse(slug, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses', slug] });
      setEditing(null);
      toast.success(t('admin.courses.toast.updated'));
    },
    onError: () => toast.error(t('admin.courses.toast.updateError'))
  });
  // DELETE /courses/:id — Bearer ADMIN
  const deleteMut = useMutation({
    mutationFn: (id: string) => adminEndpoints.deleteCourse(slug, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses', slug] });
      toast.success(t('admin.courses.toast.deleted'));
    },
    onError: () => toast.error(t('admin.courses.toast.deleteError'))
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">
            {t('admin.nav.manageCourses')}
          </h1>
          <p className="text-muted-foreground">
            {t('admin.courses.page.subtitle')}
          </p>
        </div>
        {!creating && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/t/${slug}/admin/ai-course`)}
              className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 transition hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300 dark:hover:bg-purple-900"
            >
              <Sparkles className="h-4 w-4" />
              Criar com IA
            </button>
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              {t('admin.courses.page.newButton')}
            </button>
          </div>
        )}
      </div>

      {creating && (
        <CourseForm
          slug={slug}
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
                  slug={slug}
                  initial={course}
                  onSave={(data) =>
                    updateMut.mutateAsync({ id: course.id, data })
                  }
                  onCancel={() => setEditing(null)}
                  loading={updateMut.isPending}
                />
              ) : (
                <div className="flex items-center gap-4 rounded-2xl border bg-card px-5 py-4 shadow-sm">
                  {course.thumbnailUrl ? (
                    <img
                      src={getStorageUrl(course.thumbnailUrl) || ''}
                      alt=""
                      className="h-16 w-28 shrink-0 rounded-lg object-cover bg-muted"
                    />
                  ) : (
                    <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <BookOpen className="h-6 w-6" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{course.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {course.description}
                    </p>
                    {course.deadline && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {t('admin.courses.page.deadlinePrefix')}{' '}
                        {new Date(course.deadline).toLocaleString('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/t/${slug}/admin/courses/${course.id}/teacher-profile`}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-500/20"
                      aria-label="Configurar professor virtual"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      Professor
                    </Link>
                    <Link
                      to={`/t/${slug}/admin/courses/${course.id}/lessons`}
                      className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"
                      aria-label={t('admin.courses.aria.manage')}
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                      {t('admin.courses.page.manageButton')}
                    </Link>
                    <Link
                      to={`/t/${slug}/admin/courses/${course.id}/periods`}
                      className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400 transition hover:bg-amber-500/20"
                      aria-label={t('admin.courses.aria.periods')}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      {t('admin.courses.page.periodsButton')}
                    </Link>
                    <button
                      onClick={() => setEditing(course)}
                      className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                      aria-label={t('admin.courses.aria.edit')}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            t('admin.courses.confirm.delete', {
                              title: course.title
                            })
                          )
                        )
                          deleteMut.mutate(course.id);
                      }}
                      className="rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                      aria-label={t('admin.courses.aria.delete')}
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
              <p>{t('admin.courses.page.empty')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
