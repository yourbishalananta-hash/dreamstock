// ============================================
// DREAM SHARE - EVENT BUS
// ============================================

class EventBus {
  constructor() {
    this.events = {};
  }
  
  /**
   * Subscribe to an event
   * @param {string} event - Event name from EventBus.Events
   * @param {Function} callback - Function to call when event is emitted
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }
  
  /**
   * Subscribe to an event once (auto-unsubscribes after first call)
   * @param {string} event - Event name from EventBus.Events
   * @param {Function} callback - Function to call when event is emitted
   * @returns {Function} Unsubscribe function
   */
  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }
  
  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - The callback to remove
   */
  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
    
    // Clean up empty event arrays
    if (this.events[event].length === 0) {
      delete this.events[event];
    }
  }
  
  /**
   * Emit an event with data
   * @param {string} event - Event name from EventBus.Events
   * @param {*} data - Data to pass to callbacks
   */
  emit(event, data) {
    if (!this.events[event]) return;
    
    // Create a copy of the listeners array to avoid issues if listeners are removed during emission
    const listeners = [...this.events[event]];
    
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for "${event}":`, error);
        // Emit error event (but don't cause infinite loop)
        if (event !== EventBus.Events.ERROR_OCCURRED) {
          this.emit(EventBus.Events.ERROR_OCCURRED, {
            source: event,
            error: error,
            message: `Error in "${event}" handler: ${error.message}`
          });
        }
      }
    });
  }
  
  /**
   * Remove all listeners for a specific event
   * @param {string} event - Event name
   */
  removeAllListeners(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
  
  /**
   * Get the number of listeners for an event
   * @param {string} event - Event name
   * @returns {number} Number of listeners
   */
  listenerCount(event) {
    return this.events[event] ? this.events[event].length : 0;
  }
  
  /**
   * Get all registered event names
   * @returns {string[]} Array of event names
   */
  eventNames() {
    return Object.keys(this.events);
  }
  
  /**
   * Check if an event has listeners
   * @param {string} event - Event name
   * @returns {boolean}
   */
  hasListeners(event) {
    return this.listenerCount(event) > 0;
  }
}

// ============================================
// EVENT CONSTANTS
// ============================================

EventBus.Events = {
  // Market Data Events
  MARKET_DATA_LOADED: 'market:dataLoaded',
  MARKET_DATA_UPDATED: 'market:dataUpdated',
  MARKET_DATA_ERROR: 'market:dataError',
  
  // Stock Events
  STOCK_SELECTED: 'stock:selected',
  STOCK_DESELECTED: 'stock:deselected',
  
  // View Events
  VIEW_CHANGED: 'view:changed',
  VIEW_REFRESHED: 'view:refreshed',
  
  // Connection Events
  CONNECTION_CHANGED: 'connection:changed',
  CONNECTION_RECONNECTING: 'connection:reconnecting',
  CONNECTION_FAILED: 'connection:failed',
  
  // Theme Events
  THEME_CHANGED: 'theme:changed',
  
  // User Events
  WATCHLIST_UPDATED: 'watchlist:updated',
  SETTINGS_CHANGED: 'settings:changed',
  
  // Error Events
  ERROR_OCCURRED: 'error:occurred',
  
  // WebSocket Events
  WS_MESSAGE_RECEIVED: 'ws:messageReceived',
  WS_RECONNECTING: 'ws:reconnecting',
};

// ============================================
// CREATE GLOBAL INSTANCE
// ============================================

const eventBus = new EventBus();

// ============================================
// DEBUGGING HELPERS (Optional - remove in production)
// ============================================

// Log all events to console (useful for debugging)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  const originalEmit = eventBus.emit.bind(eventBus);
  eventBus.emit = function(event, data) {
    console.log(`🔔 Event: ${event}`, data);
    originalEmit(event, data);
  };
  
  // Expose for debugging
  window.__eventBus = eventBus;
  window.__EventBusEvents = EventBus.Events;
}
