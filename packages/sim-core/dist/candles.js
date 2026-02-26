import * as prng_1 from "./prng.js";
import * as spread_1 from "./spread.js";
export { generateCandleSeries as generateCandleSeries };
/**
 * Gera série de candles OHLCV com bid/ask determinísticos.
 * Mesmo CandleConfig → mesma série em qualquer plataforma.
 */
function generateCandleSeries(config) {
    if (config.numCandles < 1 || config.numCandles > 500) {
        throw new Error(`numCandles deve estar entre 1 e 500, recebeu ${config.numCandles}`);
    }
    const rng = (0, prng_1.createPRNG)(config.seed);
    const candles = [];
    let price = config.startPrice;
    for (let i = 0; i < config.numCandles; i++) {
        const open = roundPrice(price);
        // Close = random walk com trend e volatilidade
        const trendBias = config.trend * config.volatility * 0.5;
        const noise = (0, prng_1.randGaussian)(rng, 0, 1) * config.volatility;
        const change = (trendBias + noise) * open;
        const close = roundPrice(Math.max(0.01, open + change));
        // High e Low com wicks adicionais
        const body = Math.abs(close - open);
        const wickExtra = Math.max(body * 0.1, (0, prng_1.randFloat)(rng, 0, body * 0.5 + config.volatility * open * 0.3));
        const high = roundPrice(Math.max(open, close) + wickExtra);
        const low = roundPrice(Math.max(0.01, Math.min(open, close) - wickExtra));
        // Volume
        const volVar = (0, prng_1.randFloat)(rng, -config.volumeVariance, config.volumeVariance);
        const volume = Math.round(config.volumeBase * (1 + volVar));
        // Spread (em basis points)
        const spreadBps = (0, spread_1.calculateSpread)(config, rng, i);
        const spreadHalf = (close * spreadBps) / 10000 / 2;
        const candle = {
            time: config.startTimestamp + i * config.timeframeMs,
            open,
            high,
            low,
            close,
            volume,
            spreadBps,
            // Close bid/ask
            askClose: roundPrice(close + spreadHalf),
            bidClose: roundPrice(close - spreadHalf),
            // High bid/ask
            askHigh: roundPrice(high + spreadHalf),
            bidHigh: roundPrice(high - spreadHalf),
            // Low bid/ask
            askLow: roundPrice(low + spreadHalf),
            bidLow: roundPrice(low - spreadHalf),
        };
        candles.push(candle);
        price = close;
    }
    return candles;
}
function roundPrice(p) {
    return Math.round(p * 100) / 100;
}
//# sourceMappingURL=candles.js.map