import './style.css'
import { Scene, PerspectiveCamera, AmbientLight, WebGLRenderer, Color, Vector3, BufferGeometry, PointsMaterial, Points, BufferAttribute, Raycaster, AudioLoader, AudioListener, Audio, Vector2, Cylindrical } from 'three';
import { Selector } from './selector';
import { Grid } from './grid';
import { Archer, Cleric, Fighter, gltf, map1, Tank } from './gltf';

const BOARDSIZE = 30

const renderer = new WebGLRenderer({
  antialias: true,
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)
renderer.domElement.onselectstart = () => {
  return false
}

const camera = new PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 30, 0)
camera.lookAt(new Vector3())

window.addEventListener('resize', (ev) => {
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
})

const scene = new Scene();

const grid = new Grid(map1)
scene.add(grid.scene)

const light = new AmbientLight(Color.NAMES.white, 1);
scene.add(light)




let delta = new Cylindrical(20, 0, 20);
const tmpPos = new Vector3();
const tmpPos2 = new Vector3();
const keydown: Record<string, boolean> = {}

function animation() {
  if (keydown["q"])
    delta.theta += 0.02
  if (keydown["e"])
    delta.theta -= 0.02

  selector.update();

  tmpPos.setFromCylindrical(delta).add(selector.block.position);
  camera.position.lerp(tmpPos, 0.1);

  tmpPos2.lerp(selector.block.position, 0.1);
  camera.lookAt(tmpPos2);

  camera.updateMatrix();
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animation)

document.addEventListener("keydown", (ev) => {
  keydown[ev.key] = true;
})
document.addEventListener("keyup", (ev) => {
  keydown[ev.key] = false;
})
document.addEventListener("wheel", (ev) => {
  delta.radius += ev.deltaY / 200;
  if (delta.radius < 2.5)
    delta.radius = 2.5
  delta.y = delta.radius;
})

const point = []
const raycaster = new Raycaster()
const vec1 = new Vector3()
const vec2 = new Vector3(0, -1, 0)
for (let x = 0; x < BOARDSIZE; x++) {
  for (let y = 0; y < BOARDSIZE; y++) {
    vec1.set(x - BOARDSIZE / 2 + .5, 1.1, y - BOARDSIZE / 2 + .5)
    raycaster.set(vec1, vec2)
    const result = raycaster.intersectObjects(gltf.scene.children)
    const hit = result.some(el => {
      return !el.object.userData['Plane']
    })
    if (!hit)
      point.push(vec1.x, 0.01, vec1.z)
  }
}

const dotGeometry = new BufferGeometry();
dotGeometry.setAttribute('position', new BufferAttribute(new Float32Array(point), 3));
const dotMaterial = new PointsMaterial({ size: 0.25, color: 0xff0000 });
const dot = new Points(dotGeometry, dotMaterial);
scene.add(dot);

const selector = new Selector(camera, grid)
scene.add(selector.obj)
scene.add(selector.block)

// create an AudioListener and add it to the camera
const listener = new AudioListener();
camera.add(listener);

// create a global audio source
const sound = new Audio(listener);

// load a sound and set it as the Audio object's buffer
const audioLoader = new AudioLoader();
audioLoader.load('music_test.mp3', function (buffer) {
  sound.setBuffer(buffer);
  sound.setLoop(true);
  sound.setVolume(0.05);
});

const bouton = document.createElement('button')
let toggle_music = false

bouton.textContent = 'play music'
bouton.addEventListener('click', (ev) => {
  ev.preventDefault()
  toggle_music = !toggle_music
  if (toggle_music)
    sound.play()
  else
    sound.stop()
})

document.body.append(bouton)

const cleric = new Cleric()
grid.add(cleric, new Vector2(0, 0));

const fighter = new Fighter()
grid.add(fighter, new Vector2(1, 0));

const tank = new Tank()
grid.add(tank, new Vector2(2, 0));

const archer = new Archer()
grid.add(archer, new Vector2(3, 0));

