import { AmbientLight, Color, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from "three";
import { Ui } from "./ui";
import { CameraControle } from "./cameraControle";
import { Selector } from "./selector";
import { GameLogic } from "./gamelogic";



export class Game {
    ui = new Ui(this)
    renderer: WebGLRenderer;
    camera: PerspectiveCamera;
    cameraControle: CameraControle;
    scene = new Scene();
    light: AmbientLight;
    gameLogic: GameLogic
    selector: Selector;

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

        this.light = new AmbientLight(Color.NAMES.white, 1);
        this.scene.add(this.light)

        this.gameLogic = new GameLogic(this.scene,this.cameraControle);
        this.selector = new Selector(this.cameraControle, this.gameLogic, this.ui)
        this.scene.add(this.selector.obj)
        this.scene.add(this.selector.block)
    }
}

