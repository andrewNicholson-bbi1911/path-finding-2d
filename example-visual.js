const { Point, Polygon, PolygonMap } = require('poly-math-2d');
const { NavMesh2d } = require('./dist/nav-mesh-2d');
const PathfindingVisualizer = require('./visualizer');

console.log('=== Path Finding 2D - Visual Example ===\n');

// === CREATING THREE HOLEY POLYGONS ===

// Polygon 1: Large square with square hole
const polygon1Outer = [
    new Point(0, 0),
    new Point(50, 0),
    new Point(50, 50),
    new Point(0, 50)
];
const polygon1Hole = new Polygon([
    new Point(20, 20),
    new Point(30, 20),
    new Point(30, 30),
    new Point(20, 30)
]);
const polygon1 = new Polygon(polygon1Outer, [polygon1Hole]);

// Polygon 2: L-shaped form with rectangular hole
const polygon2Outer = [
    new Point(60, 0),
    new Point(100, 0),
    new Point(100, 30),
    new Point(80, 30),
    new Point(80, 50),
    new Point(60, 50)
];
const polygon2Hole = new Polygon([
    new Point(85, 10),
    new Point(95, 10),
    new Point(95, 20),
    new Point(85, 20)
]);
const polygon2 = new Polygon(polygon2Outer, [polygon2Hole]);

// Polygon 3: Triangle with triangular hole
const polygon3Outer = [
    new Point(20, 60),
    new Point(60, 60),
    new Point(40, 100)
];
const polygon3Hole = new Polygon([
    new Point(35, 70),
    new Point(45, 70),
    new Point(40, 80)
]);
const polygon3 = new Polygon(polygon3Outer, [polygon3Hole]);

// Create polygon map and navmesh
const polygonMap = new PolygonMap([polygon1, polygon2, polygon3]);
const navMesh = new NavMesh2d(polygonMap);

console.log(`Created ${polygon1.tpolygons.length + polygon2.tpolygons.length + polygon3.tpolygons.length} triangles`);

// === CREATING VISUALIZATION ===

// Main visualization with all polygons
const mainViz = new PathfindingVisualizer(1000, 800);
mainViz.addTitle('Path Finding 2D - Navmesh with three holey polygons');

// Add polygons with different colors
mainViz.addPolygon(polygon1Outer, [polygon1Hole], 'Polygon 1', '#e3f2fd');
mainViz.addPolygon(polygon2Outer, [polygon2Hole], 'Polygon 2', '#f3e5f5');
mainViz.addPolygon(polygon3Outer, [polygon3Hole], 'Polygon 3', '#e8f5e8');

// Show triangulation
const allTriangles = [...polygon1.tpolygons, ...polygon2.tpolygons, ...polygon3.tpolygons];
mainViz.addTriangulation(allTriangles);

mainViz.addLegend();
mainViz.save('pathfinding-overview.svg');

// === CREATING DETAILED TEST CASE VISUALIZATIONS ===

function createTestVisualization(testName, polygons, testPoints, navMesh) {
    const viz = new PathfindingVisualizer(800, 600);
    viz.addTitle(`Test: ${testName}`);

    // Add polygons
    polygons.forEach((poly, i) => {
        const colors = ['#e3f2fd', '#f3e5f5', '#e8f5e8'];
        viz.addPolygon(poly.outer, poly.holes, `Polygon ${i + 1}`, colors[i]);
    });

    // Add triangulation
    const allTriangles = polygons.flatMap(p => p.triangles);
    viz.addTriangulation(allTriangles);

    // Add test points and paths
    testPoints.forEach(test => {
        const { pointA, pointB, labelA, labelB, expectedPath } = test;

        // Determine point types
        const aInMesh = navMesh.isPointInNavMesh(pointA);
        const bInMesh = navMesh.isPointInNavMesh(pointB);

        const typeA = aInMesh ? 'start' : 'outside';
        const typeB = bInMesh ? 'end' : 'outside';

        viz.addPoint(pointA, labelA, typeA);
        viz.addPoint(pointB, labelB, typeB);

        // Find and display path
        const path = navMesh.findPath(pointA, pointB);
        if (path.length > 0) {
            viz.addPath(path, `${labelA} → ${labelB}`);
        }
    });

    viz.addLegend();
    return viz;
}

// Test 1: Successful paths inside polygons
console.log('Creating visualization of successful paths...');
const successfulPaths = createTestVisualization(
    'Successful paths inside polygons',
    [
        { outer: polygon1Outer, holes: [polygon1Hole], triangles: polygon1.tpolygons },
        { outer: polygon2Outer, holes: [polygon2Hole], triangles: polygon2.tpolygons },
        { outer: polygon3Outer, holes: [polygon3Hole], triangles: polygon3.tpolygons }
    ],
    [
        {
            pointA: new Point(10, 10),
            pointB: new Point(40, 40),
            labelA: 'A1',
            labelB: 'B1'
        },
        {
            pointA: new Point(65, 10),
            pointB: new Point(75, 40),
            labelA: 'A2',
            labelB: 'B2'
        },
        {
            pointA: new Point(30, 70),
            pointB: new Point(50, 75),
            labelA: 'A3',
            labelB: 'B3'
        }
    ],
    navMesh
);
successfulPaths.save('pathfinding-successful.svg');

// Test 2: Paths to points outside navmesh
console.log('Creating visualization of paths to points outside navmesh...');
const pathsToOutside = createTestVisualization(
    'Paths to points outside navmesh',
    [
        { outer: polygon1Outer, holes: [polygon1Hole], triangles: polygon1.tpolygons },
        { outer: polygon2Outer, holes: [polygon2Hole], triangles: polygon2.tpolygons },
        { outer: polygon3Outer, holes: [polygon3Hole], triangles: polygon3.tpolygons }
    ],
    [
        {
            pointA: new Point(15, 15),
            pointB: new Point(120, 120),
            labelA: 'C1',
            labelB: 'D1 (outside)'
        },
        {
            pointA: new Point(70, 15),
            pointB: new Point(110, 110),
            labelA: 'C2',
            labelB: 'D2 (outside)'
        },
        {
            pointA: new Point(35, 80),
            pointB: new Point(0, 120),
            labelA: 'C3',
            labelB: 'D3 (outside)'
        }
    ],
    navMesh
);
pathsToOutside.save('pathfinding-to-outside.svg');

// Test 3: Points in holes
console.log('Creating visualization of points in holes...');
const holesTest = createTestVisualization(
    'Points in polygon holes',
    [
        { outer: polygon1Outer, holes: [polygon1Hole], triangles: polygon1.tpolygons },
        { outer: polygon2Outer, holes: [polygon2Hole], triangles: polygon2.tpolygons },
        { outer: polygon3Outer, holes: [polygon3Hole], triangles: polygon3.tpolygons }
    ],
    [
        {
            pointA: new Point(10, 40),
            pointB: new Point(25, 25),
            labelA: 'G1',
            labelB: 'H1 (hole)'
        },
        {
            pointA: new Point(65, 25),
            pointB: new Point(90, 15),
            labelA: 'G2',
            labelB: 'H2 (hole)'
        }
    ],
    navMesh
);

// Add special points in holes
holesTest.addPoint(new Point(25, 25), 'H1 (hole)', 'hole');
holesTest.addPoint(new Point(90, 15), 'H2 (hole)', 'hole');
holesTest.save('pathfinding-holes.svg');

// Create detailed visualization of one polygon
console.log('Creating detailed visualization of polygon 1...');
const detailViz = new PathfindingVisualizer(600, 600);
detailViz.addTitle('Detailed view: Polygon 1 with triangulation');
detailViz.addPolygon(polygon1Outer, [polygon1Hole], '', '#e3f2fd');
detailViz.addTriangulation(polygon1.tpolygons);

// Add triangle centers
polygon1.tpolygons.forEach((triangle, i) => {
    detailViz.addPoint(triangle.centerPoint, `T${i + 1}`, 'normal');
});

// Show connections between triangles
polygon1.tpolygons.forEach(triangle => {
    triangle.connections.forEach(connection => {
        const points = [triangle.centerPoint, connection.neighbor.centerPoint];
        detailViz.addPath(points);
    });
});

detailViz.addLegend();
detailViz.save('pathfinding-detail-polygon1.svg');

console.log('\n=== Visualization completed ===');
console.log('Created files:');
console.log('- pathfinding-overview.svg - general overview of all polygons');
console.log('- pathfinding-successful.svg - successful paths');
console.log('- pathfinding-to-outside.svg - paths to points outside navmesh');
console.log('- pathfinding-holes.svg - working with holes');
console.log('- pathfinding-detail-polygon1.svg - detailed view with triangulation');
console.log('\nOpen SVG files in browser to view!'); 