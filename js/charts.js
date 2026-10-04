/**
 * ============================================================================
 * SMART NETWORK MONITORING SYSTEM - CHART.JS MODULE
 * ============================================================================
 * Manages all Chart.js visual graphs:
 * - Real-Time Network Latency Line Chart (with gradient fill & live sliding window)
 * - Device Status Distribution Doughnut Chart (with center count rendering)
 * - Modal Single Device History Telemetry Chart
 * - Analytics Bandwidth vs Latency Multi-Axis Chart
 */

let latencyChartInstance = null;
let deviceStatusChartInstance = null;
let modalDeviceChartInstance = null;
let analyticsChartInstance = null;

// Initial real-time time series data points
const initialTimeLabels = ["10:00", "10:01", "10:02", "10:03", "10:04", "10:05", "10:06", "10:07", "10:08", "10:09"];
const initialLatencyData = [15, 18, 12, 25, 21, 19, 23, 20, 24, 23];

const NetworkCharts = {

    /**
     * Initialize all system charts
     */
    init() {
        this.initLatencyChart();
        this.initDeviceStatusChart(21, 2, 4);
        this.initAnalyticsChart();
    },

    /**
     * Initialize Real-Time Latency Line Chart
     */
    initLatencyChart() {
        const ctx = document.getElementById('latencyChart');
        if (!ctx) return;

        // Create canvas gradient
        const canvasCtx = ctx.getContext('2d');
        const gradient = canvasCtx.createLinearGradient(0, 0, 0, 280);
        gradient.addColorStop(0, 'rgba(88, 166, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(88, 166, 255, 0.0)');

        latencyChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [...initialTimeLabels],
                datasets: [{
                    label: 'Avg Network Latency (ms)',
                    data: [...initialLatencyData],
                    borderColor: '#58a6ff',
                    borderWidth: 2.5,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#58a6ff',
                    pointHoverRadius: 7,
                    pointHoverBackgroundColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 400 },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#161c27',
                        borderColor: '#273142',
                        borderWidth: 1,
                        titleColor: '#e6edf3',
                        bodyColor: '#58a6ff',
                        padding: 10,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return ` Latency: ${context.parsed.y} ms`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#8b949e', font: { family: 'JetBrains Mono', size: 11 } }
                    },
                    y: {
                        beginAtZero: true,
                        suggestedMax: 50,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: {
                            color: '#8b949e',
                            font: { family: 'JetBrains Mono', size: 11 },
                            callback: value => value + ' ms'
                        }
                    }
                }
            }
        });
    },

    /**
     * Dynamic update for Latency line chart (pushes new live point)
     * @param {string} timeLabel 
     * @param {number} newLatency 
     */
    addLatencyDataPoint(timeLabel, newLatency) {
        if (!latencyChartInstance) return;

        const data = latencyChartInstance.data;
        data.labels.push(timeLabel);
        data.datasets[0].data.push(newLatency);

        // Keep maximum 15 sliding window points
        if (data.labels.length > 15) {
            data.labels.shift();
            data.datasets[0].data.shift();
        }

        latencyChartInstance.update('none'); // smooth tick without full re-render animation
    },

    /**
     * Initialize Device Status Doughnut Chart
     */
    initDeviceStatusChart(online, warning, offline) {
        const ctx = document.getElementById('deviceStatusChart');
        if (!ctx) return;

        const total = online + warning + offline;

        // Custom Plugin to render total count in center of doughnut
        const centerTextPlugin = {
            id: 'centerTextPlugin',
            afterDraw(chart) {
                const { ctx, chartArea: { width, height, top, left } } = chart;
                ctx.save();
                
                const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
                
                // Draw Total Number
                ctx.font = 'bold 24px "JetBrains Mono", monospace';
                ctx.fillStyle = isDark ? '#e6edf3' : '#0f172a';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(total, left + width / 2, top + height / 2 - 8);

                // Draw Label Below
                ctx.font = '500 11px Inter, sans-serif';
                ctx.fillStyle = isDark ? '#8b949e' : '#64748b';
                ctx.fillText('MONITORED', left + width / 2, top + height / 2 + 14);

                ctx.restore();
            }
        };

        deviceStatusChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Online Devices', 'Warning Devices', 'Offline Devices'],
                datasets: [{
                    data: [online, warning, offline],
                    backgroundColor: ['#3fb950', '#d29922', '#f85149'],
                    borderColor: '#161c27',
                    borderWidth: 3,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '74%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#161c27',
                        borderColor: '#273142',
                        borderWidth: 1,
                        padding: 10
                    }
                }
            },
            plugins: [centerTextPlugin]
        });

        this.renderDeviceLegend(online, warning, offline);
    },

    /**
     * Render doughnut HTML legend below chart
     */
    renderDeviceLegend(online, warning, offline) {
        const legendContainer = document.getElementById('device-status-legend');
        if (!legendContainer) return;

        legendContainer.innerHTML = `
            <div class="legend-item"><span class="node-dot online"></span> <strong>${online}</strong> Online</div>
            <div class="legend-item"><span class="node-dot warning"></span> <strong>${warning}</strong> Warning</div>
            <div class="legend-item"><span class="node-dot offline"></span> <strong>${offline}</strong> Offline</div>
        `;
    },

    /**
     * Update Doughnut Data
     */
    updateDeviceStatus(online, warning, offline) {
        if (!deviceStatusChartInstance) return;

        deviceStatusChartInstance.data.datasets[0].data = [online, warning, offline];
        deviceStatusChartInstance.update();
        this.renderDeviceLegend(online, warning, offline);
    },

    /**
     * Render Single Device Latency History Chart in Modal
     */
    renderModalDeviceChart(historyData) {
        const ctx = document.getElementById('modalDeviceChart');
        if (!ctx) return;

        if (modalDeviceChartInstance) {
            modalDeviceChartInstance.destroy();
        }

        const labels = historyData.map((_, idx) => `T-${historyData.length - idx}s`);

        modalDeviceChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Ping (ms)',
                    data: historyData,
                    backgroundColor: historyData.map(v => v > 50 ? 'rgba(210, 153, 34, 0.8)' : (v === 0 ? 'rgba(248, 81, 73, 0.8)' : 'rgba(63, 185, 80, 0.7)')),
                    borderRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#8b949e', font: { size: 9 } } },
                    y: { beginAtZero: true, ticks: { color: '#8b949e', font: { size: 9 } } }
                }
            }
        });
    },

    /**
     * Analytics Page Multi-Axis Bandwidth Chart
     */
    initAnalyticsChart() {
        const ctx = document.getElementById('analyticsChart');
        if (!ctx) return;

        const hours = ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];

        analyticsChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: hours,
                datasets: [
                    {
                        label: 'Inbound Throughput (Mbps)',
                        data: [120, 95, 80, 140, 450, 820, 950, 890, 910, 780, 620, 340],
                        borderColor: '#39c5bb',
                        backgroundColor: 'rgba(57, 197, 187, 0.1)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Outbound Throughput (Mbps)',
                        data: [45, 30, 25, 60, 210, 410, 520, 480, 510, 390, 280, 150],
                        borderColor: '#bc8cff',
                        backgroundColor: 'rgba(188, 140, 255, 0.1)',
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#e6edf3', font: { family: 'Inter' } } }
                },
                scales: {
                    x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#8b949e' } },
                    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#8b949e', callback: v => v + ' Mbps' } }
                }
            }
        });
    }
};

window.NetworkCharts = NetworkCharts;
