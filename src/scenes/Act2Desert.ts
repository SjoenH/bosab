/**
 * Act 2 - Desert: Shifting sand landscapes and heartbeat-driven terrain
 * 
 * Creates undulating sand dunes that respond to heartbeat rhythms and audio,
 * representing the organic/natural transition from digital to human.
 */

import * as THREE from 'three';
import { BaseAct } from './BaseAct';
import type { AudioData, AudioAnalyzerInterface } from '../types';

export class Act2Desert extends BaseAct {
    private particleCount: number = 2000;
    private particleGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
    private particleMaterial: THREE.PointsMaterial = new THREE.PointsMaterial();
    private initialPositions: Float32Array = new Float32Array(6000); // 2000 particles * 3 coordinates

    protected async createContent(): Promise<void> {
        // Create particles in a wave-like formation
        const positions = new Float32Array(this.particleCount * 3);

        for (let i = 0; i < this.particleCount; i++) {
            const angle = (i / this.particleCount) * Math.PI * 8;
            const radius = 20 + Math.cos(angle * 2) * 5;

            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle / 2) * 10;
            const z = Math.sin(angle) * radius;

            positions[i * 3] = this.initialPositions[i * 3] = x;
            positions[i * 3 + 1] = this.initialPositions[i * 3 + 1] = y;
            positions[i * 3 + 2] = this.initialPositions[i * 3 + 2] = z;
        }

        this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Warm sandy particles
        this.particleMaterial.size = 0.15;
        this.particleMaterial.color = new THREE.Color(0xd4a017);
        this.particleMaterial.transparent = true;
        this.particleMaterial.opacity = 0.7;
        this.particleMaterial.blending = THREE.AdditiveBlending;

        // Create and add particles
        this.particles.push(new THREE.Points(this.particleGeometry, this.particleMaterial));
        this.group.add(this.particles[0]);

        // Store material for disposal
        this.materials.push(this.particleMaterial);
    }

    protected updateContent(deltaTime: number): void {
        if (this.particles.length === 0) return;

        // Update particle positions based on audio
        const positions = this.particleGeometry.attributes.position.array as Float32Array;
        const bassLevel = this.getSmoothedAudio('bass', 0.3);
        const volume = this.getSmoothedAudio('volume', 0.1);

        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;

            // Create undulating wave effect
            const time = this.time * 0.001;
            const offset = i * 0.01;

            positions[i3] = this.initialPositions[i3] + Math.sin(time + offset) * bassLevel * 5;
            positions[i3 + 1] = this.initialPositions[i3 + 1] +
                Math.cos(time * 0.5 + offset) * volume * 3;
            positions[i3 + 2] = this.initialPositions[i3 + 2] +
                Math.sin(time * 0.7 + offset) * bassLevel * 5;
        }

        this.particleGeometry.attributes.position.needsUpdate = true;

        // Slow rotation (convert deltaTime from ms to seconds)
        this.particles[0].rotation.y += (deltaTime / 1000) * 0.2;
    }

    protected updateVisualEffects(deltaTime: number): void {
        // Pulse color with mid frequencies
        const midLevel = this.getSmoothedAudio('mid', 0.2);
        const hue = 0.08 + midLevel * 0.02; // Subtle color variation in the golden range
        this.particleMaterial.color.setHSL(hue, 0.7, 0.5);

        // Adjust particle size with volume
        const volume = this.getSmoothedAudio('volume', 0.1);
        this.particleMaterial.size = 0.15 + volume * 0.1;
    }

    protected async animateEnter(): Promise<void> {
        return this.createFadeTransition(1000);
    }

    protected async animateExit(): Promise<void> {
        return this.createFadeTransition(1000);
    }
}
