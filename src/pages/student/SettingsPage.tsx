import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Settings,
  Globe,
  Mic,
  Volume2,
  AlertCircle,
  RefreshCw,
  Save
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n/i18n';
import {
  useUserSettings,
  useUpdateUserSettings
} from '@/features/settings/settings.hooks';
import { useAudioDevices } from '@/hooks/useAudioDevices';

// ─── Idiomas suportados ───────────────────────────────────────────────────────
// Adicione aqui ao criar novos arquivos em src/i18n/locales/
const SUPPORTED_LANGUAGES = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en',   label: 'English (United States)' },
  { value: 'es',   label: 'Español (España)' }
] as const;

// ─── Schema Zod ──────────────────────────────────────────────────────────────

const settingsSchema = z.object({
  language: z.string().min(2),
  preferredMicrophoneId: z.string().nullable(),
  preferredSpeakerId: z.string().nullable()
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: i * 0.08, ease: [0.25, 0.1, 0.25, 1] }
  })
};

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border bg-card p-6 space-y-4">
      <div className="h-5 w-32 rounded bg-muted" />
      <div className="h-4 w-48 rounded bg-muted" />
      <div className="h-10 w-full rounded-lg bg-muted" />
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { t } = useTranslation();
  const { data: settings, isLoading } = useUserSettings();
  const updateSettings = useUpdateUserSettings();

  // ── Dispositivos de áudio (hook reutilizável) ────────────────────────────
  const { microphones, speakers, permission, reload } = useAudioDevices();

  // ── Form ────────────────────────────────────────────────────────────────────
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting }
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      language: 'pt-BR',
      preferredMicrophoneId: null,
      preferredSpeakerId: null
    }
  });

  // Sincroniza form quando dados carregam (reset define novos defaultValues)
  useEffect(() => {
    if (settings) {
      reset({
        language: settings.language,
        preferredMicrophoneId: settings.preferredMicrophoneId ?? null,
        preferredSpeakerId: settings.preferredSpeakerId ?? null
      });
    }
  }, [
    settings?.language,
    settings?.preferredMicrophoneId,
    settings?.preferredSpeakerId,
    reset
  ]);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const onSubmit = async (values: SettingsFormValues) => {
    try {
      await updateSettings.mutateAsync(values);
      // Aplica idioma imediatamente na interface
      await i18n.changeLanguage(values.language);
      toast.success(t('app.settings.toast.saved'));
      reset(values); // reseta isDirty
    } catch {
      toast.error(t('app.settings.toast.error'));
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Settings className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{t('app.settings.title')}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t('app.settings.subtitle')}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* ── Seção: Geral ───────────────────────────────────────────────── */}
          <motion.div
            custom={0}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="rounded-2xl border bg-card p-6 shadow-sm"
          >
            <div className="mb-5 flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">
                {t('app.settings.general.title')}
              </h2>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="language" className="text-sm font-medium">
                {t('app.settings.general.language')}
              </label>
              <p className="text-xs text-muted-foreground">
                {t('app.settings.general.languageHint')}
              </p>
              <Controller
                name="language"
                control={control}
                render={({ field }) => (
                  <select
                    id="language"
                    {...field}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
          </motion.div>

          {/* ── Seção: Áudio e Dispositivos ────────────────────────────────── */}
          <motion.div
            custom={1}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="rounded-2xl border bg-card p-6 shadow-sm"
          >
            <div className="mb-5 flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">{t('app.settings.audio.title')}</h2>
            </div>

            <p className="mb-4 text-sm text-muted-foreground">
              {t('app.settings.audio.description')}
            </p>

            {/* Banner de permissão */}
            {permission === 'unknown' && microphones.length === 0 && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-dashed bg-muted/40 p-4">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 space-y-2 text-sm text-muted-foreground">
                  <p>{t('app.settings.audio.permissionRequired')}</p>
                  <button
                    type="button"
                    onClick={reload}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                  >
                    <Mic className="h-3.5 w-3.5" />
                    {t('app.settings.audio.grantPermission')}
                  </button>
                </div>
              </div>
            )}

            {permission === 'denied' && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">
                    {t('app.settings.audio.permissionDenied')}
                  </p>
                  <p className="mt-0.5 text-xs opacity-80">
                    {t('app.settings.audio.permissionDeniedHint')}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Microfone */}
              <div className="space-y-1.5">
                <label
                  htmlFor="microphone"
                  className="flex items-center gap-1.5 text-sm font-medium"
                >
                  <Mic className="h-4 w-4 text-muted-foreground" />
                  {t('app.settings.audio.microphone')}
                </label>
                <Controller
                  name="preferredMicrophoneId"
                  control={control}
                  render={({ field }) => {
                    // Se o deviceId salvo não está mais disponível, faz fallback para padrão
                    const validValue =
                      field.value && microphones.some((m) => m.deviceId === field.value)
                        ? field.value
                        : '';
                    return (
                      <select
                        id="microphone"
                        value={validValue}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        onBlur={field.onBlur}
                        disabled={microphones.length === 0}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">
                          {t('app.settings.audio.defaultDevice')}
                        </option>
                        {microphones.map((d) => (
                          <option key={d.deviceId} value={d.deviceId}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    );
                  }}
                />
              </div>

              {/* Alto-falante */}
              <div className="space-y-1.5">
                <label
                  htmlFor="speaker"
                  className="flex items-center gap-1.5 text-sm font-medium"
                >
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  {t('app.settings.audio.speaker')}
                </label>
                <Controller
                  name="preferredSpeakerId"
                  control={control}
                  render={({ field }) => {
                    const validValue =
                      field.value && speakers.some((s) => s.deviceId === field.value)
                        ? field.value
                        : '';
                    return (
                      <select
                        id="speaker"
                        value={validValue}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        onBlur={field.onBlur}
                        disabled={speakers.length === 0}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">
                          {t('app.settings.audio.defaultDevice')}
                        </option>
                        {speakers.map((d) => (
                          <option key={d.deviceId} value={d.deviceId}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    );
                  }}
                />
                {speakers.length === 0 && permission === 'granted' && (
                  <p className="text-xs text-muted-foreground">
                    {t('app.settings.audio.speakerNotSupported')}
                  </p>
                )}
              </div>
            </div>

            {/* Botão re-enumerar */}
            {permission === 'granted' && (
              <button
                type="button"
                onClick={reload}
                className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {t('app.settings.audio.refreshDevices')}
              </button>
            )}
          </motion.div>

          {/* ── Rodapé com botão salvar ──────────────────────────────────────── */}
          <motion.div
            custom={2}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-end gap-3 rounded-2xl border bg-card px-6 py-4"
          >
            {isDirty && (
              <span className="text-xs text-muted-foreground">
                {t('app.settings.unsavedChanges')}
              </span>
            )}
            <button
              type="submit"
              disabled={!isDirty || isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  {t('common.actions.saving')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {t('common.actions.saveChanges')}
                </>
              )}
            </button>
          </motion.div>
        </form>
      )}
    </div>
  );
}
