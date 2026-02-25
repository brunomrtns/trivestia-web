"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaySimulation = replaySimulation;
const execution_1 = require("./execution");
const hash_1 = require("./hash");
/**
 * Executa replay completo: candles + events → SimulationResult.
 * FIX v3.0.1: eventCount é o length real do array de events, não state.tradeCount.
 * FIX v3.0.1: computeResult recebe SimulationState importado explicitamente.
 */
function replaySimulation(candles, events, config) {
    const engine = new execution_1.SimulationEngine(candles, config);
    for (let i = 0; i < candles.length; i++) {
        // Processar eventos deste candle
        for (const event of events) {
            const idx = event.type === 'PLACE_ORDER'
                ? event.order.candleIndex
                : event.candleIndex;
            if (idx === i) {
                engine.processEvent(event, i);
            }
        }
        // Avançar candle (processa LIMIT/STOP, SL/TP, force-close)
        engine.advanceCandle(i);
    }
    const state = engine.getState();
    return computeResult(state, config, events.length);
}
// ─── Helpers ──────────────────────────────────────────
function computeResult(state, config, eventCount // ← FIX: recebe como parâmetro
) {
    const totalPnl = round2(state.equity - config.initialBalance);
    const totalPnlPercent = round4((totalPnl / config.initialBalance) * 100);
    const roundTrips = computeRoundTrips(state.fills);
    const winTrips = roundTrips.filter((t) => t.pnl > 0);
    const lossTrips = roundTrips.filter((t) => t.pnl < 0);
    const winCount = winTrips.length;
    const lossCount = lossTrips.length;
    const winRate = roundTrips.length > 0
        ? round4(winCount / roundTrips.length)
        : 0;
    const avgWin = winCount > 0
        ? round2(winTrips.reduce((s, t) => s + t.pnl, 0) / winCount)
        : 0;
    const avgLoss = lossCount > 0
        ? round2(lossTrips.reduce((s, t) => s + t.pnl, 0) / lossCount)
        : 0;
    const largestWin = winCount > 0 ? round2(Math.max(...winTrips.map((t) => t.pnl))) : 0;
    const largestLoss = lossCount > 0 ? round2(Math.min(...lossTrips.map((t) => t.pnl))) : 0;
    const { maxDrawdown, maxDrawdownPercent } = computeDrawdown(state.equityCurve, config.initialBalance);
    const sharpeRatio = computeSharpe(state.equityCurve);
    const totalGain = winTrips.reduce((s, t) => s + t.pnl, 0);
    const totalLossAbs = Math.abs(lossTrips.reduce((s, t) => s + t.pnl, 0));
    const profitFactor = totalLossAbs > 0
        ? round2(totalGain / totalLossAbs)
        : totalGain > 0
            ? 999
            : 0;
    const calmarRatio = maxDrawdownPercent > 0
        ? round2(totalPnlPercent / maxDrawdownPercent)
        : totalPnl > 0
            ? 999
            : 0;
    const hashData = {
        finalBalance: round2(state.balance),
        finalEquity: round2(state.equity),
        totalPnl,
        fills: state.fills.map((f) => ({
            orderId: f.orderId,
            fillPrice: f.fillPrice,
            quantity: f.quantity,
            fee: f.fee,
        })),
    };
    return {
        finalBalance: round2(state.balance),
        finalEquity: round2(state.equity),
        totalPnl,
        totalPnlPercent,
        totalFees: round2(state.totalFees),
        totalSlippage: round2(state.totalSlippage),
        tradeCount: state.tradeCount,
        winCount,
        lossCount,
        winRate,
        avgWin,
        avgLoss,
        largestWin,
        largestLoss,
        maxDrawdown: round2(maxDrawdown),
        maxDrawdownPercent: round4(maxDrawdownPercent),
        sharpeRatio,
        profitFactor,
        calmarRatio,
        fills: state.fills,
        equityCurve: state.equityCurve,
        stateHash: (0, hash_1.computeStateHash)(hashData),
        eventCount,
        candleCount: Math.max(0, state.equityCurve.length - 1),
    };
}
function computeRoundTrips(fills) {
    const trips = [];
    let openSide = null;
    let openQty = 0;
    let openAvgCost = 0; // custo médio por unidade
    for (const fill of fills) {
        const isClosing = fill.reason === 'SL' ||
            fill.reason === 'TP' ||
            fill.reason === 'FORCED_CLOSE' ||
            (openSide !== null && fill.side !== openSide);
        if (!isClosing || openSide === null) {
            // Abrindo ou adicionando à posição
            if (openSide === null) {
                openSide = fill.side;
                openQty = fill.quantity;
                openAvgCost = fill.fillPrice;
            }
            else {
                const totalQty = openQty + fill.quantity;
                openAvgCost =
                    (openAvgCost * openQty + fill.fillPrice * fill.quantity) / totalQty;
                openQty = totalQty;
            }
        }
        else {
            // Fechando posição
            const closeQty = Math.min(fill.quantity, openQty);
            let pnl;
            if (openSide === 'BUY') {
                pnl = (fill.fillPrice - openAvgCost) * closeQty;
            }
            else {
                pnl = (openAvgCost - fill.fillPrice) * closeQty;
            }
            trips.push({ pnl: round2(pnl - fill.fee) });
            openQty = round2(openQty - closeQty);
            if (openQty <= 0) {
                openSide = null;
                openQty = 0;
                openAvgCost = 0;
            }
        }
    }
    return trips;
}
function computeDrawdown(equityCurve, initialBalance) {
    let peak = initialBalance;
    let maxDD = 0;
    let maxDDPct = 0;
    for (const equity of equityCurve) {
        if (equity > peak)
            peak = equity;
        const dd = peak - equity;
        const ddPct = peak > 0 ? (dd / peak) * 100 : 0;
        if (dd > maxDD)
            maxDD = dd;
        if (ddPct > maxDDPct)
            maxDDPct = ddPct;
    }
    return { maxDrawdown: maxDD, maxDrawdownPercent: maxDDPct };
}
function computeSharpe(equityCurve) {
    if (equityCurve.length < 2)
        return 0;
    const returns = [];
    for (let i = 1; i < equityCurve.length; i++) {
        const prev = equityCurve[i - 1];
        if (prev > 0)
            returns.push((equityCurve[i] - prev) / prev);
    }
    if (returns.length === 0)
        return 0;
    const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
    const variance = returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / returns.length;
    const stdev = Math.sqrt(variance);
    if (stdev === 0)
        return 0;
    return round2((mean / stdev) * Math.sqrt(Math.min(252, returns.length)));
}
function round2(n) {
    return Math.round(n * 100) / 100;
}
function round4(n) {
    return Math.round(n * 10000) / 10000;
}
//# sourceMappingURL=replay.js.map