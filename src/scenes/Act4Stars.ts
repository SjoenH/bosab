/**
 * Act 4 - Stars: Expanding starfield, meditative drift, cosmic wonder
 * 
 * Creates an infinite starfield that expands and contracts with audio,
 * representing the cosmic/universal conclusion of the performance.
 */

import * as THREE from 'three';
import { BaseAct } from './BaseAct';
import type { AudioData, AudioAnalyzerInterface } from '../types';

export class Act4Stars extends BaseAct {
    private particleCount: number = 3000;
    private particleGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
    private particleMaterial: THREE.PointsMaterial = new THREE.PointsMaterial();
    private originalPositions: Float32Array = new Float32Array(9000); // 3000 * 3
    private velocities: Float32Array = new Float32Array(9000);

    protected async createContent(): Promise<void> {
        // Create particles in a spherical distribution
        const positions = new Float32Array(this.particleCount * 3);

        for (let i = 0; i < this.particleCount; i++) {
            // Spherical distribution
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const radius = Math.random() * 40;

            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);

            positions[i * 3] = this.originalPositions[i * 3] = x;
            positions[i * 3 + 1] = this.originalPositions[i * 3 + 1] = y;
            positions[i * 3 + 2] = this.originalPositions[i * 3 + 2] = z;

            // Initialize velocities
            this.velocities[i * 3] = (Math.random() - 0.5) * 0.02;
            this.velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
            this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
        }

        this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Create star-like particles
        this.particleMaterial.size = 0.1;
        this.particleMaterial.color = new THREE.Color(0xffffff);
        this.particleMaterial.transparent = true;
        this.particleMaterial.opacity = 0.8;
        this.particleMaterial.blending = THREE.AdditiveBlending;

        // Create and add particles
        this.particles.push(new THREE.Points(this.particleGeometry, this.particleMaterial));
        this.group.add(this.particles[0]);

        // Store material for disposal
        this.materials.push(this.particleMaterial);
    }

    protected updateContent(deltaTime: number): void {
        if (this.particles.length === 0) return;

        const positions = this.particleGeometry.attributes.position.array as Float32Array;
        const volume = this.getSmoothedAudio('volume', 0.3);
        const bassLevel = this.getSmoothedAudio('bass', 0.2);

        // Update star positions
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;

            // Move stars outward based on audio
            const expansionRate = 1.0 + volume * 0.5;

            positions[i3] += this.velocities[i3] * expansionRate;
            positions[i3 + 1] += this.velocities[i3 + 1] * expansionRate;
            positions[i3 + 2] += this.velocities[i3 + 2] * expansionRate;

            // Reset stars that go too far out
            const distance = Math.sqrt(
                positions[i3] * positions[i3] +
                positions[i3 + 1] * positions[i3 + 1] +
                positions[i3 + 2] * positions[i3 + 2]
            );

            if (distance > 50) {
                // Reset to original position with new velocity
                positions[i3] = this.originalPositions[i3] * 0.1;
                positions[i3 + 1] = this.originalPositions[i3 + 1] * 0.1;
                positions[i3 + 2] = this.originalPositions[i3 + 2] * 0.1;

                this.velocities[i3] = (Math.random() - 0.5) * 0.02;
                this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
                this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
            }
        }

        this.particleGeometry.attributes.position.needsUpdate = true;

        // Very slow rotation of the entire starfield (convert deltaTime from ms to seconds)
        this.particles[0].rotation.y += (deltaTime / 1000) * 0.05;
    }

    protected updateVisualEffects(deltaTime: number): void {
        // Starlight intensity varies with audio
        const midLevel = this.getSmoothedAudio('mid', 0.2);
        const trebleLevel = this.getSmoothedAudio('treble', 0.1);

        // Color shift from blue to white based on intensity
        const intensity = 0.5 + trebleLevel * 0.5;
        this.particleMaterial.color.setHSL(0.6, 0.2, intensity);

        // Size variation with mid frequencies
        this.particleMaterial.size = 0.1 + midLevel * 0.15;

        // Opacity pulsing with bass
        const bassLevel = this.getSmoothedAudio('bass', 0.3);
        this.particleMaterial.opacity = 0.6 + bassLevel * 0.4;
    }

    protected async animateEnter(): Promise<void> {
        return this.createFadeTransition(1000);
    }

    protected async animateExit(): Promise<void> {
        return this.createFadeTransition(1000);
    }
}
