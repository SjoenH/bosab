/**
 * Act 4 - Stars: Expanding starfield, meditative drift, cosmic wonder
 *
 * Creates an infinite starfield that expands and contracts with audio,
 * representing the cosmic/universal conclusion of the performance.
 */

import * as THREE from "three";
import { TextureUtils } from "../utils/TextureUtils";
import { BaseAct } from "./BaseAct";

export class Act4Stars extends BaseAct {
	// Particle Counts
	private readonly STAR_COUNT = 3000;
	private readonly NEBULA_COUNT = 800;

	// Star Generation Parameters
	private readonly STAR_RADIUS_MIN = 50;
	private readonly STAR_RADIUS_RANGE = 100;
	private readonly STAR_RADIUS_POWER = 0.5;
	private readonly STAR_COLOR_TEMP_MAX = 0.35;
	private readonly STAR_COLOR_BASE_BRIGHTNESS = 0.9;
	private readonly STAR_COLOR_TEMP_FACTOR = 0.2;

	// Nebula Generation Parameters
	private readonly NEBULA_RADIUS_MIN = 10;
	private readonly NEBULA_RADIUS_RANGE = 40;
	private readonly NEBULA_HUE_BASE = 0.6;
	private readonly NEBULA_HUE_RANGE = 0.1;
	private readonly NEBULA_SATURATION_BASE = 0.2;
	private readonly NEBULA_SATURATION_RANGE = 0.15;
	private readonly NEBULA_LIGHTNESS_BASE = 0.1;
	private readonly NEBULA_LIGHTNESS_RANGE = 0.08;

	// Texture Generation Parameters
	private readonly STAR_TEXTURE_CANVAS_SIZE = 32;
	private readonly STAR_TEXTURE_GRADIENT_CENTER = 16;
	private readonly NEBULA_TEXTURE_CANVAS_SIZE = 64;
	private readonly NEBULA_TEXTURE_GRADIENT_CENTER = 32;
	private readonly NEBULA_GRADIENT_STOP_0_ALPHA = 0.5;
	private readonly NEBULA_GRADIENT_STOP_1_POS = 0.5;
	private readonly NEBULA_GRADIENT_STOP_1_ALPHA = 0.15;

	// Material Base Properties
	private readonly STAR_MATERIAL_BASE_SIZE = 0.8;
	private readonly STAR_MATERIAL_BASE_OPACITY = 0.6;
	private readonly NEBULA_MATERIAL_BASE_SIZE = 12.0;
	private readonly NEBULA_MATERIAL_BASE_OPACITY = 0.15;

	// Animation & Reactivity Parameters
	private readonly INITIAL_CAMERA_Z = 60;
	private readonly CAMERA_DRIFT_AMPLITUDE = 5; // Not currently used in update, but kept for potential future use
	private readonly CAMERA_DRIFT_SPEED = 0.0001; // Not currently used in update, but kept for potential future use
	private readonly AUDIO_SMOOTH_VOLUME_CONTENT = 0.3;
	private readonly AUDIO_SMOOTH_BASS_CONTENT = 0.2;
	private readonly NEBULA_PHASE_SPEED_FACTOR = 0.05;
	private readonly NEBULA_DRIFT_AMOUNT_FACTOR = 0.01;

	// Visual Effects Parameters
	private readonly AUDIO_SMOOTH_MID_EFFECTS = 0.2;
	private readonly AUDIO_SMOOTH_TREBLE_EFFECTS = 0.1;
	private readonly AUDIO_SMOOTH_BASS_EFFECTS = 0.3;
	private readonly AUDIO_SMOOTH_VOLUME_EFFECTS = 0.3;
	private readonly STAR_SIZE_TREBLE_FACTOR = 0.4;
	private readonly STAR_OPACITY_TREBLE_FACTOR = 0.3;
	private readonly STAR_BASE_OPACITY_EFFECT = 0.4; // Renamed to avoid conflict with material base
	private readonly NEBULA_SIZE_BASS_FACTOR = 4.0;
	private readonly NEBULA_OPACITY_BASS_FACTOR = 0.1;
	private readonly NEBULA_OPACITY_MID_FACTOR = 0.05;
	private readonly GLOBAL_BOOST_VOLUME_FACTOR = 0.2;

	// Transition Durations
	private readonly FADE_TRANSITION_DURATION_MS = 2000;

	private starGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
	private nebulaGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
	private starMaterial: THREE.PointsMaterial = new THREE.PointsMaterial();
	private nebulaMaterial: THREE.PointsMaterial = new THREE.PointsMaterial();
	private originalPositions: Float32Array = new Float32Array(
		this.STAR_COUNT * 3,
	);
	private nebulaPositions: Float32Array = new Float32Array(
		this.NEBULA_COUNT * 3,
	);
	private nebulaColors: Float32Array = new Float32Array(this.NEBULA_COUNT * 3);
	private nebulaPhases: Float32Array = new Float32Array(this.NEBULA_COUNT);
	private initialCameraPosition: THREE.Vector3 = new THREE.Vector3(
		0,
		0,
		this.INITIAL_CAMERA_Z,
	);
	// private driftAmplitude = 5; // Now: this.CAMERA_DRIFT_AMPLITUDE
	// private driftSpeed = 0.0001; // Now: this.CAMERA_DRIFT_SPEED

	protected async createContent(): Promise<void> {
		// Create star particles
		const starPositions = new Float32Array(this.STAR_COUNT * 3);
		const starColors = new Float32Array(this.STAR_COUNT * 3);

		for (let i = 0; i < this.STAR_COUNT; i++) {
			// Spherical distribution for stars - now more spread out and further back
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(Math.random() * 2 - 1);
			const radius =
				Math.random() ** this.STAR_RADIUS_POWER * this.STAR_RADIUS_RANGE +
				this.STAR_RADIUS_MIN; // Pushed back and spread out more

			const x = radius * Math.sin(phi) * Math.cos(theta);
			const y = radius * Math.sin(phi) * Math.sin(theta);
			const z = radius * Math.cos(phi);

			const i3 = i * 3;
			starPositions[i3] = this.originalPositions[i3] = x;
			starPositions[i3 + 1] = this.originalPositions[i3 + 1] = y;
			starPositions[i3 + 2] = this.originalPositions[i3 + 2] = z;

			// Enhanced star colors with better contrast
			const colorTemp = Math.random() * this.STAR_COLOR_TEMP_MAX; // Slightly more color variation
			starColors[i3] =
				this.STAR_COLOR_BASE_BRIGHTNESS +
				colorTemp * this.STAR_COLOR_TEMP_FACTOR; // R - brighter base white
			starColors[i3 + 1] =
				this.STAR_COLOR_BASE_BRIGHTNESS +
				colorTemp * this.STAR_COLOR_TEMP_FACTOR; // G
			starColors[i3 + 2] =
				this.STAR_COLOR_BASE_BRIGHTNESS +
				colorTemp * this.STAR_COLOR_TEMP_FACTOR; // B
		}

		// Create nebula particles
		const nebulaPositions = new Float32Array(this.NEBULA_COUNT * 3);

		for (let i = 0; i < this.NEBULA_COUNT; i++) {
			// More spread out distribution for nebulas
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(Math.random() * 2 - 1);
			const radius =
				Math.random() * this.NEBULA_RADIUS_RANGE + this.NEBULA_RADIUS_MIN; // More spread out

			const i3 = i * 3;
			nebulaPositions[i3] = this.nebulaPositions[i3] =
				radius * Math.sin(phi) * Math.cos(theta);
			nebulaPositions[i3 + 1] = this.nebulaPositions[i3 + 1] =
				radius * Math.sin(phi) * Math.sin(theta);
			nebulaPositions[i3 + 2] = this.nebulaPositions[i3 + 2] =
				radius * Math.cos(phi);

			// More subtle nebula colors
			const hue = this.NEBULA_HUE_BASE + Math.random() * this.NEBULA_HUE_RANGE; // Blue to purple
			const saturation =
				this.NEBULA_SATURATION_BASE +
				Math.random() * this.NEBULA_SATURATION_RANGE; // Reduced saturation
			const lightness =
				this.NEBULA_LIGHTNESS_BASE +
				Math.random() * this.NEBULA_LIGHTNESS_RANGE; // Darker
			const color = new THREE.Color().setHSL(hue, saturation, lightness);

			this.nebulaColors[i3] = color.r;
			this.nebulaColors[i3 + 1] = color.g;
			this.nebulaColors[i3 + 2] = color.b;

			// Random phases for very subtle nebula movement
			this.nebulaPhases[i] = Math.random() * Math.PI * 2;
		}

		// Setup star material with circular texture
		const starTexture = TextureUtils.createRadialGradientTexture(
			this.STAR_TEXTURE_CANVAS_SIZE,
			this.STAR_TEXTURE_GRADIENT_CENTER,
			[
				[0, "rgba(255, 255, 255, 1)"],
				[1, "rgba(255, 255, 255, 0)"],
			],
		);

		this.starGeometry.setAttribute(
			"position",
			new THREE.BufferAttribute(starPositions, 3),
		);
		this.starGeometry.setAttribute(
			"color",
			new THREE.BufferAttribute(starColors, 3),
		);

		this.starMaterial.size = this.STAR_MATERIAL_BASE_SIZE;
		this.starMaterial.vertexColors = true;
		this.starMaterial.transparent = true;
		this.starMaterial.opacity = this.STAR_MATERIAL_BASE_OPACITY;
		this.starMaterial.blending = THREE.AdditiveBlending;
		this.starMaterial.depthWrite = false;
		this.starMaterial.map = starTexture;

		// Setup nebula material with larger, softer circular texture
		const nebulaTexture = TextureUtils.createRadialGradientTexture(
			this.NEBULA_TEXTURE_CANVAS_SIZE,
			this.NEBULA_TEXTURE_GRADIENT_CENTER,
			[
				[0, `rgba(255, 255, 255, ${this.NEBULA_GRADIENT_STOP_0_ALPHA})`],
				[
					this.NEBULA_GRADIENT_STOP_1_POS,
					`rgba(255, 255, 255, ${this.NEBULA_GRADIENT_STOP_1_ALPHA})`,
				],
				[1, "rgba(255, 255, 255, 0)"],
			],
		);

		this.nebulaGeometry.setAttribute(
			"position",
			new THREE.BufferAttribute(nebulaPositions, 3),
		);
		this.nebulaGeometry.setAttribute(
			"color",
			new THREE.BufferAttribute(this.nebulaColors, 3),
		);

		this.nebulaMaterial.size = this.NEBULA_MATERIAL_BASE_SIZE;
		this.nebulaMaterial.vertexColors = true;
		this.nebulaMaterial.transparent = true;
		this.nebulaMaterial.opacity = this.NEBULA_MATERIAL_BASE_OPACITY;
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

		const deltaSeconds = deltaTime / 1000; // Standard conversion, not a magic number for config
		const nebulaPositions = this.nebulaGeometry.attributes.position
			.array as Float32Array;

		// Get audio levels for subtle reactivity
		const volume =
			this.getSmoothedAudio("volume", this.AUDIO_SMOOTH_VOLUME_CONTENT) ** 2; // Square for more subtlety
		const bassLevel =
			this.getSmoothedAudio("bass", this.AUDIO_SMOOTH_BASS_CONTENT) ** 2;

		// Update nebula positions with extremely subtle drift
		for (let i = 0; i < this.NEBULA_COUNT; i++) {
			const i3 = i * 3;

			// Update phase with very slow movement
			this.nebulaPhases[i] += deltaSeconds * this.NEBULA_PHASE_SPEED_FACTOR;

			// Apply extremely subtle vertical drift
			const driftAmount =
				Math.sin(this.nebulaPhases[i]) * this.NEBULA_DRIFT_AMOUNT_FACTOR;
			nebulaPositions[i3 + 2] = this.nebulaPositions[i3 + 2] + driftAmount;
		}

		// Update geometry buffer for nebulas only
		this.nebulaGeometry.attributes.position.needsUpdate = true;
	}

	protected updateVisualEffects(deltaTime: number): void {
		// Get audio levels for subtle visual effects
		const midLevel =
			this.getSmoothedAudio("mid", this.AUDIO_SMOOTH_MID_EFFECTS) ** 2;
		const trebleLevel =
			this.getSmoothedAudio("treble", this.AUDIO_SMOOTH_TREBLE_EFFECTS) ** 2;
		const bassLevel =
			this.getSmoothedAudio("bass", this.AUDIO_SMOOTH_BASS_EFFECTS) ** 2;
		const volume =
			this.getSmoothedAudio("volume", this.AUDIO_SMOOTH_VOLUME_EFFECTS) ** 2;

		// Very subtle star size and brightness variation with treble
		// const starBaseSize = 0.8; // Now: this.STAR_MATERIAL_BASE_SIZE
		this.starMaterial.size =
			this.STAR_MATERIAL_BASE_SIZE + trebleLevel * this.STAR_SIZE_TREBLE_FACTOR;
		this.starMaterial.opacity =
			this.STAR_BASE_OPACITY_EFFECT +
			trebleLevel * this.STAR_OPACITY_TREBLE_FACTOR;

		// Nebula response to bass and mid frequencies
		// const nebulaBaseSize = 12.0; // Now: this.NEBULA_MATERIAL_BASE_SIZE
		this.nebulaMaterial.size =
			this.NEBULA_MATERIAL_BASE_SIZE + bassLevel * this.NEBULA_SIZE_BASS_FACTOR;
		this.nebulaMaterial.opacity =
			this.NEBULA_MATERIAL_BASE_OPACITY +
			bassLevel * this.NEBULA_OPACITY_BASS_FACTOR +
			midLevel * this.NEBULA_OPACITY_MID_FACTOR;

		// Overall intensity boost with volume
		const globalBoost = 1.0 + volume * this.GLOBAL_BOOST_VOLUME_FACTOR;
		this.starMaterial.size *= globalBoost;
		this.nebulaMaterial.size *= globalBoost;
	}

	protected async animateEnter(): Promise<void> {
		return this.createFadeTransition(this.FADE_TRANSITION_DURATION_MS);
	}

	protected async animateExit(): Promise<void> {
		return this.createFadeTransition(this.FADE_TRANSITION_DURATION_MS);
	}
}
