import type { AudioAnalyzer } from "../audio/AudioAnalyzer";

export class PoetryOverlay {
	private overlay: HTMLElement | null = null;
	private currentLineIndex = 0;
	private isVisible = false;
	private animationInterval: ReturnType<typeof setTimeout> | null = null;

	// The poem lines for Act 3
	private poemLines: string[] = [
		"I saw you, at least I think I did see you,",
		"beneath your skin and bones",
		"the hunger, the thirst,",
		"I did not feel it at first.",
		"Maybe it could be our souls",
		"",
		"River of life running in our veins,",
		"drumming the here and now",
		"I'm longing for something that can sustain,",
		"to eat, to drink, somehow",
		"",
		"I traveled far, was searching wide,",
		"looking for that door",
		"until I saw a glimpse of you",
		"when we started walking into",
		"",
		"the wider, deeper, wonder",
		"Beneath our skin and bones",
	];

	private displayDuration = 3000; // 3 seconds per line
	private fadeDuration = 1000; // 1 second fade

	public init(): void {
		this.overlay = document.getElementById("poetryOverlay");
		if (!this.overlay) {
			console.warn("Poetry overlay element not found");
			return;
		}

		console.log("📝 Poetry overlay initialized");
	}

	public show(): void {
		if (!this.overlay || this.isVisible) return;

		this.isVisible = true;
		this.currentLineIndex = 0;
		this.startPoetrySequence();

		console.log("📖 Starting poetry sequence");
	}

	public hide(): void {
		if (!this.overlay || !this.isVisible) return;

		this.isVisible = false;
		this.stopPoetrySequence();
		this.fadeOut();
	}

	private startPoetrySequence(): void {
		if (!this.isVisible) return;

		this.showNextLine();

		// Set interval to show next line
		this.animationInterval = setInterval(() => {
			if (!this.isVisible) {
				this.stopPoetrySequence();
				return;
			}

			this.currentLineIndex++;

			if (this.currentLineIndex >= this.poemLines.length) {
				// Restart from beginning
				this.currentLineIndex = 0;
			}

			this.showNextLine();
		}, this.displayDuration + this.fadeDuration);
	}

	private stopPoetrySequence(): void {
		if (this.animationInterval) {
			clearInterval(this.animationInterval);
			this.animationInterval = null;
		}
	}

	private showNextLine(): void {
		// Early return if overlay doesn't exist
		if (!this.overlay) {
			console.warn("Poetry overlay element not found");
			return;
		}

		const line = this.poemLines[this.currentLineIndex];

		// Fade out current content
		this.overlay.classList.remove("visible");

		// Schedule text update and fade-in
		const overlay = this.overlay; // Capture reference for closure
		setTimeout(() => {
			// Check if overlay still exists when timeout fires
			if (!overlay) return;

			// Update text
			overlay.textContent = line;

			// Fade in new content if line is not empty
			if (line.trim() !== "") {
				overlay.classList.add("visible");
			}
		}, this.fadeDuration / 2);
	}

	private fadeOut(): void {
		if (!this.overlay) {
			console.warn("Poetry overlay element not found");
			return;
		}
		this.overlay.classList.remove("visible");
	}

	// Method to show specific line (for manual control)
	public showLine(lineIndex: number): void {
		// Early return if overlay doesn't exist or index is out of bounds
		if (!this.overlay || lineIndex < 0 || lineIndex >= this.poemLines.length) {
			console.warn(
				"Invalid poetry line index or overlay not found:",
				lineIndex,
			);
			return;
		}

		this.currentLineIndex = lineIndex;
		const line = this.poemLines[lineIndex];

		// Update text content
		this.overlay.textContent = line;

		// Update visibility based on line content
		if (line.trim() !== "") {
			this.overlay.classList.add("visible");
		} else {
			this.overlay.classList.remove("visible");
		}
	}

	// Method to trigger poetry based on audio events
	public triggerOnBeat(audioAnalyzer: AudioAnalyzer): void {
		if (!this.isVisible || !audioAnalyzer.getBeat()) return;

		// Randomly advance to next line on strong beats
		if (Math.random() < 0.3) {
			this.currentLineIndex =
				(this.currentLineIndex + 1) % this.poemLines.length;
			this.showNextLine();
		}
	}

	// Method to sync with audio analysis
	public updateWithAudio(audioAnalyzer: AudioAnalyzer): void {
		// Early return if overlay doesn't exist or poetry is not visible
		if (!this.isVisible || !this.overlay) return;

		// Get audio analysis data
		const volume = audioAnalyzer.getVolume();
		const midFreq = audioAnalyzer.getMidFreq();

		// Enhanced text glow effect based on volume
		const glowIntensity = volume * 15 + 3;
		const textShadow = `
            2px 2px 8px rgba(0, 0, 0, 0.9),
            0 0 ${glowIntensity}px rgba(255, 255, 255, ${volume * 0.4}),
            0 0 ${glowIntensity * 2}px rgba(255, 255, 255, ${volume * 0.2}),
            0 0 40px rgba(255, 255, 255, 0.1)
        `;
		this.overlay.style.textShadow = textShadow;

		// Subtle text scaling on mid frequencies
		const scale = 1 + midFreq * 0.08;
		this.overlay.style.transform = `translate(-50%, -50%) scale(${scale})`;

		// Warm color shift based on frequency for poetic atmosphere
		const hue = 45 + midFreq * 30; // Golden to warm white range
		const saturation = 20 + volume * 30;
		this.overlay.style.color = `hsl(${hue}, ${saturation}%, 95%)`;
	}

	// Method to update based on animation state
	public update(animationState: any): void {
		if (!this.isVisible) return;
		// Update based on animation state
		if (animationState.act === 3) {
			const progress = animationState.progress;
			const lineIndex = Math.floor(progress * this.poemLines.length);
			if (lineIndex !== this.currentLineIndex) {
				this.showLine(lineIndex);
			}
		}
	}

	public dispose(): void {
		if (this.animationInterval) {
			clearInterval(this.animationInterval);
			this.animationInterval = null;
		}
		if (this.overlay) {
			this.overlay.remove();
			this.overlay = null;
		}
	}
}
