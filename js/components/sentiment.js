// Market Sentiment Analysis Component
class SentimentAnalysisComponent extends BaseComponent {
    constructor(containerId) {
        super(containerId);
        this.sentimentData = {
            news: [],
            social: [],
            overall: 0
        };
        this.sources = ['news', 'twitter', 'reddit', 'stocktwits'];
    }

    async init() {
        this.render();
        await this.fetchSentimentData();
        this.startLiveUpdates();
    }

    render() {
        this.container.innerHTML = `
            <div class="sentiment-container">
                <h3>Market Sentiment Analysis</h3>
                <div class="sentiment-overview">
                    <div class="sentiment-gauge" id="sentiment-gauge">
                        <div class="gauge-circle">
                            <svg viewBox="0 0 200 200">
                                <defs>
                                    <linearGradient id="sentimentGradient">
                                        <stop offset="0%" style="stop-color:#ff4444"/>
                                        <stop offset="50%" style="stop-color:#ffaa00"/>
                                        <stop offset="100%" style="stop-color:#00c853"/>
                                    </linearGradient>
                                </defs>
                                <circle cx="100" cy="100" r="90" fill="none" 
                                        stroke="url(#sentimentGradient)" stroke-width="20"
                                        stroke-dasharray="565.48" stroke-dashoffset="141.37"
                                        transform="rotate(-90 100 100)"/>
                                <text x="100" y="100" text-anchor="middle" 
                                      dominant-baseline="middle" font-size="36" font-weight="bold"
                                      id="sentiment-score">0</text>
                                <text x="100" y="130" text-anchor="middle" 
                                      dominant-baseline="middle" font-size="14"
                                      id="sentiment-label">Neutral</text>
                            </svg>
                        </div>
                    </div>
                    <div class="sentiment-stats">
                        <div class="stat-card bullish">
                            <h4>Bullish</h4>
                            <span id="bullish-percent">0%</span>
                            <div class="progress-bar">
                                <div class="progress bullish-progress" style="width: 0%"></div>
                            </div>
                        </div>
                        <div class="stat-card neutral">
                            <h4>Neutral</h4>
                            <span id="neutral-percent">0%</span>
                            <div class="progress-bar">
                                <div class="progress neutral-progress" style="width: 0%"></div>
                            </div>
                        </div>
                        <div class="stat-card bearish">
                            <h4>Bearish</h4>
                            <span id="bearish-percent">0%</span>
                            <div class="progress-bar">
                                <div class="progress bearish-progress" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="sentiment-sources">
                    <h4>Sentiment by Source</h4>
                    <div class="sources-grid" id="sources-grid"></div>
                </div>
                <div class="sentiment-trends">
                    <h4>Sentiment Trends</h4>
                    <canvas id="sentiment-trend-chart"></canvas>
                </div>
                <div class="top-mentioned">
                    <h4>Most Mentioned Stocks</h4>
                    <div id="top-mentioned-list"></div>
                </div>
            </div>
        `;
    }

    async fetchSentimentData() {
        try {
            const [newsSentiment, socialSentiment] = await Promise.all([
                apiService.getNewsSentiment(),
                apiService.getSocialSentiment()
            ]);

            this.sentimentData.news = newsSentiment;
            this.sentimentData.social = socialSentiment;
            this.sentimentData.overall = this.calculateOverallSentiment();
            
            this.updateDisplay();
        } catch (error) {
            console.error('Error fetching sentiment data:', error);
        }
    }

    calculateOverallSentiment() {
        const allSentiments = [
            ...this.sentimentData.news.map(n => n.score),
            ...this.sentimentData.social.map(s => s.score)
        ];
        
        if (allSentiments.length === 0) return 0;
        
        const average = allSentiments.reduce((a, b) => a + b, 0) / allSentiments.length;
        return Math.round(average * 100);
    }

    updateDisplay() {
        // Update sentiment gauge
        const score = this.sentimentData.overall;
        document.getElementById('sentiment-score').textContent = score;
        
        let label = 'Neutral';
        if (score > 30) label = 'Bullish';
        if (score > 60) label = 'Very Bullish';
        if (score < -30) label = 'Bearish';
        if (score < -60) label = 'Very Bearish';
        document.getElementById('sentiment-label').textContent = label;
        
        // Update gauge rotation
        const rotation = (score + 100) / 200 * 180 - 90;
        const gaugeCircle = document.querySelector('.gauge-circle circle');
        gaugeCircle.style.strokeDashoffset = 565.48 - (565.48 * (score + 100) / 200);
        
        // Calculate percentages
        const bullish = this.countSentiment('bullish');
        const neutral = this.countSentiment('neutral');
        const bearish = this.countSentiment('bearish');
        const total = bullish + neutral + bearish;
        
        document.getElementById('bullish-percent').textContent = 
            `${Math.round((bullish / total) * 100)}%`;
        document.getElementById('neutral-percent').textContent = 
            `${Math.round((neutral / total) * 100)}%`;
        document.getElementById('bearish-percent').textContent = 
            `${Math.round((bearish / total) * 100)}%`;
        
        // Update progress bars
        document.querySelector('.bullish-progress').style.width = 
            `${(bullish / total) * 100}%`;
        document.querySelector('.neutral-progress').style.width = 
            `${(neutral / total) * 100}%`;
        document.querySelector('.bearish-progress').style.width = 
            `${(bearish / total) * 100}%`;
        
        this.renderSourceGrid();
        this.renderTrendChart();
        this.renderTopMentioned();
    }

    countSentiment(type) {
        let count = 0;
        const threshold = 0.1;
        
        [...this.sentimentData.news, ...this.sentimentData.social].forEach(item => {
            if (type === 'bullish' && item.score > threshold) count++;
            if (type === 'bearish' && item.score < -threshold) count++;
            if (type === 'neutral' && Math.abs(item.score) <= threshold) count++;
        });
        
        return count;
    }

    renderSourceGrid() {
        const grid = document.getElementById('sources-grid');
        grid.innerHTML = this.sources.map(source => {
            const sourceData = this.getSourceData(source);
            const sentimentClass = sourceData.score > 0.1 ? 'bullish' : 
                                  sourceData.score < -0.1 ? 'bearish' : 'neutral';
            
            return `
                <div class="source-card ${sentimentClass}">
                    <div class="source-icon">${this.getSourceIcon(source)}</div>
                    <div class="source-name">${source.toUpperCase()}</div>
                    <div class="source-score">${(sourceData.score * 100).toFixed(1)}%</div>
                    <div class="source-mentions">${sourceData.mentions} mentions</div>
                </div>
            `;
        }).join('');
    }

    getSourceData(source) {
        const data = source === 'news' || source === 'stocktwits' ? 
                    this.sentimentData.news : this.sentimentData.social;
        
        const sourceItems = data.filter(item => item.source === source);
        const score = sourceItems.reduce((sum, item) => sum + item.score, 0) / sourceItems.length || 0;
        
        return {
            score: score,
            mentions: sourceItems.length
        };
    }

    getSourceIcon(source) {
        const icons = {
            'news': '📰',
            'twitter': '🐦',
            'reddit': '🤖',
            'stocktwits': '📈'
        };
        return icons[source] || '📊';
    }

    renderTrendChart() {
        const ctx = document.getElementById('sentiment-trend-chart').getContext('2d');
        const trends = this.calculateTrendData();
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: trends.labels,
                datasets: [
                    {
                        label: 'News Sentiment',
                        data: trends.news,
                        borderColor: '#2196F3',
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        fill: true
                    },
                    {
                        label: 'Social Sentiment',
                        data: trends.social,
                        borderColor: '#FF9800',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: -100,
                        max: 100,
                        ticks: {
                            callback: value => value + '%'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    calculateTrendData() {
        // Generate trend data for the last 7 days
        const labels = [];
        const newsTrend = [];
        const socialTrend = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            
            // Simulate trend data
            newsTrend.push(Math.random() * 60 - 30);
            socialTrend.push(Math.random() * 80 - 40);
        }
        
        return { labels, news: newsTrend, social: socialTrend };
    }

    renderTopMentioned() {
        const mentions = this.aggregateMentions();
        const top10 = mentions.slice(0, 10);
        
        document.getElementById('top-mentioned-list').innerHTML = top10.map((item, index) => `
            <div class="mentioned-stock">
                <span class="rank">#${index + 1}</span>
                <span class="symbol">${item.symbol}</span>
                <span class="sentiment-indicator ${item.sentiment > 0 ? 'positive' : 'negative'}">
                    ${item.sentiment > 0 ? '▲' : '▼'}
                </span>
                <span class="mentions-count">${item.count} mentions</span>
                <div class="sentiment-bar">
                    <div class="sentiment-fill" style="width: ${Math.abs(item.sentiment) * 100}%"></div>
                </div>
            </div>
        `).join('');
    }

    aggregateMentions() {
        const symbolMap = new Map();
        
        [...this.sentimentData.news, ...this.sentimentData.social].forEach(item => {
            if (!item.symbols) return;
            
            item.symbols.forEach(symbol => {
                if (!symbolMap.has(symbol)) {
                    symbolMap.set(symbol, { count: 0, sentiment: 0 });
                }
                const data = symbolMap.get(symbol);
                data.count++;
                data.sentiment += item.score;
            });
        });
        
        // Convert to array and sort
        const mentions = Array.from(symbolMap.entries()).map(([symbol, data]) => ({
            symbol,
            count: data.count,
            sentiment: data.sentiment / data.count
        }));
        
        return mentions.sort((a, b) => b.count - a.count);
    }

    startLiveUpdates() {
        setInterval(() => {
            this.fetchSentimentData();
        }, 60000); // Update every minute
    }
}
