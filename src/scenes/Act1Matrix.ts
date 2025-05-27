/**
 * Act 1 - Matrix: Flowing numbers, clinical waveforms, data visualization
 */

import * as THREE from "three";
import type { AudioAnalyzerInterface, AudioData } from "../types";
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

	protected async createContent(): Promise<void> {
		// Initialize fall speeds for Matrix rain effect
		this.fallSpeeds = new Float32Array(this.particleCount);

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
		this.materials.push(this.particleMaterial, this.waveformMaterial);
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

		// Change particle size for "digital rain" effect
		const trebleLevel = this.getSmoothedAudio("treble", 0.1);
		this.particleMaterial.size = 0.2 + trebleLevel * 0.15;

		// Subtle color variation
		const hue = 0.3 + trebleLevel * 0.05; // Slight color shift with treble
		this.particleMaterial.color.setHSL(hue, 1, 0.5);
	}

	protected async animateEnter(): Promise<void> {
		return this.createFadeTransition(1000);
	}

	protected async animateExit(): Promise<void> {
		return this.createFadeTransition(1000);
	}
}
