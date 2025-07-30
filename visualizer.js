const fs = require('fs');

/**
 * Simple SVG visualizer for pathfinding examples
 * This is only for demonstration purposes and not part of the main library
 */
class PathfindingVisualizer {
    constructor(width = 800, height = 600) {
        this.width = width;
        this.height = height;
        this.svg = '';
        this.scale = 5; // Scale factor for coordinates
        this.offsetX = 50;
        this.offsetY = 50;

        this.initSVG();
    }

    initSVG() {
        this.svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .polygon { fill: #e8f4fd; stroke: #2196f3; stroke-width: 2; }
      .hole { fill: white; stroke: #f44336; stroke-width: 2; stroke-dasharray: 5,5; }
      .triangle { fill: none; stroke: #ddd; stroke-width: 0.5; opacity: 0.5; }
      .point-start { fill: #4caf50; stroke: #2e7d32; stroke-width: 2; }
      .point-end { fill: #ff9800; stroke: #f57c00; stroke-width: 2; }
      .point-outside { fill: #f44336; stroke: #c62828; stroke-width: 2; }
      .point-hole { fill: #9c27b0; stroke: #6a1b9a; stroke-width: 2; }
      .path { fill: none; stroke: #4caf50; stroke-width: 3; stroke-linecap: round; }
      .path-arrow { fill: #4caf50; }
      .label { font-family: Arial, sans-serif; font-size: 12px; fill: #333; }
      .title { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #333; }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="${this.width}" height="${this.height}" fill="#fafafa"/>
`;
    }

    scaleX(x) {
        return x * this.scale + this.offsetX;
    }

    scaleY(y) {
        return y * this.scale + this.offsetY;
    }

    /**
     * Add polygon to visualization
     */
    addPolygon(points, holes = [], label = '', color = '#e8f4fd') {
        // Draw main polygon
        const pathData = points.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${this.scaleX(p.x)} ${this.scaleY(p.y)}`
        ).join(' ') + ' Z';

        this.svg += `  <path d="${pathData}" class="polygon" style="fill: ${color}"/>\n`;

        // Draw holes
        holes.forEach(hole => {
            const holePathData = hole.points.map((p, i) =>
                `${i === 0 ? 'M' : 'L'} ${this.scaleX(p.x)} ${this.scaleY(p.y)}`
            ).join(' ') + ' Z';

            this.svg += `  <path d="${holePathData}" class="hole"/>\n`;
        });

        // Add label
        if (label) {
            const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
            const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
            this.svg += `  <text x="${this.scaleX(centerX)}" y="${this.scaleY(centerY)}" class="title" text-anchor="middle">${label}</text>\n`;
        }
    }

    /**
     * Add triangulation visualization
     */
    addTriangulation(triangles) {
        triangles.forEach(triangle => {
            const pathData = triangle.mainTriangle.map((p, i) =>
                `${i === 0 ? 'M' : 'L'} ${this.scaleX(p.x)} ${this.scaleY(p.y)}`
            ).join(' ') + ' Z';

            this.svg += `  <path d="${pathData}" class="triangle"/>\n`;
        });
    }

    /**
     * Add point to visualization
     */
    addPoint(point, label, type = 'normal') {
        const classes = {
            start: 'point-start',
            end: 'point-end',
            outside: 'point-outside',
            hole: 'point-hole',
            normal: 'point-start'
        };

        const x = this.scaleX(point.x);
        const y = this.scaleY(point.y);

        this.svg += `  <circle cx="${x}" cy="${y}" r="4" class="${classes[type]}"/>\n`;
        this.svg += `  <text x="${x + 8}" y="${y - 8}" class="label">${label}</text>\n`;
    }

    /**
     * Add path to visualization
     */
    addPath(points, label = '') {
        if (points.length < 2) return;

        const pathData = points.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${this.scaleX(p.x)} ${this.scaleY(p.y)}`
        ).join(' ');

        this.svg += `  <path d="${pathData}" class="path"/>\n`;

        // Add arrows along the path
        for (let i = 0; i < points.length - 1; i++) {
            const start = points[i];
            const end = points[i + 1];
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;

            // Calculate arrow direction
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const unitX = dx / length;
            const unitY = dy / length;

            // Arrow head
            const arrowSize = 3;
            const x1 = this.scaleX(midX);
            const y1 = this.scaleY(midY);
            const x2 = x1 + unitX * arrowSize;
            const y2 = y1 + unitY * arrowSize;
            const x3 = x1 - unitY * arrowSize * 0.5;
            const y3 = y1 + unitX * arrowSize * 0.5;
            const x4 = x1 + unitY * arrowSize * 0.5;
            const y4 = y1 - unitX * arrowSize * 0.5;

            this.svg += `  <polygon points="${x2},${y2} ${x3},${y3} ${x4},${y4}" class="path-arrow"/>\n`;
        }

        // Add path label
        if (label && points.length > 0) {
            const midPoint = points[Math.floor(points.length / 2)];
            this.svg += `  <text x="${this.scaleX(midPoint.x)}" y="${this.scaleY(midPoint.y) - 15}" class="label" text-anchor="middle" style="background: white;">${label}</text>\n`;
        }
    }

    /**
     * Add title to the visualization
     */
    addTitle(title) {
        this.svg += `  <text x="${this.width / 2}" y="30" class="title" text-anchor="middle" style="font-size: 20px;">${title}</text>\n`;
    }

    /**
     * Add legend
     */
    addLegend() {
        const legendX = this.width - 180;
        const legendY = 60;

        this.svg += `  <rect x="${legendX - 10}" y="${legendY - 10}" width="170" height="180" fill="white" stroke="#ddd" stroke-width="1"/>\n`;
        this.svg += `  <text x="${legendX}" y="${legendY}" class="title">Legend:</text>\n`;

        const items = [
            { color: '#e8f4fd', stroke: '#2196f3', text: 'Polygon', type: 'rect' },
            { color: 'white', stroke: '#f44336', text: 'Hole', type: 'rect', dash: true },
            { color: '#4caf50', text: 'Start point', type: 'circle' },
            { color: '#ff9800', text: 'End point', type: 'circle' },
            { color: '#f44336', text: 'Point outside navmesh', type: 'circle' },
            { color: '#9c27b0', text: 'Point in hole', type: 'circle' },
            { color: 'none', stroke: '#4caf50', text: 'Found path', type: 'line' }
        ];

        items.forEach((item, i) => {
            const y = legendY + 25 + i * 20;

            if (item.type === 'rect') {
                const strokeDash = item.dash ? 'stroke-dasharray="3,3"' : '';
                this.svg += `  <rect x="${legendX}" y="${y - 8}" width="12" height="12" fill="${item.color}" stroke="${item.stroke}" stroke-width="1" ${strokeDash}/>\n`;
            } else if (item.type === 'circle') {
                this.svg += `  <circle cx="${legendX + 6}" cy="${y - 2}" r="4" fill="${item.color}" stroke="#333" stroke-width="1"/>\n`;
            } else if (item.type === 'line') {
                this.svg += `  <line x1="${legendX}" y1="${y - 2}" x2="${legendX + 12}" y2="${y - 2}" stroke="${item.stroke}" stroke-width="2"/>\n`;
            }

            this.svg += `  <text x="${legendX + 20}" y="${y + 2}" class="label">${item.text}</text>\n`;
        });
    }

    /**
     * Save SVG to file
     */
    save(filename) {
        this.svg += '</svg>';
        fs.writeFileSync(filename, this.svg);
        console.log(`Visualization saved to file: ${filename}`);
    }
}

module.exports = PathfindingVisualizer; 