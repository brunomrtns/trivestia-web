"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulationEngine = void 0;
/**
 * Motor de execução determinístico.
 * Processa eventos (PLACE_ORDER, CANCEL_ORDER, MODIFY_ORDER) e avança candles.
 * Suporta MARKET, LIMIT, STOP, SL/TP, average-in, flip, force-close.
 */
class SimulationEngine {
    constructor(candles, config) {
        this.candles = candles;
        this.config = config;
        this.activeSlTps = [];
        this.state = {
            candleIndex: 0,
            balance: config.initialBalance,
            equity: config.initialBalance,
            position: {
                side: 'FLAT',
                entryPrice: 0,
                quantity: 0,
                unrealizedPnl: 0,
                realizedPnl: 0,
            },
            openOrders: [],
            fills: [],
            equityCurve: [config.initialBalance],
            totalFees: 0,
            totalSlippage: 0,
            tradeCount: 0,
        };
    }
    getState() {
        return this.state;
    }
    processEvent(event, candleIndex) {
        const candle = this.candles[candleIndex];
        if (!candle)
            return;
        if (event.type === 'PLACE_ORDER') {
            this.placeOrder(event.order, candle, candleIndex);
        }
        else if (event.type === 'CANCEL_ORDER') {
            this.cancelOrder(event.orderId);
        }
        else if (event.type === 'MODIFY_ORDER') {
            this.modifyOrder(event.orderId, event.price, event.sl, event.tp);
        }
    }
    placeOrder(order, candle, candleIndex) {
        if (order.quantity <= 0)
            return;
        if (order.quantity > this.config.maxPositionSize)
            return;
        // Verificar se short é permitido
        if (!this.config.allowShort &&
            order.side === 'SELL' &&
            this.state.position.side !== 'LONG') {
            return;
        }
        if (order.type === 'MARKET') {
            const rawPrice = order.side === 'BUY' ? candle.askClose : candle.bidClose;
            const slippageAmt = (rawPrice * this.config.slippageBps) / 10000;
            const fillPrice = order.side === 'BUY'
                ? rawPrice + slippageAmt
                : rawPrice - slippageAmt;
            this.fillOrder(order, fillPrice, rawPrice, slippageAmt, candle, candleIndex, 'MARKET');
        }
        else {
            // LIMIT ou STOP — enfileira como pending
            if (this.state.openOrders.length >= this.config.maxOpenOrders)
                return;
            this.state.openOrders.push({ ...order, candleIndex });
        }
    }
    cancelOrder(orderId) {
        this.state.openOrders = this.state.openOrders.filter((o) => o.id !== orderId);
    }
    modifyOrder(orderId, price, sl, tp) {
        const order = this.state.openOrders.find((o) => o.id === orderId);
        if (!order)
            return;
        if (price !== undefined)
            order.price = price;
        if (sl !== undefined)
            order.sl = sl;
        if (tp !== undefined)
            order.tp = tp;
    }
    fillOrder(order, fillPrice, rawPrice, slippageAmt, candle, candleIndex, reason) {
        const feeValue = (fillPrice * order.quantity * this.config.feeBps) / 10000 +
            this.config.feeFixed;
        const totalFee = round2(feeValue);
        const totalSlippage = round2(Math.abs(slippageAmt) * order.quantity);
        const fill = {
            orderId: order.id,
            side: order.side,
            fillPrice: round2(fillPrice),
            rawPrice: round2(rawPrice),
            quantity: order.quantity,
            fee: totalFee,
            slippage: totalSlippage,
            candleIndex,
            reason,
        };
        this.state.fills.push(fill);
        this.state.totalFees = round2(this.state.totalFees + totalFee);
        this.state.totalSlippage = round2(this.state.totalSlippage + totalSlippage);
        this.state.tradeCount++;
        // Atualiza posição
        this.updatePosition(fill);
        // Debita fees do balance
        this.state.balance = round2(this.state.balance - totalFee);
        // Registra SL/TP se configurados
        if (order.sl !== undefined || order.tp !== undefined) {
            const posSide = order.side === 'BUY' ? 'LONG' : 'SHORT';
            this.activeSlTps = this.activeSlTps.filter((s) => s.orderId !== order.id);
            this.activeSlTps.push({
                orderId: order.id,
                positionSide: posSide,
                sl: order.sl,
                tp: order.tp,
                quantity: order.quantity,
            });
        }
    }
    updatePosition(fill) {
        const pos = this.state.position;
        if (pos.side === 'FLAT') {
            // Abrindo nova posição
            pos.side = fill.side === 'BUY' ? 'LONG' : 'SHORT';
            pos.entryPrice = fill.fillPrice;
            pos.quantity = fill.quantity;
            pos.realizedPnl = 0;
            pos.unrealizedPnl = 0;
        }
        else if ((pos.side === 'LONG' && fill.side === 'BUY') ||
            (pos.side === 'SHORT' && fill.side === 'SELL')) {
            // Average-in: mesma direção
            const totalQty = pos.quantity + fill.quantity;
            pos.entryPrice = round2((pos.entryPrice * pos.quantity + fill.fillPrice * fill.quantity) /
                totalQty);
            pos.quantity = totalQty;
        }
        else {
            // Fechando ou flippando posição
            if (fill.quantity < pos.quantity) {
                // Fechamento parcial
                const pnl = pos.side === 'LONG'
                    ? round2((fill.fillPrice - pos.entryPrice) * fill.quantity)
                    : round2((pos.entryPrice - fill.fillPrice) * fill.quantity);
                pos.realizedPnl = round2(pos.realizedPnl + pnl);
                pos.quantity = round2(pos.quantity - fill.quantity);
                this.state.balance = round2(this.state.balance + pnl);
            }
            else if (fill.quantity === pos.quantity) {
                // Fechamento total
                const pnl = pos.side === 'LONG'
                    ? round2((fill.fillPrice - pos.entryPrice) * fill.quantity)
                    : round2((pos.entryPrice - fill.fillPrice) * fill.quantity);
                pos.realizedPnl = round2(pos.realizedPnl + pnl);
                this.state.balance = round2(this.state.balance + pnl);
                pos.side = 'FLAT';
                pos.quantity = 0;
                pos.entryPrice = 0;
                pos.unrealizedPnl = 0;
                this.activeSlTps = [];
            }
            else {
                // Flip: fecha posição atual e abre reverso
                const oldQty = pos.quantity;
                const pnl = pos.side === 'LONG'
                    ? round2((fill.fillPrice - pos.entryPrice) * oldQty)
                    : round2((pos.entryPrice - fill.fillPrice) * oldQty);
                pos.realizedPnl = round2(pos.realizedPnl + pnl);
                this.state.balance = round2(this.state.balance + pnl);
                const remainingQty = round2(fill.quantity - oldQty);
                pos.side = fill.side === 'BUY' ? 'LONG' : 'SHORT';
                pos.entryPrice = fill.fillPrice;
                pos.quantity = remainingQty;
                pos.unrealizedPnl = 0;
                this.activeSlTps = [];
            }
        }
    }
    /**
     * Avança um candle: processa LIMIT/STOP, verifica SL/TP,
     * force-close no último candle, atualiza equity curve.
     */
    advanceCandle(candleIndex) {
        const candle = this.candles[candleIndex];
        if (!candle)
            return;
        // 1. Processar ordens LIMIT/STOP pendentes
        const toFill = [];
        const toRemove = [];
        for (const order of this.state.openOrders) {
            let triggered = false;
            let fillPrice = 0;
            let rawPrice = 0;
            let slippage = 0;
            let reason = 'MARKET';
            if (order.type === 'LIMIT') {
                if (order.side === 'BUY' && candle.askLow <= (order.price ?? 0)) {
                    rawPrice = Math.min(order.price ?? 0, candle.askLow);
                    fillPrice = rawPrice;
                    slippage = 0;
                    reason = 'LIMIT';
                    triggered = true;
                }
                else if (order.side === 'SELL' &&
                    candle.bidHigh >= (order.price ?? 0)) {
                    rawPrice = Math.max(order.price ?? 0, candle.bidHigh);
                    fillPrice = rawPrice;
                    slippage = 0;
                    reason = 'LIMIT';
                    triggered = true;
                }
            }
            else if (order.type === 'STOP') {
                if (order.side === 'BUY' && candle.askHigh >= (order.price ?? 0)) {
                    rawPrice = order.price ?? 0;
                    const slip = (rawPrice * this.config.slippageBps) / 10000;
                    fillPrice = rawPrice + slip;
                    slippage = slip;
                    reason = 'STOP';
                    triggered = true;
                }
                else if (order.side === 'SELL' &&
                    candle.bidLow <= (order.price ?? 0)) {
                    rawPrice = order.price ?? 0;
                    const slip = (rawPrice * this.config.slippageBps) / 10000;
                    fillPrice = rawPrice - slip;
                    slippage = slip;
                    reason = 'STOP';
                    triggered = true;
                }
            }
            if (triggered) {
                toFill.push({ order, fillPrice, rawPrice, slippage, reason });
                toRemove.push(order.id);
            }
        }
        for (const id of toRemove) {
            this.state.openOrders = this.state.openOrders.filter((o) => o.id !== id);
        }
        for (const f of toFill) {
            this.fillOrder(f.order, f.fillPrice, f.rawPrice, f.slippage, candle, candleIndex, f.reason);
        }
        // 2. Verificar SL/TP
        this.checkSlTp(candle, candleIndex);
        // 3. Force-close no último candle
        if (candleIndex === this.candles.length - 1 &&
            this.state.position.side !== 'FLAT') {
            this.forceClose(candle, candleIndex);
        }
        // 4. Atualizar unrealized PnL e equity
        this.updateEquity(candle);
        // 5. Registrar na equity curve
        this.state.equityCurve.push(round2(this.state.equity));
        this.state.candleIndex = candleIndex;
    }
    checkSlTp(candle, candleIndex) {
        const pos = this.state.position;
        if (pos.side === 'FLAT')
            return;
        const toRemove = [];
        for (const sltp of this.activeSlTps) {
            if (sltp.positionSide !== pos.side) {
                toRemove.push(sltp.orderId);
                continue;
            }
            let triggered = false;
            let fillPrice = 0;
            let rawPrice = 0;
            let slippage = 0;
            let reason = 'SL';
            if (pos.side === 'LONG') {
                // SL LONG: bidLow <= sl
                if (sltp.sl !== undefined && candle.bidLow <= sltp.sl) {
                    rawPrice = sltp.sl;
                    const slip = (rawPrice * this.config.slippageBps) / 10000;
                    fillPrice = rawPrice - slip;
                    slippage = slip;
                    reason = 'SL';
                    triggered = true;
                }
                // TP LONG: bidHigh >= tp (sem slippage)
                else if (sltp.tp !== undefined && candle.bidHigh >= sltp.tp) {
                    fillPrice = sltp.tp;
                    rawPrice = sltp.tp;
                    slippage = 0;
                    reason = 'TP';
                    triggered = true;
                }
            }
            else if (pos.side === 'SHORT') {
                // SL SHORT: askHigh >= sl
                if (sltp.sl !== undefined && candle.askHigh >= sltp.sl) {
                    rawPrice = sltp.sl;
                    const slip = (rawPrice * this.config.slippageBps) / 10000;
                    fillPrice = rawPrice + slip;
                    slippage = slip;
                    reason = 'SL';
                    triggered = true;
                }
                // TP SHORT: askLow <= tp (sem slippage)
                else if (sltp.tp !== undefined && candle.askLow <= sltp.tp) {
                    fillPrice = sltp.tp;
                    rawPrice = sltp.tp;
                    slippage = 0;
                    reason = 'TP';
                    triggered = true;
                }
            }
            if (triggered) {
                const closeQty = Math.min(sltp.quantity, pos.quantity);
                const closeOrder = {
                    id: `${sltp.orderId}-${reason}-${candleIndex}`,
                    side: pos.side === 'LONG' ? 'SELL' : 'BUY',
                    type: 'MARKET',
                    quantity: closeQty,
                    candleIndex,
                };
                this.fillOrder(closeOrder, fillPrice, rawPrice, slippage, candle, candleIndex, reason);
                toRemove.push(sltp.orderId);
            }
        }
        this.activeSlTps = this.activeSlTps.filter((s) => !toRemove.includes(s.orderId));
    }
    forceClose(candle, candleIndex) {
        const pos = this.state.position;
        if (pos.side === 'FLAT')
            return;
        const side = pos.side === 'LONG' ? 'SELL' : 'BUY';
        const rawPrice = side === 'SELL' ? candle.bidClose : candle.askClose;
        const slip = (rawPrice * this.config.slippageBps) / 10000;
        const fillPrice = side === 'SELL' ? rawPrice - slip : rawPrice + slip;
        const closeOrder = {
            id: `force-close-${candleIndex}`,
            side,
            type: 'MARKET',
            quantity: pos.quantity,
            candleIndex,
        };
        this.fillOrder(closeOrder, fillPrice, rawPrice, slip, candle, candleIndex, 'FORCED_CLOSE');
        this.activeSlTps = [];
        this.state.openOrders = [];
    }
    updateEquity(candle) {
        const pos = this.state.position;
        if (pos.side === 'FLAT') {
            pos.unrealizedPnl = 0;
        }
        else {
            const currentPrice = pos.side === 'LONG' ? candle.bidClose : candle.askClose;
            pos.unrealizedPnl =
                pos.side === 'LONG'
                    ? round2((currentPrice - pos.entryPrice) * pos.quantity)
                    : round2((pos.entryPrice - currentPrice) * pos.quantity);
        }
        this.state.equity = round2(this.state.balance + pos.unrealizedPnl);
    }
}
exports.SimulationEngine = SimulationEngine;
function round2(n) {
    return Math.round(n * 100) / 100;
}
//# sourceMappingURL=execution.js.map