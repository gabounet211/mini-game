import { BufferAttribute, BufferGeometry, Color, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Vector2, Vector3 } from "three";
import { Grid, SmallGrid } from "./grid";
import { Piece } from "./piece";
import { Action } from "./action";
import { CameraControle } from "./cameraControle";
import { Ui } from "./ui";
import { GameLogic } from "./gamelogic";



export class Selector {
    obj = new Mesh(
        new PlaneGeometry(1, 1),
        new MeshBasicMaterial()
    )

    block = new Mesh(
        new PlaneGeometry(1, 1),
        new MeshBasicMaterial({ color: Color.NAMES.aquamarine })
    )

    movementGrid = new Line(
        new BufferGeometry(),
        new LineBasicMaterial({ color: Color.NAMES.aqua }),
    )

    mousePos = new Vector2(NaN, NaN)
    world_pos = new Vector3(); // create once and reuse
    grid_pos = new Vector2(); // create once and reuse
    hoveredCase: true | Piece | undefined;

    selected: Piece | false = false;
    selectedPos = new Vector2()
    selectedMov: SmallGrid<boolean> | undefined;
    selectedAttack: SmallGrid<boolean> | undefined;
    targetingAction: Action | undefined;

    constructor(
        private cameraControle: CameraControle, private gameLogic: GameLogic, private ui: Ui
    ) {
        this.obj.rotateX(-Math.PI / 2);
        this.obj.visible = false;

        this.block.rotateX(-Math.PI / 2);
        this.block.visible = false;

        this.movementGrid.visible = false;
        const positions = new Float32Array(200 * 3); // 3 number per point
        this.movementGrid.geometry.setAttribute('position', new BufferAttribute(positions, 3));
        this.movementGrid.geometry.setDrawRange(0, 0);

        document.addEventListener("mousemove", (ev) => {
            this.mousePos.set(
                (ev.clientX / window.innerWidth) * 2 - 1,
                - (ev.clientY / window.innerHeight) * 2 + 1,
            );
        })

        document.addEventListener('click', (ev) => {
            if (!(ev.target instanceof HTMLCanvasElement))
                return
            ev.preventDefault()
            if (this.hoveredCase === undefined) {
                return;
            }

            this.ui.showSheet(this.hoveredCase instanceof Piece ? this.hoveredCase : undefined)

            if (this.isPlayerEntity(this.hoveredCase)) {

                if (this.selected === this.hoveredCase)
                    this.unselect()
                else
                    this.select(this.hoveredCase, this.grid_pos)

            } else if (this.selected) {//We move

                if (this.targetingAction)
                    this.target()
                else if (this.selectedMov?.get(this.grid_pos)) {
                    this.gameLogic.grid.move(this.selectedPos, this.grid_pos)
                    this.selected.hasMoved = true
                    this.unselect()
                }

            } else
                this.cameraControle.target.set(this.world_pos.x, .0105, this.world_pos.z)
        })
    }

    update() {
        this.hoveredCase = this.gameLogic.grid.screenTest(this.mousePos, this.cameraControle.camera, this.world_pos, this.grid_pos)
        if (!this.hoveredCase) {
            this.obj.visible = false
            return;
        }
        this.obj.visible = true

        this.obj.position.set(this.world_pos.x, 0.01, this.world_pos.z)
    }

    unselect() {
        this.selected = false;
        this.targetingAction = undefined;
        this.block.visible = false;
        this.ui.setActionsVisible(false)
    }

    selectPiece(piece: Piece) {
        if (!this.isPlayerEntity(piece))
            return
        if (this.selected === piece) {
            this.unselect()
            return
        }
        const gridPos = this.gameLogic.grid.getPosition(piece)
        if (gridPos)
            this.select(piece, gridPos)
    }

    private select(piece: Piece, gridPos: Vector2) {
        this.selected = piece;
        this.targetingAction = undefined;
        this.selectedPos.copy(gridPos);

        this.ui.setActionsVisible(true);
        this.ui.setActions(piece.actions);
        this.ui.showSheet(piece)

        const worldPos = this.gameLogic.grid.gridToWorldPos(gridPos.clone())
        this.block.visible = true;
        this.block.position.set(worldPos.x, .0105, worldPos.y);
        this.block.children.length = 0
        this.cameraControle.target.copy(this.block.position)

        this.selectedMov = piece.hasMoved ? undefined : this.gameLogic.grid.floodFill(this.selectedPos, piece.moveRange);
        if (this.selectedMov)
            this.showRange(this.selectedMov, Color.NAMES.aquamarine, 0)

        this.selectedAttack = this.gameLogic.grid.attackFill(this.selectedPos, piece.attackRange);
        this.showRange(this.selectedAttack, Color.NAMES.red, 0.001)
    }

    startTargeting(action: Action) {
        this.targetingAction = action
    }

    private target() {
        const piece = this.selected
        const action = this.targetingAction
        const target = this.hoveredCase
        this.targetingAction = undefined
        if (!piece || !action || !(target instanceof Piece) || target.player === piece.player)
            return
        if (Grid.manathanDistance(this.selectedPos, this.grid_pos) > piece.attackRange || !this.selectedAttack?.get(this.grid_pos))
            return

        action.action(this.ui.game, target, piece)
        piece.attack(target.obj.position)
        piece.actionPoints -= action.cost
        this.gameLogic.grid.removeDead()
        this.ui.setActions(piece.actions)
    }

    private showRange(range: SmallGrid<boolean>, color: number, height: number) {
        const pos = new Vector2();
        range.forEach((x, y, state) => {
            if (!state)
                return;
            const block = new Mesh(
                new PlaneGeometry(1, 1),
                new MeshBasicMaterial({ color: color, opacity: 0.5, transparent: true })
            )
            //block.rotateX(-Math.PI / 2);
            this.gameLogic.grid.gridToWorldPos(pos.set(x, y));
            block.position.set(pos.x - this.block.position.x, -pos.y + this.block.position.z, height);
            this.block.add(block)
        })
    }

    private isPlayerEntity(entity: any): entity is Piece {
        return entity instanceof Piece && entity.player && this.gameLogic.state === "PlayerTurn"
    }

}


