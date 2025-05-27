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

        // Timing configuration
        this.timingConfig = {
            actDuration: 6.25 * 60 * 1000, // 6.25 minutes in milliseconds
            transitionDuration: 10 * 1000, // 10 seconds in milliseconds
            demoActDuration: 30 * 1000, // 30 seconds in milliseconds
            demoTransitionDuration: 10 * 1000 // 10 seconds in milliseconds
        }

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

        // Automatically request microphone access
        await this.audioAnalyzer.requestMicrophone()
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
            switch (event.code) {
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
                    this.toggleMicrophone()
                    break
                case 'KeyF':
                    event.preventDefault()
                    this.toggleFullscreen()
                    break
                case 'KeyP':
                    event.preventDefault()
                    this.togglePerformanceMode()
                    break
                case 'KeyD':
                    event.preventDefault()
                    this.toggleDemoMode()
                    break
                case 'KeyQ':
                    event.preventDefault()
                    this.startQuickDemo()
                    break
                case 'KeyS':
                    event.preventDefault()
                    this.stopDemo()
                    break
                case 'Digit1':
                    event.preventDefault()
                    this.transitionToAct(1)
                    break
                case 'Digit2':
                    event.preventDefault()
                    this.transitionToAct(2)
                    break
                case 'Digit3':
                    event.preventDefault()
                    this.transitionToAct(3)
                    break
                case 'Digit4':
                    event.preventDefault()
                    this.transitionToAct(4)
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

        // Update controls with microphone status and audio levels
        this.controls.update(this.audioAnalyzer)

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
        const duration = this.sceneManager.demoMode ? this.timingConfig.demoActDuration : this.timingConfig.actDuration

        if (elapsed >= duration && this.currentAct < 4) {
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
        this.currentAct = actNumber
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

    // Demo mode methods
    toggleDemoMode() {
        const isDemo = !this.sceneManager.demoMode
        this.sceneManager.enableDemoMode(isDemo)
        this.controls.showDemoMessage(isDemo ? 'Demo mode enabled - faster transitions' : 'Demo mode disabled')
    }

    startQuickDemo() {
        this.sceneManager.startQuickDemo()
        this.controls.showDemoMessage('Quick demo started - cycling through all acts')
    }

    stopDemo() {
        this.sceneManager.stopDemo()
        this.controls.showDemoMessage('Demo stopped')
    }

    async toggleMicrophone() {
        const wasConnected = this.audioAnalyzer.isMicrophoneConnected
        await this.audioAnalyzer.toggleMicrophone()

        // Show status after toggle
        if (!wasConnected && this.audioAnalyzer.isMicrophoneConnected) {
            this.controls.showMicrophoneStatus(true)
        } else if (!this.audioAnalyzer.isEnabled) {
            this.controls.showMessage('Microphone disabled 🔇', 2000)
        } else if (this.audioAnalyzer.isEnabled && !wasConnected) {
            this.controls.showMessage('Microphone enabled 🎤', 2000)
        }
    }

    setTimingConfig(config) {
        // Update timing configuration
        this.timingConfig = { ...this.timingConfig, ...config }

        // Update actDuration for backward compatibility
        this.actDuration = this.timingConfig.actDuration

        // Apply timing to scene manager
        if (this.sceneManager) {
            this.sceneManager.setTimingConfig({
                transitionDuration: this.timingConfig.transitionDuration,
                demoActDuration: this.timingConfig.demoActDuration,
                demoTransitionDuration: this.timingConfig.demoTransitionDuration,
                performanceActDuration: this.timingConfig.actDuration
            })
        }

        console.log('⏱️ Timing configuration updated:', {
            actDuration: `${this.timingConfig.actDuration / 60000}min`,
            transitionDuration: `${this.timingConfig.transitionDuration / 1000}s`,
            demoActDuration: `${this.timingConfig.demoActDuration / 1000}s`,
            demoTransitionDuration: `${this.timingConfig.demoTransitionDuration / 1000}s`
        })
    }

    getTimingConfig() {
        return { ...this.timingConfig }
    }
}
