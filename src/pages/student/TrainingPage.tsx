import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  LayoutList,
  GripVertical,
  Zap,
  FileText,
  BarChart2,
  ChevronRight
} from 'lucide-react';
import { tenantPath } from '@/lib/tenant';

// ─── Section icon map (ordered to match i18n sections) ───────────────────────

const SECTION_ICONS = [
  { key: 'createCourse', icon: BookOpen, color: 'text-primary', linkTo: '/admin/courses' },
  { key: 'createLessons', icon: LayoutList, color: 'text-blue-500', linkTo: '/admin/courses' },
  { key: 'reorder', icon: GripVertical, color: 'text-amber-500', linkTo: null },
  { key: 'createActivities', icon: Zap, color: 'text-amber-500', linkTo: null },
  { key: 'createContent', icon: FileText, color: 'text-blue-500', linkTo: null },
  { key: 'lab', icon: BarChart2, color: 'text-green-500', linkTo: '/app/lab' }
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrainingPage() {
  const { t } = useTranslation();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const slug = tenantSlug ?? '';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold">{t('app.training.pageTitle')}</h1>
        <p className="mt-2 text-muted-foreground">{t('app.training.pageSubtitle')}</p>
      </div>

      {/* Índice rápido */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('app.training.indexLabel')}
        </p>
        <div className="flex flex-wrap gap-2">
          {SECTION_ICONS.map(({ key, icon: Icon, color }) => (
            <a
              key={key}
              href={`#${key}`}
              className="flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-accent"
            >
              <Icon className={`h-3.5 w-3.5 ${color}`} />
              {t(`app.training.sections.${key}.title`)}
            </a>
          ))}
        </div>
      </div>

      {/* Seções */}
      {SECTION_ICONS.map(({ key, icon: Icon, color, linkTo }, idx) => {
        const steps = t(`app.training.sections.${key}.steps`, { returnObjects: true }) as string[];
        const hasLink = !!t(`app.training.sections.${key}.link`, { defaultValue: '' });
        const linkLabel = t(`app.training.sections.${key}.link`, { defaultValue: '' });

        return (
          <div
            key={key}
            id={key}
            className="rounded-2xl border bg-card p-6 shadow-sm scroll-mt-20"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground">
                  {t('app.training.stepPrefix', { n: idx + 1 })}
                </span>
                <h2 className="text-lg font-bold leading-tight">
                  {t(`app.training.sections.${key}.title`)}
                </h2>
              </div>
            </div>

            <p className="mb-4 text-sm text-muted-foreground">
              {t(`app.training.sections.${key}.description`)}
            </p>

            <ol className="space-y-2">
              {Array.isArray(steps) &&
                steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-foreground">{step}</span>
                  </li>
                ))}
            </ol>

            {hasLink && linkTo && (
              <Link
                to={tenantPath(slug, linkTo)}
                className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20"
              >
                {linkLabel}
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
