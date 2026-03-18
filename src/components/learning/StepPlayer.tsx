import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ExternalLink, Play } from 'lucide-react';
import type { LessonStepDTO } from '@/types/api';

interface StepPlayerProps {
  slug: string;
  step: LessonStepDTO;
  lessonId: string;
}

export function StepPlayer({ slug, step, lessonId }: StepPlayerProps) {
  const navigate = useNavigate();
  const content = step.content as Record<string, unknown>;

  return (
    <motion.div
      key={step.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border bg-card p-6 shadow-sm"
    >
      {step.type === 'CONTENT_TEXT' && (
        <TextContent content={content} />
      )}
      {step.type === 'CONTENT_VIDEO' && (
        <VideoContent
          url={content.url as string}
          provider={(content.provider as string) ?? 'direct'}
        />
      )}
      {step.type === 'CONTENT_IMAGE' && (
        <ImageContent
          url={content.url as string}
          alt={content.alt as string}
          caption={content.caption as string | undefined}
        />
      )}
      {step.type === 'ACTIVITY' && (
        <ActivityContent
          activityId={content.activityId as string}
          lessonId={lessonId}
          title={step.title}
          onOpen={() =>
            navigate(
              `/t/${slug}/app/lessons/${lessonId}/activities/${content.activityId}`
            )
          }
        />
      )}
    </motion.div>
  );
}

// ─── Sub-renderers ────────────────────────────────────────────────────────────

function TextContent({ content }: { content: Record<string, unknown> }) {
  const body = (content.body as string) ?? '';
  const articleVideoUrl = resolveStorageUrl((content.videoUrl as string) ?? '');
  const articleImageUrl = resolveStorageUrl((content.imageUrl as string) ?? '');
  const articleAttachmentUrl = resolveStorageUrl(
    (content.attachmentUrl as string) ?? ''
  );
  const embedVideoUrl = articleVideoUrl
    ? getEmbedUrl(articleVideoUrl, 'direct')
    : null;

  return (
    <div className="space-y-4">
      <div
        className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary"
        dangerouslySetInnerHTML={{ __html: body }}
      />

      {articleVideoUrl && (
        <div className="aspect-video overflow-hidden rounded-xl bg-black">
          {embedVideoUrl ? (
            <iframe
              src={embedVideoUrl}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Vídeo do artigo"
            />
          ) : (
            <video
              src={articleVideoUrl}
              controls
              className="h-full w-full"
              preload="metadata"
            />
          )}
        </div>
      )}

      {articleImageUrl && (
        <figure className="space-y-2">
          <div className="overflow-hidden rounded-xl bg-muted">
            <img
              src={articleImageUrl}
              alt="Imagem do artigo"
              className="mx-auto max-h-[500px] object-contain"
              loading="lazy"
            />
          </div>
        </figure>
      )}

      {articleAttachmentUrl && (
        <a
          href={articleAttachmentUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5"
        >
          <ExternalLink className="h-4 w-4" />
          Abrir material em PDF
        </a>
      )}
    </div>
  );
}

function VideoContent({ url, provider }: { url: string; provider: string }) {
  const { t } = useTranslation();
  const embedUrl = getEmbedUrl(url, provider);

  if (embedUrl) {
    return (
      <div className="aspect-video overflow-hidden rounded-xl bg-black">
        <iframe
          src={embedUrl}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={t('learning.stepPlayer.videoTitle')}
        />
      </div>
    );
  }

  // Direct video URL
  return (
    <div className="aspect-video overflow-hidden rounded-xl bg-black">
      <video src={url} controls className="h-full w-full" preload="metadata" />
    </div>
  );
}

function ImageContent({
  url,
  alt,
  caption
}: {
  url: string;
  alt: string;
  caption?: string;
}) {
  return (
    <figure className="space-y-3">
      <div className="overflow-hidden rounded-xl bg-muted">
        <img
          src={url}
          alt={alt}
          className="mx-auto max-h-[500px] object-contain"
          loading="lazy"
        />
      </div>
      {caption && (
        <figcaption className="text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function ActivityContent({
  activityId,
  lessonId,
  title,
  onOpen
}: {
  activityId: string;
  lessonId: string;
  title: string;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Play className="h-8 w-8 text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('learning.stepPlayer.activityDescription')}
        </p>
      </div>
      <button
        onClick={onOpen}
        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
      >
        {t('learning.stepPlayer.activityButton')}
        <ExternalLink className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEmbedUrl(url: string, provider: string): string | null {
  if (
    provider === 'youtube' ||
    url.includes('youtube.com') ||
    url.includes('youtu.be')
  ) {
    const id = extractYoutubeId(url);
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (provider === 'vimeo' || url.includes('vimeo.com')) {
    const id = url.match(/vimeo\.com\/(\d+)/)?.[1];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null;
}

function resolveStorageUrl(urlOrPath: string): string {
  if (!urlOrPath) return '';
  if (urlOrPath.startsWith('http')) return urlOrPath;

  if (urlOrPath.startsWith('/')) {
    return import.meta.env.DEV
      ? `http://localhost:3333/storage${urlOrPath}`
      : `${window.location.origin}/trivestia/storage${urlOrPath}`;
  }

  return urlOrPath;
}

function extractYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}
