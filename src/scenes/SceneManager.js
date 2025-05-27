import { Act1Matrix } from './Act1Matrix.js'
import { Act2Desert } from './Act2Desert.js'
import { Act3Human } from './Act3Human.js'
import { Act4Stars } from './Act4Stars.js'
import { CameraController } from '../controls/CameraController.js'
import { LAYOUT_CONFIG, LayoutHelper } from '../config/LayoutConfig.js'

export class SceneManager {
    constructor(scene, camera, audioAnalyzer) {
        this.scene = scene
        this.camera = camera
        this.audioAnalyzer = audioAnalyzer

        // Camera controller for smooth navigation
        this.cameraController = new CameraController(camera)

        this.acts = {}
        this.currentAct = null
        this.currentActNumber = 1
        this.transitionProgress = 0
        this.isTransitioning = false
        this.transitionDuration = LAYOUT_CONFIG.camera.transitionDuration
        this.transitionStartTime = 0

        // Transition state management
        this.previousAct = null
        this.nextAct = null
        this.transitionPhase = 'idle' // 'preparing', 'camera-moving', 'content-transitioning', 'complete'

        // Navigation mode
        this.navigationMode = 'camera' // 'camera' or 'fade'
        this.allowOverlap = false // Camera navigation doesn't need overlap

        // Demo mode configuration
        this.demoMode = false
        this.autoProgress = false
        this.actProgressTimer = 0

        // Configurable timing values
        this.performanceActDuration = 6.25 * 60 * 1000 // 6.25 minutes for performance
        this.demoActDuration = 5000 // 5 seconds per act in demo
        this.demoTransitionDuration = 3000 // 3 seconds transitions in demo

        // Camera controller callbacks
        this.setupCameraCallbacks()

        console.log('🎭 SceneManager initialized with camera navigation')
    }

    /**
     * Setup camera controller callbacks
     */
    setupCameraCallbacks() {
        this.cameraController.onTransitionStart = (actNumber) => {
            console.log(`🎭 Camera transition started to Act ${actNumber}`)
        }

        this.cameraController.onTransitionComplete = (actNumber) => {
            console.log(`🎭 Camera transition completed to Act ${actNumber}`)
            if (this.isTransitioning) {
                this.completeActTransition()
            }
        }

        this.cameraController.onTransitionUpdate = (progress, actNumber) => {
            // Update any UI elements that track transition progress
            this.transitionProgress = progress
        }
    }

    init() {
        // Validate layout configuration
        LayoutHelper.validateLayout()

        // Initialize camera controller
        this.cameraController.init()

        // Initialize all acts with their positions
        this.acts[1] = new Act1Matrix(this.scene, this.camera, this.audioAnalyzer, 1)
        this.acts[2] = new Act2Desert(this.scene, this.camera, this.audioAnalyzer, 2)
        this.acts[3] = new Act3Human(this.scene, this.camera, this.audioAnalyzer, 3)
        this.acts[4] = new Act4Stars(this.scene, this.camera, this.audioAnalyzer, 4)

        // Initialize each act
        Object.values(this.acts).forEach(act => act.init())

        // Start with Act 1 as current, but keep all acts visible and active
        this.currentAct = this.acts[1]

        // Enter all acts so they're all visible and running
        Object.values(this.acts).forEach(act => act.enter())

        this.actProgressTimer = performance.now()

        console.log('🎭 Scene manager initialized with 4 spatially-separated acts (all visible and active)')
    }

    transitionToAct(actNumber) {
        if (actNumber === this.currentActNumber || this.isTransitioning) {
            return
        }

        const newAct = this.acts[actNumber]
        if (!newAct) {
            console.warn(`Act ${actNumber} not found`)
            return
        }

        // Use demo transition duration if in demo mode
        const duration = this.demoMode ? this.demoTransitionDuration : this.transitionDuration

        // Start camera-based transition
        this.isTransitioning = true
        this.transitionStartTime = performance.now()
        this.transitionProgress = 0
        this.transitionPhase = 'preparing'

        // Store transition state
        this.previousAct = this.currentAct
        this.nextAct = newAct

        // Prepare next act for entry
        if (this.nextAct) {
            this.nextAct.prepareEntry()
        }

        // Start camera transition
        if (this.cameraController.transitionToAct(actNumber, duration)) {
            this.transitionPhase = 'camera-moving'
        } else {
            // Fallback if camera transition fails
            this.completeActTransition()
        }

        console.log(`🔄 Transitioning from Act ${this.currentActNumber} to Act ${actNumber} via camera movement${this.demoMode ? ' (DEMO)' : ''}`)
    }

    update(time) {
        // Update camera controller
        this.cameraController.update(time)

        // Handle auto-progression in demo mode
        if (this.autoProgress && !this.isTransitioning) {
            this.updateAutoProgress(time)
        }

        // Update ALL acts - don't pause any of them
        Object.values(this.acts).forEach(act => {
            act.update(time)
        })
    }

    /**
     * Complete the act transition (called by camera controller)
     */
    completeActTransition() {
        if (!this.isTransitioning) return

        // Complete the transition - but don't exit previous act to keep it visible
        // if (this.previousAct) {
        //     this.previousAct.exit()
        // }

        if (this.nextAct) {
            this.nextAct.enter()
            this.currentAct = this.nextAct
            this.currentActNumber = this.getActNumber(this.nextAct)
        }

        // Reset transition state
        this.isTransitioning = false
        this.transitionProgress = 1
        this.transitionPhase = 'complete'
        this.previousAct = null
        this.nextAct = null

        // Reset auto-progress timer
        this.actProgressTimer = performance.now()

        console.log(`🎭 Act transition completed - now at Act ${this.currentActNumber} (all acts remain visible)`)
    }

    getCurrentAct() {
        return this.currentAct
    }

    getCurrentActNumber() {
        return this.currentActNumber
    }

    getTransitionProgress() {
        return this.cameraController.isTransitioning ?
            this.cameraController.transitionProgress : 0
    }

    isInTransition() {
        return this.isTransitioning || this.cameraController.isTransitioning
    }

    /**
     * Get camera controller for external access
     */
    getCameraController() {
        return this.cameraController
    }

    /**
     * Switch navigation mode between camera and fade
     */
    setNavigationMode(mode) {
        if (mode === 'camera' || mode === 'fade') {
            this.navigationMode = mode
            console.log(`🎭 Navigation mode set to: ${mode}`)
        } else {
            console.warn(`Invalid navigation mode: ${mode}`)
        }
    }

    /**
     * Move camera to overview position
     */
    showOverview() {
        this.cameraController.transitionToOverview()
    }

    /**
     * Apply new layout configuration
     */
    updateLayout(layoutName = null) {
        if (layoutName) {
            LayoutHelper.applyLayout(layoutName)
        }

        // Update all acts with new positions
        Object.values(this.acts).forEach(act => {
            if (act.applyLayoutPosition) {
                act.applyLayoutPosition()
            }
        })

        // Update camera controller
        this.cameraController.updateLayout()

        console.log(`🎭 Layout updated${layoutName ? ` to ${layoutName}` : ''}`)
    }

    updateAutoProgress(time) {
        const duration = this.demoMode ? this.demoActDuration : this.performanceActDuration
        const elapsed = time - this.actProgressTimer

        if (elapsed >= duration) {
            // Auto-advance to next act
            let nextAct = this.currentActNumber + 1
            if (nextAct > 4) {
                nextAct = 1 // Loop back to Act 1
            }
            this.transitionToAct(nextAct)
        }
    }

    /**
     * Helper method to get act number from act instance
     */
    getActNumber(act) {
        for (const [number, actInstance] of Object.entries(this.acts)) {
            if (actInstance === act) {
                return parseInt(number)
            }
        }
        return 1 // fallback
    }

    // Demo mode controls
    enableDemoMode(enabled = true) {
        this.demoMode = enabled
        console.log(`🎬 Demo mode ${enabled ? 'enabled' : 'disabled'}`)
    }

    setAutoProgress(enabled = true) {
        this.autoProgress = enabled
        this.actProgressTimer = performance.now() // Reset timer
        console.log(`⏩ Auto-progress ${enabled ? 'enabled' : 'disabled'}`)
    }

    setDemoTiming(actDuration = 5000, transitionDuration = 500) {
        this.demoActDuration = actDuration
        this.demoTransitionDuration = transitionDuration
        console.log(`⏱️ Demo timing: ${actDuration}ms acts, ${transitionDuration}ms transitions`)
    }

    setTimingConfig(config) {
        if (config.transitionDuration !== undefined) {
            this.transitionDuration = config.transitionDuration
        }
        if (config.demoActDuration !== undefined) {
            this.demoActDuration = config.demoActDuration
        }
        if (config.demoTransitionDuration !== undefined) {
            this.demoTransitionDuration = config.demoTransitionDuration
        }
        if (config.performanceActDuration !== undefined) {
            this.performanceActDuration = config.performanceActDuration
        }

        console.log('⏱️ Scene manager timing updated:', {
            performanceAct: `${this.performanceActDuration / 60000}min`,
            transition: `${this.transitionDuration / 1000}s`,
            demoAct: `${this.demoActDuration / 1000}s`,
            demoTransition: `${this.demoTransitionDuration / 1000}s`
        })
    }

    // Quick cycle through all acts for testing
    startQuickDemo() {
        this.enableDemoMode(true)
        this.setDemoTiming(3000, 300) // 3 seconds per act, 0.3 second transitions
        this.setAutoProgress(true)
        console.log('🚀 Quick demo started - cycling through all acts')
    }

    stopDemo() {
        this.enableDemoMode(false)
        this.setAutoProgress(false)
        console.log('⏹️ Demo stopped')
    }

    // Cleanup method
    dispose() {
        // Dispose camera controller
        if (this.cameraController) {
            this.cameraController.dispose()
        }

        // Dispose all acts
        Object.values(this.acts).forEach(act => {
            if (act.dispose) {
                act.dispose()
            }
        })
    }
}

