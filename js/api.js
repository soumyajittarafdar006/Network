/**
 * ============================================================================
 * SMART NETWORK MONITORING SYSTEM - API SERVICE LAYER
 * ============================================================================
 * This module abstracts data fetching for the NOC Network Monitoring Dashboard.
 *
 * BACKEND / API INTEGRATION GUIDE:
 * 1. Change `API_BASE_URL` below to your real backend server address (e.g. Node.js Express, Python FastAPI, Flask).
 * 2. Set `USE_MOCK_DATA = false` when your REST API endpoints are active.
 * 3. Standard REST API endpoints expected:
 *      GET  /api/devices          -> Array of device objects
 *      GET  /api/stats            -> Summary statistics object
 *      GET  /api/alerts           -> Array of alert objects
 *      POST /api/devices/ping     -> Pings a target IP
 *      POST /api/devices          -> Adds a new monitored device
 *
 * WEBSOCKET STREAMING INTEGRATION (Optional for Real-time push):
 *      const ws = new WebSocket('ws://localhost:3000/ws/network');
 *      ws.onmessage = (event) => {
 *          const data = JSON.parse(event.data);
 *          Dashboard.handleRealtimeUpdate(data);
 *      };
 */

// Configurable API Base URL
let API_BASE_URL = "http://localhost:3000/api";

// Toggle between Mock Data Engine and Real API backend
let USE_MOCK_DATA = true;

// Initial 25 Monitored Network Devices Sample Database
const mockDevicesStore = [
    { id: 1, name: "Router-Gateway", ip: "192.168.1.1", mac: "A4:93:3F:11:22:33", type: "Router", status: "online", latency: 2, packetLoss: 0.0, uptime: 99.9, lastSeen: "Just now" },
    { id: 2, name: "Server-Core-NOC", ip: "192.168.1.2", mac: "00:1A:2B:44:55:66", type: "Server", status: "online", latency: 4, packetLoss: 0.0, uptime: 99.8, lastSeen: "Just now" },
    { id: 3, name: "PC-01", ip: "192.168.1.5", mac: "00:1A:2B:11:22:05", type: "Computer", status: "online", latency: 15, packetLoss: 0.0, uptime: 99.5, lastSeen: "Just now" },
    { id: 4, name: "PC-02", ip: "192.168.1.6", mac: "00:1A:2B:11:22:06", type: "Laptop", status: "online", latency: 21, packetLoss: 0.0, uptime: 98.9, lastSeen: "Just now" },
    { id: 5, name: "PC-03", ip: "192.168.1.7", mac: "00:1A:2B:11:22:07", type: "Computer", status: "offline", latency: 0, packetLoss: 100.0, uptime: 82.1, lastSeen: "2 min ago" },
    { id: 6, name: "ESP32-01", ip: "192.168.1.10", mac: "24:62:AB:E0:11:10", type: "IoT Device", status: "online", latency: 8, packetLoss: 0.0, uptime: 99.9, lastSeen: "Just now" },
    { id: 7, name: "NAS-Storage-01", ip: "192.168.1.15", mac: "90:E2:BA:12:34:56", type: "Server", status: "online", latency: 12, packetLoss: 0.1, uptime: 99.7, lastSeen: "Just now" },
    { id: 8, name: "IP-Camera-Entrance", ip: "192.168.1.25", mac: "BC:AD:28:99:88:77", type: "IoT Device", status: "warning", latency: 88, packetLoss: 2.4, uptime: 95.4, lastSeen: "Just now" },
    { id: 9, name: "Laptop-CEO", ip: "192.168.1.32", mac: "F4:D4:88:33:22:11", type: "Laptop", status: "online", latency: 19, packetLoss: 0.0, uptime: 99.1, lastSeen: "Just now" },
    { id: 10, name: "ESP32-TempSensor", ip: "192.168.1.42", mac: "24:62:AB:E0:11:42", type: "IoT Device", status: "online", latency: 11, packetLoss: 0.0, uptime: 99.6, lastSeen: "Just now" },
    { id: 11, name: "Workstation-05", ip: "192.168.1.55", mac: "00:1A:2B:55:66:77", type: "Computer", status: "offline", latency: 0, packetLoss: 100.0, uptime: 76.5, lastSeen: "15 min ago" },
    { id: 12, name: "Workstation-06", ip: "192.168.1.56", mac: "00:1A:2B:55:66:78", type: "Computer", status: "online", latency: 14, packetLoss: 0.0, uptime: 99.2, lastSeen: "Just now" },
    { id: 13, name: "Printer-Floor2", ip: "192.168.1.60", mac: "38:60:77:44:33:22", type: "Computer", status: "online", latency: 26, packetLoss: 0.0, uptime: 98.5, lastSeen: "Just now" },
    { id: 14, name: "AccessPoint-East", ip: "192.168.1.70", mac: "70:3A:0E:11:22:33", type: "Router", status: "online", latency: 6, packetLoss: 0.0, uptime: 99.9, lastSeen: "Just now" },
    { id: 15, name: "AccessPoint-West", ip: "192.168.1.71", mac: "70:3A:0E:11:22:34", type: "Router", status: "online", latency: 7, packetLoss: 0.0, uptime: 99.9, lastSeen: "Just now" },
    { id: 16, name: "VoIP-Phone-Lab", ip: "192.168.1.80", mac: "00:04:F2:aa:bb:cc", type: "IoT Device", status: "warning", latency: 64, packetLoss: 1.8, uptime: 96.0, lastSeen: "Just now" },
    { id: 17, name: "Dev-Board-RaspberryPi", ip: "192.168.1.90", mac: "B8:27:EB:12:34:56", type: "Computer", status: "online", latency: 16, packetLoss: 0.0, uptime: 99.0, lastSeen: "Just now" },
    { id: 18, name: "DB-Replica-Server", ip: "192.168.1.99", mac: "52:54:00:12:34:56", type: "Server", status: "online", latency: 5, packetLoss: 0.0, uptime: 99.95, lastSeen: "Just now" },
    { id: 19, name: "Backup-Vault-01", ip: "192.168.1.100", mac: "52:54:00:99:88:77", type: "Server", status: "offline", latency: 0, packetLoss: 100.0, uptime: 88.0, lastSeen: "1 hour ago" },
    { id: 20, name: "Smart-TV-ConfRoom", ip: "192.168.1.110", mac: "A0:0B:BA:11:22:33", type: "IoT Device", status: "online", latency: 32, packetLoss: 0.0, uptime: 97.4, lastSeen: "Just now" },
    { id: 21, name: "PC-Design-01", ip: "192.168.1.120", mac: "00:1A:2B:dd:ee:ff", type: "Computer", status: "online", latency: 18, packetLoss: 0.0, uptime: 99.1, lastSeen: "Just now" },
    { id: 22, name: "PC-Design-02", ip: "192.168.1.121", mac: "00:1A:2B:dd:ee:fe", type: "Computer", status: "online", latency: 22, packetLoss: 0.0, uptime: 98.7, lastSeen: "Just now" },
    { id: 23, name: "Workstation-Lab-01", ip: "192.168.1.130", mac: "00:1A:2B:99:11:22", type: "Computer", status: "offline", latency: 0, packetLoss: 100.0, uptime: 65.2, lastSeen: "3 hours ago" },
    { id: 24, name: "Laptop-Guest-01", ip: "192.168.1.145", mac: "AC:BC:32:11:22:33", type: "Laptop", status: "online", latency: 29, packetLoss: 0.0, uptime: 99.0, lastSeen: "Just now" },
    { id: 25, name: "ESP32-Gateway", ip: "192.168.1.200", mac: "24:62:AB:FF:EE:DD", type: "IoT Device", status: "online", latency: 9, packetLoss: 0.0, uptime: 99.9, lastSeen: "Just now" }
];

// Initial Incident Alert Stream
const mockAlertsStore = [
    { id: 101, severity: "red", icon: "fa-circle-xmark", message: "PC-03 went offline unexpectedly", timestamp: "2 minutes ago", read: false },
    { id: 102, severity: "yellow", icon: "fa-triangle-exclamation", message: "High latency detected on PC-02 (88ms)", timestamp: "5 minutes ago", read: false },
    { id: 103, severity: "green", icon: "fa-circle-check", message: "ESP32-01 reconnected & ping restored", timestamp: "10 minutes ago", read: true },
    { id: 104, severity: "yellow", icon: "fa-triangle-exclamation", message: "IP-Camera-Entrance frame latency spike", timestamp: "18 minutes ago", read: true },
    { id: 105, severity: "red", icon: "fa-circle-xmark", message: "Backup-Vault-01 ping timed out", timestamp: "1 hour ago", read: true }
];

// API Object Service Definition
const NetworkAPI = {

    /**
     * Get all monitored devices list
     * @returns {Promise<Array>}
     */
    async getDevices() {
        if (!USE_MOCK_DATA) {
            try {
                const response = await fetch(`${API_BASE_URL}/devices`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (error) {
                console.warn("API Error, falling back to mock data:", error);
                return [...mockDevicesStore];
            }
        }
        return new Promise(resolve => setTimeout(() => resolve([...mockDevicesStore]), 150));
    },

    /**
     * Get aggregated network statistics
     * @returns {Promise<Object>}
     */
    async getNetworkStats() {
        if (!USE_MOCK_DATA) {
            try {
                const response = await fetch(`${API_BASE_URL}/stats`);
                return await response.json();
            } catch (error) {
                console.warn("API Error fetching stats, using dynamic mock calculation");
            }
        }

        // Dynamically compute stats from mock store
        const total = mockDevicesStore.length;
        const onlineCount = mockDevicesStore.filter(d => d.status === 'online').length;
        const offlineCount = mockDevicesStore.filter(d => d.status === 'offline').length;
        const warningCount = mockDevicesStore.filter(d => d.status === 'warning').length;
        
        const activeDevices = mockDevicesStore.filter(d => d.status !== 'offline');
        const avgLatency = Math.round(activeDevices.reduce((acc, cur) => acc + cur.latency, 0) / (activeDevices.length || 1));
        const avgPacketLoss = (mockDevicesStore.reduce((acc, cur) => acc + cur.packetLoss, 0) / total).toFixed(1);

        return {
            totalDevices: total,
            onlineDevices: onlineCount,
            offlineDevices: offlineCount,
            warningDevices: warningCount,
            avgLatency: avgLatency,
            packetLoss: parseFloat(avgPacketLoss),
            networkUptime: 98.4
        };
    },

    /**
     * Get recent alerts list
     * @returns {Promise<Array>}
     */
    async getAlerts() {
        if (!USE_MOCK_DATA) {
            try {
                const response = await fetch(`${API_BASE_URL}/alerts`);
                return await response.json();
            } catch (e) { console.warn("API Error, returning mock alerts"); }
        }
        return [...mockAlertsStore];
    },

    /**
     * Execute ping test to target IP
     * @param {string} ip 
     * @returns {Promise<Object>}
     */
    async pingDevice(ip) {
        if (!USE_MOCK_DATA) {
            try {
                const response = await fetch(`${API_BASE_URL}/devices/ping`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ip })
                });
                return await response.json();
            } catch (e) { console.warn("API Ping failed"); }
        }

        const device = mockDevicesStore.find(d => d.ip === ip);
        const simLatency = device ? (device.status === 'offline' ? 0 : Math.floor(Math.random() * 25) + 5) : Math.floor(Math.random() * 30) + 10;
        
        return new Promise(resolve => setTimeout(() => resolve({
            ip: ip,
            success: device ? device.status !== 'offline' : true,
            latency: simLatency,
            packetLoss: device && device.status === 'offline' ? 100 : 0,
            timestamp: new Date().toLocaleTimeString()
        }), 300));
    },

    /**
     * Add new device to monitoring list
     * @param {Object} newDevice 
     * @returns {Promise<Object>}
     */
    async addDevice(newDevice) {
        const deviceObj = {
            id: mockDevicesStore.length + 1,
            name: newDevice.name,
            ip: newDevice.ip,
            mac: `00:1A:2B:${Math.floor(Math.random()*89+10)}:${Math.floor(Math.random()*89+10)}:${Math.floor(Math.random()*89+10)}`,
            type: newDevice.type,
            status: "online",
            latency: Math.floor(Math.random() * 20) + 5,
            packetLoss: 0.0,
            uptime: 100.0,
            lastSeen: "Just now"
        };

        if (!USE_MOCK_DATA) {
            try {
                const res = await fetch(`${API_BASE_URL}/devices`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(deviceObj)
                });
                return await res.json();
            } catch (e) { console.warn("API add device fallback to local store"); }
        }

        mockDevicesStore.unshift(deviceObj);
        return deviceObj;
    },

    /**
     * Send Reboot Signal
     * @param {string} ip 
     * @returns {Promise<Object>}
     */
    async rebootDevice(ip) {
        const dev = mockDevicesStore.find(d => d.ip === ip);
        if (dev) {
            dev.status = 'warning';
            dev.lastSeen = 'Rebooting...';
            setTimeout(() => {
                dev.status = 'online';
                dev.lastSeen = 'Just now';
            }, 5000);
        }
        return { success: true, message: `Reboot command sent to ${ip}` };
    }
};

// Expose globally
window.NetworkAPI = NetworkAPI;
window.mockDevicesStore = mockDevicesStore;
window.mockAlertsStore = mockAlertsStore;
