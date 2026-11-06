import './style.css'
import { Game } from './game';

const game = new Game

window.addEventListener('resize', () => {
  game.renderer.setSize(window.innerWidth, window.innerHeight)
  game.camera.aspect = window.innerWidth / window.innerHeight
  game.camera.updateProjectionMatrix()
})

const keydown: Record<string, boolean> = {}

function animation() {
  if (keydown["q"])
    game.cameraControle.orbit.theta += 0.02
  if (keydown["e"])
    game.cameraControle.orbit.theta -= 0.02

  if (keydown["d"])
    game.cameraControle.delta.x += game.cameraControle.orbit.radius / 100
  if (keydown["a"])
    game.cameraControle.delta.x -= game.cameraControle.orbit.radius / 100

  if (keydown["s"])
    game.cameraControle.delta.y += game.cameraControle.orbit.radius / 100
  if (keydown["w"])
    game.cameraControle.delta.y -= game.cameraControle.orbit.radius / 100

  game.cameraControle.update()
  game.selector.update();
  game.ui.updateCards()

  game.renderer.render(game.scene, game.camera);
}
game.renderer.setAnimationLoop(animation)

document.addEventListener("keydown", (ev) => {
  keydown[ev.key] = true;
})
document.addEventListener("keyup", (ev) => {
  keydown[ev.key] = false;
})
document.addEventListener("wheel", (ev) => {
  const delta = game.cameraControle.orbit
  delta.radius += ev.deltaY / 200;
  if (delta.radius < 2.5)
    delta.radius = 2.5
  delta.y = delta.radius;
})

