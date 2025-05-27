/**
 * Act 4 - Stars: Expanding starfield, meditative drift, cosmic wonder
 *
 * Creates an infinite starfield that expands and contracts with audio,
 * representing the cosmic/universal conclusion of the performance.
 */

import * as THREE from "three";
import type { AudioAnalyzerInterface, AudioData } from "../types";
import { BaseAct } from "./BaseAct";

export class Act4Stars extends BaseAct {
	private starCount = 3000;
	private nebulaCount = 200;
	private starGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
	private nebulaGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
	private starMaterial: THREE.PointsMaterial = new THREE.PointsMaterial();
	private nebulaMaterial: THREE.PointsMaterial = new THREE.PointsMaterial();
	private originalPositions: Float32Array = new Float32Array(
		this.starCount * 3,
	);
	private nebulaPositions: Float32Array = new Float32Array(
		this.nebulaCount * 3,
	);
	private velocities: Float32Array = new Float32Array(this.starCount * 3);
	private nebulaColors: Float32Array = new Float32Array(this.nebulaCount * 3);
	private nebulaPhases: Float32Array = new Float32Array(this.nebulaCount);
	private initialCameraPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 60);
	private driftAmplitude = 5;
	private driftSpeed = 0.0001;

	protected async createContent(): Promise<void> {
		// Create star particles
		const starPositions = new Float32Array(this.starCount * 3);
		const starColors = new Float32Array(this.starCount * 3);

		for (let i = 0; i < this.starCount; i++) {
			// Spherical distribution for stars
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(Math.random() * 2 - 1);
			const radius = Math.random() ** 0.5 * 50; // Square root for more uniform distribution

			const x = radius * Math.sin(phi) * Math.cos(theta);
			const y = radius * Math.sin(phi) * Math.sin(theta);
			const z = radius * Math.cos(phi);

			const i3 = i * 3;
			starPositions[i3] = this.originalPositions[i3] = x;
			starPositions[i3 + 1] = this.originalPositions[i3 + 1] = y;
			starPositions[i3 + 2] = this.originalPositions[i3 + 2] = z;

			// Slightly varied star colors
			const colorTemp = Math.random();
			starColors[i3] = 1.0; // R
			starColors[i3 + 1] = 0.8 + colorTemp * 0.2; // G
			starColors[i3 + 2] = 0.7 + colorTemp * 0.3; // B

			// Initialize gentle outward velocities
			this.velocities[i3] = (Math.random() - 0.5) * 0.01;
			this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.01;
			this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.01;
		}

		// Create nebula particles
		const nebulaPositions = new Float32Array(this.nebulaCount * 3);

		for (let i = 0; i < this.nebulaCount; i++) {
			// Clustered distribution for nebulas
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(Math.random() * 2 - 1);
			const radius = Math.random() * 30;

			const i3 = i * 3;
			nebulaPositions[i3] = this.nebulaPositions[i3] =
				radius * Math.sin(phi) * Math.cos(theta);
			nebulaPositions[i3 + 1] = this.nebulaPositions[i3 + 1] =
				radius * Math.sin(phi) * Math.sin(theta);
			nebulaPositions[i3 + 2] = this.nebulaPositions[i3 + 2] =
				radius * Math.cos(phi);

			// Deep space colors for nebulas
			const hue = 0.6 + Math.random() * 0.1; // Blue to purple
			const saturation = 0.3 + Math.random() * 0.2;
			const lightness = 0.2 + Math.random() * 0.1;
			const color = new THREE.Color().setHSL(hue, saturation, lightness);

			this.nebulaColors[i3] = color.r;
			this.nebulaColors[i3 + 1] = color.g;
			this.nebulaColors[i3 + 2] = color.b;

			// Random phases for nebula movement
			this.nebulaPhases[i] = Math.random() * Math.PI * 2;
		}

		// Setup star material
		this.starGeometry.setAttribute(
			"position",
			new THREE.BufferAttribute(starPositions, 3),
		);
		this.starGeometry.setAttribute(
			"color",
			new THREE.BufferAttribute(starColors, 3),
		);

		this.starMaterial.size = 0.15;
		this.starMaterial.vertexColors = true;
		this.starMaterial.transparent = true;
		this.starMaterial.opacity = 0.8;
		this.starMaterial.blending = THREE.AdditiveBlending;
		this.starMaterial.depthWrite = false;

		// Setup nebula material
		this.nebulaGeometry.setAttribute(
			"position",
			new THREE.BufferAttribute(nebulaPositions, 3),
		);
		this.nebulaGeometry.setAttribute(
			"color",
			new THREE.BufferAttribute(this.nebulaColors, 3),
		);

		this.nebulaMaterial.size = 8.0;
		this.nebulaMaterial.vertexColors = true;
		this.nebulaMaterial.transparent = true;
		this.nebulaMaterial.opacity = 0.3;
		this.nebulaMaterial.blending = THREE.AdditiveBlending;
		this.nebulaMaterial.depthWrite = false;

		// Create and add particle systems
		const stars = new THREE.Points(this.starGeometry, this.starMaterial);
		const nebulas = new THREE.Points(this.nebulaGeometry, this.nebulaMaterial);

		this.particles.push(stars, nebulas);
		this.group.add(stars, nebulas);

		// Store materials for disposal
		this.materials.push(this.starMaterial, this.nebulaMaterial);
	}

	protected updateContent(deltaTime: number): void {
		if (this.particles.length === 0) return;

		const deltaSeconds = deltaTime / 1000;
		const starPositions = this.starGeometry.attributes.position
			.array as Float32Array;
		const nebulaPositions = this.nebulaGeometry.attributes.position
			.array as Float32Array;

		// Get audio levels for subtle reactivity
		const volume = this.getSmoothedAudio("volume", 0.3) ** 2; // Square for more subtlety
		const bassLevel = this.getSmoothedAudio("bass", 0.2) ** 2;

		// Update star positions with very gentle expansion
		for (let i = 0; i < this.starCount; i++) {
			const i3 = i * 3;

			// Extremely subtle expansion based on volume
			const expansionRate = 1.0 + volume * 0.1;

			starPositions[i3] += this.velocities[i3] * expansionRate;
			starPositions[i3 + 1] += this.velocities[i3 + 1] * expansionRate;
			starPositions[i3 + 2] += this.velocities[i3 + 2] * expansionRate;

			// Reset stars that drift too far, but with a gentler threshold
			const distance = Math.sqrt(
				starPositions[i3] * starPositions[i3] +
					starPositions[i3 + 1] * starPositions[i3 + 1] +
					starPositions[i3 + 2] * starPositions[i3 + 2],
			);

			if (distance > 70) {
				// Reset to near-center position with very slow velocity
				starPositions[i3] = this.originalPositions[i3] * 0.2;
				starPositions[i3 + 1] = this.originalPositions[i3 + 1] * 0.2;
				starPositions[i3 + 2] = this.originalPositions[i3 + 2] * 0.2;

				this.velocities[i3] = (Math.random() - 0.5) * 0.01;
				this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.01;
				this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.01;
			}
		}

		// Update nebula positions with very slow drift
		for (let i = 0; i < this.nebulaCount; i++) {
			const i3 = i * 3;

			// Update phase
			this.nebulaPhases[i] += deltaSeconds * 0.1;

			// Apply subtle orbital motion
			const radius = Math.sqrt(
				this.nebulaPositions[i3] * this.nebulaPositions[i3] +
					this.nebulaPositions[i3 + 1] * this.nebulaPositions[i3 + 1],
			);

			const angle = Math.atan2(
				this.nebulaPositions[i3 + 1],
				this.nebulaPositions[i3],
			);
			const newAngle = angle + deltaSeconds * 0.02;

			nebulaPositions[i3] = Math.cos(newAngle) * radius;
			nebulaPositions[i3 + 1] = Math.sin(newAngle) * radius;
			nebulaPositions[i3 + 2] =
				this.nebulaPositions[i3 + 2] + Math.sin(this.nebulaPhases[i]) * 0.02;
		}

		// Update geometry buffers
		this.starGeometry.attributes.position.needsUpdate = true;
		this.nebulaGeometry.attributes.position.needsUpdate = true;
	}

	protected updateVisualEffects(deltaTime: number): void {
		// Get audio levels for subtle visual effects
		const midLevel = this.getSmoothedAudio("mid", 0.2) ** 2;
		const trebleLevel = this.getSmoothedAudio("treble", 0.1) ** 2;
		const bassLevel = this.getSmoothedAudio("bass", 0.3) ** 2;

		// Subtle star brightness variation
		const starIntensity = 0.7 + trebleLevel * 0.3;
		this.starMaterial.opacity = 0.6 + midLevel * 0.4;

		// Even subtler nebula variations
		const nebulaIntensity = 0.2 + bassLevel * 0.1;
		this.nebulaMaterial.opacity = 0.2 + bassLevel * 0.15;
		this.nebulaMaterial.size = 8.0 + bassLevel * 2.0;
	}

	protected async animateEnter(): Promise<void> {
		return this.createFadeTransition(2000);
	}

	protected async animateExit(): Promise<void> {
		return this.createFadeTransition(2000);
	}
}
