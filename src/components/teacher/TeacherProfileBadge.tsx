import { UserRound } from 'lucide-react';

interface TeacherProfileView {
  id: string;
  name: string;
  primaryImageUrl?: string | null;
  referenceImages?: string[];
}

interface TeacherProfileBadgeProps {
  teacherProfile?: TeacherProfileView | null;
  label?: string;
  variant?: 'compact' | 'card';
  className?: string;
}

function resolveTeacherImageUrl(pathOrUrl?: string | null) {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith('http')) return pathOrUrl;

  if (pathOrUrl.startsWith('/')) {
    return import.meta.env.DEV
      ? `http://localhost:3333/storage${pathOrUrl}`
      : `${window.location.origin}/trivestia/storage${pathOrUrl}`;
  }

  return pathOrUrl;
}

export function TeacherProfileBadge({
  teacherProfile,
  label = 'Seu professor',
  variant = 'compact',
  className = ''
}: TeacherProfileBadgeProps) {
  if (!teacherProfile) return null;

  const primary = resolveTeacherImageUrl(teacherProfile.primaryImageUrl);
  const fallback = resolveTeacherImageUrl(teacherProfile.referenceImages?.[0] ?? null);
  const avatarUrl = primary ?? fallback;

  if (variant === 'card') {
    return (
      <div className={`flex items-center gap-3 rounded-xl border bg-card/70 px-3 py-2 ${className}`}>
        <div className="h-10 w-10 overflow-hidden rounded-full border bg-muted/70">
          {avatarUrl ? (
            <img src={avatarUrl} alt={teacherProfile.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <UserRound className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="truncate text-sm font-semibold text-foreground">{teacherProfile.name}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border bg-background/85 px-2.5 py-1 ${className}`}>
      <div className="h-6 w-6 overflow-hidden rounded-full border bg-muted/70">
        {avatarUrl ? (
          <img src={avatarUrl} alt={teacherProfile.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <UserRound className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
      <span className="max-w-[220px] truncate text-xs font-medium text-foreground/90">{teacherProfile.name}</span>
    </div>
  );
}
