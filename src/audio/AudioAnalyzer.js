export class AudioAnalyzer {
  constructor() {
    this.audioContext = null
    this.microphone = null
    this.analyser = null
    this.dataArray = null
    this.bufferLength = 0
    
    this.isEnabled = false
    this.isMicrophoneConnected = false
    
    // Audio data
    this.volume = 0
    this.averageFrequency = 0
    this.lowFreq = 0
    this.midFreq = 0
    this.highFreq = 0
    this.beat = false
    
    // Beat detection
    this.beatThreshold = 0.3
    this.beatCooldown = 0
    this.lastBeatTime = 0
    this.beatHistory = []
    
    // Smoothing
    this.smoothingFactor = 0.8
    this.volumeHistory = []
    this.historySize = 10
  }

  async init() {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      // Setup analyser
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 512
      this.analyser.smoothingTimeConstant = 0.8
      this.bufferLength = this.analyser.frequencyBinCount
      this.dataArray = new Uint8Array(this.bufferLength)
      
      console.log('🎤 Audio analyzer initialized')
      return true
    } catch (error) {
      console.warn('Audio initialization failed:', error)
      return false
    }
  }

  async requestMicrophone() {
    if (this.isMicrophoneConnected) {
      return true
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      })
      
      this.microphone = this.audioContext.createMediaStreamSource(stream)
      this.microphone.connect(this.analyser)
      
      this.isMicrophoneConnected = true
      this.isEnabled = true
      
      console.log('🎤 Microphone connected')
      return true
    } catch (error) {
      console.warn('Microphone access denied:', error)
      this.startSilentMode()
      return false
    }
  }

  startSilentMode() {
    // Create a silent oscillator for demo purposes
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
    oscillator.connect(gainNode)
    gainNode.connect(this.analyser)
    
    oscillator.start()
    this.isEnabled = true
    
    console.log('🔇 Running in silent mode (no microphone)')
  }

  async toggleMicrophone() {
    if (this.isMicrophoneConnected) {
      this.isEnabled = !this.isEnabled
      console.log(`🎤 Microphone ${this.isEnabled ? 'enabled' : 'disabled'}`)
    } else {
      await this.requestMicrophone()
    }
  }

  update() {
    if (!this.isEnabled || !this.analyser) {
      this.generateFallbackData()
      return
    }

    // Get frequency data
    this.analyser.getByteFrequencyData(this.dataArray)
    
    // Calculate overall volume (RMS)
    let sum = 0
    for (let i = 0; i < this.bufferLength; i++) {
      sum += this.dataArray[i] * this.dataArray[i]
    }
    const rawVolume = Math.sqrt(sum / this.bufferLength) / 255

    // Smooth volume
    this.volumeHistory.push(rawVolume)
    if (this.volumeHistory.length > this.historySize) {
      this.volumeHistory.shift()
    }
    this.volume = this.volumeHistory.reduce((a, b) => a + b, 0) / this.volumeHistory.length

    // Calculate frequency bands
    const lowEnd = Math.floor(this.bufferLength * 0.1)
    const midEnd = Math.floor(this.bufferLength * 0.5)
    
    this.lowFreq = this.getAverageFrequency(0, lowEnd)
    this.midFreq = this.getAverageFrequency(lowEnd, midEnd)
    this.highFreq = this.getAverageFrequency(midEnd, this.bufferLength)
    
    this.averageFrequency = (this.lowFreq + this.midFreq + this.highFreq) / 3

    // Beat detection
    this.detectBeat()
  }

  getAverageFrequency(startIndex, endIndex) {
    let sum = 0
    const count = endIndex - startIndex
    
    for (let i = startIndex; i < endIndex; i++) {
      sum += this.dataArray[i]
    }
    
    return (sum / count) / 255
  }

  detectBeat() {
    const currentTime = Date.now()
    
    // Cooldown period
    if (currentTime - this.lastBeatTime < 100) {
      this.beat = false
      return
    }

    // Simple beat detection based on volume spike
    const volumeSpike = this.volume > this.beatThreshold
    const lowFreqSpike = this.lowFreq > this.beatThreshold * 1.2
    
    if (volumeSpike && lowFreqSpike) {
      this.beat = true
      this.lastBeatTime = currentTime
      this.beatHistory.push(currentTime)
      
      // Keep only recent beats
      this.beatHistory = this.beatHistory.filter(time => currentTime - time < 2000)
    } else {
      this.beat = false
    }
  }

  generateFallbackData() {
    // Generate subtle ambient data for when no microphone is available
    const time = Date.now() * 0.001
    
    this.volume = 0.1 + Math.sin(time * 0.5) * 0.05
    this.lowFreq = 0.2 + Math.sin(time * 0.3) * 0.1
    this.midFreq = 0.15 + Math.sin(time * 0.7) * 0.08
    this.highFreq = 0.1 + Math.sin(time * 1.2) * 0.06
    this.averageFrequency = (this.lowFreq + this.midFreq + this.highFreq) / 3
    
    // Occasional "beats"
    this.beat = Math.random() < 0.01
  }

  // Getters for easy access
  getVolume() { return this.volume }
  getAverageFrequency() { return this.averageFrequency }
  getLowFreq() { return this.lowFreq }
  getMidFreq() { return this.midFreq }
  getHighFreq() { return this.highFreq }
  getBeat() { return this.beat }
  
  // Get normalized values for visual effects
  getVolumeNormalized(min = 0, max = 1) {
    return min + this.volume * (max - min)
  }
  
  getFrequencyNormalized(type = 'average', min = 0, max = 1) {
    let freq = this.averageFrequency
    switch(type) {
      case 'low': freq = this.lowFreq; break
      case 'mid': freq = this.midFreq; break
      case 'high': freq = this.highFreq; break
    }
    return min + freq * (max - min)
  }
}
