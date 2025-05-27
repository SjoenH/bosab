/**
 * Act 4 - Stars: Expanding starfield, meditative drift, cosmic wonder
 * 
 * Creates an infinite starfield that expands and contracts with audio,
 * representing the cosmic/universal conclusion of the performance.
 */

import * as THREE from 'three'
import { BaseAct } from './BaseAct'
import type { AudioData, AudioAnalyzerInterface } from '../types'

export class Act4Stars extends BaseAct {
    private starField: THREE.Points | null = null
    private starGeometry: THREE.BufferGeometry | null = null
    private starMaterial: THREE.PointsMaterial | null = null
    private originalPositions: Float32Array | null = null

    private nebula: THREE.Mesh[] = []
    private cosmicRings: THREE.Line[] = []

    private colors = {
        starWhite: new THREE.Color(0xffffff),
        starBlue: new THREE.Color(0x87ceeb),
        starYellow: new THREE.Color(0xffd700),
        nebulaPurple: new THREE.Color(0x9370db),
        cosmicBlue: new THREE.Color(0x4169e1)
    }

    private expansionRate: number = 0
    private cosmicTime: number = 0
    private meditativeRhythm: number = 0

    constructor(scene: THREE.Scene, camera: THREE.Camera, audioAnalyzer: AudioAnalyzerInterface, actNumber: number) {
        super(scene, camera, audioAnalyzer, actNumber)
        console.log(`⭐ Act4Stars created`)
    }

    /**
     * Create act-specific content - implements BaseAct abstract method
     */
    protected async createContent(): Promise<void> {
        this.createStarField()
        this.createNebula()
        this.createCosmicRings()
        console.log('⭐ Act 4 - Stars content created')
    }

    private createStarField(): void {
        // Create thousands of stars
        const starCount = 5000
        this.starGeometry = new THREE.BufferGeometry()

        const positions = new Float32Array(starCount * 3)
        const colors = new Float32Array(starCount * 3)
        const sizes = new Float32Array(starCount)

        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3

            // Random positions in a large sphere
            const radius = 100 + Math.random() * 200
            const theta = Math.random() * Math.PI * 2
            const phi = Math.random() * Math.PI

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
            positions[i3 + 2] = radius * Math.cos(phi)

            // Random star colors (white, blue, yellow)
            const starType = Math.random()
            if (starType < 0.6) {
                // White stars
                colors[i3] = colors[i3 + 1] = colors[i3 + 2] = 1
            } else if (starType < 0.8) {
                // Blue stars
                colors[i3] = 0.5
                colors[i3 + 1] = 0.8
                colors[i3 + 2] = 1
            } else {
                // Yellow stars
                colors[i3] = 1
                colors[i3 + 1] = 1
                colors[i3 + 2] = 0.5
            }

            // Random sizes
            sizes[i] = Math.random() * 3 + 1
        }

        this.starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        this.starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        this.starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

        // Store original positions for expansion effect
        this.originalPositions = new Float32Array(positions)

        this.starMaterial = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        })

        this.starField = new THREE.Points(this.starGeometry, this.starMaterial)
        this.particles.push(this.starField)
        this.materials.push(this.starMaterial)
        this.group.add(this.starField)
    }

    private createNebula(): void {
        // Create nebula clouds using transparent spheres
        const nebulaCount = 8

        for (let i = 0; i < nebulaCount; i++) {
            const geometry = new THREE.SphereGeometry(10 + Math.random() * 20, 16, 16)
            const material = new THREE.MeshBasicMaterial({
                color: this.colors.nebulaPurple,
                transparent: true,
                opacity: 0.1,
                blending: THREE.AdditiveBlending
            })

            const nebula = new THREE.Mesh(geometry, material)

            // Position in space
            nebula.position.set(
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100
            )

            nebula.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            )

            this.nebula.push(nebula)
            this.meshes.push(nebula)
            this.materials.push(material)
            this.group.add(nebula)
        }
    }

    private createCosmicRings(): void {
        // Create orbital rings around the center
        const ringCount = 5

        for (let i = 0; i < ringCount; i++) {
            const radius = 20 + i * 15
            const segments = 64
            const points: THREE.Vector3[] = []

            for (let j = 0; j < segments + 1; j++) {
                const angle = (j / segments) * Math.PI * 2
                const x = Math.cos(angle) * radius
                const z = Math.sin(angle) * radius
                const y = Math.sin(angle * 3) * 2 // Slight wave

                points.push(new THREE.Vector3(x, y, z))
            }

            const geometry = new THREE.BufferGeometry().setFromPoints(points)
            const material = new THREE.LineBasicMaterial({
                color: this.colors.cosmicBlue,
                transparent: true,
                opacity: 0.3
            })

            const ring = new THREE.Line(geometry, material)

            // Random orientation
            ring.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            )

            this.cosmicRings.push(ring)
            this.lines.push(ring)
            this.materials.push(material)
            this.group.add(ring)
        }
    }

    /**
     * Update act content - implements BaseAct abstract method
     */
    protected updateContent(deltaTime: number): void {
        this.cosmicTime += deltaTime * 0.001

        // Calculate expansion rate based on audio
        this.expansionRate = 1 + this.audioLevel * 0.5
        this.meditativeRhythm = this.bassLevel * 0.5 + this.midLevel * 0.3

        // Update starfield expansion
        if (this.starField && this.starGeometry && this.originalPositions) {
            const positions = this.starGeometry.attributes.position.array as Float32Array

            for (let i = 0; i < positions.length; i += 3) {
                // Apply expansion from center
                positions[i] = this.originalPositions[i] * this.expansionRate
                positions[i + 1] = this.originalPositions[i + 1] * this.expansionRate
                positions[i + 2] = this.originalPositions[i + 2] * this.expansionRate

                // Add gentle drift
                positions[i] += Math.sin(this.cosmicTime + i * 0.01) * 0.1
                positions[i + 1] += Math.cos(this.cosmicTime + i * 0.01) * 0.1
                positions[i + 2] += Math.sin(this.cosmicTime * 0.5 + i * 0.01) * 0.1
            }

            this.starGeometry.attributes.position.needsUpdate = true

            // Update star material opacity
            this.starMaterial!.opacity = 0.6 + this.audioLevel * 0.4
        }

        // Animate nebula
        this.nebula.forEach((cloud, index) => {
            // Slow rotation
            cloud.rotation.x += 0.0001 * deltaTime * (1 + this.meditativeRhythm)
            cloud.rotation.y += 0.0002 * deltaTime * (1 + this.meditativeRhythm)
            cloud.rotation.z += 0.00015 * deltaTime * (1 + this.meditativeRhythm)

            // Gentle scale breathing
            const breathe = 1 + Math.sin(this.cosmicTime * 0.5 + index) * 0.1 * this.audioLevel
            cloud.scale.setScalar(breathe)

            // Adjust opacity
            const material = cloud.material as THREE.MeshBasicMaterial
            material.opacity = 0.05 + this.audioLevel * 0.15
        })

        // Animate cosmic rings
        this.cosmicRings.forEach((ring, index) => {
            // Rotation
            ring.rotation.y += 0.0005 * deltaTime * (index + 1) * (1 + this.meditativeRhythm)
            ring.rotation.x += 0.0003 * deltaTime * (1 + this.meditativeRhythm)

            // Opacity pulse
            const material = ring.material as THREE.LineBasicMaterial
            material.opacity = 0.2 + Math.sin(this.cosmicTime + index) * 0.1 + this.audioLevel * 0.2
        })
    }

    /**
     * Update visual effects - implements BaseAct abstract method
     */
    protected updateVisualEffects(deltaTime: number): void {
        // Beat-reactive effects
        if (this.beatDetected) {
            // Cosmic pulse on beat
            if (this.starField) {
                this.starField.scale.setScalar(1.05)
            }

            this.cosmicRings.forEach(ring => {
                ring.scale.setScalar(1.1)
            })
        } else {
            // Return to normal scale
            if (this.starField) {
                this.starField.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
            }

            this.cosmicRings.forEach(ring => {
                ring.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
            })
        }

        // Color shifts based on audio frequencies
        this.nebula.forEach((cloud, index) => {
            const material = cloud.material as THREE.MeshBasicMaterial

            // Shift between purple and blue based on frequency content
            const hue = 0.75 + (this.trebleLevel - this.bassLevel) * 0.1 // Purple to blue range
            const saturation = 0.8 + this.midLevel * 0.2
            const lightness = 0.3 + this.audioLevel * 0.4

            material.color.setHSL(hue, saturation, lightness)
        })

        // Cosmic ring color evolution
        this.cosmicRings.forEach((ring, index) => {
            const material = ring.material as THREE.LineBasicMaterial
            const hue = 0.6 + Math.sin(this.cosmicTime * 0.2 + index) * 0.1
            material.color.setHSL(hue, 0.7, 0.5 + this.audioLevel * 0.3)
        })
    }

    /**
     * Enter animation - implements BaseAct abstract method
     */
    protected async animateEnter(): Promise<void> {
        // Fade in effect
        await this.createFadeTransition(2000) // Slower fade for cosmic feeling

        // Gentle expansion from point
        if (this.starField) {
            this.starField.scale.setScalar(0.1)

            return new Promise((resolve) => {
                const animate = () => {
                    if (this.starField) {
                        this.starField.scale.lerp(new THREE.Vector3(1, 1, 1), 0.02)

                        if (this.starField.scale.x > 0.98) {
                            this.starField.scale.setScalar(1)
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
        await this.createFadeTransition(2000)
    }

    /**
     * Apply layout position - override BaseAct method
     */
    protected applyLayoutPosition(): void {
        // Position Act 4 at the rightmost position
        this.actPosition.set(75, 0, 0)
        this.group.position.copy(this.actPosition)
        console.log(`📐 Act ${this.actNumber} positioned at:`, this.actPosition)
    }
}
