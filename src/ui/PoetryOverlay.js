export class PoetryOverlay {
    constructor() {
        this.overlay = null
        this.currentLineIndex = 0
        this.isVisible = false
        this.animationInterval = null

        // The poem lines for Act 3
        this.poemLines = [
            "I saw you, at least I think I did, see you,",
            "beneath your skin and bones",
            "the hunger, the thirst,",
            "I did not feel it at first.",
            "Maybe it could be our souls",
            "",
            "River of life runnin in our veins,",
            "drummin the here and now",
            "I'm longing for somthin that can sustain,",
            "to eat, to drink, somehow",
            "",
            "I traveled far, was searchin wide,",
            "lookin for that door",
            "until I saw a glimpse of you",
            "when we started walking into",
            "",
            "the wider, deeper, wonder",
            "Beneath our skin and bones"
        ]

        this.displayDuration = 3000 // 3 seconds per line
        this.fadeDuration = 1000    // 1 second fade
    }

    init() {
        this.overlay = document.getElementById('poetryOverlay')
        if (!this.overlay) {
            console.warn('Poetry overlay element not found')
            return
        }

        console.log('📝 Poetry overlay initialized')
    }

    show() {
        if (!this.overlay || this.isVisible) return

        this.isVisible = true
        this.currentLineIndex = 0
        this.startPoetrySequence()

        console.log('📖 Starting poetry sequence')
    }

    hide() {
        if (!this.overlay || !this.isVisible) return

        this.isVisible = false
        this.stopPoetrySequence()
        this.fadeOut()
    }

    startPoetrySequence() {
        if (!this.isVisible) return

        this.showNextLine()

        // Set interval to show next line
        this.animationInterval = setInterval(() => {
            if (!this.isVisible) {
                this.stopPoetrySequence()
                return
            }

            this.currentLineIndex++

            if (this.currentLineIndex >= this.poemLines.length) {
                // Restart from beginning
                this.currentLineIndex = 0
            }

            this.showNextLine()
        }, this.displayDuration + this.fadeDuration)
    }

    stopPoetrySequence() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval)
            this.animationInterval = null
        }
    }

    showNextLine() {
        if (!this.overlay) return

        const line = this.poemLines[this.currentLineIndex]

        // Fade out current content
        this.overlay.classList.remove('visible')

        setTimeout(() => {
            // Update text
            this.overlay.textContent = line

            // Fade in new content
            if (line.trim() !== '') {
                this.overlay.classList.add('visible')
            }
        }, this.fadeDuration / 2)
    }

    fadeOut() {
        if (this.overlay) {
            this.overlay.classList.remove('visible')
        }
    }

    // Method to show specific line (for manual control)
    showLine(lineIndex) {
        if (!this.overlay || lineIndex < 0 || lineIndex >= this.poemLines.length) return

        this.currentLineIndex = lineIndex
        this.overlay.textContent = this.poemLines[lineIndex]

        if (this.poemLines[lineIndex].trim() !== '') {
            this.overlay.classList.add('visible')
        } else {
            this.overlay.classList.remove('visible')
        }
    }

    // Method to trigger poetry based on audio events
    triggerOnBeat(audioAnalyzer) {
        if (!this.isVisible || !audioAnalyzer.getBeat()) return

        // Randomly advance to next line on strong beats
        if (Math.random() < 0.3) {
            this.currentLineIndex = (this.currentLineIndex + 1) % this.poemLines.length
            this.showNextLine()
        }
    }

    // Method to sync with audio analysis
    updateWithAudio(audioAnalyzer) {
        if (!this.isVisible || !this.overlay) return

        // Subtle effects based on audio
        const volume = audioAnalyzer.getVolume()
        const midFreq = audioAnalyzer.getMidFreq()

        // Text glow effect based on volume
        const glowIntensity = volume * 10 + 2
        this.overlay.style.textShadow = `
      0 0 ${glowIntensity}px rgba(255, 255, 255, ${volume * 0.5}),
      2px 2px 4px rgba(0, 0, 0, 0.8)
    `

        // Subtle text scaling on mid frequencies
        const scale = 1 + midFreq * 0.1
        this.overlay.style.transform = `translate(-50%, -50%) scale(${scale})`

        // Color shift based on frequency
        const hue = midFreq * 60 // 0-60 degrees (red to yellow)
        this.overlay.style.color = `hsl(${hue}, 70%, 90%)`
    }
}
