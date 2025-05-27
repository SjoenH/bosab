/**
 * Base Act Class for "beneath our skin and bones"
 *
 * Provides standardized positioning, lifecycle management, and common
 * functionality for all acts. Ensures consistent behavior and easy maintenance.
 */

import * as THREE from "three";
import { LayoutHelper } from "../config/LayoutConfig";
import type {
	AudioAnalyzerInterface,
	AudioData,
	BaseAct as BaseActInterface,
} from "../types";

type TransitionState = "idle" | "entering" | "active" | "exiting";

export abstract class BaseAct implements BaseActInterface {
	protected scene: THREE.Scene;
	protected camera: THREE.Camera;
	protected actNumber: number;

	// Core group for all act content
	protected group: THREE.Group;

	// Protected method for handling audio analyzer updates
	protected onAudioAnalyzerUpdate(): void {
		// Optional override in derived classes to handle audio analyzer updates
	}

	// Audio analyzer reference
	private _audioAnalyzer: AudioAnalyzerInterface;
	protected get audioAnalyzer(): AudioAnalyzerInterface {
		return this._audioAnalyzer;
	}
	protected set audioAnalyzer(value: AudioAnalyzerInterface) {
		this._audioAnalyzer = value;
		// Handle audio analyzer update
		this.onAudioAnalyzerUpdate();
	}

	// Act state management
	protected isActive = false;
	protected isInitialized = false;
	protected transitionState: TransitionState = "idle";

	// Timing
	protected time = 0;
	protected deltaTime = 0;
	protected lastUpdateTime = 0;

	// Audio reactive properties
	protected audioLevel = 0;
	protected bassLevel = 0;
	protected midLevel = 0;
	protected trebleLevel = 0;
	protected beatDetected = false;

	// Transition properties
	protected transitionProgress = 0;
	protected fadeValue = 0;

	// Position and bounds (set from layout config)
	protected actPosition: THREE.Vector3 = new THREE.Vector3();
	protected bounds: any = null;

	// Performance optimization
	protected needsUpdate = true;
	protected updateFrequency = 60; // Target updates per second
	protected lastFrameTime = 0;

	// Visual elements collections
	protected particles: THREE.Points[] = [];
	protected meshes: THREE.Mesh[] = [];
	protected lines: THREE.Line[] = [];
	protected materials: THREE.Material[] = [];

	constructor(
		scene: THREE.Scene,
		camera: THREE.Camera,
		audioAnalyzer: AudioAnalyzerInterface,
		actNumber: number,
	) {
		this.scene = scene;
		this.camera = camera;
		this._audioAnalyzer = audioAnalyzer;
		this.actNumber = actNumber;

		// Setup core group
		this.group = new THREE.Group();
		this.group.name = `Act${actNumber}Group`;
		this.scene.add(this.group);

		console.log(`🎭 BaseAct ${actNumber} created`);
	}

	// Required interface methods
	public getScene(): THREE.Scene {
		return this.scene;
	}

	public getCamera(): THREE.Camera {
		return this.camera;
	}

	/**
	 * Initialize the act - called once during setup
	 */
	public async init(): Promise<void> {
		if (this.isInitialized) {
			console.warn(`Act ${this.actNumber} already initialized`);
			return;
		}

		// Position the act according to layout config
		this.applyLayoutPosition();

		// Add to scene
		this.scene.add(this.group);

		// Create act-specific content
		await this.createContent();

		// Initially visible and active - don't hide acts
		this.group.visible = true;

		this.isInitialized = true;
		console.log(
			`🎭 Act ${this.actNumber} initialized at position ${this.actPosition.toArray().join(", ")}`,
		);
	}

	/**
	 * Apply layout position from config
	 */
	protected applyLayoutPosition(): void {
		// Get position from layout config
		this.actPosition = LayoutHelper.getActPosition(this.actNumber);

		// Position the entire group
		this.group.position.copy(this.actPosition);

		console.log(
			`📐 Act ${this.actNumber} positioned at:`,
			this.actPosition.toArray().join(", "),
		);
	}

	/**
	 * Get the spatial bounds for this act
	 */
	public getBounds(): any {
		return this.bounds;
	}

	/**
	 * Get the current position of this act
	 */
	public getPosition(): THREE.Vector3 {
		return this.actPosition.clone();
	}

	/**
	 * Update method called every frame
	 */
	public update(audioData: AudioData, deltaTime: number): void {
		if (!this.isInitialized) return;

		// Update timing
		this.time += deltaTime;
		this.deltaTime = deltaTime;

		// Process audio data
		this.processAudioData(audioData);

		// Update act-specific content
		this.updateContent(deltaTime);

		// Update visual effects
		this.updateVisualEffects(deltaTime);
	}

	/**
	 * Process incoming audio data
	 */
	protected processAudioData(audioData: AudioData): void {
		this.audioLevel = audioData.volume;
		this.bassLevel = audioData.bass;
		this.midLevel = audioData.mid;
		this.trebleLevel = audioData.treble;

		// Simple beat detection based on volume spikes
		this.beatDetected = audioData.volume > 0.7;
	}

	/**
	 * Enter this act - called when transitioning to this act
	 */
	public async enter(fromAct?: number): Promise<void> {
		if (
			this.transitionState === "entering" ||
			this.transitionState === "active"
		) {
			return;
		}

		this.transitionState = "entering";
		this.isActive = true;

		// Start enter animation
		await this.animateEnter();

		this.transitionState = "active";
		console.log(
			`🎭 Act ${this.actNumber} entered${fromAct ? ` from Act ${fromAct}` : ""}`,
		);
	}

	/**
	 * Exit this act - called when transitioning away from this act
	 */
	public async exit(toAct?: number): Promise<void> {
		if (this.transitionState === "exiting" || this.transitionState === "idle") {
			return;
		}

		this.transitionState = "exiting";

		// Start exit animation
		await this.animateExit();

		this.isActive = false;
		this.transitionState = "idle";
		console.log(
			`🎭 Act ${this.actNumber} exited${toAct ? ` to Act ${toAct}` : ""}`,
		);
	}

	/**
	 * Prepare for entry (called before camera starts moving)
	 */
	public prepareEntry(): void {
		// Default implementation - acts can override
		this.group.visible = true;
	}

	/**
	 * Check if camera is focused on this act
	 */
	public isCameraFocused(): boolean {
		if (!this.camera) return false;

		// Calculate distance from camera to act position
		const distance = this.camera.position.distanceTo(this.actPosition);
		return distance < 20; // Threshold for "focused"
	}

	/**
	 * Get camera focus progress (0 = far, 1 = focused)
	 */
	public getCameraFocusProgress(): number {
		if (!this.camera) return 0;

		const distance = this.camera.position.distanceTo(this.actPosition);
		const maxDistance = 100;
		return Math.max(0, 1 - distance / maxDistance);
	}

	/**
	 * Get smoothed audio value with interpolation
	 */
	protected getSmoothedAudio(
		type: "volume" | "bass" | "mid" | "treble" | "average",
		smoothing = 0.1,
	): number {
		let currentValue: number;
		switch (type) {
			case "volume":
				currentValue = this.audioLevel;
				break;
			case "bass":
				currentValue = this.bassLevel;
				break;
			case "mid":
				currentValue = this.midLevel;
				break;
			case "treble":
				currentValue = this.trebleLevel;
				break;
			case "average":
				currentValue =
					(this.audioLevel +
						this.bassLevel +
						this.midLevel +
						this.trebleLevel) /
					4;
				break;
			default:
				currentValue = this.audioLevel;
		}

		// Smoothly interpolate to target value
		return (
			currentValue + (this.audioAnalyzer.getVolume() - currentValue) * smoothing
		);
	}

	// Abstract methods that must be implemented by subclasses
	protected abstract createContent(): Promise<void>;
	protected abstract updateContent(deltaTime: number): void;
	protected abstract updateVisualEffects(deltaTime: number): void;
	protected abstract animateEnter(): Promise<void>;
	protected abstract animateExit(): Promise<void>;

	/**
	 * Dispose of all resources
	 */
	public dispose(): void {
		// Dispose of materials
		this.materials.forEach((material) => {
			if (material.dispose) {
				material.dispose();
			}
		});

		// Dispose of geometries
		this.meshes.forEach((mesh) => {
			if (mesh.geometry.dispose) {
				mesh.geometry.dispose();
			}
		});

		this.particles.forEach((particle) => {
			if (particle.geometry.dispose) {
				particle.geometry.dispose();
			}
		});

		this.lines.forEach((line) => {
			if (line.geometry.dispose) {
				line.geometry.dispose();
			}
		});

		// Remove from scene
		if (this.scene && this.group) {
			this.scene.remove(this.group);
		}

		console.log(`🗑️ Act ${this.actNumber} disposed`);
	}

	// Utility methods for common operations

	/**
	 * Create a fade transition with easing
	 */
	protected createFadeTransition(duration = 1000): Promise<void> {
		return new Promise((resolve) => {
			const startTime = performance.now();
			const startFade = this.fadeValue;
			const targetFade = this.transitionState === "entering" ? 1 : 0;

			const animate = () => {
				const elapsed = performance.now() - startTime;
				const progress = Math.min(elapsed / duration, 1);

				// Apply easing
				const easeProgress =
					this.transitionState === "entering"
						? this.easeOutCubic(progress)
						: this.easeInCubic(progress);

				this.fadeValue = startFade + (targetFade - startFade) * easeProgress;
				this.applyFade(this.fadeValue);

				if (progress < 1) {
					requestAnimationFrame(animate);
				} else {
					this.fadeValue = targetFade;
					this.applyFade(this.fadeValue);
					resolve();
				}
			};

			animate();
		});
	}

	/**
	 * Apply fade effect to all materials with enhanced visuals
	 */
	protected applyFade(fadeValue: number): void {
		// Update all materials
		this.materials.forEach((material) => {
			if ("opacity" in material) {
				const mat = material as THREE.Material & { opacity: number };
				mat.opacity = fadeValue;
				mat.transparent = true;
				mat.needsUpdate = true;

				// Enhanced emissive effect during transitions
				if ("emissiveIntensity" in material) {
					(material as any).emissiveIntensity = fadeValue * 2;
				}
			}
		});

		// Scale effect during transitions
		const scale =
			this.transitionState === "entering"
				? 0.8 + fadeValue * 0.2 // Scale up when entering
				: 1 - (1 - fadeValue) * 0.2; // Scale down when exiting

		this.group.scale.setScalar(scale);
	}

	// Easing functions for smooth transitions
	private easeInCubic(x: number): number {
		return x * x * x;
	}

	private easeOutCubic(x: number): number {
		return 1 - Math.pow(1 - x, 3);
	}

	private easeInOutCubic(x: number): number {
		return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
	}

	// Method to smoothly update visual intensity
	protected updateVisualIntensity(
		current: number,
		target: number,
		smoothing = 0.1,
	): number {
		return current + (target - current) * smoothing;
	}
}
