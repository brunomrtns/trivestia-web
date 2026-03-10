/**
 * @module indicators
 * Pure technical indicator functions.
 * All inputs are price arrays (close prices by default).
 * All functions return NaN for leading periods with insufficient data.
 */

/**
 * Simple Moving Average.
 * @param prices Array of close prices.
 * @param period Lookback window (>= 1).
 * @returns Array same length as prices; leading values are NaN.
 */
export declare function calculateMA(prices: number[], period: number): number[];

/**
 * Exponential Moving Average (Wilder/EMA).
 * Seeds the first value with SMA of the first `period` prices,
 * then applies multiplier k = 2 / (period + 1).
 * @param prices Array of close prices.
 * @param period Lookback window (>= 1).
 * @returns Array same length as prices; leading values are NaN.
 */
export declare function calculateEMA(
  prices: number[],
  period: number
): number[];

/**
 * Relative Strength Index (RSI) using Wilder's smoothing (RMA).
 * @param prices Array of close prices.
 * @param period Lookback window, default 14.
 * @returns Array same length as prices; values in [0, 100]; leading values are NaN.
 */
export declare function calculateRSI(
  prices: number[],
  period?: number
): number[];
//# sourceMappingURL=indicators.d.ts.map
