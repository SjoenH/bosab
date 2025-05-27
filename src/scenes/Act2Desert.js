/**
 * Act 2 - Desert: Shifting sand landscapes and heartbeat-driven terrain
 * 
 * Creates flowing sand dunes, wind particles, and terrain that responds
 * to heartbeat rhythms. Represents the desert/organic transition.
 */

import * as THREE from 'three'
import { BaseAct } from './BaseAct.js'

export class Act2Desert extends BaseAct {
    constructor(scene, camera, audioAnalyzer, actNumber) {
        super(scene, camera, audioAnalyzer, actNumber)

        // Act 2 specific properties
        this.terrainWaves = []
        this.sandParticles = []
        this.windStreams = []

        this.colors = {
            sand: new THREE.Color(0xd4a574),
            darkSand: new THREE.Color(0x8b5a2b),
            wind: new THREE.Color(0xf5e6d3),
            sunset: new THREE.Color(0xff7f50)
        }

        console.log(`🏜️ Act2Desert created`)
    }

    /**
     * Create act-specific content - implements BaseAct virtual method
     */
    createContent() {
        this.createTerrainWaves()
        this.createSandParticles()
        this.createWindStreams()
        console.log('🏜️ Act 2 - Desert content created')
    }

    createTerrainWaves() {
        // Create simplified wave-like terrain using lines
        const waveCount = 8
        const segments = 60

        for (let w = 0; w < waveCount; w++) {
            const points = []
            const y = (w - waveCount / 2) * 2

            for (let i = 0; i <= segments; i++) {
                const x = (i / segments) * 40 - 20
                const z = -5 + Math.sin(i * 0.3 + w) * 0.5
                points.push(new THREE.Vector3(x, y, z))
            }

            const geometry = new THREE.BufferGeometry().setFromPoints(points)
            const material = new THREE.LineBasicMaterial({
                color: this.colors.sand,
                transparent: true,
                opacity: 0.6
            })

            const wave = new THREE.Line(geometry, material)
            wave.userData = {
                originalPoints: [...points],
                waveIndex: w,
                phase: w * Math.PI / 4,
                originalY: y
            }

            this.group.add(wave)
            this.terrainWaves.push(wave)
            this.registerMaterial(material)
        }
    }

    createSandParticles() {
        // Simple particle system for wind-blown sand
        const particleCount = 800
        const geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(particleCount * 3)
        const velocities = new Float32Array(particleCount * 3)

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3

            positions[i3] = (Math.random() - 0.5) * 40     // x - constrain to act space
            positions[i3 + 1] = Math.random() * 15         // y  
            positions[i3 + 2] = (Math.random() - 0.5) * 15 // z - constrain to act space

            velocities[i3] = Math.random() * 0.02          // x velocity
            velocities[i3 + 1] = Math.random() * 0.01      // y velocity
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.01 // z velocity
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))

        const material = new THREE.PointsMaterial({
            color: this.colors.wind,
            size: 0.1,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        })

        const sandSystem = new THREE.Points(geometry, material)
        this.group.add(sandSystem)
        this.sandParticles.push(sandSystem)
        this.registerMaterial(material)
    }

    createWindStreams() {
        // Create flowing wind lines
        const streamCount = 12

        for (let s = 0; s < streamCount; s++) {
            const points = []
            const length = 30

            for (let i = 0; i <= length; i++) {
                const x = (i / length) * 35 - 17.5
                const y = (s - streamCount / 2) * 2 + Math.sin(i * 0.1 + s) * 1
                const z = Math.sin(i * 0.05 + s * 0.5) * 2
                points.push(new THREE.Vector3(x, y, z))
            }

            const geometry = new THREE.BufferGeometry().setFromPoints(points)
            const material = new THREE.LineBasicMaterial({
                color: this.colors.wind,
                transparent: true,
                opacity: 0.3
            })

            const stream = new THREE.Line(geometry, material)
            stream.userData = {
                originalPoints: points.map(p => p.clone()),
                streamIndex: s,
                phase: s * 0.3,
                speed: 0.5 + Math.random() * 0.5
            }

            this.group.add(stream)
            this.windStreams.push(stream)
            this.registerMaterial(material)
        }
    }

    // Act 2 specific overrides and implementations

    /**
     * Act-specific content updates - override BaseAct method
     */
    updateContent(time) {
        this.updateTerrainWaves(time)
        this.updateSandParticles(time)
        this.updateWindStreams(time)
    }

    updateTerrainWaves(time) {
        // Heartbeat pattern for desert breathing
        const heartbeat = this.beatDetected ? 1.0 : Math.sin(time * 0.0012) * 0.3 + 0.3

        this.terrainWaves.forEach((wave, index) => {
            const userData = wave.userData
            const positions = wave.geometry.attributes.position.array

            for (let i = 0; i < positions.length; i += 3) {
                const x = positions[i]
                const originalPoint = userData.originalPoints[i / 3]

                // Wave movement with heartbeat and audio influence
                const waveOffset = Math.sin(time * 0.002 + x * 0.3 + userData.phase) * (1 + this.bassLevel * 2)
                const heartbeatOffset = Math.sin(time * 0.003 + x * 0.1) * heartbeat * 2

                positions[i + 2] = originalPoint.z + waveOffset * 0.5 + heartbeatOffset
            }

            wave.geometry.attributes.position.needsUpdate = true

            // Beat reaction
            if (this.beatDetected) {
                wave.material.color.lerp(this.colors.wind, 0.3)
            } else {
                wave.material.color.lerp(this.colors.sand, 0.1)
            }
        })
    }

    updateSandParticles(time) {
        this.sandParticles.forEach(sandSystem => {
            const positions = sandSystem.geometry.attributes.position.array
            const velocities = sandSystem.geometry.attributes.velocity.array

            for (let i = 0; i < positions.length; i += 3) {
                // Apply wind movement with audio influence
                positions[i] += velocities[i] * (1 + this.midLevel * 3)
                positions[i + 1] += velocities[i + 1] * (1 + this.audioLevel * 2)
                positions[i + 2] += velocities[i + 2] * (1 + this.midLevel * 2)

                // Wrap around within act bounds
                if (positions[i] > 20) positions[i] = -20
                if (positions[i] < -20) positions[i] = 20
                if (positions[i + 1] > 15) positions[i + 1] = 0
                if (positions[i + 2] > 7) positions[i + 2] = -7
                if (positions[i + 2] < -7) positions[i + 2] = 7
            }

            sandSystem.geometry.attributes.position.needsUpdate = true
            sandSystem.material.opacity = 0.3 + this.audioLevel * 0.4
        })
    }

    updateWindStreams(time) {
        this.windStreams.forEach(stream => {
            const userData = stream.userData
            const positions = stream.geometry.attributes.position.array

            for (let i = 0; i < positions.length; i += 3) {
                const originalPoint = userData.originalPoints[i / 3]

                // Wind flow animation
                const windOffset = Math.sin(time * 0.001 * userData.speed + userData.phase + i * 0.05) *
                    (0.5 + this.trebleLevel * 1.5)

                positions[i + 1] = originalPoint.y + windOffset
                positions[i + 2] = originalPoint.z + Math.sin(time * 0.0008 + i * 0.02) * 0.5
            }

            stream.geometry.attributes.position.needsUpdate = true

            // Audio reactivity
            stream.material.opacity = 0.3 + this.audioLevel * 0.4
        })
    }

    /**
     * Act-specific entry animation
     */
    onPrepareEntry() {
        // Position terrain waves off-screen for entry
        this.terrainWaves.forEach((wave, index) => {
            wave.position.z = -20 // Start behind camera
            wave.material.opacity = 0
        })

        // Start sand particles scattered
        this.sandParticles.forEach(sandSystem => {
            const positions = sandSystem.geometry.attributes.position.array
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] = (Math.random() - 0.5) * 100 // Wider spread initially
                positions[i + 1] = Math.random() * 30 + 20 // Higher up
                positions[i + 2] = (Math.random() - 0.5) * 100
            }
            sandSystem.geometry.attributes.position.needsUpdate = true
            sandSystem.material.opacity = 0
        })
    }

    /**
     * Act-specific transition updates
     */
    onUpdateTransition(progress, direction) {
        const easeInOutQuad = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
        const easedProgress = easeInOutQuad(progress)

        if (direction === 'enter') {
            // Animate terrain waves rolling in
            this.terrainWaves.forEach((wave, index) => {
                const delay = index * 0.05
                const adjustedProgress = Math.max(0, Math.min(1, (easedProgress - delay) / 0.8))

                // Roll in from behind camera
                wave.position.z = -20 + adjustedProgress * 20
                wave.material.opacity = adjustedProgress * 0.6
            })

            // Animate sand particles settling
            this.sandParticles.forEach(sandSystem => {
                const targetOpacity = 0.4
                sandSystem.material.opacity = easedProgress * targetOpacity

                // Gradually settle particles into normal range
                const positions = sandSystem.geometry.attributes.position.array
                for (let i = 0; i < positions.length; i += 3) {
                    if (Math.abs(positions[i]) > 30) {
                        positions[i] *= (1 - easedProgress * 0.1) // Gradually pull in
                    }
                    if (positions[i + 1] > 15) {
                        positions[i + 1] *= (1 - easedProgress * 0.05) // Settle down
                    }
                }
                sandSystem.geometry.attributes.position.needsUpdate = true
            })

        } else if (direction === 'exit') {
            // Animate terrain dissolving away
            this.terrainWaves.forEach((wave, index) => {
                // Sink into ground and fade
                wave.position.y = wave.userData.originalY - easedProgress * 10
                wave.material.opacity = (1 - easedProgress) * 0.6
            })

            // Blow sand particles away
            this.sandParticles.forEach(sandSystem => {
                sandSystem.material.opacity = (1 - easedProgress) * 0.4

                const positions = sandSystem.geometry.attributes.position.array
                const velocities = sandSystem.geometry.attributes.velocity.array

                for (let i = 0; i < positions.length; i += 3) {
                    // Accelerate particles away
                    positions[i] += velocities[i] * easedProgress * 20
                    positions[i + 1] += velocities[i + 1] * easedProgress * 10 + easedProgress * 5 // Lift up
                    positions[i + 2] += velocities[i + 2] * easedProgress * 20
                }
                sandSystem.geometry.attributes.position.needsUpdate = true
            })
        }
    }
}
