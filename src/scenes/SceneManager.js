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

    // Start transition
    this.isTransitioning = true
    this.transitionStartTime = performance.now()
    this.transitionProgress = 0

    // Fade out current act
    if (this.currentAct) {
      this.currentAct.exit()
    }

    // Prepare new act
    newAct.enter()
    
    // Update references
    this.currentAct = newAct
    this.currentActNumber = actNumber

    console.log(`🔄 Transitioning to Act ${actNumber}`)
  }

  update(time) {
    // Handle transition
    if (this.isTransitioning) {
      this.updateTransition(time)
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
    const elapsed = time - this.transitionStartTime
    this.transitionProgress = Math.min(elapsed / this.transitionDuration, 1)
    
    // Apply transition effects
    this.applyTransitionEffects()
    
    // End transition
    if (this.transitionProgress >= 1) {
      this.isTransitioning = false
      this.transitionProgress = 0
    }
  }

  applyTransitionEffects() {
    // Apply fade effect based on act type
    const fadeValue = this.getTransitionFade()
    
    // Apply to all objects in scene
    this.scene.traverse((child) => {
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => {
            if (material.uniforms && material.uniforms.opacity) {
              material.uniforms.opacity.value = fadeValue
            } else if (material.opacity !== undefined) {
              material.opacity = fadeValue
              material.transparent = fadeValue < 1
            }
          })
        } else {
          if (child.material.uniforms && child.material.uniforms.opacity) {
            child.material.uniforms.opacity.value = fadeValue
          } else if (child.material.opacity !== undefined) {
            child.material.opacity = fadeValue
            child.material.transparent = fadeValue < 1
          }
        }
      }
    })
  }

  getTransitionFade() {
    // Smooth fade curve
    const t = this.transitionProgress
    return 0.5 + 0.5 * Math.cos(Math.PI * t)
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

  // Cleanup method
  dispose() {
    Object.values(this.acts).forEach(act => {
      if (act.dispose) {
        act.dispose()
      }
    })
  }
}
