import { useRef, useEffect, useState } from 'react';
import { CheckCircle2, XCircle, ImageOff } from 'lucide-react';
import type { ActivityType } from '@/types/api';

interface QuestionPreviewCardProps {
  activityType: ActivityType;
  question: {
    id: string;
    statement: string;
    options?: { isCorrect: boolean; text: string }[];
    metadata?: { jsonData?: Record<string, unknown> };
  };
}

// ─── CHART_MARKUP preview ─────────────────────────────

function ChartMarkupPreview({
  jsonData
}: {
  jsonData: Record<string, unknown>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);

  const cm = jsonData.chartMarkup as
    | {
        imageUrl?: string;
        threshold?: number;
        expected?: {
          x1: number;
          y1: number;
          x2: number;
          y2: number;
          type?: string;
        }[];
      }
    | undefined;

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: width, h: height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [imgLoaded]);

  if (!cm?.imageUrl) {
    return (
      <div className="flex h-32 items-center justify-center gap-2 rounded-lg border bg-muted/40 text-sm text-muted-foreground">
        <ImageOff className="h-4 w-4" />
        Sem imagem
      </div>
    );
  }

  const zones = cm.expected ?? [];

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-lg border select-none"
      >
        <img
          src={cm.imageUrl}
          alt="Gráfico gabarito"
          className="block w-full h-auto pointer-events-none"
          draggable={false}
          onLoad={() => setImgLoaded(true)}
        />
        {imgLoaded && zones.length > 0 && (
          <svg className="absolute inset-0 h-full w-full">
            {zones.map((z, i) => (
              <g key={i}>
                <rect
                  x={z.x1 * size.w}
                  y={z.y1 * size.h}
                  width={(z.x2 - z.x1) * size.w}
                  height={(z.y2 - z.y1) * size.h}
                  fill="rgba(34,197,94,0.15)"
                  stroke="rgb(34,197,94)"
                  strokeWidth="2"
                />
                {z.type && (
                  <text
                    x={z.x1 * size.w + 4}
                    y={z.y1 * size.h + 14}
                    fontSize="11"
                    fill="rgb(34,197,94)"
                    fontWeight="600"
                  >
                    {z.type}
                  </text>
                )}
              </g>
            ))}
          </svg>
        )}
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">Zonas:</span>{' '}
          {zones.length}
        </span>
        {cm.threshold !== undefined && (
          <span>
            <span className="font-medium text-foreground">Threshold IoU:</span>{' '}
            {(cm.threshold * 100).toFixed(0)}%
          </span>
        )}
        <span className="truncate max-w-[240px]">
          <span className="font-medium text-foreground">URL:</span>{' '}
          {cm.imageUrl}
        </span>
      </div>
    </div>
  );
}

// ─── RISK_CALCULATOR preview ──────────────────────────

function RiskCalculatorPreview({
  jsonData
}: {
  jsonData: Record<string, unknown>;
}) {
  const rc = jsonData.riskCalc as
    | {
        balance?: number;
        riskPercent?: number;
        entryPrice?: number;
        stopPrice?: number;
        contractValue?: number;
        tolerancePercent?: number;
        rounding?: number;
      }
    | undefined;

  if (!rc) return null;

  const riskValue = (rc.balance ?? 0) * ((rc.riskPercent ?? 0) / 100);
  const stopDist = Math.abs((rc.entryPrice ?? 0) - (rc.stopPrice ?? 0));
  const cv = rc.contractValue ?? 1;
  const factor = Math.pow(10, rc.rounding ?? 2);
  const expected =
    stopDist > 0
      ? Math.round((riskValue / (stopDist * cv)) * factor) / factor
      : null;

  const rows = [
    {
      label: 'Saldo',
      value: `$ ${rc.balance?.toLocaleString('pt-BR') ?? '—'}`
    },
    { label: 'Risco', value: `${rc.riskPercent}%` },
    { label: 'Entrada', value: `$ ${rc.entryPrice}` },
    { label: 'Stop', value: `$ ${rc.stopPrice}` },
    ...(cv !== 1 ? [{ label: 'Contrato', value: `$ ${cv}` }] : []),
    { label: 'Tolerância', value: `${rc.tolerancePercent}%` }
  ];

  return (
    <div className="rounded-lg border bg-muted/40 p-3 space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {rows.map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold">{value}</p>
          </div>
        ))}
      </div>
      {expected !== null && (
        <div className="rounded-md bg-primary/10 px-3 py-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Resposta esperada:
          </span>
          <span className="text-lg font-bold text-primary">{expected}</span>
          <span className="text-xs text-muted-foreground">contratos</span>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────

export function QuestionPreviewCard({
  activityType,
  question
}: QuestionPreviewCardProps) {
  const jsonData = question.metadata?.jsonData;

  return (
    <>
      {/* Standard options */}
      {(question.options?.length ?? 0) > 0 && (
        <ul className="space-y-1.5 mt-3">
          {question.options!.map((opt, j) => (
            <li key={j} className="flex items-center gap-2 text-sm">
              {opt.isCorrect ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              {opt.text}
            </li>
          ))}
        </ul>
      )}

      {/* Trade-type rich preview */}
      {activityType === 'CHART_MARKUP' && jsonData && (
        <div className="mt-3">
          <ChartMarkupPreview jsonData={jsonData} />
        </div>
      )}

      {activityType === 'RISK_CALCULATOR' && jsonData && (
        <div className="mt-3">
          <RiskCalculatorPreview jsonData={jsonData} />
        </div>
      )}
    </>
  );
}
