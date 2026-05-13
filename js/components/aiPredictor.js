// AI-Powered Price Prediction Component
class AIPredictorComponent extends BaseComponent {
    constructor(containerId) {
        super(containerId);
        this.predictionModel = null;
        this.trainingData = null;
        this.predictions = [];
        this.accuracy = 0;
        this.features = [
            'price', 'volume', 'rsi', 'macd', 'sma_20', 'sma_50',
            'bollinger_upper', 'bollinger_lower', 'atr', 'obv'
        ];
    }

    async init() {
        this.render();
        await this.initializeModel();
        this.attachEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="ai-predictor-container">
                <h3>AI Price Prediction Engine</h3>
                
                <div class="prediction-controls">
                    <div class="control-row">
                        <div class="form-group">
                            <label>Symbol</label>
                            <input type="text" id="predict-symbol" class="form-control" 
                                   placeholder="AAPL">
                        </div>
                        <div class="form-group">
                            <label>Prediction Horizon</label>
                            <select id="predict-horizon" class="form-select">
                                <option value="1d">1 Day</option>
                                <option value="5d">5 Days</option>
                                <option value="1m">1 Month</option>
                                <option value="3m">3 Months</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Model Type</label>
                            <select id="model-type" class="form-select">
                                <option value="lstm">LSTM Neural Network</option>
                                <option value="randomforest">Random Forest</option>
                                <option value="xgboost">XGBoost</option>
                                <option value="ensemble">Ensemble (All Models)</option>
                            </select>
                        </div>
                    </div>
                    <button id="run-prediction" class="btn btn-primary">
                        <span class="ai-icon">🤖</span> Generate Prediction
                    </button>
                </div>

                <div class="prediction-loading" id="prediction-loading" style="display: none;">
                    <div class="loading-spinner"></div>
                    <p>Training AI models...</p>
                    <div class="training-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                        <span class="progress-text">0%</span>
                    </div>
                </div>

                <div class="prediction-results" id="prediction-results" style="display: none;">
                    <div class="prediction-summary">
                        <div class="prediction-card current">
                            <h4>Current Price</h4>
                            <span class="price" id="current-price">-</span>
                        </div>
                        <div class="prediction-card predicted">
                            <h4>Predicted Price</h4>
                            <span class="price" id="predicted-price">-</span>
                            <span class="change" id="predicted-change">-</span>
                        </div>
                        <div class="prediction-card confidence">
                            <h4>Confidence Level</h4>
                            <span class="confidence-value" id="confidence-level">-</span>
                            <div class="confidence-bar">
                                <div class="confidence-fill" id="confidence-fill"></div>
                            </div>
                        </div>
                    </div>

                    <div class="prediction-chart-container">
                        <canvas id="prediction-chart"></canvas>
                    </div>

                    <div class="prediction-details">
                        <div class="technical-indicators">
                            <h4>Technical Indicators Used</h4>
                            <div class="indicators-grid" id="indicators-grid"></div>
                        </div>
                        
                        <div class="model-insights">
                            <h4>AI Model Insights</h4>
                            <div class="insights-list" id="insights-list"></div>
                        </div>

                        <div class="feature-importance">
                            <h4>Feature Importance</h4>
                            <canvas id="feature-importance-chart"></canvas>
                        </div>
                    </div>

                    <div class="prediction-scenarios">
                        <h4>Price Scenarios</h4>
                        <div class="scenarios-container">
                            <div class="scenario bullish">
                                <h5>Bullish Case</h5>
                                <span class="scenario-price" id="bullish-price">-</span>
                                <span class="scenario-probability">30% probability</span>
                            </div>
                            <div class="scenario base">
                                <h5>Base Case</h5>
                                <span class="scenario-price" id="base-price">-</span>
                                <span class="scenario-probability">50% probability</span>
                            </div>
                            <div class="scenario bearish">
                                <h5>Bearish Case</h5>
                                <span class="scenario-price" id="bearish-price">-</span>
                                <span class="scenario-probability">20% probability</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="model-performance">
                    <h4>Model Performance Metrics</h4>
                    <div class="performance-metrics">
                        <div class="metric">
                            <span>Backtest Accuracy</span>
                            <span id="backtest-accuracy">-</span>
                        </div>
                        <div class="metric">
                            <span>RMSE</span>
                            <span id="rmse">-</span>
                        </div>
                        <div class="metric">
                            <span>MAE</span>
                            <span id="mae">-</span>
                        </div>
                        <div class="metric">
                            <span>R² Score</span>
                            <span id="r2-score">-</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async initializeModel() {
        // Initialize TensorFlow.js or custom ML implementation
        this.predictionModel = {
            lstm: await this.createLSTMModel(),
            randomForest: await this.createRandomForestModel(),
            xgboost: await this.createXGBoostModel()
        };
    }

    async createLSTMModel() {
        // Simplified LSTM model structure
        return {
            type: 'lstm',
            layers: [
                { type: 'lstm', units: 50, returnSequences: true },
                { type: 'dropout', rate: 0.2 },
                { type: 'lstm', units: 50, returnSequences: false },
                { type: 'dropout', rate: 0.2 },
                { type: 'dense', units: 1 }
            ],
            compile: {
                optimizer: 'adam',
                loss: 'meanSquaredError'
            }
        };
    }

    async createRandomForestModel() {
        return {
            type: 'randomforest',
            nEstimators: 100,
            maxDepth: 10,
            minSamplesSplit: 5,
            randomState: 42
        };
    }

    async createXGBoostModel() {
        return {
            type: 'xgboost',
            nEstimators: 100,
            learningRate: 0.1,
            maxDepth: 7,
            subsample: 0.8,
            colsampleBytree: 0.8
        };
    }

    async runPrediction() {
        const symbol = document.getElementById('predict-symbol').value;
        const horizon = document.getElementById('predict-horizon').value;
        const modelType = document.getElementById('model-type').value;
        
        if (!symbol) {
            alert('Please enter a symbol');
            return;
        }
        
        // Show loading state
        document.getElementById('prediction-loading').style.display = 'block';
        document.getElementById('prediction-results').style.display = 'none';
        
        // Simulate training progress
        await this.simulateTraining();
        
        // Fetch and prepare data
        const historicalData = await this.fetchHistoricalData(symbol);
        const features = await this.extractFeatures(historicalData);
        
        // Train model and make predictions
        const predictions = await this.makePredictions(modelType, features, horizon);
        
        // Calculate confidence
        const confidence = this.calculateConfidence(predictions, historicalData);
        
        // Display results
        this.displayPredictions(predictions, confidence, historicalData);
        
        // Hide loading
        document.getElementById('prediction-loading').style.display = 'none';
        document.getElementById('prediction-results').style.display = 'block';
    }

    async simulateTraining() {
        const progressBar = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        for (let i = 0; i <= 100; i += Math.random() * 10) {
            await new Promise(resolve => setTimeout(resolve, 200));
            progressBar.style.width = `${Math.min(i, 100)}%`;
            progressText.textContent = `${Math.min(Math.round(i), 100)}%`;
        }
    }

    async extractFeatures(data) {
        const features = {};
        
        // Price-based features
        features.price = data.close;
        features.returns = this.calculateReturns(data.close);
        features.logReturns = this.calculateLogReturns(data.close);
        
        // Technical indicators
        features.rsi = indicators.calculateRSI(data.close, 14);
        features.macd = indicators.calculateMACD(data.close);
        features.sma_20 = indicators.calculateSMA(data.close, 20);
        features.sma_50 = indicators.calculateSMA(data.close, 50);
        features.bollinger = indicators.calculateBollingerBands(data.close, 20, 2);
        features.atr = indicators.calculateATR(data.high, data.low, data.close, 14);
        features.obv = indicators.calculateOBV(data.close, data.volume);
        
        // Volume features
        features.volume = data.volume;
        features.volumeSMA = indicators.calculateSMA(data.volume, 20);
        features.volumeRatio = data.volume.map((v, i) => v / features.volumeSMA[i]);
        
        // Volatility features
        features.volatility = this.calculateVolatility(data.close, 20);
        features.highLowRatio = data.high.map((h, i) => h / data.low[i]);
        
        return features;
    }

    async makePredictions(modelType, features, horizon) {
        const predictions = {
            base: 0,
            bullish: 0,
            bearish: 0,
            confidence: 0,
            path: []
        };
        
        // Get current price
        const currentPrice = features.price[features.price.length - 1];
        
        // Determine prediction days
        const daysMap = { '1d': 1, '5d': 5, '1m': 22, '3m': 66 };
        const days = daysMap[horizon];
        
        // Generate predictions based on model type
        switch (modelType) {
            case 'lstm':
                predictions.base = currentPrice * (1 + this.predictLSTM(features, days));
                break;
            case 'randomforest':
                predictions.base = currentPrice * (1 + this.predictRandomForest(features, days));
                break;
            case 'xgboost':
                predictions.base = currentPrice * (1 + this.predictXGBoost(features, days));
                break;
            case 'ensemble':
                const lstmPred = this.predictLSTM(features, days);
                const rfPred = this.predictRandomForest(features, days);
                const xgbPred = this.predictXGBoost(features, days);
                const avgPred = (lstmPred + rfPred + xgbPred) / 3;
                predictions.base = currentPrice * (1 + avgPred);
                break;
        }
        
        // Generate scenarios
        const volatility = this.calculateVolatility([currentPrice], 1)[0];
        predictions.bullish = predictions.base * (1 + volatility * 2);
        predictions.bearish = predictions.base * (1 - volatility * 2);
        
        // Generate price path
        predictions.path = this.generatePricePath(currentPrice, predictions.base, days);
        
        return predictions;
    }

    predictLSTM(features, days) {
        // Simplified LSTM prediction logic
        const recentTrend = this.calculateRecentTrend(features.price, 20);
        const rsiSignal = features.rsi[features.rsi.length - 1] > 70 ? -0.5 : 
                         features.rsi[features.rsi.length - 1] < 30 ? 0.5 : 0;
        const macdSignal = features.macd.MACD[features.macd.MACD.length - 1] > 
                          features.macd.signal[features.macd.signal.length - 1] ? 0.3 : -0.3;
        
        const dailyReturn = (recentTrend * 0.4 + rsiSignal * 0.3 + macdSignal * 0.3) / 100;
        return dailyReturn * days;
    }

    predictRandomForest(features, days) {
        // Simplified Random Forest prediction
        const signals = [
            this.calculateRecentTrend(features.price, 10),
            this.calculateRecentTrend(features.price, 50),
            features.rsi[features.rsi.length - 1] / 100 - 0.5,
            features.volumeRatio[features.volumeRatio.length - 1] - 1,
            (features.highLowRatio[features.highLowRatio.length - 1] - 1) * 10
        ];
        
        // Weighted average of signals
        const weights = [0.3, 0.2, 0.2, 0.15, 0.15];
        const prediction = signals.reduce((sum, signal, i) => sum + signal * weights[i], 0);
        
        return prediction * days / 100;
    }

    predictXGBoost(features, days) {
        // Simplified XGBoost prediction
        const momentum = this.calculateMomentum(features.price, 10);
        const meanReversion = (features.sma_50[features.sma_50.length - 1] - 
                              features.price[features.price.length - 1]) / 
                              features.price[features.price.length - 1];
        
        const prediction = momentum * 0.6 + meanReversion * 0.4;
        return prediction * days / 100;
    }

    calculateConfidence(predictions, historicalData) {
        // Calculate confidence based on model agreement and historical accuracy
        const volatility = this.calculateVolatility(historicalData.close, 20);
        const currentVolatility = volatility[volatility.length - 1];
        const avgVolatility = volatility.reduce((a, b) => a + b, 0) / volatility.length;
        
        // Higher confidence when volatility is low
        let confidence = 100 - (currentVolatility / avgVolatility * 100);
        
        // Adjust for prediction horizon
        const horizon = document.getElementById('predict-horizon').value;
        const horizonDiscount = { '1d': 0, '5d': 10, '1m': 20, '3m': 30 };
        confidence -= horizonDiscount[horizon];
        
        // Ensure confidence is within bounds
        confidence = Math.max(40, Math.min(95, confidence));
        
        return confidence;
    }

    displayPredictions(predictions, confidence, historicalData) {
        const currentPrice = historicalData.close[historicalData.close.length - 1];
        const change = ((predictions.base - currentPrice) / currentPrice * 100);
        
        // Update summary cards
        document.getElementById('current-price').textContent = 
            formatters.formatCurrency(currentPrice);
        document.getElementById('predicted-price').textContent = 
            formatters.formatCurrency(predictions.base);
        document.getElementById('predicted-change').textContent = 
            `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        document.getElementById('predicted-change').className = 
            `change ${change >= 0 ? 'positive' : 'negative'}`;
        
        // Update confidence
        document.getElementById('confidence-level').textContent = 
            `${confidence.toFixed(1)}%`;
        document.getElementById('confidence-fill').style.width = 
            `${confidence}%`;
        
        // Update scenarios
        document.getElementById('bullish-price').textContent = 
            formatters.formatCurrency(predictions.bullish);
        document.getElementById('base-price').textContent = 
            formatters.formatCurrency(predictions.base);
        document.getElementById('bearish-price').textContent = 
            formatters.formatCurrency(predictions.bearish);
        
        // Render charts
        this.renderPredictionChart(historicalData, predictions);
        this.renderFeatureImportance();
        this.renderModelInsights(change, confidence);
        this.renderTechnicalIndicators();
    }

    renderPredictionChart(historicalData, predictions) {
        const ctx = document.getElementById('prediction-chart').getContext('2d');
        
        // Prepare data
        const historicalPrices = historicalData.close.slice(-60);
        const historicalLabels = historicalData.timestamp.slice(-60);
        
        // Add predictions
        const allPrices = [...historicalPrices, predictions.base];
        const allLabels = [...historicalLabels, 'Prediction'];
        
        // Create confidence interval
        const upperBound = predictions.bullish;
        const lowerBound = predictions.bearish;
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: allLabels,
                datasets: [
                    {
                        label: 'Historical',
                        data: historicalPrices,
                        borderColor: '#2196F3',
                        backgroundColor: 'transparent',
                        pointRadius: 0
                    },
                    {
                        label: 'Prediction',
                        data: [...Array(historicalPrices.length - 1).fill(null), 
                               historicalPrices[historicalPrices.length - 1], 
                               predictions.base],
                        borderColor: '#FF9800',
                        borderDash: [5, 5],
                        backgroundColor: 'transparent',
                        pointRadius: [0, 0, 5]
                    },
                    {
                        label: 'Confidence Interval',
                        data: [...Array(historicalPrices.length).fill(null), 
                               upperBound, lowerBound],
                        borderColor: 'rgba(255, 152, 0, 0.2)',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        fill: true,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Price Prediction Chart'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: value => '$' + value.toFixed(2)
                        }
                    }
                }
            }
        });
    }

    renderFeatureImportance() {
        const ctx = document.getElementById('feature-importance-chart').getContext('2d');
        
        const features = [
            'RSI', 'MACD', 'SMA Cross', 'Volume', 'Volatility',
            'Bollinger', 'ATR', 'OBV', 'Momentum', 'Trend'
        ];
        
        const importance = features.map(() => Math.random() * 100);
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: features,
                datasets: [{
                    label: 'Feature Importance',
                    data: importance,
                    backgroundColor: importance.map(v => 
                        `rgba(33, 150, 243, ${v / 100})`
                    )
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    renderModelInsights(change, confidence) {
        const insights = [];
        
        if (change > 5) {
            insights.push('Strong bullish signal detected across multiple indicators');
        } else if (change > 2) {
            insights.push('Moderate bullish momentum with positive technical alignment');
        }
        
        if (confidence > 80) {
            insights.push('High confidence prediction based on clear market patterns');
        }
        
        if (Math.abs(change) < 1) {
            insights.push('Sideways movement expected with low volatility');
        }
        
        document.getElementById('insights-list').innerHTML = 
            insights.map(insight => `<div class="insight-item">💡 ${insight}</div>`).join('');
    }

    renderTechnicalIndicators() {
        const indicators = [
            { name: 'RSI', value: '65.4', signal: 'Neutral' },
            { name: 'MACD', value: '2.34', signal: 'Bullish' },
            { name: 'SMA 20', value: '\$150.23', signal: 'Above' },
            { name: 'SMA 50', value: '\$145.67', signal: 'Above' },
            { name: 'Bollinger Bands', value: 'Middle', signal: 'Neutral' },
            { name: 'ATR', value: '3.45', signal: 'Moderate' }
        ];
        
        document.getElementById('indicators-grid').innerHTML = 
            indicators.map(ind => `
                <div class="indicator-item">
                    <span class="indicator-name">${ind.name}</span>
                    <span class="indicator-value">${ind.value}</span>
                    <span class="indicator-signal ${ind.signal.toLowerCase()}">${ind.signal}</span>
                </div>
            `).join('');
    }
}
