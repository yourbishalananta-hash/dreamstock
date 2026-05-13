// ============================================================
// NEWS COMPONENT (stub — integration coming later)
// ============================================================
class NewsComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-newspaper"></i> Market News</h3>
        </div>
        <div class="card-body" style="padding:2rem;">
          <p style="color:var(--text-secondary)">News integration is coming soon.</p>
        </div>
      </div>`;
  }
}