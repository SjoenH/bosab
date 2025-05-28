/**
 * Act 3 - Human: Organic forms, poetry overlays, emotional visuals
 *
 * Creates flowing organic shapes that respond to emotional audio cues,
 * with poetry text overlays representing the human element.
 */

import * as THREE from "three";
import type { AudioAnalyzerInterface, AudioData } from "../types";
import { BaseAct } from "./BaseAct";

export class Act3Human extends BaseAct {
	private particleCount = 25000; // Much more particles for better definition
	private particleGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
	private particleMaterial: THREE.PointsMaterial = new THREE.PointsMaterial();
	private flowField: Float32Array = new Float32Array(25000 * 3);
	private velocities: Float32Array = new Float32Array(25000 * 3);
	private heartPhase = 0;
	private lastHeartbeat = 0;
	private heartbeatInterval = 800; // Base interval in ms (75 BPM)
	private heartCenter: THREE.Vector3 = new THREE.Vector3(0, 5, 0); // Move heart up for better framing
	private heartScale = 2; // Very small initial size
	private autoHeartbeat = true; // Enable automatic heartbeat
	private heartbeatCycle = 0; // Track the heartbeat cycle for lub-dub pattern
	private startupDelay = 3000; // Wait 3 seconds before starting heartbeat
	private actStartTime = 0; // Track when the act started

	private currentScale = 2;
	private targetScale = 2;
	private scaleVelocity = 0;
	private lastBeatTime = 0;
	private beatInterval = 800; // Will be dynamically updated based on music
	private beatHistory: number[] = [];
	private readonly MAX_BEAT_HISTORY = 10;

	protected async createContent(): Promise<void> {
		// Create particles in a planar distribution
		const positions = new Float32Array(this.particleCount * 3);

		for (let i = 0; i < this.particleCount; i++) {
			// Create particles in a wider circular distribution
			const angle = Math.random() * Math.PI * 2;
			const radius = Math.sqrt(Math.random()) * 4; // Adjusted radius

			// Create particles around the center (no vertical offset)
			const x = Math.cos(angle) * radius;
			const y = Math.sin(angle) * radius;
			const z = (Math.random() - 0.5) * 0.1; // Thinner depth

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
		this.particleMaterial.size = 0.05; // Smaller particles
		this.particleMaterial.color = new THREE.Color(0xff8866);
		this.particleMaterial.transparent = true;
		this.particleMaterial.opacity = 0.5; // More transparent
		this.particleMaterial.blending = THREE.AdditiveBlending; // Use additive blending
		this.particleMaterial.depthWrite = false;

		// Make particles circular
		const canvas = document.createElement("canvas");
		canvas.width = 32;
		canvas.height = 32;
		const context = canvas.getContext("2d");

		if (context) {
			// Draw a perfect circle
			context.clearRect(0, 0, 32, 32);
			context.fillStyle = "white";
			context.beginPath();
			context.arc(16, 16, 15, 0, Math.PI * 2);
			context.fill();

			const texture = new THREE.CanvasTexture(canvas);
			this.particleMaterial.map = texture;
		}

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

	private getHeartForce(pos: THREE.Vector3, heartbeatPulse: number, bassLevel: number): THREE.Vector3 {
		// Scale coordinates for heart equation
		const scaledX = pos.x * this.heartScale;
		const scaledY = pos.y * this.heartScale;

		// Calculate heart curve value with pulsing effect
		const pulseScale = 1 + heartbeatPulse * 0.15; // Heart expands with heartbeat
		const curveValue = (
			(scaledY / pulseScale - Math.sqrt(Math.abs((scaledX / pulseScale) * (scaledX / pulseScale)))) ** 2 +
			(scaledX / pulseScale) * (scaledX / pulseScale) - 1
		);

		// Define force magnitude based on position relative to heart boundary
		let forceMagnitude = 0;
		const boundaryWidth = 0.1 + bassLevel * 0.1;
		const distanceFromBoundary = Math.abs(curveValue);

		if (curveValue < -boundaryWidth) {
			// Inside heart: strong outward force
			forceMagnitude = 1.2 * (1 + heartbeatPulse); // Constant outward force
		} else if (curveValue > boundaryWidth) {
			// Outside heart: gentle outward push that fades with distance
			forceMagnitude = 0.3 * Math.exp(-distanceFromBoundary * 2) * (1 + bassLevel * 0.5);
		} else {
			// Near boundary: create flowing motion along the curve
			const tangentX = -2 * scaledX / pulseScale;
			const tangentY = -2 * (scaledY / pulseScale - Math.sqrt(Math.abs((scaledX / pulseScale) * (scaledX / pulseScale))));
			const tangent = new THREE.Vector3(tangentX, tangentY, 0).normalize();
			// Add slight outward component to tangential flow
			const normal = new THREE.Vector3(pos.x, pos.y, 0).normalize();
			return tangent.multiplyScalar(0.4).add(normal.multiplyScalar(0.2 * (1 + heartbeatPulse)));
		}

		// Calculate direction outward from heart center
		const direction = new THREE.Vector3(pos.x, pos.y, 0).normalize();

		// Return force vector with audio reactivity
		return direction.multiplyScalar(forceMagnitude);
	}

	protected updateContent(deltaTime: number): void {
		if (this.particles.length === 0) return;

		const deltaSeconds = deltaTime / 1000;
		const positions = this.particleGeometry.attributes.position.array as Float32Array;

		// Get audio data
		const volume = this.getSmoothedAudio("volume", 0.2);
		const bassLevel = this.getSmoothedAudio("bass", 0.3);
		const trebleLevel = this.getSmoothedAudio("treble", 0.15);

		// Beat detection and heart scaling
		const currentTime = this.time;
		const isBeat = bassLevel > 0.6 && (currentTime - this.lastBeatTime) > this.beatInterval * 0.5;

		if (isBeat) {
			// Record beat timing
			const beatDelta = currentTime - this.lastBeatTime;
			this.lastBeatTime = currentTime;

			// Update beat history for BPM calculation
			this.beatHistory.push(beatDelta);
			if (this.beatHistory.length > this.MAX_BEAT_HISTORY) {
				this.beatHistory.shift();
			}

			// Calculate new beat interval (average of recent beats)
			if (this.beatHistory.length > 2) {
				this.beatInterval = this.beatHistory.reduce((a, b) => a + b, 0) / this.beatHistory.length;
			}

			// Trigger heart expansion on beat
			this.targetScale = 2.3 + bassLevel * 0.4;
			this.scaleVelocity += 1.2; // Increased expansion force
		}

		// Smooth scale animation
		const scaleForce = (this.targetScale - this.currentScale) * 8; // Increased spring force
		this.scaleVelocity += scaleForce * deltaSeconds;
		this.scaleVelocity *= 0.92; // Stronger damping
		this.currentScale += this.scaleVelocity * deltaSeconds;

		// Gradually return to base scale
		this.targetScale += (2 - this.targetScale) * deltaSeconds * 3;

		// Update heart scale for force calculations
		this.heartScale = this.currentScale;

		// Update particles with improved fluid motion
		const temp = new THREE.Vector3();

		for (let i = 0; i < this.particleCount; i++) {
			const i3 = i * 3;

			temp.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);

			// Calculate heart force with scaling pulse
			const force = this.getHeartForce(temp, Math.abs(this.scaleVelocity) * 2, bassLevel);

			// Add some noise modulated by treble
			const noiseScale = 0.02 * (1 + trebleLevel); // Increased noise
			const noiseX = (Math.random() - 0.5) * noiseScale;
			const noiseY = (Math.random() - 0.5) * noiseScale;

			// Apply force with scale-based boost
			const scaleBoost = 1 + Math.abs(this.scaleVelocity) * 4; // Increased scale boost
			this.velocities[i3] += force.x * 5 * scaleBoost + noiseX; // Increased base force
			this.velocities[i3 + 1] += force.y * 5 * scaleBoost + noiseY;
			this.velocities[i3 + 2] = 0;

			// Apply velocity with volume-based damping
			positions[i3] += this.velocities[i3] * deltaSeconds * 60;
			positions[i3 + 1] += this.velocities[i3 + 1] * deltaSeconds * 60;
			positions[i3 + 2] = this.flowField[i3 + 2];

			// Dynamic damping
			const dampingFactor = 0.96; // Reduced damping for more movement
			this.velocities[i3] *= dampingFactor;
			this.velocities[i3 + 1] *= dampingFactor;

			// Weaker return force for more freedom of movement
			const returnForce = 0.01 * (1 - bassLevel * 0.5);
			positions[i3] += (this.flowField[i3] - positions[i3]) * returnForce * deltaSeconds;
			positions[i3 + 1] += (this.flowField[i3 + 1] - positions[i3 + 1]) * returnForce * deltaSeconds;
		}

		this.particleGeometry.attributes.position.needsUpdate = true;
	}

	protected updateVisualEffects(deltaTime: number): void {
		// Get audio levels
		const midLevel = this.getSmoothedAudio("mid", 0.2);
		const volume = this.getSmoothedAudio("volume", 0.1);
		const trebleLevel = this.getSmoothedAudio("treble", 0.15);
		const bassLevel = this.getSmoothedAudio("bass", 0.3);

		// Calculate intensity based on current scale animation
		const scaleIntensity = Math.abs(this.scaleVelocity) * 2;

		// Warm color palette with enhanced contrast
		const hue = 0.02 + midLevel * 0.03 - scaleIntensity * 0.02; // Keep the warm human tone
		const saturation = 0.8 + volume * 0.2 + scaleIntensity * 0.3; // Increased base saturation
		const lightness = 0.55 + trebleLevel * 0.2 + scaleIntensity * 0.15; // Brighter with more dynamic range

		// Update particle colors
		this.particleMaterial.color.setHSL(hue, saturation, lightness);

		// Dynamic opacity and size based on scale
		const expansionBoost = Math.max(0, this.scaleVelocity) * 0.5;
		this.particleMaterial.opacity = 0.5 + volume * 0.2 + expansionBoost;

		// Particle size reacts to scale velocity and audio
		const baseSize = 0.05; // Smaller base size
		const audioSize = bassLevel * 0.03 + trebleLevel * 0.02;
		const pulseSize = Math.abs(this.scaleVelocity) * 0.1;
		this.particleMaterial.size = baseSize + audioSize + pulseSize;
	}

	protected async animateEnter(): Promise<void> {
		return this.createFadeTransition(1000);
	}

	protected async animateExit(): Promise<void> {
		return this.createFadeTransition(1000);
	}

	update(audioData: AudioData, deltaTime: number) {
		// Call parent update to process audio
		super.update(audioData, deltaTime);
	}
}
