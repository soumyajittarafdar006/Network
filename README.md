# Smart Network Monitoring System - NOC Dashboard & Backend API

A modern, professional, responsive Network Operations Center (NOC) cybersecurity dashboard and Node.js REST API backend for real-time local network device health monitoring, ICMP latency tracking, packet loss telemetry, and interactive topology visual maps.

---

## 🌟 Key Features

* **Cybersecurity NOC Aesthetics**: Dark modern UI with glassmorphism cards, glowing status pills, and sleek telemetry typography (*Inter* & *JetBrains Mono*).
* **Pure Node.js REST API Backend (`server.js`)**:
  * Real ICMP ping system execution (`ping -n 1` on Windows / `ping -c 1` on Linux)
  * Periodically monitors real hosts like `127.0.0.1`, `8.8.8.8`, `1.1.1.1`, gateways, and local devices
  * Zero external npm packages required (built using native `http`, `child_process`, `fs`, `path` modules)
  * Serves both REST API endpoints (`/api/devices`, `/api/stats`, `/api/alerts`, `/api/devices/ping`) and static web app files on port **3000**.
* **6 Live Statistic Summary Cards**: Real-time counters for Total Devices, Online, Offline, Avg Latency, Packet Loss rate, and SLA Uptime.
* **Interactive Live Network Table**:
  * Real-time search by device name, IP, or type
  * Status filtering (All, Online, Warning, Offline)
  * Column sorting (Click header to sort ascending/descending)
  * Manual ICMP sync refresh button
* **Chart.js Dynamic Telemetry Graphs**:
  * **Network Latency Line Chart**: Live sliding time-series graph with smooth bezier curves and area gradient fills.
  * **Device Status Doughnut Chart**: Donut chart with custom canvas plugin rendering total monitored device count in the center.
  * **Analytics Multi-Axis Chart**: Inbound vs Outbound Mbps throughput graph.
* **Visual SVG Network Topology**:
  * Visual node hierarchy (*Internet WAN → Router Gateway → Core NOC Server → Endpoints/IoT/PCs*)
  * Animated packet flow connection lines (`stroke-dasharray` animation)
  * Dynamic status stroke colors (Green = Healthy, Yellow = Latency Warning, Red = Offline)
  * Clickable nodes opening device inspection dialogs
* **Device Details Modal & Diagnostics**:
  * Displays IP, MAC address, Uptime, Packet Loss, Last Seen timestamp, individual ping telemetry graph, connection event history log, manual ping button, and emergency restart signal button.
* **DEMO MODE Real-Time Engine & Live API Toggle**:
  * Seamlessly toggle between client-side simulation (Demo Mode) and live REST API communication with the Node.js backend.

---

## 📁 Project File Structure

```text
c:/Users/prita/OneDrive/Desktop/network/
│
├── server.js             # Pure Node.js REST API server & ICMP ping monitoring engine
├── index.html            # Main NOC Dashboard layout & HTML structure
├── README.md             # Project documentation & backend setup guide
│
├── css/
│   └── style.css         # NOC CSS styling, glassmorphism, animations, responsive grids & light mode
│
└── js/
    ├── api.js            # API Service Layer, REST endpoints & mock fallback store
    ├── charts.js         # Chart.js initialization & dynamic update routines
    ├── topology.js       # Animated SVG Network Topology map renderer
    ├── dashboard.js      # Table UI controller, search/filter/sort, modals & toast notifications
    └── app.js            # Application entry point, live UTC clock, theme switcher & DEMO mode engine
```

---

## 🚀 Quick Start Instructions

### 1. Launching the Node.js Backend Server
Run the backend server directly with Node.js (no `npm install` needed!):
```bash
node server.js
```
The server will start on **`http://localhost:3000`**:
* **Dashboard App**: [http://localhost:3000](http://localhost:3000)
* **Devices API**: [http://localhost:3000/api/devices](http://localhost:3000/api/devices)
* **Stats API**: [http://localhost:3000/api/stats](http://localhost:3000/api/stats)
* **Alerts API**: [http://localhost:3000/api/alerts](http://localhost:3000/api/alerts)

---

## 🔌 Backend REST API Specification

The Node.js server (`server.js`) exposes the following endpoints:

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/devices` | `GET` | Returns list of all monitored network devices |
| `/api/stats` | `GET` | Returns aggregated network telemetry & SLA metrics |
| `/api/alerts` | `GET` | Returns active incident log items |
| `/api/devices/ping` | `POST` | Executes real system ICMP ping to target IP `{ "ip": "8.8.8.8" }` |
| `/api/devices` | `POST` | Registers a new device `{ "name": "Server-04", "ip": "192.168.1.50", "type": "Server" }` |
| `/api/devices/reboot` | `POST` | Sends remote restart signal `{ "ip": "192.168.1.5" }` |

---

## 💻 Tech Stack

* **Node.js**: Native HTTP server & ICMP subprocess ping module (`child_process`)
* **HTML5**: Semantic NOC structure
* **CSS3**: Custom CSS variables, Glassmorphism, Responsive Grid/Flexbox, Keyframe SVG Animations
* **JavaScript**: Modular ES6+
* **Chart.js**: v4.4.1 (via CDN)
* **FontAwesome**: v6.5.1 Icons
* **Fonts**: Inter & JetBrains Mono (Google Fonts)

---

**Smart Network Monitoring System © 2026** — *Real-Time Network Visibility & Performance Monitoring*
