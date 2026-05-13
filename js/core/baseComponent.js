// ============================================
// DREAM SHARE - BASE COMPONENT (optional foundation)
// ============================================
// None of the current components extend this — each component
// stands on its own. BaseComponent is here as scaffolding for any
// future component that wants a shared constructor + lifecycle hooks.

class BaseComponent {
  constructor(containerId, stateManager, apiService) {
    this.container = containerId ? document.getElementById(containerId) : null;
    this.stateManager = stateManager;
    this.apiService = apiService;
  }

  render() {
    // Override in subclasses
  }

  destroy() {
    // Override to clean up timers, listeners, etc.
  }
}

window.BaseComponent = BaseComponent;