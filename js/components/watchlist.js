// ============================================================
// WATCHLIST COMPONENT (with autocomplete)
// ============================================================
class WatchlistComponent {
  constructor(containerId, stateManager) {
    this.container = document.getElementById(containerId);
    this.stateManager = stateManager;
    this.watchlist = (stateManager && stateManager.get) ? (stateManager.get('watchlist') || []) : [];
  }

  render() {
    if (!this.container) return;
    const stocks = this.stateManager?.get('stocks') || [];
    const items = this.watchlist.map(sym => {
      const s = stocks.find(x => x.symbol === sym);
      const ltp = s ? `₹${Number(s.ltp).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';
      const chg = s ? (s.change >= 0 ? `+${s.change}%` : `${s.change}%`) : '';
      const cls = s ? (s.change >= 0 ? 'positive' : 'negative') : '';
      return `
        <li class="watchlist-row" data-symbol="${sym}">
          <span class="wl-sym row-clickable" data-symbol="${sym}">${sym}</span>
          <span class="wl-price">${ltp}</span>
          <span class="wl-change ${cls}">${chg}</span>
          <button class="btn-link remove-symbol" data-symbol="${sym}">Remove</button>
        </li>`;
    }).join('');

    this.container.innerHTML = `
      <div class="card watchlist">
        <div class="card-header"><h3><i class="fas fa-star"></i> Watchlist</h3></div>
        <div class="card-body">
          <div class="watchlist-add">
            <input type="text" id="add-symbol" placeholder="Search to add a stock...">
            <button class="btn btn-primary btn-sm" id="add-watchlist-btn">Add</button>
          </div>
          <ul class="watchlist-list">
            ${items || '<li style="color:var(--text-muted);padding:1rem;">Your watchlist is empty.</li>'}
          </ul>
        </div>
      </div>`;
    this.attachEvents();
  }

  attachEvents() {
    const input = document.getElementById('add-symbol');
    const btn = document.getElementById('add-watchlist-btn');

    if (input && window.Autocomplete && window.app) {
      new Autocomplete(input, {
        getSource: () => window.app.getAutocompleteSource(),
        onSelect: (item) => {
          this.addSymbol(item.symbol);
          input.value = '';
        }
      });
    }

    const add = () => {
      const sym = (input?.value || '').trim().toUpperCase();
      if (sym) this.addSymbol(sym);
    };
    if (btn) btn.addEventListener('click', add);
    if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });

    this.container.querySelectorAll('.remove-symbol').forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const sym = b.dataset.symbol;
        this.watchlist = this.watchlist.filter(s => s !== sym);
        if (this.stateManager?.set) this.stateManager.set('watchlist', this.watchlist);
        this.render();
      });
    });

    this.container.querySelectorAll('.wl-sym.row-clickable').forEach(el => {
      el.addEventListener('click', () => {
        const sym = el.dataset.symbol;
        if (window.app) window.app.openStockDetail(sym);
      });
    });
  }

  addSymbol(sym) {
    if (sym && !this.watchlist.includes(sym)) {
      this.watchlist.push(sym);
      if (this.stateManager?.set) this.stateManager.set('watchlist', this.watchlist);
      this.render();
    }
  }
}