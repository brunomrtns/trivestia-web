export { scoreSimulation as scoreSimulation };
function scoreSimulation(result, config) {
    const failReasons = [];
    // ─── Verificar condições de reprovação ────────────────
    if (result.totalPnlPercent < config.passingPnlPercent) {
        failReasons.push(`PnL ${result.totalPnlPercent.toFixed(2)}% < mínimo ${config.passingPnlPercent}%`);
    }
    if (result.maxDrawdownPercent > config.maxDrawdownPercent) {
        failReasons.push(`Drawdown ${result.maxDrawdownPercent.toFixed(2)}% > máximo ${config.maxDrawdownPercent}%`);
    }
    if (result.tradeCount < config.minTradeCount) {
        failReasons.push(`Trades ${result.tradeCount} < mínimo ${config.minTradeCount}`);
    }
    if (config.maxTradeCount && result.tradeCount > config.maxTradeCount) {
        failReasons.push(`Trades ${result.tradeCount} > máximo ${config.maxTradeCount}`);
    }
    const passed = failReasons.length === 0;
    // ─── Calcular scores por componente (0–100 cada) ──────
    const maxPnlTarget = config.passingPnlPercent * 2;
    const pnlScore = round2(Math.min(100, Math.max(0, (result.totalPnlPercent / maxPnlTarget) * 100)));
    const drawdownScore = round2(Math.max(0, (1 - result.maxDrawdownPercent / config.maxDrawdownPercent) * 100));
    // Sharpe: 100 @ sharpe >= 2, 0 @ sharpe <= 0
    const sharpeScore = round2(Math.min(100, Math.max(0, result.sharpeRatio * 50)));
    // Win rate: linear 0–100%
    const winRateScore = round2(result.winRate * 100);
    // ─── Score ponderado ──────────────────────────────────
    const w = config.weights;
    const totalWeight = w.pnl + w.drawdown + w.sharpe + w.winRate;
    const weightedScore = totalWeight > 0
        ? (pnlScore * w.pnl +
            drawdownScore * w.drawdown +
            sharpeScore * w.sharpe +
            winRateScore * w.winRate) /
            totalWeight
        : 0;
    // ─── Bônus ────────────────────────────────────────────
    let bonusScore = 0;
    if (config.bonusMetrics) {
        const { minSharpe, minWinRate, bonusScore: maxBonus = 10, } = config.bonusMetrics;
        if (minSharpe !== undefined && result.sharpeRatio >= minSharpe) {
            bonusScore += maxBonus / 2;
        }
        if (minWinRate !== undefined && result.winRate >= minWinRate) {
            bonusScore += maxBonus / 2;
        }
    }
    const score = round2(Math.min(100, weightedScore + bonusScore));
    return {
        score,
        passed,
        pnlScore,
        drawdownScore,
        sharpeScore,
        winRateScore,
        bonusScore: round2(bonusScore),
        breakdown: {
            pnl: result.totalPnl,
            pnlPercent: result.totalPnlPercent,
            drawdownPercent: result.maxDrawdownPercent,
            sharpeRatio: result.sharpeRatio,
            winRate: result.winRate,
            tradeCount: result.tradeCount,
        },
        failReasons,
    };
}
function round2(n) {
    return Math.round(n * 100) / 100;
}
//# sourceMappingURL=scoring.js.map