import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import i18n from '@/i18n/i18n';
import { settingsApi } from './settings.api';
import type { UpdateSettingsPayload, UserSettings } from './settings.types';

// ─── localStorage helpers ────────────────────────────────────────────────────

const LS_KEY = '@tm:user-settings';

function getDefaultLanguage(): string {
  const lang =
    navigator.language ?? (navigator.languages as string[])?.[0] ?? 'pt-BR';
  if (lang.startsWith('pt')) return 'pt-BR';
  if (lang.startsWith('en')) return 'en-US';
  return lang;
}

export function loadLocalSettings(): Partial<UserSettings> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalSettings(data: Partial<UserSettings>): void {
  try {
    const current = loadLocalSettings();
    localStorage.setItem(LS_KEY, JSON.stringify({ ...current, ...data }));
  } catch {
    /* ignora falhas de storage */
  }
}

/** Combina localStorage + padrões do browser */
export function buildDefaultSettings(): Pick<
  UserSettings,
  'language' | 'preferredMicrophoneId' | 'preferredSpeakerId'
> {
  const local = loadLocalSettings();
  return {
    language: local.language ?? getDefaultLanguage(),
    preferredMicrophoneId: local.preferredMicrophoneId ?? null,
    preferredSpeakerId: local.preferredSpeakerId ?? null
  };
}

// ─── Chave canônica ──────────────────────────────────────────────────────────

export const settingsQueryKey = (slug: string) =>
  ['user-settings', slug] as const;

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Busca as configurações do usuário.
 * - Prefill imediato com localStorage enquanto o servidor responde.
 * - Se o backend falhar, usa localStorage como fallback silencioso.
 */
export function useUserSettings() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const slug = tenantSlug ?? '';
  const defaults = buildDefaultSettings();

  const placeholder: UserSettings = {
    id: '',
    userId: '',
    language: defaults.language,
    preferredMicrophoneId: defaults.preferredMicrophoneId,
    preferredSpeakerId: defaults.preferredSpeakerId,
    createdAt: '',
    updatedAt: ''
  };

  return useQuery({
    queryKey: settingsQueryKey(slug),
    queryFn: async () => {
      try {
        const remote = await settingsApi.getMe(slug);
        saveLocalSettings(remote);
        // Aplica idioma salvo no servidor
        void i18n.changeLanguage(remote.language);
        return remote;
      } catch {
        return placeholder;
      }
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: placeholder
  });
}

/** Mutation para atualizar configurações com optimistic update + localStorage */
export function useUpdateUserSettings() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const slug = tenantSlug ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateSettingsPayload) => {
      // Persiste em localStorage primeiro (funciona mesmo offline)
      saveLocalSettings(data);
      try {
        return await settingsApi.updateMe(slug, data);
      } catch {
        const current = queryClient.getQueryData<UserSettings>(
          settingsQueryKey(slug)
        );
        return { ...current!, ...data } as UserSettings;
      }
    },

    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: settingsQueryKey(slug) });
      const previous = queryClient.getQueryData<UserSettings>(
        settingsQueryKey(slug)
      );
      if (previous) {
        queryClient.setQueryData<UserSettings>(settingsQueryKey(slug), {
          ...previous,
          ...newData
        });
      }
      return { previous };
    },

    onSuccess: (updated) => {
      queryClient.setQueryData<UserSettings>(settingsQueryKey(slug), updated);
      saveLocalSettings(updated);
      void i18n.changeLanguage(updated.language);
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData<UserSettings>(
          settingsQueryKey(slug),
          context.previous
        );
      }
    }
  });
}
