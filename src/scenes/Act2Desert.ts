/**
 * Act 2 - Desert: Shifting sand landscapes and heartbeat-driven terrain
 */

import * as THREE from "three";
import type { AudioAnalyzerInterface, AudioData } from "../types";
import { BaseAct } from "./BaseAct";

export class Act2Desert extends BaseAct {
	private particleCount = 40000; // Increased from 10000 to 40000 (4x more)
	private particleGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
	private particleMaterial: THREE.PointsMaterial = new THREE.PointsMaterial();
	private initialPositions: Float32Array = new Float32Array(
		this.particleCount * 3,
	);
	private velocities: Float32Array = new Float32Array(this.particleCount * 3);
	private turbulence: Float32Array = new Float32Array(this.particleCount * 3);
	private lastHeartbeat = 0;
	private heartbeatInterval = 1000;
	private windDirection: THREE.Vector2 = new THREE.Vector2(1, 0);
	private windStrength = 0;

	// Properties for the new dust particle system
	private dustParticleCount = 15000; // Increased for more volume
	private dustParticleGeometry: THREE.BufferGeometry =
		new THREE.BufferGeometry();
	private dustParticleMaterial: THREE.PointsMaterial =
		new THREE.PointsMaterial();
	private dustPositions: Float32Array = new Float32Array(
		this.dustParticleCount * 3,
	);
	private dustVelocities: Float32Array = new Float32Array(
		this.dustParticleCount * 3,
	);

	// Properties for the new wind streak particle system
	private streakParticleCount = 3000;
	private streakParticleGeometry: THREE.BufferGeometry =
		new THREE.BufferGeometry();
	private streakParticleMaterial: THREE.PointsMaterial =
		new THREE.PointsMaterial();
	private streakPositions!: Float32Array; // Initialized in createContent
	private streakVelocities!: Float32Array; // Initialized in createContent

	protected async createContent(): Promise<void> {
		// Keep the desert plane horizontal, camera will look down at it
		this.group.position.y = -5;

		const positions = new Float32Array(this.particleCount * 3);
		this.initialPositions = new Float32Array(this.particleCount * 3); // Ensure this is sized correctly
		this.velocities = new Float32Array(this.particleCount * 3);
		this.turbulence = new Float32Array(this.particleCount * 3);

		// Create dunes with random dot placement instead of grid
		for (let i = 0; i < this.particleCount; i++) {
			// Random positions across the desert area
			let x = (Math.random() - 0.5) * 80;
			let z = (Math.random() - 0.5) * 80;

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

		this.particleGeometry.setAttribute(
			"position",
			new THREE.BufferAttribute(positions, 3),
		);

		// Adjust particle material for top-down view
		this.particleMaterial.size = 0.15;
		this.particleMaterial.color = new THREE.Color(0xd4a017);
		this.particleMaterial.transparent = true;
		this.particleMaterial.opacity = 0.6;
		this.particleMaterial.blending = THREE.AdditiveBlending;
		this.particleMaterial.depthWrite = false; // Better particle blending

		// Create and add particles
		this.particles.push(
			new THREE.Points(this.particleGeometry, this.particleMaterial),
		);
		this.group.add(this.particles[0]);

		// Store material for disposal
		this.materials.push(this.particleMaterial);

		// Initialize dust particle system
		this.dustPositions = new Float32Array(this.dustParticleCount * 3);
		this.dustVelocities = new Float32Array(this.dustParticleCount * 3);

		for (let i = 0; i < this.dustParticleCount; i++) {
			const i3 = i * 3;
			// Spawn dust particles primarily behind the camera (assuming camera looks down from positive Y)
			// Spread horizontally over the same area as dunes but bias towards back/distant areas
			this.dustPositions[i3] = (Math.random() - 0.5) * 80; // x

			// Calculate terrain height at dust spawn position to spawn above terrain
			const dustX = this.dustPositions[i3];
			const dustZ = (Math.random() - 0.5) * 80; // z position

			const distanceFromCenter = Math.sqrt(dustX * dustX + dustZ * dustZ);
			const angle = Math.atan2(dustZ, dustX);

			const dune1 = Math.sin(distanceFromCenter * 0.1) * 4;
			const dune2 = Math.sin(angle * 3 + distanceFromCenter * 0.05) * 2;
			const dune3 = Math.sin(dustX * 0.1) * Math.cos(dustZ * 0.1) * 3;

			const terrainHeight = dune1 + dune2 + dune3;
			const spawnHeightRange = 15; // Height range above terrain

			// Start at terrain height + random height for more vertical spread
			this.dustPositions[i3 + 1] = terrainHeight + Math.random() * spawnHeightRange + 2; // y (2-17 units above terrain)

			// Bias Z position towards behind camera (negative Z values if camera looks towards positive Z)
			// Mix of behind camera (70%) and some in front (30%) for natural distribution
			if (Math.random() < 0.7) {
				// Behind camera - farther Z values
				this.dustPositions[i3 + 2] = -Math.random() * 60 - 20; // z (-20 to -80)
			} else {
				// Some in front for natural mixing
				this.dustPositions[i3 + 2] = dustZ; // Use the calculated z position
			}

			// Initial velocities mostly horizontal, with some randomness
			this.dustVelocities[i3] = (Math.random() - 0.5) * 2; // x velocity
			this.dustVelocities[i3 + 1] = 0; // No initial vertical velocity for dust
			this.dustVelocities[i3 + 2] = (Math.random() - 0.5) * 2; // z velocity
		}
		this.dustParticleGeometry.setAttribute(
			"position",
			new THREE.BufferAttribute(this.dustPositions, 3),
		);

		this.dustParticleMaterial.size = 0.1; // Increased initial size
		this.dustParticleMaterial.color = new THREE.Color(0xb0a090); // Lighter, desaturated sand color
		this.dustParticleMaterial.transparent = true;
		this.dustParticleMaterial.opacity = 0.5; // Increased initial opacity
		this.dustParticleMaterial.blending = THREE.NormalBlending; // Normal blending for a softer look
		this.dustParticleMaterial.depthWrite = false;

		const dustSystem = new THREE.Points(
			this.dustParticleGeometry,
			this.dustParticleMaterial,
		);
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
			this.streakPositions[i3 + 1] =
				streakYMin + Math.random() * (streakYMax - streakYMin); // y
			this.streakPositions[i3 + 2] = (Math.random() - 0.5) * streakSpread; // z

			this.streakVelocities[i3] = (Math.random() - 0.5) * 3; // Initial horizontal velocity
			this.streakVelocities[i3 + 1] = 0; // No initial vertical velocity
			this.streakVelocities[i3 + 2] = (Math.random() - 0.5) * 3; // Initial horizontal velocity
		}
		this.streakParticleGeometry.setAttribute(
			"position",
			new THREE.BufferAttribute(this.streakPositions, 3),
		);

		this.streakParticleMaterial.size = 0.04;
		this.streakParticleMaterial.color = new THREE.Color(0xffffff);
		this.streakParticleMaterial.transparent = true;
		this.streakParticleMaterial.opacity = 0.25;
		this.streakParticleMaterial.blending = THREE.AdditiveBlending;
		this.streakParticleMaterial.depthWrite = false;

		const streakSystem = new THREE.Points(
			this.streakParticleGeometry,
			this.streakParticleMaterial,
		);
		streakSystem.name = "WindStreaks";
		this.group.add(streakSystem);
		this.materials.push(this.streakParticleMaterial);
	}

	protected updateContent(deltaTime: number): void {
		if (this.particles.length === 0) return;

		const deltaSeconds = deltaTime / 1000;
		const bassLevel = this.getSmoothedAudio("bass", 0.25); // Slightly faster smoothing for bass
		const volume = this.getSmoothedAudio("volume", 0.15); // Slightly faster smoothing for volume
		const midLevel = this.getSmoothedAudio("mid", 0.2);

		// Update wind direction based on audio (for glow effects only)
		this.windDirection.x += (Math.random() - 0.5) * 0.15 * volume;
		this.windDirection.y += (Math.random() - 0.5) * 0.15 * volume;
		this.windDirection.normalize();

		// Update wind strength - more sensitive (for glow effects only)
		this.windStrength = Math.max(
			0,
			Math.min(1, this.windStrength + (volume - 0.4) * 0.2),
		);

		// Detect heartbeat (for glow effects only)
		if (
			bassLevel > 0.65 &&
			this.time - this.lastHeartbeat > this.heartbeatInterval * 0.8
		) {
			this.lastHeartbeat = this.time;
		}

		// Desert particles remain static - no position updates
		// All movement logic has been removed to keep the terrain fixed

		// Audio-reactive camera movement (up and down) - using camera effects system
		if (this.areCameraEffectsEnabled()) {
			// Calculate audio-reactive vertical movement
			const cameraMovementAmplitude = 3; // Maximum vertical movement range
			const bassMovement = bassLevel * cameraMovementAmplitude; // Bass drives main movement
			const volumeMovement = volume * cameraMovementAmplitude * 0.5; // Volume adds secondary movement

			// Combine movements with slight randomness for organic feel
			const totalMovement = bassMovement + volumeMovement + Math.sin(this.time * 0.001) * 0.5;

			// Create vertical offset vector
			const cameraOffset = new THREE.Vector3(0, totalMovement, 0);

			// Apply camera effect (only affects this act when active)
			this.applyCameraEffect(cameraOffset);
		}

		// Update dust particle system with movement, terrain collision, and depth culling
		const dustPosAttribute = this.dustParticleGeometry.attributes
			.position as THREE.BufferAttribute;
		const dustPosArray = dustPosAttribute.array as Float32Array;
		const blowAwayLimit = 60;
		const dustMinY = 5.0;
		const dustMaxY = 22.0;
		const dustWindBaseSpeed = 12.0;

		for (let i = 0; i < this.dustParticleCount; i++) {
			const i3 = i * 3;

			// Wind influence on dust
			const dustWindForceFactor = this.windStrength * dustWindBaseSpeed;
			const particleWindResponsiveness = 0.75 + Math.random() * 0.7;
			const sidewindAmplification = 2.0;

			// Apply wind forces
			this.dustVelocities[i3] +=
				this.windDirection.x *
				dustWindForceFactor *
				particleWindResponsiveness *
				sidewindAmplification *
				deltaSeconds;
			this.dustVelocities[i3 + 2] +=
				this.windDirection.y *
				dustWindForceFactor *
				particleWindResponsiveness *
				deltaSeconds;

			// Update positions
			dustPosArray[i3] += this.dustVelocities[i3] * deltaSeconds;
			dustPosArray[i3 + 1] += this.dustVelocities[i3 + 1] * deltaSeconds;
			dustPosArray[i3 + 2] += this.dustVelocities[i3 + 2] * deltaSeconds;

			// Terrain collision detection - calculate terrain height at dust particle position
			const dustX = dustPosArray[i3];
			const dustZ = dustPosArray[i3 + 2];

			// Calculate terrain height using the same dune pattern as the terrain particles
			const distanceFromCenter = Math.sqrt(dustX * dustX + dustZ * dustZ);
			const angle = Math.atan2(dustZ, dustX);

			const dune1 = Math.sin(distanceFromCenter * 0.1) * 4;
			const dune2 = Math.sin(angle * 3 + distanceFromCenter * 0.05) * 2;
			const dune3 = Math.sin(dustX * 0.1) * Math.cos(dustZ * 0.1) * 3;

			const terrainHeight = dune1 + dune2 + dune3;
			const dustFlowHeight = 0.8; // How high above terrain the dust should flow
			const minDustHeight = terrainHeight + dustFlowHeight;

			// If dust particle is below terrain + flow height, push it up and add upward velocity
			if (dustPosArray[i3 + 1] < minDustHeight) {
				dustPosArray[i3 + 1] = minDustHeight + Math.random() * 0.5; // Add slight randomness

				// Add upward velocity when hitting terrain to simulate bouncing/flowing upward
				this.dustVelocities[i3 + 1] += 2.0 + Math.random() * 1.0;

				// Reduce horizontal velocity slightly due to terrain friction
				this.dustVelocities[i3] *= 0.95;
				this.dustVelocities[i3 + 2] *= 0.95;
			}

			// Add gravity to pull dust down naturally
			this.dustVelocities[i3 + 1] -= 0.8 * deltaSeconds;

			// Damping
			this.dustVelocities[i3] *= 0.99;
			this.dustVelocities[i3 + 1] *= 0.9;
			this.dustVelocities[i3 + 2] *= 0.99;

			// Boundary conditions for dust - Blow away and reset
			let resetParticle = false;

			if (dustPosArray[i3] > blowAwayLimit) {
				dustPosArray[i3] = -blowAwayLimit - Math.random() * 5;
				resetParticle = true;
			} else if (dustPosArray[i3] < -blowAwayLimit) {
				dustPosArray[i3] = blowAwayLimit + Math.random() * 5;
				resetParticle = true;
			}

			if (dustPosArray[i3 + 2] > blowAwayLimit) {
				dustPosArray[i3 + 2] = -blowAwayLimit - Math.random() * 5;
				resetParticle = true;
			} else if (dustPosArray[i3 + 2] < -blowAwayLimit) {
				dustPosArray[i3 + 2] = blowAwayLimit + Math.random() * 5;
				resetParticle = true;
			}

			if (resetParticle) {
				// Randomize the other coordinate to avoid particle lines
				if (Math.abs(this.windDirection.x) > Math.abs(this.windDirection.y)) {
					dustPosArray[i3 + 2] = (Math.random() - 0.5) * blowAwayLimit * 0.8;
				} else {
					dustPosArray[i3] = (Math.random() - 0.5) * blowAwayLimit * 0.8;
				}

				// Calculate terrain height at new position for proper spawning
				const newX = dustPosArray[i3];
				const newZ = dustPosArray[i3 + 2];
				const newDistanceFromCenter = Math.sqrt(newX * newX + newZ * newZ);
				const newAngle = Math.atan2(newZ, newX);

				const newDune1 = Math.sin(newDistanceFromCenter * 0.1) * 4;
				const newDune2 = Math.sin(newAngle * 3 + newDistanceFromCenter * 0.05) * 2;
				const newDune3 = Math.sin(newX * 0.1) * Math.cos(newZ * 0.1) * 3;

				const newTerrainHeight = newDune1 + newDune2 + newDune3;
				const spawnHeight = 3 + Math.random() * 8; // Spawn 3-11 units above terrain

				dustPosArray[i3 + 1] = newTerrainHeight + spawnHeight;

				// Reset velocities
				this.dustVelocities[i3] = -Math.sign(dustPosArray[i3]) * Math.random() * 0.5;
				this.dustVelocities[i3 + 2] = -Math.sign(dustPosArray[i3 + 2]) * Math.random() * 0.5;
				this.dustVelocities[i3 + 1] = (Math.random() - 0.5) * 0.05;
			}

			// Vertical boundary clamping - only enforce upper limit now, lower limit handled by terrain collision
			if (dustPosArray[i3 + 1] > dustMaxY) {
				dustPosArray[i3 + 1] = dustMaxY;
				this.dustVelocities[i3 + 1] = Math.min(0, this.dustVelocities[i3 + 1]); // Only allow downward movement at ceiling
			}
		}
		dustPosAttribute.needsUpdate = true;
	}

	protected updateVisualEffects(deltaTime: number): void {
		const volume = this.getSmoothedAudio("volume", 0.12); // Faster smoothing
		const bassLevel = this.getSmoothedAudio("bass", 0.18); // Faster smoothing
		const midLevel = this.getSmoothedAudio("mid", 0.15); // Faster smoothing

		// Sunset-like color variations - more pronounced
		const hue = 0.08 + midLevel * 0.05; // Increased mid level effect on hue
		const saturation = 0.5 + bassLevel * 0.35; // Increased bass effect on saturation, slightly lower base
		const lightness = 0.45 + volume * 0.2; // Increased volume effect on lightness, slightly lower base
		this.particleMaterial.color.setHSL(hue, saturation, lightness);

		// Dynamic particle size and opacity for dusty wind effect - more pronounced
		this.particleMaterial.opacity = Math.min(
			0.9, // Max opacity
			0.25 + this.windStrength * 0.7 + bassLevel * 0.2, // Increased effect of wind and bass
		);
		this.particleMaterial.size = Math.max(
			0.03, // Min size
			0.1 + volume * 0.1 + this.windStrength * 0.1 - bassLevel * 0.05, // More dynamic sizing
		);

		// Update dust particle visuals with depth-based culling effect
		if (this.dustParticleMaterial) {
			// Get camera position for depth calculations
			const cameraPosition = this.scene?.getObjectByName('camera')?.position || new THREE.Vector3(0, 15, 0);

			// Apply depth-based opacity culling to individual particles
			const dustPositions = this.dustParticleGeometry.attributes.position.array as Float32Array;
			const dustOpacities = new Float32Array(this.dustParticleCount);
			const dustSizes = new Float32Array(this.dustParticleCount);

			for (let i = 0; i < this.dustParticleCount; i++) {
				const i3 = i * 3;
				const particlePos = new THREE.Vector3(
					dustPositions[i3],
					dustPositions[i3 + 1],
					dustPositions[i3 + 2]
				);

				// Calculate distance from camera to particle
				const distanceToCamera = cameraPosition.distanceTo(particlePos);

				// Define more gentle depth culling parameters
				const nearDistance = 5;   // Distance where particles are fully visible (closer)
				const farDistance = 80;   // Distance where particles fade to 30% opacity (much farther)
				const minOpacity = 0.3;   // Don't fade completely, keep 30% opacity at max distance

				// Calculate depth factor (1 = near/visible, 0 = far/faded)
				const depthFactor = Math.max(0, Math.min(1,
					(farDistance - distanceToCamera) / (farDistance - nearDistance)
				));

				// Apply gentle falloff curve for more natural depth of field
				const smoothDepthFactor = depthFactor * depthFactor * (3.0 - 2.0 * depthFactor);

				// Base opacity from audio
				const baseOpacity = 0.35 + this.windStrength * 0.4 + midLevel * 0.15; // Increased base opacity

				// Apply gentler depth culling to opacity (blend between minOpacity and full opacity)
				const opacityRange = 1.0 - minOpacity;
				dustOpacities[i] = Math.min(0.8, baseOpacity * (minOpacity + opacityRange * smoothDepthFactor));

				// Much gentler size reduction with distance
				const baseSize = 0.08 + this.windStrength * 0.05 + midLevel * 0.02; // Slightly larger base size
				dustSizes[i] = Math.max(0.04, baseSize * (0.7 + 0.3 * smoothDepthFactor)); // Less dramatic size change
			}

			// Apply the calculated values
			// Note: For individual particle opacity/size, we'd need a custom shader
			// For now, we'll use the average values with enhanced depth-based effects
			const avgOpacity = dustOpacities.reduce((sum, val) => sum + val, 0) / this.dustParticleCount;
			const avgSize = dustSizes.reduce((sum, val) => sum + val, 0) / this.dustParticleCount;

			this.dustParticleMaterial.opacity = avgOpacity;
			this.dustParticleMaterial.size = avgSize;

			// Add subtle color shift for distant particles (atmospheric perspective)
			const dustHue = 0.1 + midLevel * 0.03;
			const dustSaturation = Math.max(0.3, 0.5 + bassLevel * 0.2 - (1 - avgOpacity) * 0.2); // Less dramatic desaturation
			const dustLightness = 0.6 + volume * 0.15;
			this.dustParticleMaterial.color.setHSL(dustHue, dustSaturation, dustLightness);
		}

		// Update wind streak visuals - more pronounced
		if (this.streakParticleMaterial) {
			this.streakParticleMaterial.opacity = Math.min(
				0.5, // Max opacity
				0.03 + this.windStrength * 0.75 + midLevel * 0.1, // Increased effect
			);
			// Size could also be dynamic, e.g., slightly larger with more wind
			this.streakParticleMaterial.size = Math.max(
				0.015, // Min size
				0.025 + this.windStrength * 0.05 + volume * 0.02, // More dynamic
			);
		}
	}

	protected async animateEnter(): Promise<void> {
		return this.createFadeTransition(1000);
	}

	protected async animateExit(): Promise<void> {
		return this.createFadeTransition(1000);
	}
}
