import { Game } from "./game";
import { Grid } from "./grid";
import { levels } from './gltf';
import { Scene, Vector2, Vector3 } from "three";
import { Selector } from "./selector";
import { CameraControle } from "./cameraControle";
import { Character, createCharacter } from "./character";
import { Piece, PieceConfig } from "./piece";
import { grantDefeatResults, grantVictoryRewards } from "./rewards";
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
    heroes: Piece[] = []
    rewards: string[] = []
    levelKey: string


    constructor(
        scene: Scene,
        cameraControle: CameraControle,
        team: Character[],
        levelKey: string,
    ) {
        this.levelKey = levelKey
        const desLevel1 = levels.getLevel(levelKey)
        this.grid = new Grid(levels.maps[desLevel1.map])
        this.victory = desLevel1.victory ?? allEnemiesDefeated
        this.defeat = desLevel1.defeat ?? allHeroesDefeated
        scene.add(this.grid.scene)
        cameraControle.boundMax.setScalar(this.grid.gridsize / 2)
        cameraControle.boundMin.setScalar(-this.grid.gridsize / 2)
        team.slice(0, desLevel1.startCells.length).forEach((character, index) => {
            const [x, y] = desLevel1.startCells[index]
            this.heroes.push(this.grid.add(levels.entities[character.entity as keyof typeof levels.entities], character, new Vector2(x, y), true))
        })
        for (const [x, y, entity, player] of desLevel1.entities) {
            const config: PieceConfig = levels.entities[entity]
            this.grid.add(config, createCharacter(entity, config.rarity, config.characterClass), new Vector2(x, y), player)
        }
        if (this.heroes.length) {
            const center = new Vector3()
            for (const hero of this.heroes)
                center.add(hero.obj.position)
            cameraControle.jumpTo(center.divideScalar(this.heroes.length), Math.PI)
        }


    }

    checkEnd() {
        if (this.state !== "PlayerTurn" && this.state !== "AiTurn")
            return
        if (this.defeat(this.grid)) {
            this.state = "Defeat"
            grantDefeatResults(this.heroes, this.levelKey)
        }
        else if (this.victory(this.grid)) {
            this.state = "Victory"
            this.rewards = grantVictoryRewards(this.heroes, this.levelKey)
        }
    }

    endTurn() {
        if (this.state !== "PlayerTurn" && this.state !== "AiTurn")
            return
        for (const piece of this.grid.getPieces(this.state === "PlayerTurn"))
            piece.endOwnTurn()
        this.state = this.state === "PlayerTurn" ? "AiTurn" : "PlayerTurn"
        for (const piece of this.grid.getPieces(this.state === "PlayerTurn")) {
            piece.hasMoved = false
            piece.actionPoints = piece.maxActionPoints
        }
    }
}
