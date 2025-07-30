const { Point, Polygon, PolygonMap } = require('poly-math-2d');
const { NavMesh2d } = require('./dist/nav-mesh-2d');

console.log('=== Path Finding 2D - Algorithm Improvement Demo ===\n');

// Create a complex scenario to show path optimization
const complexPolygon = [
    new Point(0, 0),
    new Point(100, 0),
    new Point(100, 20),
    new Point(80, 20),
    new Point(80, 40),
    new Point(100, 40),
    new Point(100, 60),
    new Point(0, 60),
    new Point(0, 40),
    new Point(20, 40),
    new Point(20, 20),
    new Point(0, 20)
];

const polygon = new Polygon(complexPolygon);
const polygonMap = new PolygonMap([polygon]);
const navMesh = new NavMesh2d(polygonMap);

console.log(`Created complex polygon with ${polygon.tpolygons.length} triangles`);
console.log('This demonstrates the improved string-pulling algorithm\n');

// Test cases that show the improvement
const testCases = [
    {
        name: 'Long corridor path',
        start: new Point(5, 10),
        end: new Point(95, 50),
        description: 'Path through multiple triangles in a corridor'
    },
    {
        name: 'Corner cutting',
        start: new Point(5, 5),
        end: new Point(95, 55),
        description: 'Path that can cut corners optimally'
    },
    {
        name: 'Complex navigation',
        start: new Point(10, 30),
        end: new Point(90, 30),
        description: 'Navigation through complex geometry'
    }
];

testCases.forEach((testCase, index) => {
    console.log(`${index + 1}. ${testCase.name}:`);
    console.log(`   Description: ${testCase.description}`);
    console.log(`   Start: (${testCase.start.x}, ${testCase.start.y})`);
    console.log(`   End: (${testCase.end.x}, ${testCase.end.y})`);

    const startTime = performance.now();
    const path = navMesh.findPath(testCase.start, testCase.end);
    const endTime = performance.now();

    if (path.length > 0) {
        console.log(`   ✅ Path found with ${path.length} points`);
        console.log(`   ⏱️  Computation time: ${(endTime - startTime).toFixed(4)}ms`);

        // Calculate path length
        let totalDistance = 0;
        for (let i = 0; i < path.length - 1; i++) {
            const dx = path[i + 1].x - path[i].x;
            const dy = path[i + 1].y - path[i].y;
            totalDistance += Math.sqrt(dx * dx + dy * dy);
        }
        console.log(`   📏 Path length: ${totalDistance.toFixed(2)} units`);

        // Show path points
        const pathStr = path.map(p => `(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`).join(' → ');
        console.log(`   🛤️  Path: ${pathStr}`);

        // Calculate efficiency (straight line vs actual path)
        const straightDistance = Point.getDistance(testCase.start, testCase.end);
        const efficiency = ((straightDistance / totalDistance) * 100).toFixed(1);
        console.log(`   📊 Path efficiency: ${efficiency}% (${straightDistance.toFixed(2)} straight line)`);
    } else {
        console.log(`   ❌ No path found`);
    }
    console.log('');
});

// Performance test
console.log('=== Performance Analysis ===');
const perfTestCount = 1000;
const randomTests = [];

// Generate random test cases
for (let i = 0; i < perfTestCount; i++) {
    let startPoint, endPoint;

    // Generate random points within the polygon
    do {
        startPoint = new Point(Math.random() * 100, Math.random() * 60);
    } while (!navMesh.isPointInNavMesh(startPoint));

    do {
        endPoint = new Point(Math.random() * 100, Math.random() * 60);
    } while (!navMesh.isPointInNavMesh(endPoint));

    randomTests.push({ start: startPoint, end: endPoint });
}

console.log(`Running ${perfTestCount} random pathfinding tests...`);

const perfStartTime = performance.now();
let successfulPaths = 0;
let totalPathLength = 0;
let totalPoints = 0;

for (const test of randomTests) {
    const path = navMesh.findPath(test.start, test.end);
    if (path.length > 0) {
        successfulPaths++;
        totalPoints += path.length;

        // Calculate path length
        for (let i = 0; i < path.length - 1; i++) {
            const dx = path[i + 1].x - path[i].x;
            const dy = path[i + 1].y - path[i].y;
            totalPathLength += Math.sqrt(dx * dx + dy * dy);
        }
    }
}

const perfEndTime = performance.now();
const totalTime = perfEndTime - perfStartTime;

console.log(`\n📈 Performance Results:`);
console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
console.log(`   Average per path: ${(totalTime / perfTestCount).toFixed(4)}ms`);
console.log(`   Successful paths: ${successfulPaths}/${perfTestCount} (${((successfulPaths / perfTestCount) * 100).toFixed(1)}%)`);
console.log(`   Average path length: ${(totalPathLength / successfulPaths).toFixed(2)} units`);
console.log(`   Average points per path: ${(totalPoints / successfulPaths).toFixed(1)}`);

console.log('\n🎯 Algorithm Improvements:');
console.log('   ✨ String-pulling optimization reduces path points');
console.log('   🏃 Portal-based navigation for smoother paths');
console.log('   🎯 Intelligent corner cutting when geometrically possible');
console.log('   ⚡ Maintains high performance while improving path quality');

console.log('\n=== Demo Completed ==='); 