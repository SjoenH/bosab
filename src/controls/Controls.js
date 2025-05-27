export class Controls {
    constructor(app) {
        this.app = app
        this.playButton = null
        this.fullscreenButton = null
        this.configButton = null
        this.timingConfig = null
        this.actIndicator = null
        this.micStatus = null
        this.volumeLevel = null
        this.lowLevel = null
        this.midLevel = null
        this.highLevel = null
        this.beatIndicator = null
        this.isInitialized = false

        // Timing configuration elements
        this.actDurationInput = null
        this.transitionDurationInput = null
        this.demoActDurationInput = null
        this.demoTransitionDurationInput = null
        this.totalDurationDisplay = null
        this.demoDurationDisplay = null
    }

    init() {
        this.playButton = document.getElementById('playButton')
        this.fullscreenButton = document.getElementById('fullscreenButton')
        this.configButton = document.getElementById('configButton')
        this.timingConfig = document.getElementById('timingConfig')
        this.actIndicator = document.getElementById('actIndicator')
        this.micStatus = document.getElementById('micStatus')
        this.volumeLevel = document.getElementById('volumeLevel')
        this.lowLevel = document.getElementById('lowLevel')
        this.midLevel = document.getElementById('midLevel')
        this.highLevel = document.getElementById('highLevel')
        this.beatIndicator = document.getElementById('beatIndicator')

        // Timing configuration elements
        this.actDurationInput = document.getElementById('actDuration')
        this.transitionDurationInput = document.getElementById('transitionDuration')
        this.demoActDurationInput = document.getElementById('demoActDuration')
        this.demoTransitionDurationInput = document.getElementById('demoTransitionDuration')
        this.totalDurationDisplay = document.getElementById('totalDuration')
        this.demoDurationDisplay = document.getElementById('demoDuration')

        if (!this.playButton || !this.actIndicator) {
            console.warn('Control elements not found')
            return
        }

        this.setupPlayButton()
        this.setupFullscreenButton()
        this.setupTimingConfig()
        this.updateActIndicator(1)
        this.updateMicrophoneStatus('disconnected')
        this.isInitialized = true

        console.log('🎮 Controls initialized')
    }

    setupPlayButton() {
        this.playButton.addEventListener('click', () => {
            this.app.toggleAutoPlay()
        })

        // Request microphone access when play is first clicked
        this.playButton.addEventListener('click', async () => {
            if (!this.app.audioAnalyzer.isMicrophoneConnected) {
                const connected = await this.app.audioAnalyzer.requestMicrophone()
                this.showMicrophoneStatus(connected)
            }
        }, { once: true })
    }

    setupFullscreenButton() {
        if (!this.fullscreenButton) return

        this.fullscreenButton.addEventListener('click', () => {
            this.app.toggleFullscreen()
        })

        // Listen for fullscreen changes to update button state
        document.addEventListener('fullscreenchange', () => {
            this.updateFullscreenButton()
        })

        // Update initial state
        this.updateFullscreenButton()
    }

    updateFullscreenButton() {
        if (!this.fullscreenButton) return

        if (document.fullscreenElement) {
            this.fullscreenButton.textContent = '⛶ Exit Fullscreen'
            this.fullscreenButton.classList.add('active')
        } else {
            this.fullscreenButton.textContent = '⛶ Fullscreen'
            this.fullscreenButton.classList.remove('active')
        }
    }

    updatePlayButton(isPlaying) {
        if (!this.playButton) return

        if (isPlaying) {
            this.playButton.textContent = '⏸ Pause Auto Mode'
            this.playButton.classList.add('playing')
        } else {
            this.playButton.textContent = '▶ Play Auto Mode'
            this.playButton.classList.remove('playing')
        }
    }

    updateActIndicator(actNumber) {
        if (!this.actIndicator) return

        const actNames = {
            1: 'Act 1 - Data/Matrix',
            2: 'Act 2 - Desert/Dunes',
            3: 'Act 3 - Human/Poetic',
            4: 'Act 4 - Stars/Cosmic'
        }

        this.actIndicator.textContent = actNames[actNumber] || `Act ${actNumber}`

        // Add subtle color coding
        this.actIndicator.style.borderColor = this.getActColor(actNumber)
    }

    getActColor(actNumber) {
        const colors = {
            1: '#00ff41', // Matrix green
            2: '#d4a574', // Desert sand
            3: '#ff6b9d', // Human pink
            4: '#4dabf7'  // Cosmic blue
        }
        return colors[actNumber] || '#ffffff'
    }

    showMessage(message, duration = 3000) {
        // Create temporary message overlay
        const messageDiv = document.createElement('div')
        messageDiv.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 1000;
      font-size: 14px;
      border: 1px solid rgba(255, 255, 255, 0.3);
    `
        messageDiv.textContent = message
        document.body.appendChild(messageDiv)

        // Fade in
        messageDiv.style.opacity = '0'
        requestAnimationFrame(() => {
            messageDiv.style.transition = 'opacity 0.3s ease'
            messageDiv.style.opacity = '1'
        })

        // Remove after duration
        setTimeout(() => {
            messageDiv.style.opacity = '0'
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv)
                }
            }, 300)
        }, duration)
    }

    showMicrophoneStatus(connected) {
        const status = connected ? 'Microphone Connected 🎤' : 'Running in Silent Mode 🔇'
        this.showMessage(status, 2000)
    }

    hideControls() {
        const controls = document.getElementById('controls')
        if (controls) {
            controls.style.opacity = '0'
            controls.style.pointerEvents = 'none'
        }
    }

    showControls() {
        const controls = document.getElementById('controls')
        if (controls) {
            controls.style.opacity = '0.8'
            controls.style.pointerEvents = 'auto'
        }
    }

    showDemoMessage(message) {
        this.showMessage(`🎬 DEMO: ${message}`, 2000)
    }

    updateMicrophoneStatus(status) {
        if (!this.micStatus) return

        switch (status) {
            case 'connected':
                this.micStatus.textContent = '🎤 Live Mic'
                this.micStatus.className = 'connected'
                break
            case 'silent':
                this.micStatus.textContent = '🔇 Silent Mode'
                this.micStatus.className = 'silent'
                break
            default:
                this.micStatus.textContent = '🔇 No Mic'
                this.micStatus.className = ''
        }
    }

    updateAudioLevels(audioData) {
        // Update volume level bar
        if (this.volumeLevel) {
            const volumePercent = Math.min(audioData.volume * 100, 100)
            this.volumeLevel.style.setProperty('--level', `${volumePercent}%`)
        }

        // Update frequency level bars
        if (this.lowLevel) {
            const lowPercent = Math.min(audioData.lowFreq * 100, 100)
            this.lowLevel.style.setProperty('--level', `${lowPercent}%`)
        }

        if (this.midLevel) {
            const midPercent = Math.min(audioData.midFreq * 100, 100)
            this.midLevel.style.setProperty('--level', `${midPercent}%`)
        }

        if (this.highLevel) {
            const highPercent = Math.min(audioData.highFreq * 100, 100)
            this.highLevel.style.setProperty('--level', `${highPercent}%`)
        }

        // Update beat indicator
        if (this.beatIndicator) {
            if (audioData.beat) {
                this.beatIndicator.classList.add('beat')
            } else {
                this.beatIndicator.classList.remove('beat')
            }
        }
    }

    update(audioAnalyzer) {
        if (!this.isInitialized) return

        // Update microphone status
        if (audioAnalyzer.isMicrophoneConnected) {
            this.updateMicrophoneStatus('connected')
        } else if (audioAnalyzer.isEnabled) {
            this.updateMicrophoneStatus('silent')
        } else {
            this.updateMicrophoneStatus('disconnected')
        }

        // Update audio levels
        this.updateAudioLevels({
            volume: audioAnalyzer.getVolume(),
            lowFreq: audioAnalyzer.getLowFreq(),
            midFreq: audioAnalyzer.getMidFreq(),
            highFreq: audioAnalyzer.getHighFreq(),
            beat: audioAnalyzer.getBeat()
        })
    }

    setupTimingConfig() {
        if (!this.configButton || !this.timingConfig) {
            console.warn('Timing configuration elements not found')
            return
        }

        // Show/hide config panel
        this.configButton.addEventListener('click', () => {
            this.showTimingConfig()
        })

        // Close config panel
        const closeButton = document.getElementById('closeConfigButton')
        const resetButton = document.getElementById('resetTimingButton')

        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.hideTimingConfig()
            })
        }

        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.resetTimingDefaults()
            })
        }

        // Close on escape key
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Escape' && !this.timingConfig.classList.contains('hidden')) {
                this.hideTimingConfig()
            }
        })

        // Update displays when inputs change
        const inputs = [
            this.actDurationInput,
            this.transitionDurationInput,
            this.demoActDurationInput,
            this.demoTransitionDurationInput
        ]

        inputs.forEach(input => {
            if (input) {
                input.addEventListener('input', () => {
                    this.updateTimingDisplays()
                })
            }
        })

        // Initialize displays
        this.updateTimingDisplays()
    }

    showTimingConfig() {
        if (!this.timingConfig) return
        this.timingConfig.classList.remove('hidden')
        this.updateTimingDisplays()
    }

    hideTimingConfig() {
        if (!this.timingConfig) return
        this.timingConfig.classList.add('hidden')
        this.applyTimingSettings()
    }

    updateTimingDisplays() {
        // Update individual duration displays
        if (this.actDurationInput) {
            const actDuration = parseFloat(this.actDurationInput.value) || 6.25
            const displaySpan = this.actDurationInput.parentNode.querySelector('.duration-display')
            if (displaySpan) {
                displaySpan.textContent = `${actDuration} min`
            }
        }

        if (this.transitionDurationInput) {
            const transitionDuration = parseFloat(this.transitionDurationInput.value) || 3
            const displaySpan = this.transitionDurationInput.parentNode.querySelector('.duration-display')
            if (displaySpan) {
                displaySpan.textContent = `${transitionDuration} sec`
            }
        }

        if (this.demoActDurationInput) {
            const demoActDuration = parseFloat(this.demoActDurationInput.value) || 5
            const displaySpan = this.demoActDurationInput.parentNode.querySelector('.duration-display')
            if (displaySpan) {
                displaySpan.textContent = `${demoActDuration} sec`
            }
        }

        if (this.demoTransitionDurationInput) {
            const demoTransitionDuration = parseFloat(this.demoTransitionDurationInput.value) || 0.5
            const displaySpan = this.demoTransitionDurationInput.parentNode.querySelector('.duration-display')
            if (displaySpan) {
                displaySpan.textContent = `${demoTransitionDuration} sec`
            }
        }

        // Update total duration calculations
        this.updateTotalDurations()
    }

    updateTotalDurations() {
        const actDuration = parseFloat(this.actDurationInput?.value) || 6.25
        const transitionDuration = parseFloat(this.transitionDurationInput?.value) || 3
        const demoActDuration = parseFloat(this.demoActDurationInput?.value) || 5
        const demoTransitionDuration = parseFloat(this.demoTransitionDurationInput?.value) || 0.5

        // Calculate full show duration (4 acts + 3 transitions)
        const totalMinutes = (actDuration * 4) + ((transitionDuration / 60) * 3)

        // Calculate demo duration (4 acts + 3 transitions)
        const demoSeconds = (demoActDuration * 4) + (demoTransitionDuration * 3)

        if (this.totalDurationDisplay) {
            this.totalDurationDisplay.textContent = `${totalMinutes.toFixed(1)} minutes`
        }

        if (this.demoDurationDisplay) {
            this.demoDurationDisplay.textContent = `${demoSeconds.toFixed(1)} seconds`
        }
    }

    resetTimingDefaults() {
        if (this.actDurationInput) this.actDurationInput.value = '6.25'
        if (this.transitionDurationInput) this.transitionDurationInput.value = '3'
        if (this.demoActDurationInput) this.demoActDurationInput.value = '5'
        if (this.demoTransitionDurationInput) this.demoTransitionDurationInput.value = '0.5'

        this.updateTimingDisplays()
        this.showMessage('Timing reset to defaults')
    }

    applyTimingSettings() {
        const actDuration = parseFloat(this.actDurationInput?.value) || 6.25
        const transitionDuration = parseFloat(this.transitionDurationInput?.value) || 3
        const demoActDuration = parseFloat(this.demoActDurationInput?.value) || 5
        const demoTransitionDuration = parseFloat(this.demoTransitionDurationInput?.value) || 0.5

        // Apply settings to the performance app
        if (this.app.setTimingConfig) {
            this.app.setTimingConfig({
                actDuration: actDuration * 60 * 1000, // Convert to milliseconds
                transitionDuration: transitionDuration * 1000, // Convert to milliseconds
                demoActDuration: demoActDuration * 1000, // Convert to milliseconds
                demoTransitionDuration: demoTransitionDuration * 1000 // Convert to milliseconds
            })
        }

        this.showMessage(`Timing updated: ${actDuration}min acts, ${demoActDuration}s demo`, 2000)
    }

    getTimingConfig() {
        return {
            actDuration: parseFloat(this.actDurationInput?.value) || 6.25,
            transitionDuration: parseFloat(this.transitionDurationInput?.value) || 3,
            demoActDuration: parseFloat(this.demoActDurationInput?.value) || 5,
            demoTransitionDuration: parseFloat(this.demoTransitionDurationInput?.value) || 0.5
        }
    }
}
