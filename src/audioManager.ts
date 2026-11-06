import { Audio, AudioListener, AudioLoader, Object3D } from 'three';

export type VolumeKind = 'main' | 'sfx' | 'music'

const musicGain = 0.1

export class AudioManager {
    volumes: Record<VolumeKind, number> = { main: 1, sfx: 1, music: 0.5 }

    private listener = new AudioListener()
    private music = new Audio(this.listener)
    private loaded = false
    private started = false

    constructor(camera: Object3D) {
        camera.add(this.listener)

        new AudioLoader().load('music_test.mp3', (buffer) => {
            this.music.setBuffer(buffer)
            this.music.setLoop(true)
            this.loaded = true
            this.applyVolumes()
            this.tryPlay()
        })

        for (const type of ['pointerdown', 'keydown'])
            document.addEventListener(type, () => this.start(), { once: true })
    }

    setVolume(kind: VolumeKind, value: number) {
        this.volumes[kind] = value
        this.applyVolumes()
    }

    private applyVolumes() {
        this.music.setVolume(this.volumes.main * this.volumes.music * musicGain)
    }

    private start() {
        if (this.started)
            return
        this.started = true
        this.listener.context.resume().then(() => this.tryPlay())
    }

    private tryPlay() {
        if (this.started && this.loaded && !this.music.isPlaying)
            this.music.play()
    }
}
