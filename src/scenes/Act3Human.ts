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
    private particleCount: number = 10000; // Increased for better definition
    private particleGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
    private particleMaterial: THREE.PointsMaterial = new THREE.PointsMaterial();
    private flowField: Float32Array = new Float32Array(8000 * 3);
    private velocities: Float32Array = new Float32Array(8000 * 3);
    private heartPhase: number = 0;
    private lastHeartbeat: number = 0;
    private heartbeatInterval: number = 1000; // Base interval in ms
    private heartCenter: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
    private heartScale: number = 12; // Increased size for better visibility

    protected async createContent(): Promise<void> {
        // Create particles in a planar distribution
        const positions = new Float32Array(this.particleCount * 3);

        for (let i = 0; i < this.particleCount; i++) {
            // Create particles in a circular distribution
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.sqrt(Math.random()) * 20; // Square root for uniform density

            // Keep particles mostly in a plane (small z variation)
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const z = (Math.random() - 0.5) * 2; // Very thin depth

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Initialize flow field (natural particle positions)
            this.flowField[i * 3] = x;
            this.flowField[i * 3 + 1] = y;
            this.flowField[i * 3 + 2] = z;

            // Initialize velocities
            this.velocities[i * 3] = 0;
            this.velocities[i * 3 + 1] = 0;
            this.velocities[i * 3 + 2] = 0;
        }

        this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Smaller, brighter particles for better definition
        this.particleMaterial.size = 0.1;
        this.particleMaterial.color = new THREE.Color(0xff8866);
        this.particleMaterial.transparent = true;
        this.particleMaterial.opacity = 0.8;
        this.particleMaterial.blending = THREE.AdditiveBlending;
        this.particleMaterial.depthWrite = false;

        // Create and add particles
        this.particles.push(new THREE.Points(this.particleGeometry, this.particleMaterial));
        this.group.add(this.particles[0]);

        // Add ambient light for general illumination
        const ambientLight = new THREE.AmbientLight(0x443333, 1);
        this.group.add(ambientLight);

        // Store materials for disposal
        this.materials.push(this.particleMaterial);
    }

    private getHeartForce(position: THREE.Vector3): THREE.Vector3 {
        // Calculate distance from heart center
        const dx = position.x - this.heartCenter.x;
        const dy = position.y - this.heartCenter.y; // Remove inversion

        // Create 2D heart shape influence
        const angle = Math.atan2(-dy, dx); // Invert angle instead
        const radius = Math.sqrt(dx * dx + dy * dy);

        // Heart curve factor (creates heart shape)
        const heartRadius = this.heartScale * (1 + Math.sin(angle)); // Remove inversion, use regular sine
        const heartShape = Math.pow(Math.abs(angle) / Math.PI, 0.2); // More pronounced heart shape
        const force = Math.exp(-radius / (heartRadius * (1 + heartShape))) * 2; // Doubled force

        // Create force vector pointing outward from heart
        return new THREE.Vector3(
            dx / (radius + 0.1) * force * 3,
            dy / (radius + 0.1) * force * 3, // Remove y force inversion
            0 // Keep forces in the plane
        );
    }

    protected updateContent(deltaTime: number): void {
        if (this.particles.length === 0) return;

        const deltaSeconds = deltaTime / 1000;
        const positions = this.particleGeometry.attributes.position.array as Float32Array;

        // Update heart timing
        const volume = this.getSmoothedAudio('volume', 0.2);
        const bassLevel = this.getSmoothedAudio('bass', 0.3);

        // Detect heartbeat from bass or use regular interval
        const heartbeatThreshold = 0.5; // Even lower threshold for more beats
        if (bassLevel > heartbeatThreshold && (this.time - this.lastHeartbeat) > this.heartbeatInterval * 0.3) { // Shorter cooldown
            this.lastHeartbeat = this.time;
        }

        // Calculate heartbeat influence
        const timeSinceHeartbeat = (this.time - this.lastHeartbeat) / this.heartbeatInterval;
        const heartbeatPulse = Math.exp(-timeSinceHeartbeat * 3) * (1 + bassLevel * 3); // Stronger pulse

        // Update particles with fluid-like motion
        const temp = new THREE.Vector3();

        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;

            // Get current particle position
            temp.set(
                positions[i3],
                positions[i3 + 1],
                positions[i3 + 2]
            );

            // Calculate heart force
            const force = this.getHeartForce(temp);

            // Apply force to velocity (scaled by heartbeat)
            this.velocities[i3] += force.x * heartbeatPulse * 6;
            this.velocities[i3 + 1] += force.y * heartbeatPulse * 6;
            this.velocities[i3 + 2] = 0; // Keep particles in plane

            // Apply velocity to position
            positions[i3] += this.velocities[i3];
            positions[i3 + 1] += this.velocities[i3 + 1];
            positions[i3 + 2] = this.flowField[i3 + 2]; // Keep original z position

            // Apply minimal damping for very quick motion
            this.velocities[i3] *= 0.82;
            this.velocities[i3 + 1] *= 0.82;

            // Faster return to rest positions
            const returnForce = 0.15;
            positions[i3] += (this.flowField[i3] - positions[i3]) * returnForce * deltaSeconds;
            positions[i3 + 1] += (this.flowField[i3 + 1] - positions[i3 + 1]) * returnForce * deltaSeconds;
        }

        this.particleGeometry.attributes.position.needsUpdate = true;
    }

    protected updateVisualEffects(deltaTime: number): void {
        // Emotional color changes based on audio
        const midLevel = this.getSmoothedAudio('mid', 0.2);
        const volume = this.getSmoothedAudio('volume', 0.1);
        const trebleLevel = this.getSmoothedAudio('treble', 0.15);

        // Calculate time since last heartbeat for color pulsing
        const timeSinceHeartbeat = (this.time - this.lastHeartbeat) / this.heartbeatInterval;
        const heartbeatColor = Math.exp(-timeSinceHeartbeat * 5) * 0.2;

        // Warm color palette variations
        const hue = 0.95 + midLevel * 0.05; // Red to pink range
        const saturation = 0.7 + volume * 0.3;
        const lightness = 0.5 + heartbeatColor + trebleLevel * 0.2;

        // Update particle colors
        this.particleMaterial.color.setHSL(hue, saturation, lightness);

        // Dynamic opacity based on volume and heartbeat
        this.particleMaterial.opacity = 0.4 + volume * 0.3 + heartbeatColor;

        // Particle size variation with treble and heartbeat
        this.particleMaterial.size = 0.15 + trebleLevel * 0.1 + heartbeatColor * 0.1;
    }

    protected async animateEnter(): Promise<void> {
        return this.createFadeTransition(1000);
    }

    protected async animateExit(): Promise<void> {
        return this.createFadeTransition(1000);
    }
}
