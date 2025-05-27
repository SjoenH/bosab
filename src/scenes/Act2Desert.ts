/**
 * Act 2 - Desert: Shifting sand landscapes and heartbeat-driven terrain
 * 
 * Creates undulating sand dunes that respond to heartbeat rhythms and audio,
 * representing the organic/natural transition from digital to human.
 */

import * as THREE from 'three'
import { BaseAct } from './BaseAct'
import type { AudioData, AudioAnalyzerInterface } from '../types'

export class Act2Desert extends BaseAct {
    private terrain: THREE.Mesh | null = null
    private terrainGeometry: THREE.PlaneGeometry | null = null
    private terrainMaterial: THREE.MeshBasicMaterial | null = null
    private originalVertices: Float32Array | null = null

    private colors = {
        sand: new THREE.Color(0xc19a6b),
        darkSand: new THREE.Color(0x8b6914),
        highlight: new THREE.Color(0xf4e4bc),
        shadow: new THREE.Color(0x6b4e00)
    }

    private windTime: number = 0
    private heartbeatPulse: number = 0

    constructor(scene: THREE.Scene, camera: THREE.Camera, audioAnalyzer: AudioAnalyzerInterface, actNumber: number) {
        super(scene, camera, audioAnalyzer, actNumber)
        console.log(`🏜️ Act2Desert created`)
    }

    /**
     * Create act-specific content - implements BaseAct abstract method
     */
    protected async createContent(): Promise<void> {
        this.createTerrain()
        this.createWindParticles()
        console.log('🏜️ Act 2 - Desert content created')
    }

    private createTerrain(): void {
        // Create a plane geometry for the terrain
        const width = 40
        const height = 40
        const widthSegments = 64
        const heightSegments = 64

        this.terrainGeometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments)
        this.terrainMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.sand,
            wireframe: false,
            transparent: true,
            opacity: 0.8
        })

        // Store original vertices for animation
        const positions = this.terrainGeometry.attributes.position.array as Float32Array
        this.originalVertices = new Float32Array(positions)

        // Generate initial height map
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i]
            const y = positions[i + 1]

            // Create dune-like elevation
            const distance = Math.sqrt(x * x + y * y)
            const elevation = Math.sin(distance * 0.1) * 2 + Math.cos(x * 0.05) * Math.sin(y * 0.05) * 3

            positions[i + 2] = elevation
            this.originalVertices[i + 2] = elevation
        }

        this.terrainGeometry.attributes.position.needsUpdate = true
        this.terrainGeometry.computeVertexNormals()

        this.terrain = new THREE.Mesh(this.terrainGeometry, this.terrainMaterial)
        this.terrain.rotation.x = -Math.PI / 2 // Rotate to horizontal
        this.terrain.position.y = -5

        this.meshes.push(this.terrain)
        this.materials.push(this.terrainMaterial)
        this.group.add(this.terrain)
    }

    private createWindParticles(): void {
        // Create particle system for sand/wind effects
        const particleCount = 1000
        const geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(particleCount * 3)
        const velocities = new Float32Array(particleCount * 3)

        for (let i = 0; i < particleCount * 3; i += 3) {
            // Random position
            positions[i] = (Math.random() - 0.5) * 60
            positions[i + 1] = Math.random() * 10
            positions[i + 2] = (Math.random() - 0.5) * 60

            // Random velocity
            velocities[i] = (Math.random() - 0.5) * 0.02
            velocities[i + 1] = Math.random() * 0.01
            velocities[i + 2] = (Math.random() - 0.5) * 0.02
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))

        const material = new THREE.PointsMaterial({
            color: this.colors.sand,
            size: 0.1,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        })

        const particles = new THREE.Points(geometry, material)
        this.particles.push(particles)
        this.materials.push(material)
        this.group.add(particles)
    }

    /**
     * Update act content - implements BaseAct abstract method
     */
    protected updateContent(deltaTime: number): void {
        this.windTime += deltaTime * 0.001

        // Update terrain based on audio (heartbeat simulation)
        if (this.terrain && this.terrainGeometry && this.originalVertices) {
            const positions = this.terrainGeometry.attributes.position.array as Float32Array

            // Heartbeat pulse from bass frequencies
            this.heartbeatPulse = this.bassLevel * 5

            for (let i = 0; i < positions.length; i += 3) {
                const x = positions[i]
                const y = positions[i + 1]

                // Base elevation from original
                let elevation = this.originalVertices[i + 2]

                // Add wind motion
                elevation += Math.sin(x * 0.05 + this.windTime * 2) * 0.5
                elevation += Math.cos(y * 0.05 + this.windTime * 1.5) * 0.3

                // Add heartbeat pulse
                const distance = Math.sqrt(x * x + y * y)
                const heartbeatWave = Math.sin(distance * 0.2 - this.time * 0.005) * this.heartbeatPulse
                elevation += heartbeatWave

                positions[i + 2] = elevation
            }

            this.terrainGeometry.attributes.position.needsUpdate = true
            this.terrainGeometry.computeVertexNormals()
        }

        // Update wind particles
        this.particles.forEach(particleSystem => {
            const positions = particleSystem.geometry.attributes.position.array as Float32Array
            const velocities = particleSystem.geometry.attributes.velocity?.array as Float32Array

            if (velocities) {
                for (let i = 0; i < positions.length; i += 3) {
                    // Update position with velocity
                    positions[i] += velocities[i] * deltaTime * 60
                    positions[i + 1] += velocities[i + 1] * deltaTime * 60
                    positions[i + 2] += velocities[i + 2] * deltaTime * 60

                    // Add audio influence to movement
                    velocities[i] += (this.midLevel - 0.5) * 0.001
                    velocities[i + 2] += (this.trebleLevel - 0.5) * 0.001

                    // Reset particles that go too far
                    if (Math.abs(positions[i]) > 30 || Math.abs(positions[i + 2]) > 30) {
                        positions[i] = (Math.random() - 0.5) * 60
                        positions[i + 1] = Math.random() * 10
                        positions[i + 2] = (Math.random() - 0.5) * 60
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
        // Adjust terrain color based on audio intensity
        if (this.terrainMaterial) {
            const intensity = 0.3 + this.audioLevel * 0.7
            this.terrainMaterial.color.lerpColors(
                this.colors.darkSand,
                this.colors.sand,
                intensity
            )
        }

        // Beat-reactive effects
        if (this.beatDetected && this.terrain) {
            // Scale pulse on beat
            this.terrain.scale.setScalar(1 + this.bassLevel * 0.1)
        } else if (this.terrain) {
            // Return to normal scale
            this.terrain.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
        }

        // Update particle colors
        this.particles.forEach(particleSystem => {
            const material = particleSystem.material as THREE.PointsMaterial
            material.opacity = 0.4 + this.audioLevel * 0.4

            // Color shift with audio
            const hue = 0.08 + this.midLevel * 0.1 // Sandy hues
            material.color.setHSL(hue, 0.6, 0.5 + this.audioLevel * 0.3)
        })
    }

    /**
     * Enter animation - implements BaseAct abstract method
     */
    protected async animateEnter(): Promise<void> {
        // Fade in effect
        await this.createFadeTransition(1000)

        if (this.terrain) {
            // Rise from ground effect
            this.terrain.position.y = -10
            const startY = this.terrain.position.y
            const targetY = -5

            return new Promise((resolve) => {
                const animate = () => {
                    if (this.terrain) {
                        this.terrain.position.y = THREE.MathUtils.lerp(this.terrain.position.y, targetY, 0.05)

                        if (Math.abs(this.terrain.position.y - targetY) < 0.1) {
                            this.terrain.position.y = targetY
                            resolve()
                        } else {
                            requestAnimationFrame(animate)
                        }
                    }
                }
                animate()
            })
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
        // Position Act 2 at the second position
        this.actPosition.set(-25, 0, 0)
        this.group.position.copy(this.actPosition)
        console.log(`📐 Act ${this.actNumber} positioned at:`, this.actPosition)
    }
}
