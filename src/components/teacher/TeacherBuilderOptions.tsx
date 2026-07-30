import React from 'react';
import type { TeacherBuilderConfig } from '@/types/teacher-builder';
import {
  SKIN_TONES,
  HAIR_STYLES,
  HAIR_COLORS,
  EYE_TYPES,
  CLOTHES_OPTIONS,
  CLOTHES_COLORS,
  ACCESSORY_OPTIONS,
} from '@/types/teacher-builder';

interface TeacherBuilderOptionsProps {
  config: TeacherBuilderConfig;
  onChange: (config: TeacherBuilderConfig) => void;
}

export const TeacherBuilderOptions: React.FC<TeacherBuilderOptionsProps> = ({ config, onChange }) => {
  const update = (key: keyof TeacherBuilderConfig, value: string) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Tom de Pele</label>
        <div className="flex flex-wrap gap-2">
          {SKIN_TONES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => update('skinTone', option.value)}
              className={`h-8 w-8 rounded-full border-2 transition-all ${
                config.skinTone === option.value
                  ? 'border-primary scale-110 shadow-sm'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: option.value }}
              title={option.label}
              aria-label={option.label}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Corte de Cabelo</label>
        <div className="flex flex-wrap gap-2">
          {HAIR_STYLES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => update('hairStyle', option.value)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                config.hairStyle === option.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-accent'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Cor do Cabelo</label>
        <div className="flex flex-wrap gap-2">
          {HAIR_COLORS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => update('hairColor', option.value)}
              className={`h-8 w-8 rounded-full border-2 transition-all ${
                config.hairColor === option.value
                  ? 'border-primary scale-110 shadow-sm'
                  : 'border-slate-200 hover:scale-105'
              }`}
              style={{ backgroundColor: option.value }}
              title={option.label}
              aria-label={option.label}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Formato dos Olhos</label>
        <div className="flex flex-wrap gap-2">
          {EYE_TYPES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => update('eyeType', option.value)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                config.eyeType === option.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-accent'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Roupa</label>
        <div className="flex flex-wrap gap-2">
          {CLOTHES_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => update('clothes', option.value)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                config.clothes === option.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-accent'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Cor da Roupa</label>
        <div className="flex flex-wrap gap-2">
          {CLOTHES_COLORS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => update('clothesColor', option.value)}
              className={`h-8 w-8 rounded-full border-2 transition-all ${
                config.clothesColor === option.value
                  ? 'border-primary scale-110 shadow-sm'
                  : 'border-slate-200 hover:scale-105'
              }`}
              style={{ backgroundColor: option.value }}
              title={option.label}
              aria-label={option.label}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Acessórios</label>
        <div className="flex flex-wrap gap-2">
          {ACCESSORY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => update('accessories', option.value)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                config.accessories === option.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-accent'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
