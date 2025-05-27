/**
 * Act 4 - Stars: Expanding starfield, meditative drift, and cosmic wonder
 * 
 * Creates peaceful starfield, cosmic dust, and gentle galaxy rotation.
 * Represents the final cosmic/transcendent act.
 */

import * as THREE from 'three'
import { BaseAct } from './BaseAct.js'

export class Act4Stars extends BaseAct {
    constructor(scene, camera, audioAnalyzer, actNumber) {
        super(scene, camera, audioAnalyzer, actNumber)

        // Act 4 specific properties
        this.starfield = null
        this.cosmicDust = null
        this.milkyWay = null
        this.nebulaClouds = []

        this.colors = {
            star: new THREE.Color(0xffffff),
            bluestar: new THREE.Color(0x4488ff),
            dust: new THREE.Color(0x8899bb),
            nebula: new THREE.Color(0x9966ff),
            cosmic: new THREE.Color(0xffaa66)
        }

        console.log(`✨ Act4Stars created`)
    }

    /**
     * Create act-specific content - implements BaseAct virtual method
     */
    createContent() {
        this.createStarfield()
        this.createMilkyWay()
        this.createCosmicDust()
        this.createNebulaClouds()
        console.log('✨ Act 4 - Stars content created')
    }

    createStarfield() {
        // Peaceful starfield using fewer, more serene particles
        const starCount = 1200 // Reduced for calmer sky
        const geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(starCount * 3)
        const colors = new Float32Array(starCount * 3)
        const sizes = new Float32Array(starCount)

        const bounds = this.getBounds()
        const centerX = (bounds.min.x + bounds.max.x) / 2

        for (let i = 0; i < starCount; i++) {
            // Position stars in front of the camera for a starfield effect
            // Camera looks from (75, 0, -15) toward (75, 0, 0)
            const radius = 50 + Math.random() * 150 // Distance from center
            const theta = Math.random() * Math.PI * 2 // Horizontal angle
            const phi = Math.random() * Math.PI // Vertical angle

            // Position stars in a hemisphere facing the camera
            positions[i * 3] = centerX + (Math.random() - 0.5) * 30 // Spread across X
            positions[i * 3 + 1] = (Math.random() - 0.5) * 60 // Spread across Y
            positions[i * 3 + 2] = Math.random() * 80 + 10 // Stars are in front of center (positive Z)

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
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true, // Makes stars round and size-based on distance
            alphaTest: 0.1, // Helps with round appearance
            map: this.createCircularTexture() // Add circular texture for round stars
        })

        this.starfield = new THREE.Points(geometry, material)
        this.registerMaterial(material)
        this.group.add(this.starfield)
    }

    createMilkyWay() {
        // Create a beautiful Milky Way band across the sky
        const milkyWayCount = 3000
        const geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(milkyWayCount * 3)
        const colors = new Float32Array(milkyWayCount * 3)
        const sizes = new Float32Array(milkyWayCount)

        const bounds = this.getBounds()
        const centerX = (bounds.min.x + bounds.max.x) / 2

        for (let i = 0; i < milkyWayCount; i++) {
            // Create a diagonal band across the sky
            const t = i / milkyWayCount

            // Create a diagonal band with some curvature
            const bandProgress = t * Math.PI * 4 // Multiple bands for richness
            const bandHeight = Math.sin(bandProgress * 0.5) * 15 // Curved band
            const bandOffset = (Math.random() - 0.5) * 8

            // Position stars in the Milky Way band
            positions[i * 3] = centerX + (t - 0.5) * 40 + bandOffset // Along X axis
            positions[i * 3 + 1] = bandHeight + (Math.random() - 0.5) * 8 // Band height variation
            positions[i * 3 + 2] = 20 + Math.random() * 60 // In front of camera

            // Dense core colors - warm whites, blues, and subtle purples
            const colorVariation = Math.random()
            if (colorVariation < 0.6) {
                // Warm white core
                colors[i * 3] = 0.9 + Math.random() * 0.1
                colors[i * 3 + 1] = 0.85 + Math.random() * 0.15
                colors[i * 3 + 2] = 0.7 + Math.random() * 0.3
            } else if (colorVariation < 0.8) {
                // Blue stars
                colors[i * 3] = 0.6 + Math.random() * 0.2
                colors[i * 3 + 1] = 0.7 + Math.random() * 0.2
                colors[i * 3 + 2] = 0.9 + Math.random() * 0.1
            } else {
                // Subtle purple/pink nebula regions
                colors[i * 3] = 0.8 + Math.random() * 0.2
                colors[i * 3 + 1] = 0.6 + Math.random() * 0.2
                colors[i * 3 + 2] = 0.8 + Math.random() * 0.2
            }

            // Varying sizes for density variation
            sizes[i] = Math.random() * 1.2 + 0.2
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

        const material = new THREE.PointsMaterial({
            size: 0.6,
            transparent: true,
            opacity: 0.8,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true, // Makes Milky Way stars round
            alphaTest: 0.1,
            map: this.createCircularTexture() // Add circular texture for round stars
        })

        this.milkyWay = new THREE.Points(geometry, material)
        this.registerMaterial(material)
        this.group.add(this.milkyWay)
    }

    createCosmicDust() {
        // Gentle cosmic dust particles - fewer and calmer
        const dustCount = 300 // Reduced for more peaceful atmosphere
        const geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(dustCount * 3)
        const velocities = new Float32Array(dustCount * 3)

        for (let i = 0; i < dustCount; i++) {
            // Position within act bounds, but in front of camera
            const bounds = this.getBounds()
            positions[i * 3] = bounds.min.x + Math.random() * (bounds.max.x - bounds.min.x)
            positions[i * 3 + 1] = (Math.random() - 0.5) * 50
            positions[i * 3 + 2] = Math.random() * 80 + 5 // In front of camera

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
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true, // Round particles
            alphaTest: 0.1,
            map: this.createCircularTexture() // Add circular texture for round particles
        })

        this.cosmicDust = new THREE.Points(geometry, material)
        this.registerMaterial(material)
        this.group.add(this.cosmicDust)
    }

    createNebulaClouds() {
        // Create soft nebula clouds
        const cloudCount = 8
        for (let i = 0; i < cloudCount; i++) {
            const geometry = new THREE.SphereGeometry(10 + Math.random() * 20, 16, 16)
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(0.7 + Math.random() * 0.3, 0.6, 0.3),
                transparent: true,
                opacity: 0.1,
                wireframe: false
            })

            const nebula = new THREE.Mesh(geometry, material)
            const bounds = this.getBounds()
            nebula.position.set(
                bounds.min.x + Math.random() * (bounds.max.x - bounds.min.x),
                (Math.random() - 0.5) * 40,
                20 + Math.random() * 60 // Position nebula clouds in front of camera
            )

            this.nebulaClouds.push(nebula)
            this.registerMaterial(material)
            this.group.add(nebula)
        }
    }

    /**
     * Act-specific content update - implements BaseAct virtual method
     */
    updateContent(time, deltaTime) {
        this.updateStarfield(deltaTime)
        this.updateMilkyWay()
        this.updateCosmicDust()
        this.updateNebulaClouds(deltaTime)
    }

    updateStarfield(deltaTime) {
        if (!this.starfield) return

        // More noticeable twinkling effect
        this.starfield.material.opacity = 0.7 + this.audioLevel * 0.3

        // More visible beat reaction
        if (this.beatDetected) {
            this.starfield.material.size = THREE.MathUtils.lerp(this.starfield.material.size, 1.0, 0.05)
        } else {
            this.starfield.material.size = THREE.MathUtils.lerp(this.starfield.material.size, 0.8, 0.02)
        }
    }

    updateMilkyWay() {
        if (!this.milkyWay) return

        // More visible galactic dust movement
        this.milkyWay.material.opacity = 0.6 + this.bassLevel * 0.2
    }

    updateCosmicDust() {
        if (!this.cosmicDust) return

        // More visible twinkling effect for cosmic dust
        this.cosmicDust.material.opacity = 0.3 + this.midLevel * 0.15
    }

    updateNebulaClouds(deltaTime) {
        this.nebulaClouds.forEach((nebula, index) => {
            // Gentle floating motion
            nebula.position.y += Math.sin(this.time + index) * 0.01
            nebula.rotation.y += deltaTime * 0.1

            // Subtle audio reaction
            const scale = 1 + this.audioLevel * 0.1
            nebula.scale.setScalar(scale)
        })
    }

    /**
     * Prepare for entry transition - implements BaseAct method
     */
    onPrepareEntry() {
        // Start stars collapsed at center
        if (this.starfield) {
            const positions = this.starfield.geometry.attributes.position.array
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] *= 0.01 // Collapse to center
                positions[i + 1] *= 0.01
                positions[i + 2] *= 0.01
            }
            this.starfield.geometry.attributes.position.needsUpdate = true
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
        }

        // Store original positions for expansion animation
        this.storeOriginalPositions()
    }

    /**
     * Handle transition updates - implements BaseAct method
     */
    onUpdateTransition(progress, direction) {
        const easeInOutQuad = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
        const easedProgress = easeInOutQuad(progress)

        if (direction === 'enter') {
            // Animate stars expanding from center like big bang
            if (this.starfield && this.starfield.userData.originalPositions) {
                const positions = this.starfield.geometry.attributes.position.array
                const targetPositions = this.starfield.userData.originalPositions

                // Expand from center
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i] = targetPositions[i] * easedProgress
                    positions[i + 1] = targetPositions[i + 1] * easedProgress
                    positions[i + 2] = targetPositions[i + 2] * easedProgress
                }
                this.starfield.geometry.attributes.position.needsUpdate = true
            }

            // Animate cosmic dust spreading out
            if (this.cosmicDust && this.cosmicDust.userData.originalPositions) {
                const positions = this.cosmicDust.geometry.attributes.position.array
                const targetPositions = this.cosmicDust.userData.originalPositions

                for (let i = 0; i < positions.length; i += 3) {
                    positions[i] = targetPositions[i] * easedProgress
                    positions[i + 1] = targetPositions[i + 1] * easedProgress
                    positions[i + 2] = targetPositions[i + 2] * easedProgress
                }
                this.cosmicDust.geometry.attributes.position.needsUpdate = true
            }

            // Nebula clouds fade in
            this.nebulaClouds.forEach(nebula => {
                nebula.material.opacity = easedProgress * 0.1
            })

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
            }

            // Nebula clouds fade out
            this.nebulaClouds.forEach(nebula => {
                nebula.material.opacity = (1 - easedProgress) * 0.1
            })
        }
    }

    /**
     * Store original positions for transition animations
     */
    storeOriginalPositions() {
        if (this.starfield) {
            const positions = this.starfield.geometry.attributes.position.array
            this.starfield.userData.originalPositions = new Float32Array(positions.length)
            for (let i = 0; i < positions.length; i++) {
                this.starfield.userData.originalPositions[i] = positions[i] / 0.01 // Undo initial collapse
            }
        }

        if (this.cosmicDust) {
            const positions = this.cosmicDust.geometry.attributes.position.array
            this.cosmicDust.userData.originalPositions = new Float32Array(positions.length)
            for (let i = 0; i < positions.length; i++) {
                this.cosmicDust.userData.originalPositions[i] = positions[i] / 0.1
            }
        }
    }

    /**
     * Create a circular texture for round star particles
     */
    createCircularTexture() {
        const canvas = document.createElement('canvas')
        canvas.width = 32
        canvas.height = 32
        const ctx = canvas.getContext('2d')

        // Create gradient for soft circular star
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)')
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 32, 32)

        const texture = new THREE.CanvasTexture(canvas)
        texture.needsUpdate = true
        return texture
    }
}
