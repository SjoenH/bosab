import * as THREE from "three";
import { CameraController } from "../controls/CameraController";
import type {
	AudioAnalyzerInterface,
	AudioData,
	BaseAct,
	SceneManagerInterface,
} from "../types";
import { Act1Matrix } from "./Act1Matrix";
import { Act2Desert } from "./Act2Desert";
import { Act3Human } from "./Act3Human";
import { Act4Stars } from "./Act4Stars";

interface ActMap {
	[key: number]: BaseAct;
}

type TransitionPhase =
	| "idle"
	| "preparing"
	| "camera-moving"
	| "content-transitioning"
	| "complete";
type NavigationMode = "camera" | "fade";

export class SceneManager implements SceneManagerInterface {
	private scene: THREE.Scene;
	private camera: THREE.PerspectiveCamera;
	private audioAnalyzer: AudioAnalyzerInterface;

	// Camera controller for smooth navigation
	private cameraController: CameraController;

	private acts: ActMap = {};
	private currentActInstance: BaseAct | null = null;
	public currentAct = 1;
	private transitionProgress = 0;
	public isTransitioning = false;
	private transitionDuration = 3000; // Default 3 seconds
	private transitionStartTime = 0;

	// Transition state management
	private previousAct: BaseAct | null = null;
	private nextAct: BaseAct | null = null;
	private transitionPhase: TransitionPhase = "idle";

	// Navigation mode
	private navigationMode: NavigationMode = "camera";
	private allowOverlap = false; // Camera navigation doesn't need overlap

	// Demo mode configuration
	private demoMode = false;
	private autoProgress = false;
	private actProgressTimer = 0;

	// Configurable timing values
	private performanceActDuration: number = 6.25 * 60 * 1000; // 6.25 minutes for performance
	private demoActDuration = 5000; // 5 seconds per act in demo
	private demoTransitionDuration = 3000; // 3 seconds transitions in demo

	constructor(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera) {
		// Create a scene for the scene manager
		this.scene = new THREE.Scene();
		this.camera = camera;

		// Camera controller for smooth navigation
		this.cameraController = new CameraController(camera);

		// Camera controller callbacks
		this.setupCameraCallbacks();

		// Create initial mock audio analyzer
		this.audioAnalyzer = this.createMockAudioAnalyzer();

		console.log("🎭 SceneManager initialized with camera navigation");
	}

	// Create a mock audio analyzer for initialization
	private createMockAudioAnalyzer(): AudioAnalyzerInterface {
		return {
			isEnabled: false,
			isMicrophoneConnected: false,
			volume: 0,
			averageFrequency: 0,
			lowFreq: 0,
			midFreq: 0,
			highFreq: 0,
			beat: false,
			init: async () => false,
			requestMicrophone: async () => false,
			toggleMicrophone: async () => {},
			update: () => {},
			getAudioData: () => ({
				frequencyData: new Uint8Array(0),
				volume: 0,
				bass: 0,
				mid: 0,
				treble: 0,
				pitch: 0,
			}),
			getVolume: () => 0,
			getAverageFrequency: () => 0,
			getLowFreq: () => 0,
			getMidFreq: () => 0,
			getHighFreq: () => 0,
			getBeat: () => false,
			getVolumeNormalized: () => 0,
			getFrequencyNormalized: () => 0,
			dispose: () => {},
		};
	}

	/**
	 * Update the audio analyzer instance and propagate to all acts
	 */
	public updateAudioAnalyzer(audioAnalyzer: AudioAnalyzerInterface): void {
		this.audioAnalyzer = audioAnalyzer;
		// Update audio analyzer for all acts
		for (const act of Object.values(this.acts)) {
			// Use type assertion to update the protected audioAnalyzer property
			(act as { audioAnalyzer: AudioAnalyzerInterface }).audioAnalyzer =
				audioAnalyzer;
		}
	}

	/**
	 * Setup camera controller callbacks
	 */
	private setupCameraCallbacks(): void {
		this.cameraController.onTransitionStart = (actNumber: number) => {
			console.log(`🎭 Camera transition started to Act ${actNumber}`);
		};

		this.cameraController.onTransitionComplete = (actNumber: number) => {
			console.log(`🎭 Camera transition completed to Act ${actNumber}`);
			if (this.isTransitioning) {
				this.completeActTransition();
			}
		};

		this.cameraController.onTransitionUpdate = (
			progress: number,
			actNumber: number,
		) => {
			// Update any UI elements that track transition progress
			this.transitionProgress = progress;
		};
	}

	public init(): void {
		// Initialize camera controller
		this.cameraController.init();

		// Initialize all acts with their positions
		this.acts[1] = new Act1Matrix(
			this.scene,
			this.camera,
			this.audioAnalyzer,
			1,
		);
		this.acts[2] = new Act2Desert(
			this.scene,
			this.camera,
			this.audioAnalyzer,
			2,
		);
		this.acts[3] = new Act3Human(
			this.scene,
			this.camera,
			this.audioAnalyzer,
			3,
		);
		this.acts[4] = new Act4Stars(
			this.scene,
			this.camera,
			this.audioAnalyzer,
			4,
		);

		// Initialize each act
		for (const act of Object.values(this.acts)) {
			act.init();
		}

		// Start with Act 1 as current, but keep all acts visible and active
		this.currentActInstance = this.acts[1];

		// Enter all acts so they're all visible and running
		for (const act of Object.values(this.acts)) {
			act.enter();
		}

		this.actProgressTimer = performance.now();

		console.log(
			"🎭 Scene manager initialized with 4 spatially-separated acts (all visible and active)",
		);
	}

	public async setAct(actNumber: number): Promise<void> {
		return new Promise((resolve) => {
			this.transitionToAct(actNumber);

			// Wait for transition to complete
			const checkComplete = () => {
				if (!this.isTransitioning) {
					resolve();
				} else {
					requestAnimationFrame(checkComplete);
				}
			};
			checkComplete();
		});
	}

	private transitionToAct(actNumber: number): void {
		if (actNumber === this.currentAct || this.isTransitioning) {
			return;
		}

		const newAct = this.acts[actNumber];
		if (!newAct) {
			console.warn(`Act ${actNumber} not found`);
			return;
		}

		// Use demo transition duration if in demo mode
		const duration = this.demoMode
			? this.demoTransitionDuration
			: this.transitionDuration;

		// Start transition
		this.isTransitioning = true;
		this.transitionStartTime = performance.now();
		this.transitionProgress = 0;
		this.transitionPhase = "preparing";

		// Store transition state
		this.previousAct = this.currentActInstance;
		this.nextAct = newAct;

		// Prepare next act for entry
		if (this.nextAct) {
			this.nextAct.prepareEntry?.();
		}

		// Start camera transition with easing
		if (this.cameraController.transitionToAct(actNumber, duration)) {
			this.transitionPhase = "camera-moving";

			// Keep both acts visible during transition
			if (this.previousAct) {
				this.previousAct.update(this.audioAnalyzer.getAudioData(), 16.67); // Update at 60fps timing
			}
			if (this.nextAct) {
				this.nextAct.update(this.audioAnalyzer.getAudioData(), 16.67);
			}

			console.log(
				`🔄 Transitioning from Act ${this.currentAct} to Act ${actNumber} via camera movement${this.demoMode ? " (DEMO)" : ""}`,
			);
		} else {
			// Fallback if camera transition fails
			this.completeActTransition();
		}
	}

	public update(audioData: AudioData, deltaTime: number): void {
		const time = performance.now();

		// Update camera controller
		this.cameraController.update(time);

		// Handle auto-progression in demo mode
		if (this.autoProgress && !this.isTransitioning) {
			this.updateAutoProgress(time);
		}

		// Update ALL acts - don't pause any of them
		for (const act of Object.values(this.acts)) {
			act.update(audioData, deltaTime);
		}
	}

	/**
	 * Complete the act transition (called by camera controller)
	 */
	private completeActTransition(): void {
		if (!this.isTransitioning) return;

		// Complete the transition - but don't exit previous act to keep it visible
		// if (this.previousAct) {
		//     this.previousAct.exit()
		// }

		if (this.nextAct) {
			this.nextAct.enter();
			this.currentActInstance = this.nextAct;
			this.currentAct = this.getActNumber(this.nextAct);
		}

		// Reset transition state
		this.isTransitioning = false;
		this.transitionProgress = 1;
		this.transitionPhase = "complete";
		this.previousAct = null;
		this.nextAct = null;

		// Reset auto-progress timer
		this.actProgressTimer = performance.now();

		console.log(
			`🎭 Act transition completed - now at Act ${this.currentAct} (all acts remain visible)`,
		);
	}

	public getCurrentAct(): BaseAct | null {
		return this.currentActInstance;
	}

	public getCurrentActNumber(): number {
		return this.currentAct;
	}

	public getCurrentScene(): { scene: THREE.Scene; camera: THREE.Camera } {
		return {
			scene: this.scene,
			camera: this.camera,
		};
	}

	public getTransitionProgress(): number {
		return this.cameraController.isInTransition
			? this.cameraController.transitionAmount
			: 0;
	}

	public isInTransition(): boolean {
		return this.isTransitioning || this.cameraController.isInTransition;
	}

	/**
	 * Get camera controller for external access
	 */
	public getCameraController(): CameraController {
		return this.cameraController;
	}

	/**
	 * Switch navigation mode between camera and fade
	 */
	public setNavigationMode(mode: NavigationMode): void {
		if (mode === "camera" || mode === "fade") {
			this.navigationMode = mode;
			console.log(`🎭 Navigation mode set to: ${mode}`);
		} else {
			console.warn(`Invalid navigation mode: ${mode}`);
		}
	}

	/**
	 * Move camera to overview position
	 */
	public showOverview(): void {
		this.cameraController.transitionToOverview();
	}

	/**
	 * Apply new layout configuration
	 */
	public updateLayout(layoutName?: string): void {
		// Update all acts with new positions
		for (const act of Object.values(this.acts)) {
			if (
				typeof (act as { applyLayoutPosition?: () => void })
					.applyLayoutPosition === "function"
			) {
				(act as { applyLayoutPosition: () => void }).applyLayoutPosition();
			}
		}

		// Update camera controller
		this.cameraController.updateLayout();

		console.log(`🎭 Layout updated${layoutName ? ` to ${layoutName}` : ""}`);
	}

	private updateAutoProgress(time: number): void {
		const duration = this.demoMode
			? this.demoActDuration
			: this.performanceActDuration;
		const elapsed = time - this.actProgressTimer;

		if (elapsed >= duration) {
			// Auto-advance to next act
			let nextAct = this.currentAct + 1;
			if (nextAct > 4) {
				nextAct = 1; // Loop back to Act 1
			}
			this.transitionToAct(nextAct);
		}
	}

	/**
	 * Helper method to get act number from act instance
	 */
	private getActNumber(act: BaseAct): number {
		for (const [number, actInstance] of Object.entries(this.acts)) {
			if (actInstance === act) {
				return Number.parseInt(number);
			}
		}
		return 1; // fallback
	}

	// Demo mode controls
	public enableDemoMode(enabled = true): void {
		this.demoMode = enabled;
		console.log(`🎬 Demo mode ${enabled ? "enabled" : "disabled"}`);
	}

	public setAutoProgress(enabled = true): void {
		this.autoProgress = enabled;
		this.actProgressTimer = performance.now(); // Reset timer
		console.log(`⏩ Auto-progress ${enabled ? "enabled" : "disabled"}`);
	}

	public setDemoTiming(actDuration = 5000, transitionDuration = 500): void {
		this.demoActDuration = actDuration;
		this.demoTransitionDuration = transitionDuration;
		console.log(
			`⏱️ Demo timing: ${actDuration}ms acts, ${transitionDuration}ms transitions`,
		);
	}

	public setTimingConfig(config: {
		transitionDuration?: number;
		demoActDuration?: number;
		demoTransitionDuration?: number;
		performanceActDuration?: number;
	}): void {
		if (config.transitionDuration !== undefined) {
			this.transitionDuration = config.transitionDuration;
		}
		if (config.demoActDuration !== undefined) {
			this.demoActDuration = config.demoActDuration;
		}
		if (config.demoTransitionDuration !== undefined) {
			this.demoTransitionDuration = config.demoTransitionDuration;
		}
		if (config.performanceActDuration !== undefined) {
			this.performanceActDuration = config.performanceActDuration;
		}

		console.log("⏱️ Scene manager timing updated:", {
			performanceAct: `${this.performanceActDuration / 60000}min`,
			transition: `${this.transitionDuration / 1000}s`,
			demoAct: `${this.demoActDuration / 1000}s`,
			demoTransition: `${this.demoTransitionDuration / 1000}s`,
		});
	}

	// Quick cycle through all acts for testing
	public startQuickDemo(): void {
		this.enableDemoMode(true);
		this.setDemoTiming(3000, 300); // 3 seconds per act, 0.3 second transitions
		this.setAutoProgress(true);
		console.log("🚀 Quick demo started - cycling through all acts");
	}

	public stopDemo(): void {
		this.enableDemoMode(false);
		this.setAutoProgress(false);
		console.log("⏹️ Demo stopped");
	}

	// Cleanup method
	public dispose(): void {
		// Dispose camera controller
		if (this.cameraController) {
			this.cameraController.dispose();
		}

		// Dispose all acts
		for (const act of Object.values(this.acts)) {
			if (act.dispose) {
				act.dispose();
			}
		}
	}
}
