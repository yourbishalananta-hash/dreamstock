import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "https://dabc1f06d1123664aa0354753f424030@o4511383434952704.ingest.de.sentry.io/4511383445635152",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true
});
myUndefinedFunction();   // this function does not exist
// ============================================
// DREAM SHARE - MAIN APPLICATION
// ============================================

class DreamShareApp {
  constructor() {
    this.components = {};
    this.initialized = false;
    this.indices = [];
    this.symbolLibrary = [];
    this.tableViewState = null;
    this.detailViewState = null; // {primarySymbol, comparisonSymbol?, detail, compareDetail?}
  }

async initialize() {
  if (this.initialized) return;
  console.log('🚀 Initializing Dream Stock...');
  this.showLoading(true);
  try {
    this.initializeServices();
    this.setupEventListeners();
    await this.loadInitialData();
this.safeBind('userProfile', () => {
  if (typeof authManager !== 'undefined' && authManager.isLoggedIn?.()) {
    // already logged in — open user menu, or log out
    if (typeof authModal !== 'undefined') authModal.show('login'); // placeholder
  } else {
    if (typeof authModal !== 'undefined') authModal.show('login');
  }
});
    // Initialize authentication
    await this.initAuth();

    // Load user data if logged in
    if (typeof authManager !== 'undefined' && authManager.isLoggedIn && authManager.isLoggedIn()) {
      this.loadUserData();
    }

    this.showLoading(false);
    const main = document.getElementById('mainPlatform');
    if (main) main.style.display = 'grid';

    const initialView = stateManager.get('activeView') || 'dashboard';
    await this.loadView(initialView);

    this.updateMarketStatus();
    this.updateBadges();
    this.updateIndicesPanel();
    this.startPeriodicUpdates();
    this.attachGlobalSearchAutocomplete();

    this.initialized = true;
    console.log('✅ Dream Stock initialized successfully');
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    this.showLoading(false);
    const main = document.getElementById('mainPlatform');
    if (main) main.style.display = 'grid';
    this.showToast('Initialization had errors.', 'error');
    try { await this.loadView('dashboard'); } catch (_) {}
  }
}

  async initAuth() {
    console.log("🔐 Initializing Authentication...");
    // For now, we simulate a successful login
    const user = localStorage.getItem('dreamstock_user');
    if (!user) {
      console.warn("⚠️ No user logged in, proceeding as guest.");
      return { authenticated: false, role: 'guest' };
    }
    try {
      return { authenticated: true, user: JSON.parse(user) };
    } catch (e) {
      console.warn("⚠️ Corrupt user record in localStorage, clearing.");
      localStorage.removeItem('dreamstock_user');
      return { authenticated: false, role: 'guest' };
    }
  }

  initializeServices() {
    if (typeof CONFIG !== 'undefined' && CONFIG.features?.realTimeUpdates && typeof webSocketService !== 'undefined') {
      try { webSocketService.connect(); } catch (e) {}
    }
    this.setupEventSubscriptions();
  }

  setupEventListeners() {
    document.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        if (view) this.navigateTo(view);
      });
    });

    const searchClear = document.getElementById('searchClear');
    const searchInput = document.getElementById('globalSearch');
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        searchClear.style.display = 'none';
      });
    }

    this.safeBind('btnWatchlist', () => this.navigateTo('watchlist'));
    this.safeBind('btnAlerts', () => this.navigateTo('alerts'));
    this.safeBind('btnPortfolio', () => this.navigateTo('portfolio'));
    this.safeBind('btnSettings', () => this.openSettings());

    document.querySelectorAll('.panel-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchPanel(e.currentTarget.dataset.panel));
    });

    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
  }

  attachGlobalSearchAutocomplete() {
    const input = document.getElementById('globalSearch');
    if (!input || !window.Autocomplete) return;

    // Hide the legacy search-results dropdown — autocomplete provides its own
    const sr = document.getElementById('searchResults');
    if (sr) sr.style.display = 'none';

    new Autocomplete(input, {
      getSource: () => this.getAutocompleteSource(),
      onSelect: (item) => {
        input.value = '';
        this.openStockDetail(item.symbol);
      }
    });
  }

  /**
   * Build the autocomplete source by merging the symbol library
   * with live price/change data when available.
   */
  getAutocompleteSource() {
    const stocks = stateManager.get('stocks') || [];
    const indicesArr = this.indices || [];
    const liveMap = new Map();
    stocks.forEach(s => liveMap.set(s.symbol, s));
    indicesArr.forEach(s => liveMap.set(s.symbol, s));

    return (this.symbolLibrary || []).map(entry => {
      const live = liveMap.get(entry.symbol);
      return {
        symbol: entry.symbol,
        name: entry.name,
        isIndex: !!entry.isIndex,
        ltp: live?.ltp,
        change: live?.change,
      };
    });
  }

  safeBind(id, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', handler);
  }

  setupEventSubscriptions() {
    if (typeof eventBus === 'undefined' || typeof EventBus === 'undefined') return;

    eventBus.on(EventBus.Events.MARKET_DATA_UPDATED, () => {
      const view = stateManager.get('activeView');
      if (view === 'dashboard') this.renderDashboardSections();
      else if (view === 'top-list') this.renderTopListContent();
      else if (view === 'portfolio' && this.components.portfolio?.activeTab === 'holdings') {
        this.components.portfolio.renderBody();
      }
      this.updateIndicesPanel();
      const el = document.getElementById('lastUpdated');
      if (el) el.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    });

    eventBus.on(EventBus.Events.STOCK_SELECTED, (symbol) => this.openStockDetail(symbol));
    eventBus.on(EventBus.Events.CONNECTION_CHANGED, (status) => this.updateConnectionStatus(status));
  }

  async loadInitialData() {
    try {
      if (typeof apiService === 'undefined') {
        stateManager.set('stocks', []);
        return;
      }
      const [marketData, summary, symbols] = await Promise.all([
        apiService.getMarketWatch().catch(() => ({ data: [] })),
        apiService.getMarketSummary().catch(() => ({ indices: [], totals: {} })),
        apiService.getSymbolList().catch(() => []),
      ]);
      stateManager.set('stocks', (marketData && marketData.data) || []);
      this.indices = (summary && summary.indices) || [];
      this.symbolLibrary = Array.isArray(symbols) ? symbols : (symbols?.symbols || symbols || []);
      console.log(`📊 Loaded ${stateManager.get('stocks').length} stocks, ${this.indices.length} indices, ${this.symbolLibrary.length} symbols`);
    } catch (error) {
      console.warn('⚠️ Market data unavailable:', error.message);
      stateManager.set('stocks', []);
      this.showToast('Backend unreachable. Running in offline mode.', 'warning');
    }
  }

  navigateTo(view, payload) {
    // Cleanup previous timers/intervals if needed
    if (this.components.depth?.destroy) this.components.depth.destroy();
const currentView = stateManager.get('activeView');
    if (currentView && currentView !== view) {
        this.cleanupComponent(currentView);
    }
    stateManager.set('activeView', view);
    document.querySelectorAll('.menu-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === view);
    });
    this.loadView(view, payload);
  }

  /** Open stock detail page — primary navigation for clicking any symbol */
  async openStockDetail(symbol) {
    if (!symbol) return;
    this.navigateTo('stock-detail', { symbol });
  }

  async loadView(view, payload) {
    const contentArea = document.getElementById('contentArea');
    if (!contentArea) return;

    try {
        switch (view) {
case 'options':
                contentArea.innerHTML = '<div id="options-chain-container"></div>';
                this.components.options = new OptionsChainComponent('options-chain-container');
                await this.components.options.init();
                break;

            case 'backtesting':
                contentArea.innerHTML = '<div id="backtesting-container"></div>';
                this.components.backtesting = new BacktestingComponent('backtesting-container');
                await this.components.backtesting.init();
                break;

            case 'economic-calendar':
                contentArea.innerHTML = '<div id="economic-calendar-container"></div>';
                this.components.economicCalendar = new EconomicCalendarComponent('economic-calendar-container');
                await this.components.economicCalendar.init();
                break;

            case 'correlation':
                contentArea.innerHTML = '<div id="correlation-matrix-container"></div>';
                this.components.correlation = new CorrelationMatrixComponent('correlation-matrix-container');
                await this.components.correlation.init();
                break;

            case 'sentiment':
                contentArea.innerHTML = '<div id="sentiment-container"></div>';
                this.components.sentiment = new SentimentAnalysisComponent('sentiment-container');
                await this.components.sentiment.init();
                break;

            case 'dividends':
                contentArea.innerHTML = '<div id="dividend-container"></div>';
                this.components.dividends = new DividendComponent('dividend-container');
                await this.components.dividends.init();
                break;

            case 'heatmap':
                contentArea.innerHTML = '<div id="heatmap-container"></div>';
                this.components.heatmap = new HeatMapComponent('heatmap-container');
                await this.components.heatmap.init();
                break;

            case 'risk-management':
                contentArea.innerHTML = '<div id="risk-manager-container"></div>';
                this.components.riskManager = new RiskManagerComponent('risk-manager-container');
                await this.components.riskManager.init();
                break;

            case 'ai-predictor':
                contentArea.innerHTML = '<div id="ai-predictor-container"></div>';
                this.components.aiPredictor = new AIPredictorComponent('ai-predictor-container');
                await this.components.aiPredictor.init();
                break;
        case 'dashboard':
          contentArea.innerHTML = this.renderDashboardShell();
          this.renderDashboardSections();
          this.attachDashboardEvents();
          break;

        case 'top-list':
          this.tableViewState = {
            category: payload?.category || 'gainers',
            sortKey: this.defaultSortKeyFor(payload?.category || 'gainers'),
            sortDir: 'desc',
          };
          contentArea.innerHTML = this.renderTopListShell();
          this.renderTopListContent();
          this.attachTopListEvents();
          break;

        case 'stock-detail':
          this.detailViewState = { primarySymbol: payload?.symbol, comparisonSymbol: null };
          contentArea.innerHTML = `<div id="stockDetailRoot"><div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Loading ${payload?.symbol}...</p></div></div>`;
          await this.loadStockDetail();
          break;

        case 'charts':
          contentArea.innerHTML = '<div id="charts-container"></div>';
          this.components.charts = new ChartsComponent('charts-container', stateManager, apiService);
          this.components.charts.render();
          break;

        case 'watchlist':
          contentArea.innerHTML = '<div id="watchlist-container"></div>';
          this.components.watchlist = new WatchlistComponent('watchlist-container', stateManager);
          this.components.watchlist.render();
          break;

        case 'portfolio':
          contentArea.innerHTML = '<div id="portfolio-container"></div>';
          this.components.portfolio = new PortfolioComponent('portfolio-container', stateManager, apiService);
          this.components.portfolio.render();
          break;

        case 'orders':
          contentArea.innerHTML = '<div id="depth-container"></div>';
          this.components.depth = new MarketDepthComponent('depth-container', stateManager, apiService);
          this.components.depth.render();
          break;

        case 'news':
          contentArea.innerHTML = '<div id="news-container"></div>';
          this.components.news = new NewsComponent('news-container');
          this.components.news.render();
          break;

        case 'screener':
          contentArea.innerHTML = '<div id="screener-container"></div>';
          this.components.screener = new ScreenerComponent('screener-container', stateManager);
          this.components.screener.render();
          break;

        case 'alerts':
          contentArea.innerHTML = '<div id="alerts-container"></div>';
          this.components.alerts = new AlertsComponent('alerts-container', stateManager);
          this.components.alerts.render();
          break;

        default:
          contentArea.innerHTML = this.renderComingSoon(view);
      }
    } catch (error) {
        console.error(`Error loading view ${view}:`, error);
        contentArea.innerHTML = `<div class="card"><div class="card-body"><h2>Error</h2><p>Failed to load ${view}.</p></div></div>`;
    }
}
cleanupComponent(name) {
    if (this.components[name]) {
        if (typeof this.components[name].destroy === 'function') {
            this.components[name].destroy();
        }
        delete this.components[name];
    }
}

  // ============================================
  // STOCK DETAIL VIEW
  // ============================================
  async loadStockDetail() {
    const { primarySymbol } = this.detailViewState;
    try {
      const detail = await apiService.getStockDetail(primarySymbol);
      this.detailViewState.detail = detail;
      this.renderStockDetail();
    } catch (e) {
      const root = document.getElementById('stockDetailRoot');
      if (root) root.innerHTML = `<div class="card"><div class="card-body"><h3>Unable to load ${primarySymbol}</h3><p>${e.message}</p></div></div>`;
    }
  }

  renderStockDetail() {
    const root = document.getElementById('stockDetailRoot');
    if (!root) return;
    const { detail, comparisonSymbol, compareDetail } = this.detailViewState;
    const sym = detail.symbol;
    const snap = detail.snapshot || {};
    const f = detail.fundamentals || {};

    const change = snap.change ?? 0;
    const cls = change >= 0 ? 'positive' : 'negative';
    const arrow = change >= 0 ? '▲' : '▼';

    root.innerHTML = `
      <div class="detail-page">
        <div class="detail-back">
          <button class="btn-link" id="detailBack">← Back</button>
        </div>

        <!-- Header -->
        <div class="detail-header card">
          <div class="card-body">
            <div class="dh-top">
              <div>
                <h1 class="dh-symbol">${sym}</h1>
                <p class="dh-name">${f.longName || snap.name || ''}</p>
                <p class="dh-meta">${f.sector || ''}${f.industry ? ' • ' + f.industry : ''}</p>
              </div>
              <div class="dh-price-block">
                <div class="dh-ltp">₹${this._fmt(snap.ltp)}</div>
                <div class="dh-change ${cls}">
                  ${arrow} ${this._fmt(snap.changeAbs)} (${change >= 0 ? '+' : ''}${change}%)
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats grid -->
        <div class="detail-stats-grid">
          ${this.renderDetailStat('Open',         '₹' + this._fmt(snap.dayOpen))}
          ${this.renderDetailStat('Day High',     '₹' + this._fmt(snap.dayHigh))}
          ${this.renderDetailStat('Day Low',      '₹' + this._fmt(snap.dayLow))}
          ${this.renderDetailStat('Prev Close',   '₹' + this._fmt(snap.basePrice))}
          ${this.renderDetailStat('52W High',     '₹' + this._fmt(f.fiftyTwoWeekHigh))}
          ${this.renderDetailStat('52W Low',      '₹' + this._fmt(f.fiftyTwoWeekLow))}
          ${this.renderDetailStat('Volume',       this._fmtVol(snap.volume))}
          ${this.renderDetailStat('Turnover',     '₹' + this._fmtVol(snap.turnover))}
          ${this.renderDetailStat('Market Cap',   this._fmtCrore(f.marketCap))}
          ${this.renderDetailStat('P/E Ratio',    this._fmt(f.peRatio))}
          ${this.renderDetailStat('P/B Ratio',    this._fmt(f.pbRatio))}
          ${this.renderDetailStat('EPS',          '₹' + this._fmt(f.eps))}
          ${this.renderDetailStat('Book Value',   '₹' + this._fmt(f.bookValue))}
          ${this.renderDetailStat('Div Yield',    f.divYield != null ? (f.divYield * 100).toFixed(2) + '%' : '—')}
          ${this.renderDetailStat('Beta',         this._fmt(f.beta))}
          ${this.renderDetailStat('Shares Outstanding', this._fmtCrore(f.sharesOutstanding))}
        </div>

        <!-- Mini chart -->
        <div class="card">
          <div class="card-header"><h3><i class="fas fa-chart-area"></i> Last 1 Month</h3></div>
          <div class="card-body" style="position:relative;height:300px;">
            <canvas id="detailMiniChart"></canvas>
          </div>
        </div>

        <!-- Compare -->
        <div class="card">
          <div class="card-header">
            <h3><i class="fas fa-balance-scale"></i> Compare with another stock</h3>
            ${comparisonSymbol ? `<button class="btn-link" id="clearCompareBtn">Clear comparison</button>` : ''}
          </div>
          <div class="card-body">
            ${!comparisonSymbol ? `
              <div class="compare-search">
                <input type="text" id="compareInput" placeholder="Search a stock to compare with ${sym}...">
              </div>
            ` : this.renderComparisonContent(snap, f, compareDetail)}
          </div>
        </div>
      </div>
    `;

    this.renderMiniChart(detail.history);
    this.attachDetailEvents();
  }

  renderDetailStat(label, value) {
    return `
      <div class="detail-stat card">
        <div class="card-body">
          <div class="stat-label">${label}</div>
          <div class="stat-value">${value || '—'}</div>
        </div>
      </div>`;
  }

  renderComparisonContent(primarySnap, primaryFund, compareDetail) {
    if (!compareDetail) return '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Loading...</p></div>';
    const cSnap = compareDetail.snapshot || {};
    const cFund = compareDetail.fundamentals || {};
    const cSym = compareDetail.symbol;
    const pSym = this.detailViewState.detail.symbol;

    const rows = [
      ['LTP', '₹' + this._fmt(primarySnap.ltp), '₹' + this._fmt(cSnap.ltp)],
      ['Change %', (primarySnap.change >= 0 ? '+' : '') + primarySnap.change + '%', (cSnap.change >= 0 ? '+' : '') + cSnap.change + '%'],
      ['Day High', '₹' + this._fmt(primarySnap.dayHigh), '₹' + this._fmt(cSnap.dayHigh)],
      ['Day Low', '₹' + this._fmt(primarySnap.dayLow), '₹' + this._fmt(cSnap.dayLow)],
      ['52W High', '₹' + this._fmt(primaryFund.fiftyTwoWeekHigh), '₹' + this._fmt(cFund.fiftyTwoWeekHigh)],
      ['52W Low', '₹' + this._fmt(primaryFund.fiftyTwoWeekLow), '₹' + this._fmt(cFund.fiftyTwoWeekLow)],
      ['Market Cap', this._fmtCrore(primaryFund.marketCap), this._fmtCrore(cFund.marketCap)],
      ['P/E', this._fmt(primaryFund.peRatio), this._fmt(cFund.peRatio)],
      ['P/B', this._fmt(primaryFund.pbRatio), this._fmt(cFund.pbRatio)],
      ['EPS', '₹' + this._fmt(primaryFund.eps), '₹' + this._fmt(cFund.eps)],
      ['Beta', this._fmt(primaryFund.beta), this._fmt(cFund.beta)],
      ['Div Yield', primaryFund.divYield != null ? (primaryFund.divYield * 100).toFixed(2) + '%' : '—',
                    cFund.divYield != null ? (cFund.divYield * 100).toFixed(2) + '%' : '—'],
      ['Sector', primaryFund.sector || '—', cFund.sector || '—'],
      ['Volume', this._fmtVol(primarySnap.volume), this._fmtVol(cSnap.volume)],
      ['Turnover', '₹' + this._fmtVol(primarySnap.turnover), '₹' + this._fmtVol(cSnap.turnover)],
    ];

    return `
      <div class="compare-chart-wrap" style="position:relative;height:280px;margin-bottom:1.5rem;">
        <canvas id="compareChart"></canvas>
      </div>
      <div class="compare-note">Both lines normalized to 100 on day 1 for relative performance.</div>
      <div class="table-wrap">
        <table class="data-table compare-table">
          <thead><tr><th>Metric</th><th>${pSym}</th><th>${cSym}</th></tr></thead>
          <tbody>${rows.map(([k, a, b]) => `<tr><td><strong>${k}</strong></td><td>${a || '—'}</td><td>${b || '—'}</td></tr>`).join('')}</tbody>
        </table>
      </div>
    `;
  }

  attachDetailEvents() {
    const back = document.getElementById('detailBack');
    if (back) back.addEventListener('click', () => this.navigateTo('dashboard'));

    // Compare input autocomplete
    const compareInput = document.getElementById('compareInput');
    if (compareInput && window.Autocomplete) {
      new Autocomplete(compareInput, {
        getSource: () => this.getAutocompleteSource().filter(s => s.symbol !== this.detailViewState.detail.symbol),
        onSelect: async (item) => {
          this.detailViewState.comparisonSymbol = item.symbol;
          this.renderStockDetail(); // re-render with loading state
          try {
            const compareDetail = await apiService.getStockDetail(item.symbol);
            this.detailViewState.compareDetail = compareDetail;
            this.renderStockDetail();
          } catch (e) {
            this.showToast(`Failed to load ${item.symbol} for comparison.`, 'error');
            this.detailViewState.comparisonSymbol = null;
            this.detailViewState.compareDetail = null;
            this.renderStockDetail();
          }
        }
      });
    }

    const clearBtn = document.getElementById('clearCompareBtn');
    if (clearBtn) clearBtn.addEventListener('click', () => {
      this.detailViewState.comparisonSymbol = null;
      this.detailViewState.compareDetail = null;
      this.renderStockDetail();
    });
  }

  renderMiniChart(history) {
    const canvas = document.getElementById('detailMiniChart');
    if (!canvas || !history || !history.length || typeof Chart === 'undefined') return;
    const labels = history.map(h => new Date(h.Date).toLocaleDateString('en-IN', { month:'short', day:'numeric' }));
    const data = history.map(h => h.Close);
    const up = data[data.length - 1] >= data[0];
    new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels, datasets: [{
          data, borderColor: up ? '#16a34a' : '#dc2626',
          backgroundColor: up ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)',
          fill: true, tension: 0.2, pointRadius: 0, pointHoverRadius: 4, borderWidth: 2,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => '₹' + this._fmt(c.parsed.y) } } },
        scales: {
          x: { ticks: { maxTicksLimit: 6 } },
          y: { ticks: { callback: (v) => '₹' + Number(v).toLocaleString('en-IN') } }
        }
      }
    });

    // Comparison chart if applicable
    const compareCanvas = document.getElementById('compareChart');
    if (compareCanvas && this.detailViewState.compareDetail) {
      const a = history.map(h => h.Close);
      const b = this.detailViewState.compareDetail.history.map(h => h.Close);
      // Normalize both series to start at 100
      const normA = a.length ? a.map(v => (v / a[0]) * 100) : [];
      const normB = b.length ? b.map(v => (v / b[0]) * 100) : [];
      const len = Math.min(normA.length, normB.length);
      const cLabels = this.detailViewState.compareDetail.history.slice(0, len).map(h => new Date(h.Date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
      new Chart(compareCanvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: cLabels,
          datasets: [
            { label: this.detailViewState.detail.symbol, data: normA.slice(0, len), borderColor: '#2563eb', backgroundColor: 'transparent', borderWidth: 2, tension: 0.2, pointRadius: 0 },
            { label: this.detailViewState.compareDetail.symbol, data: normB.slice(0, len), borderColor: '#d97706', backgroundColor: 'transparent', borderWidth: 2, tension: 0.2, pointRadius: 0 },
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: true, position: 'top' }, tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.parsed.y.toFixed(2)}` } } },
          scales: { x: { ticks: { maxTicksLimit: 6 } }, y: { title: { display: true, text: 'Normalized (start=100)' } } }
        }
      });
    }
  }

  // ============================================
  // DASHBOARD
  // ============================================
  renderDashboardShell() {
    return `
      <div class="dashboard">
        <div class="dashboard-header">
          <h1 class="view-title">Market Dashboard</h1>
          <div class="dashboard-actions">
            <button class="btn btn-outline btn-sm" id="dashRefreshBtn">
              <i class="fas fa-sync-alt"></i> Refresh
            </button>
          </div>
        </div>
        <div id="dashboardSections"></div>
      </div>`;
  }

  renderDashboardSections() {
    const container = document.getElementById('dashboardSections');
    if (!container) return;
    const stocks = stateManager.get('stocks') || [];

    if (stocks.length === 0) {
      container.innerHTML = `
        <div class="card"><div class="card-body" style="text-align:center; padding: 3rem;">
          <i class="fas fa-cloud-rain" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
          <h3>No market data</h3>
          <p style="color: var(--text-secondary); margin-top: 0.5rem;">Backend hasn't responded yet. Hit Refresh in a moment.</p>
        </div></div>`;
      return;
    }

    const advancing = stocks.filter(s => s.change > 0).length;
    const declining = stocks.filter(s => s.change < 0).length;
    const unchanged = stocks.filter(s => s.change === 0).length;

    const gainers = [...stocks].filter(s => s.change > 0).sort((a, b) => b.change - a.change).slice(0, 5);
    const losers  = [...stocks].filter(s => s.change < 0).sort((a, b) => a.change - b.change).slice(0, 5);
    const turnover = [...stocks].sort((a, b) => (b.turnover || 0) - (a.turnover || 0)).slice(0, 5);
    const active   = [...stocks].sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 5);

    container.innerHTML = `
      <section class="dash-section">
        <div class="dash-section-header"><h2><i class="fas fa-globe-asia"></i> Market Summary</h2></div>
        <div class="summary-grid">
          ${this.renderIndexCards()}
          ${this.renderTotalsCards(stocks.length, advancing, declining, unchanged)}
        </div>
      </section>
      <div class="top-lists-grid">
        ${this.renderTopListCard('gainers', '📈 Top Gainers', gainers)}
        ${this.renderTopListCard('losers',  '📉 Top Losers',  losers)}
        ${this.renderTopListCard('turnover','💰 Top Turnover', turnover)}
        ${this.renderTopListCard('volume',  '🔥 Most Active', active)}
      </div>
    `;
  }

  renderIndexCards() {
    if (!this.indices?.length) {
      return `<div class="summary-card card"><div class="card-body"><div class="stat-label">Indices</div><div class="stat-value" style="color:var(--text-muted);font-size:1rem;">Loading…</div></div></div>`;
    }
    return this.indices.map(idx => {
      const positive = idx.change >= 0;
      const cls = positive ? 'positive' : 'negative';
      return `
        <div class="summary-card card row-clickable" data-symbol="${idx.symbol}">
          <div class="card-body">
            <div class="stat-label">${idx.symbol}</div>
            <div class="stat-value">${this._fmt(idx.ltp)}</div>
            <div class="stat-change ${cls}">${positive ? '▲' : '▼'} ${idx.changeAbs || ''} (${positive ? '+' : ''}${idx.change}%)</div>
          </div>
        </div>`;
    }).join('');
  }

  renderTotalsCards(total, advancing, declining, unchanged) {
    return `
      <div class="summary-card card">
        <div class="card-body">
          <div class="stat-label">Total Stocks</div>
          <div class="stat-value">${total}</div>
          <div class="stat-subline">
            <span class="positive">▲ ${advancing}</span>
            <span class="negative">▼ ${declining}</span>
            <span style="color:var(--text-muted)">● ${unchanged}</span>
          </div>
        </div>
      </div>`;
  }

  renderTopListCard(category, title, items) {
    const rows = items.map(s => {
      const cls = s.change >= 0 ? 'positive' : 'negative';
      return `
        <li class="mover-item" data-symbol="${s.symbol}">
          <div class="mover-info"><span class="mover-symbol">${s.symbol}</span></div>
          <div class="mover-price">
            <span class="price">₹${this._fmt(s.ltp)}</span>
            <span class="change ${cls}">${s.change >= 0 ? '+' : ''}${s.change}%</span>
          </div>
        </li>`;
    }).join('');
    return `
      <section class="card top-list-card">
        <div class="card-header top-list-header">
          <h3>${title}</h3>
          <button class="btn-link view-more-btn" data-category="${category}">View All →</button>
        </div>
        <ul class="top-list">${rows || `<li style="color:var(--text-muted);padding:1rem;">No data</li>`}</ul>
      </section>`;
  }

  attachDashboardEvents() {
    const refreshBtn = document.getElementById('dashRefreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', () => this.refreshData());
    document.querySelectorAll('.view-more-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.navigateTo('top-list', { category: e.currentTarget.dataset.category }));
    });
    document.querySelectorAll('.mover-item').forEach(item => {
      item.addEventListener('click', (e) => this.openStockDetail(e.currentTarget.dataset.symbol));
    });
    document.querySelectorAll('.summary-card.row-clickable').forEach(item => {
      item.addEventListener('click', (e) => this.openStockDetail(e.currentTarget.dataset.symbol));
    });
  }

  // ============================================
  // TOP LIST TABLE
  // ============================================
  renderTopListShell() {
    const titles = { gainers: '📈 Top Gainers', losers: '📉 Top Losers', turnover: '💰 Top Turnover', volume: '🔥 Most Active' };
    const category = this.tableViewState.category;
    return `
      <div class="dashboard">
        <div class="dashboard-header">
          <div>
            <button class="btn-link" id="topListBack">← Back to Dashboard</button>
            <h1 class="view-title">${titles[category] || category}</h1>
          </div>
          <div class="dashboard-actions">
            <div class="top-list-tabs">
              ${Object.entries(titles).map(([c, t]) => `<button class="tab-btn ${c === category ? 'active' : ''}" data-cat="${c}">${t}</button>`).join('')}
            </div>
          </div>
        </div>
        <div id="topListContent"></div>
      </div>`;
  }

  defaultSortKeyFor(category) {
    if (category === 'gainers' || category === 'losers') return 'change';
    if (category === 'turnover') return 'turnover';
    if (category === 'volume') return 'volume';
    return 'change';
  }

  renderTopListContent() {
    const container = document.getElementById('topListContent');
    if (!container || !this.tableViewState) return;
    const { category, sortKey, sortDir } = this.tableViewState;
    const stocks = stateManager.get('stocks') || [];

    let filtered;
    if (category === 'gainers') filtered = stocks.filter(s => s.change > 0);
    else if (category === 'losers') filtered = stocks.filter(s => s.change < 0);
    else filtered = [...stocks];

    filtered.sort((a, b) => sortDir === 'desc' ? (b[sortKey] ?? 0) - (a[sortKey] ?? 0) : (a[sortKey] ?? 0) - (b[sortKey] ?? 0));

    if (!filtered.length) {
      container.innerHTML = `<div class="card"><div class="card-body" style="padding:2rem;color:var(--text-muted);">No stocks in this category.</div></div>`;
      return;
    }

    const dirIcon = (k) => sortKey !== k ? '' : (sortDir === 'desc' ? ' ▼' : ' ▲');
    container.innerHTML = `
      <div class="card"><div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>#</th><th>Symbol</th>
            <th class="sortable" data-sort="ltp">Price${dirIcon('ltp')}</th>
            <th class="sortable" data-sort="changeAbs">Change${dirIcon('changeAbs')}</th>
            <th class="sortable" data-sort="change">% Change${dirIcon('change')}</th>
            <th class="sortable" data-sort="volume">Volume${dirIcon('volume')}</th>
            <th class="sortable" data-sort="turnover">Turnover${dirIcon('turnover')}</th>
          </tr></thead>
          <tbody>
            ${filtered.map((s, i) => {
              const cls = s.change >= 0 ? 'positive' : 'negative';
              return `<tr data-symbol="${s.symbol}" class="row-clickable">
                <td>${i + 1}</td>
                <td><strong>${s.symbol}</strong></td>
                <td>₹${this._fmt(s.ltp)}</td>
                <td class="${cls}">${s.changeAbs >= 0 ? '+' : ''}${this._fmt(s.changeAbs)}</td>
                <td class="${cls}">${s.change >= 0 ? '+' : ''}${s.change}%</td>
                <td>${this._fmtVol(s.volume)}</td>
                <td>₹${this._fmtVol(s.turnover)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div></div>`;
  }

  attachTopListEvents() {
    const back = document.getElementById('topListBack');
    if (back) back.addEventListener('click', () => this.navigateTo('dashboard'));

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cat = e.currentTarget.dataset.cat;
        this.tableViewState.category = cat;
        this.tableViewState.sortKey = this.defaultSortKeyFor(cat);
        this.tableViewState.sortDir = 'desc';
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
        const titles = { gainers: '📈 Top Gainers', losers: '📉 Top Losers', turnover: '💰 Top Turnover', volume: '🔥 Most Active' };
        const title = document.querySelector('.view-title');
        if (title) title.textContent = titles[cat];
        this.renderTopListContent();
        this.attachTopListEvents();
      });
    });

    document.querySelectorAll('.sortable').forEach(th => {
      th.addEventListener('click', (e) => {
        const key = e.currentTarget.dataset.sort;
        if (this.tableViewState.sortKey === key) {
          this.tableViewState.sortDir = this.tableViewState.sortDir === 'desc' ? 'asc' : 'desc';
        } else {
          this.tableViewState.sortKey = key;
          this.tableViewState.sortDir = 'desc';
        }
        this.renderTopListContent();
        this.attachTopListEvents();
      });
    });

    document.querySelectorAll('.row-clickable').forEach(row => {
      row.addEventListener('click', (e) => this.openStockDetail(e.currentTarget.dataset.symbol));
    });
  }

  // ============================================
  // MISC
  // ============================================
  renderComingSoon(view) {
    return `<div class="card"><div class="card-body" style="text-align:center; padding: 3rem;">
      <i class="fas fa-tools" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
      <h2>${this._titleCase(view)}</h2>
      <p style="color: var(--text-secondary);">This view is under construction.</p>
    </div></div>`;
  }

  _titleCase(s) { return (s || '').replace(/(^|\s)\S/g, t => t.toUpperCase()); }

  switchPanel(panel) {
    document.querySelectorAll('.panel-tab').forEach(t => t.classList.toggle('active', t.dataset.panel === panel));
    const content = document.getElementById('panelContent');
    if (!content) return;
    if (panel === 'watchlist') {
      const watchlist = stateManager.get('watchlist') || [];
      const stocks = stateManager.get('stocks') || [];
      content.innerHTML = watchlist.length === 0
        ? `<p style="color:var(--text-muted); padding: 1rem;">Watchlist is empty.</p>`
        : watchlist.map(sym => {
            const s = stocks.find(x => x.symbol === sym);
            if (!s) return `<div class="panel-item"><strong>${sym}</strong> <span style="color:var(--text-muted)">no data</span></div>`;
            const cls = s.change >= 0 ? 'positive' : 'negative';
            return `<div class="panel-item row-clickable" data-symbol="${s.symbol}"><strong>${s.symbol}</strong> <span>₹${s.ltp}</span> <span class="${cls}">${s.change >= 0 ? '+' : ''}${s.change}%</span></div>`;
          }).join('');
      content.querySelectorAll('.panel-item.row-clickable').forEach(el => {
        el.addEventListener('click', () => this.openStockDetail(el.dataset.symbol));
      });
    } else {
      content.innerHTML = `<p style="color:var(--text-muted); padding: 1rem;">${this._titleCase(panel)} panel coming soon.</p>`;
    }
  }

  openSettings() { this.showToast('Settings panel coming soon.', 'info'); }

  updateMarketStatus() {
    if (typeof CONFIG === 'undefined' || !CONFIG.market) return;
    const now = new Date();
    const [oh, om] = CONFIG.market.openTime.split(':').map(Number);
    const [ch, cm] = CONFIG.market.closeTime.split(':').map(Number);
    const open = new Date(now); open.setHours(oh, om, 0);
    const close = new Date(now); close.setHours(ch, cm, 0);
    const isWeekday = now.getDay() !== 0 && now.getDay() !== 6;
    const isOpen = isWeekday && now >= open && now <= close;
    const el = document.getElementById('marketStatus');
    if (!el) return;
    const ind = el.querySelector('.status-indicator');
    const txt = el.querySelector('.status-text');
    if (ind) ind.className = `status-indicator ${isOpen ? 'open' : 'closed'}`;
    if (txt) txt.textContent = isOpen ? 'Market Open' : 'Market Closed';
  }

  updateConnectionStatus(status) {
    const el = document.getElementById('connectionStatus');
    if (!el) return;
    const connected = status === 'connected';
    el.innerHTML = `<i class="fas fa-circle ${connected ? 'connected' : 'disconnected'}"></i> ${connected ? 'Connected' : 'Disconnected'}`;
  }

  updateBadges() {
    const watchlist = stateManager.get('watchlist') || [];
    const alerts = stateManager.get('alerts') || [];
    ['watchlistCount', 'sidebarWatchlistCount'].forEach(id => { const e = document.getElementById(id); if (e) e.textContent = watchlist.length; });
    ['alertsCount', 'sidebarAlertsCount'].forEach(id => { const e = document.getElementById(id); if (e) e.textContent = alerts.length; });
  }

  updateIndicesPanel() {
    const list = document.getElementById('indicesList');
    if (!list || !this.indices?.length) return;
    list.innerHTML = this.indices.map(idx => {
      const cls = idx.change >= 0 ? 'positive' : 'negative';
      return `
        <div class="index-item row-clickable" data-symbol="${idx.symbol}">
          <span class="index-name">${idx.symbol}</span>
          <span class="index-value ${cls}">${this._fmt(idx.ltp)}</span>
          <span class="index-change ${cls}">${idx.change >= 0 ? '+' : ''}${idx.change}%</span>
        </div>`;
    }).join('');
    list.querySelectorAll('.index-item.row-clickable').forEach(el => {
      el.addEventListener('click', () => this.openStockDetail(el.dataset.symbol));
    });
  }

  startPeriodicUpdates() {
    if (typeof CONFIG === 'undefined' || !CONFIG.market) return;
    setInterval(async () => {
      try {
        const [data, summary] = await Promise.all([
          apiService.getMarketWatch().catch(() => null),
          apiService.getMarketSummary().catch(() => null),
        ]);
        if (data?.data) {
          stateManager.set('stocks', data.data);
          if (typeof eventBus !== 'undefined') eventBus.emit(EventBus.Events.MARKET_DATA_UPDATED, data.data);
        }
        if (summary?.indices) { this.indices = summary.indices; this.updateIndicesPanel(); }
      } catch (_) {}
    }, CONFIG.market.refreshInterval || 30000);
    setInterval(() => this.updateMarketStatus(), 30000);
  }

  async refreshData() {
    this.showToast('Refreshing...', 'info');
    if (apiService?.clearCache) apiService.clearCache();
    await this.loadInitialData();
    const view = stateManager.get('activeView') || 'dashboard';
    if (view === 'dashboard') this.renderDashboardSections();
    else if (view === 'top-list') this.renderTopListContent();
    else if (view === 'stock-detail') await this.loadStockDetail();
    else await this.loadView(view);
    this.updateIndicesPanel();
    this.showToast('Data refreshed', 'success');
  }

  showLoading(show) {
    const el = document.getElementById('loadingOverlay');
    if (el) el.style.display = show ? 'flex' : 'none';
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? 'check-circle'
      : type === 'error' ? 'exclamation-circle'
      : type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    toast.innerHTML = `<i class="fas fa-${icon}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s, transform 0.3s';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  handleKeyboardShortcuts(event) {
    if (event.ctrlKey && event.key === 'k') {
      event.preventDefault();
      document.getElementById('globalSearch')?.focus();
    }
  }

  // Formatting helpers
  _fmt(n) {
    if (n == null || isNaN(n)) return '—';
    return Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  _fmtVol(n) {
    if (!n) return '—';
    n = Number(n);
    if (n >= 1e7) return (n / 1e7).toFixed(2) + ' Cr';
    if (n >= 1e5) return (n / 1e5).toFixed(2) + ' L';
    if (n >= 1e3) return (n / 1e3).toFixed(2) + ' K';
    return n.toString();
  }
  _fmtCrore(n) {
    if (!n) return '—';
    n = Number(n);
    if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2) + ' Cr';
    if (n >= 1e5) return '₹' + (n / 1e5).toFixed(2) + ' L';
    return '₹' + n.toLocaleString('en-IN');
  }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new DreamShareApp();
  window.app = app;
  app.initialize();
});
