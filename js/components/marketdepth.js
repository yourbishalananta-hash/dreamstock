// ============================================================
// MARKET DEPTH — orders tab
// ============================================================
class MarketDepthComponent {
  constructor(containerId, stateManager, apiService) {
    this.container = document.getElementById(containerId);
    this.stateManager = stateManager;
    this.apiService = apiService;
    this.symbol = stateManager?.get('activeSymbol') || 'RELIANCE';
    this.depthData = null;
    this.refreshTimer = null;
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-exchange-alt"></i> Market Depth</h3>
          <div class="depth-search">
            <input type="text" id="depthSymbolInput" placeholder="Search symbol..." value="${this.symbol}">
          </div>
        </div>
        <div class="card-body" id="depthBody"><div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Loading...</p></div></div>
      </div>
    `;
    this.attachEvents();
    this.loadDepth();
  }

  attachEvents() {
    const input = document.getElementById('depthSymbolInput');
    if (input && window.Autocomplete && window.app) {
      new Autocomplete(input, {
        getSource: () => window.app.getAutocompleteSource(),
        onSelect: (item) => {
          this.symbol = item.symbol;
          input.value = item.symbol;
          this.loadDepth();
        }
      });
    }
  }

  async loadDepth() {
    try {
      this.depthData = await this.apiService.getMarketDepth(this.symbol);
      this.renderDepth();
      // Auto-refresh every 10 seconds
      if (this.refreshTimer) clearInterval(this.refreshTimer);
      this.refreshTimer = setInterval(() => this.refreshSilent(), 10000);
    } catch (e) {
      const body = document.getElementById('depthBody');
      if (body) body.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Unable to load depth for ${this.symbol}.</p></div>`;
    }
  }

  async refreshSilent() {
    try {
      this.depthData = await this.apiService.getMarketDepth(this.symbol);
      this.renderDepth();
    } catch (_) {}
  }

  renderDepth() {
    const body = document.getElementById('depthBody');
    if (!body || !this.depthData) return;
    const { bids, asks, bidTotal, askTotal, ltp, simulated } = this.depthData;

    body.innerHTML = `
      <div class="depth-meta">
        <div><span class="depth-label">Symbol</span><span class="depth-value"><strong>${this.symbol}</strong></span></div>
        <div><span class="depth-label">LTP</span><span class="depth-value">₹${this._fmt(ltp)}</span></div>
      </div>
      ${simulated ? `<div class="depth-note">⚠️ Simulated depth for demo. Live 5-level depth requires a broker API (Zerodha Kite, Upstox, etc.).</div>` : ''}
      <div class="depth-grid">
        <div class="depth-col">
          <h4 class="depth-side-title positive">Bids</h4>
          <table class="data-table depth-table">
            <thead><tr><th>Qty</th><th>Orders</th><th>Bid Price</th></tr></thead>
            <tbody>
              ${bids.map(b => `<tr>
                <td>${b.qty}</td>
                <td>${b.orders}</td>
                <td class="positive"><strong>₹${this._fmt(b.price)}</strong></td>
              </tr>`).join('')}
              <tr class="depth-total"><td>${bidTotal.toLocaleString('en-IN')}</td><td colspan="2">Total Buy Qty</td></tr>
            </tbody>
          </table>
        </div>
        <div class="depth-col">
          <h4 class="depth-side-title negative">Asks</h4>
          <table class="data-table depth-table">
            <thead><tr><th>Ask Price</th><th>Orders</th><th>Qty</th></tr></thead>
            <tbody>
              ${asks.map(a => `<tr>
                <td class="negative"><strong>₹${this._fmt(a.price)}</strong></td>
                <td>${a.orders}</td>
                <td>${a.qty}</td>
              </tr>`).join('')}
              <tr class="depth-total"><td colspan="2">Total Sell Qty</td><td>${askTotal.toLocaleString('en-IN')}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  destroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  _fmt(n) {
    if (n == null || isNaN(n)) return '—';
    return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}