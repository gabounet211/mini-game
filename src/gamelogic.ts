import { Game } from "./game";
import { Grid } from "./grid";
import { levels } from './gltf';
import { Scene, Vector2 } from "three";
import { Selector } from "./selector";
import { CameraControle } from "./cameraControle";
import { Character, createCharacter } from "./character";
import { allEnemiesDefeated, allHeroesDefeated, EndCondition } from "./endCondition";

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
    victory: EndCondition
    defeat: EndCondition


    constructor(
        scene: Scene,
        cameraControle: CameraControle,
        team: Character[],
        levelKey: string,
    ) {
        const desLevel1 = levels.getLevel(levelKey)
        this.grid = new Grid(levels.maps[desLevel1.map])
        this.victory = desLevel1.victory ?? allEnemiesDefeated
        this.defeat = desLevel1.defeat ?? allHeroesDefeated
        scene.add(this.grid.scene)
        cameraControle.boundMax.setScalar(this.grid.gridsize / 2)
        cameraControle.boundMin.setScalar(-this.grid.gridsize / 2)
        team.slice(0, desLevel1.startCells.length).forEach((character, index) => {
            const [x, y] = desLevel1.startCells[index]
            this.grid.add(levels.entities[character.entity as keyof typeof levels.entities], character, new Vector2(x, y), true)
        })
        for (const [x, y, entity, player] of desLevel1.entities) {
            const config = levels.entities[entity]
            this.grid.add(config, createCharacter(entity, config.rarity), new Vector2(x, y), player)
        }


    }

    checkEnd() {
        if (this.state !== "PlayerTurn" && this.state !== "AiTurn")
            return
        if (this.defeat(this.grid))
            this.state = "Defeat"
        else if (this.victory(this.grid))
            this.state = "Victory"
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
