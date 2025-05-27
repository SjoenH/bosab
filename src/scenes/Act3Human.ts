/**
 * Act 3 - Human: Organic forms, poetry overlays, emotional visuals
 * 
 * Creates flowing organic shapes that respond to emotional audio cues,
 * with poetry text overlays representing the human element.
 */

import * as THREE from 'three';
import { BaseAct } from './BaseAct';
import type { AudioData, AudioAnalyzerInterface } from '../types';

export class Act3Human extends BaseAct {
    private particleCount: number = 1500;
    private particleGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
    private particleMaterial: THREE.PointsMaterial = new THREE.PointsMaterial();
    private flowField: Float32Array = new Float32Array(1500 * 3);

    protected async createContent(): Promise<void> {
        // Create particles in a heart-like shape
        const positions = new Float32Array(this.particleCount * 3);

        for (let i = 0; i < this.particleCount; i++) {
            const t = (i / this.particleCount) * Math.PI * 2;
            // Heart curve equation
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
            const z = Math.sin(t) * 5;

            // Scale down the shape
            positions[i * 3] = x * 0.5;
            positions[i * 3 + 1] = y * 0.5;
            positions[i * 3 + 2] = z * 0.5;

            // Initialize flow field
            this.flowField[i * 3] = x * 0.5;
            this.flowField[i * 3 + 1] = y * 0.5;
            this.flowField[i * 3 + 2] = z * 0.5;
        }

        this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Soft, warm-colored particles
        this.particleMaterial.size = 0.2;
        this.particleMaterial.color = new THREE.Color(0xff6b6b);
        this.particleMaterial.transparent = true;
        this.particleMaterial.opacity = 0.6;
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
        const volume = this.getSmoothedAudio('volume', 0.2);
        const bassLevel = this.getSmoothedAudio('bass', 0.3);

        // Create organic flowing motion
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            const time = this.time * 0.001;

            // Create flowing motion based on noise
            const xOffset = Math.sin(time + i * 0.1) * volume * 2;
            const yOffset = Math.cos(time * 0.8 + i * 0.05) * volume * 2;
            const zOffset = Math.sin(time * 1.2 + i * 0.15) * volume * 2;

            // Add heartbeat effect with bass
            const heartbeat = Math.sin(time * 4) * bassLevel * 0.5;

            positions[i3] = this.flowField[i3] + xOffset;
            positions[i3 + 1] = this.flowField[i3 + 1] + yOffset + heartbeat;
            positions[i3 + 2] = this.flowField[i3 + 2] + zOffset;
        }

        this.particleGeometry.attributes.position.needsUpdate = true;

        // Gentle rotation (convert deltaTime from ms to seconds)
        this.particles[0].rotation.y += (deltaTime / 1000) * 0.1;
        this.particles[0].rotation.x += (deltaTime / 1000) * 0.05;
    }

    protected updateVisualEffects(deltaTime: number): void {
        // Emotional color changes based on mid frequencies
        const midLevel = this.getSmoothedAudio('mid', 0.2);
        const hue = 0.95 + midLevel * 0.1; // Variations of red/pink
        this.particleMaterial.color.setHSL(hue, 0.6, 0.6);

        // Particle size variation with treble
        const trebleLevel = this.getSmoothedAudio('treble', 0.1);
        this.particleMaterial.size = 0.2 + trebleLevel * 0.15;

        // Opacity changes with volume
        const volume = this.getSmoothedAudio('volume', 0.1);
        this.particleMaterial.opacity = 0.4 + volume * 0.4;
    }

    protected async animateEnter(): Promise<void> {
        return this.createFadeTransition(1000);
    }

    protected async animateExit(): Promise<void> {
        return this.createFadeTransition(1000);
    }
}
