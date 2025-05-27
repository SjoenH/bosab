/**
 * Act 3 - Human: Organic forms, poetry overlays, emotional visuals
 * 
 * Creates flowing organic shapes that respond to emotional audio cues,
 * with poetry text overlays representing the human element.
 */

import * as THREE from 'three'
import { BaseAct } from './BaseAct'
import type { AudioData, AudioAnalyzerInterface } from '../types'

export class Act3Human extends BaseAct {
    private organicForms: THREE.Mesh[] = []
    private flowingLines: THREE.Line[] = []
    private emotionalParticles: THREE.Points[] = []

    private colors = {
        flesh: new THREE.Color(0xffdbac),
        blood: new THREE.Color(0xc41e3a),
        heartbeat: new THREE.Color(0xff6b6b),
        soul: new THREE.Color(0x9966cc),
        emotion: new THREE.Color(0xff9999)
    }

    private emotionalState: number = 0
    private heartbeatRhythm: number = 0

    constructor(scene: THREE.Scene, camera: THREE.Camera, audioAnalyzer: AudioAnalyzerInterface, actNumber: number) {
        super(scene, camera, audioAnalyzer, actNumber)
        console.log(`❤️ Act3Human created`)
    }

    /**
     * Create act-specific content - implements BaseAct abstract method
     */
    protected async createContent(): Promise<void> {
        this.createOrganicForms()
        this.createFlowingLines()
        this.createEmotionalParticles()
        console.log('❤️ Act 3 - Human content created')
    }

    private createOrganicForms(): void {
        // Create organic blob-like shapes
        const formCount = 8

        for (let i = 0; i < formCount; i++) {
            // Use IcosahedronGeometry for organic base shape
            const geometry = new THREE.IcosahedronGeometry(2, 2)

            // Modify vertices for organic variation
            const positions = geometry.attributes.position.array as Float32Array
            for (let j = 0; j < positions.length; j += 3) {
                const variation = 1 + (Math.random() - 0.5) * 0.3
                positions[j] *= variation
                positions[j + 1] *= variation
                positions[j + 2] *= variation
            }
            geometry.attributes.position.needsUpdate = true

            const material = new THREE.MeshBasicMaterial({
                color: this.colors.flesh,
                transparent: true,
                opacity: 0.7,
                wireframe: Math.random() > 0.5
            })

            const form = new THREE.Mesh(geometry, material)

            // Position organically
            form.position.set(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 20
            )

            form.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            )

            this.organicForms.push(form)
            this.meshes.push(form)
            this.materials.push(material)
            this.group.add(form)
        }
    }

    private createFlowingLines(): void {
        // Create flowing curves representing blood vessels or neural networks
        const lineCount = 12

        for (let i = 0; i < lineCount; i++) {
            const points: THREE.Vector3[] = []
            const segments = 50

            // Create curved path
            for (let j = 0; j < segments; j++) {
                const t = j / segments
                const x = (t - 0.5) * 30 + Math.sin(t * Math.PI * 4) * 3
                const y = Math.sin(t * Math.PI * 2) * 5 + (Math.random() - 0.5) * 2
                const z = Math.cos(t * Math.PI * 3) * 3

                points.push(new THREE.Vector3(x, y, z))
            }

            const geometry = new THREE.BufferGeometry().setFromPoints(points)
            const material = new THREE.LineBasicMaterial({
                color: this.colors.blood,
                transparent: true,
                opacity: 0.6,
                linewidth: 2
            })

            const line = new THREE.Line(geometry, material)
            line.position.y = (Math.random() - 0.5) * 10

            this.flowingLines.push(line)
            this.lines.push(line)
            this.materials.push(material)
            this.group.add(line)
        }
    }

    private createEmotionalParticles(): void {
        // Create particle systems representing emotions
        const systems = 3

        for (let s = 0; s < systems; s++) {
            const particleCount = 200
            const geometry = new THREE.BufferGeometry()
            const positions = new Float32Array(particleCount * 3)
            const velocities = new Float32Array(particleCount * 3)
            const emotions = new Float32Array(particleCount) // Emotional intensity per particle

            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3

                // Start position (heart center)
                positions[i3] = (Math.random() - 0.5) * 2
                positions[i3 + 1] = (Math.random() - 0.5) * 2
                positions[i3 + 2] = (Math.random() - 0.5) * 2

                // Initial velocity (outward flow)
                const velocity = 0.02 + Math.random() * 0.02
                velocities[i3] = (Math.random() - 0.5) * velocity
                velocities[i3 + 1] = (Math.random() - 0.5) * velocity
                velocities[i3 + 2] = (Math.random() - 0.5) * velocity

                emotions[i] = Math.random()
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
            geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
            geometry.setAttribute('emotion', new THREE.BufferAttribute(emotions, 1))

            const material = new THREE.PointsMaterial({
                color: this.colors.heartbeat,
                size: 0.2,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            })

            const particles = new THREE.Points(geometry, material)
            particles.position.set(s * 8 - 8, 0, 0)

            this.emotionalParticles.push(particles)
            this.particles.push(particles)
            this.materials.push(material)
            this.group.add(particles)
        }
    }

    /**
     * Update act content - implements BaseAct abstract method
     */
    protected updateContent(deltaTime: number): void {
        // Update emotional state based on audio
        this.emotionalState = this.audioLevel * 0.3 + this.midLevel * 0.7
        this.heartbeatRhythm = this.bassLevel

        // Animate organic forms (breathing/pulsing)
        this.organicForms.forEach((form, index) => {
            // Breathing animation
            const breathe = 1 + Math.sin(this.time * 0.003 + index) * 0.2 * this.emotionalState
            form.scale.setScalar(breathe)

            // Rotation based on emotional state
            form.rotation.x += 0.001 * deltaTime * this.emotionalState
            form.rotation.y += 0.002 * deltaTime * this.emotionalState
            form.rotation.z += 0.0015 * deltaTime * this.emotionalState

            // Color shift with emotion
            const material = form.material as THREE.MeshBasicMaterial
            material.color.lerpColors(
                this.colors.flesh,
                this.colors.emotion,
                this.emotionalState
            )
        })

        // Animate flowing lines (blood flow)
        this.flowingLines.forEach((line, index) => {
            const material = line.material as THREE.LineBasicMaterial

            // Pulse with heartbeat
            material.opacity = 0.4 + this.heartbeatRhythm * 0.4

            // Flow animation
            line.rotation.z += 0.001 * deltaTime * (1 + this.emotionalState)
        })

        // Update emotional particles
        this.emotionalParticles.forEach(particleSystem => {
            const positions = particleSystem.geometry.attributes.position.array as Float32Array
            const velocities = particleSystem.geometry.attributes.velocity?.array as Float32Array
            const emotions = particleSystem.geometry.attributes.emotion?.array as Float32Array

            if (velocities && emotions) {
                for (let i = 0; i < positions.length; i += 3) {
                    const emotion = emotions[i / 3]

                    // Update position
                    positions[i] += velocities[i] * deltaTime * 60 * (1 + this.emotionalState)
                    positions[i + 1] += velocities[i + 1] * deltaTime * 60 * (1 + this.emotionalState)
                    positions[i + 2] += velocities[i + 2] * deltaTime * 60 * (1 + this.emotionalState)

                    // Add emotional turbulence
                    const turbulence = this.emotionalState * emotion * 0.01
                    velocities[i] += (Math.random() - 0.5) * turbulence
                    velocities[i + 1] += (Math.random() - 0.5) * turbulence
                    velocities[i + 2] += (Math.random() - 0.5) * turbulence

                    // Reset particles that go too far
                    const distance = Math.sqrt(
                        positions[i] * positions[i] +
                        positions[i + 1] * positions[i + 1] +
                        positions[i + 2] * positions[i + 2]
                    )

                    if (distance > 15) {
                        positions[i] = (Math.random() - 0.5) * 2
                        positions[i + 1] = (Math.random() - 0.5) * 2
                        positions[i + 2] = (Math.random() - 0.5) * 2

                        velocities[i] = (Math.random() - 0.5) * 0.02
                        velocities[i + 1] = (Math.random() - 0.5) * 0.02
                        velocities[i + 2] = (Math.random() - 0.5) * 0.02
                    }
                }

                particleSystem.geometry.attributes.position.needsUpdate = true
            }
        })
    }

    /**
     * Update visual effects - implements BaseAct abstract method
     */
    protected updateVisualEffects(deltaTime: number): void {
        // Beat-reactive effects
        if (this.beatDetected) {
            // Heartbeat pulse effect
            this.organicForms.forEach(form => {
                form.scale.multiplyScalar(1.1)
            })

            this.emotionalParticles.forEach(particles => {
                const material = particles.material as THREE.PointsMaterial
                material.size = 0.3
                material.color.copy(this.colors.heartbeat)
            })
        } else {
            // Return to normal
            this.emotionalParticles.forEach(particles => {
                const material = particles.material as THREE.PointsMaterial
                material.size = THREE.MathUtils.lerp(material.size, 0.2, 0.1)
                material.color.lerp(this.colors.soul, 0.05)
            })
        }

        // Overall color harmony based on emotional state
        const hue = 0.9 + this.emotionalState * 0.3 // Purple to pink range
        const saturation = 0.6 + this.emotionalState * 0.4
        const lightness = 0.5 + this.audioLevel * 0.3

        this.flowingLines.forEach(line => {
            const material = line.material as THREE.LineBasicMaterial
            material.color.setHSL(hue, saturation, lightness)
        })
    }

    /**
     * Enter animation - implements BaseAct abstract method
     */
    protected async animateEnter(): Promise<void> {
        // Fade in effect
        await this.createFadeTransition(1000)

        // Organic growth animation
        this.organicForms.forEach((form, index) => {
            form.scale.setScalar(0)

            setTimeout(() => {
                const animate = () => {
                    const targetScale = 1
                    form.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.05)

                    if (form.scale.x < 0.95) {
                        requestAnimationFrame(animate)
                    }
                }
                animate()
            }, index * 200)
        })
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
        // Position Act 3 at the third position
        this.actPosition.set(25, 0, 0)
        this.group.position.copy(this.actPosition)
        console.log(`📐 Act ${this.actNumber} positioned at:`, this.actPosition)
    }
}
