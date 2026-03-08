import { useState, useCallback, useEffect } from 'react';
import type { AudioDevice } from '@/features/settings/settings.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AudioPermission = 'unknown' | 'granted' | 'denied';

export interface UseAudioDevicesReturn {
  microphones: AudioDevice[];
  speakers: AudioDevice[];
  permission: AudioPermission;
  /** Solicita permissão de microfone + re-enumera dispositivos */
  reload(): Promise<void>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const isMediaDevicesSupported =
  typeof navigator !== 'undefined' && !!navigator?.mediaDevices?.enumerateDevices;

/**
 * Executa `enumerateDevices` e devolve os arrays de mics/speakers.
 * Retorna `hasLabels = true` quando o browser já retornou nomes reais
 * (indica que permissão foi concedida anteriormente).
 */
async function readDevices(): Promise<{
  microphones: AudioDevice[];
  speakers: AudioDevice[];
  hasLabels: boolean;
}> {
  const raw = await navigator.mediaDevices.enumerateDevices();

  const microphones: AudioDevice[] = raw
    .filter((d) => d.kind === 'audioinput')
    .map((d, i) => ({
      deviceId: d.deviceId,
      label: d.label.trim() || `Microfone ${i + 1}`
    }));

  const speakers: AudioDevice[] = raw
    .filter((d) => d.kind === 'audiooutput')
    .map((d, i) => ({
      deviceId: d.deviceId,
      label: d.label.trim() || `Alto-falante ${i + 1}`
    }));

  const hasLabels = raw.some((d) => d.label.trim().length > 0);

  return { microphones, speakers, hasLabels };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Encapsula toda a lógica WebRTC de enumeração de dispositivos de áudio.
 *
 * Fluxo correto (mandatório pelos browsers modernos):
 *  1. Solicitar permissão via `getUserMedia({ audio: true })`
 *  2. Parar as tracks imediatamente (não mantém o microfone ativo)
 *  3. Chamar `enumerateDevices()` — agora os labels são retornados
 *
 * O hook também escuta `devicechange` para reagir a mudanças em tempo real
 * (ex.: usuário conecta/desconecta um headset USB).
 */
export function useAudioDevices(): UseAudioDevicesReturn {
  const [microphones, setMicrophones] = useState<AudioDevice[]>([]);
  const [speakers, setSpeakers] = useState<AudioDevice[]>([]);
  const [permission, setPermission] = useState<AudioPermission>('unknown');

  // ── Enumera e atualiza o estado ───────────────────────────────────────────
  const enumerate = useCallback(async (): Promise<boolean> => {
    if (!isMediaDevicesSupported) return false;
    try {
      const { microphones: mics, speakers: spks, hasLabels } = await readDevices();
      setMicrophones(mics);
      setSpeakers(spks);
      return hasLabels;
    } catch {
      return false;
    }
  }, []);

  // ── API pública: solicita permissão + enumera ─────────────────────────────
  const reload = useCallback(async (): Promise<void> => {
    if (!isMediaDevicesSupported) return;
    try {
      // 1. Pede permissão — obrigatório para obter labels reais
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // 2. Para as tracks imediatamente, não mantém mic ativo
      stream.getTracks().forEach((track) => track.stop());
      // 3. Agora os labels são acessíveis
      await enumerate();
      setPermission('granted');
    } catch {
      setPermission('denied');
    }
  }, [enumerate]);

  // ── Verificação silenciosa na montagem ───────────────────────────────────
  // Se os labels já estiverem disponíveis, o browser já havia concedido
  // permissão anteriormente (sessão anterior ou Permissions API).
  useEffect(() => {
    if (!isMediaDevicesSupported) return;
    void enumerate().then((hasLabels) => {
      if (hasLabels) setPermission('granted');
    });
  }, [enumerate]);

  // ── Escuta mudanças de dispositivo (USB plug/unplug, etc.) ────────────────
  useEffect(() => {
    if (!isMediaDevicesSupported) return;
    const handleDeviceChange = () => void enumerate();
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [enumerate]);

  return { microphones, speakers, permission, reload };
}
