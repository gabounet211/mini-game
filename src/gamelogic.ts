import { Game } from "./game";
import { Grid } from "./grid";
import { levels } from './gltf';
import { Scene, Vector2 } from "three";
import { Selector } from "./selector";
import { CameraControle } from "./cameraControle";

const STATE = {
    PlayerTurn: {},
    AiTurn: {}
} as const satisfies Record<string, {

}>;

export class GameLogic {
    grid: Grid


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
        for (const [x, y, entity] of desLevel1.entities) {
            this.grid.add(levels.entities[entity], new Vector2(x, y))
        }


    }
}
