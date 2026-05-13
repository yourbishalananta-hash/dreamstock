// Options Chain Analysis Component
class OptionsChainComponent extends BaseComponent {
    constructor(containerId) {
        super(containerId);
        this.state = {
            symbol: '',
            expirationDates: [],
            selectedDate: '',
            options: { calls: [], puts: [] },
            greeks: true,
            loading: false
        };
    }

    async init() {
        this.render();
        this.attachEventListeners();
        eventBus.on('symbol:selected', this.loadOptionsChain.bind(this));
    }

    render() {
        this.container.innerHTML = `
            <div class="options-chain-container">
                <div class="options-header">
                    <h3>Options Chain</h3>
                    <div class="options-controls">
                        <select id="expiration-select" class="form-select">
                            <option value="">Select Expiration</option>
                        </select>
                        <label class="greeks-toggle">
                            <input type="checkbox" id="show-greeks" checked>
                            Show Greeks
                        </label>
                        <select id="option-type-filter" class="form-select">
                            <option value="all">All</option>
                            <option value="itm">In The Money</option>
                            <option value="otm">Out The Money</option>
                        </select>
                    </div>
                </div>
                <div class="options-tables">
                    <div class="calls-section">
                        <h4>CALLS</h4>
                        <div class="options-table-container" id="calls-table"></div>
                    </div>
                    <div class="puts-section">
                        <h4>PUTS</h4>
                        <div class="options-table-container" id="puts-table"></div>
                    </div>
                </div>
                <div class="options-analytics">
                    <div class="analytics-card">
                        <h5>Put/Call Ratio</h5>
                        <span id="put-call-ratio">-</span>
                    </div>
                    <div class="analytics-card">
                        <h5>Max Pain</h5>
                        <span id="max-pain">-</span>
                    </div>
                    <div class="analytics-card">
                        <h5>Implied Volatility</h5>
                        <span id="implied-volatility">-</span>
                    </div>
                </div>
            </div>
        `;
    }

    async loadOptionsChain(symbol) {
        this.state.symbol = symbol;
        this.state.loading = true;
        
        try {
            const response = await apiService.getOptionsChain(symbol);
            this.state.expirationDates = response.expirationDates;
            this.populateExpirationDates();
            
            if (response.expirationDates.length > 0) {
                await this.loadOptionsForDate(response.expirationDates[0]);
            }
        } catch (error) {
            console.error('Error loading options chain:', error);
        } finally {
            this.state.loading = false;
        }
    }

    async loadOptionsForDate(expirationDate) {
        const response = await apiService.getOptionsData(this.state.symbol, expirationDate);
        this.state.options = response;
        this.renderOptionsTables();
        this.calculateAnalytics();
    }

    renderOptionsTables() {
        const callsTable = this.generateOptionsTable(this.state.options.calls, 'call');
        const putsTable = this.generateOptionsTable(this.state.options.puts, 'put');
        
        document.getElementById('calls-table').innerHTML = callsTable;
        document.getElementById('puts-table').innerHTML = putsTable;
    }

    generateOptionsTable(options, type) {
        const headers = ['Strike', 'Last', 'Bid', 'Ask', 'Volume', 'Open Int'];
        if (this.state.greeks) {
            headers.push('Delta', 'Gamma', 'Theta', 'Vega', 'IV');
        }

        let tableHTML = `
            <table class="options-table">
                <thead>
                    <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
        `;

        options.forEach(option => {
            const rowClass = this.getOptionRowClass(option);
            tableHTML += `
                <tr class="${rowClass}">
                    <td>${formatters.formatCurrency(option.strike)}</td>
                    <td>${formatters.formatCurrency(option.last)}</td>
                    <td>${formatters.formatCurrency(option.bid)}</td>
                    <td>${formatters.formatCurrency(option.ask)}</td>
                    <td>${formatters.formatNumber(option.volume)}</td>
                    <td>${formatters.formatNumber(option.openInterest)}</td>
                    ${this.state.greeks ? `
                        <td>${option.delta?.toFixed(4) || '-'}</td>
                        <td>${option.gamma?.toFixed(4) || '-'}</td>
                        <td>${option.theta?.toFixed(4) || '-'}</td>
                        <td>${option.vega?.toFixed(4) || '-'}</td>
                        <td>${(option.impliedVolatility * 100).toFixed(2)}%</td>
                    ` : ''}
                </tr>
            `;
        });

        tableHTML += '</tbody></table>';
        return tableHTML;
    }

    getOptionRowClass(option) {
        if (option.volume > 1000) return 'high-volume';
        if (option.openInterest > 5000) return 'high-oi';
        return '';
    }

    calculateAnalytics() {
        const totalCallVolume = this.state.options.calls.reduce((sum, opt) => sum + opt.volume, 0);
        const totalPutVolume = this.state.options.puts.reduce((sum, opt) => sum + opt.volume, 0);
        const putCallRatio = totalPutVolume / totalCallVolume;
        
        document.getElementById('put-call-ratio').textContent = putCallRatio.toFixed(2);
        
        // Calculate Max Pain
        const maxPain = this.calculateMaxPain();
        document.getElementById('max-pain').textContent = formatters.formatCurrency(maxPain);
        
        // Calculate average IV
        const allOptions = [...this.state.options.calls, ...this.state.options.puts];
        const avgIV = allOptions.reduce((sum, opt) => sum + opt.impliedVolatility, 0) / allOptions.length;
        document.getElementById('implied-volatility').textContent = `${(avgIV * 100).toFixed(2)}%`;
    }

    calculateMaxPain() {
        const allStrikes = new Set([
            ...this.state.options.calls.map(opt => opt.strike),
            ...this.state.options.puts.map(opt => opt.strike)
        ]);

        let maxPainStrike = 0;
        let minPain = Infinity;

        allStrikes.forEach(strike => {
            let totalPain = 0;
            
            this.state.options.calls.forEach(call => {
                if (strike > call.strike) {
                    totalPain += (strike - call.strike) * call.openInterest;
                }
            });

            this.state.options.puts.forEach(put => {
                if (strike < put.strike) {
                    totalPain += (put.strike - strike) * put.openInterest;
                }
            });

            if (totalPain < minPain) {
                minPain = totalPain;
                maxPainStrike = strike;
            }
        });

        return maxPainStrike;
    }
}
