import DOMPurify from 'dompurify';
import { ExternalLink, Play } from 'lucide-react';
import type { LessonStepDTO } from '@/types/api';

export interface TextStepContentProps {
  content: Record<string, unknown>;
}

export function TextStepContent({ content }: TextStepContentProps) {
  const body = (content.body as string) ?? '';

  // ── Legacy Article Media (Backward Compatibility) ──
  // These fields are no longer available in the authoring UI.
  // We keep rendering them here to avoid breaking existing articles
  // that were created before the rich text editor (Tiptap) integration.
  // Authors should migrate to embed them directly into the text.
  const articleVideoUrl = resolveStorageUrl((content.videoUrl as string) ?? '');
  const articleImageUrl = resolveStorageUrl((content.imageUrl as string) ?? '');
  const articleAttachmentUrl = resolveStorageUrl(
    (content.attachmentUrl as string) ?? ''
  );
  const embedVideoUrl = articleVideoUrl
    ? getEmbedUrl(articleVideoUrl, 'direct')
    : null;

  return (
    <div className="space-y-8">
      <div
        className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-foreground prose-headings:leading-tight prose-h2:mt-10 prose-h2:text-2xl prose-h3:mt-8 prose-p:text-foreground/85 prose-p:leading-relaxed prose-strong:text-foreground prose-a:text-primary prose-a:underline-offset-2 prose-li:text-foreground/85 prose-img:rounded-xl prose-video:rounded-xl prose-blockquote:border-primary/30 prose-blockquote:text-foreground/70"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(body, {
            ADD_TAGS: ['iframe'],
            ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling']
          })
        }}
      />

      {articleVideoUrl && (
        <div className="aspect-video overflow-hidden rounded-xl bg-black">
          {embedVideoUrl ? (
            <iframe
              src={embedVideoUrl}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Video do artigo"
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

export interface VideoStepContentProps {
  content: Record<string, unknown>;
}

export function VideoStepContent({ content }: VideoStepContentProps) {
  const sourceUrl = resolveStorageUrl((content.url as string) ?? '');
  const provider = (content.provider as string) ?? 'direct';
  const embedUrl = getEmbedUrl(sourceUrl, provider);

  if (!sourceUrl) {
    return <p className="text-sm text-muted-foreground">Vídeo indisponível.</p>;
  }

  if (embedUrl) {
    return (
      <div className="aspect-video overflow-hidden rounded-xl bg-black">
        <iframe
          src={embedUrl}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Video da aula"
        />
      </div>
    );
  }

  return (
    <div className="aspect-video overflow-hidden rounded-xl bg-black">
      <video
        src={sourceUrl}
        controls
        className="h-full w-full"
        preload="metadata"
      />
    </div>
  );
}

export interface ImageStepContentProps {
  content: Record<string, unknown>;
}

export function ImageStepContent({ content }: ImageStepContentProps) {
  const sourceUrl = resolveStorageUrl((content.url as string) ?? '');
  const alt = (content.alt as string) ?? 'Imagem da aula';
  const caption = (content.caption as string | undefined) ?? undefined;

  if (!sourceUrl) {
    return (
      <p className="text-sm text-muted-foreground">Imagem indisponível.</p>
    );
  }

  return (
    <figure className="space-y-3">
      <div className="overflow-hidden rounded-xl bg-muted">
        <img
          src={sourceUrl}
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

export interface ActivityStepCardProps {
  step: LessonStepDTO;
  content: Record<string, unknown>;
  onStartActivity: (activityId: string) => void;
}

export function ActivityStepCard({
  step,
  content,
  onStartActivity
}: ActivityStepCardProps) {
  const rawActivityId = content.activityId;
  const activityId =
    typeof rawActivityId === 'string' ? rawActivityId.trim() : '';

  if (!activityId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Atividade indisponível para este step.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Play className="h-8 w-8 text-primary" />
      </div>

      <div>
        <h3 className="text-lg font-bold">{step.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Continue para a atividade deste step sem sair do learning shell.
        </p>
      </div>

      <button
        type="button"
        onClick={() => onStartActivity(activityId)}
        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
      >
        Iniciar atividade
        <Play className="h-4 w-4" />{' '}
      </button>
    </div>
  );
}

function getEmbedUrl(url: string, provider: string): string | null {
  if (!url) return null;

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
