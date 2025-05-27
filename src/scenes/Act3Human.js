/**
 * Act 3 - Human: Organic forms, poetry overlays, and emotional visuals
 * 
 * Creates flowing particle streams, pulsing heart center, and organic
 * connection patterns. Represents the human/emotional transition.
 */

import * as THREE from 'three'
import { BaseAct } from './BaseAct.js'

export class Act3Human extends BaseAct {
    constructor(scene, camera, audioAnalyzer, actNumber) {
        super(scene, camera, audioAnalyzer, actNumber)

        // Act 3 specific properties
        this.flowingParticles = []
        this.heartCenter = null
        this.connectionLines = []
        this.organicShapes = []

        this.colors = {
            flow: new THREE.Color(0xffdbac),
            heart: new THREE.Color(0xff6b6b),
            connection: new THREE.Color(0xff6b9d),
            warm: new THREE.Color(0xffd93d),
            flesh: new THREE.Color(0xfdbcb4)
        }

        console.log(`🫀 Act3Human created`)
    }

    /**
     * Create act-specific content - implements BaseAct virtual method
     */
    createContent() {
        this.createFlowingParticles()
        this.createHeartCenter()
        this.createConnectionLines()
        this.createOrganicShapes()
        console.log('🫀 Act 3 - Human content created')
    }

    createFlowingParticles() {
        // Create particle streams that flow organically
        const streamCount = 6

        for (let s = 0; s < streamCount; s++) {
            const particleCount = 50
            const geometry = new THREE.BufferGeometry()
            const positions = new Float32Array(particleCount * 3)

            // Create spiral pattern for each stream
            const radius = 5 + s * 1.5
            const angle = s * Math.PI / 3

            for (let i = 0; i < particleCount; i++) {
                const t = i / particleCount
                const spiralAngle = angle + t * Math.PI * 4

                // Constrain to act bounds
                positions[i * 3] = Math.cos(spiralAngle) * radius * (1 - t * 0.3) * 0.7 // Scale down for act space
                positions[i * 3 + 1] = Math.sin(spiralAngle) * radius * (1 - t * 0.3) * 0.7
                positions[i * 3 + 2] = (t - 0.5) * 8 // Constrain Z within act bounds
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

            const material = new THREE.PointsMaterial({
                color: this.colors.flow,
                size: 0.15,
                transparent: true,
                opacity: 0.7,
                blending: THREE.AdditiveBlending
            })

            const stream = new THREE.Points(geometry, material)
            stream.userData = {
                streamIndex: s,
                rotationSpeed: (Math.random() - 0.5) * 0.02,
                originalPositions: [...positions]
            }

            this.group.add(stream)
            this.flowingParticles.push(stream)
            this.registerMaterial(material)
        }
    }

    createHeartCenter() {
        // Simple pulsing sphere at the center
        const geometry = new THREE.SphereGeometry(1, 16, 16)
        const material = new THREE.MeshBasicMaterial({
            color: this.colors.heart,
            transparent: true,
            opacity: 0.8
        })

        this.heartCenter = new THREE.Mesh(geometry, material)
        this.heartCenter.position.set(0, 0, 0)
        this.heartCenter.userData = {
            baseScale: 1,
            pulsePhase: 0
        }

        this.group.add(this.heartCenter)
        this.registerMaterial(material)
    }

    createConnectionLines() {
        // Simple lines connecting points around the center
        const lineCount = 12

        for (let i = 0; i < lineCount; i++) {
            const angle = (i / lineCount) * Math.PI * 2
            const radius = 6 // Smaller radius for act bounds

            const start = new THREE.Vector3(0, 0, 0)
            const end = new THREE.Vector3(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                (Math.random() - 0.5) * 4 // Constrain Z
            )

            const geometry = new THREE.BufferGeometry().setFromPoints([start, end])
            const material = new THREE.LineBasicMaterial({
                color: this.colors.connection,
                transparent: true,
                opacity: 0.4
            })

            const line = new THREE.Line(geometry, material)
            line.userData = {
                pulsePhase: i * Math.PI / 6,
                originalOpacity: 0.4,
                originalEnd: end.clone()
            }

            this.group.add(line)
            this.connectionLines.push(line)
            this.registerMaterial(material)
        }
    }

    createOrganicShapes() {
        // Create flowing organic blob-like shapes
        const shapeCount = 8

        for (let s = 0; s < shapeCount; s++) {
            const geometry = new THREE.SphereGeometry(0.5 + Math.random() * 0.3, 8, 8)
            const material = new THREE.MeshBasicMaterial({
                color: this.colors.flesh,
                transparent: true,
                opacity: 0.3 + Math.random() * 0.3,
                wireframe: Math.random() > 0.5
            })

            const shape = new THREE.Mesh(geometry, material)

            // Position randomly within act bounds
            shape.position.set(
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 8
            )

            shape.userData = {
                originalPosition: shape.position.clone(),
                floatPhase: Math.random() * Math.PI * 2,
                floatSpeed: 0.5 + Math.random() * 0.5,
                breathPhase: Math.random() * Math.PI * 2
            }

            this.group.add(shape)
            this.organicShapes.push(shape)
            this.registerMaterial(material)
        }
    }

    // Act 3 specific overrides and implementations

    /**
     * Act-specific content updates - override BaseAct method
     */
    updateContent(time) {
        this.updateFlowingParticles(time)
        this.updateHeartCenter(time)
        this.updateConnectionLines(time)
        this.updateOrganicShapes(time)
    }

    updateFlowingParticles(time) {
        this.flowingParticles.forEach((stream, index) => {
            const userData = stream.userData

            // Rotate the streams
            stream.rotation.y += userData.rotationSpeed * (1 + this.audioLevel * 2)
            stream.rotation.z = Math.sin(time * 0.001 + index) * 0.1

            // Audio-reactive properties
            stream.material.opacity = 0.5 + this.midLevel * 0.5
            stream.material.size = 0.15 * (1 + this.audioLevel * 0.5)

            // Color shift based on audio
            if (this.beatDetected) {
                stream.material.color.lerp(this.colors.warm, 0.3)
            } else {
                stream.material.color.lerp(this.colors.flow, 0.1)
            }
        })
    }

    updateHeartCenter(time) {
        if (!this.heartCenter) return

        // Heartbeat pulsing
        const heartbeat = this.beatDetected ? 1.3 : 1.0 + Math.sin(time * 0.002) * 0.1
        this.heartCenter.scale.setScalar(heartbeat * (1 + this.bassLevel * 0.5))

        // Gentle rotation
        this.heartCenter.rotation.y = time * 0.0002

        // Beat color reaction
        if (this.beatDetected) {
            this.heartCenter.material.color.setHex(0xffffff)
        } else {
            this.heartCenter.material.color.lerp(this.colors.heart, 0.1)
        }
    }

    updateConnectionLines(time) {
        this.connectionLines.forEach((line, index) => {
            const userData = line.userData

            // Pulsing opacity
            const pulse = Math.sin(time * 0.002 + userData.pulsePhase) * 0.3 + 0.5
            line.material.opacity = pulse * userData.originalOpacity * (1 + this.audioLevel)

            // Audio-reactive extension
            const extension = 1 + this.trebleLevel * 0.3
            const positions = line.geometry.attributes.position.array

            // Update end point
            positions[3] = userData.originalEnd.x * extension
            positions[4] = userData.originalEnd.y * extension
            positions[5] = userData.originalEnd.z * extension

            line.geometry.attributes.position.needsUpdate = true
        })
    }

    updateOrganicShapes(time) {
        this.organicShapes.forEach(shape => {
            const userData = shape.userData

            // Floating motion
            shape.position.y = userData.originalPosition.y +
                Math.sin(time * 0.001 * userData.floatSpeed + userData.floatPhase) * 1.5

            // Breathing scale
            const breath = 1 + Math.sin(time * 0.0015 + userData.breathPhase) * 0.2
            shape.scale.setScalar(breath * (1 + this.audioLevel * 0.3))

            // Audio-reactive opacity
            shape.material.opacity = shape.material.opacity * (0.8 + this.midLevel * 0.4)
        })
    }

    /**
     * Act-specific entry preparation
     */
    onPrepareEntry() {
        // Start flowing particles in contracted state
        this.flowingParticles.forEach((stream, index) => {
            stream.scale.setScalar(0.1) // Start very small
            stream.material.opacity = 0
        })

        // Start heart center small and hidden
        if (this.heartCenter) {
            this.heartCenter.scale.setScalar(0.1)
            this.heartCenter.material.opacity = 0
        }

        // Start connection lines retracted
        this.connectionLines.forEach(line => {
            line.scale.setScalar(0.1)
            line.material.opacity = 0
        })
    }

    /**
     * Act-specific transition updates
     */
    onUpdateTransition(progress, direction) {
        const easeInOutQuad = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
        const easedProgress = easeInOutQuad(progress)

        if (direction === 'enter') {
            // Animate flowing particles expanding organically
            this.flowingParticles.forEach((stream, index) => {
                const delay = index * 0.08
                const adjustedProgress = Math.max(0, Math.min(1, (easedProgress - delay) / 0.7))

                // Organic growth from center
                stream.scale.setScalar(0.1 + adjustedProgress * 0.9)
                stream.material.opacity = adjustedProgress * 0.7

                // Spiral out from center
                const spiralRadius = adjustedProgress * 1.5
                stream.position.x = Math.cos(index * Math.PI / 3) * spiralRadius * (1 - adjustedProgress)
                stream.position.z = Math.sin(index * Math.PI / 3) * spiralRadius * (1 - adjustedProgress)
            })

            // Heart center pulses into existence
            if (this.heartCenter) {
                const heartProgress = Math.max(0, (easedProgress - 0.3) / 0.7)
                this.heartCenter.scale.setScalar(0.1 + heartProgress * 0.9)
                this.heartCenter.material.opacity = heartProgress * 0.8
            }

            // Connection lines grow outward
            this.connectionLines.forEach((line, index) => {
                const delay = 0.4 + index * 0.05
                const adjustedProgress = Math.max(0, Math.min(1, (easedProgress - delay) / 0.5))

                line.scale.setScalar(adjustedProgress)
                line.material.opacity = adjustedProgress * line.userData.originalOpacity
            })

        } else if (direction === 'exit') {
            // Animate organic dissolution
            this.flowingParticles.forEach((stream, index) => {
                // Spiral inward and fade
                const spiralIn = easedProgress
                stream.scale.setScalar(1.0 - spiralIn * 0.9)
                stream.material.opacity = (1 - spiralIn) * 0.7

                // Move toward center
                stream.position.x *= (1 - spiralIn * 0.5)
                stream.position.z *= (1 - spiralIn * 0.5)
            })

            // Heart center fades with final pulse
            if (this.heartCenter) {
                const heartScale = 1.0 + easedProgress * 0.5 - easedProgress * 1.5 // Pulse then shrink
                this.heartCenter.scale.setScalar(Math.max(0, heartScale))
                this.heartCenter.material.opacity = (1 - easedProgress) * 0.8
            }

            // Connection lines retract
            this.connectionLines.forEach(line => {
                line.scale.setScalar(1.0 - easedProgress)
                line.material.opacity = (1 - easedProgress) * line.userData.originalOpacity
            })
        }
    }
}
