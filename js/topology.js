/**
 * ============================================================================
 * SMART NETWORK MONITORING SYSTEM - INTERACTIVE NETWORK TOPOLOGY
 * ============================================================================
 * Renders an SVG Network Node Map showing structural links:
 * WAN/Internet -> Gateway Router -> NOC Monitoring Server -> Edge Endpoints (PCs, Laptops, IoT, Switches)
 *
 * Status line colors:
 * - Green stroke = Healthy connection
 * - Yellow stroke = High latency warning
 * - Red dashed stroke = Disconnected / dropped packets
 */

const NetworkTopology = {

    svgElement: null,

    init() {
        this.svgElement = document.getElementById('topology-svg');
        if (!this.svgElement) return;

        this.render();
    },

    render() {
        if (!this.svgElement) return;

        const width = this.svgElement.clientWidth || 900;
        const height = 340;

        // Topology Node Definitions with layout coordinates (x, y)
        const nodes = [
            { id: 'wan', label: 'Internet / ISP', sub: 'WAN Gateway', type: 'cloud', status: 'online', x: width * 0.5, y: 40 },
            { id: 'router', label: 'Router-Gateway', sub: '192.168.1.1', type: 'router', status: 'online', x: width * 0.5, y: 120 },
            { id: 'server', label: 'Server-Core-NOC', sub: '192.168.1.2', type: 'server', status: 'online', x: width * 0.5, y: 200 },
            
            // Tier 3 Leaf Devices
            { id: 'pc01', label: 'PC-01', sub: '192.168.1.5', type: 'pc', status: 'online', x: width * 0.12, y: 290 },
            { id: 'pc02', label: 'PC-02', sub: '192.168.1.6', type: 'laptop', status: 'online', x: width * 0.28, y: 290 },
            { id: 'pc03', label: 'PC-03', sub: '192.168.1.7', type: 'pc', status: 'offline', x: width * 0.44, y: 290 },
            { id: 'esp01', label: 'ESP32-01', sub: '192.168.1.10', type: 'iot', status: 'online', x: width * 0.60, y: 290 },
            { id: 'cam01', label: 'IP-Camera', sub: '192.168.1.25', type: 'iot', status: 'warning', x: width * 0.76, y: 290 },
            { id: 'nas01', label: 'NAS-Storage', sub: '192.168.1.15', type: 'server', status: 'online', x: width * 0.90, y: 290 }
        ];

        // Connection links between nodes
        const links = [
            { source: 'wan', target: 'router' },
            { source: 'router', target: 'server' },
            { source: 'server', target: 'pc01' },
            { source: 'server', target: 'pc02' },
            { source: 'server', target: 'pc03' },
            { source: 'server', target: 'esp01' },
            { source: 'server', target: 'cam01' },
            { source: 'server', target: 'nas01' }
        ];

        let svgHtml = `
            <defs>
                <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
        `;

        // 1. Draw Links
        links.forEach(link => {
            const srcNode = nodes.find(n => n.id === link.source);
            const tgtNode = nodes.find(n => n.id === link.target);
            if (!srcNode || !tgtNode) return;

            let strokeColor = '#3fb950'; // Green online
            let strokeWidth = '2';
            let strokeDash = '6';

            if (tgtNode.status === 'offline') {
                strokeColor = '#f85149'; // Red offline
                strokeWidth = '2.5';
                strokeDash = '4';
            } else if (tgtNode.status === 'warning') {
                strokeColor = '#d29922'; // Yellow warning
            }

            svgHtml += `
                <line 
                    x1="${srcNode.x}" y1="${srcNode.y}" 
                    x2="${tgtNode.x}" y2="${tgtNode.y}" 
                    stroke="${strokeColor}" 
                    stroke-width="${strokeWidth}" 
                    class="topo-link"
                    style="stroke-dasharray: ${strokeDash};"
                />
            `;
        });

        // 2. Draw Nodes
        nodes.forEach(node => {
            let fillColor = '#161c27';
            let strokeColor = '#3fb950';
            let iconText = '💻';

            if (node.status === 'offline') {
                strokeColor = '#f85149';
                iconText = '❌';
            } else if (node.status === 'warning') {
                strokeColor = '#d29922';
                iconText = '⚠️';
            } else {
                if (node.type === 'cloud') iconText = '🌐';
                else if (node.type === 'router') iconText = '📡';
                else if (node.type === 'server') iconText = '🖥️';
                else if (node.type === 'iot') iconText = '⚡';
                else if (node.type === 'laptop') iconText = '💻';
            }

            svgHtml += `
                <g class="topo-node-group" data-ip="${node.sub}" onclick="Dashboard.openDeviceModalByIp('${node.sub}')">
                    <!-- Circle Node Container -->
                    <circle 
                        cx="${node.x}" cy="${node.y}" r="22" 
                        fill="${fillColor}" 
                        stroke="${strokeColor}" 
                        stroke-width="2.5" 
                        class="topo-node-circle"
                        ${node.status === 'offline' ? 'filter="url(#glow-red)"' : 'filter="url(#glow-green)"'}
                    />
                    <!-- Icon Text -->
                    <text x="${node.x}" y="${node.y + 5}" font-size="14" text-anchor="middle">${iconText}</text>
                    
                    <!-- Labels -->
                    <text x="${node.x}" y="${node.y + 36}" class="topo-node-label">${node.label}</text>
                    <text x="${node.x}" y="${node.y + 48}" class="topo-node-sub">${node.sub}</text>
                </g>
            `;
        });

        this.svgElement.innerHTML = svgHtml;
    },

    /**
     * Re-render topology when screen resizes or status changes
     */
    updateStatus(ip, newStatus) {
        this.render();
    }
};

window.NetworkTopology = NetworkTopology;
