/**
 * Act 2 - Desert: Shifting sand landscapes and heartbeat-driven terrain
 */

import * as THREE from 'three';
import { BaseAct } from './BaseAct';
import type { AudioData, AudioAnalyzerInterface } from '../types';

export class Act2Desert extends BaseAct {
    private particleCount = 10000;
    private particleGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
    private particleMaterial: THREE.PointsMaterial = new THREE.PointsMaterial();
    private initialPositions: Float32Array = new Float32Array(this.particleCount * 3);
    private velocities: Float32Array = new Float32Array(this.particleCount * 3);
    private turbulence: Float32Array = new Float32Array(this.particleCount * 3);
    private lastHeartbeat = 0;
    private heartbeatInterval = 1000;
    private windDirection: THREE.Vector2 = new THREE.Vector2(1, 0);
    private windStrength = 0;

    // Properties for the new dust particle system
    private dustParticleCount = 15000; // Increased for more volume
    private dustParticleGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
    private dustParticleMaterial: THREE.PointsMaterial = new THREE.PointsMaterial();
    private dustPositions: Float32Array = new Float32Array(this.dustParticleCount * 3);
    private dustVelocities: Float32Array = new Float32Array(this.dustParticleCount * 3);

    // Properties for the new wind streak particle system
    private streakParticleCount = 3000;
    private streakParticleGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
    private streakParticleMaterial: THREE.PointsMaterial = new THREE.PointsMaterial();
    private streakPositions!: Float32Array; // Initialized in createContent
    private streakVelocities!: Float32Array; // Initialized in createContent


    protected async createContent(): Promise<void> {
        // Keep the desert plane horizontal, camera will look down at it
        this.group.position.y = -5;

        const positions = new Float32Array(this.particleCount * 3);
        this.initialPositions = new Float32Array(this.particleCount * 3); // Ensure this is sized correctly
        this.velocities = new Float32Array(this.particleCount * 3);
        this.turbulence = new Float32Array(this.particleCount * 3);

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

        // Initialize dust particle system
        this.dustPositions = new Float32Array(this.dustParticleCount * 3);
        this.dustVelocities = new Float32Array(this.dustParticleCount * 3);

        for (let i = 0; i < this.dustParticleCount; i++) {
            const i3 = i * 3;
            // Spread horizontally over the same area as dunes
            this.dustPositions[i3] = (Math.random() - 0.5) * 80; // x
            // Start at a wider and slightly higher height band for more vertical spread
            this.dustPositions[i3 + 1] = Math.random() * 15 + 5;  // y (e.g., local Y: 5 to 20 units high)
            this.dustPositions[i3 + 2] = (Math.random() - 0.5) * 80; // z

            // Initial velocities mostly horizontal, with some randomness
            this.dustVelocities[i3] = (Math.random() - 0.5) * 2; // x velocity
            this.dustVelocities[i3 + 1] = 0; // No initial vertical velocity for dust
            this.dustVelocities[i3 + 2] = (Math.random() - 0.5) * 2; // z velocity
        }
        this.dustParticleGeometry.setAttribute('position', new THREE.BufferAttribute(this.dustPositions, 3));

        this.dustParticleMaterial.size = 0.1; // Increased initial size
        this.dustParticleMaterial.color = new THREE.Color(0xb0a090); // Lighter, desaturated sand color
        this.dustParticleMaterial.transparent = true;
        this.dustParticleMaterial.opacity = 0.5; // Increased initial opacity
        this.dustParticleMaterial.blending = THREE.NormalBlending; // Normal blending for a softer look
        this.dustParticleMaterial.depthWrite = false;

        const dustSystem = new THREE.Points(this.dustParticleGeometry, this.dustParticleMaterial);
        dustSystem.name = "DustParticles";
        this.group.add(dustSystem);
        // Add to a general particles array if BaseAct handles disposal through it,
        // or manage separately if needed. For now, let's assume BaseAct can handle it via materials.
        this.materials.push(this.dustParticleMaterial); // Ensure material is disposed
        // If you have a this.particles array for THREE.Points objects for other reasons:
        // this.particles.push(dustSystem);

        // Initialize wind streak particle system
        this.streakPositions = new Float32Array(this.streakParticleCount * 3);
        this.streakVelocities = new Float32Array(this.streakParticleCount * 3);

        const streakSpread = 90; // Streaks can originate from a slightly wider area
        const streakYMin = 6.0;
        const streakYMax = 18.0;

        for (let i = 0; i < this.streakParticleCount; i++) {
            const i3 = i * 3;
            this.streakPositions[i3] = (Math.random() - 0.5) * streakSpread; // x
            this.streakPositions[i3 + 1] = streakYMin + Math.random() * (streakYMax - streakYMin);  // y
            this.streakPositions[i3 + 2] = (Math.random() - 0.5) * streakSpread; // z

            this.streakVelocities[i3] = (Math.random() - 0.5) * 3; // Initial horizontal velocity
            this.streakVelocities[i3 + 1] = 0; // No initial vertical velocity
            this.streakVelocities[i3 + 2] = (Math.random() - 0.5) * 3; // Initial horizontal velocity
        }
        this.streakParticleGeometry.setAttribute('position', new THREE.BufferAttribute(this.streakPositions, 3));

        this.streakParticleMaterial.size = 0.04;
        this.streakParticleMaterial.color = new THREE.Color(0xffffff);
        this.streakParticleMaterial.transparent = true;
        this.streakParticleMaterial.opacity = 0.25;
        this.streakParticleMaterial.blending = THREE.AdditiveBlending;
        this.streakParticleMaterial.depthWrite = false;

        const streakSystem = new THREE.Points(this.streakParticleGeometry, this.streakParticleMaterial);
        streakSystem.name = "WindStreaks";
        this.group.add(streakSystem);
        this.materials.push(this.streakParticleMaterial);
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
        const timeSinceHeartbeat = (this.time - this.lastHeartbeat) / this.heartbeatInterval;
        const heartbeatPulse = Math.exp(-timeSinceHeartbeat * 5) * Math.sin(timeSinceHeartbeat * Math.PI * 2);

        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;

            // Horizontal wind influence
            const windForceFactor = this.windStrength * deltaSeconds;
            const particleTurbulenceHorizontal = this.turbulence[i3];

            this.velocities[i3] += this.windDirection.x * windForceFactor * particleTurbulenceHorizontal;
            this.velocities[i3 + 2] += this.windDirection.y * windForceFactor * particleTurbulenceHorizontal;

            // Calculate current base Y position (dune surface + audio effects)
            const currentX = positions[i3];
            const currentZ = positions[i3 + 2];
            const distanceFromCenter = Math.sqrt(currentX * currentX + currentZ * currentZ);
            const dynamicBaseY = this.initialPositions[i3 + 1] +
                heartbeatPulse * Math.exp(-distanceFromCenter * 0.1) * bassLevel * 1.5 +
                Math.sin(this.time * 0.0005 + distanceFromCenter * 0.05) * midLevel;

            // Vertical forces
            // 1. Attraction/Gravity towards dynamicBaseY (settling force)
            const heightDifference = positions[i3 + 1] - dynamicBaseY;
            // Proportional force pulling towards base, stronger if further away
            const settlingAcceleration = -heightDifference * 2.0;
            this.velocities[i3 + 1] += settlingAcceleration * deltaSeconds;

            // 2. Dusty wind lift
            if (this.windStrength > 0.3) {
                const particleTurbulenceVertical = this.turbulence[i3 + 1];
                // Lift force proportional to wind strength and turbulence
                const liftAcceleration = this.windStrength * particleTurbulenceVertical * 5.0;
                this.velocities[i3 + 1] += liftAcceleration * deltaSeconds;

                // Occasional stronger gust lifts some particles more (direct velocity impulse)
                if (Math.random() < 0.05 * this.windStrength) {
                    this.velocities[i3 + 1] += Math.random() * this.windStrength * 0.2;
                }
            }

            // Update positions
            positions[i3] += this.velocities[i3] * deltaSeconds;
            positions[i3 + 1] += this.velocities[i3 + 1] * deltaSeconds;
            positions[i3 + 2] += this.velocities[i3 + 2] * deltaSeconds;

            // Damping
            this.velocities[i3] *= 0.96;
            this.velocities[i3 + 2] *= 0.96;

            // Vertical damping - less if being lifted by strong wind
            if (this.velocities[i3 + 1] > 0.01 && this.windStrength > 0.4 && heightDifference > 0.1) {
                this.velocities[i3 + 1] *= 0.92;
            } else {
                this.velocities[i3 + 1] *= 0.88;
            }

            // Ground collision: prevent particles from going too far below their dynamicBaseY
            if (positions[i3 + 1] < dynamicBaseY - 0.05) { // Allow a tiny bit of sink
                positions[i3 + 1] = dynamicBaseY - 0.05;
                if (this.velocities[i3 + 1] < 0) {
                    // If wind is strong, kick it back up
                    if (this.windStrength > 0.35) {
                        this.velocities[i3 + 1] = Math.random() * this.windStrength * 0.15 * this.turbulence[i3 + 1];
                    } else {
                        this.velocities[i3 + 1] *= -0.2;
                    }
                }
            }

            // Keep particles within horizontal bounds (larger area)
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

        // Update dust particle system
        const dustPosAttribute = this.dustParticleGeometry.attributes.position as THREE.BufferAttribute;
        const dustPosArray = dustPosAttribute.array as Float32Array;
        const blowAwayLimit = 60;
        const dustMinY = 5.0;
        const dustMaxY = 22.0;
        const dustWindBaseSpeed = 10.0;
        const gravityEffect = 0.0; // Dust does not fall

        for (let i = 0; i < this.dustParticleCount; i++) {
            const i3 = i * 3;

            // Wind influence on dust
            const dustWindForceFactor = this.windStrength * dustWindBaseSpeed;
            const particleWindResponsiveness = 0.7 + Math.random() * 0.6;
            const sidewindAmplification = 1.8; // Amplify sideways wind effect

            // Apply amplified sidewind for X-axis, standard for Z-axis (windDirection.y maps to Z)
            this.dustVelocities[i3] += this.windDirection.x * dustWindForceFactor * particleWindResponsiveness * sidewindAmplification * deltaSeconds;
            this.dustVelocities[i3 + 2] += this.windDirection.y * dustWindForceFactor * particleWindResponsiveness * deltaSeconds;

            // Vertical movement: dust stays in its layer
            // No explicit lift, gravity is zero. Vertical position is maintained by boundaries and damping.
            // this.dustVelocities[i3 + 1] -= gravityEffect * deltaSeconds; // gravityEffect is 0

            // Update positions
            dustPosArray[i3] += this.dustVelocities[i3] * deltaSeconds;
            dustPosArray[i3 + 1] += this.dustVelocities[i3 + 1] * deltaSeconds;
            dustPosArray[i3 + 2] += this.dustVelocities[i3 + 2] * deltaSeconds;

            // Damping
            this.dustVelocities[i3] *= 0.99;
            this.dustVelocities[i3 + 1] *= 0.90;  // Stronger vertical damping for dust
            this.dustVelocities[i3 + 2] *= 0.99;

            // Boundary conditions for dust - Blow away and reset
            let resetParticle = false;

            // Check X boundary for reset
            if (dustPosArray[i3] > blowAwayLimit) {
                dustPosArray[i3] = -blowAwayLimit - Math.random() * 5; // Reset to other side, slightly outside
                resetParticle = true;
            } else if (dustPosArray[i3] < -blowAwayLimit) {
                dustPosArray[i3] = blowAwayLimit + Math.random() * 5;
                resetParticle = true;
            }

            // Check Z boundary for reset
            if (dustPosArray[i3 + 2] > blowAwayLimit) {
                dustPosArray[i3 + 2] = -blowAwayLimit - Math.random() * 5;
                resetParticle = true;
            } else if (dustPosArray[i3 + 2] < -blowAwayLimit) {
                dustPosArray[i3 + 2] = blowAwayLimit + Math.random() * 5;
                resetParticle = true;
            }

            if (resetParticle) {
                // Randomize the other horizontal coordinate within the main area to avoid lines of particles
                if (Math.abs(this.windDirection.x) > Math.abs(this.windDirection.y)) { // If wind is mostly X-Z
                    dustPosArray[i3 + 2] = (Math.random() - 0.5) * blowAwayLimit * 0.8;
                } else { // If wind is mostly Z-X
                    dustPosArray[i3] = (Math.random() - 0.5) * blowAwayLimit * 0.8;
                }
                dustPosArray[i3 + 1] = dustMinY + Math.random() * (dustMaxY - dustMinY); // Randomize Y position within the band

                // Give a slight nudge of velocity towards the center based on reset position
                this.dustVelocities[i3] = -Math.sign(dustPosArray[i3]) * Math.random() * 0.5;
                this.dustVelocities[i3 + 2] = -Math.sign(dustPosArray[i3 + 2]) * Math.random() * 0.5;
                this.dustVelocities[i3 + 1] = (Math.random() - 0.5) * 0.05; // Minimal random vertical velocity on reset
            }

            // Vertical boundary clamping for dust to keep it in its layer
            if (dustPosArray[i3 + 1] < dustMinY) {
                dustPosArray[i3 + 1] = dustMinY;
                this.dustVelocities[i3 + 1] = 0;
            } else if (dustPosArray[i3 + 1] > dustMaxY) {
                dustPosArray[i3 + 1] = dustMaxY;
                this.dustVelocities[i3 + 1] = 0;
            }
        }
        dustPosAttribute.needsUpdate = true;

        // Update wind streak particle system
        const streakPosAttribute = this.streakParticleGeometry.attributes.position as THREE.BufferAttribute;
        const streakPosArray = streakPosAttribute.array as Float32Array;
        const streakBlowAwayLimit = 75;
        const streakMinY = 6.0;
        const streakMaxY = 18.0;
        const streakWindBaseSpeed = 35.0; // Streaks are much faster

        for (let i = 0; i < this.streakParticleCount; i++) {
            const i3 = i * 3;

            // Wind influence on streaks
            const streakWindForceFactor = this.windStrength * streakWindBaseSpeed;
            // Streaks are highly responsive to wind direction
            const streakResponsiveness = 0.9 + Math.random() * 0.2;

            this.streakVelocities[i3] += this.windDirection.x * streakWindForceFactor * streakResponsiveness * deltaSeconds;
            this.streakVelocities[i3 + 2] += this.windDirection.y * streakWindForceFactor * streakResponsiveness * deltaSeconds;

            // Minimal vertical movement for streaks, primarily horizontal
            // No gravity, strong vertical damping keeps them in their layer

            // Update positions
            streakPosArray[i3] += this.streakVelocities[i3] * deltaSeconds;
            streakPosArray[i3 + 1] += this.streakVelocities[i3 + 1] * deltaSeconds;
            streakPosArray[i3 + 2] += this.streakVelocities[i3 + 2] * deltaSeconds;

            // Damping for streaks
            this.streakVelocities[i3] *= 0.97; // Less horizontal damping to maintain speed
            this.streakVelocities[i3 + 1] *= 0.85; // Strong vertical damping
            this.streakVelocities[i3 + 2] *= 0.97; // Less horizontal damping

            // Boundary conditions for streaks - Blow away and reset
            let resetStreak = false;
            if (streakPosArray[i3] > streakBlowAwayLimit) {
                streakPosArray[i3] = -streakBlowAwayLimit - Math.random() * 2;
                streakPosArray[i3 + 2] = (Math.random() - 0.5) * streakBlowAwayLimit * 1.8; // Randomize Z along a wide entry edge
                resetStreak = true;
            } else if (streakPosArray[i3] < -streakBlowAwayLimit) {
                streakPosArray[i3] = streakBlowAwayLimit + Math.random() * 2;
                streakPosArray[i3 + 2] = (Math.random() - 0.5) * streakBlowAwayLimit * 1.8;
                resetStreak = true;
            }

            if (streakPosArray[i3 + 2] > streakBlowAwayLimit) {
                streakPosArray[i3 + 2] = -streakBlowAwayLimit - Math.random() * 2;
                streakPosArray[i3] = (Math.random() - 0.5) * streakBlowAwayLimit * 1.8; // Randomize X along a wide entry edge
                resetStreak = true;
            } else if (streakPosArray[i3 + 2] < -streakBlowAwayLimit) {
                streakPosArray[i3 + 2] = streakBlowAwayLimit + Math.random() * 2;
                streakPosArray[i3] = (Math.random() - 0.5) * streakBlowAwayLimit * 1.8;
                resetStreak = true;
            }

            if (resetStreak) {
                streakPosArray[i3 + 1] = streakMinY + Math.random() * (streakMaxY - streakMinY);
                const initialSpeedMagnitude = (0.7 + Math.random() * 0.6) * streakWindBaseSpeed * 0.05; // Scaled for deltaSeconds later

                this.streakVelocities[i3] = this.windDirection.x * initialSpeedMagnitude;
                this.streakVelocities[i3 + 1] = (Math.random() - 0.5) * 0.1; // Tiny random vertical nudge on reset
                this.streakVelocities[i3 + 2] = this.windDirection.y * initialSpeedMagnitude;
            }

            // Vertical boundary clamping for streaks
            if (streakPosArray[i3 + 1] < streakMinY) {
                streakPosArray[i3 + 1] = streakMinY;
                this.streakVelocities[i3 + 1] *= -0.1; // Gentle bounce or set to 0
            } else if (streakPosArray[i3 + 1] > streakMaxY) {
                streakPosArray[i3 + 1] = streakMaxY;
                this.streakVelocities[i3 + 1] *= -0.1; // Gentle bounce or set to 0
            }
        }
        streakPosAttribute.needsUpdate = true;
    }

    protected updateVisualEffects(deltaTime: number): void {
        const volume = this.getSmoothedAudio('volume', 0.1);
        const bassLevel = this.getSmoothedAudio('bass', 0.2);
        const midLevel = this.getSmoothedAudio('mid', 0.15);

        // Sunset-like color variations
        const hue = 0.08 + midLevel * 0.02;
        const saturation = 0.6 + bassLevel * 0.2;
        const lightness = 0.5 + volume * 0.1;
        this.particleMaterial.color.setHSL(hue, saturation, lightness);

        // Dynamic particle size and opacity for dusty wind effect
        this.particleMaterial.opacity = Math.min(0.85, 0.3 + this.windStrength * 0.6 + bassLevel * 0.1);
        this.particleMaterial.size = Math.max(0.04, 0.12 + volume * 0.05 - this.windStrength * 0.05);

        // Update dust particle visuals
        if (this.dustParticleMaterial) {
            this.dustParticleMaterial.opacity = Math.min(0.7, 0.3 + this.windStrength * 0.4 + midLevel * 0.1);
            this.dustParticleMaterial.size = Math.max(0.05, 0.08 + this.windStrength * 0.04);
        }

        // Update wind streak visuals
        if (this.streakParticleMaterial) {
            this.streakParticleMaterial.opacity = Math.min(0.4, 0.05 + this.windStrength * 0.6 + midLevel * 0.05);
            // Size could also be dynamic, e.g., slightly larger with more wind
            this.streakParticleMaterial.size = Math.max(0.02, 0.03 + this.windStrength * 0.03);
        }
    }

    protected async animateEnter(): Promise<void> {
        return this.createFadeTransition(1000);
    }

    protected async animateExit(): Promise<void> {
        return this.createFadeTransition(1000);
    }
}
