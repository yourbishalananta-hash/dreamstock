// ============================================================
// ALERTS COMPONENT (stub — creation UI coming later)
// ============================================================
class AlertsComponent {
  constructor(containerId, stateManager) {
    this.container = document.getElementById(containerId);
    this.stateManager = stateManager;
  }

  render() {
    if (!this.container) return;
    const alerts = this.stateManager?.get('alerts') || [];
    this.container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-bell"></i> Price Alerts</h3>
        </div>
        <div class="card-body" style="padding:2rem;">
          ${alerts.length === 0
            ? '<p style="color:var(--text-secondary);">Alert creation is coming soon.</p>'
            : `<p style="color:var(--text-secondary);">You have ${alerts.length} saved alert(s).</p>`}
        </div>
      </div>`;
  }
}