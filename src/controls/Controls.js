export class Controls {
    constructor(app) {
        this.app = app
        this.playButton = null
        this.actIndicator = null
        this.micStatus = null
        this.volumeLevel = null
        this.lowLevel = null
        this.midLevel = null
        this.highLevel = null
        this.beatIndicator = null
        this.isInitialized = false
    }

    init() {
        this.playButton = document.getElementById('playButton')
        this.actIndicator = document.getElementById('actIndicator')
        this.micStatus = document.getElementById('micStatus')
        this.volumeLevel = document.getElementById('volumeLevel')
        this.lowLevel = document.getElementById('lowLevel')
        this.midLevel = document.getElementById('midLevel')
        this.highLevel = document.getElementById('highLevel')
        this.beatIndicator = document.getElementById('beatIndicator')

        if (!this.playButton || !this.actIndicator) {
            console.warn('Control elements not found')
            return
        }

        this.setupPlayButton()
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
}
