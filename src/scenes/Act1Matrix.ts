/**
 * Act 1 - Matrix: Flowing numbers, clinical waveforms, data visualization
 */

import * as THREE from "three";
import { FontLoader, type Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { BaseAct } from "./BaseAct";
import { TextureUtils } from "../utils/TextureUtils";

export class Act1Matrix extends BaseAct {
	// Particle system constants
	private readonly PARTICLE_COUNT = 2000;
	private readonly PARTICLE_COLUMN_COUNT = 30;
	private readonly PARTICLE_COLUMN_SPACING = 2.5;
	private readonly PARTICLE_Y_SPREAD = 80;
	private readonly PARTICLE_Y_OFFSET = -40;
	private readonly PARTICLE_Z_SPREAD = 20;
	private readonly PARTICLE_Z_OFFSET = -10;
	private readonly MIN_FALL_SPEED = 4;
	private readonly MAX_FALL_SPEED_ADDITION = 6;
	private readonly INITIAL_PARTICLE_SIZE_MIN = 4.0;
	private readonly INITIAL_PARTICLE_SIZE_RANDOM_ADDITION = 0.8;
	private readonly PARTICLE_MATERIAL_BASE_SIZE = 2.0;
	private readonly PARTICLE_MATERIAL_OPACITY = 0.95;
	private readonly PARTICLE_MATERIAL_ALPHA_TEST = 0.05;
	private readonly LEAD_CHAR_BASE_SIZE = 2.0;
	private readonly TRAIL_CHAR_BASE_SIZE = 1.5;
	private readonly MAX_FALL_SPEED_NORMALIZATION = 10;
	private readonly BRIGHTNESS_PULSE_FACTOR = 0.4;
	private readonly TRAIL_MIN_BRIGHTNESS = 0.3;
	private readonly RESET_PARTICLE_Y_POSITION = 40;
	private readonly RESET_PARTICLE_COLUMN_COUNT = 40; // This was 40 in reset, but 30 in creation. Standardizing to 30.
	private readonly RESET_PARTICLE_COLUMN_SPACING = 1.2;
	private readonly PARTICLE_DRIFT_SPEED_FACTOR = 0.005;
	private readonly PARTICLE_OPACITY_BASS_FACTOR = 0.4;
	private readonly PARTICLE_OPACITY_BASE = 0.6;
	private readonly PARTICLE_SIZE_TREBLE_FACTOR = 0.15;
	private readonly PARTICLE_SIZE_BASE = 0.2;
	private readonly PARTICLE_HUE_TREBLE_FACTOR = 0.05;
	private readonly PARTICLE_HUE_BASE = 0.3;
	private readonly PARTICLE_LIGHTNESS_BASE = 0.6;


	// Waveform constants
	private readonly WAVEFORM_POINTS = 100;
	private readonly WAVEFORM_WIDTH = 40;
	private readonly WAVEFORM_X_OFFSET = -20;
	private readonly WAVEFORM_Z_POSITION = -15;
	private readonly WAVEFORM_LINEWIDTH = 3;
	private readonly WAVEFORM_OPACITY = 0.8;
	private readonly WAVEFORM_BASS_AMPLITUDE_FACTOR = 8;
	private readonly WAVEFORM_SMOOTHING_POINTS_DIVISOR = 6;
	private readonly WAVEFORM_MIN_AMPLITUDE = 0.2;
	private readonly WAVEFORM_OPACITY_BASS_FACTOR = 0.4;
	private readonly WAVEFORM_OPACITY_BASE = 0.6;
	private readonly WAVEFORM_HUE_TREBLE_FACTOR = 0.05; // Same as particle, can be separate
	private readonly WAVEFORM_HUE_BASE = 0.3; // Same as particle, can be separate
	private readonly WAVEFORM_LIGHTNESS_BASE = 0.8;


	// Text elements constants
	private readonly STATISTICAL_TEXT_COUNT_BASE = 15;
	private readonly STATISTICAL_TEXT_COUNT_RANDOM_ADDITION = 6;
	private readonly TEXT_SIZE_BASE = 0.3;
	private readonly TEXT_SIZE_RANDOM_ADDITION = 0.4;
	private readonly TEXT_DEPTH = 0.02;
	private readonly TEXT_CURVE_SEGMENTS = 12;
	private readonly TEXT_X_SPREAD = 50;
	private readonly TEXT_Y_SPAWN_MIN = 30;
	private readonly TEXT_Y_SPAWN_RANDOM_ADDITION = 20;
	private readonly TEXT_Z_SPREAD = 10;
	private readonly TEXT_Z_OFFSET = -5;
	private readonly TEXT_MIN_FALL_SPEED = 0.5;
	private readonly TEXT_FALL_SPEED_RANDOM_ADDITION = 1.5;
	private readonly TEXT_ROTATION_SPEED_FACTOR = 0.02;
	private readonly TEXT_RESPAWN_Y_THRESHOLD = -50;
	private readonly MAX_TEXT_ELEMENTS = 25;
	private readonly TEXT_SPAWN_PROBABILITY_BASE = 0.005;
	private readonly TEXT_MATERIAL_OPACITY = 0.7;
	private readonly TEXT_OPACITY_BASS_FACTOR = 0.3;
	private readonly TEXT_OPACITY_TREBLE_FACTOR = 0.2;
	private readonly TEXT_OPACITY_BASE = 0.5;
	private readonly TEXT_HUE_TREBLE_FACTOR = 0.05; // Same as particle, can be separate
	private readonly TEXT_HUE_BASE = 0.3; // Same as particle, can be separate
	private readonly TEXT_LIGHTNESS_BASE = 0.7;


	// Character texture constants
	private readonly CHAR_CANVAS_WIDTH = 256;
	private readonly CHAR_CANVAS_HEIGHT = 1024;
	private readonly CHAR_FONT_SIZE_PX = 192;
	private readonly CHAR_FILL_STYLE = '#00ff99';
	private readonly CHAR_TRAIL_COUNT = 6;
	private readonly CHAR_TRAIL_OPACITY_STEP = 0.2;
	private readonly CHAR_GLOW_GRADIENT_RADIUS = 96;
	private readonly CHAR_GLOW_GRADIENT_COLOR_START = 'rgba(0, 255, 153, 0.3)';
	private readonly CHAR_GLOW_GRADIENT_COLOR_END = 'rgba(0, 255, 153, 0)';


	// Audio smoothing factors
	private readonly AUDIO_VOLUME_SMOOTHING = 0.1;
	private readonly AUDIO_TREBLE_SMOOTHING = 0.1;
	private readonly AUDIO_BASS_SMOOTHING = 0.15;
	private readonly AUDIO_BASS_SMOOTHING_EFFECTS = 0.2;

	// Animation constants
	private readonly FADE_TRANSITION_DURATION = 1000;


	private particleCount = this.PARTICLE_COUNT;
	private particleGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
	private particleMaterial: THREE.PointsMaterial = new THREE.PointsMaterial();
	private waveformGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
	private waveformMaterial: THREE.LineBasicMaterial =
		new THREE.LineBasicMaterial();
	private waveformPoints = this.WAVEFORM_POINTS;
	private waveformLine: THREE.Line = new THREE.Line();
	private dataValues: number[] = [];
	private fallSpeeds: Float32Array = new Float32Array(this.PARTICLE_COUNT); // Initialize with particleCount

	// Statistical text elements
	private textMeshes: THREE.Mesh[] = [];
	private textGeometries: TextGeometry[] = [];
	private textMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial();
	private statisticalTerms = [
		'SAP: 130±16mmHg', 'HR: 75±12bpm', 'SV: 70±15ml', 'CO: 5.2±1.1L/min',
		'SVR: 1200±200', 'p<0.05', 'CI: 95%', 'AUC', 'SD±', 'IQR',
		'β=-0.43', 'r²=0.87', 'n=68', 'df=66', 'F=12.4', 't=-3.2',
		'μ±σ', 'χ²=8.9', 'α=0.05', 'power=80%', '∆BP>10mmHg',
		'Welch test', 'propofol', 'bolus', 'infusion', 'hemodynamic',
		'130mmHg', '33±16', '>43mmHg', '300s', '450s', '55s',
		'two-sided', 'one-sided', 'non-inferiority', 'superiority'
	];
	private textFallSpeeds: number[] = [];
	private textRotations: number[] = [];
	private loader: FontLoader = new FontLoader();
	private font: Font | null = null;

	protected async createContent(): Promise<void> {
		// Initialize fall speeds for Matrix rain effect
		this.fallSpeeds = new Float32Array(this.particleCount);

		// Create character texture for Matrix rain effect
		const charTexture = TextureUtils.createCharacterTexture(
			Math.random() < 0.5 ? "0" : "1",
			{
				canvasWidth: this.CHAR_CANVAS_WIDTH,
				canvasHeight: this.CHAR_CANVAS_HEIGHT,
				fontStyle: `bold ${this.CHAR_FONT_SIZE_PX}px monospace`,
				fillStyle: this.CHAR_FILL_STYLE,
				trailCount: this.CHAR_TRAIL_COUNT,
				trailOpacityStep: this.CHAR_TRAIL_OPACITY_STEP,
				glow: {
					gradientRadius: this.CHAR_GLOW_GRADIENT_RADIUS,
					colorStart: this.CHAR_GLOW_GRADIENT_COLOR_START,
					colorEnd: this.CHAR_GLOW_GRADIENT_COLOR_END,
				},
			},
		);

		// Load font for statistical text
		try {
			this.font = await new Promise((resolve, reject) => {
				this.loader.load(
					'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
					resolve,
					undefined,
					reject
				);
			});
		} catch (error) {
			console.warn('Failed to load font, text will not be displayed:', error);
		}

		// Create vertically arranged particles
		const positions = new Float32Array(this.particleCount * 3);
		const colors = new Float32Array(this.particleCount * 3);
		const sizes = new Float32Array(this.particleCount);

		for (let i = 0; i < this.particleCount; i++) {
			// Create tighter columns for Matrix characters
			const col = i % this.PARTICLE_COLUMN_COUNT;
			const row = Math.floor(i / this.PARTICLE_COLUMN_COUNT);

			const x = (col - this.PARTICLE_COLUMN_COUNT / 2) * this.PARTICLE_COLUMN_SPACING;
			const y = Math.random() * this.PARTICLE_Y_SPREAD + this.PARTICLE_Y_OFFSET;
			const z = this.PARTICLE_Z_OFFSET + Math.random() * this.PARTICLE_Z_SPREAD;

			positions[i * 3] = x;
			positions[i * 3 + 1] = y;
			positions[i * 3 + 2] = z;

			// Initialize random fall speeds
			this.fallSpeeds[i] = this.MIN_FALL_SPEED + Math.random() * this.MAX_FALL_SPEED_ADDITION;

			// Initialize colors with brighter values at spawn
			colors[i * 3] = 0; // R
			colors[i * 3 + 1] = 1.0; // G
			colors[i * 3 + 2] = 0.7; // B

			// Initialize sizes for larger characters
			sizes[i] = this.INITIAL_PARTICLE_SIZE_MIN + Math.random() * this.INITIAL_PARTICLE_SIZE_RANDOM_ADDITION;
		}

		this.particleGeometry.setAttribute(
			"position",
			new THREE.BufferAttribute(positions, 3),
		);
		this.particleGeometry.setAttribute(
			"color",
			new THREE.BufferAttribute(colors, 3),
		);
		this.particleGeometry.setAttribute(
			"size",
			new THREE.BufferAttribute(sizes, 1),
		);

		// Update material settings for character particles
		this.particleMaterial = new THREE.PointsMaterial({
			size: this.PARTICLE_MATERIAL_BASE_SIZE,
			map: charTexture,
			vertexColors: true,
			transparent: true,
			opacity: this.PARTICLE_MATERIAL_OPACITY,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			alphaTest: this.PARTICLE_MATERIAL_ALPHA_TEST
		});

		// Create particle system
		this.particles.push(
			new THREE.Points(this.particleGeometry, this.particleMaterial),
		);
		this.group.add(this.particles[0]);

		// Create statistical text elements if font loaded
		if (this.font) {
			this.createStatisticalText();
		}

		// Create waveform line for medical data visualization
		const waveformPositions = new Float32Array(this.waveformPoints * 3);
		for (let i = 0; i < this.waveformPoints; i++) {
			waveformPositions[i * 3] = (i / this.waveformPoints) * this.WAVEFORM_WIDTH + this.WAVEFORM_X_OFFSET;
			waveformPositions[i * 3 + 1] = 0;
			waveformPositions[i * 3 + 2] = this.WAVEFORM_Z_POSITION;
		}

		this.waveformGeometry.setAttribute(
			"position",
			new THREE.BufferAttribute(waveformPositions, 3),
		);

		// Configure waveform material for CRT-like appearance with glow
		this.waveformMaterial = new THREE.LineBasicMaterial({
			color: new THREE.Color(this.CHAR_FILL_STYLE), // Use consistent green
			opacity: this.WAVEFORM_OPACITY,
			transparent: true,
			linewidth: this.WAVEFORM_LINEWIDTH,
			blending: THREE.AdditiveBlending, // Add glow effect
			depthWrite: false // Prevent depth issues with transparency
		});

		this.waveformLine = new THREE.Line(
			this.waveformGeometry,
			this.waveformMaterial,
		);
		this.group.add(this.waveformLine);

		// Initialize data values for waveform
		this.dataValues = Array(this.waveformPoints).fill(0);

		// Store materials for disposal
		this.materials.push(this.particleMaterial, this.waveformMaterial, this.textMaterial);
	}

	private createStatisticalText(): void {
		if (!this.font) return; // Guard clause to ensure font is loaded

		const font = this.font; // Local variable to satisfy TypeScript

		// Clear existing text
		for (const mesh of this.textMeshes) {
			this.group.remove(mesh);
		}
		for (const geo of this.textGeometries) {
			geo.dispose();
		}
		this.textMeshes = [];
		this.textGeometries = [];
		this.textFallSpeeds = [];
		this.textRotations = [];

		// Setup text material
		this.textMaterial.color = new THREE.Color(this.CHAR_FILL_STYLE); // Use consistent green
		this.textMaterial.transparent = true;
		this.textMaterial.opacity = this.TEXT_MATERIAL_OPACITY;

		// Create 15-20 text elements
		const textCount = this.STATISTICAL_TEXT_COUNT_BASE + Math.floor(Math.random() * this.STATISTICAL_TEXT_COUNT_RANDOM_ADDITION);

		for (let i = 0; i < textCount; i++) {
			const term = this.statisticalTerms[Math.floor(Math.random() * this.statisticalTerms.length)];

			try {
				const textGeometry = new TextGeometry(term, {
					font: font,
					size: this.TEXT_SIZE_BASE + Math.random() * this.TEXT_SIZE_RANDOM_ADDITION,
					depth: this.TEXT_DEPTH,
					curveSegments: this.TEXT_CURVE_SEGMENTS,
					bevelEnabled: false
				});

				textGeometry.computeBoundingBox();
				const textMesh = new THREE.Mesh(textGeometry, this.textMaterial);

				// Random position
				textMesh.position.x = (Math.random() - 0.5) * this.TEXT_X_SPREAD;
				textMesh.position.y = this.TEXT_Y_SPAWN_MIN + Math.random() * this.TEXT_Y_SPAWN_RANDOM_ADDITION;
				textMesh.position.z = this.TEXT_Z_OFFSET + Math.random() * this.TEXT_Z_SPREAD;

				// Random rotation
				const rotation = Math.random() * Math.PI;
				textMesh.rotation.z = rotation;

				this.textGeometries.push(textGeometry);
				this.textMeshes.push(textMesh);
				this.textFallSpeeds.push(this.TEXT_MIN_FALL_SPEED + Math.random() * this.TEXT_FALL_SPEED_RANDOM_ADDITION);
				this.textRotations.push((Math.random() - 0.5) * this.TEXT_ROTATION_SPEED_FACTOR);

				this.group.add(textMesh);
			} catch (error) {
				console.warn('Failed to create text geometry:', error);
			}
		}
	}

	private respawnText(index: number): void {
		if (!this.font || index >= this.textMeshes.length) return;

		const mesh = this.textMeshes[index];
		const term = this.statisticalTerms[Math.floor(Math.random() * this.statisticalTerms.length)];

		try {
			// Remove old geometry
			if (this.textGeometries[index]) {
				this.textGeometries[index].dispose();
			}

			const newGeometry = new TextGeometry(term, {
				font: this.font,
				size: this.TEXT_SIZE_BASE + Math.random() * this.TEXT_SIZE_RANDOM_ADDITION,
				depth: this.TEXT_DEPTH,
				curveSegments: this.TEXT_CURVE_SEGMENTS,
				bevelEnabled: false
			});

			mesh.geometry = newGeometry;
			this.textGeometries[index] = newGeometry;

			// Reset position to top
			mesh.position.x = (Math.random() - 0.5) * this.TEXT_X_SPREAD;
			mesh.position.y = this.TEXT_Y_SPAWN_MIN + Math.random() * this.TEXT_Y_SPAWN_RANDOM_ADDITION;
			mesh.position.z = this.TEXT_Z_OFFSET + Math.random() * this.TEXT_Z_SPREAD;

			// New rotation
			mesh.rotation.z = Math.random() * Math.PI;
			this.textRotations[index] = (Math.random() - 0.5) * this.TEXT_ROTATION_SPEED_FACTOR;
			this.textFallSpeeds[index] = this.TEXT_MIN_FALL_SPEED + Math.random() * this.TEXT_FALL_SPEED_RANDOM_ADDITION;
		} catch (error) {
			console.warn('Failed to respawn text:', error);
		}
	}

	private addRandomText(): void {
		if (!this.font) return;

		const term = this.statisticalTerms[Math.floor(Math.random() * this.statisticalTerms.length)];

		try {
			const textGeometry = new TextGeometry(term, {
				font: this.font,
				size: this.TEXT_SIZE_BASE + Math.random() * this.TEXT_SIZE_RANDOM_ADDITION,
				depth: this.TEXT_DEPTH,
				curveSegments: this.TEXT_CURVE_SEGMENTS,
				bevelEnabled: false
			});

			const textMesh = new THREE.Mesh(textGeometry, this.textMaterial);

			// Random position at top
			textMesh.position.x = (Math.random() - 0.5) * this.TEXT_X_SPREAD;
			textMesh.position.y = this.TEXT_Y_SPAWN_MIN + Math.random() * this.TEXT_Y_SPAWN_RANDOM_ADDITION;
			textMesh.position.z = this.TEXT_Z_OFFSET + Math.random() * this.TEXT_Z_SPREAD;

			// Random rotation
			textMesh.rotation.z = Math.random() * Math.PI;

			this.textGeometries.push(textGeometry);
			this.textMeshes.push(textMesh);
			this.textFallSpeeds.push(this.TEXT_MIN_FALL_SPEED + Math.random() * this.TEXT_FALL_SPEED_RANDOM_ADDITION);
			this.textRotations.push((Math.random() - 0.5) * this.TEXT_ROTATION_SPEED_FACTOR);

			this.group.add(textMesh);
		} catch (error) {
			console.warn('Failed to add random text:', error);
		}
	}

	protected updateContent(deltaTime: number): void {
		if (this.particles.length === 0) return;

		const deltaSeconds = deltaTime / 1000;
		const audioLevel = this.getSmoothedAudio("volume", this.AUDIO_VOLUME_SMOOTHING);
		const trebleLevel = this.getSmoothedAudio("treble", this.AUDIO_TREBLE_SMOOTHING);
		const bassLevel = this.getSmoothedAudio("bass", this.AUDIO_BASS_SMOOTHING);

		// Update particle positions for Matrix rain effect
		const positions = this.particleGeometry.attributes.position.array as Float32Array;
		const colors = this.particleGeometry.attributes.color.array as Float32Array;
		const sizes = this.particleGeometry.attributes.size.array as Float32Array;

		for (let i = 0; i < this.particleCount; i++) {
			const i3 = i * 3;

			// Matrix fall effect with audio-reactive speed
			const fallSpeed = this.fallSpeeds[i] * (1 + audioLevel * 0.5);
			positions[i3 + 1] -= fallSpeed * deltaSeconds;

			// Add very subtle horizontal drift based on treble
			positions[i3] += Math.sin(this.time * 0.001 + i * 0.1) * trebleLevel * this.PARTICLE_DRIFT_SPEED_FACTOR;

			// Calculate normalized position for fade effects
			const normalizedY = (positions[i3 + 1] + this.PARTICLE_Y_SPREAD / 2) / this.PARTICLE_Y_SPREAD; // 0 at bottom, 1 at top
			const speedFactor = fallSpeed / this.MAX_FALL_SPEED_NORMALIZATION; // Normalize by max speed

			// Update character size based on position and speed
			// Leading characters are larger
			const isLeadChar = normalizedY > 0.8;
			const baseSize = isLeadChar ? this.LEAD_CHAR_BASE_SIZE : this.TRAIL_CHAR_BASE_SIZE;
			sizes[i] = baseSize * (0.8 + speedFactor * 0.2) * (1 + trebleLevel * 0.2);

			// Update character brightness
			// Leading characters are brightest, trailing ones fade out
			let brightness: number;
			if (isLeadChar) {
				// Leading character is brightest and pulses with the audio
				brightness = 1.2 + bassLevel * this.BRIGHTNESS_PULSE_FACTOR; // Increased brightness and reactivity
			} else {
				// Trail characters fade out gradually but maintain better visibility
				brightness = Math.max(this.TRAIL_MIN_BRIGHTNESS, normalizedY * 0.9) * (0.8 + speedFactor * 0.3);
			}

			// Apply color with Matrix green tint
			colors[i3] = 0; // R
			colors[i3 + 1] = brightness; // G (Matrix green)
			colors[i3 + 2] = brightness * 0.7; // B (slight blue tint)

			// Reset particles that fall below the view
			if (positions[i3 + 1] < this.PARTICLE_Y_OFFSET) {
				positions[i3 + 1] = this.RESET_PARTICLE_Y_POSITION; // Reset to top
				// Keep particles in strict columns for Matrix effect
				positions[i3] = ((i % this.RESET_PARTICLE_COLUMN_COUNT) - this.RESET_PARTICLE_COLUMN_COUNT / 2) * this.RESET_PARTICLE_COLUMN_SPACING;
				this.fallSpeeds[i] = this.MIN_FALL_SPEED + Math.random() * this.MAX_FALL_SPEED_ADDITION;

				// Full brightness for new characters
				colors[i3] = 0;
				colors[i3 + 1] = 1.0;
				colors[i3 + 2] = 0.7;
			}

			// Ensure particles stay in their columns
			const targetX = ((i % this.RESET_PARTICLE_COLUMN_COUNT) - this.RESET_PARTICLE_COLUMN_COUNT / 2) * this.RESET_PARTICLE_COLUMN_SPACING;
			positions[i3] += (targetX - positions[i3]) * 0.1;
		}

		// Update statistical text falling animation
		for (let i = 0; i < this.textMeshes.length; i++) {
			const mesh = this.textMeshes[i];

			// Fall down with reactive speed
			mesh.position.y -= this.textFallSpeeds[i] * deltaSeconds * (1 + audioLevel * 0.5);

			// Rotate slowly
			mesh.rotation.z += this.textRotations[i] * deltaSeconds;

			// Very subtle horizontal drift
			mesh.position.x += Math.sin(this.time * 0.0005 + i) * trebleLevel * this.PARTICLE_DRIFT_SPEED_FACTOR; // Re-use particle drift factor

			// Respawn text that falls below view
			if (mesh.position.y < this.TEXT_RESPAWN_Y_THRESHOLD) {
				this.respawnText(i);
			}
		}

		// Periodically spawn new text elements with audio-reactive frequency
		if (this.font && Math.random() < this.TEXT_SPAWN_PROBABILITY_BASE * (1 + audioLevel)) {
			if (this.textMeshes.length < this.MAX_TEXT_ELEMENTS) {
				this.addRandomText();
			}
		}

		// Update waveform with improved smoothing
		const waveformPositions = this.waveformGeometry.attributes.position.array as Float32Array;

		// Shift existing values for smoother transitions
		this.dataValues.shift();
		// Scale bass level for more pronounced waveform with enhanced amplitude
		this.dataValues.push(bassLevel * this.WAVEFORM_BASS_AMPLITUDE_FACTOR); // Increased amplitude

		// Update waveform geometry with smoothed values and enhanced smoothing
		for (let i = 0; i < this.waveformPoints; i++) {
			// Apply 5-point smoothing for smoother curve
			const smooth = (
				(this.dataValues[i - 2] || this.dataValues[i]) +
				(this.dataValues[i - 1] || this.dataValues[i]) +
				this.dataValues[i] * 2 +
				(this.dataValues[i + 1] || this.dataValues[i]) +
				(this.dataValues[i + 2] || this.dataValues[i])
			) / this.WAVEFORM_SMOOTHING_POINTS_DIVISOR;

			// Apply the smoothed value with a minimum amplitude to keep the line visible
			waveformPositions[i * 3 + 1] = Math.max(this.WAVEFORM_MIN_AMPLITUDE, smooth);
		}

		this.particleGeometry.attributes.position.needsUpdate = true;
		this.particleGeometry.attributes.color.needsUpdate = true;
		this.particleGeometry.attributes.size.needsUpdate = true;
		this.waveformGeometry.attributes.position.needsUpdate = true;
	}

	protected updateVisualEffects(deltaTime: number): void {
		// Pulse opacity with bass
		const bassLevel = this.getSmoothedAudio("bass", this.AUDIO_BASS_SMOOTHING_EFFECTS);
		this.particleMaterial.opacity = this.PARTICLE_OPACITY_BASE + bassLevel * this.PARTICLE_OPACITY_BASS_FACTOR;
		this.waveformMaterial.opacity = this.WAVEFORM_OPACITY_BASE + bassLevel * this.WAVEFORM_OPACITY_BASS_FACTOR;

		// Update text opacity and effects
		const trebleLevel = this.getSmoothedAudio("treble", this.AUDIO_TREBLE_SMOOTHING);
		this.textMaterial.opacity = this.TEXT_OPACITY_BASE + bassLevel * this.TEXT_OPACITY_BASS_FACTOR + trebleLevel * this.TEXT_OPACITY_TREBLE_FACTOR;

		// Change particle size for "digital rain" effect
		this.particleMaterial.size = this.PARTICLE_SIZE_BASE + trebleLevel * this.PARTICLE_SIZE_TREBLE_FACTOR;

		// Subtle color variation for all elements
		const hue = this.PARTICLE_HUE_BASE + trebleLevel * this.PARTICLE_HUE_TREBLE_FACTOR;
		// Update colors with enhanced glow effect
		this.particleMaterial.color.setHSL(hue, 1, this.PARTICLE_LIGHTNESS_BASE);
		this.textMaterial.color.setHSL(this.TEXT_HUE_BASE + trebleLevel * this.TEXT_HUE_TREBLE_FACTOR, 0.9, this.TEXT_LIGHTNESS_BASE);
		this.waveformMaterial.color.setHSL(this.WAVEFORM_HUE_BASE + trebleLevel * this.WAVEFORM_HUE_TREBLE_FACTOR, 1, this.WAVEFORM_LIGHTNESS_BASE);
	}

	protected async animateEnter(): Promise<void> {
		return this.createFadeTransition(this.FADE_TRANSITION_DURATION);
	}

	protected async animateExit(): Promise<void> {
		return this.createFadeTransition(this.FADE_TRANSITION_DURATION);
	}

	public dispose(): void {
		// Clean up text geometries and meshes
		for (const mesh of this.textMeshes) {
			this.group.remove(mesh);
		}
		for (const geo of this.textGeometries) {
			geo.dispose();
		}
		this.textMeshes = [];
		this.textGeometries = [];

		// Call parent dispose
		super.dispose();
	}
}
