/**
 * Act 1 - Matrix: Flowing numbers, clinical waveforms, data visualization
 * 
 * Creates a matrix-like particle system that responds to audio input,
 * representing the digital/data starting point of the performance.
 */

import * as THREE from 'three';
import { BaseAct } from './BaseAct';
import type { AudioData, AudioAnalyzerInterface } from '../types';

export class Act1Matrix extends BaseAct {
    private particleCount: number = 1000;
    private particleGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
    private particleMaterial: THREE.PointsMaterial = new THREE.PointsMaterial();

    protected async createContent(): Promise<void> {
        // Create particles in a grid formation
        const positions = new Float32Array(this.particleCount * 3);
        for (let i = 0; i < this.particleCount; i++) {
            const x = (Math.random() - 0.5) * 40;
            const y = (Math.random() - 0.5) * 40;
            const z = (Math.random() - 0.5) * 40;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
        }

        this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Green matrix-like particles
        this.particleMaterial.size = 0.1;
        this.particleMaterial.color = new THREE.Color(0x00ff00);
        this.particleMaterial.transparent = true;
        this.particleMaterial.opacity = 0.6;
        this.particleMaterial.blending = THREE.AdditiveBlending;

        // Create and add particles to the scene
        this.particles.push(new THREE.Points(this.particleGeometry, this.particleMaterial));
        this.group.add(this.particles[0]);

        // Store material for later disposal
        this.materials.push(this.particleMaterial);
    }

    protected updateContent(deltaTime: number): void {
        if (!this.particles) return;

        // Rotate particles slowly (convert deltaTime from ms to seconds)
        this.particles[0].rotation.y += (deltaTime / 1000) * 0.5;

        // Update particle positions based on audio
        const positions = this.particleGeometry.attributes.position.array as Float32Array;
        const audioLevel = this.getSmoothedAudio('volume', 0.1);

        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            positions[i3 + 1] += Math.sin(this.time * 0.001 + i * 0.1) * audioLevel * 0.1;

            // Reset particles if they go too far
            if (Math.abs(positions[i3 + 1]) > 20) {
                positions[i3 + 1] = (Math.random() - 0.5) * 40;
            }
        }

        this.particleGeometry.attributes.position.needsUpdate = true;
    }

    protected updateVisualEffects(deltaTime: number): void {
        // Pulse opacity with bass
        const bassLevel = this.getSmoothedAudio('bass', 0.2);
        this.particleMaterial.opacity = 0.4 + bassLevel * 0.4;

        // Change particle size with treble
        const trebleLevel = this.getSmoothedAudio('treble', 0.1);
        this.particleMaterial.size = 0.1 + trebleLevel * 0.1;
    }

    protected async animateEnter(): Promise<void> {
        return this.createFadeTransition(1000);
    }

    protected async animateExit(): Promise<void> {
        return this.createFadeTransition(1000);
    }
}
