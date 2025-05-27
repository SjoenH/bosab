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
		for (let i = 0; i < this.particleCount; i++) {
			// Create columns of particles
			const col = i % 40; // 40 columns
			const row = Math.floor(i / 40); // Multiple rows

			const x = (col - 20) * 1.0; // Horizontal spacing
			const y = Math.random() * 80 - 40; // Random vertical start positions
			const z = -10 + Math.random() * 20; // Varied depth

			positions[i * 3] = x;
			positions[i * 3 + 1] = y;
			positions[i * 3 + 2] = z;

			// Initialize random fall speeds
			this.fallSpeeds[i] = 2 + Math.random() * 3; // Different speeds for each particle
		}

		this.particleGeometry.setAttribute(
			"position",
			new THREE.BufferAttribute(positions, 3),
		);

		// Matrix-like particles with sharper, more clinical look
		this.particleMaterial.size = 0.2;
		this.particleMaterial.color = new THREE.Color(0x00ff99);
		this.particleMaterial.transparent = true;
		this.particleMaterial.opacity = 0.8;
		this.particleMaterial.blending = THREE.AdditiveBlending;

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
		this.waveformMaterial.color = new THREE.Color(0x00ff99);
		this.waveformMaterial.opacity = 0.6;
		this.waveformMaterial.transparent = true;

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

		// Update particle positions for Matrix rain effect
		const positions = this.particleGeometry.attributes.position
			.array as Float32Array;
		const audioLevel = this.getSmoothedAudio("volume", 0.1);
		const trebleLevel = this.getSmoothedAudio("treble", 0.1);

		for (let i = 0; i < this.particleCount; i++) {
			const i3 = i * 3;

			// Matrix fall effect
			positions[i3 + 1] -= this.fallSpeeds[i] * deltaSeconds * (1 + audioLevel); // Fall speed affected by audio

			// Add subtle horizontal drift based on treble
			positions[i3] +=
				Math.sin(this.time * 0.001 + i * 0.1) * trebleLevel * 0.02;

			// Reset particles that fall below the view
			if (positions[i3 + 1] < -40) {
				positions[i3 + 1] = 40; // Reset to top
				positions[i3] = ((i % 40) - 20) * 1.0 + (Math.random() - 0.5) * 0.5; // Keep in column with slight variance
				this.fallSpeeds[i] = 2 + Math.random() * 3; // New random speed
			}

			// Keep particles in their general columns
			if (Math.abs(positions[i3]) > 20) {
				positions[i3] = ((i % 40) - 20) * 1.0;
			}
		}

		// Update statistical text falling animation
		for (let i = 0; i < this.textMeshes.length; i++) {
			const mesh = this.textMeshes[i];

			// Fall down
			mesh.position.y -= this.textFallSpeeds[i] * deltaSeconds * (1 + audioLevel * 0.5);

			// Rotate slowly
			mesh.rotation.z += this.textRotations[i] * deltaSeconds;

			// Add slight horizontal drift
			mesh.position.x += Math.sin(this.time * 0.0005 + i) * trebleLevel * 0.01;

			// Respawn text that falls below view
			if (mesh.position.y < -50) {
				this.respawnText(i);
			}
		}

		// Periodically spawn new text elements
		if (this.font && Math.random() < 0.005 * (1 + audioLevel)) { // Higher chance with more audio
			if (this.textMeshes.length < 25) { // Max 25 text elements
				this.addRandomText();
			}
		}

		// Update waveform
		const waveformPositions = this.waveformGeometry.attributes.position
			.array as Float32Array;
		const bassLevel = this.getSmoothedAudio("bass", 0.2);

		// Shift existing values
		this.dataValues.shift();
		this.dataValues.push(bassLevel * 5);

		// Update waveform geometry
		for (let i = 0; i < this.waveformPoints; i++) {
			waveformPositions[i * 3 + 1] = this.dataValues[i];
		}

		this.particleGeometry.attributes.position.needsUpdate = true;
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
		this.particleMaterial.color.setHSL(hue, 1, 0.5);
		this.textMaterial.color.setHSL(hue, 0.9, 0.6);
		this.waveformMaterial.color.setHSL(hue, 1, 0.5);
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
