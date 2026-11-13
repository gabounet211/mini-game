import { BufferAttribute, BufferGeometry, Group, Object3D, PerspectiveCamera, Points, PointsMaterial, Raycaster, Vector2, Vector3 } from "three";
import { Piece, PieceConfig } from "./piece";
import { Character } from "./character";

const raycaster = new Raycaster
export class Grid {
    readonly gridsize: number;
    private cells: Record<string, true | undefined | Piece> = {};
    private planes: Object3D[]
    private dying: Piece[] = []
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
    }

    add(pieceConfig: PieceConfig, character: Character, grid_pos: Vector2, player = false) {
        const piece = new Piece(pieceConfig, character, player);
        const index = grid_pos.x + "," + grid_pos.y;
        const current = this.cells[index];

        if (current && current !== true)
            throw new Error("An object was already present at " + index)

        piece.obj.position.set(grid_pos.x - this.gridsize / 2 + .5, piece.offset, grid_pos.y - this.gridsize / 2 + .5);
        this.scene.add(piece.obj);
        this.cells[index] = piece;
        return piece
    }


    update(delta: number) {
        for (const cell of Object.values(this.cells)) {
            if (cell instanceof Piece)
                cell.update(delta)
        }
        for (const piece of this.dying)
            piece.update(delta)
    }

    isFree(pos: Vector2) {
        return this.cells[pos.x + ',' + pos.y] === true
    }

    getPieces(player: boolean) {
        return Object.values(this.cells).filter((cell): cell is Piece => cell instanceof Piece && cell.player === player)
    }

    getPosition(piece: Piece) {
        for (const [index, cell] of Object.entries(this.cells)) {
            if (cell === piece) {
                const [x, y] = index.split(',').map(Number)
                return new Vector2(x, y)
            }
        }
    }

    removeDead() {
        for (const [index, cell] of Object.entries(this.cells)) {
            if (cell instanceof Piece && cell.healt <= 0) {
                if (cell.lastAttacker && cell.lastAttacker.player !== cell.player)
                    cell.lastAttacker.kills++
                this.cells[index] = true
                this.dying.push(cell)
                cell.die().then(() => {
                    this.scene.remove(cell.obj)
                    this.dying.splice(this.dying.indexOf(cell), 1)
                })
            }
        }
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

        const path = this.findPath(from, to) ?? [to]
        currentFrom.walk(path.map(cell => new Vector3(cell.x - this.gridsize / 2 + .5, currentFrom.offset, cell.y - this.gridsize / 2 + .5)))
        this.cells[iFrom] = true;
        this.cells[iTo] = currentFrom;
        return path.length
    }

    findPath(from: Vector2, to: Vector2) {
        const previous = new Map<string, Vector2 | undefined>([[from.x + ',' + from.y, undefined]])
        const queue = [from]
        for (let index = 0; index < queue.length; index++) {
            const current = queue[index]
            if (current.equals(to)) {
                const path: Vector2[] = []
                for (let step: Vector2 | undefined = current; step && !step.equals(from); step = previous.get(step.x + ',' + step.y))
                    path.unshift(step)
                return path
            }
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const next = new Vector2(current.x + dx, current.y + dy)
                const key = next.x + ',' + next.y
                if (previous.has(key) || this.cells[key] !== true)
                    continue
                previous.set(key, current)
                queue.push(next)
            }
        }
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

    attackFill(start: Vector2, attackRange: number) {
        const resultGrid = new SmallGrid<boolean>(attackRange, false, start);
        const target = new Vector2();

        for (let x = -attackRange; x <= attackRange; x++) {
            for (let y = -attackRange; y <= attackRange; y++) {
                if ((x === 0 && y === 0) || Math.abs(x) + Math.abs(y) > attackRange)
                    continue;
                target.set(start.x + x, start.y + y);
                if (!this.isViewBlocked(start, target))
                    resultGrid.set(target, true);
            }
        }

        return resultGrid
    }

    distanceMap(start: Vector2) {
        const distances = new Map<string, number>([[start.x + ',' + start.y, 0]])
        const queue = [start]
        for (let index = 0; index < queue.length; index++) {
            const current = queue[index]
            const distance = distances.get(current.x + ',' + current.y)! + 1
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const next = new Vector2(current.x + dx, current.y + dy)
                const key = next.x + ',' + next.y
                if (distances.has(key) || this.cells[key] === undefined)
                    continue
                distances.set(key, distance)
                queue.push(next)
            }
        }
        return { get: (pos: Vector2) => distances.get(pos.x + ',' + pos.y) }
    }

    canSee(from: Vector2, to: Vector2) {
        return !this.isViewBlocked(from, to)
    }

    private isViewBlocked(from: Vector2, to: Vector2) {
        for (let x = Math.min(from.x, to.x); x <= Math.max(from.x, to.x); x++) {
            for (let y = Math.min(from.y, to.y); y <= Math.max(from.y, to.y); y++) {
                if (this.cells[x + ',' + y] === undefined && this.segmentCrossesCell(from, to, x, y))
                    return true;
            }
        }
        return false
    }

    private segmentCrossesCell(from: Vector2, to: Vector2, cellX: number, cellY: number) {
        const half = 0.45;
        let tMin = 0;
        let tMax = 1;
        const axes: [number, number, number][] = [
            [from.x, to.x - from.x, cellX],
            [from.y, to.y - from.y, cellY],
        ];

        for (const [start, delta, center] of axes) {
            if (delta === 0) {
                if (Math.abs(start - center) > half)
                    return false;
                continue;
            }
            const t1 = (center - half - start) / delta;
            const t2 = (center + half - start) / delta;
            tMin = Math.max(tMin, Math.min(t1, t2));
            tMax = Math.min(tMax, Math.max(t1, t2));
        }
        return tMin <= tMax
    }

    floodFill(start: Vector2, moveRange: number) {
        const resultGrid = new SmallGrid<boolean>(moveRange, false, start);
        const visitedGrid = new SmallGrid<number>(moveRange, Number.MAX_SAFE_INTEGER, start);
        const cellsToVisit: [Vector2, number][] = [
            [start, 0],
        ];
        const that = this;

        let cnt = 500;
        while (cellsToVisit.length && --cnt > 0) {
            const cur = cellsToVisit.reverse().pop()!

            testValide(new Vector2(cur[0].x + 1, cur[0].y), cur[1] + 1);
            testValide(new Vector2(cur[0].x - 1, cur[0].y), cur[1] + 1);
            testValide(new Vector2(cur[0].x, cur[0].y + 1), cur[1] + 1);
            testValide(new Vector2(cur[0].x, cur[0].y - 1), cur[1] + 1);
        }

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
