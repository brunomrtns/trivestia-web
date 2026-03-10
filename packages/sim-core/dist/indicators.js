/**
 * @module indicators
 * Pure technical indicator functions.
 */

/**
 * Simple Moving Average.
 * @param {number[]} prices
 * @param {number} period
 * @returns {number[]}
 */
export function calculateMA(prices, period) {
  if (period < 1) throw new RangeError('period must be >= 1');
  return prices.map((_, i) => {
    if (i < period - 1) return NaN;
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += prices[j];
    return sum / period;
  });
}

/**
 * Exponential Moving Average.
 * Seeds with SMA of the first `period` values, then applies k = 2/(period+1).
 * @param {number[]} prices
 * @param {number} period
 * @returns {number[]}
 */
export function calculateEMA(prices, period) {
  if (period < 1) throw new RangeError('period must be >= 1');
  const k = 2 / (period + 1);
  const result = new Array(prices.length).fill(NaN);
  if (prices.length < period) return result;

  let sum = 0;
  for (let i = 0; i < period; i++) sum += prices[i];
  result[period - 1] = sum / period;

  for (let i = period; i < prices.length; i++) {
    result[i] = prices[i] * k + result[i - 1] * (1 - k);
  }
  return result;
}

/**
 * Relative Strength Index using Wilder's smoothing (RMA).
 * @param {number[]} prices
 * @param {number} [period=14]
 * @returns {number[]}
 */
export function calculateRSI(prices, period = 14) {
  if (period < 1) throw new RangeError('period must be >= 1');
  const result = new Array(prices.length).fill(NaN);
  if (prices.length <= period) return result;

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) avgGain += diff;
    else avgLoss -= diff;
  }
  avgGain /= period;
  avgLoss /= period;

  const rs0 = avgLoss === 0 ? Infinity : avgGain / avgLoss;
  result[period] = 100 - 100 / (1 + rs0);

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    result[i] = 100 - 100 / (1 + rs);
  }

  return result;
}
//# sourceMappingURL=indicators.js.map
