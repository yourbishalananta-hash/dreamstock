// ============================================================
// AUTOCOMPLETE — reusable, attaches to any text input
// ============================================================
class Autocomplete {
  /**
   * @param {HTMLInputElement} input
   * @param {Object} opts
   * @param {() => Array} opts.getSource - returns array of {symbol, name, ltp?, change?}
   * @param {(item) => void} opts.onSelect
   * @param {string} [opts.placeholder]
   */
  constructor(input, opts) {
    if (!input) return;
    this.input = input;
    this.getSource = opts.getSource;
    this.onSelect = opts.onSelect || (() => {});
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'autocomplete-dropdown';
    this.activeIndex = -1;
    this.matches = [];

    // Position dropdown relative to input
    const wrap = document.createElement('div');
    wrap.className = 'autocomplete-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    wrap.appendChild(this.dropdown);

    input.setAttribute('autocomplete', 'off');
    input.setAttribute('spellcheck', 'false');

    input.addEventListener('input', this.onInput.bind(this));
    input.addEventListener('focus', this.onInput.bind(this));
    input.addEventListener('keydown', this.onKey.bind(this));
    input.addEventListener('blur', () => setTimeout(() => this.hide(), 150));
  }

  onInput() {
    const q = (this.input.value || '').trim().toLowerCase();
    const source = this.getSource() || [];
    if (q.length === 0) {
      // Show top 8 by name on empty focus
      this.matches = source.slice(0, 8);
    } else {
      this.matches = source.filter(s => {
        const sym = (s.symbol || '').toLowerCase();
        const name = (s.name || '').toLowerCase();
        return sym.includes(q) || name.includes(q);
      }).slice(0, 12);
    }
    this.activeIndex = -1;
    this.render();
  }

  render() {
    if (!this.matches.length) {
      this.dropdown.innerHTML = `<div class="ac-empty">No matches</div>`;
      this.show();
      return;
    }
    this.dropdown.innerHTML = this.matches.map((item, i) => {
      const isIdx = item.isIndex ? '<span class="ac-tag">INDEX</span>' : '';
      const price = (item.ltp != null) ? `<span class="ac-price">₹${Number(item.ltp).toLocaleString('en-IN', {minimumFractionDigits:2})}</span>` : '';
      const chg = (item.change != null)
        ? `<span class="ac-change ${item.change >= 0 ? 'positive' : 'negative'}">${item.change >= 0 ? '+' : ''}${item.change}%</span>`
        : '';
      return `
        <div class="ac-item ${i === this.activeIndex ? 'active' : ''}" data-idx="${i}">
          <div class="ac-left">
            <span class="ac-sym">${item.symbol}</span>
            ${isIdx}
            <span class="ac-name">${item.name || ''}</span>
          </div>
          <div class="ac-right">${price}${chg}</div>
        </div>`;
    }).join('');

    this.dropdown.querySelectorAll('.ac-item').forEach(el => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault(); // stop blur before click
        this.select(parseInt(el.dataset.idx, 10));
      });
    });
    this.show();
  }

  onKey(e) {
    if (!this.matches.length || !this.dropdown.classList.contains('open')) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.activeIndex = (this.activeIndex + 1) % this.matches.length;
      this.render();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.activeIndex = (this.activeIndex - 1 + this.matches.length) % this.matches.length;
      this.render();
    } else if (e.key === 'Enter') {
      if (this.activeIndex >= 0) {
        e.preventDefault();
        this.select(this.activeIndex);
      }
    } else if (e.key === 'Escape') {
      this.hide();
    }
  }

  select(i) {
    const item = this.matches[i];
    if (!item) return;
    this.input.value = item.symbol;
    this.onSelect(item);
    this.hide();
  }

  show() { this.dropdown.classList.add('open'); }
  hide() { this.dropdown.classList.remove('open'); }
}

// Expose globally so other components can use it
window.Autocomplete = Autocomplete;