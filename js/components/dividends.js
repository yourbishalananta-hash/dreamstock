// Dividend Calendar & Analysis Component
class DividendComponent extends BaseComponent {
    constructor(containerId) {
        super(containerId);
        this.dividendData = {
            upcoming: [],
            history: [],
            yield: {}
        };
    }

    async init() {
        await this.fetchDividendData();
        this.render();
        this.attachEventListeners();
    }

    render() {
        const { upcoming, history } = this.dividendData;
        
        this.container.innerHTML = `
            <div class="dividend-container">
                <h3>Dividend Calendar & Analysis</h3>
                
                <div class="dividend-summary">
                    <div class="summary-card">
                        <h4>Upcoming Dividends</h4>
                        <span class="count">${upcoming.length}</span>
                    </div>
                    <div class="summary-card">
                        <h4>Total Payout (Next 30 Days)</h4>
                        <span class="amount">${this.calculateTotalPayout()}</span>
                    </div>
                    <div class="summary-card">
                        <h4>Average Yield</h4>
                        <span class="yield">${this.calculateAverageYield()}%</span>
                    </div>
                </div>

                <div class="dividend-filters">
                    <input type="text" id="dividend-search" class="form-control" 
                           placeholder="Search stocks...">
                    <select id="yield-filter" class="form-select">
                        <option value="all">All Yields</option>
                        <option value="high">High Yield (>4%)</option>
                        <option value="medium">Medium Yield (2-4%)</option>
                        <option value="low">Low Yield (<2%)</option>
                    </select>
                    <select id="frequency-filter" class="form-select">
                        <option value="all">All Frequencies</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annual">Annual</option>
                    </select>
                </div>

                <div class="dividend-tabs">
                    <button class="tab active" data-tab="upcoming">Upcoming</button>
                    <button class="tab" data-tab="history">History</button>
                    <button class="tab" data-tab="screener">Dividend Screener</button>
                </div>

                <div class="tab-content active" id="upcoming-tab">
                    <div class="upcoming-dividends">
                        ${this.renderUpcomingDividends()}
                    </div>
                </div>

                <div class="tab-content" id="history-tab" style="display: none;">
                    <div class="dividend-history-chart">
                        <canvas id="dividend-chart"></canvas>
                    </div>
                    <div class="history-table">
                        ${this.renderDividendHistory()}
                    </div>
                </div>

                <div class="tab-content" id="screener-tab" style="display: none;">
                    <div class="dividend-screener">
                        <div class="screener-controls">
                            <div class="form-group">
                                <label>Minimum Yield (%)</label>
                                <input type="number" id="min-yield" class="form-control" 
                                       value="2" step="0.1">
                            </div>
                            <div class="form-group">
                                <label>Minimum Payout Ratio (%)</label>
                                <input type="number" id="min-payout" class="form-control" 
                                       value="40" step="5">
                            </div>
                            <div class="form-group">
                                <label>Dividend Growth (Years)</label>
                                <input type="number" id="div-growth-years" class="form-control" 
                                       value="5" step="1">
                            </div>
                            <button id="run-screener" class="btn btn-primary">Screen Stocks</button>
                        </div>
                        <div id="screener-results"></div>
                    </div>
                </div>

                <div class="dividend-calculator">
                    <h4>Dividend Income Calculator</h4>
                    <div class="calculator-inputs">
                        <div class="form-group">
                            <label>Investment Amount ($)</label>
                            <input type="number" id="calc-amount" class="form-control" 
                                   value="10000" min="100">
                        </div>
                        <div class="form-group">
                            <label>Dividend Yield (%)</label>
                            <input type="number" id="calc-yield" class="form-control" 
                                   value="3.5" step="0.1">
                        </div>
                        <div class="form-group">
                            <label>Years</label>
                            <input type="number" id="calc-years" class="form-control" 
                                   value="10" min="1">
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="calc-drip" checked>
                                DRIP (Reinvest Dividends)
                            </label>
                        </div>
                    </div>
                    <div class="calculator-results" id="calc-results"></div>
                </div>
            </div>
        `;
    }

    async fetchDividendData() {
        try {
            const [upcoming, history] = await Promise.all([
                apiService.getUpcomingDividends(),
                apiService.getDividendHistory()
            ]);
            
            this.dividendData.upcoming = upcoming;
            this.dividendData.history = history;
        } catch (error) {
            console.error('Error fetching dividend data:', error);
        }
    }

    renderUpcomingDividends() {
        return this.dividendData.upcoming.map(div => `
            <div class="dividend-card">
                <div class="div-header">
                    <span class="div-symbol">${div.symbol}</span>
                    <span class="div-yield">${div.yield}%</span>
                </div>
                <div class="div-details">
                    <div class="detail-row">
                        <span>Ex-Date:</span>
                        <span>${formatters.formatDate(div.exDate)}</span>
                    </div>
                    <div class="detail-row">
                        <span>Pay Date:</span>
                        <span>${formatters.formatDate(div.payDate)}</span>
                    </div>
                    <div class="detail-row">
                        <span>Amount:</span>
                        <span>${formatters.formatCurrency(div.amount)}</span>
                    </div>
                    <div class="detail-row">
                        <span>Frequency:</span>
                        <span>${div.frequency}</span>
                    </div>
                </div>
                <div class="div-countdown">
                    ${this.getDaysUntil(div.exDate)} days until ex-date
                </div>
            </div>
        `).join('');
    }

    renderDividendHistory() {
        return `
            <table class="history-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Symbol</th>
                        <th>Amount</th>
                        <th>Yield</th>
                        <th>Type</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.dividendData.history.map(div => `
                        <tr>
                            <td>${formatters.formatDate(div.date)}</td>
                            <td>${div.symbol}</td>
                            <td>${formatters.formatCurrency(div.amount)}</td>
                            <td>${div.yield}%</td>
                            <td>${div.type}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    calculateTotalPayout() {
        return formatters.formatCurrency(
            this.dividendData.upcoming.reduce((sum, div) => sum + div.amount * 100, 0)
        );
    }

    calculateAverageYield() {
        if (this.dividendData.upcoming.length === 0) return 0;
        const avgYield = this.dividendData.upcoming.reduce((sum, div) => sum + div.yield, 0) 
                        / this.dividendData.upcoming.length;
        return avgYield.toFixed(2);
    }

    getDaysUntil(date) {
        const now = new Date();
        const target = new Date(date);
        const diff = target - now;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    calculateDividendIncome() {
        const amount = parseFloat(document.getElementById('calc-amount').value);
        const yieldRate = parseFloat(document.getElementById('calc-yield').value) / 100;
        const years = parseInt(document.getElementById('calc-years').value);
        const drip = document.getElementById('calc-drip').checked;
        
        let totalIncome = 0;
        let currentAmount = amount;
        const yearlyBreakdown = [];
        
        for (let year = 1; year <= years; year++) {
            const yearlyDividend = currentAmount * yieldRate;
            totalIncome += yearlyDividend;
            
            yearlyBreakdown.push({
                year,
                amount: currentAmount,
                dividend: yearlyDividend
            });
            
            if (drip) {
                currentAmount += yearlyDividend;
            }
        }
        
        return {
            totalIncome,
            finalAmount: currentAmount,
            yearlyBreakdown
        };
    }
}
