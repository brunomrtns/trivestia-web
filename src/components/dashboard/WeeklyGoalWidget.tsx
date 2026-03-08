import { useState } from 'react';
import { Settings, Flame, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { GoalConfigModal } from './GoalConfigModal';
import type { DashboardGoalsDTO } from '@/types/api';

// ─── Props ────────────────────────────────────────────────────────────────────

interface WeeklyGoalWidgetProps {
  data: DashboardGoalsDTO;
  slug: string;
}

// ─── Ring Progress (SVG) ──────────────────────────────────────────────────────

interface RingProps {
  value: number; // 0..1
  size?: number;
  strokeWidth?: number;
}

function Ring({ value, size = 88, strokeWidth = 8 }: RingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.min(1, Math.max(0, value));
  const offset = circumference * (1 - filled);

  return (
    <svg width={size} height={size} className="-rotate-90">
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        className="stroke-muted"
        strokeWidth={strokeWidth}
      />
      {/* Fill */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        className={cn(
          'transition-all duration-700',
          filled >= 1 ? 'stroke-green-500' : 'stroke-primary'
        )}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Day Abbreviations (ISO week Mon→Sun) ─────────────────────────────────────

const DAY_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

// ─── Component ────────────────────────────────────────────────────────────────

export function WeeklyGoalWidget({ data, slug }: WeeklyGoalWidgetProps) {
  const { t } = useTranslation();
  const {
    weeklyTarget,
    weeklyCompleted,
    currentStreak,
    longestStreak,
    weekDays
  } = data;
  const [modalOpen, setModalOpen] = useState(false);

  const ratio = weeklyTarget > 0 ? weeklyCompleted / weeklyTarget : 0;
  const goalReached = weeklyCompleted >= weeklyTarget;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t('app.dashboard.weeklyGoal.title')}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t('app.dashboard.weeklyGoal.progress', {
                weeklyCompleted,
                weeklyTarget
              })}
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label={t('app.dashboard.weeklyGoal.aria.configure')}
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-6">
          {/* Ring Progress */}
          <div className="relative shrink-0">
            <Ring value={ratio} size={88} strokeWidth={8} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className={cn(
                  'text-xl font-extrabold leading-none',
                  goalReached ? 'text-green-500' : 'text-foreground'
                )}
              >
                {Math.min(100, Math.round(ratio * 100))}%
              </span>
              {goalReached && (
                <span className="text-[10px] font-bold text-green-500 mt-0.5 uppercase tracking-wide">
                  {t('app.dashboard.weeklyGoal.achieved')}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            {/* Streak + Longest */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Flame
                  className={cn(
                    'h-5 w-5',
                    currentStreak > 0
                      ? 'text-orange-500'
                      : 'text-muted-foreground'
                  )}
                />
                <div>
                  <p className="text-xl font-extrabold leading-none">
                    {currentStreak}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('app.dashboard.weeklyGoal.streakDay', {
                      count: currentStreak
                    })}
                  </p>
                </div>
              </div>

              {longestStreak > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Trophy className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-bold leading-none">
                      {longestStreak}
                    </p>
                    <p className="text-xs">
                      {t('app.dashboard.weeklyGoal.record')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Mini Calendar */}
            <div className="flex gap-1">
              {weekDays.map((day, i) => {
                const isToday = day.date === today;
                return (
                  <div
                    key={day.date}
                    className="flex flex-col items-center gap-1"
                  >
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {DAY_LABELS[i]}
                    </span>
                    <div
                      title={t('app.dashboard.weeklyGoal.activityTooltip', {
                        date: day.date,
                        count: day.count
                      })}
                      className={cn(
                        'h-6 w-6 rounded-md transition-colors',
                        day.hit ? 'bg-primary' : 'bg-muted',
                        isToday && !day.hit && 'ring-2 ring-primary/50',
                        isToday && day.hit && 'ring-2 ring-primary'
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <GoalConfigModal
        open={modalOpen}
        currentTarget={weeklyTarget}
        slug={slug}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function WeeklyGoalWidgetSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm animate-pulse">
      <div className="flex items-center gap-6">
        <div className="h-[88px] w-[88px] rounded-full bg-muted shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="flex gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-6 w-6 rounded-md bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
