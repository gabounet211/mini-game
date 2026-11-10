import { describe, expect, it } from "vitest"
import { Vector2 } from "three"
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
