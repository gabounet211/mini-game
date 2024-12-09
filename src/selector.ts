import { BufferAttribute, BufferGeometry, Color, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Vector2, Vector3 } from "three";
import { Grid, SmallGrid } from "./grid";
import { Piece } from "./piece";
import { CameraControle } from "./cameraControle";



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

    constructor(
        private cameraControle: CameraControle, private grid: Grid
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
            ev.preventDefault()
            if (this.hoveredCase === undefined) {
                return;
            }

            if (this.isPlayerEntity(this.hoveredCase)) {

                if (this.selected === this.hoveredCase)
                    this.unselect()
                else
                    this.select()

            } else if (this.selected) {//We move

                if (this.selectedMov?.get(this.grid_pos)) {
                    this.grid.move(this.selectedPos, this.grid_pos)
                    this.unselect()
                }

            } else
                this.cameraControle.target.set(this.world_pos.x, .0105, this.world_pos.z)
        })
    }

    update() {
        this.hoveredCase = this.grid.screenTest(this.mousePos, this.cameraControle.camera, this.world_pos, this.grid_pos)
        if (!this.hoveredCase) {
            this.obj.visible = false
            return;
        }
        this.obj.visible = true

        this.obj.position.set(this.world_pos.x, 0.01, this.world_pos.z)
    }

    private unselect() {
        this.selected = false;
        this.block.visible = false;
    }

    private select() {
        if (!(this.isPlayerEntity(this.hoveredCase)))
            throw new Error();

        this.selected = this.hoveredCase;
        this.selectedPos.copy(this.grid_pos);

        this.block.visible = true;
        this.block.position.set(this.world_pos.x, .0105, this.world_pos.z);
        this.block.children.length = 0
        this.cameraControle.target.copy(this.block.position)

        this.selectedMov = this.grid.floodFill(this.selectedPos, this.selected.config.moveRange);

        const pos = new Vector2();
        this.selectedMov.forEach((x, y, state) => {
            if (!state)
                return;
            const block = new Mesh(
                new PlaneGeometry(1, 1),
                new MeshBasicMaterial({ color: Color.NAMES.aquamarine, opacity: 0.5, transparent: true })
            )
            //block.rotateX(-Math.PI / 2);
            this.grid.gridToWorldPos(pos.set(x, y));
            block.position.set(pos.x - this.block.position.x, -pos.y + this.block.position.z, 0);
            this.block.add(block)
        })
    }

    private isPlayerEntity(entity: any): entity is Piece {
        return entity instanceof Piece
    }

}


