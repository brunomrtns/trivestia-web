import {
  type ISeriesPrimitive,
  type ISeriesApi,
  type IPrimitivePaneView,
  type IPrimitivePaneRenderer,
  type Logical,
  type SeriesAttachedParameter,
  type SeriesType,
  type Time,
} from 'lightweight-charts';
import type { CanvasRenderingTarget2D } from 'fancy-canvas';

export interface ChartPoint {
  logical: Logical;
  price: number;
}

export interface LineData {
  id: string;
  start: ChartPoint;
  end: ChartPoint;
  color: string;
  dashed?: boolean;
}

class DrawingPaneRenderer implements IPrimitivePaneRenderer {
  private _data: { x1: number; y1: number; x2: number; y2: number; color: string; dashed: boolean }[];

  constructor(data: { x1: number; y1: number; x2: number; y2: number; color: string; dashed: boolean }[]) {
    this._data = data;
  }

  draw(target: CanvasRenderingTarget2D): void {
    target.useMediaCoordinateSpace(({ context }) => {
      context.save();
      for (const line of this._data) {
        context.beginPath();
        context.strokeStyle = line.color;
        context.lineWidth = 2;
        context.lineCap = 'round';
        if (line.dashed) context.setLineDash([4, 4]);
        else context.setLineDash([]);
        context.moveTo(line.x1, line.y1);
        context.lineTo(line.x2, line.y2);
        context.stroke();
      }
      context.restore();
    });
  }
}

class DrawingPaneView implements IPrimitivePaneView {
  private _source: DrawingPrimitive;

  constructor(source: DrawingPrimitive) {
    this._source = source;
  }

  renderer(): IPrimitivePaneRenderer | null {
    const series = this._source.series;
    const chart = this._source.chart;
    if (!series || !chart) return null;

    const rendererData: { x1: number; y1: number; x2: number; y2: number; color: string; dashed: boolean }[] = [];
    const lines = [...this._source.lines];
    
    if (this._source.currentLine) {
      lines.push({
        ...this._source.currentLine,
        id: 'preview',
        color: '#4361EE',
        dashed: true,
      });
    }

    for (const line of lines) {
      const x1 = this._getScreenX(line.start.logical);
      const y1 = series.priceToCoordinate(line.start.price);
      const x2 = this._getScreenX(line.end.logical);
      const y2 = series.priceToCoordinate(line.end.price);

      if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
        rendererData.push({ x1, y1, x2, y2, color: line.color, dashed: !!line.dashed });
      }
    }
    return new DrawingPaneRenderer(rendererData);
  }

  private _getScreenX(logical: Logical): number | null {
    const chart = this._source.chart;
    if (!chart) return null;
    const timeScale = chart.timeScale();
    const l = logical as number;
    const x0 = timeScale.logicalToCoordinate(Math.floor(l) as Logical);
    const x1 = timeScale.logicalToCoordinate((Math.floor(l) + 1) as Logical);

    if (x0 !== null && x1 !== null) return x0 + (l - Math.floor(l)) * (x1 - x0);
    return x0;
  }
}

export class DrawingPrimitive implements ISeriesPrimitive {
  private _chart: SeriesAttachedParameter<Time, SeriesType>['chart'] | null = null;
  private _series: ISeriesApi<SeriesType, Time> | null = null;
  private _requestUpdate: (() => void) | null = null;
  public lines: LineData[] = [];
  public currentLine: { start: ChartPoint; end: ChartPoint } | null = null;

  private _paneViews: DrawingPaneView[];

  constructor() {
    this._paneViews = [new DrawingPaneView(this)];
  }

  get chart() { return this._chart; }
  get series() { return this._series; }

  attached({ chart, series, requestUpdate }: SeriesAttachedParameter<Time, SeriesType>): void {
    this._chart = chart;
    this._series = series;
    this._requestUpdate = requestUpdate;
  }

  detached(): void {
    this._chart = null;
    this._series = null;
    this._requestUpdate = null;
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return this._paneViews;
  }

  setData(lines: LineData[], currentLine: { start: ChartPoint; end: ChartPoint } | null) {
    this.lines = lines;
    this.currentLine = currentLine;
  }

  requestUpdate() {
    this._requestUpdate?.();
  }
}
