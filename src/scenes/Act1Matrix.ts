/**
 * Act 1 - Matrix: Data streams and clinical waveforms
 * 
 * Creates flowing numbers, clinical waveforms, and data visualization
 * elements. Represents the digital/data aesthetic of the first act.
 */

import * as THREE from 'three'
import { BaseAct } from './BaseAct'
import type { AudioData, AudioAnalyzerInterface } from '../types'

interface DataStream {
    particles: THREE.Mesh[]
    speed: number
    column: number
}

interface Waveform {
    geometry: THREE.BufferGeometry
    material: THREE.LineBasicMaterial
    line: THREE.Line
    points: THREE.Vector3[]
    frequency: number
}

export class Act1Matrix extends BaseAct {
    // Act 1 specific properties
    private dataStreams: DataStream[] = []
    private waveforms: Waveform[] = []
    private dataNumbers: THREE.Mesh[] = []

    private colors = {
        primary: new THREE.Color(0x00ff41),
        secondary: new THREE.Color(0x008f11),
        accent: new THREE.Color(0xffffff),
        background: new THREE.Color(0x001100)
    }

    constructor(scene: THREE.Scene, camera: THREE.Camera, audioAnalyzer: AudioAnalyzerInterface, actNumber: number) {
        super(scene, camera, audioAnalyzer, actNumber)
        console.log(`🔢 Act1Matrix created`)
    }

    /**
     * Create act-specific content - implements BaseAct abstract method
     */
    protected async createContent(): Promise<void> {
        this.createDataStreams()
        this.createWaveforms()
        this.createDataNumbers()
        console.log('🔢 Act 1 - Matrix content created')
    }

    private createDataStreams(): void {
        // Create columns of falling particles representing data streams
        const columns = 25
        const particlesPerColumn = 40

        for (let col = 0; col < columns; col++) {
            const streamParticles: THREE.Mesh[] = []

            for (let i = 0; i < particlesPerColumn; i++) {
                const geometry = new THREE.SphereGeometry(0.05, 8, 8)
                const material = new THREE.MeshBasicMaterial({
                    color: this.colors.primary,
                    transparent: true,
                    opacity: Math.random() * 0.8 + 0.2
                })

                const particle = new THREE.Mesh(geometry, material)

                // Position in column
                particle.position.x = (col - columns / 2) * 1.5
                particle.position.y = (Math.random() - 0.5) * 20
                particle.position.z = (Math.random() - 0.5) * 5

                streamParticles.push(particle)
                this.meshes.push(particle)
                this.materials.push(material)
                this.group.add(particle)
            }

            this.dataStreams.push({
                particles: streamParticles,
                speed: Math.random() * 0.02 + 0.01,
                column: col
            })
        }
    }

    private createWaveforms(): void {
        // Create audio-reactive waveforms
        const waveformCount = 5

        for (let i = 0; i < waveformCount; i++) {
            const points: THREE.Vector3[] = []
            const segments = 100

            for (let j = 0; j < segments; j++) {
                points.push(new THREE.Vector3(
                    (j - segments / 2) * 0.2,
                    Math.sin(j * 0.1) * 2,
                    i * 3 - 6
                ))
            }

            const geometry = new THREE.BufferGeometry().setFromPoints(points)
            const material = new THREE.LineBasicMaterial({
                color: this.colors.secondary,
                transparent: true,
                opacity: 0.7
            })

            const line = new THREE.Line(geometry, material)
            this.group.add(line)

            this.waveforms.push({
                geometry,
                material,
                line,
                points,
                frequency: (i + 1) * 0.05
            })

            this.materials.push(material)
        }
    }

    private createDataNumbers(): void {
        // Create floating numbers/text elements
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        if (!context) return

        canvas.width = 256
        canvas.height = 256

        context.fillStyle = '#00ff41'
        context.font = '48px monospace'
        context.textAlign = 'center'
        context.textBaseline = 'middle'

        for (let i = 0; i < 20; i++) {
            // Clear canvas
            context.clearRect(0, 0, canvas.width, canvas.height)

            // Draw random number
            const number = Math.floor(Math.random() * 10)
            context.fillText(number.toString(), canvas.width / 2, canvas.height / 2)

            // Create texture and material
            const texture = new THREE.CanvasTexture(canvas)
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: Math.random() * 0.5 + 0.3
            })

            const geometry = new THREE.PlaneGeometry(2, 2)
            const mesh = new THREE.Mesh(geometry, material)

            // Position randomly
            mesh.position.set(
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 10
            )

            // Random rotation
            mesh.rotation.z = Math.random() * Math.PI * 2

            this.dataNumbers.push(mesh)
            this.meshes.push(mesh)
            this.materials.push(material)
            this.group.add(mesh)
        }
    }

    /**
     * Update act content - implements BaseAct abstract method
     */
    protected updateContent(deltaTime: number): void {
        // Update data streams
        this.dataStreams.forEach(stream => {
            stream.particles.forEach(particle => {
                particle.position.y -= stream.speed * deltaTime * 60

                // Reset position when particle falls off screen
                if (particle.position.y < -15) {
                    particle.position.y = 15
                }

                // Adjust opacity based on audio
                const material = particle.material as THREE.MeshBasicMaterial
                material.opacity = 0.3 + this.audioLevel * 0.5
            })
        })

        // Update waveforms based on audio
        this.waveforms.forEach((waveform, index) => {
            const points = waveform.points
            const frequency = waveform.frequency

            for (let i = 0; i < points.length; i++) {
                const audioInfluence = index === 0 ? this.bassLevel :
                    index === 1 ? this.midLevel :
                        index === 2 ? this.trebleLevel : this.audioLevel

                points[i].y = Math.sin(i * 0.1 + this.time * frequency) * (2 + audioInfluence * 3)
            }

            waveform.geometry.setFromPoints(points)
            waveform.material.opacity = 0.5 + this.getSmoothedAudio('volume', 0.3) * 0.3
        })

        // Rotate data numbers
        this.dataNumbers.forEach((number, index) => {
            number.rotation.z += 0.001 * deltaTime * (index % 2 === 0 ? 1 : -1)

            // Pulse scale with beat
            if (this.beatDetected) {
                number.scale.setScalar(1.2 + Math.sin(this.time * 0.01) * 0.3)
            } else {
                number.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
            }
        })
    }

    /**
     * Update visual effects - implements BaseAct abstract method
     */
    protected updateVisualEffects(deltaTime: number): void {
        // Adjust overall color intensity based on audio
        const intensity = 0.5 + this.audioLevel * 0.5

        this.dataStreams.forEach(stream => {
            stream.particles.forEach(particle => {
                const material = particle.material as THREE.MeshBasicMaterial
                material.color.setHSL(0.33, 1, intensity) // Green hue with varying lightness
            })
        })

        // Beat-reactive effects
        if (this.beatDetected) {
            // Flash effect on beat
            this.waveforms.forEach(waveform => {
                waveform.material.color.setHSL(0.33, 1, 0.8)
            })
        } else {
            this.waveforms.forEach(waveform => {
                waveform.material.color.lerp(this.colors.secondary, 0.1)
            })
        }
    }

    /**
     * Enter animation - implements BaseAct abstract method
     */
    protected async animateEnter(): Promise<void> {
        // Fade in effect
        await this.createFadeTransition(1000)

        // Stagger in data streams
        for (let i = 0; i < this.dataStreams.length; i++) {
            setTimeout(() => {
                this.dataStreams[i].particles.forEach(particle => {
                    particle.visible = true
                })
            }, i * 50)
        }
    }

    /**
     * Exit animation - implements BaseAct abstract method
     */
    protected async animateExit(): Promise<void> {
        // Fade out effect
        await this.createFadeTransition(1000)
    }

    /**
     * Apply layout position - override BaseAct method
     */
    protected applyLayoutPosition(): void {
        // Position Act 1 at the leftmost position
        this.actPosition.set(-75, 0, 0)
        this.group.position.copy(this.actPosition)
        console.log(`📐 Act ${this.actNumber} positioned at:`, this.actPosition)
    }
}
