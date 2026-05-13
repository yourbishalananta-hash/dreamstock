// ============================================
// DREAM SHARE - STATE MANAGER
// ============================================

class StateManager {
  constructor() {
    this.state = {
      stocks: [],
      activeView: 'dashboard',
      activeSymbol: null,
      theme: localStorage.getItem(CONFIG.storage.theme) || 'light',
      isConnected: false,
      lastUpdate: null,
      watchlist: JSON.parse(localStorage.getItem(CONFIG.storage.watchlist) || '[]'),
    };
    
    this.listeners = {};
    this.applyTheme();
  }
  
  get(key) {
    return this.state[key];
  }
  
  set(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    
    // Notify listeners
    if (this.listeners[key]) {
      this.listeners[key].forEach(cb => cb(value, oldValue));
    }
    
    // Auto-save to localStorage for persistent data
    if (key === 'watchlist') {
      localStorage.setItem(CONFIG.storage.watchlist, JSON.stringify(value));
    }
    if (key === 'theme') {
      localStorage.setItem(CONFIG.storage.theme, value);
    }
  }
  
  subscribe(key, callback) {
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }
    this.listeners[key].push(callback);
    
    return () => {
      this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
    };
  }
  
  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.state.theme);
  }
  
  toggleTheme() {
    const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
    this.set('theme', newTheme);
    this.applyTheme();
    eventBus.emit(EVENTS.THEME_CHANGED, newTheme);
  }
  
  addToWatchlist(symbol) {
    const watchlist = this.get('watchlist');
    if (!watchlist.includes(symbol)) {
      watchlist.push(symbol);
      this.set('watchlist', watchlist);
    }
  }
  
  removeFromWatchlist(symbol) {
    const watchlist = this.get('watchlist');
    this.set('watchlist', watchlist.filter(s => s !== symbol));
  }
  
  isInWatchlist(symbol) {
    return this.get('watchlist').includes(symbol);
  }
}

// Create global instance
const stateManager = new StateManager();
