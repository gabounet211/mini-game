import { AmbientLight, Color, DirectionalLight, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from "three";
import { Ui } from "./ui";
import { CameraControle } from "./cameraControle";
import { Selector } from "./selector";
import { GameLogic } from "./gamelogic";
import { AudioManager } from "./audioManager";



export class Game {
    ui = new Ui(this)
    renderer: WebGLRenderer;
    camera: PerspectiveCamera;
    cameraControle: CameraControle;
    scene = new Scene();
    light: AmbientLight;
    sun: DirectionalLight;
    gameLogic: GameLogic
    selector: Selector;
    audio: AudioManager;

    constructor() {
        this.renderer = new WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        document.body.appendChild(this.renderer.domElement)
        this.renderer.domElement.onselectstart = () => {
            return false
        }

        this.camera = new PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.cameraControle = new CameraControle(this.camera, new Vector3(), new Vector3())
        this.audio = new AudioManager(this.camera)

        this.light = new AmbientLight(Color.NAMES.white, 1);
        this.scene.add(this.light)
        this.sun = new DirectionalLight(Color.NAMES.white, 1.5)
        this.sun.position.set(5, 10, 3)
        this.scene.add(this.sun)

        this.gameLogic = new GameLogic(this.scene,this.cameraControle);
        this.selector = new Selector(this.cameraControle, this.gameLogic, this.ui)
        this.scene.add(this.selector.obj)
        this.scene.add(this.selector.block)
    }

    endTurn() {
        if (this.gameLogic.state !== "PlayerTurn")
            return
        this.selector.unselect()
        this.gameLogic.endTurn()
        this.playAiTurn()
    }

    private async playAiTurn() {
        try {
            const order = this.gameLogic.grid.getPieces(false)
                .map(piece => ({ piece, initiative: piece.config.behavior?.initiative(piece, this) ?? 0 }))
                .sort((a, b) => a.initiative - b.initiative)
            for (const { piece } of order) {
                if (piece.healt <= 0)
                    continue
                await new Promise(resolve => setTimeout(resolve, 500))
                await piece.config.behavior?.takeTurn(piece, this)
                this.gameLogic.grid.removeDead()
            }
        } finally {
            this.gameLogic.endTurn()
        }
    }
}

