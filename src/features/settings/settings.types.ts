export interface UserSettings {
  id: string;
  userId: string;
  language: string;
  preferredMicrophoneId: string | null;
  preferredSpeakerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsPayload {
  language?: string;
  preferredMicrophoneId?: string | null;
  preferredSpeakerId?: string | null;
}

/** Dispositivo de áudio enumerado via MediaDevices API */
export interface AudioDevice {
  deviceId: string;
  label: string;
}
