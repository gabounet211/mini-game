import { BufferAttribute, BufferGeometry, Group, Object3D, PerspectiveCamera, Points, PointsMaterial, Raycaster, Vector2, Vector3 } from "three";
import { Piece, PieceConfig } from "./piece";

const raycaster = new Raycaster
export class Grid {
    readonly gridsize: number;
    private cells: Record<string, true | undefined | Piece> = {};
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

    add(pieceConfig: PieceConfig, grid_pos: Vector2) {
        const piece = new Piece(pieceConfig);
        const index = grid_pos.x + "," + grid_pos.y;
        const current = this.cells[index];

        if (current && current !== true)
            throw new Error("An object was already present at " + index)

        piece.obj.position.set(grid_pos.x - this.gridsize / 2 + .5, piece.offset, grid_pos.y - this.gridsize / 2 + .5);
        this.scene.add(piece.obj);
        this.cells[index] = piece;
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
    
    debug() {
        const point = []
        const raycaster = new Raycaster()
        const vec1 = new Vector3()
        const vec2 = new Vector3(0, -1, 0)
        for (let x = 0; x < this.gridsize; x++) {
          for (let y = 0; y < this.gridsize; y++) {
            vec1.set(x - this.gridsize / 2 + .5, 1.1, y - this.gridsize / 2 + .5)
            raycaster.set(vec1, vec2)
            const result = raycaster.intersectObjects(this.map.children)
            const hit = result.some(el => {
              return !el.object.userData['Plane']
            })
            if (!hit)
              point.push(vec1.x, 0.01, vec1.z)
          }
        }
        
        const dotGeometry = new BufferGeometry();
        dotGeometry.setAttribute('position', new BufferAttribute(new Float32Array(point), 3));
        const dotMaterial = new PointsMaterial({ size: 0.25, color: 0xff0000 });
        const dot = new Points(dotGeometry, dotMaterial);
        this.scene.add(dot);
    }

    floodFill(start: Vector2, moveRange: number) {
        const resultGrid = new SmallGrid<boolean>(moveRange, false, start);
        const visitedGrid = new SmallGrid<number>(moveRange, Number.MAX_SAFE_INTEGER, start);
        const cellsToVisit: [Vector2, number][] = [
            [start, 0],
        ];
        const that = this;

        let cnt = 500;
        console.time("flood");
        while (cellsToVisit.length && --cnt > 0) {
            const cur = cellsToVisit.reverse().pop()!

            testValide(new Vector2(cur[0].x + 1, cur[0].y), cur[1] + 1);
            testValide(new Vector2(cur[0].x - 1, cur[0].y), cur[1] + 1);
            testValide(new Vector2(cur[0].x, cur[0].y + 1), cur[1] + 1);
            testValide(new Vector2(cur[0].x, cur[0].y - 1), cur[1] + 1);
        }
        console.timeEnd("flood");
        console.log(cnt);

        function testValide(pos: Vector2, howManyStep: number) {
            if (howManyStep > moveRange)
                return
            if (that.cells[pos.x + ',' + pos.y] !== true)
                return;
            if (visitedGrid.get(pos) <= howManyStep)
                return

            visitedGrid.set(pos, howManyStep)
            resultGrid.set(pos, true)
            cellsToVisit.push([pos, howManyStep])
        }

        return resultGrid
    }
}

export class SmallGrid<T> {
    private grid: T[][];
    private half: number;

    constructor(n: number, d: T, private start: Vector2) {
        this.grid = Array(n * 2 + 1).fill([]).map(() => Array(n * 2 + 1).fill(d));
        this.half = n;
    }

    set(v: Vector2, t: T) {
        const x = v.x - this.start.x + this.half;
        const y = v.y - this.start.y + this.half;
        this.grid[x][y] = t;
    }

    get(v: Vector2): T {
        const x = v.x - this.start.x + this.half;
        const y = v.y - this.start.y + this.half;
        return this.grid[x][y];
    }

    /**
     * x,y given as grid pos
     */
    forEach(cb: (x: number, y: number, v: T) => void) {
        for (let x = 0; x < this.grid.length; x++) {
            for (let y = 0; y < this.grid[x].length; y++) {
                cb(x - this.half + this.start.x, y - this.half + this.start.y, this.grid[x][y]);
            }
        }
    }
}
