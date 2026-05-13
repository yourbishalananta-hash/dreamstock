// ============================================================
// PORTFOLIO — holdings + transactions + sector pie
// Persists to localStorage
// ============================================================
class PortfolioComponent {
  constructor(containerId, stateManager, apiService) {
    this.container = document.getElementById(containerId);
    this.stateManager = stateManager;
    this.apiService = apiService;
    this.activeTab = 'holdings';
    this.transactions = this.loadFromStorage('ds_portfolio_txns', []);
    this.sectorMap = this.loadFromStorage('ds_sector_cache', {});
  }

  loadFromStorage(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch (_) { return fallback; }
  }
  saveToStorage(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }
  saveTxns() { this.saveToStorage('ds_portfolio_txns', this.transactions); }

  /** Aggregate transactions into current holdings */
  computeHoldings() {
    const holdings = {};
    for (const t of this.transactions) {
      const h = holdings[t.symbol] = holdings[t.symbol] || { symbol: t.symbol, qty: 0, invested: 0 };
      if (t.type === 'BUY') {
        h.qty += t.qty;
        h.invested += t.qty * t.price;
      } else { // SELL
        if (h.qty > 0) {
          const avgCost = h.invested / h.qty;
          h.invested -= avgCost * Math.min(t.qty, h.qty);
        }
        h.qty -= t.qty;
      }
    }
    // Drop zeroed-out positions
    return Object.values(holdings).filter(h => h.qty > 0).map(h => ({
      ...h,
      avgPrice: h.qty > 0 ? h.invested / h.qty : 0,
    }));
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="card portfolio-card">
        <div class="card-header">
          <h3><i class="fas fa-briefcase"></i> Portfolio</h3>
          <button class="btn btn-primary btn-sm" id="addTxnBtn"><i class="fas fa-plus"></i> Add Transaction</button>
        </div>
        <div class="portfolio-tabs">
          <button class="ptab ${this.activeTab==='holdings'?'active':''}" data-tab="holdings">Holdings</button>
          <button class="ptab ${this.activeTab==='transactions'?'active':''}" data-tab="transactions">Transactions</button>
          <button class="ptab ${this.activeTab==='allocation'?'active':''}" data-tab="allocation">Sector Allocation</button>
        </div>
        <div class="card-body" id="portfolioBody"></div>
      </div>
    `;
    this.renderBody();
    this.attachEvents();
  }

  attachEvents() {
    this.container.querySelectorAll('.ptab').forEach(b => {
      b.addEventListener('click', () => {
        this.activeTab = b.dataset.tab;
        this.container.querySelectorAll('.ptab').forEach(x => x.classList.toggle('active', x === b));
        this.renderBody();
      });
    });
    const addBtn = document.getElementById('addTxnBtn');
    if (addBtn) addBtn.addEventListener('click', () => this.showAddDialog());
  }

  renderBody() {
    const body = document.getElementById('portfolioBody');
    if (!body) return;
    if (this.activeTab === 'holdings')       body.innerHTML = this.renderHoldings();
    else if (this.activeTab === 'transactions') body.innerHTML = this.renderTransactions();
    else if (this.activeTab === 'allocation') {
      body.innerHTML = `<div id="sectorChartWrap" style="position:relative;height:340px;max-width:540px;margin:0 auto;"><canvas id="sectorPie"></canvas></div><div id="sectorLegend" style="max-width:540px;margin:1rem auto 0;"></div>`;
      this.renderSectorChart();
    }
    this.attachBodyEvents();
  }

  renderHoldings() {
    const holdings = this.computeHoldings();
    if (!holdings.length) {
      return `<div class="empty-state">
        <i class="fas fa-briefcase"></i>
        <p>No holdings yet. Add a transaction to get started.</p>
      </div>`;
    }
    const stocks = this.stateManager?.get('stocks') || [];
    let totalInvested = 0, totalCurrent = 0;
    const rows = holdings.map(h => {
      const live = stocks.find(s => s.symbol === h.symbol);
      const ltp = live ? live.ltp : 0;
      const currentValue = ltp * h.qty;
      const pnl = currentValue - h.invested;
      const pnlPct = h.invested > 0 ? (pnl / h.invested) * 100 : 0;
      totalInvested += h.invested;
      totalCurrent += currentValue;
      const cls = pnl >= 0 ? 'positive' : 'negative';
      return `
        <tr class="row-clickable" data-symbol="${h.symbol}">
          <td><strong>${h.symbol}</strong></td>
          <td>${h.qty}</td>
          <td>₹${this._fmt(h.avgPrice)}</td>
          <td>${ltp ? '₹' + this._fmt(ltp) : '—'}</td>
          <td>₹${this._fmt(currentValue)}</td>
          <td class="${cls}">₹${this._fmt(pnl)}</td>
          <td class="${cls}">${pnl >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%</td>
        </tr>`;
    }).join('');

    const totalPnL = totalCurrent - totalInvested;
    const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    const cls = totalPnL >= 0 ? 'positive' : 'negative';

    return `
      <div class="portfolio-totals">
        <div class="ptotal"><div class="ptotal-label">Invested</div><div class="ptotal-value">₹${this._fmt(totalInvested)}</div></div>
        <div class="ptotal"><div class="ptotal-label">Current</div><div class="ptotal-value">₹${this._fmt(totalCurrent)}</div></div>
        <div class="ptotal"><div class="ptotal-label">Total P&L</div><div class="ptotal-value ${cls}">₹${this._fmt(totalPnL)} (${totalPnL >= 0 ? '+' : ''}${totalPnLPct.toFixed(2)}%)</div></div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>Symbol</th><th>Qty</th><th>Avg Cost</th><th>LTP</th>
            <th>Current Value</th><th>P&L (₹)</th><th>P&L %</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  renderTransactions() {
    if (!this.transactions.length) {
      return `<div class="empty-state">
        <i class="fas fa-history"></i>
        <p>No transactions recorded yet.</p>
      </div>`;
    }
    const sorted = [...this.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    const rows = sorted.map(t => `
      <tr>
        <td>${new Date(t.date).toLocaleDateString('en-IN')}</td>
        <td><strong>${t.symbol}</strong></td>
        <td><span class="txn-badge ${t.type === 'BUY' ? 'buy' : 'sell'}">${t.type}</span></td>
        <td>${t.qty}</td>
        <td>₹${this._fmt(t.price)}</td>
        <td>₹${this._fmt(t.qty * t.price)}</td>
        <td><button class="btn-link txn-del" data-id="${t.id}">Delete</button></td>
      </tr>
    `).join('');
    return `
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Date</th><th>Symbol</th><th>Type</th><th>Qty</th><th>Price</th><th>Amount</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  async renderSectorChart() {
    const holdings = this.computeHoldings();
    const stocks = this.stateManager?.get('stocks') || [];

    if (!holdings.length) {
      const wrap = document.getElementById('sectorChartWrap');
      if (wrap) wrap.innerHTML = `<div class="empty-state"><i class="fas fa-chart-pie"></i><p>Add holdings to see sector allocation.</p></div>`;
      return;
    }

    // Fetch sectors for symbols we don't have cached
    const needed = holdings.filter(h => !this.sectorMap[h.symbol]);
    if (needed.length) {
      const results = await Promise.all(needed.map(h =>
        this.apiService.getFundamentals(h.symbol).catch(() => null)
      ));
      needed.forEach((h, i) => {
        const sector = (results[i] && results[i].sector) || 'Other';
        this.sectorMap[h.symbol] = sector;
      });
      this.saveToStorage('ds_sector_cache', this.sectorMap);
    }

    // Build sector totals by current value
    const sectors = {};
    for (const h of holdings) {
      const live = stocks.find(s => s.symbol === h.symbol);
      const value = (live ? live.ltp : h.avgPrice) * h.qty;
      const sec = this.sectorMap[h.symbol] || 'Other';
      sectors[sec] = (sectors[sec] || 0) + value;
    }

    const labels = Object.keys(sectors);
    const values = Object.values(sectors);
    const total = values.reduce((a, b) => a + b, 0);
    const palette = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#9333ea', '#0891b2', '#db2777', '#65a30d', '#7c2d12', '#475569'];

    const canvas = document.getElementById('sectorPie');
    if (!canvas || typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels, datasets: [{
          data: values,
          backgroundColor: palette.slice(0, labels.length),
          borderColor: '#ffffff', borderWidth: 2,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => `${c.label}: ₹${this._fmt(c.parsed)} (${((c.parsed/total)*100).toFixed(1)}%)`
            }
          }
        }
      }
    });

    // Custom legend
    const legend = document.getElementById('sectorLegend');
    if (legend) {
      legend.innerHTML = labels.map((label, i) => `
        <div class="sector-legend-item">
          <span class="sector-dot" style="background:${palette[i]}"></span>
          <span class="sector-label">${label}</span>
          <span class="sector-value">₹${this._fmt(values[i])} (${((values[i]/total)*100).toFixed(1)}%)</span>
        </div>
      `).join('');
    }
  }

  attachBodyEvents() {
    const body = document.getElementById('portfolioBody');
    if (!body) return;

    body.querySelectorAll('.row-clickable').forEach(row => {
      row.addEventListener('click', () => {
        const sym = row.dataset.symbol;
        if (window.app && sym) window.app.openStockDetail(sym);
      });
    });

    body.querySelectorAll('.txn-del').forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = b.dataset.id;
        if (!confirm('Delete this transaction?')) return;
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveTxns();
        this.renderBody();
      });
    });
  }

  showAddDialog() {
    const overlay = document.getElementById('modalOverlay');
    const container = document.getElementById('modalContainer');
    if (!overlay || !container) return;

    const today = new Date().toISOString().slice(0, 10);
    container.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add Transaction</h3>
          <button class="modal-close" id="modalClose">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>Symbol</label>
            <input type="text" id="txnSymbol" placeholder="Search RELIANCE, TCS...">
          </div>
          <div class="form-row">
            <label>Type</label>
            <select id="txnType">
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>
          <div class="form-row two-col">
            <div>
              <label>Quantity</label>
              <input type="number" id="txnQty" min="1" step="1" placeholder="0">
            </div>
            <div>
              <label>Price per share (₹)</label>
              <input type="number" id="txnPrice" min="0" step="0.01" placeholder="0.00">
            </div>
          </div>
          <div class="form-row">
            <label>Date</label>
            <input type="date" id="txnDate" value="${today}">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" id="modalCancel">Cancel</button>
          <button class="btn btn-primary" id="modalSave">Save</button>
        </div>
      </div>
    `;
    overlay.classList.add('active');

    // Autocomplete for symbol
    const symInput = document.getElementById('txnSymbol');
    if (symInput && window.Autocomplete && window.app) {
      new Autocomplete(symInput, {
        getSource: () => window.app.getAutocompleteSource(),
        onSelect: (item) => {
          symInput.value = item.symbol;
          // Pre-fill price with LTP if available
          const stocks = this.stateManager?.get('stocks') || [];
          const live = stocks.find(s => s.symbol === item.symbol);
          if (live && live.ltp) {
            document.getElementById('txnPrice').value = live.ltp;
          }
        }
      });
    }

    const close = () => overlay.classList.remove('active');
    document.getElementById('modalClose').addEventListener('click', close);
    document.getElementById('modalCancel').addEventListener('click', close);
    document.getElementById('modalSave').addEventListener('click', () => {
      const sym = (symInput.value || '').trim().toUpperCase();
      const type = document.getElementById('txnType').value;
      const qty = parseFloat(document.getElementById('txnQty').value);
      const price = parseFloat(document.getElementById('txnPrice').value);
      const date = document.getElementById('txnDate').value;
      if (!sym || !qty || !price || qty <= 0 || price <= 0) {
        alert('Please fill in all fields with positive values.');
        return;
      }
      this.transactions.push({
        id: 'txn_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        symbol: sym, type, qty, price, date,
      });
      this.saveTxns();
      close();
      this.renderBody();
    });
  }

  _fmt(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}