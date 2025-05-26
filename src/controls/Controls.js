export class Controls {
  constructor(app) {
    this.app = app
    this.playButton = null
    this.actIndicator = null
    this.isInitialized = false
  }

  init() {
    this.playButton = document.getElementById('playButton')
    this.actIndicator = document.getElementById('actIndicator')
    
    if (!this.playButton || !this.actIndicator) {
      console.warn('Control elements not found')
      return
    }

    this.setupPlayButton()
    this.updateActIndicator(1)
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
        await this.app.audioAnalyzer.requestMicrophone()
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
}
