// ============================================================
// CHARTS COMPONENT — Advanced Technical Analysis
// Multi-pane chart with SMA/EMA/Bollinger/VWAP overlays,
// RSI, MACD, and Volume sub-panes, synchronized crosshair,
// and optional candlestick rendering.
// ============================================================
class ChartsComponent {
  constructor(containerId, stateManager, apiService) {
    this.container = document.getElementById(containerId);
    this.stateManager = stateManager;
    this.apiService = apiService;

    this.currentSymbol = 'NIFTY 50';
    this.currentRange = '1mo';
    this.chartType = 'line'; // 'line' | 'area' | 'candle'
    this.lastData = null;

    // Chart instances (one per pane)
    this.charts = { price: null, volume: null, rsi: null, macd: null };

    this.ranges = {
      '1d': '1D', '5d': '5D', '1mo': '1M', '3mo': '3M',
      '6mo': '6M', '1y': '1Y', '5y': '5Y', 'max': 'Max',
    };

    // Indicator config — period + enabled state + color
    this.indicators = {
      sma20:  { enabled: true,  period: 20,  color: '#2563eb', label: 'SMA 20'  },
      sma50:  { enabled: true,  period: 50,  color: '#f59e0b', label: 'SMA 50'  },
      sma200: { enabled: false, period: 200, color: '#8b5cf6', label: 'SMA 200' },
      ema9:   { enabled: false, period: 9,   color: '#ec4899', label: 'EMA 9'   },
      ema21:  { enabled: false, period: 21,  color: '#06b6d4', label: 'EMA 21'  },
      bb:     { enabled: false, period: 20, stdDev: 2, color: '#6366f1', label: 'Bollinger' },
      vwap:   { enabled: false, color: '#f97316', label: 'VWAP' },
    };

    // Sub-panel visibility
    this.panes = { volume: true, rsi: true, macd: false };
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <style>${this._styles()}</style>
      <div class="chart-container card">
        <div class="chart-header">
          <h3 id="chart-title"><i class="fas fa-chart-line"></i> ${this.currentSymbol}</h3>
          <div class="symbol-input">
            <input type="text" id="chart-symbol-input" placeholder="Search RELIANCE, TCS, INFY...">
          </div>
        </div>

        <div class="chart-toolbar">
          <div class="time-range-buttons">${this._rangeButtons()}</div>
          <div class="chart-type-buttons">
            ${['line','area','candle'].map(t => `
              <button class="type-btn ${t === this.chartType ? 'active' : ''}" data-type="${t}">
                <i class="fas fa-${t === 'candle' ? 'chart-bar' : (t === 'area' ? 'chart-area' : 'chart-line')}"></i>
                ${t[0].toUpperCase() + t.slice(1)}
              </button>`).join('')}
            <button class="type-btn reset-zoom-btn" id="reset-zoom-btn" title="Reset zoom" style="display:none;">
              <i class="fas fa-search-minus"></i> Reset
            </button>
          </div>
        </div>

        <div class="indicator-bar">
          <span class="ind-label">Overlays:</span>
          ${this._overlayPills()}
          <span class="ind-sep">|</span>
          <span class="ind-label">Panes:</span>
          ${this._panePills()}
        </div>

        <div class="chart-wrapper" style="position:relative;">
          <div class="pane price-pane">
            <canvas id="price-chart-canvas"></canvas>
          </div>
          <div class="pane volume-pane" data-pane="volume" style="display:${this.panes.volume ? 'block' : 'none'}">
            <div class="pane-label">Volume</div>
            <canvas id="volume-chart-canvas"></canvas>
          </div>
          <div class="pane rsi-pane" data-pane="rsi" style="display:${this.panes.rsi ? 'block' : 'none'}">
            <div class="pane-label">RSI (14)</div>
            <canvas id="rsi-chart-canvas"></canvas>
          </div>
          <div class="pane macd-pane" data-pane="macd" style="display:${this.panes.macd ? 'block' : 'none'}">
            <div class="pane-label">MACD (12, 26, 9)</div>
            <canvas id="macd-chart-canvas"></canvas>
          </div>
          <div id="chart-loading" class="chart-loading" style="display:none">Loading data…</div>
          <div id="chart-readout" class="chart-readout"></div>
        </div>
      </div>
    `;
    this.attachEvents();
    this.loadChartData();
  }

  _rangeButtons() {
    return Object.entries(this.ranges).map(([key, label]) =>
      `<button class="range-btn ${key === this.currentRange ? 'active' : ''}" data-range="${key}">${label}</button>`
    ).join('');
  }

  _overlayPills() {
    return ['sma20','sma50','sma200','ema9','ema21','bb','vwap'].map(key => {
      const ind = this.indicators[key];
      return `<button class="ind-pill ${ind.enabled ? 'active' : ''}" data-ind="${key}"
                style="--pill-color:${ind.color}">${ind.label}</button>`;
    }).join('');
  }

  _panePills() {
    return ['volume','rsi','macd'].map(key =>
      `<button class="ind-pill pane-pill ${this.panes[key] ? 'active' : ''}" data-pane-toggle="${key}">
        ${key.toUpperCase()}
      </button>`
    ).join('');
  }

  attachEvents() {
    // Time range
    this.container.querySelectorAll('.range-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentRange = btn.dataset.range;
        this.container.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.loadChartData();
      });
    });

    // Chart type
    this.container.querySelectorAll('.type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.chartType = btn.dataset.type;
        this.container.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (this.lastData) this._renderAll(this.lastData);
      });
    });

    // Indicator toggles
    this.container.querySelectorAll('.ind-pill[data-ind]').forEach(pill => {
      pill.addEventListener('click', () => {
        const key = pill.dataset.ind;
        this.indicators[key].enabled = !this.indicators[key].enabled;
        pill.classList.toggle('active', this.indicators[key].enabled);
        if (this.lastData) this._renderAll(this.lastData);
      });
    });

    // Pane toggles
    this.container.querySelectorAll('.ind-pill[data-pane-toggle]').forEach(pill => {
      pill.addEventListener('click', () => {
        const key = pill.dataset.paneToggle;
        this.panes[key] = !this.panes[key];
        pill.classList.toggle('active', this.panes[key]);
        const paneEl = this.container.querySelector(`.pane[data-pane="${key}"]`);
        if (paneEl) paneEl.style.display = this.panes[key] ? 'block' : 'none';
        if (this.panes[key] && this.lastData) this._renderAll(this.lastData);
      });
    });

    // Symbol search
    const input = document.getElementById('chart-symbol-input');
    if (input && window.Autocomplete && window.app) {
      new Autocomplete(input, {
        getSource: () => window.app.getAutocompleteSource(),
        onSelect: (item) => {
          this.currentSymbol = item.symbol;
          document.getElementById('chart-title').innerHTML =
            `<i class="fas fa-chart-line"></i> ${item.symbol}`;
          input.value = '';
          this.loadChartData();
        }
      });
    }

    // Reset zoom (only useful if chartjs-plugin-zoom is loaded)
    const resetBtn = document.getElementById('reset-zoom-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (this.charts.price && typeof this.charts.price.resetZoom === 'function') {
          this.charts.price.resetZoom();
          resetBtn.style.display = 'none';
        }
      });
    }
  }

  // ----------------------------------------------------------
  // DATA LOAD
  // ----------------------------------------------------------
  async loadChartData() {
    const loadingDiv = document.getElementById('chart-loading');
    if (loadingDiv) loadingDiv.style.display = 'block';
    try {
      const data = await this.apiService.getHistoricalData(this.currentSymbol, { range: this.currentRange });
      if (!data || data.length === 0) {
        this.showError(`No data available for ${this.currentSymbol} (${this.currentRange}).`);
        this._destroyAll();
        return;
      }
      this.lastData = data;
      this._renderAll(data);
    } catch (error) {
      console.error('Failed to load chart data:', error);
      this.showError(`Unable to load ${this.currentSymbol}: ${error.message}`);
    } finally {
      if (loadingDiv) loadingDiv.style.display = 'none';
    }
  }

  _renderAll(data) {
    this._destroyAll();
    const resetBtn = document.getElementById('reset-zoom-btn');
    if (resetBtn) resetBtn.style.display = 'none';
    this.renderPriceChart(data);
    if (this.panes.volume) this.renderVolumeChart(data);
    if (this.panes.rsi)    this.renderRSIChart(data);
    if (this.panes.macd)   this.renderMACDChart(data);
    this._wireSync();
  }

  _destroyAll() {
    Object.keys(this.charts).forEach(k => {
      if (this.charts[k]) { try { this.charts[k].destroy(); } catch (_) {} this.charts[k] = null; }
    });
  }

  // ----------------------------------------------------------
  // INDICATOR MATH
  // ----------------------------------------------------------
  calculateSMA(values, period) {
    const out = new Array(values.length).fill(null);
    if (period <= 0 || values.length < period) return out;
    let sum = 0;
    for (let i = 0; i < period; i++) sum += values[i];
    out[period - 1] = sum / period;
    for (let i = period; i < values.length; i++) {
      sum += values[i] - values[i - period];
      out[i] = sum / period;
    }
    return out;
  }

  calculateEMA(values, period) {
    const out = new Array(values.length).fill(null);
    if (period <= 0 || values.length < period) return out;
    const k = 2 / (period + 1);
    // Seed with SMA of first `period` values
    let seed = 0;
    for (let i = 0; i < period; i++) seed += values[i];
    out[period - 1] = seed / period;
    for (let i = period; i < values.length; i++) {
      out[i] = values[i] * k + out[i - 1] * (1 - k);
    }
    return out;
  }

  calculateRSI(closes, period = 14) {
    const out = new Array(closes.length).fill(null);
    if (closes.length < period + 1) return out;

    // Wilder's smoothing
    let gain = 0, loss = 0;
    for (let i = 1; i <= period; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) gain += diff; else loss -= diff;
    }
    let avgGain = gain / period;
    let avgLoss = loss / period;
    out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

    for (let i = period + 1; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      const g = diff > 0 ? diff : 0;
      const l = diff < 0 ? -diff : 0;
      avgGain = (avgGain * (period - 1) + g) / period;
      avgLoss = (avgLoss * (period - 1) + l) / period;
      out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    }
    return out;
  }

  calculateMACD(closes, fast = 12, slow = 26, signal = 9) {
    const emaFast = this.calculateEMA(closes, fast);
    const emaSlow = this.calculateEMA(closes, slow);
    const macd = closes.map((_, i) =>
      emaFast[i] != null && emaSlow[i] != null ? emaFast[i] - emaSlow[i] : null
    );
    // EMA of the non-null portion of MACD
    const startIdx = macd.findIndex(v => v != null);
    const sliced = startIdx >= 0 ? macd.slice(startIdx) : [];
    const sig = this.calculateEMA(sliced.map(v => v ?? 0), signal);
    const signalLine = new Array(closes.length).fill(null);
    for (let i = 0; i < sig.length; i++) {
      if (sig[i] != null && startIdx + i < closes.length) signalLine[startIdx + i] = sig[i];
    }
    const hist = macd.map((v, i) =>
      v != null && signalLine[i] != null ? v - signalLine[i] : null
    );
    return { macd, signal: signalLine, histogram: hist };
  }

  calculateBollingerBands(closes, period = 20, mult = 2) {
    const middle = this.calculateSMA(closes, period);
    const upper = new Array(closes.length).fill(null);
    const lower = new Array(closes.length).fill(null);
    for (let i = period - 1; i < closes.length; i++) {
      let sumSq = 0;
      for (let j = i - period + 1; j <= i; j++) {
        const diff = closes[j] - middle[i];
        sumSq += diff * diff;
      }
      const stdDev = Math.sqrt(sumSq / period);
      upper[i] = middle[i] + mult * stdDev;
      lower[i] = middle[i] - mult * stdDev;
    }
    return { upper, middle, lower };
  }

  calculateVWAP(data) {
    // Needs high, low, close, volume — degrades to nulls if missing
    const out = new Array(data.length).fill(null);
    let cumPV = 0, cumV = 0;
    for (let i = 0; i < data.length; i++) {
      const h = data[i].high, l = data[i].low, c = data[i].close, v = data[i].volume;
      if (h == null || l == null || c == null || v == null) continue;
      const typical = (h + l + c) / 3;
      cumPV += typical * v;
      cumV += v;
      out[i] = cumV > 0 ? cumPV / cumV : null;
    }
    return out;
  }

  // ----------------------------------------------------------
  // RENDERING — PRICE PANE
  // ----------------------------------------------------------
  renderPriceChart(data) {
    const canvas = document.getElementById('price-chart-canvas');
    if (!canvas || typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');

    const labels = this._labels(data);
    const closes = data.map(d => d.close);
    const up = closes[closes.length - 1] >= closes[0];
    const lineColor = up ? 'rgb(22, 163, 74)' : 'rgb(220, 38, 38)';
    const fillColor = up ? 'rgba(22, 163, 74, 0.10)' : 'rgba(220, 38, 38, 0.10)';

    const datasets = [];

    // Main price series
    const candleAvail = !!(Chart.controllers && Chart.controllers.candlestick) &&
                        data[0] && data[0].open != null && data[0].high != null && data[0].low != null;

    if (this.chartType === 'candle' && candleAvail) {
      // Use index as x to stay aligned with the category labels used by other panes.
      datasets.push({
        label: this.currentSymbol,
        type: 'candlestick',
        data: data.map((d, i) => ({ x: i, o: d.open, h: d.high, l: d.low, c: d.close })),
        color: { up: 'rgb(22, 163, 74)', down: 'rgb(220, 38, 38)', unchanged: '#999' },
        borderColor: { up: 'rgb(22, 163, 74)', down: 'rgb(220, 38, 38)', unchanged: '#999' },
      });
    } else {
      datasets.push({
        label: this.currentSymbol,
        data: closes,
        borderColor: lineColor,
        backgroundColor: fillColor,
        fill: this.chartType === 'area',
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        order: 10,
      });
    }

    // Overlays: SMA / EMA
    const overlayDefs = [
      ['sma20', () => this.calculateSMA(closes, this.indicators.sma20.period)],
      ['sma50', () => this.calculateSMA(closes, this.indicators.sma50.period)],
      ['sma200', () => this.calculateSMA(closes, this.indicators.sma200.period)],
      ['ema9', () => this.calculateEMA(closes, this.indicators.ema9.period)],
      ['ema21', () => this.calculateEMA(closes, this.indicators.ema21.period)],
    ];
    overlayDefs.forEach(([key, calc]) => {
      const ind = this.indicators[key];
      if (!ind.enabled) return;
      datasets.push({
        label: ind.label,
        data: calc(),
        borderColor: ind.color,
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.2,
        pointRadius: 0,
        borderWidth: 1.5,
        spanGaps: false,
      });
    });

    // Bollinger Bands
    if (this.indicators.bb.enabled) {
      const bb = this.calculateBollingerBands(closes, this.indicators.bb.period, this.indicators.bb.stdDev);
      const c = this.indicators.bb.color;
      datasets.push({
        label: 'BB Upper', data: bb.upper, borderColor: c, backgroundColor: 'transparent',
        fill: false, pointRadius: 0, borderWidth: 1, borderDash: [4, 4],
      });
      datasets.push({
        label: 'BB Middle', data: bb.middle, borderColor: c, backgroundColor: 'transparent',
        fill: false, pointRadius: 0, borderWidth: 1,
      });
      datasets.push({
        label: 'BB Lower', data: bb.lower, borderColor: c, backgroundColor: c + '14',
        fill: '-2', pointRadius: 0, borderWidth: 1, borderDash: [4, 4],
      });
    }

    // VWAP
    if (this.indicators.vwap.enabled) {
      const vwap = this.calculateVWAP(data);
      if (vwap.some(v => v != null)) {
        datasets.push({
          label: 'VWAP', data: vwap, borderColor: this.indicators.vwap.color,
          backgroundColor: 'transparent', fill: false, pointRadius: 0, borderWidth: 1.5,
        });
      }
    }

    this.charts.price = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: true, position: 'top', align: 'end',
            labels: { boxWidth: 12, boxHeight: 2, font: { size: 11 }, filter: (it) => !it.text.startsWith('BB ') || it.text === 'BB Middle' } },
          tooltip: {
            callbacks: {
              label: (c) => {
                const v = c.parsed?.y;
                if (v == null) return '';
                return `${c.dataset.label}: ₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              }
            }
          },
          // Config for chartjs-plugin-zoom (no-op if plugin isn't loaded)
          zoom: {
            limits: { x: { minRange: 5 } },
            pan: { enabled: true, mode: 'x', modifierKey: null },
            zoom: {
              wheel: { enabled: true, speed: 0.08 },
              pinch: { enabled: true },
              drag: { enabled: false },
              mode: 'x',
              onZoom: ({ chart }) => this._onZoomChange(chart),
              onPan:  ({ chart }) => this._onZoomChange(chart),
            },
          },
        },
        scales: {
          x: { ticks: { maxTicksLimit: 8, autoSkip: true, font: { size: 10 } }, grid: { display: false } },
          y: { ticks: { callback: (v) => '₹' + Number(v).toLocaleString('en-IN'), font: { size: 10 } } }
        }
      }
    });
  }

  // ----------------------------------------------------------
  // RENDERING — VOLUME PANE
  // ----------------------------------------------------------
  renderVolumeChart(data) {
    const canvas = document.getElementById('volume-chart-canvas');
    if (!canvas || typeof Chart === 'undefined') return;
    const hasVolume = data.some(d => d.volume != null);
    if (!hasVolume) return;

    const ctx = canvas.getContext('2d');
    const labels = this._labels(data);
    const volumes = data.map(d => d.volume ?? 0);
    const colors = data.map((d, i) => {
      const prev = i > 0 ? data[i - 1].close : d.close;
      return d.close >= prev ? 'rgba(22, 163, 74, 0.55)' : 'rgba(220, 38, 38, 0.55)';
    });

    this.charts.volume = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Volume', data: volumes, backgroundColor: colors, borderWidth: 0 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => 'Vol: ' + this._fmtVolume(c.parsed.y) } },
        },
        scales: {
          x: { display: false },
          y: { ticks: { callback: (v) => this._fmtVolume(v), font: { size: 9 }, maxTicksLimit: 3 } }
        }
      }
    });
  }

  // ----------------------------------------------------------
  // RENDERING — RSI PANE
  // ----------------------------------------------------------
  renderRSIChart(data) {
    const canvas = document.getElementById('rsi-chart-canvas');
    if (!canvas || typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');
    const labels = this._labels(data);
    const closes = data.map(d => d.close);
    const rsi = this.calculateRSI(closes, 14);

    this.charts.rsi = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'RSI(14)', data: rsi, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.10)',
            fill: true, tension: 0.2, pointRadius: 0, borderWidth: 1.5 },
          { label: '70', data: labels.map(() => 70), borderColor: 'rgba(220,38,38,0.5)',
            backgroundColor: 'transparent', fill: false, pointRadius: 0, borderWidth: 1, borderDash: [3, 3] },
          { label: '30', data: labels.map(() => 30), borderColor: 'rgba(22,163,74,0.5)',
            backgroundColor: 'transparent', fill: false, pointRadius: 0, borderWidth: 1, borderDash: [3, 3] },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (c) => c.dataset.label === 'RSI(14)' && c.parsed.y != null
              ? `RSI: ${c.parsed.y.toFixed(2)}` : '' }
          }
        },
        scales: {
          x: { display: false },
          y: { min: 0, max: 100, ticks: { stepSize: 50, font: { size: 9 } } }
        }
      }
    });
  }

  // ----------------------------------------------------------
  // RENDERING — MACD PANE
  // ----------------------------------------------------------
  renderMACDChart(data) {
    const canvas = document.getElementById('macd-chart-canvas');
    if (!canvas || typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');
    const labels = this._labels(data);
    const closes = data.map(d => d.close);
    const { macd, signal, histogram } = this.calculateMACD(closes, 12, 26, 9);
    const histColors = histogram.map(v => v == null ? 'transparent' : v >= 0 ? 'rgba(22,163,74,0.6)' : 'rgba(220,38,38,0.6)');

    this.charts.macd = new Chart(ctx, {
      data: {
        labels,
        datasets: [
          { type: 'bar', label: 'Histogram', data: histogram, backgroundColor: histColors, borderWidth: 0, order: 3 },
          { type: 'line', label: 'MACD', data: macd, borderColor: '#2563eb',
            backgroundColor: 'transparent', fill: false, pointRadius: 0, borderWidth: 1.5, order: 1 },
          { type: 'line', label: 'Signal', data: signal, borderColor: '#f59e0b',
            backgroundColor: 'transparent', fill: false, pointRadius: 0, borderWidth: 1.5, order: 2 },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: true, position: 'top', align: 'end', labels: { boxWidth: 10, font: { size: 10 } } },
          tooltip: {
            callbacks: { label: (c) => c.parsed.y == null ? '' : `${c.dataset.label}: ${c.parsed.y.toFixed(3)}` }
          }
        },
        scales: {
          x: { display: false },
          y: { ticks: { font: { size: 9 }, maxTicksLimit: 3 } }
        }
      }
    });
  }

  // ----------------------------------------------------------
  // CROSSHAIR SYNC — hovering any pane highlights the same index on all
  // ----------------------------------------------------------
  _wireSync() {
    const charts = Object.values(this.charts).filter(Boolean);
    if (charts.length < 2) return;

    const readout = document.getElementById('chart-readout');

    charts.forEach(source => {
      source.canvas.addEventListener('mousemove', (evt) => {
        const points = source.getElementsAtEventForMode(evt, 'index', { intersect: false }, true);
        if (!points.length) return;
        const idx = points[0].index;

        charts.forEach(target => {
          if (target === source) return;
          const meta = target.getDatasetMeta(0);
          if (!meta || !meta.data || !meta.data[idx]) return;
          target.tooltip.setActiveElements(
            target.data.datasets.map((_, dsIdx) => ({ datasetIndex: dsIdx, index: idx }))
              .filter(e => target.getDatasetMeta(e.datasetIndex)?.data?.[idx]),
            { x: meta.data[idx].x, y: meta.data[idx].y }
          );
          target.update('none');
        });

        // Readout (top-right info strip)
        if (readout && this.lastData && this.lastData[idx]) {
          const d = this.lastData[idx];
          readout.innerHTML = this._readoutHtml(d, idx);
        }
      });

      source.canvas.addEventListener('mouseleave', () => {
        charts.forEach(target => {
          target.tooltip.setActiveElements([], { x: 0, y: 0 });
          target.update('none');
        });
        if (readout) readout.innerHTML = '';
      });
    });
  }

  _readoutHtml(d, idx) {
    const closes = this.lastData.map(x => x.close);
    const rsiArr = this.calculateRSI(closes, 14);
    const macdRes = this.calculateMACD(closes, 12, 26, 9);
    const rsi = rsiArr[idx];
    const macdVal = macdRes.macd[idx];
    const parts = [];
    parts.push(`<b>${new Date(d.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</b>`);
    if (d.open != null)  parts.push(`O: ₹${d.open.toFixed(2)}`);
    if (d.high != null)  parts.push(`H: ₹${d.high.toFixed(2)}`);
    if (d.low != null)   parts.push(`L: ₹${d.low.toFixed(2)}`);
    parts.push(`C: ₹${d.close.toFixed(2)}`);
    if (d.volume != null) parts.push(`Vol: ${this._fmtVolume(d.volume)}`);
    if (rsi != null)      parts.push(`RSI: ${rsi.toFixed(1)}`);
    if (macdVal != null)  parts.push(`MACD: ${macdVal.toFixed(3)}`);
    return parts.join(' &nbsp;·&nbsp; ');
  }

  // ----------------------------------------------------------
  // ZOOM SYNC — keep all panes aligned when the price pane zooms/pans
  // ----------------------------------------------------------
  _onZoomChange(sourceChart) {
    const resetBtn = document.getElementById('reset-zoom-btn');
    if (resetBtn) resetBtn.style.display = 'inline-block';

    // Mirror the visible x-range on every sub-pane so they stay aligned
    const xScale = sourceChart.scales.x;
    if (!xScale) return;
    const min = xScale.min;
    const max = xScale.max;

    ['volume', 'rsi', 'macd'].forEach(key => {
      const c = this.charts[key];
      if (!c) return;
      if (!c.options.scales || !c.options.scales.x) return;
      c.options.scales.x.min = min;
      c.options.scales.x.max = max;
      c.update('none');
    });
  }

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------
  _labels(data) {
    return data.map(item => {
      const d = new Date(item.timestamp);
      if (this.currentRange === '1d' || this.currentRange === '5d') {
        return d.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    });
  }

  _fmtVolume(n) {
    if (n == null) return '—';
    n = Number(n);
    if (n >= 1e7) return (n / 1e7).toFixed(2) + ' Cr';
    if (n >= 1e5) return (n / 1e5).toFixed(2) + ' L';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + ' K';
    return n.toString();
  }

  showError(message) {
    if (!this.container) return;
    const existing = this.container.querySelector('.chart-error');
    if (existing) existing.remove();
    const errorDiv = document.createElement('div');
    errorDiv.className = 'chart-error';
    errorDiv.textContent = message;
    this.container.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  }

  // ----------------------------------------------------------
  // STYLES
  // ----------------------------------------------------------
  _styles() {
    return `
      .chart-container { padding: 16px; }
      .chart-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
      .chart-header h3 { margin: 0; font-size: 18px; }

      .chart-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
      .time-range-buttons, .chart-type-buttons { display: flex; gap: 4px; flex-wrap: wrap; }
      .range-btn, .type-btn {
        padding: 5px 10px; font-size: 12px; border-radius: 6px; cursor: pointer;
        background: var(--bg-elev, #f3f4f6); color: var(--text, #111); border: 1px solid var(--border, #e5e7eb);
        transition: all 0.15s;
      }
      .range-btn:hover, .type-btn:hover { background: var(--bg-hover, #e5e7eb); }
      .range-btn.active, .type-btn.active { background: #2563eb; color: white; border-color: #2563eb; }
      .type-btn i { margin-right: 4px; font-size: 11px; }
      .reset-zoom-btn { background: #f97316 !important; color: white !important; border-color: #f97316 !important; }
      .reset-zoom-btn:hover { background: #ea580c !important; }

      .indicator-bar {
        display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
        padding: 8px 10px; margin-bottom: 12px;
        background: var(--bg-elev, #f9fafb); border-radius: 8px;
        border: 1px solid var(--border, #e5e7eb);
      }
      .ind-label { font-size: 11px; font-weight: 600; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.5px; }
      .ind-sep { opacity: 0.3; margin: 0 4px; }
      .ind-pill {
        padding: 4px 9px; font-size: 11px; font-weight: 500;
        border-radius: 999px; cursor: pointer;
        background: transparent; color: var(--text, #111);
        border: 1px solid var(--border, #d1d5db);
        transition: all 0.15s;
      }
      .ind-pill:hover { background: var(--bg-hover, #f3f4f6); }
      .ind-pill.active {
        background: var(--pill-color, #2563eb);
        color: white;
        border-color: var(--pill-color, #2563eb);
      }
      .ind-pill.pane-pill.active { background: #475569; border-color: #475569; }

      .chart-wrapper { display: flex; flex-direction: column; gap: 4px; }
      .pane { position: relative; background: var(--bg-card, transparent); border-radius: 6px; }
      .pane canvas { display: block; width: 100% !important; }
      .price-pane { height: 360px; }
      .volume-pane { height: 90px; }
      .rsi-pane { height: 110px; }
      .macd-pane { height: 130px; }
      .pane-label {
        position: absolute; top: 4px; left: 8px; z-index: 2;
        font-size: 10px; font-weight: 600; opacity: 0.6;
        text-transform: uppercase; letter-spacing: 0.5px;
        pointer-events: none;
      }

      .chart-loading {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.7); color: white; padding: 10px 20px;
        border-radius: 6px; font-size: 13px; z-index: 10;
      }
      .chart-readout {
        position: absolute; top: 4px; right: 8px; z-index: 3;
        font-size: 11px; font-family: ui-monospace, "SF Mono", Menlo, monospace;
        color: var(--text, #111); opacity: 0.85;
        background: var(--bg-card, rgba(255,255,255,0.85));
        padding: 3px 8px; border-radius: 4px;
        pointer-events: none;
        max-width: 60%; text-align: right;
      }
      .chart-error {
        background: rgba(220, 38, 38, 0.1); color: #b91c1c;
        padding: 10px 14px; border-radius: 6px; margin-top: 10px;
        border: 1px solid rgba(220, 38, 38, 0.3); font-size: 13px;
      }
    `;
  }
}
