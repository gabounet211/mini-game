import { describe, expect, it } from "vitest"
import { Vector2 } from "three"
import { Grid } from "./grid"
import { Piece } from "./piece"
import { forceMove } from "./movement"

function setup(size: number, walls: string[], pieces: Record<string, Piece>) {
    const grid = Object.create(Grid.prototype) as Grid
    const cells: Record<string, true | undefined | Piece> = {}
    for (let x = 0; x < size; x++)
        for (let y = 0; y < size; y++)
            if (!walls.includes(x + ',' + y))
                cells[x + ',' + y] = true
    Object.assign(cells, pieces)
    Object.assign(grid, { cells, gridsize: size, seeThrough: new Set() })
    return grid
}

function piece() {
    return { offset: 0, walk() { } } as unknown as Piece
}

const at = (x: number, y: number) => new Vector2(x, y)

describe("forceMove", () => {
    it("dashes next to the target in a straight line", () => {
        const user = piece(), target = piece()
        const grid = setup(7, [], { '0,0': user, '0,4': target })
        forceMove(grid, "dash", user, target)
        expect(grid.getPosition(user)!.equals(at(0, 3))).toBe(true)
    })

    it("lands on the free cell next to the target closest to the user when not in line", () => {
        const user = piece(), target = piece()
        const grid = setup(7, [], { '0,0': user, '2,2': target })
        forceMove(grid, "dash", user, target)
        expect(Grid.manathanDistance(grid.getPosition(user)!, at(2, 2))).toBe(1)
        expect(Grid.manathanDistance(grid.getPosition(user)!, at(0, 0))).toBe(3)
    })

    it("pushes the target until a wall stops it", () => {
        const user = piece(), target = piece()
        const grid = setup(7, ['0,3'], { '0,0': user, '0,1': target })
        forceMove(grid, "push", user, target, 2)
        expect(grid.getPosition(target)!.equals(at(0, 2))).toBe(true)
    })

    it("pulls the target next to the user", () => {
        const user = piece(), target = piece()
        const grid = setup(7, [], { '0,0': user, '3,0': target })
        forceMove(grid, "pull", user, target)
        expect(grid.getPosition(target)!.equals(at(1, 0))).toBe(true)
    })

    it("jumps over the target only if the cell behind it is free", () => {
        const user = piece(), target = piece(), blocker = piece()
        const grid = setup(7, [], { '0,0': user, '0,1': target })
        forceMove(grid, "jump", user, target)
        expect(grid.getPosition(user)!.equals(at(0, 2))).toBe(true)
        const blocked = setup(7, [], { '0,0': user, '0,1': target, '0,2': blocker })
        expect(forceMove(blocked, "jump", user, target)).toBe(false)
    })

    it("retreats away from the target", () => {
        const user = piece(), target = piece()
        const grid = setup(7, [], { '0,3': user, '0,2': target })
        forceMove(grid, "retreat", user, target, 2)
        expect(grid.getPosition(user)!.equals(at(0, 5))).toBe(true)
    })
})
