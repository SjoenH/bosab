import type { AudioAnalyzerInterface, AudioData } from "../types/index";

export class AudioAnalyzer implements AudioAnalyzerInterface {
	public audioContext: AudioContext | null = null;
	public microphone: MediaStreamAudioSourceNode | null = null;
	public analyser: AnalyserNode | null = null;
	public dataArray: Uint8Array | null = null;
	public bufferLength = 0;

	public isEnabled = false;
	public isMicrophoneConnected = false;

	// Audio data
	public volume = 0;
	public averageFrequency = 0;
	public lowFreq = 0;
	public midFreq = 0;
	public highFreq = 0;
	public beat = false;

	// Beat detection
	public beatThreshold = 0.3;
	public beatCooldown = 0;
	public lastBeatTime = 0;
	public beatHistory: number[] = [];

	// Smoothing
	public smoothingFactor = 0.8;
	public volumeHistory: number[] = [];
	public historySize = 10;

	// Dynamics processing
	public gainNode: GainNode | null = null;
	public compressor: DynamicsCompressorNode | null = null;

	// Auto-gain
	public autoGainEnabled = true;
	public targetVolume = 0.5; // Target RMS volume (0-1)
	public autoGainAdjustmentSpeed = 0.01; // How quickly gain adjusts
	public minGain = 0.1; // Minimum gain multiplier
	public maxGain = 50; // Maximum gain multiplier

	// Silence detection
	private silenceThreshold = 0.01;
	private silenceTimeout = 5000; // 5 seconds
	private lastAudioTime = Date.now();
	private inSilentMode = false;

	async init(): Promise<boolean> {
		try {
			// Create audio context
			this.audioContext = new (
				window.AudioContext ||
				(window as Window & { webkitAudioContext?: typeof AudioContext })
					.webkitAudioContext
			)();

			// Setup analyser
			this.analyser = this.audioContext.createAnalyser();
			this.analyser.fftSize = 512;
			this.analyser.smoothingTimeConstant = 0.8;
			this.bufferLength = this.analyser.frequencyBinCount;
			this.dataArray = new Uint8Array(this.bufferLength);

			// Setup compressor
			this.compressor = this.audioContext.createDynamicsCompressor();
			this.compressor.threshold.value = -24; // Start compressing at -24dB
			this.compressor.knee.value = 12; // Smooth compression curve
			this.compressor.ratio.value = 4; // Compression ratio
			this.compressor.attack.value = 0.005; // Fast attack
			this.compressor.release.value = 0.1; // Quick release

			// Setup gain
			this.gainNode = this.audioContext.createGain();
			this.gainNode.gain.value = 1; // Initial gain, will be adjusted by auto-gain

			// Connect nodes
			this.compressor.connect(this.gainNode);
			this.gainNode.connect(this.analyser);

			console.log("🎤 Audio analyzer initialized");
			return true;
		} catch (error) {
			console.warn("Audio initialization failed:", error);
			return false;
		}
	}

	async requestMicrophone(): Promise<boolean> {
		if (this.isMicrophoneConnected) {
			return true;
		}

		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: false,
					noiseSuppression: false,
					autoGainControl: false,
				},
			});

			if (!this.audioContext || !this.analyser || !this.compressor) {
				throw new Error("Audio context not initialized");
			}

			this.microphone = this.audioContext.createMediaStreamSource(stream);
			this.microphone.connect(this.compressor); // Connect to compressor first

			this.isMicrophoneConnected = true;
			this.isEnabled = true;

			console.log("🎤 Microphone connected");
			return true;
		} catch (error) {
			console.warn("Microphone access denied:", error);
			this.startSilentMode();
			return false;
		}
	}

	startSilentMode(): void {
		if (!this.audioContext || !this.analyser || !this.compressor || !this.gainNode) {
			return;
		}

		// Create a silent oscillator for demo purposes
		const oscillator = this.audioContext.createOscillator();
		oscillator.connect(this.compressor); // Connect to compressor first
		oscillator.start();
		this.isEnabled = true;

		console.log("🔇 Running in silent mode (no microphone)");
	}

	async toggleMicrophone(): Promise<void> {
		if (this.isMicrophoneConnected) {
			this.isEnabled = !this.isEnabled;
			console.log(`🎤 Microphone ${this.isEnabled ? "enabled" : "disabled"}`);
		} else {
			await this.requestMicrophone();
		}
	}

	update(): void {
		if (!this.isEnabled || !this.analyser || !this.dataArray || !this.gainNode) {
			this.generateFallbackData();
			return;
		}

		// Get frequency data
		this.analyser.getByteFrequencyData(this.dataArray);

		// Calculate overall volume (RMS)
		let sum = 0;
		for (let i = 0; i < this.bufferLength; i++) {
			sum += this.dataArray[i] * this.dataArray[i];
		}
		const rawVolume = Math.sqrt(sum / this.bufferLength) / 255;

		// Auto-gain adjustment
		if (this.autoGainEnabled && this.audioContext && this.gainNode) { // Added this.audioContext check
			const currentGain = this.gainNode.gain.value;
			let targetGain = currentGain;

			if (rawVolume > 0.001) { // Avoid extreme adjustments with very low/zero volume
				const error = this.targetVolume / rawVolume;
				// Calculate desired gain, but don't let it explode if rawVolume is tiny
				targetGain = currentGain * Math.sqrt(error); // Using sqrt for less aggressive adjustment
			} else if (rawVolume <= 0.001 && currentGain > this.targetVolume) {
				// If it's very quiet and gain is high, reduce gain slowly
				targetGain = currentGain * 0.99;
			}

			// Clamp gain to min/max values
			targetGain = Math.max(this.minGain, Math.min(this.maxGain, targetGain));

			// Smoothly adjust gain towards the target
			const newGain = currentGain + (targetGain - currentGain) * this.autoGainAdjustmentSpeed;

			// Check if audioContext is still valid before setting value
			if (this.audioContext) {
				this.gainNode.gain.setValueAtTime(newGain, this.audioContext.currentTime);
			}
		}

		// Check for silence
		const currentTime = Date.now();
		if (rawVolume > this.silenceThreshold) {
			this.lastAudioTime = currentTime;
			if (this.inSilentMode) {
				this.inSilentMode = false;
				console.log("🎤 Audio input detected, resuming normal mode");
			}
		} else if (!this.inSilentMode && currentTime - this.lastAudioTime > this.silenceTimeout) {
			console.log("🔇 No audio input detected, switching to silent mode");
			this.inSilentMode = true;
		}

		// Use fallback data if in silent mode
		if (this.inSilentMode) {
			this.generateFallbackData();
			return;
		}

		// Smooth volume
		this.volumeHistory.push(rawVolume);
		if (this.volumeHistory.length > this.historySize) {
			this.volumeHistory.shift();
		}
		this.volume =
			this.volumeHistory.reduce((a, b) => a + b, 0) / this.volumeHistory.length;

		// Calculate frequency bands
		const lowEnd = Math.floor(this.bufferLength * 0.1);
		const midEnd = Math.floor(this.bufferLength * 0.5);

		this.lowFreq = this.getAverageFrequency(0, lowEnd);
		this.midFreq = this.getAverageFrequency(lowEnd, midEnd);
		this.highFreq = this.getAverageFrequency(midEnd, this.bufferLength);

		this.averageFrequency = (this.lowFreq + this.midFreq + this.highFreq) / 3;

		// Beat detection
		this.detectBeat();
	}

	getAverageFrequency(startIndex: number, endIndex: number): number {
		if (!this.dataArray) return 0;

		let sum = 0;
		const count = endIndex - startIndex;

		for (let i = startIndex; i < endIndex; i++) {
			sum += this.dataArray[i];
		}

		return sum / count / 255;
	}

	detectBeat(): void {
		const currentTime = Date.now();

		// Cooldown period
		if (currentTime - this.lastBeatTime < 100) {
			this.beat = false;
			return;
		}

		// Simple beat detection based on volume spike
		const volumeSpike = this.volume > this.beatThreshold;
		const lowFreqSpike = this.lowFreq > this.beatThreshold * 1.2;

		if (volumeSpike && lowFreqSpike) {
			this.beat = true;
			this.lastBeatTime = currentTime;
			this.beatHistory.push(currentTime);

			// Keep only recent beats
			this.beatHistory = this.beatHistory.filter(
				(time) => currentTime - time < 2000,
			);
		} else {
			this.beat = false;
		}
	}

	adjustGain(rawVolume: number): void {
		if (!this.autoGainEnabled || !this.gainNode) return;

		// Calculate target gain based on current volume and target volume
		let targetGain =
			this.gainNode.gain.value +
			(this.targetVolume - rawVolume) *
			this.autoGainAdjustmentSpeed;

		// Clamp gain to min/max values
		targetGain = Math.max(this.minGain, Math.min(this.maxGain, targetGain));

		// Apply the gain adjustment
		this.gainNode.gain.setValueAtTime(targetGain, this.audioContext?.currentTime || 0);
	}

	generateFallbackData(): void {
		// Generate subtle ambient data for when no microphone is available
		const time = Date.now() * 0.001;

		this.volume = 0.1 + Math.sin(time * 0.5) * 0.05;
		this.lowFreq = 0.2 + Math.sin(time * 0.3) * 0.1;
		this.midFreq = 0.15 + Math.sin(time * 0.7) * 0.08;
		this.highFreq = 0.1 + Math.sin(time * 1.2) * 0.06;
		this.averageFrequency = (this.lowFreq + this.midFreq + this.highFreq) / 3;

		// Occasional "beats"
		this.beat = Math.random() < 0.01;
	}

	getAudioData(): AudioData {
		return {
			frequencyData: this.dataArray || new Uint8Array(0),
			volume: this.volume,
			bass: this.lowFreq,
			mid: this.midFreq,
			treble: this.highFreq,
			pitch: this.averageFrequency,
		};
	}

	// Getters for easy access
	getVolume(): number {
		return this.volume;
	}
	getLowFreq(): number {
		return this.lowFreq;
	}
	getMidFreq(): number {
		return this.midFreq;
	}
	getHighFreq(): number {
		return this.highFreq;
	}
	getBeat(): boolean {
		return this.beat;
	}

	// Get normalized values for visual effects
	getVolumeNormalized(min = 0, max = 1): number {
		return min + this.volume * (max - min);
	}

	getFrequencyNormalized(type = "average", min = 0, max = 1): number {
		let freq = this.averageFrequency;
		switch (type) {
			case "low":
				freq = this.lowFreq;
				break;
			case "mid":
				freq = this.midFreq;
				break;
			case "high":
				freq = this.highFreq;
				break;
		}
		return min + freq * (max - min);
	}

	dispose(): void {
		if (this.microphone) {
			this.microphone.disconnect();
			this.microphone = null;
		}
		if (this.compressor) {
			this.compressor.disconnect();
			this.compressor = null;
		}
		if (this.gainNode) {
			this.gainNode.disconnect();
			this.gainNode = null;
		}
		if (this.audioContext) {
			this.audioContext.close();
			this.audioContext = null;
		}
		this.isEnabled = false;
		this.isMicrophoneConnected = false;
	}
}
