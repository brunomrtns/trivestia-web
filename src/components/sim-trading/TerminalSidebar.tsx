import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  MousePointer2,
  History,
  LineChart,
  Pencil,
  Layers,
  LayoutGrid,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TerminalSidebarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
}

const tools = [
  { id: 'cursor', icon: MousePointer2, labelKey: 'sim.terminal.tools.cursor' },
  { id: 'replay', icon: History, labelKey: 'sim.terminal.tools.replay' },
  {
    id: 'indicators',
    icon: LineChart,
    labelKey: 'sim.terminal.tools.indicators'
  },
  { id: 'drawings', icon: Pencil, labelKey: 'sim.terminal.tools.drawings' },
  { id: 'layers', icon: Layers, labelKey: 'sim.terminal.tools.layers' },
  { id: 'search', icon: Search, labelKey: 'sim.terminal.tools.search' }
];

export function TerminalSidebar({
  activeTool,
  onToolChange
}: TerminalSidebarProps) {
  const { t } = useTranslation();

  return (
    <aside className="w-[60px] border-r border-border bg-card flex flex-col items-center py-4 gap-4 shrink-0 z-20 shadow-xl">
      <div className="mb-2 p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
        <LayoutGrid className="h-5 w-5" />
      </div>

      <div className="flex flex-col gap-2.5 w-full px-2">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            className={cn(
              'group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 border border-transparent cursor-pointer',
              activeTool === tool.id
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 border-primary/50 scale-105'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border hover:shadow-md'
            )}
            title={t(tool.labelKey)}
          >
            <tool.icon
              className={cn(
                'h-5 w-5 transition-transform duration-300 group-hover:scale-110',
                activeTool === tool.id ? 'scale-100' : ''
              )}
            />

            {/* Tooltip hint - modern style */}
            <div className="absolute left-[110%] ml-3 hidden group-hover:flex items-center z-[100] pointer-events-none">
              <div className="bg-popover text-popover-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md border border-border whitespace-nowrap shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-left-2">
                {t(tool.labelKey)}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-2 w-full px-2">
        {/* System icons can go here */}
      </div>
    </aside>
  );
}
