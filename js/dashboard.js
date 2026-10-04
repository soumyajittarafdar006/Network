/**
 * ============================================================================
 * SMART NETWORK MONITORING SYSTEM - DASHBOARD UI CONTROLLER
 * ============================================================================
 * Handles UI interactions, DOM updates, table rendering, search/filter/sort,
 * alerts log updates, and device details modal dialogs.
 */

const Dashboard = {
    currentDevices: [],
    currentAlerts: [],
    sortColumn: 'name',
    sortAscending: true,
    activeDeviceModalIp: null,

    /**
     * Initialize dashboard UI components & event listeners
     */
    init() {
        this.bindEvents();
    },

    /**
     * Bind all DOM UI event handlers
     */
    bindEvents() {
        // Search & Filter Events
        const searchInput = document.getElementById('device-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.renderDevicesTable());
        }

        const filterSelect = document.getElementById('device-filter-status');
        if (filterSelect) {
            filterSelect.addEventListener('change', () => this.renderDevicesTable());
        }

        // Table Header Sorting
        const tableHeaders = document.querySelectorAll('#devices-table th[data-sort]');
        tableHeaders.forEach(th => {
            th.addEventListener('click', () => {
                const col = th.getAttribute('data-sort');
                if (this.sortColumn === col) {
                    this.sortAscending = !this.sortAscending;
                } else {
                    this.sortColumn = col;
                    this.sortAscending = true;
                }
                this.renderDevicesTable();
            });
        });

        // Table Refresh Button
        const refreshBtn = document.getElementById('table-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                refreshBtn.classList.add('fa-spin');
                this.showToast("Syncing latest telemetry ping data...", "toast-blue");
                App.fetchData().then(() => {
                    setTimeout(() => refreshBtn.classList.remove('fa-spin'), 600);
                });
            });
        }

        // Modal Close Buttons
        const modalCloseBtn = document.getElementById('modal-close-btn');
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', () => this.closeDeviceModal());
        }

        const modalOverlay = document.getElementById('device-modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) this.closeDeviceModal();
            });
        }

        // Add Device Modal Triggers
        const addDeviceBtn = document.getElementById('add-device-btn');
        const addDeviceModalBtn = document.getElementById('add-device-modal-btn');
        if (addDeviceBtn) addDeviceBtn.addEventListener('click', () => this.openAddDeviceModal());
        if (addDeviceModalBtn) addDeviceModalBtn.addEventListener('click', () => this.openAddDeviceModal());

        const addModalClose = document.getElementById('add-modal-close-btn');
        const addModalCancel = document.getElementById('add-modal-cancel-btn');
        if (addModalClose) addModalClose.addEventListener('click', () => this.closeAddDeviceModal());
        if (addModalCancel) addModalCancel.addEventListener('click', () => this.closeAddDeviceModal());

        // Add Device Form Submit
        const addForm = document.getElementById('add-device-form');
        if (addForm) {
            addForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('add-name').value;
                const ip = document.getElementById('add-ip').value;
                const type = document.getElementById('add-type').value;

                const newDev = await NetworkAPI.addDevice({ name, ip, type });
                this.showToast(`Device ${name} registered successfully!`, 'toast-green');
                this.closeAddDeviceModal();
                addForm.reset();
                App.fetchData();
            });
        }

        // Modal Action: Manual ICMP Ping Test
        const pingBtn = document.getElementById('modal-ping-btn');
        if (pingBtn) {
            pingBtn.addEventListener('click', async () => {
                if (!this.activeDeviceModalIp) return;
                pingBtn.disabled = true;
                pingBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending ICMP Ping...';
                
                const pingRes = await NetworkAPI.pingDevice(this.activeDeviceModalIp);
                
                setTimeout(() => {
                    pingBtn.disabled = false;
                    pingBtn.innerHTML = '<i class="fa-solid fa-wifi"></i> Run Manual ICMP Ping Test';
                    
                    if (pingRes.success) {
                        this.showToast(`Ping reply from ${pingRes.ip}: time=${pingRes.latency}ms`, 'toast-green');
                    } else {
                        this.showToast(`Ping failed to ${pingRes.ip}: Request timed out`, 'toast-red');
                    }
                    this.appendModalHistoryLog(`[PING] ICMP echo reply from ${pingRes.ip}: latency=${pingRes.latency}ms`);
                }, 400);
            });
        }

        // Modal Action: Send Reboot Reset Signal
        const rebootBtn = document.getElementById('modal-reboot-btn');
        if (rebootBtn) {
            rebootBtn.addEventListener('click', async () => {
                if (!this.activeDeviceModalIp) return;
                if (confirm(`Send emergency restart signal to ${this.activeDeviceModalIp}?`)) {
                    await NetworkAPI.rebootDevice(this.activeDeviceModalIp);
                    this.showToast(`Reboot signal dispatched to ${this.activeDeviceModalIp}`, 'toast-yellow');
                    this.appendModalHistoryLog(`[RESET] Remote soft-reset command issued by NetAdmin`);
                    App.fetchData();
                }
            });
        }

        // Clear Alerts
        const clearAlertsBtn = document.getElementById('clear-alerts-btn');
        if (clearAlertsBtn) {
            clearAlertsBtn.addEventListener('click', () => {
                this.currentAlerts = [];
                this.updateAlerts([]);
                this.showToast("Alert log cleared", "toast-blue");
            });
        }
    },

    /**
     * UPDATE SUMMARY STATISTICS CARDS
     * Called when telemetry updates
     */
    updateStatistics(stats) {
        if (!stats) return;

        const totalEl = document.getElementById('stat-total-devices');
        const onlineEl = document.getElementById('stat-online-devices');
        const offlineEl = document.getElementById('stat-offline-devices');
        const latencyEl = document.getElementById('stat-avg-latency');
        const lossEl = document.getElementById('stat-packet-loss');
        const uptimeEl = document.getElementById('stat-uptime');

        if (totalEl) totalEl.innerText = stats.totalDevices;
        if (onlineEl) onlineEl.innerText = stats.onlineDevices;
        if (offlineEl) offlineEl.innerText = stats.offlineDevices;
        if (latencyEl) latencyEl.innerHTML = `${stats.avgLatency} <span class="unit">ms</span>`;
        if (lossEl) lossEl.innerHTML = `${stats.packetLoss}<span class="unit">%</span>`;
        if (uptimeEl) uptimeEl.innerHTML = `${stats.networkUptime}<span class="unit">%</span>`;

        // Update Performance Metrics section bars
        const perfAvg = document.getElementById('perf-avg-latency');
        const perfLoss = document.getElementById('perf-packet-loss');
        const perfBarLatency = document.getElementById('perf-bar-latency');

        if (perfAvg) perfAvg.innerText = `${stats.avgLatency} ms`;
        if (perfLoss) perfLoss.innerText = `${stats.packetLoss}%`;
        if (perfBarLatency) perfBarLatency.style.width = `${Math.min(stats.avgLatency * 2, 100)}%`;

        // Update Doughnut Chart
        if (window.NetworkCharts) {
            NetworkCharts.updateDeviceStatus(stats.onlineDevices, stats.warningDevices, stats.offlineDevices);
        }
    },

    /**
     * UPDATE DEVICES LIST & TABLE
     */
    updateDevices(devicesList) {
        this.currentDevices = devicesList || [];
        this.renderDevicesTable();
        this.renderFullDevicesGrid();
    },

    /**
     * Render Live Network Status Table with Search, Filter & Sort
     */
    renderDevicesTable() {
        const tbody = document.getElementById('devices-table-body');
        if (!tbody) return;

        const searchVal = (document.getElementById('device-search-input')?.value || '').toLowerCase();
        const filterVal = document.getElementById('device-filter-status')?.value || 'all';

        // 1. Filter
        let filtered = this.currentDevices.filter(dev => {
            const matchesSearch = dev.name.toLowerCase().includes(searchVal) ||
                                  dev.ip.toLowerCase().includes(searchVal) ||
                                  dev.type.toLowerCase().includes(searchVal);
            const matchesStatus = filterVal === 'all' || dev.status === filterVal;
            return matchesSearch && matchesStatus;
        });

        // 2. Sort
        filtered.sort((a, b) => {
            let valA = a[this.sortColumn];
            let valB = b[this.sortColumn];

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return this.sortAscending ? -1 : 1;
            if (valA > valB) return this.sortAscending ? 1 : -1;
            return 0;
        });

        // 3. Render HTML
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--text-muted); padding: 24px;">No devices matched search query.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(dev => {
            let statusBadge = `<span class="badge badge-success"><span class="status-indicator status-online"></span> Online</span>`;
            if (dev.status === 'offline') {
                statusBadge = `<span class="badge badge-danger"><span class="status-indicator status-offline"></span> Offline</span>`;
            } else if (dev.status === 'warning') {
                statusBadge = `<span class="badge badge-warning"><span class="status-indicator status-warning"></span> Warning</span>`;
            }

            let typeIcon = 'fa-desktop';
            if (dev.type === 'Laptop') typeIcon = 'fa-laptop';
            if (dev.type === 'IoT Device') typeIcon = 'fa-microchip';
            if (dev.type === 'Server') typeIcon = 'fa-server';
            if (dev.type === 'Router') typeIcon = 'fa-wifi';

            const latencyDisplay = dev.status === 'offline' ? '—' : `${dev.latency} ms`;
            const packetLossDisplay = dev.status === 'offline' ? '—' : `${dev.packetLoss}%`;

            return `
                <tr onclick="Dashboard.openDeviceModalByIp('${dev.ip}')">
                    <td>
                        <div class="device-cell">
                            <div class="device-type-icon"><i class="fa-solid ${typeIcon}"></i></div>
                            <span>${dev.name}</span>
                        </div>
                    </td>
                    <td><code class="ip-code">${dev.ip}</code></td>
                    <td>${dev.type}</td>
                    <td>${statusBadge}</td>
                    <td><strong class="${dev.latency > 50 ? 'text-yellow' : ''}">${latencyDisplay}</strong></td>
                    <td>${packetLossDisplay}</td>
                    <td style="color: var(--text-muted);">${dev.lastSeen}</td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); Dashboard.openDeviceModalByIp('${dev.ip}')">
                            Inspect
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    /**
     * Render Devices View Grid Tab
     */
    renderFullDevicesGrid() {
        const container = document.getElementById('full-devices-container');
        if (!container) return;

        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px;">
                ${this.currentDevices.map(dev => `
                    <div class="stat-card" onclick="Dashboard.openDeviceModalByIp('${dev.ip}')" style="cursor: pointer;">
                        <div class="card-header-row">
                            <strong>${dev.name}</strong>
                            <span class="badge ${dev.status==='online'?'badge-success':(dev.status==='warning'?'badge-warning':'badge-danger')}">${dev.status}</span>
                        </div>
                        <div class="card-body">
                            <code class="ip-code">${dev.ip}</code>
                            <div style="margin-top: 8px; font-size: 0.8rem; color: var(--text-muted);">
                                Type: ${dev.type}<br>
                                Latency: ${dev.latency}ms | Uptime: ${dev.uptime}%
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    /**
     * UPDATE RECENT ALERTS LIST
     */
    updateAlerts(alertsList) {
        this.currentAlerts = alertsList || [];
        const container = document.getElementById('alerts-list-container');
        const badge = document.getElementById('alerts-badge');
        const fullAlertsContainer = document.getElementById('full-alerts-container');

        if (badge) badge.innerText = this.currentAlerts.length;

        if (container) {
            if (this.currentAlerts.length === 0) {
                container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">No recent alert events. All systems nominal.</div>`;
            } else {
                container.innerHTML = this.currentAlerts.map(alert => `
                    <div class="alert-item sev-${alert.severity}">
                        <i class="fa-solid ${alert.icon || 'fa-bell'} alert-icon"></i>
                        <div class="alert-content">
                            <div class="alert-message">${alert.message}</div>
                            <span class="alert-time">${alert.timestamp}</span>
                        </div>
                    </div>
                `).join('');
            }
        }

        if (fullAlertsContainer) {
            fullAlertsContainer.innerHTML = container ? container.innerHTML : '';
        }
    },

    /**
     * OPEN DEVICE DETAILS MODAL
     */
    openDeviceModalByIp(ip) {
        const device = this.currentDevices.find(d => d.ip === ip);
        if (!device) return;

        this.activeDeviceModalIp = ip;

        document.getElementById('modal-device-name').innerText = device.name;
        document.getElementById('modal-device-type').innerText = device.type;
        document.getElementById('modal-ip').innerText = device.ip;
        document.getElementById('modal-mac').innerText = device.mac || '00:1A:2B:3C:4D:5E';
        document.getElementById('modal-latency').innerText = device.status === 'offline' ? '—' : `${device.latency} ms`;
        document.getElementById('modal-packet-loss').innerText = `${device.packetLoss}%`;
        document.getElementById('modal-uptime').innerText = `${device.uptime}%`;
        document.getElementById('modal-last-seen').innerText = device.lastSeen;

        const badge = document.getElementById('modal-status-badge');
        if (badge) {
            badge.className = `badge ${device.status==='online'?'badge-success':(device.status==='warning'?'badge-warning':'badge-danger')}`;
            badge.innerText = device.status.toUpperCase();
        }

        // Populate mock history chart data for this device
        const mockPingHistory = Array.from({ length: 15 }, () => device.status === 'offline' ? 0 : Math.floor(Math.random() * 20) + (device.latency - 5));
        if (window.NetworkCharts) {
            NetworkCharts.renderModalDeviceChart(mockPingHistory);
        }

        // Populate Connection Log
        const logList = document.getElementById('modal-history-list');
        if (logList) {
            const timeNow = new Date().toLocaleTimeString();
            logList.innerHTML = `
                <li><span class="time">[${timeNow}]</span> Handshake verified on port 443 / ICMP Ping OK</li>
                <li><span class="time">[${timeNow}]</span> Subnet route 192.168.1.0/24 active</li>
                <li><span class="time">[${timeNow}]</span> Packet loss: ${device.packetLoss}% | Status: ${device.status}</li>
            `;
        }

        const modal = document.getElementById('device-modal-overlay');
        if (modal) modal.classList.add('active');
    },

    closeDeviceModal() {
        const modal = document.getElementById('device-modal-overlay');
        if (modal) modal.classList.remove('active');
        this.activeDeviceModalIp = null;
    },

    appendModalHistoryLog(msg) {
        const logList = document.getElementById('modal-history-list');
        if (logList) {
            const timeNow = new Date().toLocaleTimeString();
            logList.insertAdjacentHTML('afterbegin', `<li><span class="time">[${timeNow}]</span> ${msg}</li>`);
        }
    },

    openAddDeviceModal() {
        const modal = document.getElementById('add-device-modal');
        if (modal) modal.classList.add('active');
    },

    closeAddDeviceModal() {
        const modal = document.getElementById('add-device-modal');
        if (modal) modal.classList.remove('active');
    },

    /**
     * TOAST NOTIFICATION STACK
     */
    showToast(message, type = 'toast-blue') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> <span>${message}</span>`;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
};

window.Dashboard = Dashboard;
