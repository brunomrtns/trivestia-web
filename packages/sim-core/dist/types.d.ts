/** Função PRNG que retorna float [0, 1) determinístico */
export type PRNGFn = () => number;
export interface CandleConfig {
    seed: number;
    numCandles: number;
    timeframeMs: number;
    startTimestamp: number;
    startPrice: number;
    volatility: number;
    trend: number;
    spreadType: 'FIXED' | 'VOLATILITY_BASED';
    spreadBps: number;
    volumeBase: number;
    volumeVariance: number;
}
export interface Candle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    spreadBps: number;
    askClose: number;
    bidClose: number;
    askHigh: number;
    bidHigh: number;
    askLow: number;
    bidLow: number;
}
export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP';
export type OrderStatus = 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';
export type PositionSide = 'LONG' | 'SHORT' | 'FLAT';
export interface OrderRequest {
    id: string;
    side: OrderSide;
    type: OrderType;
    quantity: number;
    price?: number;
    sl?: number;
    tp?: number;
    candleIndex: number;
}
export interface Fill {
    orderId: string;
    side: OrderSide;
    fillPrice: number;
    rawPrice: number;
    quantity: number;
    fee: number;
    slippage: number;
    candleIndex: number;
    reason: 'MARKET' | 'LIMIT' | 'STOP' | 'SL' | 'TP' | 'FORCED_CLOSE';
}
export interface Position {
    side: PositionSide;
    entryPrice: number;
    quantity: number;
    unrealizedPnl: number;
    realizedPnl: number;
}
export interface ExecutionConfig {
    initialBalance: number;
    feeBps: number;
    feeFixed: number;
    slippageBps: number;
    maxLeverage: number;
    maxPositionSize: number;
    maxOpenOrders: number;
    allowShort: boolean;
}
export type SimEvent = {
    type: 'PLACE_ORDER';
    order: OrderRequest;
} | {
    type: 'CANCEL_ORDER';
    orderId: string;
    candleIndex: number;
} | {
    type: 'MODIFY_ORDER';
    orderId: string;
    candleIndex: number;
    price?: number;
    sl?: number;
    tp?: number;
};
export interface SimulationState {
    candleIndex: number;
    balance: number;
    equity: number;
    position: Position;
    openOrders: OrderRequest[];
    fills: Fill[];
    equityCurve: number[];
    totalFees: number;
    totalSlippage: number;
    tradeCount: number;
}
export interface SimulationResult {
    finalBalance: number;
    finalEquity: number;
    totalPnl: number;
    totalPnlPercent: number;
    totalFees: number;
    totalSlippage: number;
    tradeCount: number;
    winCount: number;
    lossCount: number;
    winRate: number;
    avgWin: number;
    avgLoss: number;
    largestWin: number;
    largestLoss: number;
    maxDrawdown: number;
    maxDrawdownPercent: number;
    sharpeRatio: number;
    profitFactor: number;
    calmarRatio: number;
    fills: Fill[];
    equityCurve: number[];
    stateHash: string;
    eventCount: number;
    candleCount: number;
}
export interface ScoringConfig {
    passingPnlPercent: number;
    maxDrawdownPercent: number;
    minTradeCount: number;
    maxTradeCount?: number;
    weights: {
        pnl: number;
        drawdown: number;
        sharpe: number;
        winRate: number;
        bonus: number;
    };
    bonusMetrics?: {
        minSharpe?: number;
        minWinRate?: number;
        bonusScore?: number;
    };
}
export interface ScoreResult {
    score: number;
    passed: boolean;
    pnlScore: number;
    drawdownScore: number;
    sharpeScore: number;
    winRateScore: number;
    bonusScore: number;
    breakdown: {
        pnl: number;
        pnlPercent: number;
        drawdownPercent: number;
        sharpeRatio: number;
        winRate: number;
        tradeCount: number;
    };
    failReasons: string[];
}
export interface ScenarioConfig {
    candleConfig: CandleConfig;
    executionConfig: ExecutionConfig;
    scoringConfig?: ScoringConfig;
}
export interface ScenarioPayload {
    scenarioId: string;
    candles: Candle[];
    executionConfig: ExecutionConfig;
    scoringConfig?: ScoringConfig;
    scenarioToken: string;
    maxEvents: number;
}
//# sourceMappingURL=types.d.ts.map