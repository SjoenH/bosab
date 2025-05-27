/**
 * Camera Controller for "beneath our skin and bones"
 * 
 * Handles smooth camera transitions between acts with configurable easing
 * and look-at behavior for seamless navigation through the performance space.
 */

import * as THREE from 'three'
import { LAYOUT_CONFIG, LayoutHelper } from '../config/LayoutConfig.js'

export class CameraController {
    constructor(camera) {
        this.camera = camera

        // Transition state
        this.isTransitioning = false
        this.transitionStartTime = 0
        this.transitionDuration = LAYOUT_CONFIG.camera.transitionDuration
        this.transitionProgress = 0

        // Camera positions and targets
        this.startPosition = new THREE.Vector3()
        this.targetPosition = new THREE.Vector3()
        this.startLookAt = new THREE.Vector3()
        this.targetLookAt = new THREE.Vector3()

        // Current camera state
        this.currentAct = 1
        this.currentLookAt = new THREE.Vector3(0, 0, 0)

        // Easing functions
        this.easingFunctions = {
            linear: (t) => t,
            easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
            easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
            easeOutBack: (t) => {
                const c1 = 1.70158
                const c3 = c1 + 1
                return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
            }
        }

        // Callback for transition events
        this.onTransitionStart = null
        this.onTransitionComplete = null
        this.onTransitionUpdate = null

        console.log('📷 Camera controller initialized')
    }

    /**
     * Initialize camera to first act position
     */
    init() {
        this.moveToActImmediate(1)
        console.log('📷 Camera positioned at Act 1')
    }

    /**
     * Move camera to act immediately (no transition)
     */
    moveToActImmediate(actNumber) {
        const position = LayoutHelper.getCameraPosition(actNumber)
        const lookAt = LayoutHelper.getCameraLookAt(actNumber)

        this.camera.position.copy(position)
        this.camera.lookAt(lookAt)
        this.currentLookAt.copy(lookAt)
        this.currentAct = actNumber

        console.log(`📷 Camera moved to Act ${actNumber} immediately`)
    }

    /**
     * Start smooth transition to target act
     */
    transitionToAct(actNumber, duration = null) {
        if (this.isTransitioning) {
            console.warn('📷 Camera transition already in progress')
            return false
        }

        if (actNumber === this.currentAct) {
            console.log(`📷 Already at Act ${actNumber}`)
            return false
        }

        // Set transition duration
        this.transitionDuration = duration || LAYOUT_CONFIG.camera.transitionDuration

        // Store starting state
        this.startPosition.copy(this.camera.position)
        this.startLookAt.copy(this.currentLookAt)

        // Set target state
        this.targetPosition.copy(LayoutHelper.getCameraPosition(actNumber))
        this.targetLookAt.copy(LayoutHelper.getCameraLookAt(actNumber))

        // Initialize transition
        this.isTransitioning = true
        this.transitionStartTime = performance.now()
        this.transitionProgress = 0
        this.currentAct = actNumber

        // Trigger callback
        if (this.onTransitionStart) {
            this.onTransitionStart(actNumber)
        }

        console.log(`📷 Starting camera transition to Act ${actNumber} (${this.transitionDuration}ms)`)
        return true
    }

    /**
     * Update camera position during transition
     */
    update(time) {
        if (!this.isTransitioning) {
            return
        }

        // Calculate transition progress
        const elapsed = time - this.transitionStartTime
        const rawProgress = Math.min(elapsed / this.transitionDuration, 1)

        // Apply easing
        const easingName = LAYOUT_CONFIG.camera.easing
        const easingFunction = this.easingFunctions[easingName] || this.easingFunctions.easeInOutCubic
        this.transitionProgress = easingFunction(rawProgress)

        // Interpolate camera position
        this.camera.position.lerpVectors(this.startPosition, this.targetPosition, this.transitionProgress)

        // Interpolate look-at target
        if (LAYOUT_CONFIG.camera.smoothLookAt) {
            this.currentLookAt.lerpVectors(this.startLookAt, this.targetLookAt, this.transitionProgress)
            this.camera.lookAt(this.currentLookAt)
        } else {
            // Snap to target look-at partway through transition
            if (this.transitionProgress > 0.5) {
                this.camera.lookAt(this.targetLookAt)
                this.currentLookAt.copy(this.targetLookAt)
            }
        }

        // Trigger update callback
        if (this.onTransitionUpdate) {
            this.onTransitionUpdate(this.transitionProgress, this.currentAct)
        }

        // Check if transition is complete
        if (rawProgress >= 1) {
            this.completeTransition()
        }
    }

    /**
     * Complete the current transition
     */
    completeTransition() {
        if (!this.isTransitioning) return

        // Ensure final position is exact
        this.camera.position.copy(this.targetPosition)
        this.camera.lookAt(this.targetLookAt)
        this.currentLookAt.copy(this.targetLookAt)

        // Reset transition state
        this.isTransitioning = false
        this.transitionProgress = 0

        // Trigger callback
        if (this.onTransitionComplete) {
            this.onTransitionComplete(this.currentAct)
        }

        console.log(`📷 Camera transition to Act ${this.currentAct} completed`)
    }

    /**
     * Force stop current transition
     */
    stopTransition() {
        if (this.isTransitioning) {
            this.isTransitioning = false
            this.transitionProgress = 0
            console.log('📷 Camera transition stopped')
        }
    }

    /**
     * Get current camera state
     */
    getCurrentState() {
        return {
            act: this.currentAct,
            position: this.camera.position.clone(),
            lookAt: this.currentLookAt.clone(),
            isTransitioning: this.isTransitioning,
            transitionProgress: this.transitionProgress
        }
    }

    /**
     * Set custom camera position and look-at (for manual control)
     */
    setCustomPosition(position, lookAt = null) {
        if (this.isTransitioning) {
            this.stopTransition()
        }

        this.camera.position.copy(position)
        if (lookAt) {
            this.camera.lookAt(lookAt)
            this.currentLookAt.copy(lookAt)
        }
    }

    /**
     * Get suggested camera positions for overview/debug
     */
    getOverviewPosition() {
        // Calculate center point of all acts
        const center = new THREE.Vector3()
        let count = 0

        for (let i = 1; i <= 4; i++) {
            const pos = LayoutHelper.getActPosition(i)
            center.add(pos)
            count++
        }

        center.divideScalar(count)

        // Position camera high and back to see all acts
        const overviewPosition = center.clone()
        overviewPosition.y += 30
        overviewPosition.z += 50

        return {
            position: overviewPosition,
            lookAt: center
        }
    }

    /**
     * Transition to overview position
     */
    transitionToOverview(duration = null) {
        const overview = this.getOverviewPosition()

        // Store starting state
        this.startPosition.copy(this.camera.position)
        this.startLookAt.copy(this.currentLookAt)

        // Set target state
        this.targetPosition.copy(overview.position)
        this.targetLookAt.copy(overview.lookAt)

        // Set transition duration
        this.transitionDuration = duration || LAYOUT_CONFIG.camera.transitionDuration * 1.5

        // Initialize transition
        this.isTransitioning = true
        this.transitionStartTime = performance.now()
        this.transitionProgress = 0
        this.currentAct = 0 // Special value for overview

        console.log('📷 Transitioning to overview position')
    }

    /**
     * Calculate optimal camera distance for act
     */
    calculateOptimalDistance(actNumber) {
        const bounds = LayoutHelper.getActBounds(actNumber)
        if (!bounds) return LAYOUT_CONFIG.spacing.cameraDistance

        // Calculate bounding box dimensions
        const size = new THREE.Vector3()
        size.subVectors(bounds.max, bounds.min)

        // Use largest dimension to calculate distance
        const maxDimension = Math.max(size.x, size.y, size.z)
        const fov = this.camera.fov * Math.PI / 180
        const distance = maxDimension / (2 * Math.tan(fov / 2)) * 1.2 // 20% padding

        return Math.max(distance, LAYOUT_CONFIG.spacing.cameraDistance)
    }

    /**
     * Update layout configuration and recalculate positions
     */
    updateLayout() {
        console.log('📷 Camera controller updated for new layout')

        // If currently transitioning, restart with new target
        if (this.isTransitioning) {
            this.targetPosition.copy(LayoutHelper.getCameraPosition(this.currentAct))
            this.targetLookAt.copy(LayoutHelper.getCameraLookAt(this.currentAct))
        }
    }

    /**
     * Set easing function
     */
    setEasing(easingName) {
        if (this.easingFunctions[easingName]) {
            LAYOUT_CONFIG.camera.easing = easingName
            console.log(`📷 Camera easing set to ${easingName}`)
        } else {
            console.warn(`📷 Unknown easing function: ${easingName}`)
        }
    }

    /**
     * Cleanup
     */
    dispose() {
        this.stopTransition()
        this.onTransitionStart = null
        this.onTransitionComplete = null
        this.onTransitionUpdate = null
    }
}
