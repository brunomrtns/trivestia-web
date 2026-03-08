import { useState, useRef, useEffect } from 'react';
import { Bell, ArrowRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { announcementsEndpoints } from '@/services/endpoints/announcements.endpoints';
import { tenantPath } from '@/lib/tenant';
import { cn } from '@/lib/utils';
import type { AnnouncementPriority } from '@/types/api';

// ─── Priority helpers ─────────────────────────────────────────────────────────

const priorityColors: Record<AnnouncementPriority, string> = {
  INFO: 'text-blue-500 bg-blue-500/10',
  WARNING: 'text-yellow-500 bg-yellow-500/10',
  CRITICAL: 'text-red-500 bg-red-500/10'
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AnnouncementBell() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const slug = tenantSlug ?? '';
  const { t } = useTranslation();

  const priorityLabel: Record<AnnouncementPriority, string> = {
    INFO: t('app.announcements.priority.info'),
    WARNING: t('common.priority.warning'),
    CRITICAL: t('common.priority.critical')
  };

  function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1) return t('app.announcements.time.now');
    if (m < 60) return t('app.announcements.time.minutes', { n: m });
    const h = Math.floor(m / 60);
    if (h < 24) return t('app.announcements.time.hours', { n: h });
    return t('app.announcements.time.days', { n: Math.floor(h / 24) });
  }

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Polling para unread-count — adaptativo conforme count
  const { data: unreadData, refetch: refetchCount } = useQuery({
    queryKey: ['announcements-unread', slug],
    queryFn: () => announcementsEndpoints.getUnreadCount(slug),
    // Atualizar a cada 60s se tem não-lidos, 120s se todos lidos
    refetchInterval: (query) =>
      (query.state.data?.count ?? 0) > 0 ? 60_000 : 120_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });

  const count = unreadData?.count ?? 0;

  // Marca todos como lidos ao abrir o dropdown
  const markAllMutation = useMutation({
    mutationFn: () => announcementsEndpoints.markAllRead(slug),
    onSuccess: () => {
      // Zera o cache do count imediatamente
      queryClient.setQueryData(['announcements-unread', slug], { count: 0 });
      // Invalida preview para refletir isRead=true
      queryClient.invalidateQueries({
        queryKey: ['announcements-preview', slug]
      });
    }
  });

  // Preview dos últimos 5 — só busca ao abrir
  const { data: previewData } = useQuery({
    queryKey: ['announcements-preview', slug],
    queryFn: () => announcementsEndpoints.list(slug, 1, 5),
    enabled: open,
    staleTime: 30_000
  });

  // Refetch imediato ao abrir dropdown
  const handleOpen = () => {
    setOpen((prev) => {
      if (!prev) {
        refetchCount();
        queryClient.invalidateQueries({
          queryKey: ['announcements-preview', slug]
        });
        // Marca todos como lidos se houver não-lidos
        if ((unreadData?.count ?? 0) > 0) {
          markAllMutation.mutate();
        }
      }
      return !prev;
    });
  };

  // Fechar ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label={t('app.announcements.title')}
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 rounded-2xl border bg-popover shadow-lg z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="font-semibold text-sm">
                {t('app.announcements.title')}
              </span>
              {count > 0 && (
                <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-500">
                  {t('app.announcements.unreadCount', { count })}
                </span>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y">
              {!previewData ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse h-10 rounded bg-muted"
                    />
                  ))}
                </div>
              ) : previewData.data.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  {t('app.announcements.bell.empty')}
                </p>
              ) : (
                previewData.data.map((ann) => (
                  <Link
                    key={ann.id}
                    to={tenantPath(slug, '/app/announcements')}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex gap-3 px-4 py-3 text-sm transition-colors hover:bg-accent',
                      !ann.isRead && 'bg-primary/5'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[10px] font-bold uppercase',
                            priorityColors[ann.priority]
                          )}
                        >
                          {priorityLabel[ann.priority]}
                        </span>
                        {!ann.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="font-medium truncate">{ann.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {relativeTime(ann.publishedAt)}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t px-4 py-2.5">
              <Link
                to={tenantPath(slug, '/app/announcements')}
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {t('app.announcements.bell.viewAll')}{' '}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
