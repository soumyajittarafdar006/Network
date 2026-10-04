/**
 * ============================================================================
 * SMART NETWORK MONITORING SYSTEM - MAIN APP ENTRY POINT
 * ============================================================================
 * Orchestrates API calls, tab switching, live clock tick, theme toggle,
 * and the DEMO MODE real-time telemetry simulation engine.
 */

const App = {
    demoInterval: null,
    pollingIntervalSeconds: 3,

    async init() {
        console.log("Initializing Smart Network Monitoring System...");

        // 1. Initialize Modules
        Dashboard.init();
        if (window.NetworkCharts) NetworkCharts.init();
        if (window.NetworkTopology) NetworkTopology.init();

        // 2. Setup UI Handlers (Tabs, Theme, Sidebar, Clock)
        this.setupNavigation();
        this.setupThemeToggle();
        this.setupSidebarToggle();
        this.startLiveClock();
        this.setupSettingsForm();

        // 3. Initial Data Load
        await this.fetchData();

        // 4. Start Real-Time Simulation Engine (Demo Mode)
        this.startDemoSimulation();

        // Welcome toast
        setTimeout(() => {
            Dashboard.showToast("Network Operations Center Active. Monitoring 25 Nodes.", "toast-green");
        }, 500);
    },

    /**
     * Fetch all data from API/Mock service layer
     */
    async fetchData() {
        const [devices, stats, alerts] = await Promise.all([
            NetworkAPI.getDevices(),
            NetworkAPI.getNetworkStats(),
            NetworkAPI.getAlerts()
        ]);

        Dashboard.updateDevices(devices);
        Dashboard.updateStatistics(stats);
        Dashboard.updateAlerts(alerts);
        if (window.NetworkTopology) NetworkTopology.render();
    },

    /**
     * Navigation & View Tab Switching
     */
    setupNavigation() {
        const navLinks = document.querySelectorAll('[data-tab]');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetTab = link.getAttribute('data-tab');
                if (!targetTab) return;

                // Update active state on nav items & sidebar items
                document.querySelectorAll('[data-tab]').forEach(el => {
                    if (el.getAttribute('data-tab') === targetTab) {
                        el.classList.add('active');
                    } else {
                        el.classList.remove('active');
                    }
                });

                // Switch visible section
                document.querySelectorAll('.view-tab').forEach(sec => {
                    sec.classList.remove('active');
                });

                const targetSec = document.getElementById(`view-${targetTab}`);
                if (targetSec) {
                    targetSec.classList.add('active');
                }

                // If topology tab opened, force SVG redraw
                if (targetTab === 'topology' && window.NetworkTopology) {
                    NetworkTopology.render();
                }
            });
        });
    },

    /**
     * Dark/Light Mode Theme Toggle
     */
    setupThemeToggle() {
        const themeBtn = document.getElementById('theme-toggle-btn');
        const savedTheme = localStorage.getItem('noc_theme') || 'dark';

        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);

        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('noc_theme', newTheme);
                this.updateThemeIcon(newTheme);

                // Re-render topology & charts for theme contrast
                if (window.NetworkTopology) NetworkTopology.render();
                if (window.NetworkCharts) NetworkCharts.init();
            });
        }
    },

    updateThemeIcon(theme) {
        const themeBtn = document.getElementById('theme-toggle-btn');
        if (!themeBtn) return;
        themeBtn.innerHTML = theme === 'dark' 
            ? '<i class="fa-solid fa-sun" style="color: #d29922;"></i>' 
            : '<i class="fa-solid fa-moon"></i>';
    },

    /**
     * Collapsible Sidebar Handler
     */
    setupSidebarToggle() {
        const toggleBtn = document.getElementById('sidebar-toggle-btn');
        const sidebar = document.getElementById('sidebar');

        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                sidebar.classList.toggle('open');
            });
        }
    },

    /**
     * Real-Time Clock tick display
     */
    startLiveClock() {
        const clockEl = document.getElementById('current-time');
        const updateClock = () => {
            const now = new Date();
            if (clockEl) {
                clockEl.innerText = `${now.toLocaleTimeString()} UTC`;
            }
        };
        updateClock();
        setInterval(updateClock, 1000);
    },

    /**
     * Settings Page Handlers
     */
    setupSettingsForm() {
        const form = document.getElementById('settings-form');
        const demoCheckbox = document.getElementById('demo-mode-checkbox');

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                API_BASE_URL = document.getElementById('api-base-url-input').value;
                this.pollingIntervalSeconds = parseInt(document.getElementById('polling-interval-input').value) || 3;
                
                USE_MOCK_DATA = demoCheckbox ? demoCheckbox.checked : true;
                
                const badge = document.getElementById('demo-mode-badge');
                if (badge) badge.style.display = USE_MOCK_DATA ? 'flex' : 'none';

                Dashboard.showToast("Settings saved. Reconfiguring telemetry engine...", "toast-green");
                
                this.startDemoSimulation();
            });
        }

        // Demo badge click toggle
        const demoBadge = document.getElementById('demo-mode-badge');
        if (demoBadge) {
            demoBadge.addEventListener('click', () => {
                USE_MOCK_DATA = !USE_MOCK_DATA;
                demoBadge.style.opacity = USE_MOCK_DATA ? '1' : '0.4';
                Dashboard.showToast(USE_MOCK_DATA ? "DEMO MODE active (simulated data)" : "Switched to REAL API mode", "toast-yellow");
            });
        }
    },

    /**
     * DEMO MODE REAL-TIME TELEMETRY SIMULATION ENGINE
     * Simulates periodic network fluctuation ticks:
     * - Latency random jitter (±3ms)
     * - Updates Chart.js live sliding window graph
     * - Random alert event generation
     */
    startDemoSimulation() {
        if (this.demoInterval) clearInterval(this.demoInterval);

        this.demoInterval = setInterval(async () => {
            if (!USE_MOCK_DATA) return;

            // 1. Mutate mock store latency slightly
            let onlineDevices = mockDevicesStore.filter(d => d.status !== 'offline');
            onlineDevices.forEach(d => {
                const delta = Math.floor(Math.random() * 7) - 3; // -3 to +3 ms
                d.latency = Math.max(2, d.latency + delta);
            });

            // 2. Compute new average latency
            const avgLat = Math.round(onlineDevices.reduce((acc, c) => acc + c.latency, 0) / onlineDevices.length);

            // 3. Push point to Chart.js
            const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            if (window.NetworkCharts) {
                NetworkCharts.addLatencyDataPoint(nowTime, avgLat);
            }

            // 4. Random 15% chance to simulate a ping alert
            if (Math.random() < 0.15) {
                const targetDev = onlineDevices[Math.floor(Math.random() * onlineDevices.length)];
                if (targetDev && targetDev.latency > 45) {
                    const alertObj = {
                        id: Date.now(),
                        severity: "yellow",
                        icon: "fa-triangle-exclamation",
                        message: `High latency peak detected on ${targetDev.name} (${targetDev.latency}ms)`,
                        timestamp: "Just now"
                    };
                    mockAlertsStore.unshift(alertObj);
                    if (mockAlertsStore.length > 8) mockAlertsStore.pop();
                    Dashboard.updateAlerts(mockAlertsStore);
                }
            }

            // 5. Update UI stats & table
            const stats = await NetworkAPI.getNetworkStats();
            Dashboard.updateStatistics(stats);
            Dashboard.renderDevicesTable();

        }, this.pollingIntervalSeconds * 1000);
    }
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
