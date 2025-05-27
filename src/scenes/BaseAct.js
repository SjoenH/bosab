/**
 * Base Act Class for "beneath our skin and bones"
 * 
 * Provides standardized positioning, lifecycle management, and common
 * functionality for all acts. Ensures consistent behavior and easy maintenance.
 */

import * as THREE from 'three'
import { LayoutHelper } from '../config/LayoutConfig.js'

export class BaseAct {
    constructor(scene, camera, audioAnalyzer, actNumber) {
        this.scene = scene
        this.camera = camera
        this.audioAnalyzer = audioAnalyzer
        this.actNumber = actNumber

        // Core group for all act content
        this.group = new THREE.Group()
        this.group.name = `Act${actNumber}Group`

        // Act state management
        this.isActive = false
        this.isInitialized = false
        this.transitionState = 'idle' // 'idle', 'entering', 'active', 'exiting'

        // Timing
        this.time = 0
        this.deltaTime = 0
        this.lastUpdateTime = 0

        // Audio reactive properties
        this.audioLevel = 0
        this.bassLevel = 0
        this.midLevel = 0
        this.trebleLevel = 0
        this.beatDetected = false

        // Transition properties
        this.transitionProgress = 0
        this.fadeValue = 0

        // Position and bounds (set from layout config)
        this.actPosition = new THREE.Vector3()
        this.bounds = null

        // Performance optimization
        this.needsUpdate = true
        this.updateFrequency = 60 // Target updates per second
        this.lastFrameTime = 0

        // Visual elements collections
        this.particles = []
        this.meshes = []
        this.lines = []
        this.materials = []

        console.log(`🎭 BaseAct ${actNumber} created`)
    }

    /**
     * Initialize the act - called once during setup
     */
    init() {
        if (this.isInitialized) {
            console.warn(`Act ${this.actNumber} already initialized`)
            return
        }

        // Position the act according to layout config
        this.applyLayoutPosition()

        // Add to scene
        this.scene.add(this.group)

        // Create act-specific content
        this.createContent()

        // Initially visible and active - don't hide acts
        this.group.visible = true

        this.isInitialized = true
        console.log(`🎭 Act ${this.actNumber} initialized at position ${this.actPosition.toArray().join(', ')}`)
    }

    /**
     * Apply layout position from config
     */
    applyLayoutPosition() {
        this.actPosition = LayoutHelper.getActPosition(this.actNumber)
        this.bounds = LayoutHelper.getActBounds(this.actNumber)

        // Position the entire group
        this.group.position.copy(this.actPosition)

        console.log(`📐 Act ${this.actNumber} positioned at:`, this.actPosition)
    }

    /**
     * Get the spatial bounds for this act
     */
    getBounds() {
        if (!this.bounds) {
            console.warn(`Act ${this.actNumber}: bounds not initialized`)
            return { min: { x: -10, y: -10, z: -10 }, max: { x: 10, y: 10, z: 10 } }
        }
        return this.bounds
    }

    /**
     * Create act-specific content - override in child classes
     */
    createContent() {
        // Override this method in child classes
        console.warn(`Act ${this.actNumber}: createContent() should be overridden`)
    }

    /**
     * Prepare for entry transition
     */
    prepareEntry() {
        this.transitionState = 'entering'
        this.group.visible = true
        this.fadeValue = 0
        this.transitionProgress = 0
        this.applyFade(0)

        // Call act-specific preparation
        this.onPrepareEntry()

        console.log(`🎭 Act ${this.actNumber} preparing entry`)
    }

    /**
     * Start entry animation
     */
    startEntry() {
        this.transitionState = 'entering'
        this.onStartEntry()
    }

    /**
     * Complete entry and become active
     */
    enter() {
        this.isActive = true
        this.transitionState = 'active'
        this.group.visible = true
        this.fadeValue = 1
        this.transitionProgress = 1
        this.applyFade(1)

        // Call act-specific entry
        this.onEnter()

        console.log(`🎭 Act ${this.actNumber} entered (active)`)
    }

    /**
     * Start exit transition
     */
    startExit() {
        this.transitionState = 'exiting'
        this.onStartExit()

        console.log(`🎭 Act ${this.actNumber} starting exit`)
    }

    /**
     * Finish exit process
     */
    finishExit() {
        this.onFinishExit()
    }

    /**
     * Complete exit and become inactive
     */
    exit() {
        this.isActive = false
        this.transitionState = 'idle'
        // Keep acts visible and running - don't hide them
        // this.group.visible = false
        this.fadeValue = 1  // Keep full opacity instead of fading out
        this.transitionProgress = 0

        // Call act-specific exit
        this.onExit()

        console.log(`🎭 Act ${this.actNumber} exited (but remains visible and active)`)
    }

    /**
     * Update transition state
     */
    updateTransition(progress, direction) {
        this.transitionProgress = progress

        if (direction === 'enter') {
            this.fadeValue = progress
        } else if (direction === 'exit') {
            this.fadeValue = 1 - progress
        }

        this.applyFade(this.fadeValue)
        this.onUpdateTransition(progress, direction)
    }

    /**
     * Apply fade effect to all materials
     */
    applyFade(fadeValue) {
        this.materials.forEach(material => {
            if (material.uniforms && material.uniforms.opacity) {
                material.uniforms.opacity.value = fadeValue
            } else if (material.opacity !== undefined) {
                material.opacity = fadeValue
                material.transparent = fadeValue < 1
            }
        })
    }

    /**
     * Main update loop - called every frame when active
     */
    update(time) {
        if (!this.isInitialized) return

        // Calculate delta time
        this.deltaTime = this.lastUpdateTime > 0 ? time - this.lastUpdateTime : 0
        this.lastUpdateTime = time
        this.time = time

        // Update audio analysis
        this.updateAudioData()

        // Performance-conscious updates
        if (this.shouldUpdate(time)) {
            this.updateContent(time)
            this.lastFrameTime = time
        }

        // Always update time-critical elements
        this.updateTimeCritical(time)
    }

    /**
     * Background update for inactive acts
     */
    updateBackground(time) {
        if (!this.isInitialized) return

        // Continue full processing even when not active - don't pause acts
        // Calculate delta time
        this.deltaTime = this.lastUpdateTime > 0 ? time - this.lastUpdateTime : 0
        this.lastUpdateTime = time
        this.time = time

        // Update audio analysis
        this.updateAudioData()

        // Continue full updates for background acts
        if (this.shouldUpdate(time)) {
            this.updateContent(time)
            this.lastFrameTime = time
        }

        // Always update time-critical elements
        this.updateTimeCritical(time)

        // Also call background content update for any act-specific background behavior
        this.updateBackgroundContent(time)
    }

    /**
     * Check if act should update this frame (performance optimization)
     */
    shouldUpdate(time) {
        const targetInterval = 1000 / this.updateFrequency
        return (time - this.lastFrameTime) >= targetInterval
    }

    /**
     * Update audio analysis data
     */
    updateAudioData() {
        if (this.audioAnalyzer && this.audioAnalyzer.isEnabled) {
            this.audioLevel = this.audioAnalyzer.getVolume()
            this.bassLevel = this.audioAnalyzer.getLowFreq()
            this.midLevel = this.audioAnalyzer.getMidFreq()
            this.trebleLevel = this.audioAnalyzer.getHighFreq()
            this.beatDetected = this.audioAnalyzer.getBeat()
        } else {
            // Fallback values when audio is not available
            this.audioLevel = 0.1
            this.bassLevel = 0.1
            this.midLevel = 0.1
            this.trebleLevel = 0.1
            this.beatDetected = false
        }
    }

    /**
     * Register material for automatic fade handling
     */
    registerMaterial(material) {
        if (!this.materials.includes(material)) {
            this.materials.push(material)
        }
    }

    /**
     * Register multiple materials
     */
    registerMaterials(materials) {
        materials.forEach(material => this.registerMaterial(material))
    }

    /**
     * Create a standardized particle system
     */
    createParticleSystem(config) {
        const {
            count = 1000,
            geometry = new THREE.SphereGeometry(0.05, 8, 8),
            material = new THREE.MeshBasicMaterial({ color: 0xffffff }),
            spread = 10
        } = config

        const particles = []

        for (let i = 0; i < count; i++) {
            const particle = new THREE.Mesh(geometry, material.clone())

            // Position within act bounds or spread
            particle.position.set(
                (Math.random() - 0.5) * spread,
                (Math.random() - 0.5) * spread,
                (Math.random() - 0.5) * spread
            )

            this.group.add(particle)
            particles.push(particle)
            this.registerMaterial(particle.material)
        }

        this.particles.push(...particles)
        return particles
    }

    /**
     * Get bounds relative to world space
     */
    getWorldBounds() {
        if (!this.bounds) return null

        return {
            min: this.bounds.min.clone().add(this.actPosition),
            max: this.bounds.max.clone().add(this.actPosition)
        }
    }

    /**
     * Check if point is within act bounds
     */
    containsPoint(point) {
        const worldBounds = this.getWorldBounds()
        if (!worldBounds) return false

        return (point.x >= worldBounds.min.x && point.x <= worldBounds.max.x &&
            point.y >= worldBounds.min.y && point.y <= worldBounds.max.y &&
            point.z >= worldBounds.min.z && point.z <= worldBounds.max.z)
    }

    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            actNumber: this.actNumber,
            isActive: this.isActive,
            isInitialized: this.isInitialized,
            transitionState: this.transitionState,
            fadeValue: this.fadeValue,
            position: this.actPosition.toArray(),
            audioLevel: this.audioLevel,
            particleCount: this.particles.length,
            materialCount: this.materials.length
        }
    }

    // Virtual methods - override in child classes

    /**
     * Called during prepareEntry()
     */
    onPrepareEntry() {
        // Override in child classes
    }

    /**
     * Called during startEntry()
     */
    onStartEntry() {
        // Override in child classes
    }

    /**
     * Called during enter()
     */
    onEnter() {
        // Override in child classes
    }

    /**
     * Called during startExit()
     */
    onStartExit() {
        // Override in child classes
    }

    /**
     * Called during finishExit()
     */
    onFinishExit() {
        // Override in child classes
    }

    /**
     * Called during exit()
     */
    onExit() {
        // Override in child classes
    }

    /**
     * Called during updateTransition()
     */
    onUpdateTransition(progress, direction) {
        // Override in child classes
    }

    /**
     * Called during main update when active
     */
    updateContent(time) {
        // Override in child classes
    }

    /**
     * Called every frame for time-critical updates
     */
    updateTimeCritical(time) {
        // Override in child classes
    }

    /**
     * Called during background updates when inactive
     */
    updateBackgroundContent(time) {
        // Override in child classes
    }

    /**
     * Cleanup resources
     */
    dispose() {
        // Dispose of geometries and materials
        this.particles.forEach(particle => {
            if (particle.geometry) particle.geometry.dispose()
            if (particle.material) particle.material.dispose()
        })

        this.materials.forEach(material => {
            material.dispose()
        })

        // Remove from scene
        this.scene.remove(this.group)

        // Clear arrays
        this.particles.length = 0
        this.meshes.length = 0
        this.lines.length = 0
        this.materials.length = 0

        console.log(`🎭 Act ${this.actNumber} disposed`)
    }
}
