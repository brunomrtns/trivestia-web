import type { Candle, ExecutionConfig, SimulationState, SimEvent } from './types';
/**
 * Motor de execução determinístico.
 * Processa eventos (PLACE_ORDER, CANCEL_ORDER, MODIFY_ORDER) e avança candles.
 * Suporta MARKET, LIMIT, STOP, SL/TP, average-in, flip, force-close.
 */
export declare class SimulationEngine {
    private candles;
    private config;
    private state;
    private activeSlTps;
    constructor(candles: Candle[], config: ExecutionConfig);
    getState(): Readonly<SimulationState>;
    processEvent(event: SimEvent, candleIndex: number): void;
    private placeOrder;
    private cancelOrder;
    private modifyOrder;
    private fillOrder;
    private updatePosition;
    /**
     * Avança um candle: processa LIMIT/STOP, verifica SL/TP,
     * force-close no último candle, atualiza equity curve.
     */
    advanceCandle(candleIndex: number): void;
    private checkSlTp;
    private forceClose;
    private updateEquity;
}
//# sourceMappingURL=execution.d.ts.map