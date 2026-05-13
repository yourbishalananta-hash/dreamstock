// ============================================
// DREAM SHARE - WEBSOCKET SERVICE
// ============================================
class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.shouldReconnect = true;
    this.reconnectTimer = null;
  }

  connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return; // Already connected/connecting
    }

    console.log('🔌 Connecting to WebSocket...');
    try {
      this.socket = new WebSocket(CONFIG.websocket.url);
    } catch (e) {
      console.warn('WebSocket constructor failed:', e.message);
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      console.log('✅ WebSocket Connected');
      this.reconnectAttempts = 0;
      eventBus.emit(EventBus.Events.CONNECTION_CHANGED, 'connected');
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.data) {
          // Backend sends `data.data` as an object keyed by ticker
          // (e.g. {"RELIANCE.NS": {...}, "TCS.NS": {...}}). The rest of
          // the app expects an array, so normalize here.
          const stocksArray = Array.isArray(data.data)
            ? data.data
            : Object.values(data.data);
          stateManager.set('stocks', stocksArray);
          eventBus.emit(EventBus.Events.MARKET_DATA_UPDATED, stocksArray);
        }
      } catch (e) {
        console.error('WS Message Error:', e);
      }
    };

    this.socket.onclose = () => {
      eventBus.emit(EventBus.Events.CONNECTION_CHANGED, 'disconnected');
      if (this.shouldReconnect) this.scheduleReconnect();
    };

    this.socket.onerror = (error) => {
      // Don't call close() here — onclose will fire automatically on errors.
      console.warn('WebSocket error (will attempt reconnect):', error.message || 'connection failed');
    };
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    if (this.reconnectAttempts >= CONFIG.websocket.maxReconnectAttempts) {
      console.warn(`🚫 Max reconnect attempts (${CONFIG.websocket.maxReconnectAttempts}) reached. Giving up.`);
      return;
    }
    this.reconnectAttempts++;
    const delay = Math.min(
      CONFIG.websocket.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1),
      60000
    );
    console.log(`🔄 Reconnect attempt ${this.reconnectAttempts} in ${Math.round(delay / 1000)}s...`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      try { this.socket.close(); } catch (_) {}
    }
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }
}

const webSocketService = new WebSocketService();
window.webSocketService = webSocketService;
