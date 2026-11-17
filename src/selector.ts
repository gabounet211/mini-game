import { BufferAttribute, BufferGeometry, Color, Group, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Vector2, Vector3 } from "three";
import { Grid, SmallGrid } from "./grid";
import { Piece } from "./piece";
import { Action, canTarget, canUse, spendAction } from "./action";
import { areaCells } from "./area";
import { CameraControle } from "./cameraControle";
import { Ui } from "./ui";
import { GameLogic } from "./gamelogic";



export class Selector {
    obj = new Mesh(
        new PlaneGeometry(1, 1),
        new MeshBasicMaterial()
    )

    private attackBlocks: Mesh<PlaneGeometry, MeshBasicMaterial>[] = []
    block = new Mesh(
        new PlaneGeometry(1, 1),
        new MeshBasicMaterial({ color: Color.NAMES.aquamarine })
    )

    placementZone = new Group()
    areaPreview = new Group()
    private previewKey = ''

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

        this.showPlacementZone()

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

            if (this.gameLogic.state === "Placement") {
                this.placementClick()
            } else if (this.selected && this.targetingAction) {
                this.target()
            } else if (this.isPlayerEntity(this.hoveredCase)) {

                if (this.selected === this.hoveredCase)
                    this.unselect()
                else
                    this.select(this.hoveredCase, this.grid_pos)

            } else if (this.selected) {//We move

                if (this.selectedMov?.get(this.grid_pos)) {
                    const piece = this.selected
                    piece.movePoints -= this.gameLogic.grid.move(this.selectedPos, this.grid_pos)
                    this.select(piece, this.grid_pos.clone())
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
        this.updateAreaPreview()
    }

    private updateAreaPreview() {
        const action = this.targetingAction
        const visible = !!action?.area && !!this.selected && !!this.selectedAttack?.get(this.grid_pos)
        const key = visible ? this.grid_pos.x + ',' + this.grid_pos.y : ''
        if (key === this.previewKey)
            return
        this.previewKey = key
        this.areaPreview.clear()
        if (!visible || !action?.area)
            return
        for (const cell of areaCells(action.area, this.selectedPos, this.grid_pos)) {
            const pos = this.gameLogic.grid.gridToWorldPos(cell.clone())
            const block = new Mesh(
                new PlaneGeometry(0.9, 0.9),
                new MeshBasicMaterial({ color: Color.NAMES.orange, opacity: 0.6, transparent: true })
            )
            block.rotateX(-Math.PI / 2)
            block.position.set(pos.x, .012, pos.y)
            this.areaPreview.add(block)
        }
    }

    private placementClick() {
        const hovered = this.hoveredCase
        const canSwap = this.isPlayerEntity(hovered) || (hovered === true && this.gameLogic.isStartCell(this.grid_pos))
        if (this.selected && this.selected !== hovered && canSwap) {
            this.gameLogic.grid.swap(this.selectedPos, this.grid_pos)
            this.unselect()
        } else if (this.isPlayerEntity(hovered)) {
            if (this.selected === hovered)
                this.unselect()
            else
                this.select(hovered, this.grid_pos)
        }
    }

    private showPlacementZone() {
        if (this.gameLogic.state !== "Placement")
            return
        for (const cell of this.gameLogic.startCells) {
            const pos = this.gameLogic.grid.gridToWorldPos(cell.clone())
            const block = new Mesh(
                new PlaneGeometry(0.9, 0.9),
                new MeshBasicMaterial({ color: Color.NAMES.gold, opacity: 0.4, transparent: true })
            )
            block.rotateX(-Math.PI / 2)
            block.position.set(pos.x, .009, pos.y)
            this.placementZone.add(block)
        }
    }

    endPlacement() {
        this.unselect()
        this.placementZone.clear()
    }

    unselect() {
        this.selected = false;
        this.targetingAction = undefined;
        this.ui.setTargeting(undefined)
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

        const placing = this.gameLogic.state === "Placement"
        if (!placing) {
            this.ui.setActionsVisible(true);
            this.ui.setActions(piece.actions);
        }
        this.ui.showSheet(piece)

        const worldPos = this.gameLogic.grid.gridToWorldPos(gridPos.clone())
        this.block.visible = true;
        this.block.position.set(worldPos.x, .0105, worldPos.y);
        this.block.children.length = 0
        this.cameraControle.target.copy(this.block.position)
        if (placing)
            return

        this.selectedMov = piece.movePoints > 0 ? this.gameLogic.grid.floodFill(this.selectedPos, piece.movePoints) : undefined;
        if (this.selectedMov)
            this.showRange(this.selectedMov, Color.NAMES.aquamarine, 0)

        this.attackBlocks = []
        this.selectedAttack = undefined
    }

    private showAttackRange(action: Action, color: number) {
        if (!this.selected)
            return
        this.block.remove(...this.attackBlocks)
        this.selectedAttack = this.gameLogic.grid.attackFill(this.selectedPos, action.range, action.line);
        this.attackBlocks = this.showRange(this.selectedAttack, color, 0.001)
    }

    private hideAttackRange() {
        this.block.remove(...this.attackBlocks)
        this.attackBlocks = []
        this.selectedAttack = undefined
    }

    startTargeting(action: Action) {
        if (this.targetingAction === action) {
            this.targetingAction = undefined
            this.hideAttackRange()
            this.ui.setTargeting(undefined)
            return
        }
        this.targetingAction = action
        this.showAttackRange(action, action.targets === "ally" ? Color.NAMES.limegreen : Color.NAMES.red)
        this.ui.setTargeting(action)
    }

    private target() {
        const piece = this.selected
        const action = this.targetingAction
        const target = this.hoveredCase
        const inRange = !!action && canTarget(action, this.selectedPos, this.grid_pos) && this.selectedAttack?.get(this.grid_pos)
        this.targetingAction = undefined
        this.hideAttackRange()
        this.ui.setTargeting(undefined)
        this.areaPreview.clear()
        const wantsAlly = action?.targets === "ally"
        if (!piece || !action)
            return
        if (action.area) {
            if (!inRange)
                return
        } else {
            if (!(target instanceof Piece))
                return
            if (action.targets === "any" ? target === piece : (target.player === piece.player) !== wantsAlly)
                return
            if (!inRange && !(wantsAlly && target === piece))
                return
        }

        if (!canUse(piece, action))
            return
        action.action(this.ui.game, target instanceof Piece ? target : undefined, piece, this.grid_pos.clone())
        piece.attack(new Vector3(this.world_pos.x, piece.obj.position.y, this.world_pos.z))
        spendAction(piece, action)
        this.gameLogic.grid.removeDead()
        const position = this.gameLogic.grid.getPosition(piece)
        if (position && !position.equals(this.selectedPos))
            this.select(piece, position)
        else
            this.ui.setActions(piece.actions)
    }

    private showRange(range: SmallGrid<boolean>, color: number, height: number) {
        const pos = new Vector2();
        const blocks: Mesh<PlaneGeometry, MeshBasicMaterial>[] = []
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
            blocks.push(block)
        })
        return blocks
    }

    private isPlayerEntity(entity: any): entity is Piece {
        return entity instanceof Piece && entity.player && (this.gameLogic.state === "PlayerTurn" || this.gameLogic.state === "Placement")
    }

}


