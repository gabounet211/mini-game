import { Vector2 } from "three"
import { Grid } from "./grid"
import { direction } from "./movement"

export type AreaShape =
    | { kind: "square", size: number }
    | { kind: "radius", size: number }
    | { kind: "sweep" }

export function areaCells(shape: AreaShape, from: Vector2, center: Vector2) {
    switch (shape.kind) {
        case "square": {
            const stepX = Math.sign(center.x - from.x) || 1
            const stepY = Math.sign(center.y - from.y) || 1
            const cells: Vector2[] = []
            for (let i = 0; i < shape.size; i++)
                for (let j = 0; j < shape.size; j++)
                    cells.push(new Vector2(center.x + i * stepX, center.y + j * stepY))
            return cells
        }
        case "radius": {
            const cells: Vector2[] = []
            for (let x = -shape.size; x <= shape.size; x++)
                for (let y = -shape.size; y <= shape.size; y++)
                    if (Math.abs(x) + Math.abs(y) <= shape.size)
                        cells.push(new Vector2(center.x + x, center.y + y))
            return cells
        }
        case "sweep": {
            const toward = direction(from, center)
            const side = new Vector2(toward.y, toward.x)
            return [center.clone(), center.clone().add(side), center.clone().sub(side)]
        }
    }
}

export function piecesInArea(grid: Grid, cells: Vector2[]) {
    return cells.map(cell => grid.pieceAt(cell)).filter(piece => !!piece)
}
