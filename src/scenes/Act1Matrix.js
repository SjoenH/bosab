import * as THREE from 'three'

export class Act1Matrix {
    constructor(scene, camera, audioAnalyzer) {
        this.scene = scene
        this.camera = camera
        this.audioAnalyzer = audioAnalyzer

        this.group = new THREE.Group()
        this.particles = []
        this.textMeshes = []
        this.waveforms = []

        this.isActive = false
        this.time = 0

        // Data arrays for medical/clinical visualization
        this.medicalData = [
            'SAP: 120mmHg', 'HR: 72bpm', 'AUC: 0.85', 'BP: 120/80',
            'ECG: Normal', 'O2: 98%', 'Temp: 36.5°C', 'RR: 16/min',
            '01001001', '11010011', '00110101', '10101010',
            'DATA_STREAM', 'ANALYSIS', 'CARDIAC', 'NEURAL'
        ]

        this.colors = {
            primary: new THREE.Color(0x00ff41),
            secondary: new THREE.Color(0x008f11),
            accent: new THREE.Color(0xffffff),
            background: new THREE.Color(0x000000)
        }
    }

    init() {
        this.scene.add(this.group)
        this.createMatrixGrid()
        this.createWaveforms()
        this.createFloatingData()

        console.log('🔢 Act 1 - Matrix initialized')
    }

    createMatrixGrid() {
        // Create a grid of flowing matrix characters
        const geometry = new THREE.PlaneGeometry(0.5, 0.5)

        for (let x = -20; x <= 20; x += 2) {
            for (let y = -15; y <= 15; y += 2) {
                // Create text texture
                const canvas = document.createElement('canvas')
                canvas.width = 64
                canvas.height = 64
                const ctx = canvas.getContext('2d')

                ctx.fillStyle = '#000000'
                ctx.fillRect(0, 0, 64, 64)
                ctx.fillStyle = '#00ff41'
                ctx.font = '32px monospace'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'

                // Random character
                const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'
                const char = chars[Math.floor(Math.random() * chars.length)]
                ctx.fillText(char, 32, 32)

                const texture = new THREE.CanvasTexture(canvas)
                const material = new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    opacity: Math.random() * 0.8 + 0.2
                })

                const mesh = new THREE.Mesh(geometry, material)
                mesh.position.set(x, y, Math.random() * 10 - 5)

                // Store animation properties
                mesh.userData = {
                    originalY: y,
                    speed: Math.random() * 0.02 + 0.01,
                    phase: Math.random() * Math.PI * 2,
                    fadeSpeed: Math.random() * 0.05 + 0.02
                }

                this.group.add(mesh)
                this.particles.push(mesh)
            }
        }
    }

    createWaveforms() {
        // Create clinical waveform displays (ECG, HR, etc.)
        for (let i = 0; i < 3; i++) {
            const points = []
            const segments = 100

            for (let j = 0; j <= segments; j++) {
                const x = (j / segments) * 20 - 10
                const y = Math.sin(j * 0.2) * 2 + (i - 1) * 5
                points.push(new THREE.Vector3(x, y, 0))
            }

            const geometry = new THREE.BufferGeometry().setFromPoints(points)
            const material = new THREE.LineBasicMaterial({
                color: this.colors.primary,
                transparent: true,
                opacity: 0.8
            })

            const line = new THREE.Line(geometry, material)
            line.position.z = -2
            line.userData = {
                originalPoints: points,
                type: ['ecg', 'hr', 'bp'][i],
                frequency: Math.random() * 0.1 + 0.05
            }

            this.group.add(line)
            this.waveforms.push(line)
        }
    }

    createFloatingData() {
        // Create floating medical data text
        this.medicalData.forEach((text, index) => {
            const canvas = document.createElement('canvas')
            canvas.width = 256
            canvas.height = 64
            const ctx = canvas.getContext('2d')

            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
            ctx.fillRect(0, 0, 256, 64)
            ctx.fillStyle = '#00ff41'
            ctx.font = '16px monospace'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(text, 128, 32)

            const texture = new THREE.CanvasTexture(canvas)
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 0.6
            })

            const geometry = new THREE.PlaneGeometry(4, 1)
            const mesh = new THREE.Mesh(geometry, material)

            // Random positioning
            mesh.position.set(
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 10
            )

            mesh.userData = {
                driftSpeed: Math.random() * 0.01 + 0.005,
                rotationSpeed: (Math.random() - 0.5) * 0.02,
                pulsePhase: Math.random() * Math.PI * 2
            }

            this.group.add(mesh)
            this.textMeshes.push(mesh)
        })
    }

    enter() {
        this.isActive = true
        this.group.visible = true

        // Animate entrance
        this.group.scale.set(0.1, 0.1, 0.1)
        this.animateScale(1, 2000)
    }

    exit() {
        this.isActive = false
        this.animateScale(0.1, 1500)

        setTimeout(() => {
            this.group.visible = false
        }, 1500)
    }

    animateScale(targetScale, duration) {
        const startScale = this.group.scale.x
        const startTime = performance.now()

        const animate = () => {
            const elapsed = performance.now() - startTime
            const progress = Math.min(elapsed / duration, 1)

            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3)
            const currentScale = startScale + (targetScale - startScale) * easeProgress

            this.group.scale.set(currentScale, currentScale, currentScale)

            if (progress < 1) {
                requestAnimationFrame(animate)
            }
        }

        animate()
    }

    update(time) {
        if (!this.isActive) return

        this.time = time * 0.001

        // Update matrix particles
        this.updateMatrixParticles()

        // Update waveforms with audio reactivity
        this.updateWaveforms()

        // Update floating data
        this.updateFloatingData()

        // Camera subtle movement
        this.updateCamera()
    }

    updateMatrixParticles() {
        const audioVolume = this.audioAnalyzer.getVolume()
        const audioFreq = this.audioAnalyzer.getAverageFrequency()

        this.particles.forEach((particle, index) => {
            const userData = particle.userData

            // Flowing downward effect
            particle.position.y -= userData.speed * (1 + audioVolume * 2)

            // Reset to top when reaching bottom
            if (particle.position.y < -20) {
                particle.position.y = 20
                particle.position.x += (Math.random() - 0.5) * 4
            }

            // Audio-reactive opacity
            const baseOpacity = 0.3 + Math.sin(this.time + userData.phase) * 0.2
            particle.material.opacity = baseOpacity + audioFreq * 0.5

            // Pulse on beats
            if (this.audioAnalyzer.getBeat()) {
                particle.scale.set(1.5, 1.5, 1.5)
            } else {
                particle.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
            }
        })
    }

    updateWaveforms() {
        const audioVolume = this.audioAnalyzer.getVolume()
        const audioLow = this.audioAnalyzer.getLowFreq()
        const audioMid = this.audioAnalyzer.getMidFreq()
        const audioHigh = this.audioAnalyzer.getHighFreq()

        this.waveforms.forEach((waveform, index) => {
            const userData = waveform.userData
            const positions = waveform.geometry.attributes.position.array

            for (let i = 0; i < positions.length; i += 3) {
                const x = positions[i]
                let amplitude = 1

                // Different waveform types react to different frequencies
                switch (userData.type) {
                    case 'ecg':
                        amplitude = 1 + audioMid * 3
                        positions[i + 1] = userData.originalPoints[i / 3].y +
                            Math.sin(this.time * 10 + x * 0.5) * amplitude
                        break
                    case 'hr':
                        amplitude = 1 + audioLow * 2
                        positions[i + 1] = userData.originalPoints[i / 3].y +
                            Math.sin(this.time * 5 + x * 0.3) * amplitude
                        break
                    case 'bp':
                        amplitude = 1 + audioHigh * 1.5
                        positions[i + 1] = userData.originalPoints[i / 3].y +
                            Math.sin(this.time * 7 + x * 0.4) * amplitude
                        break
                }
            }

            waveform.geometry.attributes.position.needsUpdate = true

            // Pulse color on beats
            if (this.audioAnalyzer.getBeat()) {
                waveform.material.color.setHex(0xffffff)
            } else {
                waveform.material.color.lerp(this.colors.primary, 0.1)
            }
        })
    }

    updateFloatingData() {
        const audioVolume = this.audioAnalyzer.getVolume()

        this.textMeshes.forEach((mesh, index) => {
            const userData = mesh.userData

            // Drift movement
            mesh.position.x += userData.driftSpeed
            mesh.position.y += Math.sin(this.time + userData.pulsePhase) * 0.01
            mesh.rotation.z += userData.rotationSpeed

            // Wrap around screen
            if (mesh.position.x > 20) mesh.position.x = -20
            if (mesh.position.x < -20) mesh.position.x = 20

            // Audio-reactive opacity
            const baseOpacity = 0.4 + Math.sin(this.time * 2 + index) * 0.2
            mesh.material.opacity = baseOpacity + audioVolume * 0.3
        })
    }

    updateCamera() {
        // Subtle camera movement for immersion
        const audioVolume = this.audioAnalyzer.getVolume()
        this.camera.position.x = Math.sin(this.time * 0.5) * 0.5 + audioVolume * 0.3
        this.camera.position.y = Math.cos(this.time * 0.3) * 0.3 + audioVolume * 0.2
        this.camera.lookAt(0, 0, 0)
    }

    updateBackground(time) {
        // Background updates when act is not active
        if (this.isActive) return

        // Keep some subtle animation running
        this.time = time * 0.001
    }

    dispose() {
        // Clean up geometries and materials
        this.particles.forEach(particle => {
            particle.geometry.dispose()
            particle.material.dispose()
        })

        this.waveforms.forEach(waveform => {
            waveform.geometry.dispose()
            waveform.material.dispose()
        })

        this.textMeshes.forEach(mesh => {
            mesh.geometry.dispose()
            mesh.material.dispose()
        })

        this.scene.remove(this.group)
    }
}
