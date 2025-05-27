/**
 * Camera Controller for "beneath our skin and bones"
 *
 * Handles smooth camera transitions between acts with configurable easing
 * and look-at behavior for seamless navigation through the performance space.
 */

import * as THREE from "three";
import { LAYOUT_CONFIG, LayoutHelper } from "../config/LayoutConfig";

type EasingFunction = (t: number) => number;

interface CameraState {
	act: number;
	position: THREE.Vector3;
	lookAt: THREE.Vector3;
	isTransitioning: boolean;
	transitionProgress: number;
}

interface OverviewPosition {
	position: THREE.Vector3;
	lookAt: THREE.Vector3;
}

export class CameraController {
	private camera: THREE.Camera;
	private isTransitioning = false;
	private transitionStartTime = 0;
	private transitionDuration: number;
	private transitionProgress = 0;

	// Camera positions and targets
	private startPosition: THREE.Vector3 = new THREE.Vector3();
	private targetPosition: THREE.Vector3 = new THREE.Vector3();
	private startLookAt: THREE.Vector3 = new THREE.Vector3();
	private targetLookAt: THREE.Vector3 = new THREE.Vector3();

	// Current camera state
	private currentAct = 1;
	private currentLookAt: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

	// Easing functions
	private easingFunctions: Record<string, EasingFunction> = {
		linear: (t: number) => t,
		easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
		easeInOutCubic: (t: number) =>
			t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
		easeInOutQuart: (t: number) =>
			t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
		easeOutBack: (t: number) => {
			const c1 = 1.70158;
			const c3 = c1 + 1;
			return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
		},
	};

	// Callback for transition events
	public onTransitionStart: ((actNumber: number) => void) | null = null;
	public onTransitionComplete: ((actNumber: number) => void) | null = null;
	public onTransitionUpdate:
		| ((progress: number, actNumber: number) => void)
		| null = null;

	constructor(camera: THREE.Camera) {
		this.camera = camera;
		this.transitionDuration = LAYOUT_CONFIG.camera.transitionDuration;
		console.log("📷 Camera controller initialized");
	}

	/**
	 * Initialize camera to first act position
	 */
	public init(): void {
		this.moveToActImmediate(1);
		console.log("📷 Camera positioned at Act 1");
	}

	/**
	 * Move camera to act immediately (no transition)
	 */
	public moveToActImmediate(actNumber: number): void {
		const position = LayoutHelper.getCameraPosition(actNumber);
		const lookAt = LayoutHelper.getCameraLookAt(actNumber);

		this.camera.position.copy(position);
		this.camera.lookAt(lookAt);
		this.currentLookAt.copy(lookAt);
		this.currentAct = actNumber;

		console.log(`📷 Camera moved to Act ${actNumber} immediately`);
	}

	/**
	 * Start smooth transition to target act
	 */
	public transitionToAct(
		actNumber: number,
		duration: number | null = null,
	): boolean {
		if (this.isTransitioning) {
			console.warn("📷 Camera transition already in progress");
			return false;
		}

		if (actNumber === this.currentAct) {
			console.log(`📷 Already at Act ${actNumber}`);
			return false;
		}

		// Set transition duration
		this.transitionDuration =
			duration || LAYOUT_CONFIG.camera.transitionDuration;

		// Store starting state
		this.startPosition.copy(this.camera.position);
		this.startLookAt.copy(this.currentLookAt);

		// Set target state
		this.targetPosition.copy(LayoutHelper.getCameraPosition(actNumber));
		this.targetLookAt.copy(LayoutHelper.getCameraLookAt(actNumber));

		// Initialize transition
		this.isTransitioning = true;
		this.transitionStartTime = performance.now();
		this.transitionProgress = 0;
		this.currentAct = actNumber;

		// Trigger callback
		if (this.onTransitionStart) {
			this.onTransitionStart(actNumber);
		}

		console.log(
			`📷 Starting camera transition to Act ${actNumber} (${this.transitionDuration}ms)`,
		);
		return true;
	}

	/**
	 * Update camera position during transition
	 */
	public update(time: number): void {
		if (!this.isTransitioning) {
			return;
		}

		// Calculate transition progress
		const elapsed = time - this.transitionStartTime;
		const rawProgress = Math.min(elapsed / this.transitionDuration, 1);

		// Apply easing
		const easingName = LAYOUT_CONFIG.camera.easing;
		const easingFunction =
			this.easingFunctions[easingName] || this.easingFunctions.easeInOutCubic;
		this.transitionProgress = easingFunction(rawProgress);

		// Interpolate camera position
		this.camera.position.lerpVectors(
			this.startPosition,
			this.targetPosition,
			this.transitionProgress,
		);

		// Interpolate look-at target
		if (LAYOUT_CONFIG.camera.smoothLookAt) {
			this.currentLookAt.lerpVectors(
				this.startLookAt,
				this.targetLookAt,
				this.transitionProgress,
			);
			this.camera.lookAt(this.currentLookAt);
		} else {
			// Snap to target look-at partway through transition
			if (this.transitionProgress > 0.5) {
				this.camera.lookAt(this.targetLookAt);
				this.currentLookAt.copy(this.targetLookAt);
			}
		}

		// Trigger update callback
		if (this.onTransitionUpdate) {
			this.onTransitionUpdate(this.transitionProgress, this.currentAct);
		}

		// Check if transition is complete
		if (rawProgress >= 1) {
			this.completeTransition();
		}
	}

	/**
	 * Complete the current transition
	 */
	private completeTransition(): void {
		if (!this.isTransitioning) return;

		// Ensure final position is exact
		this.camera.position.copy(this.targetPosition);
		this.camera.lookAt(this.targetLookAt);
		this.currentLookAt.copy(this.targetLookAt);

		// Reset transition state
		this.isTransitioning = false;
		this.transitionProgress = 0;

		// Trigger callback
		if (this.onTransitionComplete) {
			this.onTransitionComplete(this.currentAct);
		}

		console.log(`📷 Camera transition to Act ${this.currentAct} completed`);
	}

	/**
	 * Force stop current transition
	 */
	public stopTransition(): void {
		if (this.isTransitioning) {
			this.isTransitioning = false;
			this.transitionProgress = 0;
			console.log("📷 Camera transition stopped");
		}
	}

	/**
	 * Get current camera state
	 */
	public getCurrentState(): CameraState {
		return {
			act: this.currentAct,
			position: this.camera.position.clone(),
			lookAt: this.currentLookAt.clone(),
			isTransitioning: this.isTransitioning,
			transitionProgress: this.transitionProgress,
		};
	}

	/**
	 * Set custom camera position and look-at (for manual control)
	 */
	public setCustomPosition(
		position: THREE.Vector3,
		lookAt: THREE.Vector3 | null = null,
	): void {
		if (this.isTransitioning) {
			this.stopTransition();
		}

		this.camera.position.copy(position);
		if (lookAt) {
			this.camera.lookAt(lookAt);
			this.currentLookAt.copy(lookAt);
		}
	}

	/**
	 * Get suggested camera positions for overview/debug
	 */
	public getOverviewPosition(): OverviewPosition {
		// Calculate center point of all acts
		const center = new THREE.Vector3();
		let count = 0;

		for (let i = 1; i <= 4; i++) {
			const pos = LayoutHelper.getActPosition(i);
			center.add(pos);
			count++;
		}

		center.divideScalar(count);

		// Position camera high and back to see all acts
		const overviewPosition = center.clone();
		overviewPosition.y += 30;
		overviewPosition.z += 50;

		return {
			position: overviewPosition,
			lookAt: center,
		};
	}

	/**
	 * Transition to overview position
	 */
	public transitionToOverview(duration: number | null = null): void {
		const overview = this.getOverviewPosition();

		// Store starting state
		this.startPosition.copy(this.camera.position);
		this.startLookAt.copy(this.currentLookAt);

		// Set target state
		this.targetPosition.copy(overview.position);
		this.targetLookAt.copy(overview.lookAt);

		// Set transition duration
		this.transitionDuration =
			duration || LAYOUT_CONFIG.camera.transitionDuration * 1.5;

		// Initialize transition
		this.isTransitioning = true;
		this.transitionStartTime = performance.now();
		this.transitionProgress = 0;
		this.currentAct = 0; // Special value for overview

		console.log("📷 Transitioning to overview position");
	}

	/**
	 * Calculate optimal camera distance for act
	 */
	public calculateOptimalDistance(actNumber: number): number {
		const bounds = LayoutHelper.getActBounds(actNumber);
		if (!bounds) return LAYOUT_CONFIG.spacing.cameraDistance;

		// Calculate bounding box dimensions
		const size = new THREE.Vector3();
		size.subVectors(bounds.max, bounds.min);

		// Use largest dimension to calculate distance
		const maxDimension = Math.max(size.x, size.y, size.z);
		const camera = this.camera as THREE.PerspectiveCamera;
		const fov = (camera.fov * Math.PI) / 180;
		const distance = (maxDimension / (2 * Math.tan(fov / 2))) * 1.2; // 20% padding

		return Math.max(distance, LAYOUT_CONFIG.spacing.cameraDistance);
	}

	/**
	 * Update layout configuration and recalculate positions
	 */
	public updateLayout(): void {
		console.log("📷 Camera controller updated for new layout");

		// If currently transitioning, restart with new target
		if (this.isTransitioning) {
			this.targetPosition.copy(LayoutHelper.getCameraPosition(this.currentAct));
			this.targetLookAt.copy(LayoutHelper.getCameraLookAt(this.currentAct));
		}
	}

	/**
	 * Set easing function
	 */
	public setEasing(easingName: string): void {
		if (this.easingFunctions[easingName]) {
			LAYOUT_CONFIG.camera.easing = easingName;
			console.log(`📷 Camera easing set to ${easingName}`);
		} else {
			console.warn(`📷 Unknown easing function: ${easingName}`);
		}
	}

	// Public getters for transition state
	public get isInTransition(): boolean {
		return this.isTransitioning;
	}

	public get transitionAmount(): number {
		return this.transitionProgress;
	}

	/**
	 * Cleanup
	 */
	public dispose(): void {
		this.stopTransition();
		this.onTransitionStart = null;
		this.onTransitionComplete = null;
		this.onTransitionUpdate = null;
	}
}
