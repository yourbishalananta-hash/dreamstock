// Economic Calendar Component
class EconomicCalendarComponent extends BaseComponent {
    constructor(containerId) {
        super(containerId);
        this.events = [];
        this.filters = {
            importance: ['high', 'medium', 'low'],
            countries: ['US', 'EU', 'UK', 'JP', 'CN']
        };
    }

    async init() {
        await this.fetchEconomicEvents();
        this.render();
        this.attachEventListeners();
    }

    async fetchEconomicEvents() {
        try {
            const response = await apiService.getEconomicCalendar();
            this.events = response.events;
        } catch (error) {
            console.error('Error fetching economic calendar:', error);
        }
    }

    render() {
        const filteredEvents = this.filterEvents();
        
        this.container.innerHTML = `
            <div class="economic-calendar-container">
                <h3>Economic Calendar</h3>
                <div class="calendar-filters">
                    <div class="filter-group">
                        <label>Importance:</label>
                        <div class="checkbox-group">
                            <label><input type="checkbox" value="high" checked> High</label>
                            <label><input type="checkbox" value="medium" checked> Medium</label>
                            <label><input type="checkbox" value="low"> Low</label>
                        </div>
                    </div>
                    <div class="filter-group">
                        <label>Country:</label>
                        <div class="checkbox-group">
                            <label><input type="checkbox" value="US" checked> 🇺🇸 US</label>
                            <label><input type="checkbox" value="EU" checked> 🇪🇺 EU</label>
                            <label><input type="checkbox" value="UK" checked> 🇬🇧 UK</label>
                            <label><input type="checkbox" value="JP"> 🇯🇵 Japan</label>
                            <label><input type="checkbox" value="CN"> 🇨🇳 China</label>
                        </div>
                    </div>
                </div>
                <div class="calendar-events">
                    ${filteredEvents.map(event => this.renderEvent(event)).join('')}
                </div>
            </div>
        `;
    }

    renderEvent(event) {
        const importanceClass = `importance-${event.importance}`;
        const timeUntil = this.getTimeUntil(event.datetime);
        
        return `
            <div class="economic-event ${importanceClass}">
                <div class="event-time">
                    <span class="event-date">${formatters.formatDate(event.datetime)}</span>
                    <span class="event-countdown">${timeUntil}</span>
                </div>
                <div class="event-details">
                    <div class="event-header">
                        <span class="country-flag">${this.getCountryFlag(event.country)}</span>
                        <span class="event-title">${event.title}</span>
                        <span class="importance-badge">${event.importance}</span>
                    </div>
                    <div class="event-forecast">
                        <span>Previous: ${event.previous || 'N/A'}</span>
                        <span>Forecast: ${event.forecast || 'N/A'}</span>
                        <span>Actual: ${event.actual || 'Pending...'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    getTimeUntil(datetime) {
        const now = new Date();
        const eventDate = new Date(datetime);
        const diff = eventDate - now;
        
        if (diff < 0) return 'Released';
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    }

    getCountryFlag(country) {
        const flags = {
            'US': '🇺🇸',
            'EU': '🇪🇺',
            'UK': '🇬🇧',
            'JP': '🇯🇵',
            'CN': '🇨🇳'
        };
        return flags[country] || '🌍';
    }
}
