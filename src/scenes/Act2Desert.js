import * as THREE from 'three'

export class Act2Desert {
    constructor(scene, camera, audioAnalyzer) {
        this.scene = scene
        this.camera = camera
        this.audioAnalyzer = audioAnalyzer

        this.group = new THREE.Group()
        this.terrainWaves = []
        this.sandParticles = null

        this.isActive = false
        this.time = 0
        this.transitionState = 'idle'

        this.colors = {
            sand: new THREE.Color(0xd4a574),
            darkSand: new THREE.Color(0x8b5a2b),
            wind: new THREE.Color(0xf5e6d3)
        }
    }

    init() {
        this.scene.add(this.group)
        this.createTerrainWaves()
        this.createSandParticles()

        console.log('🏜️ Act 2 - Desert initialized')
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

            positions[i3] = (Math.random() - 0.5) * 60     // x
            positions[i3 + 1] = Math.random() * 15         // y  
            positions[i3 + 2] = (Math.random() - 0.5) * 60 // z

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

        this.sandParticles = new THREE.Points(geometry, material)
        this.group.add(this.sandParticles)
    }

    update(time) {
        if (!this.isActive) return

        this.time = time * 0.001

        this.updateTerrainWaves()
        this.updateSandParticles()
        this.updateCamera()
    }

    updateTerrainWaves() {
        const audioLow = this.audioAnalyzer.getLowFreq()
        const audioVolume = this.audioAnalyzer.getVolume()
        const beat = this.audioAnalyzer.getBeat()

        // Heartbeat pattern for desert breathing
        const heartbeat = beat ? 1.0 : Math.sin(this.time * 1.2) * 0.3 + 0.3

        this.terrainWaves.forEach((wave, index) => {
            const userData = wave.userData
            const positions = wave.geometry.attributes.position.array

            for (let i = 0; i < positions.length; i += 3) {
                const x = positions[i]
                const originalPoint = userData.originalPoints[i / 3]

                // Wave movement with heartbeat and audio influence
                const waveOffset = Math.sin(this.time * 2 + x * 0.3 + userData.phase) * (1 + audioLow * 2)
                const heartbeatOffset = Math.sin(this.time * 3 + x * 0.1) * heartbeat * 2

                positions[i + 2] = originalPoint.z + waveOffset * 0.5 + heartbeatOffset
            }

            wave.geometry.attributes.position.needsUpdate = true

            // Beat reaction
            if (beat) {
                wave.material.color.lerp(this.colors.wind, 0.3)
            } else {
                wave.material.color.lerp(this.colors.sand, 0.1)
            }
        })
    }

    updateSandParticles() {
        const audioVolume = this.audioAnalyzer.getVolume()
        const audioMid = this.audioAnalyzer.getMidFreq()

        if (!this.sandParticles) return

        const positions = this.sandParticles.geometry.attributes.position.array
        const velocities = this.sandParticles.geometry.attributes.velocity.array

        for (let i = 0; i < positions.length; i += 3) {
            // Apply wind movement
            positions[i] += velocities[i] * (1 + audioMid * 3)
            positions[i + 1] += velocities[i + 1] * (1 + audioVolume * 2)
            positions[i + 2] += velocities[i + 2] * (1 + audioMid * 2)

            // Wrap around
            if (positions[i] > 30) positions[i] = -30
            if (positions[i] < -30) positions[i] = 30
            if (positions[i + 1] > 20) positions[i + 1] = 0
            if (positions[i + 2] > 30) positions[i + 2] = -30
            if (positions[i + 2] < -30) positions[i + 2] = 30
        }

        this.sandParticles.geometry.attributes.position.needsUpdate = true
        this.sandParticles.material.opacity = 0.3 + audioVolume * 0.4
    }

    updateCamera() {
        // Breathing-like camera movement
        const audioVolume = this.audioAnalyzer.getVolume()
        const breathing = Math.sin(this.time * 0.5) * 0.5

        this.camera.position.y = 5 + breathing + audioVolume * 2
        this.camera.position.z = 15 + Math.sin(this.time * 0.3) * 1
        this.camera.lookAt(0, 0, 0)
    }

    enter() {
        this.isActive = true
        this.transitionState = 'active'
        this.group.visible = true
        console.log('🏜️ Entering Act 2 - Desert')
    }

    exit() {
        this.isActive = false
        this.transitionState = 'idle'
        this.group.visible = false
        console.log('🏜️ Exiting Act 2 - Desert')
    }

    // Enhanced transition methods
    prepareEntry() {
        this.transitionState = 'entering'
        this.group.visible = true

        // Position terrain waves off-screen for entry
        this.terrainWaves.forEach((wave, index) => {
            wave.position.z = -20 // Start behind camera
            wave.material.opacity = 0
        })

        // Start sand particles scattered
        if (this.sandParticles) {
            const positions = this.sandParticles.geometry.attributes.position.array
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] = (Math.random() - 0.5) * 200 // Wider spread initially
                positions[i + 1] = Math.random() * 50 + 20 // Higher up
                positions[i + 2] = (Math.random() - 0.5) * 200
            }
            this.sandParticles.geometry.attributes.position.needsUpdate = true
            this.sandParticles.material.opacity = 0
        }
    }

    startEntry() {
        this.transitionState = 'entering'
        this.isActive = true
    }

    startExit() {
        this.transitionState = 'exiting'
    }

    finishExit() {
        this.group.visible = false
    }

    updateTransition(progress, direction) {
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
            if (this.sandParticles) {
                const targetOpacity = 0.4
                this.sandParticles.material.opacity = easedProgress * targetOpacity

                // Gradually settle particles into normal range
                const positions = this.sandParticles.geometry.attributes.position.array
                for (let i = 0; i < positions.length; i += 3) {
                    if (Math.abs(positions[i]) > 60) {
                        positions[i] *= (1 - easedProgress * 0.1) // Gradually pull in
                    }
                    if (positions[i + 1] > 15) {
                        positions[i + 1] *= (1 - easedProgress * 0.05) // Settle down
                    }
                }
                this.sandParticles.geometry.attributes.position.needsUpdate = true
            }

        } else if (direction === 'exit') {
            // Animate terrain dissolving away
            this.terrainWaves.forEach((wave, index) => {
                // Sink into ground and fade
                wave.position.y = wave.userData.originalY - easedProgress * 10
                wave.material.opacity = (1 - easedProgress) * 0.6
            })

            // Blow sand particles away
            if (this.sandParticles) {
                this.sandParticles.material.opacity = (1 - easedProgress) * 0.4

                const positions = this.sandParticles.geometry.attributes.position.array
                const velocities = this.sandParticles.geometry.attributes.velocity.array

                for (let i = 0; i < positions.length; i += 3) {
                    // Accelerate particles away
                    positions[i] += velocities[i] * easedProgress * 20
                    positions[i + 1] += velocities[i + 1] * easedProgress * 10 + easedProgress * 5 // Lift up
                    positions[i + 2] += velocities[i + 2] * easedProgress * 20
                }
                this.sandParticles.geometry.attributes.position.needsUpdate = true
            }
        }
    }

    updateBackground(time) {
        if (this.isActive) return
        this.time = time * 0.001
    }

    dispose() {
        this.terrainWaves.forEach(wave => {
            wave.geometry.dispose()
            wave.material.dispose()
        })

        if (this.sandParticles) {
            this.sandParticles.geometry.dispose()
            this.sandParticles.material.dispose()
        }

        this.scene.remove(this.group)
    }
}
