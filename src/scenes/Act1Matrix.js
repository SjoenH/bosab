import * as THREE from 'three'

export class Act1Matrix {
    constructor(scene, camera, audioAnalyzer) {
        this.scene = scene
        this.camera = camera
        this.audioAnalyzer = audioAnalyzer

        this.group = new THREE.Group()
        this.dataStreams = []
        this.waveforms = []

        this.isActive = false
        this.time = 0

        this.colors = {
            primary: new THREE.Color(0x00ff41),
            secondary: new THREE.Color(0x008f11),
            accent: new THREE.Color(0xffffff)
        }
    }

    init() {
        this.scene.add(this.group)
        this.createDataStreams()
        this.createWaveforms()

        console.log('🔢 Act 1 - Matrix initialized')
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

                // Position in columns
                particle.position.x = (col - columns / 2) * 1.5
                particle.position.y = Math.random() * 40 - 20
                particle.position.z = (Math.random() - 0.5) * 10

                particle.userData = {
                    column: col,
                    fallSpeed: Math.random() * 0.05 + 0.02,
                    opacity: particle.material.opacity,
                    phase: Math.random() * Math.PI * 2
                }

                this.group.add(particle)
                streamParticles.push(particle)
            }

            this.dataStreams.push(streamParticles)
        }
    }

    createWaveforms() {
        // Create simple audio-reactive waveforms
        for (let i = 0; i < 3; i++) {
            const points = []
            const segments = 50

            for (let j = 0; j <= segments; j++) {
                const x = (j / segments) * 20 - 10
                const y = (i - 1) * 3
                points.push(new THREE.Vector3(x, y, 0))
            }

            const geometry = new THREE.BufferGeometry().setFromPoints(points)
            const material = new THREE.LineBasicMaterial({
                color: this.colors.primary,
                transparent: true,
                opacity: 0.6
            })

            const line = new THREE.Line(geometry, material)
            line.position.z = -3
            line.userData = {
                originalPoints: [...points],
                frequency: [0.8, 1.2, 1.6][i] // Different frequencies for each line
            }

            this.group.add(line)
            this.waveforms.push(line)
        }
    }

    update(time) {
        if (!this.isActive) return

        this.time = time * 0.001

        // Update data streams
        this.updateDataStreams()

        // Update waveforms with audio reactivity
        this.updateWaveforms()

        // Subtle camera movement
        this.updateCamera()
    }

    updateDataStreams() {
        const audioVolume = this.audioAnalyzer.getVolume()
        const audioFreq = this.audioAnalyzer.getAverageFrequency()
        const beat = this.audioAnalyzer.getBeat()

        this.dataStreams.forEach((stream, columnIndex) => {
            stream.forEach((particle, particleIndex) => {
                const userData = particle.userData

                // Falling effect
                particle.position.y -= userData.fallSpeed * (1 + audioVolume * 3)

                // Reset to top when reaching bottom
                if (particle.position.y < -25) {
                    particle.position.y = 25
                }

                // Audio-reactive opacity and color
                const baseOpacity = userData.opacity * (0.3 + Math.sin(this.time + userData.phase) * 0.2)
                particle.material.opacity = baseOpacity + audioFreq * 0.7

                // Beat reaction
                if (beat) {
                    particle.material.color.setHex(0xffffff)
                    particle.scale.setScalar(1.5)
                } else {
                    particle.material.color.lerp(this.colors.primary, 0.1)
                    particle.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
                }
            })
        })
    }

    updateWaveforms() {
        const audioLow = this.audioAnalyzer.getLowFreq()
        const audioMid = this.audioAnalyzer.getMidFreq()
        const audioHigh = this.audioAnalyzer.getHighFreq()
        const beat = this.audioAnalyzer.getBeat()

        this.waveforms.forEach((waveform, index) => {
            const userData = waveform.userData
            const positions = waveform.geometry.attributes.position.array

            // Different waveforms react to different frequencies
            const amplitude = [audioLow, audioMid, audioHigh][index] * 3 + 1

            for (let i = 0; i < positions.length; i += 3) {
                const x = positions[i]
                const originalY = userData.originalPoints[i / 3].y

                positions[i + 1] = originalY + Math.sin(this.time * userData.frequency * 5 + x * 0.5) * amplitude
            }

            waveform.geometry.attributes.position.needsUpdate = true

            // Beat reaction
            if (beat) {
                waveform.material.color.setHex(0xffffff)
                waveform.material.opacity = 1.0
            } else {
                waveform.material.color.lerp(this.colors.primary, 0.1)
                waveform.material.opacity = THREE.MathUtils.lerp(waveform.material.opacity, 0.6, 0.1)
            }
        })
    }

    updateCamera() {
        // Minimal camera movement
        const audioVolume = this.audioAnalyzer.getVolume()
        this.camera.position.x = Math.sin(this.time * 0.3) * 0.5
        this.camera.position.y = audioVolume * 0.5
        this.camera.lookAt(0, 0, 0)
    }

    enter() {
        this.isActive = true
        this.group.visible = true
        console.log('🔢 Entering Act 1 - Matrix')
    }

    exit() {
        this.isActive = false
        this.group.visible = false
        console.log('🔢 Exiting Act 1 - Matrix')
    }

    updateBackground(time) {
        if (this.isActive) return
        this.time = time * 0.001
    }

    dispose() {
        // Clean up geometries and materials
        this.dataStreams.flat().forEach(particle => {
            particle.geometry.dispose()
            particle.material.dispose()
        })

        this.waveforms.forEach(waveform => {
            waveform.geometry.dispose()
            waveform.material.dispose()
        })

        this.scene.remove(this.group)
    }
}
