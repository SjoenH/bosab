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
	private nebulaCount = 800; // Increased for more smoke-like effect
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
			// Spherical distribution for stars - now more spread out and further back
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(Math.random() * 2 - 1);
			const radius = (Math.random() ** 0.5 * 100) + 50; // Pushed back and spread out more

			const x = radius * Math.sin(phi) * Math.cos(theta);
			const y = radius * Math.sin(phi) * Math.sin(theta);
			const z = radius * Math.cos(phi);

			const i3 = i * 3;
			starPositions[i3] = this.originalPositions[i3] = x;
			starPositions[i3 + 1] = this.originalPositions[i3 + 1] = y;
			starPositions[i3 + 2] = this.originalPositions[i3 + 2] = z;

			// More subtle star colors
			const colorTemp = Math.random() * 0.3; // Reduced color variation
			starColors[i3] = 0.8 + colorTemp * 0.2; // R - more subtle white
			starColors[i3 + 1] = 0.8 + colorTemp * 0.2; // G
			starColors[i3 + 2] = 0.8 + colorTemp * 0.2; // B
		}

		// Create nebula particles
		const nebulaPositions = new Float32Array(this.nebulaCount * 3);

		for (let i = 0; i < this.nebulaCount; i++) {
			// More spread out distribution for nebulas
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(Math.random() * 2 - 1);
			const radius = Math.random() * 40 + 10; // More spread out

			const i3 = i * 3;
			nebulaPositions[i3] = this.nebulaPositions[i3] =
				radius * Math.sin(phi) * Math.cos(theta);
			nebulaPositions[i3 + 1] = this.nebulaPositions[i3 + 1] =
				radius * Math.sin(phi) * Math.sin(theta);
			nebulaPositions[i3 + 2] = this.nebulaPositions[i3 + 2] =
				radius * Math.cos(phi);

			// More subtle nebula colors
			const hue = 0.6 + Math.random() * 0.1; // Blue to purple
			const saturation = 0.2 + Math.random() * 0.15; // Reduced saturation
			const lightness = 0.1 + Math.random() * 0.08; // Darker
			const color = new THREE.Color().setHSL(hue, saturation, lightness);

			this.nebulaColors[i3] = color.r;
			this.nebulaColors[i3 + 1] = color.g;
			this.nebulaColors[i3 + 2] = color.b;

			// Random phases for very subtle nebula movement
			this.nebulaPhases[i] = Math.random() * Math.PI * 2;
		}

		// Setup star material with circular texture
		const starCanvas = document.createElement('canvas');
		const starCtx = starCanvas.getContext('2d');
		if (!starCtx) throw new Error('Could not create 2D context for star texture');
		starCanvas.width = starCanvas.height = 32;
		const gradient = starCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
		gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
		gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
		starCtx.fillStyle = gradient;
		starCtx.fillRect(0, 0, 32, 32);
		const starTexture = new THREE.CanvasTexture(starCanvas);

		this.starGeometry.setAttribute(
			"position",
			new THREE.BufferAttribute(starPositions, 3),
		);
		this.starGeometry.setAttribute(
			"color",
			new THREE.BufferAttribute(starColors, 3),
		);

		this.starMaterial.size = 0.8;
		this.starMaterial.vertexColors = true;
		this.starMaterial.transparent = true;
		this.starMaterial.opacity = 0.6;
		this.starMaterial.blending = THREE.AdditiveBlending;
		this.starMaterial.depthWrite = false;
		this.starMaterial.map = starTexture;

		// Setup nebula material with larger, softer circular texture
		const nebulaCanvas = document.createElement('canvas');
		const nebulaCtx = nebulaCanvas.getContext('2d');
		if (!nebulaCtx) throw new Error('Could not create 2D context for nebula texture');
		nebulaCanvas.width = nebulaCanvas.height = 64;
		const nebulaGradient = nebulaCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
		nebulaGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
		nebulaGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
		nebulaGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
		nebulaCtx.fillStyle = nebulaGradient;
		nebulaCtx.fillRect(0, 0, 64, 64);
		const nebulaTexture = new THREE.CanvasTexture(nebulaCanvas);

		this.nebulaGeometry.setAttribute(
			"position",
			new THREE.BufferAttribute(nebulaPositions, 3),
		);
		this.nebulaGeometry.setAttribute(
			"color",
			new THREE.BufferAttribute(this.nebulaColors, 3),
		);

		this.nebulaMaterial.size = 12.0;
		this.nebulaMaterial.vertexColors = true;
		this.nebulaMaterial.transparent = true;
		this.nebulaMaterial.opacity = 0.15;
		this.nebulaMaterial.blending = THREE.AdditiveBlending;
		this.nebulaMaterial.depthWrite = false;
		this.nebulaMaterial.map = nebulaTexture;

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
		const nebulaPositions = this.nebulaGeometry.attributes.position
			.array as Float32Array;

		// Get audio levels for subtle reactivity
		const volume = this.getSmoothedAudio("volume", 0.3) ** 2; // Square for more subtlety
		const bassLevel = this.getSmoothedAudio("bass", 0.2) ** 2;

		// Update nebula positions with extremely subtle drift
		for (let i = 0; i < this.nebulaCount; i++) {
			const i3 = i * 3;

			// Update phase with very slow movement
			this.nebulaPhases[i] += deltaSeconds * 0.05;

			// Apply extremely subtle vertical drift
			const driftAmount = Math.sin(this.nebulaPhases[i]) * 0.01;
			nebulaPositions[i3 + 2] = this.nebulaPositions[i3 + 2] + driftAmount;
		}

		// Update geometry buffer for nebulas only
		this.nebulaGeometry.attributes.position.needsUpdate = true;
	}

	protected updateVisualEffects(deltaTime: number): void {
		// Get audio levels for subtle visual effects
		const midLevel = this.getSmoothedAudio("mid", 0.2) ** 2;
		const trebleLevel = this.getSmoothedAudio("treble", 0.1) ** 2;
		const bassLevel = this.getSmoothedAudio("bass", 0.3) ** 2;
		const volume = this.getSmoothedAudio("volume", 0.3) ** 2;

		// Very subtle star size and brightness variation with treble
		const starBaseSize = 0.8;
		this.starMaterial.size = starBaseSize + (trebleLevel * 0.4);
		this.starMaterial.opacity = 0.4 + (trebleLevel * 0.3);

		// Nebula response to bass and mid frequencies
		const nebulaBaseSize = 12.0;
		this.nebulaMaterial.size = nebulaBaseSize + (bassLevel * 4.0);
		this.nebulaMaterial.opacity = 0.15 + (bassLevel * 0.1) + (midLevel * 0.05);

		// Overall intensity boost with volume
		const globalBoost = 1.0 + (volume * 0.2);
		this.starMaterial.size *= globalBoost;
		this.nebulaMaterial.size *= globalBoost;
	}

	protected async animateEnter(): Promise<void> {
		return this.createFadeTransition(2000);
	}

	protected async animateExit(): Promise<void> {
		return this.createFadeTransition(2000);
	}
}
