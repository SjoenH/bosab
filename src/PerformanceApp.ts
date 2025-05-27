import * as THREE from "three";
import { AudioAnalyzer } from "./audio/AudioAnalyzer";
import { Controls } from "./controls/Controls";
import { SceneManager } from "./scenes/SceneManager";
import type {
	AnimationState,
	AudioAnalyzerInterface,
	AudioData,
	PerformanceConfig,
	SceneManagerInterface,
} from "./types";
import { PoetryOverlay } from "./ui/PoetryOverlay";

export class PerformanceApp {
	private canvas: HTMLCanvasElement | null = null;
	private renderer: THREE.WebGLRenderer | null = null;
	private scene: THREE.Scene | null = null;
	private camera: THREE.PerspectiveCamera | null = null;
	private audioAnalyzer: AudioAnalyzerInterface | null = null;
	private sceneManager: SceneManagerInterface | null = null;
	private controls: Controls | null = null;
	private poetryOverlay: PoetryOverlay | null = null;

	private isPlaying = false;
	private currentAct = 1;
	private actStartTime = 0;
	private actDuration: number = 6.25 * 60 * 1000; // 6.25 minutes in milliseconds

	// Timing configuration
	private timingConfig: PerformanceConfig = {
		actDuration: 6.25 * 60 * 1000, // 6.25 minutes in milliseconds
		transitionDuration: 10 * 1000, // 10 seconds in milliseconds
		demoActDuration: 30 * 1000, // 30 seconds in milliseconds
		demoTransitionDuration: 10 * 1000, // 10 seconds in milliseconds
	};

	// Performance optimization
	private lastFrameTime = 0;
	private targetFPS = 60;
	private get frameInterval(): number {
		return 1000 / this.targetFPS;
	}

	public async init(): Promise<void> {
		try {
			this.showLoading(true);

			this.setupThreeJS();
			await this.setupAudio();
			this.setupScenes();
			this.setupControls();
			this.setupPoetry();
			this.setupEventListeners();

			this.showLoading(false);
			this.animate();

			console.log('🌌 "beneath our skin and bones" - Performance ready');
		} catch (error) {
			console.error("Failed to initialize performance:", error);
			this.showError("Failed to initialize. Please refresh the page.");
		}
	}

	private setupThreeJS(): void {
		// Get canvas element
		this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
		if (!this.canvas) {
			throw new Error("Canvas element not found");
		}

		// Create renderer
		this.renderer = new THREE.WebGLRenderer({
			canvas: this.canvas,
			antialias: window.devicePixelRatio < 2,
			alpha: false,
			powerPreference: "high-performance",
		});

		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.setClearColor(0x000000, 1);
		this.renderer.outputColorSpace = THREE.SRGBColorSpace;

		// Create scene
		this.scene = new THREE.Scene();

		// Create camera
		this.camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000,
		);
		this.camera.position.z = 5;

		// Handle window resize
		window.addEventListener("resize", () => this.onWindowResize(), false);
	}

	private async setupAudio(): Promise<void> {
		// Initialize audio analyzer
		this.audioAnalyzer = new AudioAnalyzer() as AudioAnalyzerInterface;
		await this.audioAnalyzer.init();

		// Request microphone access
		await this.audioAnalyzer.requestMicrophone();

		// Update scene manager with the initialized audio analyzer if it exists
		if (this.sceneManager) {
			(this.sceneManager as SceneManager).updateAudioAnalyzer(
				this.audioAnalyzer,
			);
		}
	}

	private setupScenes(): void {
		if (!this.renderer || !this.camera) {
			throw new Error("Renderer and camera must be initialized before scenes");
		}

		// Create scene manager with renderer and camera
		this.sceneManager = new SceneManager(this.renderer, this.camera);

		// Initialize scene manager
		this.sceneManager.init();

		// If audio analyzer is ready, update it
		if (this.audioAnalyzer) {
			(this.sceneManager as SceneManager).updateAudioAnalyzer(
				this.audioAnalyzer,
			);
		}
	}

	private setupControls(): void {
		this.controls = new Controls(this);
		this.controls.init();
	}

	private setupPoetry(): void {
		this.poetryOverlay = new PoetryOverlay();
		this.poetryOverlay.init();
	}

	private setupEventListeners(): void {
		// Fullscreen toggle
		document.addEventListener("keydown", (event) => {
			if (event.key === "f" || event.key === "F") {
				this.toggleFullscreen();
			}
		});

		// Handle visibility change for performance optimization
		document.addEventListener("visibilitychange", () => {
			if (document.hidden) {
				this.pausePerformance();
			} else {
				this.resumePerformance();
			}
		});
	}

	private animate = (): void => {
		requestAnimationFrame(this.animate);

		const currentTime = performance.now();
		const deltaTime = currentTime - this.lastFrameTime;

		// Frame rate limiting
		if (deltaTime >= this.frameInterval) {
			this.update(deltaTime);
			this.render();
			this.lastFrameTime = currentTime;
		}
	};

	private update(deltaTime: number): void {
		if (!this.audioAnalyzer || !this.sceneManager) return;

		// Update audio analyzer to process new data
		this.audioAnalyzer.update();

		// Get audio data
		const audioData: AudioData = this.audioAnalyzer.getAudioData();

		// Update scene manager
		this.sceneManager.update(audioData, deltaTime);

		// Update poetry overlay
		if (this.poetryOverlay) {
			this.poetryOverlay.update(this.getAnimationState());
		}

		// Check for automatic act progression
		if (this.isPlaying && !this.sceneManager.isTransitioning) {
			this.checkActProgression();
		}
	}

	private render(): void {
		if (!this.renderer || !this.sceneManager) return;

		// Get current scene and camera from scene manager
		const { scene, camera } = this.sceneManager.getCurrentScene();

		if (scene && camera) {
			this.renderer.render(scene, camera);
		}
	}

	private getAnimationState(): AnimationState {
		const currentTime = performance.now();
		const elapsed = this.isPlaying ? currentTime - this.actStartTime : 0;
		const progress = Math.min(elapsed / this.actDuration, 1);

		return {
			isPlaying: this.isPlaying,
			currentTime: elapsed,
			progress,
			act: this.currentAct,
			isTransitioning: this.sceneManager?.isTransitioning || false,
		};
	}

	private checkActProgression(): void {
		const elapsed = performance.now() - this.actStartTime;

		if (elapsed >= this.actDuration && this.currentAct < 4) {
			this.nextAct();
		}
	}

	private onWindowResize(): void {
		if (!this.camera || !this.renderer) return;

		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}

	// Public methods for controls
	public play(): void {
		if (!this.isPlaying) {
			this.isPlaying = true;
			this.actStartTime = performance.now();
			console.log(`▶️ Performance started - Act ${this.currentAct}`);
		}
	}

	public pause(): void {
		this.isPlaying = false;
		console.log("⏸️ Performance paused");
	}

	public stop(): void {
		this.isPlaying = false;
		this.currentAct = 1;
		this.actStartTime = 0;
		this.sceneManager?.setAct(1);
		console.log("⏹️ Performance stopped");
	}

	public toggleAutoPlay(): void {
		this.isPlaying = !this.isPlaying;
		if (this.isPlaying) {
			this.actStartTime = performance.now();
			console.log("▶️ Auto-play enabled");
		} else {
			console.log("⏸️ Auto-play disabled");
		}
	}

	public setTimingConfig(config: Partial<PerformanceConfig>): void {
		this.timingConfig = { ...this.timingConfig, ...config };
		console.log("⏱️ Timing configuration updated");
	}

	public async nextAct(): Promise<void> {
		if (this.currentAct < 4 && this.sceneManager) {
			this.currentAct++;
			this.actStartTime = performance.now();
			await this.sceneManager.setAct(this.currentAct);
			console.log(`⏭️ Moved to Act ${this.currentAct}`);
		}
	}

	public async previousAct(): Promise<void> {
		if (this.currentAct > 1 && this.sceneManager) {
			this.currentAct--;
			this.actStartTime = performance.now();
			await this.sceneManager.setAct(this.currentAct);
			console.log(`⏮️ Moved to Act ${this.currentAct}`);
		}
	}

	public async setAct(actNumber: number): Promise<void> {
		if (actNumber >= 1 && actNumber <= 4 && this.sceneManager) {
			this.currentAct = actNumber;
			this.actStartTime = performance.now();
			await this.sceneManager.setAct(actNumber);
			console.log(`🎭 Set to Act ${actNumber}`);
		}
	}

	public toggleFullscreen(): void {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen().catch((err) => {
				console.log(`Error attempting to enable fullscreen: ${err.message}`);
			});
		} else {
			document.exitFullscreen();
		}
	}

	private pausePerformance(): void {
		// Reduce frame rate when tab is not visible
		this.targetFPS = 30;
	}

	private resumePerformance(): void {
		// Restore full frame rate when tab is visible
		this.targetFPS = 60;
	}

	private showLoading(show: boolean): void {
		const loader = document.getElementById("loading");
		if (loader) {
			loader.style.display = show ? "flex" : "none";
		}
	}

	private showError(message: string): void {
		const errorElement = document.getElementById("error");
		if (errorElement) {
			errorElement.textContent = message;
			errorElement.style.display = "block";
		}
	}

	// Getters for external access
	public get isPerformancePlaying(): boolean {
		return this.isPlaying;
	}

	public get currentActNumber(): number {
		return this.currentAct;
	}

	public get audioData(): AudioData | null {
		return this.audioAnalyzer?.getAudioData() || null;
	}

	// Getters for public access
	public getAudioAnalyzer(): AudioAnalyzerInterface | null {
		return this.audioAnalyzer;
	}

	// Cleanup
	public dispose(): void {
		this.sceneManager?.dispose();
		this.audioAnalyzer?.dispose();
		this.controls?.dispose();
		this.poetryOverlay?.dispose();

		if (this.renderer) {
			this.renderer.dispose();
		}
	}
}
