import * as THREE from 'three'

export class Act4Stars {
    constructor(scene, camera, audioAnalyzer) {
        this.scene = scene
        this.camera = camera
        this.audioAnalyzer = audioAnalyzer

        this.group = new THREE.Group()
        this.starfield = null
        this.cosmicDust = null

        this.isActive = false
        this.time = 0
        this.transitionState = 'idle'

        this.colors = {
            star: new THREE.Color(0xffffff),
            bluestar: new THREE.Color(0x4488ff),
            dust: new THREE.Color(0x8899bb)
        }
    }

    init() {
        this.scene.add(this.group)
        this.createStarfield()
        this.createCosmicDust()

        console.log('✨ Act 4 - Stars initialized')
    }

    createStarfield() {
        // Peaceful starfield using fewer, more serene particles
        const starCount = 1200 // Reduced for calmer sky
        const geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(starCount * 3)
        const colors = new Float32Array(starCount * 3)
        const sizes = new Float32Array(starCount)

        for (let i = 0; i < starCount; i++) {
            // Spherical distribution
            const radius = 100 + Math.random() * 300 // Slightly closer
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(2 * Math.random() - 1)

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
            positions[i * 3 + 2] = radius * Math.cos(phi)

            // Warmer, softer star colors - more golden whites and warm blues
            if (Math.random() < 0.8) {
                colors[i * 3] = 1.0     // warm white stars
                colors[i * 3 + 1] = 0.95
                colors[i * 3 + 2] = 0.9
            } else {
                colors[i * 3] = 0.7     // soft blue stars
                colors[i * 3 + 1] = 0.8
                colors[i * 3 + 2] = 1.0
            }

            sizes[i] = Math.random() * 1.5 + 0.3 // Smaller, more delicate stars
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

        const material = new THREE.PointsMaterial({
            size: 0.8, // Smaller, more delicate stars
            transparent: true,
            opacity: 0.9, // Slightly more visible for warmth
            vertexColors: true,
            blending: THREE.AdditiveBlending
        })

        this.starfield = new THREE.Points(geometry, material)
        this.group.add(this.starfield)
    }

    createCosmicDust() {
        // Gentle cosmic dust particles - fewer and calmer
        const dustCount = 300 // Reduced for more peaceful atmosphere
        const geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(dustCount * 3)
        const velocities = new Float32Array(dustCount * 3)

        for (let i = 0; i < dustCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 150 // Closer distribution
            positions[i * 3 + 1] = (Math.random() - 0.5) * 150
            positions[i * 3 + 2] = (Math.random() - 0.5) * 150

            // Much slower, more peaceful velocities
            velocities[i * 3] = (Math.random() - 0.5) * 0.008
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.008
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.008
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))

        const material = new THREE.PointsMaterial({
            color: new THREE.Color(0x9999cc), // Softer, warmer dust color
            size: 0.3, // Smaller particles
            transparent: true,
            opacity: 0.4, // More visible for gentle presence
            blending: THREE.AdditiveBlending
        })

        this.cosmicDust = new THREE.Points(geometry, material)
        this.group.add(this.cosmicDust)
    }

    update(deltaTime) {
        if (!this.isActive) return

        this.time += deltaTime

        this.updateStarfield(deltaTime)
        this.updateCosmicDust()
        this.updateCamera()
    }

    updateStarfield(deltaTime) {
        const audioIntensity = this.audioAnalyzer.getAverageFrequency()
        const beat = this.audioAnalyzer.getBeat()

        if (!this.starfield) return

        // Very subtle twinkling effect - barely noticeable
        this.starfield.material.opacity = 0.85 + audioIntensity * 0.05

        // Minimal beat reaction - just a gentle pulse
        if (beat) {
            this.starfield.material.size = THREE.MathUtils.lerp(this.starfield.material.size, 0.85, 0.01)
        } else {
            this.starfield.material.size = THREE.MathUtils.lerp(this.starfield.material.size, 0.8, 0.03)
        }

        // No rotation - stars remain perfectly still
    }

    updateCosmicDust() {
        const audioMid = this.audioAnalyzer.getMidFreq()

        if (!this.cosmicDust) return

        // No position updates - dust stays perfectly still like distant stars
        // Only opacity changes for gentle twinkling effect
        this.cosmicDust.material.opacity = 0.35 + audioMid * 0.05
    }

    updateCamera() {
        // No camera movement - perfectly still for complete meditation
        // Camera stays at origin looking at center
        this.camera.position.set(0, 0, 0)
        this.camera.lookAt(0, 0, 0)
    }

    enter() {
        this.isActive = true
        this.transitionState = 'active'
        this.group.visible = true
        console.log('✨ Entering Act 4 - Stars')
    }

    exit() {
        this.isActive = false
        this.transitionState = 'idle'
        this.group.visible = false
        console.log('✨ Exiting Act 4 - Stars')
    }

    // Enhanced transition methods
    prepareEntry() {
        this.transitionState = 'entering'
        this.group.visible = true

        // Start stars collapsed at center
        if (this.starfield) {
            const positions = this.starfield.geometry.attributes.position.array
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] *= 0.01 // Collapse to center
                positions[i + 1] *= 0.01
                positions[i + 2] *= 0.01
            }
            this.starfield.geometry.attributes.position.needsUpdate = true
            this.starfield.material.opacity = 0
        }

        // Start cosmic dust concentrated
        if (this.cosmicDust) {
            const positions = this.cosmicDust.geometry.attributes.position.array
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] *= 0.1
                positions[i + 1] *= 0.1
                positions[i + 2] *= 0.1
            }
            this.cosmicDust.geometry.attributes.position.needsUpdate = true
            this.cosmicDust.material.opacity = 0
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
            // Animate stars expanding from center like big bang
            if (this.starfield) {
                const positions = this.starfield.geometry.attributes.position.array
                const targetPositions = this.starfield.userData.originalPositions

                if (!targetPositions) {
                    // Store original positions
                    this.starfield.userData.originalPositions = new Float32Array(positions.length)
                    for (let i = 0; i < positions.length; i++) {
                        this.starfield.userData.originalPositions[i] = positions[i] / 0.01 // Undo initial collapse
                    }
                }

                // Expand from center
                for (let i = 0; i < positions.length; i += 3) {
                    const targetX = this.starfield.userData.originalPositions[i]
                    const targetY = this.starfield.userData.originalPositions[i + 1]
                    const targetZ = this.starfield.userData.originalPositions[i + 2]

                    positions[i] = targetX * easedProgress
                    positions[i + 1] = targetY * easedProgress
                    positions[i + 2] = targetZ * easedProgress
                }
                this.starfield.geometry.attributes.position.needsUpdate = true
                this.starfield.material.opacity = easedProgress * 0.8
            }

            // Animate cosmic dust spreading out
            if (this.cosmicDust) {
                const positions = this.cosmicDust.geometry.attributes.position.array
                const targetPositions = this.cosmicDust.userData.originalPositions

                if (!targetPositions) {
                    // Store original positions
                    this.cosmicDust.userData.originalPositions = new Float32Array(positions.length)
                    for (let i = 0; i < positions.length; i++) {
                        this.cosmicDust.userData.originalPositions[i] = positions[i] / 0.1
                    }
                }

                for (let i = 0; i < positions.length; i += 3) {
                    const targetX = this.cosmicDust.userData.originalPositions[i]
                    const targetY = this.cosmicDust.userData.originalPositions[i + 1]
                    const targetZ = this.cosmicDust.userData.originalPositions[i + 2]

                    positions[i] = targetX * easedProgress
                    positions[i + 1] = targetY * easedProgress
                    positions[i + 2] = targetZ * easedProgress
                }
                this.cosmicDust.geometry.attributes.position.needsUpdate = true
                this.cosmicDust.material.opacity = easedProgress * 0.3
            }

        } else if (direction === 'exit') {
            // Animate stars drifting away and fading
            if (this.starfield) {
                const positions = this.starfield.geometry.attributes.position.array

                for (let i = 0; i < positions.length; i += 3) {
                    // Drift outward
                    positions[i] *= (1 + easedProgress * 0.5)
                    positions[i + 1] *= (1 + easedProgress * 0.5)
                    positions[i + 2] *= (1 + easedProgress * 0.5)
                }
                this.starfield.geometry.attributes.position.needsUpdate = true
                this.starfield.material.opacity = (1 - easedProgress) * 0.8
            }

            // Cosmic dust disperses
            if (this.cosmicDust) {
                this.cosmicDust.material.opacity = (1 - easedProgress) * 0.3
            }
        }
    }

    updateBackground(deltaTime) {
        if (this.isActive) return
        this.time += deltaTime * 0.1
    }

    dispose() {
        if (this.starfield) {
            this.starfield.geometry.dispose()
            this.starfield.material.dispose()
        }

        if (this.cosmicDust) {
            this.cosmicDust.geometry.dispose()
            this.cosmicDust.material.dispose()
        }

        this.scene.remove(this.group)
    }
}
