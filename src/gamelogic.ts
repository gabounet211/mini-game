import { Game } from "./game";
import { Grid } from "./grid";
import { levels } from './gltf';
import { Color, Group, Mesh, MeshBasicMaterial, PlaneGeometry, Scene, Vector2, Vector3 } from "three";
import { applyGroundZones, drawGroundZones, GroundZone } from "./groundZone";
import { Selector } from "./selector";
import { CameraControle } from "./cameraControle";
import { Character, createCharacter } from "./character";
import { Piece, PieceConfig } from "./piece";
import { concentrationRegen } from "./action";
import { grantDefeatResults, grantVictoryRewards } from "./rewards";
import { allEnemiesDefeated, allHeroesDefeated, EndCondition } from "./endCondition";

const STATE = {
    Placement: {},
    PlayerTurn: {},
    AiTurn: {},
    Victory: {},
    Defeat: {},
} as const satisfies Record<string, {

}>;

export class GameLogic {
    grid: Grid
    state: keyof typeof STATE = "Placement"
    startCells: Vector2[] = []
    victory: EndCondition
    defeat: EndCondition
    heroes: Piece[] = []
    rewards: string[] = []
    levelKey: string
    groundZones: GroundZone[] = []
    zoneGroup = new Group()
    round = 1


    constructor(
        scene: Scene,
        cameraControle: CameraControle,
        team: Character[],
        levelKey: string,
    ) {
        this.levelKey = levelKey
        scene.add(this.zoneGroup)
        const desLevel1 = levels.getLevel(levelKey)
        this.grid = new Grid(levels.maps[desLevel1.map])
        this.victory = desLevel1.victory ?? allEnemiesDefeated
        this.defeat = desLevel1.defeat ?? allHeroesDefeated
        this.drawTargetCells(scene)
        scene.add(this.grid.scene)
        cameraControle.boundMax.setScalar(this.grid.gridsize / 2)
        cameraControle.boundMin.setScalar(-this.grid.gridsize / 2)
        this.startCells = desLevel1.startCells.map(([x, y]) => new Vector2(x, y)).filter(cell => this.grid.isFree(cell))
        team.slice(0, Math.min(desLevel1.teamSize, this.startCells.length)).forEach((character, index) => {
            this.heroes.push(this.grid.add(levels.entities[character.entity as keyof typeof levels.entities], character, this.startCells[index], true))
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

    isStartCell(pos: Vector2) {
        return this.startCells.some(cell => cell.equals(pos))
    }

    startBattle() {
        if (this.state === "Placement")
            this.state = "PlayerTurn"
    }

    checkEnd() {
        if (this.state !== "PlayerTurn" && this.state !== "AiTurn")
            return
        const battle = { grid: this.grid, round: this.round }
        if (this.defeat.check(battle)) {
            this.state = "Defeat"
            this.rewards = grantDefeatResults(this.heroes, this.levelKey)
        }
        else if (this.victory.check(battle)) {
            this.state = "Victory"
            this.rewards = grantVictoryRewards(this.heroes, this.levelKey)
        }
    }

    private drawTargetCells(scene: Scene) {
        const group = new Group()
        for (const cell of [...this.victory.cells ?? [], ...this.defeat.cells ?? []]) {
            const pos = this.grid.gridToWorldPos(cell.clone())
            const block = new Mesh(
                new PlaneGeometry(0.9, 0.9),
                new MeshBasicMaterial({ color: Color.NAMES.gold, opacity: 0.45, transparent: true })
            )
            block.rotateX(-Math.PI / 2)
            block.position.set(pos.x, .006, pos.y)
            group.add(block)
        }
        scene.add(group)
    }

    addGroundZone(zone: GroundZone) {
        this.groundZones.push(zone)
        drawGroundZones(this.zoneGroup, this.groundZones, this.grid)
    }

    endTurn() {
        if (this.state !== "PlayerTurn" && this.state !== "AiTurn")
            return
        for (const piece of this.grid.getPieces(this.state === "PlayerTurn"))
            piece.endOwnTurn()
        this.state = this.state === "PlayerTurn" ? "AiTurn" : "PlayerTurn"
        if (this.state === "PlayerTurn")
            this.round++
        this.groundZones = applyGroundZones(this.groundZones, this.grid, this.state === "PlayerTurn")
        drawGroundZones(this.zoneGroup, this.groundZones, this.grid)
        for (const piece of this.grid.getPieces(this.state === "PlayerTurn"))
            piece.startOwnTurn(concentrationRegen)
        this.grid.removeDead()
    }
}
