// ============================================
// MARKETPULSE PRO - FORMATTERS
// ============================================

class Formatters {
  static currency(value, decimals = 2, symbol = '₹') {
    if (value == null || isNaN(value)) return '--';
    const num = Number(value);
    const formatted = Math.abs(num).toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return num < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
  }

  static compactCurrency(value, symbol = '₹') {
    if (value == null || isNaN(value)) return '--';
    const num = Number(value);
    const abs = Math.abs(num);
    let formatted;
    if (abs >= 1e7) formatted = (abs / 1e7).toFixed(2) + ' Cr';
    else if (abs >= 1e5) formatted = (abs / 1e5).toFixed(2) + ' L';
    else formatted = abs.toLocaleString('en-IN', { maximumFractionDigits: 2 });
    return num < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
  }

  static percentage(value, decimals = 2, showSign = true) {
    if (value == null || isNaN(value)) return '--';
    const num = Number(value).toFixed(decimals);
    return showSign && num > 0 ? `+${num}%` : `${num}%`;
  }

  static change(value, decimals = 2) {
    if (value == null || isNaN(value)) return { text: '--', class: '' };
    const num = Number(value);
    const text = num > 0 ? `+${num.toFixed(decimals)}` : num.toFixed(decimals);
    const cls = num > 0 ? 'positive' : num < 0 ? 'negative' : 'neutral';
    return { text, class: cls };
  }

  static volume(value) {
    if (value == null || isNaN(value)) return '--';
    const num = Number(value);
    if (num >= 1e7) return (num / 1e7).toFixed(2) + ' Cr';
    if (num >= 1e5) return (num / 1e5).toFixed(2) + ' L';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + ' K';
    return num.toString();
  }

  static date(dateInput, format = 'short') {
    if (!dateInput) return '--';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '--';

    switch (format) {
      case 'time':
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      case 'date':
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      case 'datetime':
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      case 'relative': {
        const now = Date.now();
        const diff = now - d.getTime();
        const seconds = Math.floor(diff / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return Formatters.date(dateInput, 'date');
      }
      case 'short':
      default:
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
          + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
  }

  static marketCap(value) {
    if (value == null || isNaN(value)) return '--';
    const num = Number(value);
    if (num >= 1e12) return '₹' + (num / 1e12).toFixed(2) + ' Lakh Cr';
    if (num >= 1e7) return '₹' + (num / 1e7).toFixed(2) + ' Cr';
    if (num >= 1e5) return '₹' + (num / 1e5).toFixed(2) + ' L';
    return '₹' + num.toLocaleString('en-IN');
  }

  static number(value, decimals = 0) {
    if (value == null || isNaN(value)) return '--';
    return Number(value).toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
}