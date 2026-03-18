import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Portal } from '@/components/ui/Portal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  X,
  Loader2,
  FileText,
  Video,
  Image,
  ImagePlus,
  FileUp,
  Link2,
  FileArchive
} from 'lucide-react';
import { stepsEndpoints } from '@/services/endpoints/steps.endpoints';
import { FileUploadService } from '@/services/FileUploadService';
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
  articleVideoUrl?: string;
  articleImageUrl?: string;
  articleAttachmentUrl?: string;
  alt?: string;
  caption?: string;
  activityId?: string;
}

const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024;

function toPublicStorageUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http')) return pathOrUrl;

  // Caso venha apenas o path salvo no storage (/tenant/category/file.ext)
  if (pathOrUrl.startsWith('/')) {
    return import.meta.env.DEV
      ? `http://localhost:3333/storage${pathOrUrl}`
      : `${window.location.origin}/trivestia/storage${pathOrUrl}`;
  }

  return pathOrUrl;
}

function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null;

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const idFromWatch = url.match(/[?&]v=([^&]+)/)?.[1];
    const idFromShort = url.match(/youtu\.be\/([^?&]+)/)?.[1];
    const id = idFromWatch ?? idFromShort;
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }

  if (url.includes('vimeo.com')) {
    const id = url.match(/vimeo\.com\/(\d+)/)?.[1];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }

  return null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formToCreateDTO(data: StepFormData, order: number): CreateStepDTO {
  let content: Record<string, unknown> = {};
  switch (data.type) {
    case 'CONTENT_TEXT':
      content = {
        format: 'ARTICLE',
        body: data.body ?? '',
        videoUrl: data.articleVideoUrl ?? '',
        imageUrl: data.articleImageUrl ?? '',
        attachmentUrl: data.articleAttachmentUrl ?? ''
      };
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
      content = {
        format: 'ARTICLE',
        body: data.body ?? '',
        videoUrl: data.articleVideoUrl ?? '',
        imageUrl: data.articleImageUrl ?? '',
        attachmentUrl: data.articleAttachmentUrl ?? ''
      };
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
    articleVideoUrl: (c.videoUrl as string) ?? '',
    articleImageUrl: (c.imageUrl as string) ?? '',
    articleAttachmentUrl: (c.attachmentUrl as string) ?? '',
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
    articleVideoUrl: z.string().optional(),
    articleImageUrl: z.string().optional(),
    articleAttachmentUrl: z.string().optional(),
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
      label: 'Artigo',
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
            articleVideoUrl: '',
            articleImageUrl: '',
            articleAttachmentUrl: '',
          alt: '',
          caption: ''
        }
  });

  const watchType = form.watch('type');
  const watchUrl = form.watch('url');
          const watchArticleVideoUrl = form.watch('articleVideoUrl');
          const watchArticleImageUrl = form.watch('articleImageUrl');
          const watchArticleAttachmentUrl = form.watch('articleAttachmentUrl');

  // ── Image upload ──────────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const articleImageFileInputRef = useRef<HTMLInputElement>(null);
  const articleVideoFileInputRef = useRef<HTMLInputElement>(null);
  const articleAttachmentFileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    step?.type === 'CONTENT_IMAGE'
      ? (((step.content as Record<string, unknown>).url as string) ?? null)
      : null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [articleImageFile, setArticleImageFile] = useState<File | null>(null);
  const [articleVideoFile, setArticleVideoFile] = useState<File | null>(null);
  const [articleAttachmentFile, setArticleAttachmentFile] =
    useState<File | null>(null);
  const [articleImagePreview, setArticleImagePreview] = useState<string | null>(
    step?.type === 'CONTENT_TEXT'
      ? toPublicStorageUrl(
          (((step.content as Record<string, unknown>).imageUrl as string) ?? '')
        ) || null
      : null
  );
  const [uploading, setUploading] = useState(false);

  const resolvedVideoUrl = toPublicStorageUrl(watchUrl ?? '');
  const videoEmbedUrl = getVideoEmbedUrl(resolvedVideoUrl);
  const videoLocalPreview = videoFile ? URL.createObjectURL(videoFile) : null;
  const resolvedArticleVideoUrl = toPublicStorageUrl(watchArticleVideoUrl ?? '');
  const articleVideoEmbedUrl = getVideoEmbedUrl(resolvedArticleVideoUrl);
  const articleVideoLocalPreview = articleVideoFile
    ? URL.createObjectURL(articleVideoFile)
    : null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleVideoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Selecione um arquivo de vídeo válido.');
      return;
    }

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      toast.error('Vídeo maior que 200MB. Reduza o tamanho e tente novamente.');
      return;
    }

    setVideoFile(file);
  }

  function handleArticleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error('Imagem maior que 10MB.');
      return;
    }

    setArticleImageFile(file);
    setArticleImagePreview(URL.createObjectURL(file));
  }

  function handleArticleVideoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Selecione um vídeo válido.');
      return;
    }

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      toast.error('Vídeo maior que 200MB.');
      return;
    }

    setArticleVideoFile(file);
  }

  function handleArticleAttachmentFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf';
    if (!isPdf) {
      toast.error('Anexo deve ser PDF.');
      return;
    }

    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      toast.error('PDF maior que 25MB.');
      return;
    }

    setArticleAttachmentFile(file);
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
    // Upload article assets if needed
    if (data.type === 'CONTENT_TEXT') {
      setUploading(true);
      try {
        if (articleImageFile) {
          const imageResult = await FileUploadService.upload(
            slug,
            articleImageFile,
            'questions'
          );
          data.articleImageUrl = toPublicStorageUrl(imageResult.path);
          form.setValue('articleImageUrl', data.articleImageUrl);
        }

        if (articleVideoFile) {
          const videoResult = await FileUploadService.upload(
            slug,
            articleVideoFile,
            'courses/videos'
          );
          data.articleVideoUrl = toPublicStorageUrl(videoResult.path);
          form.setValue('articleVideoUrl', data.articleVideoUrl);
        }

        if (articleAttachmentFile) {
          const attachmentResult = await FileUploadService.upload(
            slug,
            articleAttachmentFile,
            'courses/materials'
          );
          data.articleAttachmentUrl = toPublicStorageUrl(attachmentResult.path);
          form.setValue('articleAttachmentUrl', data.articleAttachmentUrl);
        }
      } catch {
        toast.error('Falha no upload dos arquivos do artigo.');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    // Upload video if file selected
    if (data.type === 'CONTENT_VIDEO' && videoFile) {
      setUploading(true);
      try {
        const result = await FileUploadService.upload(
          slug,
          videoFile,
          'courses/videos'
        );

        const finalUrl = toPublicStorageUrl(result.path);
        form.setValue('url', finalUrl);
        data.url = finalUrl;
      } catch {
        toast.error('Falha no upload do vídeo.');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    // Upload image if file selected
    if (data.type === 'CONTENT_IMAGE' && imageFile) {
      setUploading(true);
      try {
        const result = await FileUploadService.upload(
          slug,
          imageFile,
          'questions'
        );
        const finalUrl = toPublicStorageUrl(result.path);
        form.setValue('url', finalUrl);
        data.url = finalUrl;
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
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
        <div className="my-4 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border bg-card shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-card px-6 py-4">
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

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
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
                  Conteúdo do artigo
                </label>

                <textarea
                  className="h-40 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring font-mono"
                  placeholder={t('admin.stepForm.contentPlaceholder')}
                  {...form.register('body')}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('admin.stepForm.htmlHint')}
                </p>

                  <div className="mt-4 space-y-3 rounded-lg border bg-background/40 p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Mídias do artigo
                    </p>

                    <div>
                      <label className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Link2 className="h-3.5 w-3.5" />
                        Vídeo por URL
                      </label>
                      <input
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                        placeholder="https://youtube.com/watch?v=..."
                        {...form.register('articleVideoUrl')}
                        onChange={(e) => {
                          form.setValue('articleVideoUrl', e.target.value);
                          if (e.target.value) setArticleVideoFile(null);
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => articleVideoFileInputRef.current?.click()}
                      className="flex w-full items-center justify-center rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
                    >
                      <FileUp className="mr-1 h-4 w-4" />
                      {articleVideoFile
                        ? `${articleVideoFile.name} (${(articleVideoFile.size / (1024 * 1024)).toFixed(1)} MB)`
                        : 'Enviar vídeo do artigo (máx. 200MB)'}
                    </button>
                    <input
                      ref={articleVideoFileInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleArticleVideoFileChange}
                    />

                    {(articleVideoLocalPreview || resolvedArticleVideoUrl) && (
                      <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                        {articleVideoLocalPreview ? (
                          <video
                            src={articleVideoLocalPreview}
                            controls
                            className="h-full w-full"
                            preload="metadata"
                          />
                        ) : articleVideoEmbedUrl ? (
                          <iframe
                            src={articleVideoEmbedUrl}
                            className="h-full w-full"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            src={resolvedArticleVideoUrl}
                            controls
                            className="h-full w-full"
                            preload="metadata"
                          />
                        )}
                      </div>
                    )}

                    <div>
                      <label className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Link2 className="h-3.5 w-3.5" />
                        Imagem por URL
                      </label>
                      <input
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                        placeholder="https://..."
                        {...form.register('articleImageUrl')}
                        onChange={(e) => {
                          form.setValue('articleImageUrl', e.target.value);
                          if (e.target.value) {
                            setArticleImageFile(null);
                            setArticleImagePreview(e.target.value);
                          }
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => articleImageFileInputRef.current?.click()}
                      className="flex w-full items-center justify-center rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
                    >
                      <ImagePlus className="mr-1 h-4 w-4" />
                      {articleImageFile
                        ? `${articleImageFile.name} (${(articleImageFile.size / (1024 * 1024)).toFixed(1)} MB)`
                        : 'Enviar imagem do artigo (máx. 10MB)'}
                    </button>
                    <input
                      ref={articleImageFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleArticleImageFileChange}
                    />

                    {articleImagePreview && (
                      <div className="overflow-hidden rounded-lg border bg-muted">
                        <img
                          src={articleImagePreview}
                          alt="Prévia do artigo"
                          className="max-h-48 w-full object-contain"
                        />
                      </div>
                    )}

                    <div>
                      <label className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Link2 className="h-3.5 w-3.5" />
                        PDF por URL
                      </label>
                      <input
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                        placeholder="https://.../arquivo.pdf"
                        {...form.register('articleAttachmentUrl')}
                        onChange={(e) => {
                          form.setValue('articleAttachmentUrl', e.target.value);
                          if (e.target.value) setArticleAttachmentFile(null);
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => articleAttachmentFileInputRef.current?.click()}
                      className="flex w-full items-center justify-center rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
                    >
                      <FileArchive className="mr-1 h-4 w-4" />
                      {articleAttachmentFile
                        ? `${articleAttachmentFile.name} (${(articleAttachmentFile.size / (1024 * 1024)).toFixed(1)} MB)`
                        : 'Enviar PDF do artigo (máx. 25MB)'}
                    </button>
                    <input
                      ref={articleAttachmentFileInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={handleArticleAttachmentFileChange}
                    />

                    {watchArticleAttachmentUrl && (
                      <a
                        href={toPublicStorageUrl(watchArticleAttachmentUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <FileArchive className="h-3.5 w-3.5" />
                        Visualizar PDF atual
                      </a>
                    )}
                  </div>
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
                  onChange={(e) => {
                    form.setValue('url', e.target.value);
                    if (e.target.value) {
                      setVideoFile(null);
                    }
                  }}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('admin.stepForm.videoHint')}
                </p>

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => videoFileInputRef.current?.click()}
                    className="flex w-full items-center justify-center rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
                  >
                    {videoFile
                      ? `${videoFile.name} (${(videoFile.size / (1024 * 1024)).toFixed(1)} MB)`
                      : 'Ou enviar arquivo de vídeo (máx. 200MB)'}
                  </button>
                  <input
                    ref={videoFileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoFileChange}
                  />
                </div>

                {(videoLocalPreview || resolvedVideoUrl) && (
                  <div className="mt-2 aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                    {videoLocalPreview ? (
                      <video
                        src={videoLocalPreview}
                        controls
                        className="h-full w-full"
                        preload="metadata"
                      />
                    ) : videoEmbedUrl ? (
                      <iframe
                        src={videoEmbedUrl}
                        className="h-full w-full"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={resolvedVideoUrl}
                        controls
                        className="h-full w-full"
                        preload="metadata"
                      />
                    )}
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
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t bg-card px-6 py-4">
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
                  ? watchType === 'CONTENT_VIDEO'
                    ? 'Enviando vídeo...'
                    : watchType === 'CONTENT_TEXT'
                      ? 'Enviando arquivos do artigo...'
                    : t('admin.stepForm.uploadingImage')
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
