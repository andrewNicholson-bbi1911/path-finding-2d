const { Point, Polygon, PolygonMap } = require('poly-math-2d');
const { NavMesh2d } = require('./dist/nav-mesh-2d');

console.log('=== Path Finding 2D - Complex Example ===\n');

// === CREATING THREE HOLEY POLYGONS ===

// Polygon 1: Large square with square hole
console.log('Creating polygon 1 (large square with hole)...');
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
console.log('Creating polygon 2 (L-shape with hole)...');
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
console.log('Creating polygon 3 (triangle with hole)...');
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
const c1 = new Point(15, 15);
const d1 = new Point(120, 120); // Outside all polygons
testPath('1.2) c1 in polygon 1, d1 outside all polygons', c1, d1);

// 3) e1 outside all polygons and f1 inside first polygon
const e1 = new Point(55, 55); // Outside all polygons
const f1 = new Point(5, 5);
testPath('1.3) e1 outside all polygons, f1 in polygon 1', e1, f1);

// 4) g1 inside first polygon and h1 inside hole of first polygon
const g1 = new Point(10, 40);
const h1 = new Point(25, 25); // Inside hole of polygon 1
testPath('1.4) g1 in polygon 1, h1 in hole of polygon 1', g1, h1);

// === TESTING POLYGON 2 ===
console.log('=== TESTS FOR POLYGON 2 (L-shape with hole) ===');

// 1) a2 in second polygon and b2 in second polygon
const a2 = new Point(65, 10);
const b2 = new Point(75, 40);
testPath('2.1) Both points inside polygon 2', a2, b2);

// 2) c2 in second polygon and d2 outside all polygons
const c2 = new Point(70, 15);
const d2 = new Point(110, 110); // Outside all polygons
testPath('2.2) c2 in polygon 2, d2 outside all polygons', c2, d2);

// 3) e2 outside all polygons and f2 inside second polygon
const e2 = new Point(110, 25); // Outside all polygons
const f2 = new Point(85, 5);
testPath('2.3) e2 outside all polygons, f2 in polygon 2', e2, f2);

// 4) g2 inside second polygon and h2 inside hole of second polygon
const g2 = new Point(65, 25);
const h2 = new Point(90, 15); // Inside hole of polygon 2
testPath('2.4) g2 in polygon 2, h2 in hole of polygon 2', g2, h2);

// === TESTING POLYGON 3 ===
console.log('=== TESTS FOR POLYGON 3 (triangle with hole) ===');

// 1) a3 in third polygon and b3 in third polygon
const a3 = new Point(30, 70);
const b3 = new Point(50, 75);
testPath('3.1) Both points inside polygon 3', a3, b3);

// 2) c3 in third polygon and d3 outside all polygons
const c3 = new Point(35, 80);
const d3 = new Point(0, 120); // Outside all polygons
testPath('3.2) c3 in polygon 3, d3 outside all polygons', c3, d3);

// 3) e3 outside all polygons and f3 inside third polygon
const e3 = new Point(70, 90); // Outside all polygons
const f3 = new Point(45, 85);
testPath('3.3) e3 outside all polygons, f3 in polygon 3', e3, f3);

// 4) g3 inside third polygon and h3 inside hole of third polygon
const g3 = new Point(25, 75);
const h3 = new Point(40, 75); // Inside hole of polygon 3
testPath('3.4) g3 in polygon 3, h3 in hole of polygon 3', g3, h3);

// === CROSS-POLYGON TESTS ===
console.log('=== CROSS-POLYGON TESTS ===');

// Path between different polygons (should be impossible)
const crossPoly1 = new Point(10, 25);
const crossPoly2 = new Point(70, 25);
testPath('Cross-polygon: from polygon 1 to polygon 2', crossPoly1, crossPoly2);

const crossPoly2to3 = new Point(85, 35);
const crossPoly3to2 = new Point(40, 85);
testPath('Cross-polygon: from polygon 2 to polygon 3', crossPoly2to3, crossPoly3to2);

console.log('=== TESTING COMPLETED ==='); 