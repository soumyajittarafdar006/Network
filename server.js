/**
 * ============================================================================
 * SMART NETWORK MONITORING SYSTEM - NODE.JS BACKEND SERVER WITH AUTHENTICATION
 * ============================================================================
 * Pure Node.js REST API & Static Asset HTTP Server (No external npm packages required).
 *
 * REST API ENDPOINTS:
 * - POST /api/login           -> Authenticates NOC user credentials
 * - POST /api/logout          -> Invalidates active NOC user session
 * - GET  /api/user            -> Retrieves current user profile info
 * - GET  /api/devices         -> Returns array of monitored device objects
 * - GET  /api/stats           -> Returns aggregate NOC telemetry statistics
 * - GET  /api/alerts          -> Returns active incident alert log
 * - POST /api/devices/ping    -> Triggers live ping test to specified IP
 * - POST /api/devices         -> Adds a new device to monitoring inventory
 * - POST /api/devices/reboot  -> Sends simulated remote restart signal
 *
 * USAGE:
 *      node server.js
 *      Server will start at: http://localhost:3000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3000;

// Hardcoded Valid User Credentials (for NOC project demo)
const VALID_USERS = [
    { username: 'admin', password: 'admin123', name: 'NetAdmin', role: 'Superuser', avatar: 'fa-user-shield' },
    { username: 'operator', password: 'user123', name: 'NetOperator', role: 'Operator', avatar: 'fa-user' }
];

// Active Sessions Store
const activeSessions = new Map();

// Default Monitored Device Database
let devicesStore = [
    { id: 1, name: "Local-Host-NOC", ip: "127.0.0.1", mac: "00:00:00:00:00:00", type: "Server", status: "online", latency: 1, packetLoss: 0.0, uptime: 99.9, lastSeen: "Just now" },
    { id: 2, name: "Google-DNS-Primary", ip: "8.8.8.8", mac: "00:1A:2B:88:88:88", type: "Router", status: "online", latency: 14, packetLoss: 0.0, uptime: 99.9, lastSeen: "Just now" },
    { id: 3, name: "Cloudflare-DNS", ip: "1.1.1.1", mac: "00:1A:2B:11:11:11", type: "Server", status: "online", latency: 12, packetLoss: 0.0, uptime: 99.8, lastSeen: "Just now" },
    { id: 4, name: "Router-Gateway", ip: "192.168.1.1", mac: "A4:93:3F:11:22:33", type: "Router", status: "online", latency: 2, packetLoss: 0.0, uptime: 99.9, lastSeen: "Just now" },
    { id: 5, name: "PC-01", ip: "192.168.1.5", mac: "00:1A:2B:11:22:05", type: "Computer", status: "online", latency: 15, packetLoss: 0.0, uptime: 99.5, lastSeen: "Just now" },
    { id: 6, name: "PC-02", ip: "192.168.1.6", mac: "00:1A:2B:11:22:06", type: "Laptop", status: "online", latency: 21, packetLoss: 0.0, uptime: 98.9, lastSeen: "Just now" },
    { id: 7, name: "PC-03", ip: "192.168.1.7", mac: "00:1A:2B:11:22:07", type: "Computer", status: "offline", latency: 0, packetLoss: 100.0, uptime: 82.1, lastSeen: "2 min ago" },
    { id: 8, name: "ESP32-01", ip: "192.168.1.10", mac: "24:62:AB:E0:11:10", type: "IoT Device", status: "online", latency: 8, packetLoss: 0.0, uptime: 99.9, lastSeen: "Just now" },
    { id: 9, name: "NAS-Storage-01", ip: "192.168.1.15", mac: "90:E2:BA:12:34:56", type: "Server", status: "online", latency: 12, packetLoss: 0.1, uptime: 99.7, lastSeen: "Just now" },
    { id: 10, name: "IP-Camera-Entrance", ip: "192.168.1.25", mac: "BC:AD:28:99:88:77", type: "IoT Device", status: "warning", latency: 88, packetLoss: 2.4, uptime: 95.4, lastSeen: "Just now" }
];

// Incident Alert Log
let alertsStore = [
    { id: 101, severity: "red", icon: "fa-circle-xmark", message: "PC-03 went offline unexpectedly", timestamp: "2 minutes ago", read: false },
    { id: 102, severity: "yellow", icon: "fa-triangle-exclamation", message: "High latency detected on IP-Camera-Entrance (88ms)", timestamp: "5 minutes ago", read: false },
    { id: 103, severity: "green", icon: "fa-circle-check", message: "ESP32-01 reconnected & ping restored", timestamp: "10 minutes ago", read: true }
];

/**
 * Execute system ICMP ping against target IP
 */
function systemPing(ip) {
    return new Promise((resolve) => {
        const isWin = process.platform === 'win32';
        const cmd = isWin ? `ping -n 1 -w 1000 ${ip}` : `ping -c 1 -W 1 ${ip}`;

        exec(cmd, (error, stdout) => {
            if (error || stdout.includes('timed out') || stdout.includes('unreachable') || stdout.includes('could not find host')) {
                return resolve({ online: false, latency: 0, packetLoss: 100 });
            }

            const match = stdout.match(/time[=<]([0-9]+)ms/i);
            const latency = match ? parseInt(match[1], 10) : 2;
            resolve({ online: true, latency: latency, packetLoss: 0 });
        });
    });
}

/**
 * Background-ping loop for real devices
 */
async function runBackgroundMonitoring() {
    for (let device of devicesStore) {
        if (device.ip === '127.0.0.1' || device.ip === '8.8.8.8' || device.ip === '1.1.1.1') {
            const res = await systemPing(device.ip);
            device.status = res.online ? 'online' : 'offline';
            device.latency = res.latency;
            device.packetLoss = res.packetLoss;
            device.lastSeen = 'Just now';
        } else if (device.status !== 'offline') {
            const jitter = Math.floor(Math.random() * 5) - 2;
            device.latency = Math.max(3, device.latency + jitter);
            device.lastSeen = 'Just now';
        }
    }
}
setInterval(runBackgroundMonitoring, 4000);

// MIME Types for Static File Serving
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// HTTP Server Callback
const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    const sendJSON = (statusCode, data) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    };

    const getRequestBody = () => new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try { resolve(JSON.parse(body || '{}')); }
            catch (e) { resolve({}); }
        });
    });

    // ==================== AUTHENTICATION ROUTING ====================

    // POST /api/login
    if (pathname === '/api/login' && req.method === 'POST') {
        const body = await getRequestBody();
        const user = VALID_USERS.find(u => u.username === body.username && u.password === body.password);

        if (!user) {
            return sendJSON(401, { success: false, error: "Invalid username or security password." });
        }

        const token = `noc_token_${user.username}_${Date.now()}`;
        const userInfo = { username: user.name, role: user.role, avatar: user.avatar };
        activeSessions.set(token, userInfo);

        return sendJSON(200, {
            success: true,
            token: token,
            user: userInfo
        });
    }

    // POST /api/logout
    if (pathname === '/api/logout' && req.method === 'POST') {
        const authHeader = req.headers['authorization'] || '';
        const token = authHeader.replace('Bearer ', '');
        activeSessions.delete(token);
        return sendJSON(200, { success: true, message: "Logged out successfully." });
    }

    // GET /api/user
    if (pathname === '/api/user' && req.method === 'GET') {
        const authHeader = req.headers['authorization'] || '';
        const token = authHeader.replace('Bearer ', '');
        const session = activeSessions.get(token);

        if (session) {
            return sendJSON(200, { authenticated: true, user: session });
        } else {
            return sendJSON(200, { authenticated: false, user: null });
        }
    }

    // ==================== TELEMETRY REST API ROUTING ====================

    // GET /api/devices
    if (pathname === '/api/devices' && req.method === 'GET') {
        return sendJSON(200, devicesStore);
    }

    // GET /api/stats
    if (pathname === '/api/stats' && req.method === 'GET') {
        const total = devicesStore.length;
        const onlineCount = devicesStore.filter(d => d.status === 'online').length;
        const offlineCount = devicesStore.filter(d => d.status === 'offline').length;
        const warningCount = devicesStore.filter(d => d.status === 'warning').length;

        const onlineDevices = devicesStore.filter(d => d.status !== 'offline');
        const avgLatency = Math.round(onlineDevices.reduce((acc, c) => acc + c.latency, 0) / (onlineDevices.length || 1));
        const avgLoss = (devicesStore.reduce((acc, c) => acc + c.packetLoss, 0) / total).toFixed(1);

        return sendJSON(200, {
            totalDevices: total,
            onlineDevices: onlineCount,
            offlineDevices: offlineCount,
            warningDevices: warningCount,
            avgLatency: avgLatency,
            packetLoss: parseFloat(avgLoss),
            networkUptime: 98.4
        });
    }

    // GET /api/alerts
    if (pathname === '/api/alerts' && req.method === 'GET') {
        return sendJSON(200, alertsStore);
    }

    // POST /api/devices/ping
    if (pathname === '/api/devices/ping' && req.method === 'POST') {
        const body = await getRequestBody();
        const targetIp = body.ip || '127.0.0.1';
        const pingResult = await systemPing(targetIp);
        return sendJSON(200, {
            ip: targetIp,
            success: pingResult.online,
            latency: pingResult.latency,
            packetLoss: pingResult.packetLoss,
            timestamp: new Date().toLocaleTimeString()
        });
    }

    // POST /api/devices
    if (pathname === '/api/devices' && req.method === 'POST') {
        const body = await getRequestBody();
        const newDevice = {
            id: devicesStore.length + 1,
            name: body.name || `Device-${devicesStore.length + 1}`,
            ip: body.ip || '192.168.1.100',
            mac: body.mac || `00:1A:2B:${Math.floor(Math.random()*89+10)}:${Math.floor(Math.random()*89+10)}:${Math.floor(Math.random()*89+10)}`,
            type: body.type || 'Computer',
            status: 'online',
            latency: Math.floor(Math.random() * 15) + 5,
            packetLoss: 0.0,
            uptime: 100.0,
            lastSeen: 'Just now'
        };
        devicesStore.unshift(newDevice);
        return sendJSON(201, newDevice);
    }

    // POST /api/devices/reboot
    if (pathname === '/api/devices/reboot' && req.method === 'POST') {
        const body = await getRequestBody();
        const dev = devicesStore.find(d => d.ip === body.ip);
        if (dev) {
            dev.status = 'warning';
            dev.lastSeen = 'Rebooting...';
            setTimeout(() => {
                dev.status = 'online';
                dev.lastSeen = 'Just now';
            }, 4000);
        }
        return sendJSON(200, { success: true, message: `Reboot command issued for ${body.ip}` });
    }

    // ==================== STATIC FILE SERVING ====================
    let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // Default fallback to index.html or login.html
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('404 Not Found');
        }

        const ext = path.extname(filePath);
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` SMART NETWORK MONITORING SYSTEM - NOC SERVER`);
    console.log(`====================================================`);
    console.log(` Server URL:        http://localhost:${PORT}`);
    console.log(` Authentication:   Enabled (admin/admin123, operator/user123)`);
    console.log(` Login Endpoint:    http://localhost:${PORT}/api/login`);
    console.log(` Monitoring Engine: Active (ICMP Pings)`);
    console.log(`====================================================`);
});
