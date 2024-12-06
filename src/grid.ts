import { Group, Object3D, PerspectiveCamera, Raycaster, Vector2, Vector3 } from "three";
import { Entity } from "./entity";

const raycaster = new Raycaster
export class Grid {
    readonly gridsize: number;
    private cells: Record<string, true | undefined | Entity> = {};
    private planes: Object3D[]
    public readonly scene: Group = new Group();

    constructor(public readonly map: Group) {
        this.gridsize = map.userData['gridsize']
        this.planes = map.children.filter(v => !!v.userData['Plane']);
        this.scene.add(map);

        const raycaster = new Raycaster()
        const vec1 = new Vector3()
        const vec2 = new Vector3(0, -1, 0)
        for (let x = 0; x < this.gridsize; x++) {
            for (let y = 0; y < this.gridsize; y++) {
                vec1.set(x - this.gridsize / 2 + .5, 1.1, y - this.gridsize / 2 + .5)
                raycaster.set(vec1, vec2)
                const result = raycaster.intersectObjects(map.children)
                const hit = result.some(el => {
                    return !el.object.userData['Plane']
                })
                if (!hit)
                    this.cells[x + ',' + y] = true
            }
        }
        console.log(this.cells)
    }

    /**
     * @param entity Must be a new entity not already in the grid
     */
    add(entity: Entity, grid_pos: Vector2) {
        const index = grid_pos.x + "," + grid_pos.y;
        const current = this.cells[index];

        if (current && current !== true)
            throw new Error("An object was already present at " + index)

        entity.obj.position.set(grid_pos.x - this.gridsize / 2 + .5, entity.offset, grid_pos.y - this.gridsize / 2 + .5);
        this.scene.add(entity.obj);
        this.cells[index] = entity;
    }


    move(from: Vector2, to: Vector2) {
        const iFrom = from.x + "," + from.y;
        const iTo = to.x + "," + to.y;
        const currentFrom = this.cells[iFrom];
        const currentTo = this.cells[iTo];

        if (currentTo && currentTo !== true)
            throw new Error("An object was already present at " + iTo)
        if (currentFrom === true || !currentFrom)
            throw new Error("no object at " + iFrom)

        currentFrom.obj.position.set(to.x - this.gridsize / 2 + .5, currentFrom.offset, to.y - this.gridsize / 2 + .5);
        this.cells[iFrom] = true;
        this.cells[iTo] = currentFrom;
    }

    screenTest(mousePosition: Vector2, camera: PerspectiveCamera, worldPos?: Vector3, gridPos?: Vector2) {
        raycaster.setFromCamera(mousePosition, camera);

        const result = raycaster.intersectObjects(this.planes)
        if (result.length == 0) {
            return;
        }

        const hit = result[0].point
        if (worldPos) {
            worldPos.copy(hit).floor().addScalar(0.5)
        }
        hit.addScalar(this.gridsize / 2).floor()
        if (gridPos) {
            gridPos.set(hit.x, hit.z);
        }
        return this.cells[hit.x + ',' + hit.z]
    }

    gridToWorldPos(v: Vector2): Vector2 {
        return v.addScalar(-this.gridsize / 2).addScalar(.5)
    }

    static manathanDistance(posA: Vector2, posB: Vector2): number {
        return Math.abs(posA.x - posB.x) + Math.abs(posA.y - posB.y)
    }

    floodFill(start: Vector2, moveRange: number) {
        const resultGrid = new SmallGrid<boolean>(moveRange * 2 + 1, false, start);
        const visitedGrid = new SmallGrid<number>(moveRange * 2 + 1, Number.MAX_SAFE_INTEGER, start);
        const cellsToVisit: [Vector2, number][] = [
            [new Vector2(moveRange + 1, moveRange), 0],
            [new Vector2(moveRange - 1, moveRange), 0],
            [new Vector2(moveRange, moveRange + 1), 0],
            [new Vector2(moveRange, moveRange - 1), 0]
        ];

        let cnt = 500;
        console.time("flood");
        while (cellsToVisit.length && --cnt > 0) {
            const cur = cellsToVisit.reverse().pop()!

            if (cur[1] >= moveRange)
                continue

            const gridX = cur[0].x - moveRange + start.x;
            const gridY = cur[0].y - moveRange + start.y;
            if (this.cells[gridX + ',' + gridY] !== true)
                continue;

            if (visitedGrid.get(cur[0]) <= cur[1])
                continue
            visitedGrid.set(cur[0], cur[1])

            resultGrid.set(cur[0], true)

            cellsToVisit.push([new Vector2(cur[0].x + 1, cur[0].y), cur[1] + 1]);
            cellsToVisit.push([new Vector2(cur[0].x - 1, cur[0].y), cur[1] + 1]);
            cellsToVisit.push([new Vector2(cur[0].x, cur[0].y + 1), cur[1] + 1]);
            cellsToVisit.push([new Vector2(cur[0].x, cur[0].y - 1), cur[1] + 1]);
        }
        console.timeEnd("flood")
        return resultGrid
    }
}

export class SmallGrid<T> {
    private grid: T[][];

    constructor(private n: number, d: T, private start: Vector2) {
        this.grid = Array(n).fill([]).map(() => Array(n).fill(d))
    }

    /**
     * local vector
     */
    set(v: Vector2, t: T) {
        this.grid[v.x][v.y] = t;
    }

    /**
     * local vector
     */
    get(v: Vector2): T {
        return this.grid[v.x][v.y];
    }

    getFromGridPos(v: Vector2): T {
        return this.grid[v.x - this.start.x + (this.n - 1) / 2][v.y - this.start.y + (this.n - 1) / 2];
    }

    /**
     * x,y given as grid pos
     */
    forEach(cb: (x: number, y: number, v: T) => void) {
        for (let x = 0; x < this.grid.length; x++) {
            for (let y = 0; y < this.grid[x].length; y++) {
                cb(x - (this.n - 1) / 2 + this.start.x, y - (this.n - 1) / 2 + this.start.y, this.grid[x][y]);
            }
        }
    }
}
