// ============================================================
// SCREENER COMPONENT — filter stocks by % change range
// ============================================================
class ScreenerComponent {
  constructor(containerId, stateManager) {
    this.container = document.getElementById(containerId);
    this.stateManager = stateManager;
  }

  render() {
    if (!this.container) return;
    const stocks = this.stateManager?.get('stocks') || [];
    this.container.innerHTML = `
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-filter"></i> Stock Screener</h3></div>
        <div class="card-body">
          <div class="screener-controls">
            <label>Min % Change <input type="number" id="screenMin" value="-100" step="0.1"></label>
            <label>Max % Change <input type="number" id="screenMax" value="100" step="0.1"></label>
            <button class="btn btn-primary btn-sm" id="screenBtn">Filter</button>
          </div>
          <div id="screenResults" style="margin-top:1rem;">${this._renderRows(stocks)}</div>
        </div>
      </div>`;
    const btn = document.getElementById('screenBtn');
    if (btn) btn.addEventListener('click', () => {
      const min = parseFloat(document.getElementById('screenMin').value);
      const max = parseFloat(document.getElementById('screenMax').value);
      const filtered = stocks.filter(s => s.change >= min && s.change <= max);
      document.getElementById('screenResults').innerHTML = this._renderRows(filtered);
      this._wireRows();
    });
    this._wireRows();
  }

  _wireRows() {
    document.querySelectorAll('#screenResults tr.row-clickable').forEach(r => {
      r.addEventListener('click', () => {
        const sym = r.dataset.symbol;
        if (sym && window.app) window.app.openStockDetail(sym);
      });
    });
  }

  _renderRows(list) {
    if (!list.length) return '<p style="color:var(--text-muted);padding:1rem;">No stocks match.</p>';
    return `<table class="data-table"><thead><tr><th>Symbol</th><th>Price</th><th>% Change</th><th>Volume</th></tr></thead><tbody>${list.map(s => {
      const cls = s.change >= 0 ? 'positive' : 'negative';
      return `<tr class="row-clickable" data-symbol="${s.symbol}"><td><strong>${s.symbol}</strong></td><td>₹${Number(s.ltp).toLocaleString('en-IN', {minimumFractionDigits:2})}</td><td class="${cls}">${s.change >= 0 ? '+' : ''}${s.change}%</td><td>${(s.volume || 0).toLocaleString('en-IN')}</td></tr>`;
    }).join('')}</tbody></table>`;
  }
}