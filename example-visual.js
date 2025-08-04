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
    new Point(15, 15),
    new Point(35, 15),
    new Point(35, 35),
    new Point(15, 35)
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
    new Point(65, 10),
    new Point(95, 10),
    new Point(95, 20),
    new Point(75, 20),
    new Point(75, 40),
    new Point(65, 40)
]);
const polygon2 = new Polygon(polygon2Outer, [polygon2Hole]);

// Polygon 3: Triangle with triangular hole
// План: Для каждой точки явно вычисляю новое значение y (y / 2 + 50) и подставляю результат в виде числа.

const polygon3Outer = [
    new Point(20, 55),   // 10 / 2 + 50 = 55
    new Point(30, 70),   // 40 / 2 + 50 = 70
    new Point(50, 60),   // 20 / 2 + 50 = 60
    new Point(50, 70),   // 40 / 2 + 50 = 70
    new Point(60, 55),   // 10 / 2 + 50 = 55
    new Point(90, 55),   // 10 / 2 + 50 = 55
    new Point(100, 60),  // 20 / 2 + 50 = 60
    new Point(100, 75),  // 50 / 2 + 50 = 75
    new Point(80, 85),   // 70 / 2 + 50 = 85
    new Point(70, 75),   // 50 / 2 + 50 = 75
    new Point(50, 95),   // 90 / 2 + 50 = 95
    new Point(60, 100),  // 100 / 2 + 50 = 100
    new Point(20, 100),  // 100 / 2 + 50 = 100
    new Point(20, 80),   // 60 / 2 + 50 = 80
    new Point(10, 70),   // 40 / 2 + 50 = 70
];
const polygon3Holes = [
    new Polygon([
        new Point(60, 70),   // 40 / 2 + 50 = 70
        new Point(90, 70),   // 40 / 2 + 50 = 70
        new Point(80, 60),   // 20 / 2 + 50 = 60
        new Point(80, 65),   // 30 / 2 + 50 = 65
    ]),
    new Polygon([
        new Point(30, 75),   // 50 / 2 + 50 = 75
        new Point(30, 95),   // 90 / 2 + 50 = 95
        new Point(50, 80),   // 60 / 2 + 50 = 80
    ])
];
const polygon3 = new Polygon(polygon3Outer, polygon3Holes);

// Create polygon map and navmesh
const polygonMap = new PolygonMap([polygon1, polygon2, polygon3]);
const navMesh = new NavMesh2d(polygonMap);

console.log(`Created ${polygon1.tpolygons.length + polygon2.tpolygons.length + polygon3.tpolygons.length} triangles`);

// === CREATING DETAILED TEST CASE VISUALIZATIONS ===

function createTestVisualization(testName, polygons, testPoints, navMesh, closestToStart = false) {
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
        const path = navMesh.findPath(pointA, pointB, closestToStart);
        if (path.length > 0) {
            console.log(path);
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
        { outer: polygon3Outer, holes: polygon3Holes, triangles: polygon3.tpolygons }
    ],
    [
        {
            pointA: new Point(10, 10),
            pointB: new Point(40, 40),
            labelA: 'A1',
            labelB: 'B1'
        },
        {
            pointA: new Point(65, 5),
            pointB: new Point(85, 25),
            labelA: 'A2',
            labelB: 'B2'
        },
        {
            pointA: new Point(24, 85),
            pointB: new Point(87, 65),
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
        { outer: polygon3Outer, holes: polygon3Holes, triangles: polygon3.tpolygons }
    ],
    [
        {
            pointA: new Point(10, 10),
            pointB: new Point(53, 35),
            labelA: 'C1',
            labelB: 'D1 (outside)'
        },
        {
            pointA: new Point(70, 5),
            pointB: new Point(90, 32),
            labelA: 'C2',
            labelB: 'D2 (outside)'
        },
        {
            pointA: new Point(20, 60),
            pointB: new Point(75, 85),
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
    'Paths to points in polygon holes',
    [
        { outer: polygon1Outer, holes: [polygon1Hole], triangles: polygon1.tpolygons },
        { outer: polygon2Outer, holes: [polygon2Hole], triangles: polygon2.tpolygons },
        { outer: polygon3Outer, holes: polygon3Holes, triangles: polygon3.tpolygons }
    ],
    [
        {
            pointA: new Point(10, 40),
            pointB: new Point(25, 20),
            labelA: 'G1',
            labelB: 'H1 (hole)'
        },
        {
            pointA: new Point(65, 45),
            pointB: new Point(90, 17),
            labelA: 'G2',
            labelB: 'H2 (hole)'
        },
        {
            pointA: new Point(30, 95),
            pointB: new Point(85, 67),
            labelA: 'G3',
            labelB: 'H3 (hole)'
        }
    ],
    navMesh
);

// Add special points in holes
holesTest.addPoint(new Point(25, 20), 'H1 (hole)', 'hole');
holesTest.addPoint(new Point(90, 17), 'H2 (hole)', 'hole');
holesTest.addPoint(new Point(85, 67), 'H3 (hole)', 'hole');
holesTest.save('pathfinding-holes.svg');


console.log('\n=== Visualization completed ===');
console.log('Created files:');
console.log('- pathfinding-successful.svg - successful paths');
console.log('- pathfinding-to-outside.svg - paths to points outside navmesh');
console.log('- pathfinding-holes.svg - working with holes');
console.log('\nOpen SVG files in browser to view!'); 