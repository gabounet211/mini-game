import { Cylindrical, PerspectiveCamera, Vector2, Vector3 } from "three";

const zero = new Vector2(0, 0);

export class CameraControle {
    public target = new Vector3();
    public orbit = new Cylindrical(20, 0, 20);
    private realTarget = new Vector3();
    private lookAtTarget = new Vector3();
    public delta = new Vector2()

    constructor(
        public camera: PerspectiveCamera,
        public boundMin: Vector3,
        public boundMax: Vector3,
    ) {
        this.camera.rotation.order = "YXZ"
    }
    update() {
        const angle = -this.camera.rotation.y;
        this.delta.rotateAround(zero, angle)
        this.target.x += this.delta.x
        this.target.z += this.delta.y
        this.delta.set(0, 0)

        this.target.min(this.boundMax)
        this.target.max(this.boundMin)

        this.realTarget.setFromCylindrical(this.orbit).add(this.target);
        this.camera.position.lerp(this.realTarget, 0.1);

        this.lookAtTarget.lerp(this.target, 0.1);
        this.camera.lookAt(this.lookAtTarget);

        this.camera.updateMatrix();
    }
}
