const API_BASE_URL = 'https://dreamstock-backend.onrender.com';

class ApiService {
  constructor() {
    this.ws = null;
    this.wsCallbacks = [];
    this._cache = new Map();
    this._symbolLibrary = null;
    this.cacheTimeout = 30000; // 30 seconds default cache
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
        signal: options.signal || AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  // ==================== Market Data Methods ====================
  
  async getMarketWatch() { 
    return this.getAllStocks(1, 500); 
  }
  
  async getMarketSummary() { 
    return this.request('/market/summary'); 
  }
  
  async getTop(category, limit = 5) { 
    return this.request(`/stocks/top/${category}?limit=${limit}`); 
  }
  
  async getAllStocks(page = 1, limit = 50) { 
    return this.request(`/stocks/all?page=${page}&limit=${limit}`); 
  }
  
  async getStockDetail(symbol) { 
    return this.request(`/stocks/${encodeURIComponent(symbol)}/detail`); 
  }

  async getFundamentals(symbol) {
    return this.request(`/stocks/${encodeURIComponent(symbol)}/fundamentals`);
  }

  // ==================== Symbol Library (for autocomplete) ====================
  
  async getSymbolList() {
    if (this._symbolLibrary) return this._symbolLibrary;
    
    try {
      const res = await this.request('/stocks/symbols');
      this._symbolLibrary = (res && res.symbols) || [];
    } catch (e) {
      console.warn('Failed to fetch symbol list, using fallback');
      this._symbolLibrary = this._fallbackSymbols();
    }
    
    return this._symbolLibrary;
  }

  _fallbackSymbols() {
    return [
      { symbol: 'RELIANCE',   name: 'Reliance Industries Ltd.', sector: 'Energy' },
      { symbol: 'TCS',        name: 'Tata Consultancy Services Ltd.', sector: 'IT' },
      { symbol: 'HDFCBANK',   name: 'HDFC Bank Ltd.', sector: 'Banking' },
      { symbol: 'INFY',       name: 'Infosys Ltd.', sector: 'IT' },
      { symbol: 'ICICIBANK',  name: 'ICICI Bank Ltd.', sector: 'Banking' },
      { symbol: 'SBIN',       name: 'State Bank of India', sector: 'Banking' },
      { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', sector: 'Telecom' },
      { symbol: 'ITC',        name: 'ITC Ltd.', sector: 'FMCG' },
      { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd.', sector: 'FMCG' },
      { symbol: 'WIPRO',      name: 'Wipro Ltd.', sector: 'IT' },
      { symbol: 'KOTAKBANK',  name: 'Kotak Mahindra Bank Ltd.', sector: 'Banking' },
      { symbol: 'AXISBANK',   name: 'Axis Bank Ltd.', sector: 'Banking' },
      { symbol: 'LT',         name: 'Larsen & Toubro Ltd.', sector: 'Construction' },
      { symbol: 'SUNPHARMA',  name: 'Sun Pharmaceutical Industries Ltd.', sector: 'Pharma' },
      { symbol: 'MARUTI',     name: 'Maruti Suzuki India Ltd.', sector: 'Auto' },
      { symbol: 'TITAN',      name: 'Titan Company Ltd.', sector: 'Consumer' },
      { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd.', sector: 'Financial Services' },
      { symbol: 'NTPC',       name: 'NTPC Ltd.', sector: 'Energy' },
      { symbol: 'ADANIENT',   name: 'Adani Enterprises Ltd.', sector: 'Diversified' },
      { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', sector: 'Auto' },
      { symbol: 'M&M',        name: 'Mahindra & Mahindra Ltd.', sector: 'Auto' },
      { symbol: 'JSWSTEEL',   name: 'JSW Steel Ltd.', sector: 'Metal' },
      { symbol: 'TATASTEEL',  name: 'Tata Steel Ltd.', sector: 'Metal' },
      { symbol: 'HINDALCO',   name: 'Hindalco Industries Ltd.', sector: 'Metal' },
      { symbol: 'POWERGRID',  name: 'Power Grid Corporation of India Ltd.', sector: 'Energy' },
      { symbol: 'NESTLEIND',  name: 'Nestlé India Ltd.', sector: 'FMCG' },
      { symbol: 'ONGC',       name: 'Oil and Natural Gas Corporation Ltd.', sector: 'Energy' },
      { symbol: 'COALINDIA',  name: 'Coal India Ltd.', sector: 'Energy' },
      { symbol: 'BPCL',       name: 'Bharat Petroleum Corporation Ltd.', sector: 'Energy' },
      { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd.', sector: 'Cement' },
      { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd.', sector: 'Consumer' },
      { symbol: 'HCLTECH',    name: 'HCL Technologies Ltd.', sector: 'IT' },
      { symbol: 'TECHM',      name: 'Tech Mahindra Ltd.', sector: 'IT' },
      { symbol: 'DIVISLAB',   name: "Divi's Laboratories Ltd.", sector: 'Pharma' },
      { symbol: 'DRREDDY',    name: "Dr. Reddy's Laboratories Ltd.", sector: 'Pharma' },
      { symbol: 'CIPLA',      name: 'Cipla Ltd.', sector: 'Pharma' },
      { symbol: 'GRASIM',     name: 'Grasim Industries Ltd.', sector: 'Diversified' },
      { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd.', sector: 'Financial Services' },
      { symbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd.', sector: 'Banking' },
      { symbol: 'SBILIFE',    name: 'SBI Life Insurance Company Ltd.', sector: 'Insurance' },
      { symbol: 'ADANIPORTS', name: 'Adani Ports and Special Economic Zone Ltd.', sector: 'Infrastructure' },
      { symbol: 'ADANIPOWER', name: 'Adani Power Ltd.', sector: 'Energy' },
      { symbol: 'LICI',       name: 'Life Insurance Corporation of India', sector: 'Insurance' },
      { symbol: 'BRITANNIA',  name: 'Britannia Industries Ltd.', sector: 'FMCG' },
      { symbol: 'EICHERMOT',  name: 'Eicher Motors Ltd.', sector: 'Auto' },
      { symbol: 'DABUR',      name: 'Dabur India Ltd.', sector: 'FMCG' },
      { symbol: 'BIOCON',     name: 'Biocon Ltd.', sector: 'Pharma' },
      { symbol: 'HAVELLS',    name: 'Havells India Ltd.', sector: 'Consumer' },
      { symbol: 'PIDILITIND', name: 'Pidilite Industries Ltd.', sector: 'Chemicals' },
      { symbol: 'NIFTY 50',   name: 'NIFTY 50 Index', isIndex: true },
      { symbol: 'SENSEX',     name: 'BSE SENSEX', isIndex: true },
      { symbol: 'BANK NIFTY', name: 'Bank Nifty', isIndex: true },
    ];
  }

  // ==================== Historical Data Methods ====================
  
  // Timeframe mapping for API
  static TIMEFRAME_MAP = {
    '1d':  { period: '1d',  interval: '5m',  label: '1 Day' },
    '5d':  { period: '5d',  interval: '15m', label: '5 Days' },
    '1mo': { period: '1mo', interval: '1h',  label: '1 Month' },
    '3mo': { period: '3mo', interval: '1d',  label: '3 Months' },
    '6mo': { period: '6mo', interval: '1d',  label: '6 Months' },
    '1y':  { period: '1y',  interval: '1d',  label: '1 Year' },
    '2y':  { period: '2y',  interval: '1wk', label: '2 Years' },
    '5y':  { period: '5y',  interval: '1wk', label: '5 Years' },
    'max': { period: 'max', interval: '1mo', label: 'Max' },
  };

  /**
   * Get historical OHLCV data for a symbol
   * @param {string} symbol - Stock symbol (e.g., 'RELIANCE')
   * @param {object} params - { range: '1d'|'5d'|'1mo'|'3mo'|'6mo'|'1y'|'2y'|'5y'|'max' }
   * @returns {Promise<Array>} Array of { timestamp, open, high, low, close, volume }
   */
  async getHistoricalData(symbol, params = {}) {
    const range = params.range || '6mo';
    const rangeConfig = ApiService.TIMEFRAME_MAP[range] || ApiService.TIMEFRAME_MAP['6mo'];
    const cacheKey = `historical-${symbol}-${range}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log(`📦 Using cached historical data for ${symbol} (${range})`);
      return cached;
    }
    
    try {
      // Try to fetch from API
      console.log(`🔄 Fetching historical data for ${symbol} (${range})`);
      
      const data = await this.request(
        `/stocks/${encodeURIComponent(symbol)}/historical?` +
        `period=${rangeConfig.period}&interval=${rangeConfig.interval}`
      );
      
      if (data && Array.isArray(data)) {
        const transformed = this.transformHistoricalData(data);
        this.setCache(cacheKey, transformed, 300000); // Cache for 5 minutes
        return transformed;
      }
    } catch (error) {
      console.warn(`API historical data failed for ${symbol}, generating mock data:`, error.message);
    }
    
    // Fallback to mock data
    const mockData = this.generateMockHistoricalData(symbol, rangeConfig);
    this.setCache(cacheKey, mockData, 60000); // Cache mock data for 1 minute
    return mockData;
  }

  /**
   * Transform API response to standardized format
   */
  transformHistoricalData(data) {
    if (!Array.isArray(data)) return [];
    
    return data.map(item => ({
      timestamp: item.timestamp || item.date || item.time,
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: parseInt(item.volume) || 0,
    })).filter(item => 
      !isNaN(item.open) && !isNaN(item.close) && item.timestamp
    );
  }

  /**
   * Generate realistic mock historical data for testing
   */
  generateMockHistoricalData(symbol, rangeConfig) {
    const basePrices = {
      'RELIANCE': 2850, 'TCS': 3950, 'HDFCBANK': 1650, 'INFY': 1450,
      'ICICIBANK': 1120, 'SBIN': 620, 'BHARTIARTL': 980, 'ITC': 450,
      'HINDUNILVR': 2450, 'WIPRO': 480, 'KOTAKBANK': 1780, 'AXISBANK': 1050,
      'LT': 3400, 'SUNPHARMA': 1120, 'MARUTI': 10500, 'TITAN': 3200,
      'BAJFINANCE': 7200, 'NTPC': 310, 'ADANIENT': 3200, 'TATAMOTORS': 950,
      'NIFTY 50': 22000, 'SENSEX': 72000, 'BANK NIFTY': 48000,
    };
    
    const basePrice = basePrices[symbol] || 1500;
    const data = [];
    
    // Calculate number of candles based on range
    let numCandles = 100;
    let timeIncrement = 3600000; // 1 hour in ms
    
    switch(rangeConfig.interval) {
      case '1m':  numCandles = 390; timeIncrement = 60000; break;      // 1 day of 1-min
      case '5m':  numCandles = 78;  timeIncrement = 300000; break;      // 1 day of 5-min
      case '15m': numCandles = 130; timeIncrement = 900000; break;      // ~5 days
      case '30m': numCandles = 130; timeIncrement = 1800000; break;     // ~5 days
      case '1h':  numCandles = 163; timeIncrement = 3600000; break;     // ~1 month
      case '4h':  numCandles = 180; timeIncrement = 14400000; break;    // ~1 month
      case '1d':  numCandles = 100; timeIncrement = 86400000; break;    // 3-6 months
      case '1wk': numCandles = 104; timeIncrement = 604800000; break;   // 2 years
      case '1mo': numCandles = 60;  timeIncrement = 2592000000; break;  // 5 years
    }
    
    // Generate realistic price movement
    let price = basePrice;
    let trend = (Math.random() - 0.5) * 0.02; // Random initial trend
    let volatility = basePrice * 0.015; // 1.5% daily volatility
    
    for (let i = numCandles; i >= 0; i--) {
      // Random walk with mean reversion
      trend = trend * 0.95 + (Math.random() - 0.5) * 0.01;
      const change = trend * price + (Math.random() - 0.5) * volatility;
      
      const open = price;
      const close = price + change;
      
      // Ensure high/low make sense
      const intradayRange = Math.abs(change) + Math.random() * volatility * 0.3;
      const high = Math.max(open, close) + Math.random() * intradayRange * 0.5;
      const low = Math.min(open, close) - Math.random() * intradayRange * 0.5;
      
      // Volume correlates with volatility
      const volumeBase = 500000;
      const volumeSpike = Math.abs(change) / volatility * 1000000;
      const volume = Math.floor(volumeBase + volumeSpike + Math.random() * 500000);
      
      data.push({
        timestamp: new Date(Date.now() - i * timeIncrement).toISOString(),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: volume,
      });
      
      price = close;
    }
    
    return data;
  }

  // ==================== Market Depth (Simulated) ====================
  
  async getMarketDepth(symbol) {
    try {
      const detail = await this.getStockDetail(symbol);
      const ltp = (detail && detail.snapshot && detail.snapshot.ltp) || 0;
      
      if (!ltp) return null;
      
      // Generate realistic bid/ask spread
      const spreadPercent = ltp >= 1000 ? 0.0005 : ltp >= 100 ? 0.001 : 0.002;
      const tick = Math.max(ltp * spreadPercent, 0.05);
      
      const bids = [];
      const asks = [];
      
      for (let i = 1; i <= 5; i++) {
        const spread = tick * i * (1 + Math.random() * 0.5);
        const bidPrice = parseFloat((ltp - spread).toFixed(2));
        const askPrice = parseFloat((ltp + spread).toFixed(2));
        
        bids.push({
          price: bidPrice,
          qty: Math.floor(50 + Math.random() * 500) * 10,
          orders: Math.floor(1 + Math.random() * 8),
        });
        
        asks.push({
          price: askPrice,
          qty: Math.floor(50 + Math.random() * 500) * 10,
          orders: Math.floor(1 + Math.random() * 8),
        });
      }
      
      return {
        symbol,
        ltp,
        bids,
        asks,
        bidTotal: bids.reduce((sum, b) => sum + b.qty, 0),
        askTotal: asks.reduce((sum, a) => sum + a.qty, 0),
        spread: parseFloat((asks[0].price - bids[0].price).toFixed(2)),
        simulated: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to get market depth:', error);
      return null;
    }
  }

  // ==================== Cache Methods ====================
  
  getFromCache(key) {
    const item = this._cache.get(key);
    if (item && Date.now() - item.timestamp < item.ttl) {
      return item.data;
    }
    if (item) {
      this._cache.delete(key);
    }
    return null;
  }

  setCache(key, data, ttl = this.cacheTimeout) {
    this._cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  clearCache() { 
    this._cache.clear(); 
    this._symbolLibrary = null;
    console.log('🗑️ API cache cleared');
  }

  // ==================== WebSocket Methods ====================
  
  _wsUrl() {
    try {
      const u = new URL(API_BASE_URL);
      const proto = u.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${proto}//${u.host}/ws`;
    } catch (_) {
      return 'wss://dreamstock-backend.onrender.com/ws';
    }
  }

  connectWebSocket(onMessageCallback) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    
    try {
      this.ws = new WebSocket(this._wsUrl());
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'MARKET_UPDATE' && data.data) {
            const quotes = {};
            Object.keys(data.data).forEach(t => {
              const s = data.data[t];
              quotes[s.symbol] = s;
            });
            
            if (onMessageCallback) {
              onMessageCallback(quotes);
            }
            
            // Also notify all subscribers
            this.wsCallbacks.forEach(cb => {
              try {
                cb(quotes);
              } catch (e) {
                console.error('WebSocket callback error:', e);
              }
            });
          }
        } catch (e) {
          console.error('WebSocket message parse error:', e);
        }
      };
      
      this.ws.onerror = (err) => {
        console.error('WebSocket error:', err);
      };
      
      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected, reconnecting in 5s...');
        setTimeout(() => {
          this.connectWebSocket(onMessageCallback);
        }, 5000);
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  }

  subscribeToQuotes(callback) {
    this.wsCallbacks.push(callback);
    
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connectWebSocket((quotes) => {
        this.wsCallbacks.forEach(cb => {
          try {
            cb(quotes);
          } catch (e) {
            console.error('WebSocket callback error:', e);
          }
        });
      });
    }
  }

  unsubscribeFromQuotes(callback) {
    this.wsCallbacks = this.wsCallbacks.filter(cb => cb !== callback);
  }

  disconnectWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.wsCallbacks = [];
  }
}

// Create and expose singleton instance
const apiService = new ApiService();
window.apiService = apiService;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ApiService, apiService };
}
