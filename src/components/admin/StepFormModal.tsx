import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Portal } from '@/components/ui/Portal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X, Loader2, FileText, Video, Image, ImagePlus } from 'lucide-react';
import { stepsEndpoints } from '@/services/endpoints/steps.endpoints';
import { adminEndpoints } from '@/services/endpoints/admin.endpoints';
import { cn } from '@/lib/utils';
import type {
  LessonStepDTO,
  StepType,
  CreateStepDTO,
  UpdateStepDTO
} from '@/types/api';

// ─── Schema ────────────────────────────────────────────────────────────────────

// (schema moved inside StepFormModal to allow useTranslation)

interface StepFormData {
  type: 'CONTENT_TEXT' | 'CONTENT_VIDEO' | 'CONTENT_IMAGE' | 'ACTIVITY';
  title: string;
  isOptional?: boolean;
  estimatedMinutes?: number;
  body?: string;
  url?: string;
  alt?: string;
  caption?: string;
  activityId?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formToCreateDTO(data: StepFormData, order: number): CreateStepDTO {
  let content: Record<string, unknown> = {};
  switch (data.type) {
    case 'CONTENT_TEXT':
      content = { body: data.body ?? '' };
      break;
    case 'CONTENT_VIDEO':
      content = { url: data.url ?? '' };
      break;
    case 'CONTENT_IMAGE':
      content = {
        url: data.url ?? '',
        alt: data.alt ?? '',
        caption: data.caption
      };
      break;
    case 'ACTIVITY':
      content = { activityId: data.activityId ?? '' };
      break;
  }
  return {
    type: data.type,
    title: data.title,
    content,
    order,
    isOptional: data.isOptional,
    estimatedMinutes: data.estimatedMinutes || undefined
  };
}

function formToUpdateDTO(data: StepFormData): UpdateStepDTO {
  let content: Record<string, unknown> = {};
  switch (data.type) {
    case 'CONTENT_TEXT':
      content = { body: data.body ?? '' };
      break;
    case 'CONTENT_VIDEO':
      content = { url: data.url ?? '' };
      break;
    case 'CONTENT_IMAGE':
      content = {
        url: data.url ?? '',
        alt: data.alt ?? '',
        caption: data.caption
      };
      break;
    case 'ACTIVITY':
      content = { activityId: data.activityId ?? '' };
      break;
  }
  return {
    type: data.type,
    title: data.title,
    content,
    isOptional: data.isOptional,
    estimatedMinutes: data.estimatedMinutes || undefined
  };
}

export function dtoToForm(step: LessonStepDTO): StepFormData {
  const c = step.content as Record<string, unknown>;
  return {
    type: step.type,
    title: step.title,
    isOptional: step.isOptional,
    estimatedMinutes: step.estimatedMinutes ?? undefined,
    body: (c.body as string) ?? '',
    url: (c.url as string) ?? '',
    alt: (c.alt as string) ?? '',
    caption: (c.caption as string) ?? '',
    activityId: (c.activityId as string) ?? ''
  };
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface StepFormModalProps {
  slug: string;
  lessonId: string;
  /** Se passado, é modo edição; senão, criação */
  step?: LessonStepDTO;
  /** Ordem para novos steps */
  nextOrder: number;
  /** Query key do React Query a invalidar ao salvar */
  queryKey: (string | null | undefined)[];
  onClose: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function StepFormModal({
  slug,
  lessonId,
  step,
  nextOrder,
  queryKey,
  onClose
}: StepFormModalProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isEditing = !!step;

  const stepFormSchema = z.object({
    type: z.enum([
      'CONTENT_TEXT',
      'CONTENT_VIDEO',
      'CONTENT_IMAGE',
      'ACTIVITY'
    ]),
    title: z.string().min(2, t('admin.stepForm.validation.titleMin')),
    isOptional: z.boolean().optional(),
    estimatedMinutes: z.coerce.number().min(0).optional(),
    body: z.string().optional(),
    url: z.string().optional(),
    alt: z.string().optional(),
    caption: z.string().optional(),
    activityId: z.string().optional()
  });

  const CONTENT_TYPES_TRANSLATED: {
    value: StepType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      value: 'CONTENT_TEXT',
      label: t('learning.timeline.stepTypes.text'),
      icon: FileText
    },
    {
      value: 'CONTENT_VIDEO',
      label: t('learning.timeline.stepTypes.video'),
      icon: Video
    },
    {
      value: 'CONTENT_IMAGE',
      label: t('learning.timeline.stepTypes.image'),
      icon: Image
    }
  ];

  const form = useForm<StepFormData>({
    resolver: zodResolver(stepFormSchema),
    defaultValues: step
      ? dtoToForm(step)
      : {
          type: 'CONTENT_TEXT',
          title: '',
          isOptional: false,
          body: '',
          url: '',
          alt: '',
          caption: ''
        }
  });

  const watchType = form.watch('type');
  const watchUrl = form.watch('url');

  // ── Image upload ──────────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    step?.type === 'CONTENT_IMAGE'
      ? (((step.content as Record<string, unknown>).url as string) ?? null)
      : null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: (data: CreateStepDTO) =>
      stepsEndpoints.createStep(slug, lessonId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success(t('admin.stepForm.toast.created'));
      onClose();
    },
    onError: () => toast.error(t('admin.stepForm.toast.createError'))
  });

  const updateMut = useMutation({
    mutationFn: (data: UpdateStepDTO) =>
      stepsEndpoints.updateStep(slug, lessonId, step!.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success(t('admin.stepForm.toast.updated'));
      onClose();
    },
    onError: () => toast.error(t('admin.stepForm.toast.updateError'))
  });

  const isPending = createMut.isPending || updateMut.isPending || uploading;

  const onSubmit = async (data: StepFormData) => {
    // Upload image if file selected
    if (data.type === 'CONTENT_IMAGE' && imageFile) {
      setUploading(true);
      try {
        const url = await adminEndpoints.uploadQuestionImage(slug, imageFile);
        form.setValue('url', url);
        data.url = url;
      } catch {
        toast.error(t('admin.stepForm.toast.uploadError'));
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    if (isEditing) {
      updateMut.mutate(formToUpdateDTO(data));
    } else {
      createMut.mutate(formToCreateDTO(data, nextOrder));
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {isEditing
                ? t('admin.stepForm.editTitle')
                : t('admin.stepForm.createTitle')}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-accent"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Type selector — only for new steps */}
            {!isEditing && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {t('admin.stepForm.typeLabel')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CONTENT_TYPES_TRANSLATED.map(
                    ({ value, label, icon: TypeIcon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => form.setValue('type', value)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition',
                          watchType === value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-accent'
                        )}
                      >
                        <TypeIcon className="h-5 w-5" />
                        {label}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                {t('admin.stepForm.titleLabel')}
              </label>
              <input
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder={t('admin.stepForm.titlePlaceholder')}
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            {/* ── TEXT ── */}
            {watchType === 'CONTENT_TEXT' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {t('admin.stepForm.contentLabel')}
                </label>
                <textarea
                  className="h-40 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring font-mono"
                  placeholder={t('admin.stepForm.contentPlaceholder')}
                  {...form.register('body')}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('admin.stepForm.htmlHint')}
                </p>
              </div>
            )}

            {/* ── VIDEO ── */}
            {watchType === 'CONTENT_VIDEO' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {t('admin.stepForm.videoUrlLabel')}
                </label>
                <input
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
                  {...form.register('url')}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('admin.stepForm.videoHint')}
                </p>
                {watchUrl && (
                  <div className="mt-2 aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                    <iframe
                      src={watchUrl.replace('watch?v=', 'embed/')}
                      className="h-full w-full"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── IMAGE ── */}
            {watchType === 'CONTENT_IMAGE' && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    {t('admin.stepForm.imageLabel')}
                  </label>

                  {/* Preview */}
                  {imagePreview ? (
                    <div className="relative mb-2 rounded-lg overflow-hidden border">
                      <img
                        src={imagePreview}
                        alt="preview"
                        className="max-h-48 w-full object-contain bg-muted"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setImageFile(null);
                          form.setValue('url', '');
                        }}
                        className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-6 text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
                    >
                      <ImagePlus className="h-6 w-6" />
                      {t('admin.stepForm.imageUploadButton')}
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {/* Ou URL manual */}
                  <div className="mt-2">
                    <label className="mb-1 block text-xs text-muted-foreground">
                      {t('admin.stepForm.imageUrlLabel')}
                    </label>
                    <input
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      placeholder="https://..."
                      {...form.register('url')}
                      onChange={(e) => {
                        form.setValue('url', e.target.value);
                        if (e.target.value) {
                          setImagePreview(e.target.value);
                          setImageFile(null);
                        }
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    {t('admin.stepForm.altLabel')}
                  </label>
                  <input
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder={t('admin.stepForm.altPlaceholder')}
                    {...form.register('alt')}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    {t('admin.stepForm.captionLabel')}{' '}
                    <span className="text-muted-foreground font-normal">
                      {t('common.misc.optional')}
                    </span>
                  </label>
                  <input
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder={t('admin.stepForm.captionPlaceholder')}
                    {...form.register('caption')}
                  />
                </div>
              </>
            )}

            {/* Meta */}
            <div className="flex items-end gap-4">
              <div className="w-36">
                <label className="mb-1.5 block text-sm font-medium">
                  {t('admin.stepForm.durationLabel')}
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder="0"
                    {...form.register('estimatedMinutes')}
                  />
                  <span className="shrink-0 text-xs text-muted-foreground">
                    min
                  </span>
                </div>
              </div>
              <label className="mb-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="rounded"
                  {...form.register('isOptional')}
                />
                {t('app.timeline.optional')}
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                {t('common.actions.cancel')}
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {uploading
                  ? t('admin.stepForm.uploadingImage')
                  : isEditing
                    ? t('admin.stepForm.saveButton')
                    : t('admin.stepForm.createButton')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}
