import { motion } from 'framer-motion';
import { BookOpen, Trophy, ArrowRight, Layers } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { tenantPath } from '@/lib/tenant';
import type { DashboardContinueDTO } from '@/types/api';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function ContinueCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border bg-card p-6 h-[88px]" />
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ContinueCardProps {
  data: DashboardContinueDTO;
  slug: string;
  hasAnyCompleted: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ContinueCard({ data, slug, hasAnyCompleted }: ContinueCardProps) {
  const navigate = useNavigate();
  const { hasContinuation, course, module, lesson, next } = data;

  // ── Estado: com dados ──────────────────────────────────────────────────────
  if (hasContinuation && course && module && lesson && next) {
    const handleContinue = () => {
      if (next.kind === 'STEP' && next.stepId) {
        navigate(
          tenantPath(
            slug,
            `/app/courses/${course.id}/interactive?lesson=${lesson.id}&step=${next.stepId}`
          )
        );
      } else if (next.kind === 'ACTIVITY' && next.activityId) {
        navigate(
          tenantPath(slug, `/app/lessons/${lesson.id}/activities/${next.activityId}`)
        );
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border bg-gradient-to-br from-primary/5 to-card p-6 shadow-sm"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-0.5">
                Continue de onde parou
              </p>
              <p className="font-bold text-lg leading-snug truncate">
                {lesson.title}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {course.title} · {module.title}
              </p>
              {/* Barra de progresso */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${lesson.progress.percent}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {lesson.progress.percent}%
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleContinue}
            className="shrink-0 flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 active:scale-95 transition-all"
          >
            Continuar <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Estado: tudo completo ─────────────────────────────────────────────────
  if (hasAnyCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border bg-card p-6 flex items-center gap-4"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-500/10">
          <Trophy className="h-6 w-6 text-yellow-500" />
        </div>
        <div>
          <p className="font-semibold">Parabéns! Você completou tudo.</p>
          <p className="text-sm text-muted-foreground">
            Continue explorando os cursos disponíveis.
          </p>
        </div>
      </motion.div>
    );
  }

  // ── Estado: sem progresso ─────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border bg-card p-6 flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="font-semibold">Comece seu primeiro curso</p>
          <p className="text-sm text-muted-foreground">
            Explore os cursos disponíveis e dê o primeiro passo.
          </p>
        </div>
      </div>
      <Link
        to={tenantPath(slug, '/app/courses')}
        className="shrink-0 flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 active:scale-95 transition-all"
      >
        Ver cursos <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}
