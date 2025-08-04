import { Point, PolygonMap, TPolygon, Polygon } from 'poly-math-2d';
import { pointInTriangle } from 'poly-math-2d/dist/poly2d.js';

/**
 * Priority queue node for A* pathfinding
 */
interface PathNode {
    triangle: TPolygon;
    gCost: number;      // Distance from start
    hCost: number;      // Heuristic distance to goal
    fCost: number;      // Total cost (g + h)
    parent: PathNode | null;
}

/**
 * Fast 2D navigation mesh for pathfinding in triangulated polygons
 */
export class NavMesh2d {
    private triangles: TPolygon[] = [];

    constructor(private polygonMap: PolygonMap) {
        this.buildNavMesh();
    }

    /**
     * Build navigation mesh from polygon map
     */
    private buildNavMesh(): void {
        // Collect all triangles from all polygons
        for (const polygon of this.polygonMap.polygons) {
            for (const triangle of polygon.tpolygons) {
                this.triangles.push(triangle);
            }
        }
    }

    /**
     * Get triangle center point (already calculated in TPolygon)
     */
    private getTriangleCenter(triangle: TPolygon): Point {
        return triangle.centerPoint;
    }

    /**
     * Check if point is inside any triangle using barycentric coordinates (fastest method)
     */
    private isPointInTriangle(point: Point, triangle: TPolygon): boolean {
        // Standard check
        const isInside = pointInTriangle(point, triangle.mainTriangle);
        if (isInside) return true;

        // Edge check
        const [p1, p2, p3] = triangle.mainTriangle;
        return NavMesh2d.isPointOnSegment(point, p1, p2) ||
            NavMesh2d.isPointOnSegment(point, p2, p3) ||
            NavMesh2d.isPointOnSegment(point, p3, p1);
    }

    /**
     * Find triangle containing the point
     */
    private findTriangleContainingPoint(point: Point): TPolygon | null {
        for (const triangle of this.triangles) {
            if (this.isPointInTriangle(point, triangle)) {
                return triangle;
            }
        }
        return null;
    }

    /**
     * Check if point is inside navigation mesh
     */
    public isPointInNavMesh(point: Point): boolean {
        return this.findTriangleContainingPoint(point) !== null;
    }

    /**
     * Find path from point A to point B using A* algorithm on triangle centers
     */
    public findPath(a: Point, b: Point, closestToStart: boolean = false): Point[] {
        const startTriangle = this.findTriangleContainingPoint(a);
        if (!startTriangle) {
            return []; // Point A is not in navmesh
        }

        const endTriangle = this.findTriangleContainingPoint(b);

        // If B is not in navmesh, find closest point in same polygon as A
        let targetPoint = b;
        let targetTriangle = endTriangle;

        if (!endTriangle) {
            // Find polygon containing start triangle
            const startPolygon = this.polygonMap.polygons.find((p: Polygon) => p.tpolygons.includes(startTriangle));
            if (!startPolygon) return [];

            if (closestToStart) {
                const intersectionPoint = this.findIntersectionWithPolygon(a, b, startPolygon);
                if (intersectionPoint) {
                    targetPoint = intersectionPoint;
                } else {
                    // Fallback to default behavior if no intersection found
                    targetPoint = this.findClosestPointInPolygon(b, startPolygon);
                }
            } else {
                targetPoint = this.findClosestPointInPolygon(b, startPolygon);
            }

            targetTriangle = this.findTriangleContainingPoint(targetPoint);

            if (!targetTriangle) return [];
        }

        // If start and end are in same triangle, return direct path
        if (startTriangle === targetTriangle) {
            return [a, targetPoint];
        }

        // A* pathfinding through triangles
        const trianglePath = this.findTrianglePath(startTriangle, targetTriangle!);
        if (trianglePath.length === 0) {
            // No path of triangles found, but maybe they are in adjacent triangles
            if (startTriangle.connections.some(c => c.neighbor === targetTriangle)) {
                return [a, targetPoint];
            }
            return [];
        }

        // Create full triangle path including start and end triangles
        const fullTrianglePath = [startTriangle, ...trianglePath];

        // Apply Funnel Algorithm for optimal path
        const path = this.funnel(a, targetPoint, fullTrianglePath);

        if (path.length > 0 && !this.pointsEqual(path[path.length - 1], targetPoint)) {
            path.push(targetPoint);
        }

        return path;
    }

    private findIntersectionWithPolygon(p1: Point, q1: Point, polygon: Polygon): Point | null {
        let closestIntersection: Point | null = null;
        let minDistanceSq = Infinity;

        const findOnEdges = (edges: Point[]) => {
            for (let i = 0; i < edges.length; i++) {
                const p2 = edges[i];
                const q2 = edges[(i + 1) % edges.length];
                const intersection = this.getSegmentIntersectionPoint(p1, q1, p2, q2);
                if (intersection) {
                    const distSq = Point.getDistanceSquared(p1, intersection);
                    if (distSq < minDistanceSq) {
                        minDistanceSq = distSq;
                        closestIntersection = intersection;
                    }
                }
            }
        };

        findOnEdges(polygon.points);
        for (const hole of polygon.holes) {
            findOnEdges(hole.points);
        }

        return closestIntersection;
    }

    private getSegmentIntersectionPoint(p1: Point, q1: Point, p2: Point, q2: Point): Point | null {
        const r = new Point(q1.x - p1.x, q1.y - p1.y);
        const s = new Point(q2.x - p2.x, q2.y - p2.y);

        const rxs = r.x * s.y - r.y * s.x;
        if (Math.abs(rxs) < 1e-8) { // Check for parallel or collinear lines with a small epsilon
            return null;
        }

        const qp = new Point(p2.x - p1.x, p2.y - p1.y);
        const t = (qp.x * s.y - qp.y * s.x) / rxs;
        const u = (qp.x * r.y - qp.y * r.x) / rxs;

        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return new Point(p1.x + t * r.x, p1.y + t * r.y);
        }

        return null; // No intersection within segments
    }

    /**
     * Find closest point on a line segment
     */
    private static closestPointOnSegment(p: Point, a: Point, b: Point): Point {
        const a_to_p = new Point(p.x - a.x, p.y - a.y);
        const a_to_b = new Point(b.x - a.x, b.y - a.y);

        const atb2 = a_to_b.x * a_to_b.x + a_to_b.y * a_to_b.y;
        if (atb2 == 0) return a;

        const dot = a_to_p.x * a_to_b.x + a_to_p.y * a_to_b.y;
        const t = Math.max(0, Math.min(1, dot / atb2));

        return new Point(a.x + a_to_b.x * t, a.y + a_to_b.y * t);
    }

    private static isPointOnSegment(p: Point, a: Point, b: Point): boolean {
        const ab = new Point(b.x - a.x, b.y - a.y);
        const ap = new Point(p.x - a.x, p.y - a.y);

        const cross = ab.x * ap.y - ab.y * ap.x;
        if (Math.abs(cross) > 1e-9) {
            return false; // Not collinear
        }

        const dot = ap.x * ab.x + ap.y * ab.y;
        if (dot < 0 || dot > (ab.x * ab.x + ab.y * ab.y)) {
            return false; // Outside segment
        }

        return true;
    }

    /**
     * Find closest point to target within polygon bounds
     */
    private findClosestPointInPolygon(target: Point, polygon: Polygon): Point {
        let closestPoint = target;
        let minDistanceSq = Infinity;

        const checkPoint = (p: Point) => {
            const d = Point.getDistanceSquared(target, p);
            if (d < minDistanceSq) {
                minDistanceSq = d;
                closestPoint = p;
            }
        };

        // Check all vertices
        for (const p of polygon.points) {
            checkPoint(p);
        }

        // Check edges
        for (let i = 0; i < polygon.points.length; i++) {
            const p1 = polygon.points[i];
            const p2 = polygon.points[(i + 1) % polygon.points.length];
            const closest = NavMesh2d.closestPointOnSegment(target, p1, p2);
            checkPoint(closest);
        }

        // Also check hole edges
        for (const holePolygon of polygon.holes) {
            for (let i = 0; i < holePolygon.points.length; i++) {
                const p1 = holePolygon.points[i];
                const p2 = holePolygon.points[(i + 1) % holePolygon.points.length];
                const closest = NavMesh2d.closestPointOnSegment(target, p1, p2);
                checkPoint(closest);
            }
        }

        return closestPoint;
    }

    /**
     * A* pathfinding between triangles
     */
    private findTrianglePath(start: TPolygon, end: TPolygon): TPolygon[] {
        const openSet: PathNode[] = [];
        const closedSet = new Set<TPolygon>();
        const nodeMap = new Map<TPolygon, PathNode>();

        const startCenter = this.getTriangleCenter(start);
        const endCenter = this.getTriangleCenter(end);

        // Initialize start node
        const startNode: PathNode = {
            triangle: start,
            gCost: 0,
            hCost: Point.getDistanceQuick(startCenter, endCenter),
            fCost: 0,
            parent: null
        };
        startNode.fCost = startNode.gCost + startNode.hCost;

        openSet.push(startNode);
        nodeMap.set(start, startNode);

        while (openSet.length > 0) {
            // Find node with lowest fCost (using simple sort for small sets)
            openSet.sort((a, b) => a.fCost - b.fCost);
            const current = openSet.shift()!;

            if (current.triangle === end) {
                // Reconstruct path
                const path: TPolygon[] = [];
                let node: PathNode | null = current;
                while (node && node.parent) {
                    path.unshift(node.triangle);
                    node = node.parent;
                }
                return path;
            }

            closedSet.add(current.triangle);

            // Check neighbors through connections
            for (const connection of current.triangle.connections) {
                const neighbor = connection.neighbor;
                if (closedSet.has(neighbor)) continue;

                const neighborCenter = this.getTriangleCenter(neighbor);
                const currentCenter = this.getTriangleCenter(current.triangle);
                const tentativeGCost = current.gCost + Point.getDistanceQuick(currentCenter, neighborCenter);

                let neighborNode = nodeMap.get(neighbor);
                if (!neighborNode) {
                    neighborNode = {
                        triangle: neighbor,
                        gCost: tentativeGCost,
                        hCost: Point.getDistanceQuick(neighborCenter, endCenter),
                        fCost: 0,
                        parent: current
                    };
                    neighborNode.fCost = neighborNode.gCost + neighborNode.hCost;

                    nodeMap.set(neighbor, neighborNode);
                    openSet.push(neighborNode);
                } else if (tentativeGCost < neighborNode.gCost) {
                    neighborNode.gCost = tentativeGCost;
                    neighborNode.fCost = neighborNode.gCost + neighborNode.hCost;
                    neighborNode.parent = current;
                }
            }
        }

        return []; // No path found
    }

    /**
     * Optimizes the path using the Funnel Algorithm.
     * This implementation is a robust and correct version of String Pulling.
     */
    private funnel(start: Point, end: Point, trianglePath: TPolygon[]): Point[] {
        const portals = this.getPortalEdges(trianglePath);
        if (!portals) return [start, end];

        const path: Point[] = [start];
        let apex = start;
        let apexIndex = -1;

        let left = start;
        let leftIndex = -1;

        let right = start;
        let rightIndex = -1;

        portals.push({ left: end, right: end });

        for (let i = 0; i < portals.length; i++) {
            const pLeft = portals[i].left;
            const pRight = portals[i].right;

            if (this.triArea2(apex, right, pRight) <= 0.0) {
                if (this.pointsEqual(apex, right) || this.triArea2(apex, left, pRight) > 0.0) {
                    right = pRight;
                    rightIndex = i;
                } else {
                    path.push(left);
                    apex = left;
                    apexIndex = leftIndex;
                    i = apexIndex;
                    left = apex;
                    leftIndex = apexIndex;
                    right = apex;
                    rightIndex = apexIndex;
                    continue;
                }
            }

            if (this.triArea2(apex, left, pLeft) >= 0.0) {
                if (this.pointsEqual(apex, left) || this.triArea2(apex, right, pLeft) < 0.0) {
                    left = pLeft;
                    leftIndex = i;
                } else {
                    path.push(right);
                    apex = right;
                    apexIndex = rightIndex;
                    i = apexIndex;
                    left = apex;
                    leftIndex = apexIndex;
                    right = apex;
                    rightIndex = apexIndex;
                    continue;
                }
            }
        }

        if (!this.pointsEqual(path[path.length - 1], end)) {
            path.push(end);
        }

        return path;
    }

    private getPortalEdges(trianglePath: TPolygon[]): Array<{ left: Point, right: Point }> {
        const portals: Array<{ left: Point, right: Point }> = [];
        for (let i = 0; i < trianglePath.length - 1; i++) {
            const sharedEdge = this.getSharedEdge(trianglePath[i], trianglePath[i + 1]);
            if (sharedEdge) portals.push(sharedEdge);
        }
        return portals;
    }

    private getSharedEdge(triangle1: TPolygon, triangle2: TPolygon): { left: Point, right: Point } | null {
        const tri1Points = triangle1.mainTriangle;
        const tri2Points = triangle2.mainTriangle;

        const sharedPoints: Point[] = [];

        for (const p1 of tri1Points) {
            for (const p2 of tri2Points) {
                if (this.pointsEqual(p1, p2)) {
                    sharedPoints.push(p1);
                    break;
                }
            }
        }

        if (sharedPoints.length !== 2) return null;

        const center1 = this.getTriangleCenter(triangle1);
        const center2 = this.getTriangleCenter(triangle2);

        const cross = this.triArea2(center1, sharedPoints[0], sharedPoints[1]);

        if (cross > 0) {
            return { left: sharedPoints[0], right: sharedPoints[1] };
        } else {
            return { left: sharedPoints[1], right: sharedPoints[0] };
        }
    }

    /**
     * Removes collinear points from a path.
     */
    private simplifyPath(path: Point[]): Point[] {
        if (path.length < 3) return path;
        const simplified: Point[] = [path[0]];
        for (let i = 1; i < path.length - 1; i++) {
            if (Math.abs(this.triArea2(simplified[simplified.length - 1], path[i], path[i + 1])) > 1e-6) {
                simplified.push(path[i]);
            }
        }
        simplified.push(path[path.length - 1]);
        return simplified;
    }

    private getTriangleEdges(triangle: TPolygon): { p1: Point, p2: Point }[] {
        const [p1, p2, p3] = triangle.mainTriangle;
        return [{ p1: p1, p2: p2 }, { p1: p2, p2: p3 }, { p1: p3, p2: p1 }];
    }

    private isSameEdge(edgeA: { p1: Point, p2: Point }, edgeB: { left: Point, right: Point }): boolean {
        return (this.pointsEqual(edgeA.p1, edgeB.left) && this.pointsEqual(edgeA.p2, edgeB.right)) ||
            (this.pointsEqual(edgeA.p1, edgeB.right) && this.pointsEqual(edgeA.p2, edgeB.left));
    }

    private segmentsIntersect(p1: Point, q1: Point, p2: Point, q2: Point): boolean {
        const o1 = this.orientation(p1, q1, p2);
        const o2 = this.orientation(p1, q1, q2);
        const o3 = this.orientation(p2, q2, p1);
        const o4 = this.orientation(p2, q2, q1);

        if (o1 !== o2 && o3 !== o4) {
            return true;
        }

        return false;
    }

    private orientation(p: Point, q: Point, r: Point): number {
        const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
        if (Math.abs(val) < 1e-10) return 0; // Collinear
        return (val > 0) ? 1 : 2; // Clockwise or Counterclockwise
    }

    /**
     * Calculate twice the signed area of triangle formed by three points
     */
    private triArea2(a: Point, b: Point, c: Point): number {
        return (c.x - a.x) * (b.y - a.y) - (b.x - a.x) * (c.y - a.y);
    }

    private pointsEqual(p1: Point, p2: Point): boolean {
        const epsilon = 1e-9;
        return Math.abs(p1.x - p2.x) < epsilon && Math.abs(p1.y - p2.y) < epsilon;
    }
} 