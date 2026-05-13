// Correlation Matrix Component
class CorrelationMatrixComponent extends BaseComponent {
    constructor(containerId) {
        super(containerId);
        this.symbols = [];
        this.correlationData = [];
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="correlation-container">
                <h3>Correlation Matrix</h3>
                <div class="correlation-controls">
                    <div class="symbol-input">
                        <input type="text" id="corr-symbols" class="form-control" 
                               placeholder="Enter symbols (e.g., AAPL,GOOGL,MSFT)">
                        <button id="add-symbols" class="btn btn-primary">Analyze</button>
                    </div>
                    <div class="correlation-params">
                        <select id="corr-period" class="form-select">
                            <option value="1m">1 Month</option>
                            <option value="3m">3 Months</option>
                            <option value="6m">6 Months</option>
                            <option value="1y">1 Year</option>
                        </select>
                        <select id="corr-method" class="form-select">
                            <option value="pearson">Pearson</option>
                            <option value="spearman">Spearman</option>
                        </select>
                    </div>
                </div>
                <div class="correlation-matrix" id="correlation-matrix"></div>
                <div class="correlation-insights" id="correlation-insights"></div>
            </div>
        `;
    }

    async analyzeCorrelation() {
        const symbolsInput = document.getElementById('corr-symbols').value;
        this.symbols = symbolsInput.split(',').map(s => s.trim()).filter(s => s);
        
        if (this.symbols.length < 2) {
            alert('Please enter at least 2 symbols');
            return;
        }

        const period = document.getElementById('corr-period').value;
        
        // Fetch historical data for all symbols
        const priceData = await this.fetchMultipleSymbols(this.symbols, period);
        
        // Calculate returns
        const returns = this.calculateReturns(priceData);
        
        // Calculate correlation matrix
        this.correlationData = this.calculateCorrelationMatrix(returns);
        
        // Render matrix
        this.renderCorrelationMatrix();
        this.generateInsights();
    }

    async fetchMultipleSymbols(symbols, period) {
        const promises = symbols.map(symbol => 
            apiService.getHistoricalData(symbol, period)
        );
        
        const results = await Promise.all(promises);
        return results;
    }

    calculateReturns(priceData) {
        return priceData.map(data => {
            const returns = [];
            for (let i = 1; i < data.close.length; i++) {
                returns.push((data.close[i] - data.close[i-1]) / data.close[i-1]);
            }
            return returns;
        });
    }

    calculateCorrelationMatrix(returns) {
        const n = returns.length;
        const matrix = Array(n).fill().map(() => Array(n).fill(0));
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                matrix[i][j] = this.calculatePearsonCorrelation(returns[i], returns[j]);
            }
        }
        
        return matrix;
    }

    calculatePearsonCorrelation(x, y) {
        const n = Math.min(x.length, y.length);
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
        
        for (let i = 0; i < n; i++) {
            sumX += x[i];
            sumY += y[i];
            sumXY += x[i] * y[i];
            sumX2 += x[i] * x[i];
            sumY2 += y[i] * y[i];
        }
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        return denominator === 0 ? 0 : numerator / denominator;
    }

    renderCorrelationMatrix() {
        const matrixDiv = document.getElementById('correlation-matrix');
        
        let html = '<table class="correlation-table"><thead><tr><th></th>';
        this.symbols.forEach(symbol => {
            html += `<th>${symbol}</th>`;
        });
        html += '</tr></thead><tbody>';
        
        this.correlationData.forEach((row, i) => {
            html += `<tr><td><strong>${this.symbols[i]}</strong></td>`;
            row.forEach((value, j) => {
                const colorClass = this.getCorrelationColor(value);
                html += `<td class="${colorClass}">${value.toFixed(2)}</td>`;
            });
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        matrixDiv.innerHTML = html;
    }

    getCorrelationColor(value) {
        if (value > 0.7) return 'strong-positive';
        if (value > 0.3) return 'moderate-positive';
        if (value > -0.3)
