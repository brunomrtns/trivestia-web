import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  LayoutList,
  GripVertical,
  Zap,
  FileText,
  BarChart2,
  ChevronRight,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Brain
} from 'lucide-react';
import { tenantPath } from '@/lib/tenant';

// ─── Section config ───────────────────────────────────────────────────────────

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
      {SECTION_ICONS.map(({ key, icon: Icon, color, linkTo }, idx) => (
        <SectionCard
          key={key}
          sectionKey={key}
          icon={Icon}
          iconColor={color}
          index={idx + 1}
          linkTo={linkTo ? tenantPath(slug, linkTo) : null}
        />
      ))}
    </div>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────────────────

function SectionCard({
  sectionKey,
  icon: Icon,
  iconColor,
  index,
  linkTo
}: {
  sectionKey: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  index: number;
  linkTo: string | null;
}) {
  const { t } = useTranslation();
  const base = `app.training.sections.${sectionKey}`;

  const steps = t(`${base}.steps`, { returnObjects: true });
  const commonMistakes = t(`${base}.commonMistakes`, { returnObjects: true });
  const tips = t(`${base}.tips`, { returnObjects: true });

  const stepsArr = Array.isArray(steps) ? (steps as string[]) : [];
  const mistakesArr = Array.isArray(commonMistakes) ? (commonMistakes as string[]) : [];
  const tipsArr = Array.isArray(tips) ? (tips as string[]) : [];

  const context = t(`${base}.context`, { defaultValue: '' });
  const mentalFlow = t(`${base}.mentalFlow`, { defaultValue: '' });
  const expectedResult = t(`${base}.expectedResult`, { defaultValue: '' });
  const linkLabel = t(`${base}.link`, { defaultValue: '' });

  return (
    <div
      id={sectionKey}
      className="rounded-2xl border bg-card shadow-sm scroll-mt-20 overflow-hidden"
    >
      {/* Cabeçalho da seção */}
      <div className="flex items-center gap-3 border-b bg-muted/30 px-6 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm">
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <span className="text-xs font-semibold text-muted-foreground">
            {t('app.training.stepPrefix', { n: index })}
          </span>
          <h2 className="text-lg font-bold leading-tight">
            {t(`${base}.title`)}
          </h2>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {/* Contexto */}
        {context && (
          <p className="text-sm text-muted-foreground leading-relaxed">{context}</p>
        )}

        {/* Fluxo mental */}
        {mentalFlow && (
          <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-500/5 px-4 py-3">
            <Brain className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
            <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">{mentalFlow}</p>
          </div>
        )}

        {/* Passos */}
        {stepsArr.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Passo a passo
            </p>
            <ol className="space-y-2">
              {stepsArr.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Resultado esperado */}
        {expectedResult && (
          <div className="flex gap-3 rounded-xl border border-green-200 bg-green-500/5 px-4 py-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
            <p className="text-sm text-green-700 dark:text-green-400 leading-relaxed">{expectedResult}</p>
          </div>
        )}

        {/* Erros comuns + Dicas (lado a lado em telas grandes) */}
        {(mistakesArr.length > 0 || tipsArr.length > 0) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Erros comuns */}
            {mistakesArr.length > 0 && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Erros comuns
                </p>
                <ul className="space-y-1.5">
                  {mistakesArr.map((m, i) => (
                    <li key={i} className="text-xs text-muted-foreground leading-relaxed">
                      • {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Dicas */}
            {tipsArr.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-500/5 p-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <Lightbulb className="h-3.5 w-3.5" />
                  Dicas práticas
                </p>
                <ul className="space-y-1.5">
                  {tipsArr.map((tip, i) => (
                    <li key={i} className="text-xs text-muted-foreground leading-relaxed">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Link CTA */}
        {linkLabel && linkTo && (
          <Link
            to={linkTo}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20"
          >
            {linkLabel}
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
