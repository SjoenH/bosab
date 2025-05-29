/**
 * Act 3 - Human: Organic forms, poetry overlays, emotional visuals
 *
 * Creates flowing organic shapes that respond to emotional audio cues,
 * with poetry text overlays representing the human element.
 */

import * as THREE from "three";
import type { AudioData } from "../types"; // Import the correct AudioData type
import { TextureUtils } from "../utils/TextureUtils";
import { BaseAct } from "./BaseAct";

export class Act3Human extends BaseAct {
	// Particle System Constants
	private readonly PARTICLE_COUNT = 25000;
	private readonly PARTICLE_INITIAL_RADIUS_FACTOR = 4;
	private readonly PARTICLE_INITIAL_DEPTH_FACTOR = 0.1;
	private readonly PARTICLE_MATERIAL_SIZE = 0.05;
	private readonly PARTICLE_MATERIAL_COLOR = 0xff8866;
	private readonly PARTICLE_MATERIAL_OPACITY = 0.5;
	private readonly PARTICLE_CANVAS_SIZE = 32;
	private readonly PARTICLE_CANVAS_CIRCLE_RADIUS = 15;

	// Heartbeat and Scaling Constants
	private readonly HEART_CENTER_Y = 5;
	private readonly INITIAL_HEART_SCALE = 2;
	private readonly STARTUP_DELAY_MS = 3000;
	private readonly MAX_BEAT_HISTORY_COUNT = 10;
	private readonly BEAT_BASS_THRESHOLD = 0.6;
	private readonly BEAT_INTERVAL_FACTOR_FOR_DETECTION = 0.5;
	private readonly TARGET_SCALE_BASE = 2.3;
	private readonly TARGET_SCALE_BASS_FACTOR = 0.4;
	private readonly SCALE_VELOCITY_ON_BEAT_INCREASE = 1.2;
	private readonly SCALE_SPRING_FORCE_FACTOR = 8;
	private readonly SCALE_DAMPING_FACTOR = 0.92;
	private readonly TARGET_SCALE_RETURN_BASE = 2;
	private readonly TARGET_SCALE_RETURN_SPEED_FACTOR = 3;

	// Force Calculation Constants
	private readonly HEART_FORCE_PULSE_SCALE_FACTOR = 0.15;
	private readonly HEART_FORCE_BOUNDARY_WIDTH_BASE = 0.1;
	private readonly HEART_FORCE_BOUNDARY_WIDTH_BASS_FACTOR = 0.1;
	private readonly HEART_FORCE_INSIDE_MAGNITUDE_BASE = 1.2;
	private readonly HEART_FORCE_OUTSIDE_MAGNITUDE_BASE = 0.3;
	private readonly HEART_FORCE_OUTSIDE_DECAY_FACTOR = 2;
	private readonly HEART_FORCE_OUTSIDE_BASS_FACTOR = 0.5;
	private readonly HEART_FORCE_TANGENT_FLOW_MAGNITUDE = 0.4;
	private readonly HEART_FORCE_NORMAL_FLOW_MAGNITUDE = 0.2;
	private readonly PARTICLE_NOISE_SCALE_BASE = 0.02;
	private readonly PARTICLE_FORCE_APPLICATION_BASE_FACTOR = 5;
	private readonly PARTICLE_VELOCITY_APPLICATION_DELTA_FACTOR = 60;
	private readonly PARTICLE_VELOCITY_DAMPING_FACTOR = 0.96;
	private readonly PARTICLE_RETURN_FORCE_BASE = 0.01;
	private readonly PARTICLE_RETURN_FORCE_BASS_FACTOR = 0.5;

	// Visual Effects Constants
	private readonly VISUAL_HUE_BASE = 0.02;
	private readonly VISUAL_HUE_MID_FACTOR = 0.03;
	private readonly VISUAL_HUE_SCALE_INTENSITY_FACTOR = -0.02;
	private readonly VISUAL_SATURATION_BASE = 0.8;
	private readonly VISUAL_SATURATION_VOLUME_FACTOR = 0.2;
	private readonly VISUAL_SATURATION_SCALE_INTENSITY_FACTOR = 0.3;
	private readonly VISUAL_LIGHTNESS_BASE = 0.55;
	private readonly VISUAL_LIGHTNESS_TREBLE_FACTOR = 0.2;
	private readonly VISUAL_LIGHTNESS_SCALE_INTENSITY_FACTOR = 0.15;
	private readonly VISUAL_OPACITY_BASE = 0.5;
	private readonly VISUAL_OPACITY_VOLUME_FACTOR = 0.2;
	private readonly VISUAL_OPACITY_EXPANSION_BOOST_FACTOR = 0.5;
	private readonly VISUAL_SIZE_BASE = 0.05;
	private readonly VISUAL_SIZE_BASS_FACTOR = 0.03;
	private readonly VISUAL_SIZE_TREBLE_FACTOR = 0.02;
	private readonly VISUAL_SIZE_PULSE_FACTOR = 0.1;

	// Audio Smoothing Factors
	private readonly AUDIO_VOLUME_SMOOTHING = 0.2;
	private readonly AUDIO_BASS_SMOOTHING = 0.3;
	private readonly AUDIO_TREBLE_SMOOTHING = 0.15;
	private readonly AUDIO_MID_SMOOTHING_EFFECTS = 0.2;
	private readonly AUDIO_VOLUME_SMOOTHING_EFFECTS = 0.1;

	// Animation Constants
	private readonly FADE_TRANSITION_DURATION = 1000;

	private particleCount = this.PARTICLE_COUNT;
	private particleGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
	private particleMaterial: THREE.PointsMaterial = new THREE.PointsMaterial();
	private flowField: Float32Array = new Float32Array(25000 * 3);
	private velocities: Float32Array = new Float32Array(this.PARTICLE_COUNT * 3);
	private heartPhase = 0;
	private lastHeartbeat = 0;
	private heartbeatInterval = 800; // Base interval in ms (75 BPM) - Note: beatInterval is dynamic
	private heartCenter: THREE.Vector3 = new THREE.Vector3(
		0,
		this.HEART_CENTER_Y,
		0,
	);
	private heartScale = this.INITIAL_HEART_SCALE;
	private autoHeartbeat = true; // Enable automatic heartbeat - Not directly used with new beat detection
	private heartbeatCycle = 0; // Track the heartbeat cycle for lub-dub pattern - Not directly used
	private startupDelay = this.STARTUP_DELAY_MS;
	private actStartTime = 0; // Track when the act started

	private currentScale = this.INITIAL_HEART_SCALE;
	private targetScale = this.INITIAL_HEART_SCALE;
	private scaleVelocity = 0;
	private lastBeatTime = 0;
	private beatInterval = 800; // Will be dynamically updated based on music
	private beatHistory: number[] = [];
	private readonly MAX_BEAT_HISTORY = this.MAX_BEAT_HISTORY_COUNT;

	protected async createContent(): Promise<void> {
		// Create particles in a planar distribution
		const positions = new Float32Array(this.particleCount * 3);

		for (let i = 0; i < this.particleCount; i++) {
			// Create particles in a wider circular distribution
			const angle = Math.random() * Math.PI * 2;
			const radius =
				Math.sqrt(Math.random()) * this.PARTICLE_INITIAL_RADIUS_FACTOR;

			// Create particles around the center (no vertical offset)
			const x = Math.cos(angle) * radius;
			const y = Math.sin(angle) * radius;
			const z = (Math.random() - 0.5) * this.PARTICLE_INITIAL_DEPTH_FACTOR;

			positions[i * 3] = x;
			positions[i * 3 + 1] = y;
			positions[i * 3 + 2] = z;

			// Initialize flow field and velocities
			this.flowField[i * 3] = x;
			this.flowField[i * 3 + 1] = y;
			this.flowField[i * 3 + 2] = z;

			this.velocities[i * 3] = 0;
			this.velocities[i * 3 + 1] = 0;
			this.velocities[i * 3 + 2] = 0;
		}

		this.particleGeometry.setAttribute(
			"position",
			new THREE.BufferAttribute(positions, 3),
		);

		// Configure particles
		this.particleMaterial.size = this.PARTICLE_MATERIAL_SIZE;
		this.particleMaterial.color = new THREE.Color(this.PARTICLE_MATERIAL_COLOR);
		this.particleMaterial.transparent = true;
		this.particleMaterial.opacity = this.PARTICLE_MATERIAL_OPACITY;
		this.particleMaterial.blending = THREE.AdditiveBlending; // Use additive blending
		this.particleMaterial.depthWrite = false;

		// Make particles circular
		const particleTexture = TextureUtils.createRadialGradientTexture(
			this.PARTICLE_CANVAS_SIZE,
			this.PARTICLE_CANVAS_SIZE / 2,
			[
				[0, "rgba(255, 255, 255, 1)"], // Solid center
				[0.5, "rgba(255, 255, 255, 0.8)"], // Feathered edge
				[1, "rgba(255, 255, 255, 0)"], // Transparent outer edge
			],
		);
		this.particleMaterial.map = particleTexture;

		// Create and add particles
		this.particles.push(
			new THREE.Points(this.particleGeometry, this.particleMaterial),
		);
		this.group.add(this.particles[0]);

		// Add ambient light for general illumination
		const ambientLight = new THREE.AmbientLight(0x443333, 1);
		this.group.add(ambientLight);

		// Store materials for disposal
		this.materials.push(this.particleMaterial);

		// Record start time for startup delay
		this.actStartTime = performance.now();
	}

	private getHeartForce(
		pos: THREE.Vector3,
		heartbeatPulse: number,
		bassLevel: number,
	): THREE.Vector3 {
		// Scale coordinates for heart equation
		const scaledX = pos.x * this.heartScale;
		const scaledY = pos.y * this.heartScale;

		// Calculate heart curve value with pulsing effect
		const pulseScale = 1 + heartbeatPulse * this.HEART_FORCE_PULSE_SCALE_FACTOR; // Heart expands with heartbeat
		const curveValue =
			(scaledY / pulseScale -
				Math.sqrt(Math.abs((scaledX / pulseScale) * (scaledX / pulseScale)))) **
				2 +
			(scaledX / pulseScale) * (scaledX / pulseScale) -
			1;

		// Define force magnitude based on position relative to heart boundary
		let forceMagnitude = 0;
		const boundaryWidth =
			this.HEART_FORCE_BOUNDARY_WIDTH_BASE +
			bassLevel * this.HEART_FORCE_BOUNDARY_WIDTH_BASS_FACTOR;
		const distanceFromBoundary = Math.abs(curveValue);

		if (curveValue < -boundaryWidth) {
			// Inside heart: strong outward force
			forceMagnitude =
				this.HEART_FORCE_INSIDE_MAGNITUDE_BASE * (1 + heartbeatPulse); // Constant outward force
		} else if (curveValue > boundaryWidth) {
			// Outside heart: gentle outward push that fades with distance
			forceMagnitude =
				this.HEART_FORCE_OUTSIDE_MAGNITUDE_BASE *
				Math.exp(
					-distanceFromBoundary * this.HEART_FORCE_OUTSIDE_DECAY_FACTOR,
				) *
				(1 + bassLevel * this.HEART_FORCE_OUTSIDE_BASS_FACTOR);
		} else {
			// Near boundary: create flowing motion along the curve
			const tangentX = (-2 * scaledX) / pulseScale;
			const tangentY =
				-2 *
				(scaledY / pulseScale -
					Math.sqrt(Math.abs((scaledX / pulseScale) * (scaledX / pulseScale))));
			const tangent = new THREE.Vector3(tangentX, tangentY, 0).normalize();
			// Add slight outward component to tangential flow
			const normal = new THREE.Vector3(pos.x, pos.y, 0).normalize();
			return tangent
				.multiplyScalar(this.HEART_FORCE_TANGENT_FLOW_MAGNITUDE)
				.add(
					normal.multiplyScalar(
						this.HEART_FORCE_NORMAL_FLOW_MAGNITUDE * (1 + heartbeatPulse),
					),
				);
		}

		// Calculate direction outward from heart center
		const direction = new THREE.Vector3(pos.x, pos.y, 0).normalize();

		// Return force vector with audio reactivity
		return direction.multiplyScalar(forceMagnitude);
	}

	protected updateContent(deltaTime: number): void {
		if (this.particles.length === 0) return;

		const deltaSeconds = deltaTime / 1000;
		const positions = this.particleGeometry.attributes.position
			.array as Float32Array;

		// Get audio data
		const volume = this.getSmoothedAudio("volume", this.AUDIO_VOLUME_SMOOTHING);
		const bassLevel = this.getSmoothedAudio("bass", this.AUDIO_BASS_SMOOTHING);
		const trebleLevel = this.getSmoothedAudio(
			"treble",
			this.AUDIO_TREBLE_SMOOTHING,
		);

		// Beat detection and heart scaling
		const currentTime = this.time;
		const isBeat =
			bassLevel > this.BEAT_BASS_THRESHOLD &&
			currentTime - this.lastBeatTime >
				this.beatInterval * this.BEAT_INTERVAL_FACTOR_FOR_DETECTION;

		if (isBeat) {
			// Record beat timing
			const beatDelta = currentTime - this.lastBeatTime;
			this.lastBeatTime = currentTime;

			// Update beat history for BPM calculation
			this.beatHistory.push(beatDelta);
			if (this.beatHistory.length > this.MAX_BEAT_HISTORY_COUNT) {
				this.beatHistory.shift();
			}

			// Calculate new beat interval (average of recent beats)
			if (this.beatHistory.length > 2) {
				this.beatInterval =
					this.beatHistory.reduce((a, b) => a + b, 0) / this.beatHistory.length;
			}

			// Trigger heart expansion on beat
			this.targetScale =
				this.TARGET_SCALE_BASE + bassLevel * this.TARGET_SCALE_BASS_FACTOR;
			this.scaleVelocity += this.SCALE_VELOCITY_ON_BEAT_INCREASE; // Increased expansion force
		}

		// Smooth scale animation
		const scaleForce =
			(this.targetScale - this.currentScale) * this.SCALE_SPRING_FORCE_FACTOR; // Increased spring force
		this.scaleVelocity += scaleForce * deltaSeconds;
		this.scaleVelocity *= this.SCALE_DAMPING_FACTOR; // Stronger damping
		this.currentScale += this.scaleVelocity * deltaSeconds;

		// Gradually return to base scale
		this.targetScale +=
			(this.TARGET_SCALE_RETURN_BASE - this.targetScale) *
			deltaSeconds *
			this.TARGET_SCALE_RETURN_SPEED_FACTOR;

		// Update heart scale for force calculations
		this.heartScale = this.currentScale;

		// Update particles with improved fluid motion
		const temp = new THREE.Vector3();

		for (let i = 0; i < this.particleCount; i++) {
			const i3 = i * 3;

			temp.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);

			// Calculate heart force with scaling pulse
			const force = this.getHeartForce(
				temp,
				Math.abs(this.scaleVelocity) * 2,
				bassLevel,
			);

			// Add some noise modulated by treble
			const noiseScale = this.PARTICLE_NOISE_SCALE_BASE * (1 + trebleLevel); // Increased noise
			const noiseX = (Math.random() - 0.5) * noiseScale;
			const noiseY = (Math.random() - 0.5) * noiseScale;

			// Apply force with scale-based boost
			const scaleBoost = 1 + Math.abs(this.scaleVelocity) * 4; // Increased scale boost
			this.velocities[i3] +=
				force.x * this.PARTICLE_FORCE_APPLICATION_BASE_FACTOR * scaleBoost +
				noiseX; // Increased base force
			this.velocities[i3 + 1] +=
				force.y * this.PARTICLE_FORCE_APPLICATION_BASE_FACTOR * scaleBoost +
				noiseY;
			this.velocities[i3 + 2] = 0;

			// Apply velocity with volume-based damping
			positions[i3] +=
				this.velocities[i3] *
				deltaSeconds *
				this.PARTICLE_VELOCITY_APPLICATION_DELTA_FACTOR;
			positions[i3 + 1] +=
				this.velocities[i3 + 1] *
				deltaSeconds *
				this.PARTICLE_VELOCITY_APPLICATION_DELTA_FACTOR;
			positions[i3 + 2] = this.flowField[i3 + 2];

			// Dynamic damping
			const dampingFactor = this.PARTICLE_VELOCITY_DAMPING_FACTOR; // Reduced damping for more movement
			this.velocities[i3] *= dampingFactor;
			this.velocities[i3 + 1] *= dampingFactor;

			// Weaker return force for more freedom of movement
			const returnForce =
				this.PARTICLE_RETURN_FORCE_BASE *
				(1 - bassLevel * this.PARTICLE_RETURN_FORCE_BASS_FACTOR);
			positions[i3] +=
				(this.flowField[i3] - positions[i3]) * returnForce * deltaSeconds;
			positions[i3 + 1] +=
				(this.flowField[i3 + 1] - positions[i3 + 1]) *
				returnForce *
				deltaSeconds;
		}

		this.particleGeometry.attributes.position.needsUpdate = true;
	}

	protected updateVisualEffects(deltaTime: number): void {
		// Get audio levels
		const midLevel = this.getSmoothedAudio(
			"mid",
			this.AUDIO_MID_SMOOTHING_EFFECTS,
		);
		const volume = this.getSmoothedAudio(
			"volume",
			this.AUDIO_VOLUME_SMOOTHING_EFFECTS,
		);
		const trebleLevel = this.getSmoothedAudio(
			"treble",
			this.AUDIO_TREBLE_SMOOTHING,
		);
		const bassLevel = this.getSmoothedAudio("bass", this.AUDIO_BASS_SMOOTHING);

		// Calculate intensity based on current scale animation
		const scaleIntensity = Math.abs(this.scaleVelocity) * 2;

		// Warm color palette with enhanced contrast
		const hue =
			this.VISUAL_HUE_BASE +
			midLevel * this.VISUAL_HUE_MID_FACTOR +
			scaleIntensity * this.VISUAL_HUE_SCALE_INTENSITY_FACTOR; // Keep the warm human tone
		const saturation =
			this.VISUAL_SATURATION_BASE +
			volume * this.VISUAL_SATURATION_VOLUME_FACTOR +
			scaleIntensity * this.VISUAL_SATURATION_SCALE_INTENSITY_FACTOR; // Increased base saturation
		const lightness =
			this.VISUAL_LIGHTNESS_BASE +
			trebleLevel * this.VISUAL_LIGHTNESS_TREBLE_FACTOR +
			scaleIntensity * this.VISUAL_LIGHTNESS_SCALE_INTENSITY_FACTOR; // Brighter with more dynamic range

		// Update particle colors
		this.particleMaterial.color.setHSL(hue, saturation, lightness);

		// Dynamic opacity and size based on scale
		const expansionBoost =
			Math.max(0, this.scaleVelocity) *
			this.VISUAL_OPACITY_EXPANSION_BOOST_FACTOR;
		this.particleMaterial.opacity =
			this.VISUAL_OPACITY_BASE +
			volume * this.VISUAL_OPACITY_VOLUME_FACTOR +
			expansionBoost;

		// Particle size reacts to scale velocity and audio
		const baseSize = this.VISUAL_SIZE_BASE; // Smaller base size
		const audioSize =
			bassLevel * this.VISUAL_SIZE_BASS_FACTOR +
			trebleLevel * this.VISUAL_SIZE_TREBLE_FACTOR;
		const pulseSize =
			Math.abs(this.scaleVelocity) * this.VISUAL_SIZE_PULSE_FACTOR;
		this.particleMaterial.size = baseSize + audioSize + pulseSize;
	}

	protected async animateEnter(): Promise<void> {
		return this.createFadeTransition(this.FADE_TRANSITION_DURATION);
	}

	protected async animateExit(): Promise<void> {
		return this.createFadeTransition(this.FADE_TRANSITION_DURATION);
	}

	update(audioData: AudioData, deltaTime: number) {
		// Call parent update to process audio
		super.update(audioData, deltaTime);
	}
}
