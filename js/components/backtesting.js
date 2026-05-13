// Strategy Backtesting Component
class BacktestingComponent extends BaseComponent {
    constructor(containerId) {
        super(containerId);
        this.strategies = {
            'moving-average-cross': this.movingAverageCrossStrategy,
            'rsi-mean-reversion': this.rsiMeanReversionStrategy,
            'bollinger-bands': this.bollingerBandsStrategy,
            'macd-signal': this.macdSignalStrategy
        };
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="backtesting-container">
                <h3>Strategy Backtesting</h3>
                <div class="backtest-config">
                    <div class="config-row">
                        <div class="form-group">
                            <label>Symbol</label>
                            <input type="text" id="bt-symbol" class="form-control" placeholder="AAPL">
                        </div>
                        <div class="form-group">
                            <label>Strategy</label>
                            <select id="bt-strategy" class="form-select">
                                <option value="moving-average-cross">Moving Average Cross</option>
                                <option value="rsi-mean-reversion">RSI Mean Reversion</option>
                                <option value="bollinger-bands">Bollinger Bands</option>
                                <option value="macd-signal">MACD Signal</option>
                            </select>
                        </div>
                    </div>
                    <div class="config-row">
                        <div class="form-group">
                            <label>Initial Capital ($)</label>
                            <input type="number" id="bt-capital" class="form-control" value="10000">
                        </div>
                        <div class="form-group">
                            <label>Position Size (%)</label>
                            <input type="number" id="bt-position-size" class="form-control" value="10" min="1" max="100">
                        </div>
                        <div class="form-group">
                            <label>Commission (%)</label>
                            <input type="number" id="bt-commission" class="form-control" value="0.1" step="0.01">
                        </div>
                    </div>
                    <div class="strategy-params" id="strategy-params"></div>
                    <button id="run-backtest" class="btn btn-primary">Run Backtest</button>
                </div>
                <div class="backtest-results" id="backtest-results" style="display: none;">
                    <div class="results-summary">
                        <div class="metric-card">
                            <h5>Total Return</h5>
                            <span id="bt-total-return">-</span>
                        </div>
                        <div class="metric-card">
                            <h5>Sharpe Ratio</h5>
                            <span id="bt-sharpe">-</span>
                        </div>
                        <div class="metric-card">
                            <h5>Max Drawdown</h5>
                            <span id="bt-max-dd">-</span>
                        </div>
                        <div class="metric-card">
                            <h5>Win Rate</h5>
                            <span id="bt-win-rate">-</span>
                        </div>
                        <div class="metric-card">
                            <h5>Total Trades</h5>
                            <span id="bt-trades">-</span>
                        </div>
                    </div>
                    <div class="equity-curve-chart" id="equity-curve"></div>
                    <div class="trade-list" id="trade-list"></div>
                </div>
            </div>
        `;
    }

    async runBacktest() {
        const symbol = document.getElementById('bt-symbol').value;
        const strategy = document.getElementById('bt-strategy').value;
        const initialCapital = parseFloat(document.getElementById('bt-capital').value);
        const positionSize = parseFloat(document.getElementById('bt-position-size').value) / 100;
        const commission = parseFloat(document.getElementById('bt-commission').value) / 100;

        // Fetch historical data
        const historicalData = await apiService.getHistoricalData(symbol, '5y');
        
        // Run strategy
        const strategyFn = this.strategies[strategy];
        const signals = strategyFn(historicalData);
        
        // Simulate trading
        const results = this.simulateTrading(historicalData, signals, initialCapital, positionSize, commission);
        
        // Calculate metrics
        const metrics = this.calculateMetrics(results);
        
        // Display results
        this.displayResults(metrics, results);
    }

    movingAverageCrossStrategy(data) {
        const shortMA = indicators.calculateSMA(data.close, 20);
        const longMA = indicators.calculateSMA(data.close, 50);
        const signals = new Array(data.close.length).fill(0);
        
        for (let i = 1; i < data.close.length; i++) {
            if (shortMA[i] > longMA[i] && shortMA[i-1] <= longMA[i-1]) {
                signals[i] = 1; // Buy signal
            } else if (shortMA[i] < longMA[i] && shortMA[i-1] >= longMA[i-1]) {
                signals[i] = -1; // Sell signal
            }
        }
        
        return signals;
    }

    rsiMeanReversionStrategy(data) {
        const rsi = indicators.calculateRSI(data.close, 14);
        const signals = new Array(data.close.length).fill(0);
        
        for (let i = 0; i < data.close.length; i++) {
            if (rsi[i] < 30) {
                signals[i] = 1; // Oversold - Buy
            } else if (rsi[i] > 70) {
                signals[i] = -1; // Overbought - Sell
            }
        }
        
        return signals;
    }

    bollingerBandsStrategy(data) {
        const bb = indicators.calculateBollingerBands(data.close, 20, 2);
        const signals = new Array(data.close.length).fill(0);
        
        for (let i = 0; i < data.close.length; i++) {
            if (data.close[i] < bb.lower[i]) {
                signals[i] = 1; // Price below lower band - Buy
            } else if (data.close[i] > bb.upper[i]) {
                signals[i] = -1; // Price above upper band - Sell
            }
        }
        
        return signals;
    }

    macdSignalStrategy(data) {
        const macd = indicators.calculateMACD(data.close);
        const signals = new Array(data.close.length).fill(0);
        
        for (let i = 1; i < data.close.length; i++) {
            if (macd.MACD[i] > macd.signal[i] && macd.MACD[i-1] <= macd.signal[i-1]) {
                signals[i] = 1; // MACD crosses above signal - Buy
            } else if (macd.MACD[i] < macd.signal[i] && macd.MACD[i-1] >= macd.signal[i-1]) {
                signals[i] = -1; // MACD crosses below signal - Sell
            }
        }
        
        return signals;
    }

    simulateTrading(data, signals, initialCapital, positionSize, commission) {
        let capital = initialCapital;
        let position = 0;
        const equity = [capital];
        const trades = [];
        
        for (let i = 0; i < data.close.length; i++) {
            if (signals[i] === 1 && position === 0) {
                // Buy
                const buyAmount = capital * positionSize;
                const shares = Math.floor(buyAmount / data.close[i]);
                const cost = shares * data.close[i] * (1 + commission);
                
                if (cost <= capital) {
                    capital -= cost;
                    position = shares;
                    trades.push({
                        type: 'BUY',
                        date: data.timestamp[i],
                        price: data.close[i],
                        shares: shares,
                        cost: cost
                    });
                }
            } else if (signals[i] === -1 && position > 0) {
                // Sell
                const revenue = position * data.close[i] * (1 - commission);
                capital += revenue;
                trades.push({
                    type: 'SELL',
                    date: data.timestamp[i],
                    price: data.close[i],
                    shares: position,
                    revenue: revenue,
                    profit: revenue - trades[trades.length - 1].cost
                });
                position = 0;
            }
            
            equity.push(capital + position * data.close[i]);
        }
        
        return { equity, trades, finalCapital: capital + position * data.close[data.close.length - 1] };
    }

    calculateMetrics(results) {
        const returns = [];
        for (let i = 1; i < results.equity.length; i++) {
            returns.push((results.equity[i] - results.equity[i-1]) / results.equity[i-1]);
        }
        
        const totalReturn = (results.finalCapital - results.equity[0]) / results.equity[0] * 100;
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const stdDev = Math.sqrt(returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length);
        const sharpeRatio = (avgReturn / stdDev) * Math.sqrt(252); // Annualized
        
        let maxDrawdown = 0;
        let peak = results.equity[0];
        results.equity.forEach(value => {
            if (value > peak) peak = value;
            const drawdown = (peak - value) / peak;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        });
        
        const winningTrades = results.trades.filter(t => t.profit > 0).length;
        const totalTrades = results.trades.filter(t => t.type === 'SELL').length;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades * 100) : 0;
        
        return {
            totalReturn: totalReturn.toFixed(2),
            sharpeRatio: sharpeRatio.toFixed(2),
            maxDrawdown: (maxDrawdown * 100).toFixed(2),
            winRate: winRate.toFixed(2),
            totalTrades: totalTrades
        };
    }

    displayResults(metrics, results) {
        document.getElementById('backtest-results').style.display = 'block';
        document.getElementById('bt-total-return').textContent = `${metrics.totalReturn}%`;
        document.getElementById('bt-sharpe').textContent = metrics.sharpeRatio;
        document.getElementById('bt-max-dd').textContent = `${metrics.maxDrawdown}%`;
        document.getElementById('bt-win-rate').textContent = `${metrics.winRate}%`;
        document.getElementById('bt-trades').textContent = metrics.totalTrades;
        
        this.renderEquityCurve(results.equity);
        this.renderTradeList(results.trades);
    }
}
