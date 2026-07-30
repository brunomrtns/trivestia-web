import React from 'react';
import type { TeacherBuilderConfig } from '@/types/teacher-builder';
import { TeacherBuilderCanvas } from './TeacherBuilderCanvas';
import { TeacherBuilderOptions } from './TeacherBuilderOptions';

interface TeacherBuilderPanelProps {
  config: TeacherBuilderConfig;
  onChange: (config: TeacherBuilderConfig) => void;
}

export const TeacherBuilderPanel: React.FC<TeacherBuilderPanelProps> = ({ config, onChange }) => {
  return (
    <div className="flex flex-col gap-8 md:flex-row">
      <div className="flex-shrink-0 flex justify-center md:justify-start">
        <div className="sticky top-6">
          <TeacherBuilderCanvas config={config} />
        </div>
      </div>
      <div className="flex-1 rounded-2xl border bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Personalizar Avatar</h3>
        <TeacherBuilderOptions config={config} onChange={onChange} />
      </div>
    </div>
  );
};
