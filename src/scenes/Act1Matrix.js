/**
 * Act 1 - Matrix: Data streams and clinical waveforms
 * 
 * Creates flowing numbers, clinical waveforms, and data visualization
 * elements. Represents the digital/data aesthetic of the first act.
 */

import * as THREE from 'three'
import { BaseAct } from './BaseAct.js'

export class Act1Matrix extends BaseAct {
    constructor(scene, camera, audioAnalyzer, actNumber) {
        super(scene, camera, audioAnalyzer, actNumber)

        // Act 1 specific properties
        this.dataStreams = []
        this.waveforms = []
        this.dataNumbers = []

        this.colors = {
            primary: new THREE.Color(0x00ff41),
            secondary: new THREE.Color(0x008f11),
            accent: new THREE.Color(0xffffff),
            background: new THREE.Color(0x001100)
        }

        console.log(`🔢 Act1Matrix created`)
    }

    /**
     * Create act-specific content - implements BaseAct virtual method
     */
    createContent() {
        this.createDataStreams()
        this.createWaveforms()
        this.createDataNumbers()
        console.log('🔢 Act 1 - Matrix content created')
    }

    createDataStreams() {
        // Create columns of falling particles representing data streams
        const columns = 25
        const particlesPerColumn = 40

        for (let col = 0; col < columns; col++) {
            const streamParticles = []

            for (let i = 0; i < particlesPerColumn; i++) {
                const geometry = new THREE.SphereGeometry(0.05, 8, 8)
                const material = new THREE.MeshBasicMaterial({
                    color: this.colors.primary,
                    transparent: true,
                    opacity: Math.random() * 0.8 + 0.2
                })

                const particle = new THREE.Mesh(geometry, material)

                // Position in columns within act bounds
                particle.position.x = (col - columns / 2) * 1.5
                particle.position.y = (Math.random() - 0.5) * 20
                particle.position.z = (Math.random() - 0.5) * 10

                // Store initial values for animation
                particle.userData = {
                    originalY: particle.position.y,
                    speed: Math.random() * 0.1 + 0.05,
                    opacity: particle.material.opacity,
                    phase: Math.random() * Math.PI * 2,
                    column: col
                }

                this.group.add(particle)
                streamParticles.push(particle)
                this.registerMaterial(material)
            }

            this.dataStreams.push(streamParticles)
        }
    }

    createWaveforms() {
        // Create simple audio-reactive waveforms
        const waveformCount = 5

        for (let w = 0; w < waveformCount; w++) {
            const points = []
            const segments = 50

            for (let i = 0; i <= segments; i++) {
                const x = (i / segments) * 30 - 15
                const y = w * 4 - 8
                const z = Math.sin(i * 0.2 + w) * 0.5
                points.push(new THREE.Vector3(x, y, z))
            }

            const geometry = new THREE.BufferGeometry().setFromPoints(points)
            const material = new THREE.LineBasicMaterial({
                color: this.colors.secondary,
                transparent: true,
                opacity: 0.6
            })

            const waveform = new THREE.Line(geometry, material)
            waveform.userData = {
                baseY: w * 4 - 8,
                phase: w * 0.5,
                amplitude: 1,
                originalPoints: points.map(p => p.clone())
            }

            this.group.add(waveform)
            this.waveforms.push(waveform)
            this.registerMaterial(material)
        }
    }

    createDataNumbers() {
        // Create floating digital numbers that respond to audio
        // This would typically use TextGeometry but we'll use simple planes for now
        const numberCount = 50

        for (let i = 0; i < numberCount; i++) {
            const geometry = new THREE.PlaneGeometry(0.3, 0.3)
            const material = new THREE.MeshBasicMaterial({
                color: this.colors.accent,
                transparent: true,
                opacity: Math.random() * 0.7 + 0.3
            })

            const numberMesh = new THREE.Mesh(geometry, material)

            // Position randomly within act space
            numberMesh.position.set(
                (Math.random() - 0.5) * 35,
                (Math.random() - 0.5) * 25,
                (Math.random() - 0.5) * 15
            )

            numberMesh.userData = {
                originalPosition: numberMesh.position.clone(),
                driftSpeed: Math.random() * 0.02 + 0.01,
                phase: Math.random() * Math.PI * 2,
                number: Math.floor(Math.random() * 10)
            }

            this.group.add(numberMesh)
            this.dataNumbers.push(numberMesh)
            this.registerMaterial(material)
        }
    }

    // Act 1 specific overrides and implementations

    /**
     * Act-specific content updates - override BaseAct method
     */
    updateContent(time) {
        this.updateDataStreams(time)
        this.updateWaveforms(time)
        this.updateDataNumbers(time)
    }

    updateDataStreams(time) {
        // Animate falling data stream particles
        this.dataStreams.forEach((stream, streamIndex) => {
            stream.forEach(particle => {
                const userData = particle.userData

                // Falling animation
                particle.position.y -= userData.speed * (1 + this.audioLevel * 2)

                // Reset when off screen
                if (particle.position.y < -15) {
                    particle.position.y = 15
                }

                // Audio reactivity
                const bassBoost = this.bassLevel * 0.5
                particle.material.opacity = userData.opacity * (0.7 + bassBoost)

                // Slight phase-based movement
                particle.position.x += Math.sin(time * 0.001 + userData.phase) * 0.01
            })
        })
    }

    updateWaveforms(time) {
        // Update audio-reactive waveforms
        this.waveforms.forEach((waveform, index) => {
            const userData = waveform.userData
            const positions = waveform.geometry.attributes.position

            // Audio-driven amplitude
            const audioAmplitude = (this.midLevel + this.trebleLevel) * 0.5
            userData.amplitude = 1 + audioAmplitude * 3

            // Update waveform points
            for (let i = 0; i < userData.originalPoints.length; i++) {
                const originalPoint = userData.originalPoints[i]
                const audioOffset = Math.sin(time * 0.002 + userData.phase + i * 0.1) * userData.amplitude

                positions.setY(i, userData.baseY + audioOffset)
                positions.setZ(i, originalPoint.z + Math.sin(time * 0.001 + i * 0.05) * 0.2)
            }

            positions.needsUpdate = true

            // Audio-reactive opacity
            waveform.material.opacity = 0.6 + this.audioLevel * 0.4
        })
    }

    updateDataNumbers(time) {
        // Animate floating digital numbers
        this.dataNumbers.forEach(number => {
            const userData = number.userData

            // Gentle floating motion
            number.position.y = userData.originalPosition.y +
                Math.sin(time * 0.001 + userData.phase) * 2

            // Audio-reactive brightness
            const brightness = 0.5 + this.trebleLevel * 0.5
            number.material.opacity = userData.originalPosition.y * brightness * 0.7

            // Slight rotation on beat
            if (this.beatDetected) {
                number.rotation.z += Math.random() * 0.1 - 0.05
            }
        })
    }

    /**
     * Act-specific entry animation
     */
    onEnter() {
        // Stagger the appearance of data streams
        this.dataStreams.forEach((stream, streamIndex) => {
            setTimeout(() => {
                stream.forEach(particle => {
                    particle.visible = true
                })
            }, streamIndex * 50)
        })
    }

    /**
     * Act-specific exit animation
     */
    onExit() {
        // Fade out all elements
        this.dataStreams.flat().forEach(particle => {
            particle.material.opacity *= 0.5
        })
    }
}
