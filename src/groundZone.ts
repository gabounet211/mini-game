import { Color, Group, Mesh, MeshBasicMaterial, PlaneGeometry, Vector2 } from "three"
import { Grid } from "./grid"
import { StatusEffect } from "./effect"
import { piecesInArea } from "./area"

export interface GroundZone {
    cells: Vector2[]
    player: boolean
    effect: StatusEffect
    turns: number
}

export function applyGroundZones(zones: GroundZone[], grid: Grid, side: boolean) {
    for (const zone of zones) {
        if (zone.player === side)
            continue
        for (const piece of piecesInArea(grid, zone.cells))
            if (piece.player === side)
                piece.addEffect({ ...zone.effect }, true)
        zone.turns--
    }
    return zones.filter(zone => zone.turns > 0)
}

export function drawGroundZones(group: Group, zones: GroundZone[], grid: Grid) {
    group.clear()
    for (const zone of zones) {
        for (const cell of zone.cells) {
            const pos = grid.gridToWorldPos(cell.clone())
            const block = new Mesh(
                new PlaneGeometry(0.9, 0.9),
                new MeshBasicMaterial({ color: Color.NAMES.slateblue, opacity: 0.35, transparent: true })
            )
            block.rotateX(-Math.PI / 2)
            block.position.set(pos.x, .008, pos.y)
            group.add(block)
        }
    }
}
