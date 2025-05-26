import * as THREE from 'three'
import { AudioAnalyzer } from './audio/AudioAnalyzer.js'
import { SceneManager } from './scenes/SceneManager.js'
import { Controls } from './controls/Controls.js'
import { PoetryOverlay } from './ui/PoetryOverlay.js'

export class PerformanceApp {
  constructor() {
    this.canvas = null
    this.renderer = null
    this.scene = null
    this.camera = null
    this.audioAnalyzer = null
    this.sceneManager = null
    this.controls = null
    this.poetryOverlay = null
    
    this.isPlaying = false
    this.currentAct = 1
    this.actStartTime = 0
    this.actDuration = 6.25 * 60 * 1000 // 6.25 minutes in milliseconds
    
    // Performance optimization
    this.lastFrameTime = 0
    this.targetFPS = 60
    this.frameInterval = 1000 / this.targetFPS
  }

  async init() {
    try {
      this.showLoading(true)
      
      await this.setupThreeJS()
      await this.setupAudio()
      this.setupScenes()
      this.setupControls()
      this.setupPoetry()
      this.setupEventListeners()
      
      this.showLoading(false)
      this.animate()
      
      console.log('🌌 "beneath our skin and bones" - Performance ready')
    } catch (error) {
      console.error('Failed to initialize performance:', error)
      this.showError('Failed to initialize. Please refresh the page.')
    }
  }

  setupThreeJS() {
    // Get canvas element
    this.canvas = document.getElementById('canvas')
    if (!this.canvas) {
      throw new Error('Canvas element not found')
    }

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: window.devicePixelRatio < 2,
      alpha: false,
      powerPreference: 'high-performance'
    })
    
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x000000, 1)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    // Create scene
    this.scene = new THREE.Scene()

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    this.camera.position.z = 5

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize(), false)
  }

  async setupAudio() {
    this.audioAnalyzer = new AudioAnalyzer()
    await this.audioAnalyzer.init()
  }

  setupScenes() {
    this.sceneManager = new SceneManager(this.scene, this.camera, this.audioAnalyzer)
    this.sceneManager.init()
  }

  setupControls() {
    this.controls = new Controls(this)
    this.controls.init()
  }

  setupPoetry() {
    this.poetryOverlay = new PoetryOverlay()
    this.poetryOverlay.init()
  }

  setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', (event) => {
      switch(event.code) {
        case 'ArrowLeft':
          event.preventDefault()
          this.previousAct()
          break
        case 'ArrowRight':
          event.preventDefault()
          this.nextAct()
          break
        case 'Space':
          event.preventDefault()
          this.toggleAutoPlay()
          break
        case 'KeyM':
          event.preventDefault()
          this.audioAnalyzer.toggleMicrophone()
          break
        case 'KeyF':
          event.preventDefault()
          this.toggleFullscreen()
          break
        case 'KeyP':
          event.preventDefault()
          this.togglePerformanceMode()
          break
      }
    })

    // Prevent context menu
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault())
  }

  animate() {
    requestAnimationFrame(() => this.animate())

    const currentTime = performance.now()
    if (currentTime - this.lastFrameTime < this.frameInterval) {
      return
    }
    this.lastFrameTime = currentTime

    // Update audio analysis
    this.audioAnalyzer.update()

    // Handle auto-play progression
    if (this.isPlaying) {
      this.updateAutoPlay(currentTime)
    }

    // Update current scene
    this.sceneManager.update(currentTime)

    // Render
    this.renderer.render(this.scene, this.camera)
  }

  updateAutoPlay(currentTime) {
    const elapsed = currentTime - this.actStartTime
    if (elapsed >= this.actDuration && this.currentAct < 4) {
      this.nextAct()
    }
  }

  nextAct() {
    if (this.currentAct < 4) {
      this.currentAct++
      this.transitionToAct(this.currentAct)
    }
  }

  previousAct() {
    if (this.currentAct > 1) {
      this.currentAct--
      this.transitionToAct(this.currentAct)
    }
  }

  transitionToAct(actNumber) {
    this.actStartTime = performance.now()
    this.sceneManager.transitionToAct(actNumber)
    this.controls.updateActIndicator(actNumber)
    
    // Show poetry during Act 3
    if (actNumber === 3) {
      this.poetryOverlay.show()
    } else {
      this.poetryOverlay.hide()
    }

    console.log(`🎭 Transitioning to Act ${actNumber}`)
  }

  toggleAutoPlay() {
    this.isPlaying = !this.isPlaying
    this.controls.updatePlayButton(this.isPlaying)
    
    if (this.isPlaying) {
      this.actStartTime = performance.now()
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  togglePerformanceMode() {
    document.body.classList.toggle('performance-mode')
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  showLoading(show) {
    let loader = document.querySelector('.loading')
    if (show) {
      if (!loader) {
        loader = document.createElement('div')
        loader.className = 'loading'
        loader.textContent = 'Initializing performance...'
        document.body.appendChild(loader)
      }
    } else {
      if (loader) {
        loader.remove()
      }
    }
  }

  showError(message) {
    const errorDiv = document.createElement('div')
    errorDiv.className = 'loading'
    errorDiv.style.color = '#ff6b6b'
    errorDiv.textContent = message
    document.body.appendChild(errorDiv)
  }
}
