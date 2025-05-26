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
        // Simple starfield using particles
        const starCount = 2000
        const geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(starCount * 3)
        const colors = new Float32Array(starCount * 3)
        const sizes = new Float32Array(starCount)

        for (let i = 0; i < starCount; i++) {
            // Spherical distribution
            const radius = 100 + Math.random() * 400
            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos(2 * Math.random() - 1)

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
            positions[i * 3 + 2] = radius * Math.cos(phi)

            // Star colors - mix of white and blue
            if (Math.random() < 0.7) {
                colors[i * 3] = 1.0     // white stars
                colors[i * 3 + 1] = 1.0
                colors[i * 3 + 2] = 1.0
            } else {
                colors[i * 3] = 0.3     // blue stars
                colors[i * 3 + 1] = 0.5
                colors[i * 3 + 2] = 1.0
            }

            sizes[i] = Math.random() * 2 + 0.5
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

        const material = new THREE.PointsMaterial({
            size: 1.0,
            transparent: true,
            opacity: 0.8,
            vertexColors: true,
            blending: THREE.AdditiveBlending
        })

        this.starfield = new THREE.Points(geometry, material)
        this.group.add(this.starfield)
    }

    createCosmicDust() {
        // Flowing cosmic dust particles
        const dustCount = 500
        const geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(dustCount * 3)
        const velocities = new Float32Array(dustCount * 3)

        for (let i = 0; i < dustCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 200
            positions[i * 3 + 1] = (Math.random() - 0.5) * 200
            positions[i * 3 + 2] = (Math.random() - 0.5) * 200

            velocities[i * 3] = (Math.random() - 0.5) * 0.02
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))

        const material = new THREE.PointsMaterial({
            color: this.colors.dust,
            size: 0.5,
            transparent: true,
            opacity: 0.3,
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

        // Gentle twinkling effect
        this.starfield.material.opacity = 0.6 + audioIntensity * 0.4

        // Beat reaction
        if (beat) {
            this.starfield.material.size = 1.5
        } else {
            this.starfield.material.size = THREE.MathUtils.lerp(this.starfield.material.size, 1.0, 0.1)
        }

        // Slow rotation for depth
        this.starfield.rotation.y += deltaTime * 0.01
        this.starfield.rotation.x += deltaTime * 0.005
    }

    updateCosmicDust() {
        const audioMid = this.audioAnalyzer.getMidFreq()

        if (!this.cosmicDust) return

        const positions = this.cosmicDust.geometry.attributes.position.array
        const velocities = this.cosmicDust.geometry.attributes.velocity.array

        for (let i = 0; i < positions.length; i += 3) {
            // Apply movement
            positions[i] += velocities[i] * (1 + audioMid * 2)
            positions[i + 1] += velocities[i + 1] * (1 + audioMid * 2)
            positions[i + 2] += velocities[i + 2] * (1 + audioMid * 2)

            // Wrap around space
            if (positions[i] > 100) positions[i] = -100
            if (positions[i] < -100) positions[i] = 100
            if (positions[i + 1] > 100) positions[i + 1] = -100
            if (positions[i + 1] < -100) positions[i + 1] = 100
            if (positions[i + 2] > 100) positions[i + 2] = -100
            if (positions[i + 2] < -100) positions[i + 2] = 100
        }

        this.cosmicDust.geometry.attributes.position.needsUpdate = true
        this.cosmicDust.material.opacity = 0.2 + audioMid * 0.3
    }

    updateCamera() {
        // Meditative camera drift
        const driftX = Math.sin(this.time * 0.1) * 1
        const driftY = Math.cos(this.time * 0.15) * 0.5
        const driftZ = Math.sin(this.time * 0.08) * 2

        this.camera.position.x = driftX
        this.camera.position.y = driftY
        this.camera.position.z = driftZ
        this.camera.lookAt(0, 0, 0)
    }

    enter() {
        this.isActive = true
        this.group.visible = true
        console.log('✨ Entering Act 4 - Stars')
    }

    exit() {
        this.isActive = false
        this.group.visible = false
        console.log('✨ Exiting Act 4 - Stars')
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
