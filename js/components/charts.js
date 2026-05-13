// ============================================================
// CHARTS COMPONENT
// ============================================================
class ChartsComponent {
  constructor(containerId, stateManager, apiService) {
    this.container = document.getElementById(containerId);
    this.stateManager = stateManager;
    this.apiService = apiService;
    this.chart = null;
    this.currentSymbol = 'NIFTY 50';
    this.currentRange = '1mo';
    this.ranges = {
      '1d':'1 Day','5d':'5 Days','1mo':'1 Month','3mo':'3 Months',
      '6mo':'6 Months','1y':'1 Year','5y':'5 Years','max':'Max',
    };
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="chart-container card">
        <div class="chart-header">
          <h3 id="chart-title"><i class="fas fa-chart-line"></i> ${this.currentSymbol}</h3>
          <div class="symbol-input">
            <input type="text" id="chart-symbol-input" placeholder="Search RELIANCE, TCS, INFY...">
          </div>
        </div>
        <div class="time-range-buttons">${this.generateRangeButtons()}</div>
        <div class="chart-wrapper" style="position:relative;height:420px;">
          <canvas id="price-chart-canvas"></canvas>
          <div id="chart-loading" class="chart-loading" style="display:none">Loading data…</div>
        </div>
      </div>
    `;
    this.attachEvents();
    this.loadChartData();
  }

  generateRangeButtons() {
    return Object.entries(this.ranges).map(([key, label]) =>
      `<button class="range-btn ${key === this.currentRange ? 'active' : ''}" data-range="${key}">${label}</button>`
    ).join('');
  }

  attachEvents() {
    this.container.querySelectorAll('.range-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentRange = btn.dataset.range;
        this.container.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.loadChartData();
      });
    });

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
  }

  async loadChartData() {
    const loadingDiv = document.getElementById('chart-loading');
    if (loadingDiv) loadingDiv.style.display = 'block';

    try {
      const data = await this.apiService.getHistoricalData(this.currentSymbol, { range: this.currentRange });
      if (!data || data.length === 0) {
        this.showError(`No data available for ${this.currentSymbol} (${this.currentRange}).`);
        if (this.chart) { this.chart.destroy(); this.chart = null; }
        return;
      }
      this.renderChart(data);
    } catch (error) {
      console.error('Failed to load chart data:', error);
      this.showError(`Unable to load ${this.currentSymbol}: ${error.message}`);
    } finally {
      if (loadingDiv) loadingDiv.style.display = 'none';
    }
  }

  renderChart(data) {
    const canvas = document.getElementById('price-chart-canvas');
    if (!canvas || typeof Chart === 'undefined') return;
    if (this.chart) this.chart.destroy();
    const ctx = canvas.getContext('2d');

    const labels = data.map(item => {
      const d = new Date(item.timestamp);
      if (this.currentRange === '1d' || this.currentRange === '5d') {
        return d.toLocaleString('en-IN', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
      }
      return d.toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' });
    });
    const prices = data.map(item => item.close);
    const up = prices[prices.length - 1] >= prices[0];
    const lineColor = up ? 'rgb(22, 163, 74)' : 'rgb(220, 38, 38)';
    const fillColor = up ? 'rgba(22, 163, 74, 0.08)' : 'rgba(220, 38, 38, 0.08)';

    this.chart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{
        label: this.currentSymbol, data: prices,
        borderColor: lineColor, backgroundColor: fillColor,
        fill: true, tension: 0.2, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2,
      }]},
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (ctx) => `₹${Number(ctx.parsed.y).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
          }
        },
        scales: {
          x: { ticks: { maxTicksLimit: 8, autoSkip: true } },
          y: { ticks: { callback: (v) => '₹' + Number(v).toLocaleString('en-IN') } }
        }
      }
    });
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
}