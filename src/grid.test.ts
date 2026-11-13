import { describe, expect, it } from "vitest"
import { Object3D, Vector2 } from "three"
import { Piece } from "./piece"
import { Grid } from "./grid"

function createGrid(size: number, walls: string[]) {
    const grid = Object.create(Grid.prototype) as Grid
    const cells: Record<string, true | undefined> = {}
    for (let x = 0; x < size; x++)
        for (let y = 0; y < size; y++)
            if (!walls.includes(x + ',' + y))
                cells[x + ',' + y] = true
    Object.assign(grid, { cells })
    return grid
}

const wall = Array.from({ length: 6 }, (_, y) => '3,' + y)

describe("findPath", () => {
    it("goes around a wall through the only gap", () => {
        const path = createGrid(7, wall).findPath(new Vector2(0, 0), new Vector2(6, 0))!
        expect(path.at(-1)!.equals(new Vector2(6, 0))).toBe(true)
        expect(path.some(cell => cell.equals(new Vector2(3, 6)))).toBe(true)
        expect(path).toHaveLength(18)
    })

    it("returns nothing when the target cannot be reached", () => {
        const closed = Array.from({ length: 7 }, (_, y) => '3,' + y)
        expect(createGrid(7, closed).findPath(new Vector2(0, 0), new Vector2(6, 0))).toBeUndefined()
    })
})

describe("move", () => {
    it("returns the number of cells walked, around walls", () => {
        const grid = createGrid(7, ['1,0', '1,1'])
        const piece = { offset: 0, walk() { } }
        Object.assign((grid as unknown as { cells: Record<string, unknown> }).cells, { '0,0': piece })
        Object.assign(grid, { gridsize: 7 })
        expect(grid.move(new Vector2(0, 0), new Vector2(2, 0))).toBe(6)
    })
})

describe("swap", () => {
    it("moves a piece to an empty cell and refuses walls", () => {
        const grid = createGrid(3, ['2,2'])
        const piece = Object.assign(Object.create(Piece.prototype), { offset: 0, obj: new Object3D() }) as Piece
        Object.assign((grid as unknown as { cells: Record<string, unknown> }).cells, { '0,0': piece })
        Object.assign(grid, { gridsize: 3 })
        grid.swap(new Vector2(0, 0), new Vector2(1, 0))
        expect(grid.getPosition(piece)!.equals(new Vector2(1, 0))).toBe(true)
        expect(grid.isFree(new Vector2(0, 0))).toBe(true)
        expect(piece.obj.position.x).toBe(0)
        expect(() => grid.swap(new Vector2(1, 0), new Vector2(2, 2))).toThrow()
    })
})

describe("distanceMap", () => {
    it("counts the real walking distance around walls", () => {
        const distances = createGrid(7, wall).distanceMap(new Vector2(0, 0))
        expect(distances.get(new Vector2(6, 0))).toBe(18)
        expect(distances.get(new Vector2(3, 0))).toBeUndefined()
    })
})

describe("canSee", () => {
    it("is blocked by a wall between the two cells", () => {
        const grid = createGrid(7, ['3,3'])
        expect(grid.canSee(new Vector2(1, 3), new Vector2(5, 3))).toBe(false)
        expect(grid.canSee(new Vector2(1, 1), new Vector2(5, 1))).toBe(true)
    })
})
