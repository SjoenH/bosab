/**
 * Act 2 - Desert: Shifting sand landscapes and heartbeat-driven terrain
 */

import * as THREE from 'three';
import { BaseAct } from './BaseAct';
import type { AudioData, AudioAnalyzerInterface } from '../types';

export class Act2Desert extends BaseAct {
    private particleCount: number = 10000;
    private particleGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
    private particleMaterial: THREE.PointsMaterial = new THREE.PointsMaterial();
    private initialPositions: Float32Array = new Float32Array(30000);
    private velocities: Float32Array = new Float32Array(30000);
    private turbulence: Float32Array = new Float32Array(30000);
    private lastHeartbeat: number = 0;
    private heartbeatInterval: number = 1000;
    private windDirection: THREE.Vector2 = new THREE.Vector2(1, 0);
    private windStrength: number = 0;

    protected async createContent(): Promise<void> {
        // Keep the desert plane horizontal, camera will look down at it
        this.group.position.y = -5;

        const positions = new Float32Array(this.particleCount * 3);
        const gridSize = Math.sqrt(this.particleCount);

        // Create dunes on a horizontal plane
        for (let i = 0; i < this.particleCount; i++) {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;

            // Base grid position (now on X-Z plane)
            let x = (col / gridSize - 0.5) * 80;
            let z = (row / gridSize - 0.5) * 80;

            // Add dune height variations using multiple sine waves
            const distanceFromCenter = Math.sqrt(x * x + z * z);
            const angle = Math.atan2(z, x);

            // More pronounced dune patterns
            const dune1 = Math.sin(distanceFromCenter * 0.1) * 4;
            const dune2 = Math.sin(angle * 3 + distanceFromCenter * 0.05) * 2;
            const dune3 = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 3;

            // Y is now the height of the dunes
            const y = dune1 + dune2 + dune3;

            // Add subtle random variation
            x += (Math.random() - 0.5) * 0.5;
            z += (Math.random() - 0.5) * 0.5;

            // Store positions
            positions[i * 3] = this.initialPositions[i * 3] = x;
            positions[i * 3 + 1] = this.initialPositions[i * 3 + 1] = y;
            positions[i * 3 + 2] = this.initialPositions[i * 3 + 2] = z;

            // Initialize velocities
            this.velocities[i * 3] = (Math.random() - 0.5) * 0.01;
            this.velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.005; // Reduced vertical velocity
            this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;

            // Initialize turbulence
            this.turbulence[i * 3] = Math.random();
            this.turbulence[i * 3 + 1] = Math.random() * 0.5; // Reduced vertical turbulence
            this.turbulence[i * 3 + 2] = Math.random();
        }

        this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Adjust particle material for top-down view
        this.particleMaterial.size = 0.15;
        this.particleMaterial.color = new THREE.Color(0xd4a017);
        this.particleMaterial.transparent = true;
        this.particleMaterial.opacity = 0.6;
        this.particleMaterial.blending = THREE.AdditiveBlending;
        this.particleMaterial.depthWrite = false; // Better particle blending

        // Create and add particles
        this.particles.push(new THREE.Points(this.particleGeometry, this.particleMaterial));
        this.group.add(this.particles[0]);

        // Store material for disposal
        this.materials.push(this.particleMaterial);
    }

    protected updateContent(deltaTime: number): void {
        if (this.particles.length === 0) return;

        const deltaSeconds = deltaTime / 1000;
        const positions = this.particleGeometry.attributes.position.array as Float32Array;
        const bassLevel = this.getSmoothedAudio('bass', 0.3);
        const volume = this.getSmoothedAudio('volume', 0.1);
        const midLevel = this.getSmoothedAudio('mid', 0.2);

        // Update wind direction based on audio
        this.windDirection.x += (Math.random() - 0.5) * 0.1 * volume;
        this.windDirection.y += (Math.random() - 0.5) * 0.1 * volume;
        this.windDirection.normalize();

        // Update wind strength
        this.windStrength = Math.max(0, Math.min(1, this.windStrength + (volume - 0.5) * 0.1));

        // Detect heartbeat
        if (bassLevel > 0.7 && (this.time - this.lastHeartbeat) > this.heartbeatInterval) {
            this.lastHeartbeat = this.time;
        }

        // Calculate heartbeat influence
        const timeSinceHeartbeat = (this.time - this.lastHeartbeat) / this.heartbeatInterval;
        const heartbeatPulse = Math.exp(-timeSinceHeartbeat * 5) * Math.sin(timeSinceHeartbeat * Math.PI * 2);

        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;

            // Apply fluid dynamics (mainly in X-Z plane)
            const windInfluence = this.windStrength * deltaSeconds;
            const turbulence = this.turbulence[i3];

            // Update velocities (mainly horizontal movement)
            this.velocities[i3] += this.windDirection.x * windInfluence * turbulence;
            this.velocities[i3 + 2] += this.windDirection.y * windInfluence * turbulence;

            // Apply heartbeat influence
            const distanceFromCenter = Math.sqrt(
                positions[i3] * positions[i3] +
                positions[i3 + 2] * positions[i3 + 2]
            );
            const heartbeatInfluence = heartbeatPulse * Math.exp(-distanceFromCenter * 0.1) * bassLevel;

            // Update positions
            positions[i3] += this.velocities[i3];
            positions[i3 + 1] = this.initialPositions[i3 + 1] +
                heartbeatInfluence * 1.5 + // Reduced vertical movement
                Math.sin(this.time * 0.0005 + distanceFromCenter * 0.05) * midLevel;
            positions[i3 + 2] += this.velocities[i3 + 2];

            // Apply stronger damping to vertical movement
            this.velocities[i3] *= 0.98;
            this.velocities[i3 + 1] *= 0.95; // Stronger damping for height
            this.velocities[i3 + 2] *= 0.98;

            // Keep particles within bounds (larger area)
            const bound = 40;
            if (Math.abs(positions[i3]) > bound) {
                positions[i3] = Math.sign(positions[i3]) * bound;
                this.velocities[i3] *= -0.5;
            }
            if (Math.abs(positions[i3 + 2]) > bound) {
                positions[i3 + 2] = Math.sign(positions[i3 + 2]) * bound;
                this.velocities[i3 + 2] *= -0.5;
            }
        }

        this.particleGeometry.attributes.position.needsUpdate = true;
    }

    protected updateVisualEffects(deltaTime: number): void {
        const volume = this.getSmoothedAudio('volume', 0.1);
        const bassLevel = this.getSmoothedAudio('bass', 0.2);
        const midLevel = this.getSmoothedAudio('mid', 0.15);

        // Sunset-like color variations
        const hue = 0.08 + midLevel * 0.02; // Subtle shifts in gold/orange
        const saturation = 0.6 + bassLevel * 0.2;
        const lightness = 0.5 + volume * 0.1;
        this.particleMaterial.color.setHSL(hue, saturation, lightness);

        // Dynamic particle size based on position and audio
        this.particleMaterial.size = 0.1 + volume * 0.05;

        // Opacity changes with motion
        this.particleMaterial.opacity = 0.4 + this.windStrength * 0.3 + bassLevel * 0.2;
    }

    protected async animateEnter(): Promise<void> {
        return this.createFadeTransition(1000);
    }

    protected async animateExit(): Promise<void> {
        return this.createFadeTransition(1000);
    }
}
