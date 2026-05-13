import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "https://dabc1f06d1123664aa0354753f424030@o4511383434952704.ingest.de.sentry.io/4511383445635152",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true
});
myUndefinedFunction();
// ============================================
// DREAM SHARE - CONFIGURATION
// ============================================

const CONFIG = {
  // API Configuration
  api: {
    baseURL: 'https://dreamstock-backend.onrender.com',
    timeout: 30000,                    // 30 seconds
    retryAttempts: 3,
    retryDelay: 2000,                  // Added: delay between retries in ms
  },
  
  // WebSocket Configuration
  websocket: {
    url: 'wss://dreamstock-backend.onrender.com/ws',
    reconnectInterval: 5000,           // 5 seconds between reconnection attempts
    maxReconnectAttempts: 10,          // Try 10 times before giving up
    pingInterval: 30000,               // Added: keep-alive ping every 30 seconds
  },
  
  // Market Configuration
  market: {
    openTime: '09:15',                 // Indian market opens at 9:15 AM IST
    closeTime: '15:30',                // Indian market closes at 3:30 PM IST
    refreshInterval: 60000,            // Refresh data every 60 seconds
    indices: ['NIFTY 50', 'SENSEX', 'BANK NIFTY'],  // Added: tracked indices
  },
  
  // Local Storage Keys
  storage: {
    watchlist: 'mp_watchlist',
    theme: 'mp_theme',
    settings: 'mp_settings',
    portfolio: 'mp_portfolio',         // Added: portfolio storage
    alerts: 'mp_alerts',               // Added: alerts storage
  },
  
  // Feature Flags
  features: {
    realTimeUpdates: true,             // Enable WebSocket real-time data
    notifications: true,               // Enable toast notifications
    darkMode: true,                    // Added: allow dark mode toggle
    animations: true,                  // Added: enable UI animations
    debugMode: false,                  // Added: toggle debug logging
  },
  
  // UI Configuration
  ui: {
    maxSearchResults: 10,              // Max items in search dropdown
    toastDuration: 3000,               // Toast notification duration in ms
    chartColors: {                     // Added: chart color scheme
      up: '#10b981',
      down: '#ef4444',
      volume: '#3b82f6',
      grid: '#e2e8f0',
    },
  },
};

// Freeze to prevent accidental modifications
Object.freeze(CONFIG);

// Log configuration in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('📋 Configuration loaded:', CONFIG);
}
