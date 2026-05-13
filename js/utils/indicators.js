// ============================================
// MARKETPULSE PRO - TECHNICAL INDICATORS
// ============================================

class TechnicalIndicators {
  // Simple Moving Average
  static SMA(data, period = 20) {
    if (!data || data.length < period) return [];
    const result = new Array(data.length).fill(null);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
      if (i >= period) sum -= data[i - period];
      if (i >= period - 1) result[i] = sum / period;
    }
    return result;
  }

  // Exponential Moving Average
  static EMA(data, period = 20) {
    if (!data || data.length < period) return [];
    const result = new Array(data.length).fill(null);
    const multiplier = 2 / (period + 1);
    // First EMA is SMA
    let sum = 0;
    for (let i = 0; i < period; i++) sum += data[i];
    result[period - 1] = sum / period;
    for (let i = period; i < data.length; i++) {
      result[i] = (data[i] - result[i - 1]) * multiplier + result[i - 1];
    }
    return result;
  }

  // Relative Strength Index
  static RSI(data, period = 14) {
    if (!data || data.length < period + 1) return [];
    const result = new Array(data.length).fill(null);
    const gains = [];
    const losses = [];

    for (let i = 1; i < data.length; i++) {
      const diff = data[i] - data[i - 1];
      gains.push(diff > 0 ? diff : 0);
      losses.push(diff < 0 ? -diff : 0);
    }

    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) {
      result[period] = 100;
    } else {
      const rs = avgGain / avgLoss;
      result[period] = 100 - (100 / (1 + rs));
    }

    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
      if (avgLoss === 0) {
        result[i + 1] = 100;
      } else {
        const rs = avgGain / avgLoss;
        result[i + 1] = 100 - (100 / (1 + rs));
      }
    }

    return result;
  }

  // MACD
  static MACD(data, fast = 12, slow = 26, signal = 9) {
    if (!data || data.length < slow) {
      return { macdLine: [], signalLine: [], histogram: [] };
    }
    const fastEMA = TechnicalIndicators.EMA(data, fast);
    const slowEMA = TechnicalIndicators.EMA(data, slow);

    const macdLine = [];
    for (let i = 0; i < data.length; i++) {
      if (fastEMA[i] != null && slowEMA[i] != null) {
        macdLine[i] = fastEMA[i] - slowEMA[i];
      } else {
        macdLine[i] = null;
      }
    }

    const validMacd = macdLine.filter(v => v != null);
    const validStart = macdLine.findIndex(v => v != null);
    const signalRaw = TechnicalIndicators.EMA(validMacd, signal);
    const signalLine = new Array(data.length).fill(null);
    for (let i = 0; i < signalRaw.length; i++) {
      if (signalRaw[i] != null) {
        signalLine[validStart + i + signal - 1] = signalRaw[i];
      }
    }

    const histogram = [];
    for (let i = 0; i < data.length; i++) {
      if (macdLine[i] != null && signalLine[i] != null) {
        histogram[i] = macdLine[i] - signalLine[i];
      } else {
        histogram[i] = null;
      }
    }

    return { macdLine, signalLine, histogram };
  }

  // Bollinger Bands
  static BollingerBands(data, period = 20, stdDev = 2) {
    if (!data || data.length < period) {
      return { upper: [], middle: [], lower: [] };
    }
    const middle = TechnicalIndicators.SMA(data, period);
    const upper = new Array(data.length).fill(null);
    const lower = new Array(data.length).fill(null);

    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = middle[i];
      const variance = slice.reduce((sum, val) => sum + (val - mean) ** 2, 0) / period;
      const std = Math.sqrt(variance);
      upper[i] = mean + stdDev * std;
      lower[i] = mean - stdDev * std;
    }

    return { upper, middle, lower };
  }

  // Support & Resistance (simple local min/max)
  static supportResistance(highs, lows, lookback = 5) {
    const supports = [];
    const resistances = [];

    for (let i = lookback; i < lows.length - lookback; i++) {
      let isSupport = true;
      let isResistance = true;
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j === i) continue;
        if (lows[j] <= lows[i]) isSupport = false;
        if (highs[j] >= highs[i]) isResistance = false;
      }
      if (isSupport) supports.push({ index: i, value: lows[i] });
      if (isResistance) resistances.push({ index: i, value: highs[i] });
    }

    return { supports, resistances };
  }

  // Volume Weighted Average Price
  static VWAP(prices, volumes) {
    if (!prices || !volumes || prices.length !== volumes.length) return [];
    const result = new Array(prices.length).fill(null);
    let cumPV = 0;
    let cumV = 0;
    for (let i = 0; i < prices.length; i++) {
      cumPV += prices[i] * volumes[i];
      cumV += volumes[i];
      if (cumV > 0) result[i] = cumPV / cumV;
    }
    return result;
  }

  // ATR (Average True Range)
  static ATR(highs, lows, closes, period = 14) {
    if (!highs || !lows || !closes || highs.length < period + 1) return [];
    const trueRanges = [];
    for (let i = 1; i < highs.length; i++) {
      const highLow = highs[i] - lows[i];
      const highClose = Math.abs(highs[i] - closes[i - 1]);
      const lowClose = Math.abs(lows[i] - closes[i - 1]);
      trueRanges.push(Math.max(highLow, highClose, lowClose));
    }

    const result = new Array(highs.length).fill(null);
    let sum = trueRanges.slice(0, period).reduce((a, b) => a + b, 0);
    result[period] = sum / period;
    for (let i = period; i < trueRanges.length; i++) {
      result[i + 1] = (result[i] * (period - 1) + trueRanges[i]) / period;
    }
    return result;
  }
}