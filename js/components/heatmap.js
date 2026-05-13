// Market Heat Map Component
class HeatMapComponent extends BaseComponent {
    constructor(containerId) {
        super(containerId);
        this.marketData = {};
        this.sectors = [
            'Technology', 'Healthcare', 'Finance', 'Energy', 
            'Consumer', 'Industrial', 'Materials', 'Utilities',
            'Real Estate', 'Communication'
        ];
    }

    async init() {
        await this.fetchMarketData();
        this.render();
        this.startPeriodicUpdates();
    }

    render() {
        this.container.innerHTML = `
            <div class="heatmap-container">
                <div class="heatmap-header">
                    <h3>Market Heat Map</h3>
                    <div class="heatmap-controls">
                        <select id="heatmap-view" class="form-select">
                            <option value="sectors">Sectors</option>
                            <option value="industries">Industries</option>
                            <option value="marketcap">Market Cap</option>
                        </select>
                        <select id="heatmap-metric" class="form-select">
                            <option value="change">Price Change %</option>
                            <option value="volume">Volume</option>
                            <option value="pe">P/E Ratio</option>
                        </select>
                        <button id="heatmap-refresh" class="btn btn-sm">
                            <span class="refresh-icon">↻</span> Refresh
                        </button>
                    </div>
                </div>

                <div class="heatmap-grid" id="heatmap-grid">
                    <!-- Treemap will be rendered here -->
                </div>

                <div class="heatmap-legend">
                    <div class="legend-gradient"></div>
                    <div class="legend-labels">
                        <span>-5%</span>
                        <span>0%</span>
                        <span>+5%</span>
                    </div>
                </div>

                <div class="heatmap-tooltip" id="heatmap-tooltip" style="display: none;">
                    <div class="tooltip-symbol"></div>
                    <div class="tooltip-price"></div>
                    <div class="tooltip-change"></div>
                    <div class="tooltip-volume"></div>
                </div>
            </div>
        `;
    }

    async fetchMarketData() {
        try {
            const [sectorData, stockData] = await Promise.all([
                apiService.getSectorPerformance(),
                apiService.getMarketMovers()
            ]);
            
            this.marketData.sectors = sectorData;
            this.marketData.stocks = stockData;
            this.renderHeatMap();
        } catch (error) {
            console.error('Error fetching market data:', error);
        }
    }

    renderHeatMap() {
        const view = document.getElementById('heatmap-view')?.value || 'sectors';
        const metric = document.getElementById('heatmap-metric')?.value || 'change';
        
        const grid = document.getElementById('heatmap-grid');
        grid.innerHTML = '';
        
        if (view === 'sectors') {
            this.renderSectorHeatMap(grid, metric);
        } else if (view === 'industries') {
            this.renderIndustryHeatMap(grid, metric);
        } else {
            this.renderMarketCapHeatMap(grid, metric);
        }
    }

    renderSectorHeatMap(container, metric) {
        const totalMarketCap = this.marketData.sectors.reduce((sum, s) => sum + s.marketCap, 0);
        
        // Simple treemap layout algorithm
        let x = 0, y = 0;
        const width = container.offsetWidth;
        const rowHeight = 120;
        
        this.marketData.sectors.forEach(sector => {
            const percentage = sector.marketCap / totalMarketCap;
            const boxWidth = width * percentage;
            
            if (x + boxWidth > width) {
                x = 0;
                y += rowHeight;
            }
            
            const change = sector.change || 0;
            const color = this.getHeatColor(change);
            
            const sectorBox = document.createElement('div');
            sectorBox.className = 'heatmap-sector';
            sectorBox.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: ${boxWidth - 4}px;
                height: ${rowHeight - 4}px;
                background: ${color};
                border-radius: 8px;
                padding: 15px;
                cursor: pointer;
                transition: transform 0.2s;
            `;
            
            sectorBox.innerHTML = `
                <div class="sector-name">${sector.name}</div>
                <div class="sector-change ${change >= 0 ? 'positive' : 'negative'}">
                    ${change >= 0 ? '+' : ''}${change.toFixed(2)}%
                </div>
                <div class="sector-stocks">
                    ${sector.topStocks.slice(0, 3).map(stock => `
                        <span class="stock-chip ${stock.change >= 0 ? 'up' : 'down'}">
                            ${stock.symbol}
                        </span>
                    `).join('')}
                </div>
            `;
            
            sectorBox.addEventListener('mouseenter', (e) => this.showTooltip(e, sector));
            sectorBox.addEventListener('mouseleave', () => this.hideTooltip());
            sectorBox.addEventListener('click', () => {
                eventBus.emit('sector:selected', sector);
            });
            
            container.appendChild(sectorBox);
            x += boxWidth;
        });
        
        container.style.height = `${y + rowHeight}px`;
    }

    renderIndustryHeatMap(container, metric) {
        // Group stocks by industry
        const industries = this.groupByIndustry();
        
        // Create nested treemap
        const gridConfig = this.calculateGridLayout(industries);
        
        gridConfig.forEach(config => {
            const industryBox = document.createElement('div');
            industryBox.className = 'heatmap-industry';
            industryBox.style.cssText = `
                position: absolute;
                left: ${config.x}px;
                top: ${config.y}px;
                width: ${config.width - 4}px;
                height: ${config.height - 4}px;
                background: ${this.getHeatColor(config.avgChange)};
                border-radius: 8px;
                padding: 10px;
                overflow: hidden;
            `;
            
            industryBox.innerHTML = `
                <div class="industry-header">
                    <span class="industry-name">${config.name}</span>
                    <span class="industry-change">${config.avgChange.toFixed(2)}%</span>
                </div>
                <div class="industry-stocks">
                    ${config.stocks.map(stock => `
                        <div class="mini-stock ${stock.change >= 0 ? 'up' : 'down'}">
                            ${stock.symbol}
                        </div>
                    `).join('')}
                </div>
            `;
            
            container.appendChild(industryBox);
        });
    }

    renderMarketCapHeatMap(container, metric) {
        // Group by market cap categories
        const categories = {
            'Mega Cap': { min: 200, stocks: [], color: '#FF6B6B' },
            'Large Cap': { min: 10, stocks: [], color: '#4ECDC4' },
            'Mid Cap': { min: 2, stocks: [], color: '#45B7D1' },
            'Small Cap': { min: 0.3, stocks: [], color: '#96CEB4' },
            'Micro Cap': { min: 0, stocks: [], color: '#FFEAA7' }
        };
        
        // Categorize stocks
        this.marketData.stocks.forEach(stock => {
            const marketCapB = stock.marketCap / 1e9; // Convert to billions
            for (const [category, data] of Object.entries(categories)) {
                if (marketCapB >= data.min) {
                    data.stocks.push(stock);
                    break;
                }
            }
        });
        
        // Render each category
        Object.entries(categories).forEach(([category, data], index) => {
            if (data.stocks.length === 0) return;
            
            const categoryBox = document.createElement('div');
            categoryBox.className = 'heatmap-category';
            categoryBox.style.cssText = `
                background: linear-gradient(135deg, ${data.color}, ${data.color}88);
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 10px;
            `;
            
            categoryBox.innerHTML = `
                <h4>${category} (${data.stocks.length} stocks)</h4>
                <div class="category-stocks">
                    ${data.stocks.map(stock => `
                        <div class="category-stock-item ${stock.change >= 0 ? 'positive' : 'negative'}">
                            <span class="stock-symbol">${stock.symbol}</span>
                            <span class="stock-change">${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%</span>
                        </div>
                    `).join('')}
                </div>
            `;
            
            container.appendChild(categoryBox);
        });
    }

    getHeatColor(change) {
        // Red to green gradient based on percentage change
        const intensity = Math.min(Math.abs(change) / 5, 1); // Max intensity at 5%
        
        if (change >= 0) {
            // Green shades
            const r = Math.floor(76 * (1 - intensity));
            const g = Math.floor(175 + 80 * intensity);
            const b = Math.floor(80 * (1 - intensity));
            return `rgb(${r}, ${g}, ${b})`;
        } else {
            // Red shades
            const r = Math.floor(244 + 11 * intensity);
            const g = Math.floor(67 * (1 - intensity));
            const b = Math.floor(54 * (1 - intensity));
            return `rgb(${r}, ${g}, ${b})`;
        }
    }

    groupByIndustry() {
        const industryMap = new Map();
        
        this.marketData.stocks.forEach(stock => {
            if (!industryMap.has(stock.industry)) {
                industryMap.set(stock.industry, []);
            }
            industryMap.get(stock.industry).push(stock);
        });
        
        return Array.from(industryMap.entries()).map(([name, stocks]) => ({
            name,
            stocks,
            avgChange: stocks.reduce((sum, s) => sum + s.change, 0) / stocks.length,
            totalMarketCap: stocks.reduce((sum, s) => sum + s.marketCap, 0)
        }));
    }

    calculateGridLayout(industries) {
        const totalValue = industries.reduce((sum, ind) => sum + ind.totalMarketCap, 0);
        const containerWidth = document.getElementById('heatmap-grid').offsetWidth;
        
        // Simple squarified treemap algorithm
        let layouts = [];
        let x = 0, y = 0;
        let currentRowHeight = 0;
        let rowItems = [];
        
        industries.sort((a, b) => b.totalMarketCap - a.totalMarketCap);
        
        industries.forEach(industry => {
            const ratio = industry.totalMarketCap / totalValue;
            const width = containerWidth * ratio;
            
            if (rowItems.length > 0) {
                const rowWidth = rowItems.reduce((sum, item) => sum + item.width, 0);
                if (rowWidth + width > containerWidth * 0.8) {
                    // Start new row
                    layouts = layouts.concat(rowItems);
                    x = 0;
                    y += currentRowHeight;
                    rowItems = [];
                    currentRowHeight = 0;
                }
            }
            
            rowItems.push({
                ...industry,
                x,
                y,
                width,
                height: 0 // Will be calculated
            });
            
            x += width;
            currentRowHeight = Math.max(currentRowHeight, 100);
        });
        
        // Add remaining items
        layouts = layouts.concat(rowItems);
        
        // Set heights
        layouts.forEach(layout => {
            layout.height = currentRowHeight || 100;
        });
        
        return layouts;
    }

    showTooltip(event, data) {
        const tooltip = document.getElementById('heatmap-tooltip');
        tooltip.innerHTML = `
            <div class="tooltip-symbol">${data.name || data.symbol}</div>
            <div class="tooltip-price">$${data.price?.toFixed(2) || 'N/A'}</div>
            <div class="tooltip-change ${(data.change || 0) >= 0 ? 'positive' : 'negative'}">
                ${data.change >= 0 ? '+' : ''}${data.change?.toFixed(2)}%
            </div>
            <div class="tooltip-volume">Vol: ${formatters.formatNumber(data.volume || 0)}</div>
        `;
        
        tooltip.style.display = 'block';
        tooltip.style.left = `${event.pageX + 10}px`;
        tooltip.style.top = `${event.pageY - 10}px`;
    }

    hideTooltip() {
        document.getElementById('heatmap-tooltip').style.display = 'none';
    }

    startPeriodicUpdates() {
        setInterval(() => {
            this.fetchMarketData();
        }, 30000); // Update every 30 seconds
    }
}
