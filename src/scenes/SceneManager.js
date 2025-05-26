import { Act1Matrix } from './Act1Matrix.js'
import { Act2Desert } from './Act2Desert.js'
import { Act3Human } from './Act3Human.js'
import { Act4Stars } from './Act4Stars.js'

export class SceneManager {
    constructor(scene, camera, audioAnalyzer) {
        this.scene = scene
        this.camera = camera
        this.audioAnalyzer = audioAnalyzer

        this.acts = {}
        this.currentAct = null
        this.currentActNumber = 1
        this.transitionProgress = 0
        this.isTransitioning = false
        this.transitionDuration = 3000 // 3 seconds
        this.transitionStartTime = 0

        // Transition state management
        this.previousAct = null
        this.nextAct = null
        this.transitionPhase = 'idle' // 'fade-out', 'fade-in', 'idle'

        // Demo mode configuration
        this.demoMode = false
        this.autoProgress = false
        this.actProgressTimer = 0
        this.demoActDuration = 5000 // 5 seconds per act in demo
        this.demoTransitionDuration = 500 // 0.5 seconds transitions in demo
    }

    init() {
        // Initialize all acts
        this.acts[1] = new Act1Matrix(this.scene, this.camera, this.audioAnalyzer)
        this.acts[2] = new Act2Desert(this.scene, this.camera, this.audioAnalyzer)
        this.acts[3] = new Act3Human(this.scene, this.camera, this.audioAnalyzer)
        this.acts[4] = new Act4Stars(this.scene, this.camera, this.audioAnalyzer)

        // Initialize each act
        Object.values(this.acts).forEach(act => act.init())

        // Start with Act 1
        this.currentAct = this.acts[1]
        this.currentAct.enter()
        this.actProgressTimer = performance.now()

        console.log('🎭 Scene manager initialized with 4 acts')
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

        // Start transition - fade out current act first
        this.isTransitioning = true
        this.transitionStartTime = performance.now()
        this.transitionProgress = 0
        this.transitionPhase = 'fade-out'

        // Store transition state
        this.previousAct = this.currentAct
        this.nextAct = newAct

        // Hide new act initially
        if (this.nextAct) {
            this.nextAct.group.visible = false
        }

        console.log(`🔄 Transitioning from Act ${this.currentActNumber} to Act ${actNumber}${this.demoMode ? ' (DEMO)' : ''}`)
    }

    update(time) {
        // Handle transition
        if (this.isTransitioning) {
            this.updateTransition(time)
        }

        // Handle auto-progression in demo mode
        if (this.autoProgress && !this.isTransitioning) {
            this.updateAutoProgress(time)
        }

        // Update current act
        if (this.currentAct) {
            this.currentAct.update(time)
        }

        // Update all acts (some may need to run in background)
        Object.values(this.acts).forEach(act => {
            if (act !== this.currentAct) {
                act.updateBackground(time)
            }
        })
    }

    updateTransition(time) {
        const duration = this.demoMode ? this.demoTransitionDuration : this.transitionDuration
        const elapsed = time - this.transitionStartTime
        this.transitionProgress = Math.min(elapsed / duration, 1)

        if (this.transitionPhase === 'fade-out') {
            // First half: fade out current act
            if (this.transitionProgress >= 0.5) {
                // Switch to fade-in phase
                this.transitionPhase = 'fade-in'
                
                // Exit current act and enter new act at midpoint
                if (this.previousAct) {
                    this.previousAct.exit()
                }
                
                if (this.nextAct) {
                    this.nextAct.enter()
                    this.currentAct = this.nextAct
                    this.currentActNumber = this.getActNumber(this.nextAct)
                }
                
                // Reset auto-progress timer
                this.actProgressTimer = time
            }
        }

        // Apply transition effects
        this.applyTransitionEffects()

        // End transition
        if (this.transitionProgress >= 1) {
            this.isTransitioning = false
            this.transitionProgress = 0
            this.transitionPhase = 'idle'
            this.previousAct = null
            this.nextAct = null
        }
    }

    applyTransitionEffects() {
        let fadeValue = 1.0

        if (this.transitionPhase === 'fade-out') {
            // Fade out: 1.0 -> 0.0 during first half
            const fadeOutProgress = Math.min(this.transitionProgress * 2, 1)
            fadeValue = 1.0 - fadeOutProgress
        } else if (this.transitionPhase === 'fade-in') {
            // Fade in: 0.0 -> 1.0 during second half
            const fadeInProgress = Math.max((this.transitionProgress - 0.5) * 2, 0)
            fadeValue = fadeInProgress
        }

        // Apply fade only to the current active act
        const actToFade = this.transitionPhase === 'fade-out' ? this.previousAct : this.currentAct
        if (actToFade && actToFade.group) {
            this.applyFadeToGroup(actToFade.group, fadeValue)
        }
    }

    applyFadeToGroup(group, fadeValue) {
        group.traverse((child) => {
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => {
                        this.applyFadeToMaterial(material, fadeValue)
                    })
                } else {
                    this.applyFadeToMaterial(child.material, fadeValue)
                }
            }
        })
    }

    applyFadeToMaterial(material, fadeValue) {
        if (material.uniforms && material.uniforms.opacity) {
            material.uniforms.opacity.value = fadeValue
        } else if (material.opacity !== undefined) {
            material.opacity = fadeValue
            material.transparent = fadeValue < 1
        }
    }

    getTransitionFade() {
        // Smooth fade curve
        const t = this.transitionProgress
        return 0.5 + 0.5 * Math.cos(Math.PI * t)
    }

    getActNumber(act) {
        // Helper method to get act number from act instance
        for (const [number, actInstance] of Object.entries(this.acts)) {
            if (actInstance === act) {
                return parseInt(number)
            }
        }
        return 1 // fallback
    }

    getCurrentAct() {
        return this.currentAct
    }

    getCurrentActNumber() {
        return this.currentActNumber
    }

    getTransitionProgress() {
        return this.transitionProgress
    }

    isInTransition() {
        return this.isTransitioning
    }

    updateAutoProgress(time) {
        const duration = this.demoMode ? this.demoActDuration : 6.25 * 60 * 1000 // 6.25 minutes for performance
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
        Object.values(this.acts).forEach(act => {
            if (act.dispose) {
                act.dispose()
            }
        })
    }
}
