import * as THREE from 'three'

export class Act3Human {
    constructor(scene, camera, audioAnalyzer) {
        this.scene = scene
        this.camera = camera
        this.audioAnalyzer = audioAnalyzer

        this.group = new THREE.Group()
        this.flowingParticles = []
        this.heartCenter = null
        this.connectionLines = []

        this.isActive = false
        this.time = 0
        this.transitionState = 'idle'

        this.colors = {
            flow: new THREE.Color(0xffdbac),
            heart: new THREE.Color(0xff6b6b),
            connection: new THREE.Color(0xff6b9d),
            warm: new THREE.Color(0xffd93d)
        }
    }

    init() {
        this.scene.add(this.group)
        this.createFlowingParticles()
        this.createHeartCenter()
        this.createConnectionLines()

        console.log('🫀 Act 3 - Human initialized')
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

                positions[i * 3] = Math.cos(spiralAngle) * radius * (1 - t * 0.3)
                positions[i * 3 + 1] = Math.sin(spiralAngle) * radius * (1 - t * 0.3)
                positions[i * 3 + 2] = (t - 0.5) * 10
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
                rotationSpeed: (Math.random() - 0.5) * 0.02
            }

            this.group.add(stream)
            this.flowingParticles.push(stream)
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
        this.group.add(this.heartCenter)
    }

    createConnectionLines() {
        // Simple lines connecting points around the center
        const lineCount = 12

        for (let i = 0; i < lineCount; i++) {
            const angle = (i / lineCount) * Math.PI * 2
            const radius = 8

            const start = new THREE.Vector3(0, 0, 0)
            const end = new THREE.Vector3(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                (Math.random() - 0.5) * 5
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
                originalOpacity: 0.4
            }

            this.group.add(line)
            this.connectionLines.push(line)
        }
    }

    update(time) {
        if (!this.isActive) return

        this.time = time * 0.001

        this.updateFlowingParticles()
        this.updateHeartCenter()
        this.updateConnectionLines()
        this.updateCamera()
    }

    updateFlowingParticles() {
        const audioVolume = this.audioAnalyzer.getVolume()
        const audioMid = this.audioAnalyzer.getMidFreq()

        this.flowingParticles.forEach((stream, index) => {
            const userData = stream.userData

            // Rotate the streams
            stream.rotation.y += userData.rotationSpeed * (1 + audioVolume * 2)
            stream.rotation.z = Math.sin(this.time + index) * 0.1

            // Audio-reactive properties
            stream.material.opacity = 0.5 + audioMid * 0.5
            stream.material.size = 0.15 * (1 + audioVolume * 0.5)

            // Color shift based on audio
            if (this.audioAnalyzer.getBeat()) {
                stream.material.color.lerp(this.colors.warm, 0.3)
            } else {
                stream.material.color.lerp(this.colors.flow, 0.1)
            }
        })
    }

    updateHeartCenter() {
        if (!this.heartCenter) return

        const audioLow = this.audioAnalyzer.getLowFreq()
        const beat = this.audioAnalyzer.getBeat()

        // Heartbeat pulsing
        const heartbeat = beat ? 1.3 : 1.0 + Math.sin(this.time * 2) * 0.1
        this.heartCenter.scale.setScalar(heartbeat * (1 + audioLow * 0.5))

        // Gentle rotation
        this.heartCenter.rotation.y = this.time * 0.2

        // Beat color reaction
        if (beat) {
            this.heartCenter.material.color.setHex(0xffffff)
        } else {
            this.heartCenter.material.color.lerp(this.colors.heart, 0.1)
        }
    }

    updateConnectionLines() {
        const audioVolume = this.audioAnalyzer.getVolume()

        this.connectionLines.forEach((line, index) => {
            const userData = line.userData

            // Pulsing opacity
            const pulse = Math.sin(this.time * 2 + userData.pulsePhase) * 0.3 + 0.5
            line.material.opacity = pulse * userData.originalOpacity * (1 + audioVolume)
        })
    }

    updateCamera() {
        // Gentle breathing movement
        const audioVolume = this.audioAnalyzer.getVolume()
        const breathing = Math.sin(this.time * 0.8) * 1

        this.camera.position.y = breathing + audioVolume * 1.5
        this.camera.position.z = 12 + Math.sin(this.time * 0.3) * 1
        this.camera.lookAt(0, 0, 0)
    }

    updateBackground(time) {
        if (this.isActive) return
        this.time = time * 0.001
    }

    enter() {
        this.isActive = true
        this.transitionState = 'active'
        this.group.visible = true
        console.log('🫀 Entering Act 3 - Human')
    }

    exit() {
        this.isActive = false
        this.transitionState = 'idle'
        this.group.visible = false
        console.log('🫀 Exiting Act 3 - Human')
    }

    // Enhanced transition methods
    prepareEntry() {
        this.transitionState = 'entering'
        this.group.visible = true

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
            // Animate flowing particles expanding organically
            this.flowingParticles.forEach((stream, index) => {
                const delay = index * 0.08
                const adjustedProgress = Math.max(0, Math.min(1, (easedProgress - delay) / 0.7))

                // Organic growth from center
                const targetScale = 1.0
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

    dispose() {
        this.flowingParticles.forEach(stream => {
            stream.geometry.dispose()
            stream.material.dispose()
        })

        if (this.heartCenter) {
            this.heartCenter.geometry.dispose()
            this.heartCenter.material.dispose()
        }

        this.connectionLines.forEach(line => {
            line.geometry.dispose()
            line.material.dispose()
        })

        this.scene.remove(this.group)
    }
}
