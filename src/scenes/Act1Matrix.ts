/**
 * Act 1 - Matrix: Flowing numbers, clinical waveforms, data visualization
 */

import * as THREE from "three";
import { FontLoader, type Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { BaseAct } from "./BaseAct";

export class Act1Matrix extends BaseAct {
	private particleCount = 2000;
	private particleGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
	private particleMaterial: THREE.PointsMaterial = new THREE.PointsMaterial();
	private waveformGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
	private waveformMaterial: THREE.LineBasicMaterial =
		new THREE.LineBasicMaterial();
	private waveformPoints = 100;
	private waveformLine: THREE.Line = new THREE.Line();
	private dataValues: number[] = [];
	private fallSpeeds: Float32Array = new Float32Array(2000); // Initialize with particleCount

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
		const charCanvas = document.createElement('canvas');
		const charCtx = charCanvas.getContext('2d');
		if (!charCtx) throw new Error('Could not create 2D context for character texture');

		// Make canvas larger for bigger characters and longer trails
		charCanvas.width = 256;   // Increased from 128
		charCanvas.height = 1024;  // Increased from 512

		// Set up text rendering with larger font
		charCtx.fillStyle = '#00ff99';
		charCtx.textAlign = 'center';
		charCtx.textBaseline = 'middle';
		charCtx.font = 'bold 192px monospace';  // Increased from 96px

		// Draw the main character (randomly 0 or 1)
		const char = Math.random() < 0.5 ? '0' : '1';
		charCtx.fillText(char, 128, 128);  // Adjusted center point

		// Create trail effect with multiple fading copies
		for (let i = 1; i < 6; i++) {
			const opacity = 1 - (i * 0.2);
			charCtx.fillStyle = `rgba(0, 255, 153, ${opacity})`;
			charCtx.fillText(char, 128, 128 + i * 192);  // Adjusted spacing for larger font
		}

		// Add stronger glow effect
		const glowGradient = charCtx.createRadialGradient(128, 128, 0, 128, 128, 96);  // Adjusted for larger size
		glowGradient.addColorStop(0, 'rgba(0, 255, 153, 0.3)');
		glowGradient.addColorStop(1, 'rgba(0, 255, 153, 0)');
		charCtx.globalCompositeOperation = 'screen';
		charCtx.fillStyle = glowGradient;
		charCtx.fillRect(0, 0, 256, 256);  // Adjusted for larger canvas

		const charTexture = new THREE.CanvasTexture(charCanvas);
		charTexture.needsUpdate = true;

		// Adjust texture properties for better trails
		charTexture.minFilter = THREE.LinearFilter;
		charTexture.magFilter = THREE.LinearFilter;
		charTexture.generateMipmaps = false;

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
			const col = i % 30; // 30 columns (reduced from 40 for bigger characters)
			const row = Math.floor(i / 30);

			const x = (col - 15) * 2.5;  // Increased column spacing
			const y = Math.random() * 80 - 40;
			const z = -10 + Math.random() * 20;

			positions[i * 3] = x;
			positions[i * 3 + 1] = y;
			positions[i * 3 + 2] = z;

			// Initialize random fall speeds
			this.fallSpeeds[i] = 4 + Math.random() * 6;

			// Initialize colors with brighter values at spawn
			colors[i * 3] = 0; // R
			colors[i * 3 + 1] = 1.0; // G
			colors[i * 3 + 2] = 0.7; // B

			// Initialize sizes for larger characters
			sizes[i] = 4.0 + Math.random() * 0.8;  // Increased base size
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
			size: 2.0,  // Increased base size
			map: charTexture,
			vertexColors: true,
			transparent: true,
			opacity: 0.95,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			alphaTest: 0.05  // Reduced for smoother edges
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
			waveformPositions[i * 3] = (i / this.waveformPoints) * 40 - 20;
			waveformPositions[i * 3 + 1] = 0;
			waveformPositions[i * 3 + 2] = -15; // Move waveform behind particles
		}

		this.waveformGeometry.setAttribute(
			"position",
			new THREE.BufferAttribute(waveformPositions, 3),
		);

		// Configure waveform material for CRT-like appearance
		this.waveformMaterial = new THREE.LineBasicMaterial({
			color: new THREE.Color(0x00ff99),
			opacity: 0.9,
			transparent: true,
			linewidth: 3, // Thicker line (note: limited by WebGL)
			blending: THREE.AdditiveBlending, // Add glow effect
			depthWrite: false, // Prevent depth issues with transparency
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
		this.textMaterial.color = new THREE.Color(0x00ff99);
		this.textMaterial.transparent = true;
		this.textMaterial.opacity = 0.7;

		// Create 15-20 text elements
		const textCount = 15 + Math.floor(Math.random() * 6);

		for (let i = 0; i < textCount; i++) {
			const term = this.statisticalTerms[Math.floor(Math.random() * this.statisticalTerms.length)];

			try {
				const textGeometry = new TextGeometry(term, {
					font: font,
					size: 0.3 + Math.random() * 0.4,
					depth: 0.02,
					curveSegments: 12,
					bevelEnabled: false
				});

				textGeometry.computeBoundingBox();
				const textMesh = new THREE.Mesh(textGeometry, this.textMaterial);

				// Random position
				textMesh.position.x = (Math.random() - 0.5) * 50;
				textMesh.position.y = 30 + Math.random() * 20;
				textMesh.position.z = -5 + Math.random() * 10;

				// Random rotation
				const rotation = Math.random() * Math.PI;
				textMesh.rotation.z = rotation;

				this.textGeometries.push(textGeometry);
				this.textMeshes.push(textMesh);
				this.textFallSpeeds.push(0.5 + Math.random() * 1.5);
				this.textRotations.push((Math.random() - 0.5) * 0.02);

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
				size: 0.3 + Math.random() * 0.4,
				depth: 0.02,
				curveSegments: 12,
				bevelEnabled: false
			});

			mesh.geometry = newGeometry;
			this.textGeometries[index] = newGeometry;

			// Reset position to top
			mesh.position.x = (Math.random() - 0.5) * 50;
			mesh.position.y = 30 + Math.random() * 20;
			mesh.position.z = -5 + Math.random() * 10;

			// New rotation
			mesh.rotation.z = Math.random() * Math.PI;
			this.textRotations[index] = (Math.random() - 0.5) * 0.02;
			this.textFallSpeeds[index] = 0.5 + Math.random() * 1.5;
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
				size: 0.3 + Math.random() * 0.4,
				depth: 0.02,
				curveSegments: 12,
				bevelEnabled: false
			});

			const textMesh = new THREE.Mesh(textGeometry, this.textMaterial);

			// Random position at top
			textMesh.position.x = (Math.random() - 0.5) * 50;
			textMesh.position.y = 30 + Math.random() * 20;
			textMesh.position.z = -5 + Math.random() * 10;

			// Random rotation
			textMesh.rotation.z = Math.random() * Math.PI;

			this.textGeometries.push(textGeometry);
			this.textMeshes.push(textMesh);
			this.textFallSpeeds.push(0.5 + Math.random() * 1.5);
			this.textRotations.push((Math.random() - 0.5) * 0.02);

			this.group.add(textMesh);
		} catch (error) {
			console.warn('Failed to add random text:', error);
		}
	}

	protected updateContent(deltaTime: number): void {
		if (this.particles.length === 0) return;

		const deltaSeconds = deltaTime / 1000;
		const audioLevel = this.getSmoothedAudio("volume", 0.1);
		const trebleLevel = this.getSmoothedAudio("treble", 0.1);
		const bassLevel = this.getSmoothedAudio("bass", 0.15);

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
			positions[i3] += Math.sin(this.time * 0.001 + i * 0.1) * trebleLevel * 0.005;

			// Calculate normalized position for fade effects
			const normalizedY = (positions[i3 + 1] + 40) / 80; // 0 at bottom, 1 at top
			const speedFactor = fallSpeed / 10; // Normalize by max speed

			// Update character size based on position and speed
			// Leading characters are larger
			const isLeadChar = normalizedY > 0.8;
			const baseSize = isLeadChar ? 2.0 : 1.5;
			sizes[i] = baseSize * (0.8 + speedFactor * 0.2) * (1 + trebleLevel * 0.2);

			// Update character brightness
			// Leading characters are brightest, trailing ones fade out
			let brightness: number;
			if (isLeadChar) {
				// Leading character is brightest and pulses with the audio
				brightness = 1.2 + bassLevel * 0.4; // Increased brightness and reactivity
			} else {
				// Trail characters fade out gradually but maintain better visibility
				brightness = Math.max(0.3, normalizedY * 0.9) * (0.8 + speedFactor * 0.3);
			}

			// Apply color with Matrix green tint
			colors[i3] = 0; // R
			colors[i3 + 1] = brightness; // G (Matrix green)
			colors[i3 + 2] = brightness * 0.7; // B (slight blue tint)

			// Reset particles that fall below the view
			if (positions[i3 + 1] < -40) {
				positions[i3 + 1] = 40; // Reset to top
				// Keep particles in strict columns for Matrix effect
				positions[i3] = ((i % 40) - 20) * 1.2;
				this.fallSpeeds[i] = 4 + Math.random() * 6;

				// Full brightness for new characters
				colors[i3] = 0;
				colors[i3 + 1] = 1.0;
				colors[i3 + 2] = 0.7;
			}

			// Ensure particles stay in their columns
			const targetX = ((i % 40) - 20) * 1.2;
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
			mesh.position.x += Math.sin(this.time * 0.0005 + i) * trebleLevel * 0.005;

			// Respawn text that falls below view
			if (mesh.position.y < -50) {
				this.respawnText(i);
			}
		}

		// Periodically spawn new text elements with audio-reactive frequency
		if (this.font && Math.random() < 0.005 * (1 + audioLevel)) {
			if (this.textMeshes.length < 25) {
				this.addRandomText();
			}
		}

		// Update waveform with improved smoothing
		const waveformPositions = this.waveformGeometry.attributes.position.array as Float32Array;

		// Shift existing values for smoother transitions
		this.dataValues.shift();
		// Scale bass level for more pronounced waveform with enhanced amplitude
		this.dataValues.push(bassLevel * 8); // Increased amplitude

		// Update waveform geometry with smoothed values and enhanced smoothing
		for (let i = 0; i < this.waveformPoints; i++) {
			// Apply 5-point smoothing for smoother curve
			const smooth = (
				(this.dataValues[i - 2] || this.dataValues[i]) +
				(this.dataValues[i - 1] || this.dataValues[i]) +
				this.dataValues[i] * 2 +
				(this.dataValues[i + 1] || this.dataValues[i]) +
				(this.dataValues[i + 2] || this.dataValues[i])
			) / 6;

			// Apply the smoothed value with a minimum amplitude to keep the line visible
			waveformPositions[i * 3 + 1] = Math.max(0.2, smooth);
		}

		this.particleGeometry.attributes.position.needsUpdate = true;
		this.particleGeometry.attributes.color.needsUpdate = true;
		this.particleGeometry.attributes.size.needsUpdate = true;
		this.waveformGeometry.attributes.position.needsUpdate = true;
	}

	protected updateVisualEffects(deltaTime: number): void {
		// Pulse opacity with bass
		const bassLevel = this.getSmoothedAudio("bass", 0.2);
		this.particleMaterial.opacity = 0.6 + bassLevel * 0.4;
		this.waveformMaterial.opacity = 0.3 + bassLevel * 0.4;

		// Update text opacity and effects
		const trebleLevel = this.getSmoothedAudio("treble", 0.1);
		this.textMaterial.opacity = 0.5 + bassLevel * 0.3 + trebleLevel * 0.2;

		// Change particle size for "digital rain" effect
		this.particleMaterial.size = 0.2 + trebleLevel * 0.15;

		// Subtle color variation for all elements
		const hue = 0.3 + trebleLevel * 0.05; // Slight color shift with treble
		// Update colors with enhanced glow effect
		this.particleMaterial.color.setHSL(hue, 1, 0.6); // Increased base lightness
		this.textMaterial.color.setHSL(hue, 0.9, 0.7); // Brighter text
		this.waveformMaterial.color.setHSL(hue, 1, 0.8); // Extra bright waveform
	}

	protected async animateEnter(): Promise<void> {
		return this.createFadeTransition(1000);
	}

	protected async animateExit(): Promise<void> {
		return this.createFadeTransition(1000);
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
