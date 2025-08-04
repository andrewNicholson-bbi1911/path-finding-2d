const { Point, Polygon, PolygonMap } = require('poly-math-2d');
const { NavMesh2d } = require('./dist/nav-mesh-2d');

console.log('=== Path Finding 2D - Complex Example ===\n');

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


console.log(`Polygon 1: ${polygon1.tpolygons.length} triangles`);
console.log(`Polygon 2: ${polygon2.tpolygons.length} triangles`);
console.log(`Polygon 3: ${polygon3.tpolygons.length} triangles`);
console.log(`Total navmesh: ${polygon1.tpolygons.length + polygon2.tpolygons.length + polygon3.tpolygons.length} triangles\n`);

// === TEST FUNCTION ===
function testPath(name, pointA, pointB, expectedResult = null) {
    const aInMesh = navMesh.isPointInNavMesh(pointA);
    const bInMesh = navMesh.isPointInNavMesh(pointB);
    const path = navMesh.findPath(pointA, pointB);

    console.log(`${name}:`);
    console.log(`  A(${pointA.x}, ${pointA.y}) in navmesh: ${aInMesh}`);
    console.log(`  B(${pointB.x}, ${pointB.y}) in navmesh: ${bInMesh}`);
    console.log(`  Path found: ${path.length > 0}`);
    console.log(`  Path length: ${path.length} points`);
    if (path.length > 0) {
        console.log(`  Path: ${path.map(p => `(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`).join(' -> ')}`);
    }
    console.log('');
}

// === TESTING POLYGON 1 ===
console.log('=== TESTS FOR POLYGON 1 (square with hole) ===');

// 1) a1 in first polygon and b1 in first polygon
const a1 = new Point(10, 10);
const b1 = new Point(40, 40);
testPath('1.1) Both points inside polygon 1', a1, b1);

// 2) c1 in first polygon and d1 outside all polygons
const c1 = new Point(10, 10);
const d1 = new Point(53, 35); // Outside all polygons
testPath('1.2) c1 in polygon 1, d1 outside all polygons', c1, d1);

// 3) e1 outside all polygons and f1 inside first polygon
const e1 = new Point(10, 40); // Outside all polygons
const f1 = new Point(25, 20);
testPath('1.3) e1 outside all polygons, f1 in polygon 1', e1, f1);


// === TESTING POLYGON 2 ===
console.log('=== TESTS FOR POLYGON 2 (L-shape with hole) ===');

// 1) a2 in second polygon and b2 in second polygon
const a2 = new Point(65, 5);
const b2 = new Point(85, 25);
testPath('2.1) Both points inside polygon 2', a2, b2);

// 2) c2 in second polygon and d2 outside all polygons
const c2 = new Point(70, 5);
const d2 = new Point(90, 32); // Outside all polygons
testPath('2.2) c2 in polygon 2, d2 outside all polygons', c2, d2);

// 3) e2 outside all polygons and f2 inside second polygon
const e2 = new Point(65, 45); // Outside all polygons
const f2 = new Point(90, 17);
testPath('2.3) e2 outside all polygons, f2 in polygon 2', e2, f2);


// === TESTING POLYGON 3 ===
console.log('=== TESTS FOR POLYGON 3 (complex polygon with holes) ===');
// 1) a3 in third polygon and b3 in third polygon
const a3 = new Point(24, 85);
const b3 = new Point(87, 65);
testPath('3.1) Both points inside polygon 3', a3, b3);

// 2) c3 in third polygon and d3 outside all polygons
const c3 = new Point(20, 60);
const d3 = new Point(75, 85); // Outside all polygons
testPath('3.2) c3 in polygon 3, d3 outside all polygons', c3, d3);

// 3) e3 inside third polygon and f3 inside third polygon's hole
const e3 = new Point(30, 95); // Outside all polygons
const f3 = new Point(85, 67);
testPath('3.3) e3 outside all polygons, f3 in polygon 3', e3, f3);

console.log('=== TESTING COMPLETED ==='); 