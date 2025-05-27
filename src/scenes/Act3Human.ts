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
    private particleCount: number = 25000; // Much more particles for better definition
    private particleGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
    private particleMaterial: THREE.PointsMaterial = new THREE.PointsMaterial();
    private flowField: Float32Array = new Float32Array(25000 * 3);
    private velocities: Float32Array = new Float32Array(25000 * 3);
    private heartPhase: number = 0;
    private lastHeartbeat: number = 0;
    private heartbeatInterval: number = 800; // Base interval in ms (75 BPM)
    private heartCenter: THREE.Vector3 = new THREE.Vector3(0, 5, 0); // Move heart up for better framing
    private heartScale: number = 2; // Very small initial size
    private autoHeartbeat: boolean = true; // Enable automatic heartbeat
    private heartbeatCycle: number = 0; // Track the heartbeat cycle for lub-dub pattern
    private startupDelay: number = 3000; // Wait 3 seconds before starting heartbeat
    private actStartTime: number = 0; // Track when the act started

    protected async createContent(): Promise<void> {
        // Create particles in a planar distribution
        const positions = new Float32Array(this.particleCount * 3);

        for (let i = 0; i < this.particleCount; i++) {
            // Create particles in a circular distribution around the elevated heart center
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.sqrt(Math.random()) * 3; // Much smaller initial size

            // Keep particles mostly in a plane (small z variation)
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius + 5; // Center around elevated heart position
            const z = (Math.random() - 0.5) * 0.3; // Very thin depth

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

        // Configure particles as circles without glow
        this.particleMaterial.size = 0.08;
        this.particleMaterial.color = new THREE.Color(0xff8866);
        this.particleMaterial.transparent = true;
        this.particleMaterial.opacity = 0.7;
        this.particleMaterial.blending = THREE.NormalBlending; // No additive blending for cleaner circles
        this.particleMaterial.depthWrite = false;

        // Make particles circular
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const context = canvas.getContext('2d');

        if (context) {
            // Draw a perfect circle
            context.clearRect(0, 0, 32, 32);
            context.fillStyle = 'white';
            context.beginPath();
            context.arc(16, 16, 15, 0, Math.PI * 2);
            context.fill();

            const texture = new THREE.CanvasTexture(canvas);
            this.particleMaterial.map = texture;
        }

        // Create and add particles
        this.particles.push(new THREE.Points(this.particleGeometry, this.particleMaterial));
        this.group.add(this.particles[0]);

        // Add ambient light for general illumination
        const ambientLight = new THREE.AmbientLight(0x443333, 1);
        this.group.add(ambientLight);

        // Store materials for disposal
        this.materials.push(this.particleMaterial);

        // Record start time for startup delay
        this.actStartTime = performance.now();
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
        const force = Math.exp(-radius / (heartRadius * (1 + heartShape))) * 0.05; // Much gentler force

        // Create force vector pointing outward from heart
        return new THREE.Vector3(
            dx / (radius + 0.1) * force * 1,
            dy / (radius + 0.1) * force * 1, // Much gentler push
            0 // Keep forces in the plane
        );
    }

    protected updateContent(deltaTime: number): void {
        if (this.particles.length === 0) return;

        const deltaSeconds = deltaTime / 1000;
        const positions = this.particleGeometry.attributes.position.array as Float32Array;

        // Update heart timing - create realistic heartbeat pattern
        const volume = this.getSmoothedAudio('volume', 0.2);
        const bassLevel = this.getSmoothedAudio('bass', 0.3);

        // Check if we're still in startup delay period
        const currentTime = this.time;
        const timeSinceStart = currentTime - this.actStartTime;
        const isStartupPhase = timeSinceStart < this.startupDelay;

        // Auto heartbeat or audio-triggered heartbeat (only after startup delay)
        const timeSinceLastBeat = currentTime - this.lastHeartbeat;

        // Create lub-dub heartbeat pattern
        let shouldBeat = false;

        if (!isStartupPhase) {
            if (this.autoHeartbeat && timeSinceLastBeat > this.heartbeatInterval) {
                shouldBeat = true;
            } else if (bassLevel > 0.6 && timeSinceLastBeat > this.heartbeatInterval * 0.5) {
                shouldBeat = true;
                this.autoHeartbeat = false; // Switch to audio-driven mode
            } else if (bassLevel < 0.3 && timeSinceLastBeat > this.heartbeatInterval * 2) {
                this.autoHeartbeat = true; // Return to auto mode if audio is quiet
            }
        }

        if (shouldBeat) {
            this.lastHeartbeat = currentTime;
            this.heartbeatCycle = (this.heartbeatCycle + 1) % 2; // Alternate between lub (0) and dub (1)
        }

        // Calculate heartbeat pulse with lub-dub pattern (only if not in startup phase)
        const beatProgress = Math.min(timeSinceLastBeat / (this.heartbeatInterval * 0.4), 1);

        let heartbeatPulse = 0;
        if (!isStartupPhase && beatProgress < 1) {
            if (this.heartbeatCycle === 0) {
                // "Lub" - stronger, longer pulse
                heartbeatPulse = Math.exp(-beatProgress * 8) * (2 + bassLevel * 3);
            } else {
                // "Dub" - shorter, weaker pulse  
                heartbeatPulse = Math.exp(-beatProgress * 12) * (1.2 + bassLevel * 2);
            }
        }

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
            this.velocities[i3] += force.x * heartbeatPulse * 4; // Reduced multiplier
            this.velocities[i3 + 1] += force.y * heartbeatPulse * 4; // Reduced multiplier
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

        // Calculate time since last heartbeat for visual pulsing
        const timeSinceHeartbeat = (this.time - this.lastHeartbeat);
        const beatProgress = Math.min(timeSinceHeartbeat / (this.heartbeatInterval * 0.4), 1);
        const timeSinceStart = this.time - this.actStartTime;
        const isStartupPhase = timeSinceStart < this.startupDelay;

        let heartbeatColor = 0;

        // Only apply heartbeat visual effects after startup delay (no glow)
        if (!isStartupPhase && beatProgress < 1) {
            if (this.heartbeatCycle === 0) {
                // "Lub" - red color shift
                heartbeatColor = Math.exp(-beatProgress * 6) * 0.3;
            } else {
                // "Dub" - softer color shift
                heartbeatColor = Math.exp(-beatProgress * 10) * 0.15;
            }
        }

        // Warm color palette with heartbeat influence
        const hue = 0.02 + midLevel * 0.03 - heartbeatColor * 0.02; // More red during heartbeat
        const saturation = 0.8 + volume * 0.2 + heartbeatColor * 0.2;
        const lightness = 0.5 + trebleLevel * 0.15; // Removed glow component

        // Update particle colors
        this.particleMaterial.color.setHSL(hue, saturation, lightness);

        // Dynamic opacity and size without glow effects
        this.particleMaterial.opacity = 0.6 + volume * 0.2;
        this.particleMaterial.size = 0.08 + trebleLevel * 0.05 + heartbeatColor * 0.03;
    }

    protected async animateEnter(): Promise<void> {
        return this.createFadeTransition(1000);
    }

    protected async animateExit(): Promise<void> {
        return this.createFadeTransition(1000);
    }
}
