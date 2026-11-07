import { Game } from "./game";
import { Grid } from "./grid";
import { levels } from './gltf';
import { Scene, Vector2 } from "three";
import { Selector } from "./selector";
import { CameraControle } from "./cameraControle";

const STATE = {
    PlayerTurn: {},
    AiTurn: {},
    Victory: {},
    Defeat: {},
} as const satisfies Record<string, {

}>;

export class GameLogic {
    grid: Grid
    state: keyof typeof STATE = "PlayerTurn"


    constructor(
        scene: Scene,
        cameraControle: CameraControle
    ) {
        const level1 = levels.getNext()
        const desLevel1 = levels.getLevel(level1)
        this.grid = new Grid(levels.maps[desLevel1.map])
        scene.add(this.grid.scene)
        cameraControle.boundMax.setScalar(this.grid.gridsize / 2)
        cameraControle.boundMin.setScalar(-this.grid.gridsize / 2)
        for (const [x, y, entity, player] of desLevel1.entities) {
            this.grid.add(levels.entities[entity], new Vector2(x, y), player)
        }


    }

    checkEnd() {
        if (this.state !== "PlayerTurn" && this.state !== "AiTurn")
            return
        if (!this.grid.getPieces(false).length)
            this.state = "Victory"
        else if (!this.grid.getPieces(true).length)
            this.state = "Defeat"
    }

    endTurn() {
        if (this.state !== "PlayerTurn" && this.state !== "AiTurn")
            return
        this.state = this.state === "PlayerTurn" ? "AiTurn" : "PlayerTurn"
        for (const piece of this.grid.getPieces(this.state === "PlayerTurn")) {
            piece.hasMoved = false
            piece.actionPoints = piece.maxActionPoints
        }
    }
}
