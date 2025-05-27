import * as THREE from 'three'
import { BaseAct } from './BaseAct.js'

export class Act1Matrix extends BaseAct {
    constructor(scene, camera, audioAnalyzer, actNumber) {
        super(scene, camera, audioAnalyzer, actNumber)

        this.dataStreams = []
        this.waveforms = []

        this.colors = {
            primary: new THREE.Color(0x00ff41),
            secondary: new THREE.Color(0x008f11),
            accent: new THREE.Color(0xffffff)
        }
    }

    createContent() {
        this.createDataStreams()
        this.createWaveforms()
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
                    phase: Math.random() * Math.PI * 2
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

    updateContent(time) {
        this.updateDataStreams(time)
        this.updateWaveforms(time)
    }

    updateDataStreams(time) {
        const audioLevel = this.audioLevel
        const beat = this.beatDetected

        this.dataStreams.forEach((stream, colIndex) => {
            stream.forEach((particle, particleIndex) => {
                const userData = particle.userData

                // Falling animation
                particle.position.y -= userData.speed * (1 + audioLevel * 2)

                // Reset to top when falls below
                if (particle.position.y < -15) {
                    particle.position.y = 15
                }

                // Audio-reactive opacity
                const baseOpacity = userData.opacity * (0.3 + Math.sin(time * 0.001 + userData.phase) * 0.2)
                const audioBoost = audioLevel * 0.5
                particle.material.opacity = Math.min(1, baseOpacity + audioBoost)

                // Beat pulse effect
                if (beat) {
                    particle.scale.setScalar(1 + audioLevel * 0.5)
                } else {
                    particle.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
                }
            })
        })
    }

    updateWaveforms(time) {
        const audioLevel = this.audioLevel
        const bassLevel = this.bassLevel

        this.waveforms.forEach((waveform, index) => {
            const userData = waveform.userData
            const positions = waveform.geometry.attributes.position.array

            // Update waveform shape based on audio
            for (let i = 0; i < positions.length; i += 3) {
                const x = positions[i]
                const baseWave = Math.sin(x * 0.2 + time * 0.002 + userData.phase) * userData.amplitude
                const audioWave = Math.sin(x * 0.1 + time * 0.003) * bassLevel * 2

                positions[i + 1] = userData.baseY + baseWave + audioWave
                positions[i + 2] = Math.sin(x * 0.15 + time * 0.001 + userData.phase) * (0.5 + audioLevel)
            }

            waveform.geometry.attributes.position.needsUpdate = true

            // Audio-reactive material opacity
            waveform.material.opacity = 0.4 + audioLevel * 0.4
        })
    }

    // Override BaseAct lifecycle methods
    onPrepareEntry() {
        // Start with particles hidden/scattered
        this.group.visible = false
    }

    onStartEntry() {
        this.group.visible = true

        // Animate data streams falling into place
        this.dataStreams.forEach((stream, colIndex) => {
            stream.forEach((particle, particleIndex) => {
                // Add entrance animation here if desired
                particle.position.y = 15 + Math.random() * 5
            })
        })
    }

    onEnter() {
        // Fully active state
        console.log('🔢 Act 1 - Matrix fully active')
    }

    onStartExit() {
        // Begin exit animations
        console.log('🔢 Act 1 - Matrix starting exit')
    }

    onExit() {
        // Cleanup and hide
        this.group.visible = false
        console.log('🔢 Act 1 - Matrix exited')
    }

    updateBackgroundContent(time) {
        // Light background processing when not active
        // Could update some elements slowly to maintain state
    }
}
