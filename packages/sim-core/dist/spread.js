"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSpread = calculateSpread;
/**
 * Calcula o spread em basis points para um candle.
 * FIXED: spread constante.
 * VOLATILITY_BASED: spread widen com volatilidade.
 */
function calculateSpread(config, rng, _candleIndex) {
    if (config.spreadType === 'FIXED') {
        return config.spreadBps;
    }
    // Volatility-based: alarga com a volatilidade
    const factor = 1 + rng() * config.volatility * 10;
    return Math.max(1, Math.round(config.spreadBps * factor));
}
//# sourceMappingURL=spread.js.map