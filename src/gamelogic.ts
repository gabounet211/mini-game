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
        roster: Character[],
    ) {
        const level1 = levels.getNext()
        const desLevel1 = levels.getLevel(level1)
        this.grid = new Grid(levels.maps[desLevel1.map])
        this.victory = desLevel1.victory ?? allEnemiesDefeated
        this.defeat = desLevel1.defeat ?? allHeroesDefeated
        scene.add(this.grid.scene)
        cameraControle.boundMax.setScalar(this.grid.gridsize / 2)
        cameraControle.boundMin.setScalar(-this.grid.gridsize / 2)
        const used = new Set<Character>()
        for (const [x, y, entity, player] of desLevel1.entities) {
            const config = levels.entities[entity]
            let character = player ? roster.find(candidate => candidate.entity === entity && !used.has(candidate)) : undefined
            if (!character) {
                character = createCharacter(entity, config.rarity)
                if (player)
                    roster.push(character)
            }
            used.add(character)
            this.grid.add(config, character, new Vector2(x, y), player)
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
