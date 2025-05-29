/**
 * Act 2 - Desert: Shifting sand landscapes and heartbeat-driven terrain
 */

import * as THREE from "three";
import {
	createRadialGradientTexture,
	createStreakTexture,
} from "../utils/TextureUtils";
import { BaseAct } from "./BaseAct";

export class Act2Desert extends BaseAct {
	// General Scene Parameters
	private readonly GROUP_Y_OFFSET = -5;
	private readonly FADE_TRANSITION_DURATION_MS = 1000;

	// Terrain Particle System
	private readonly TERRAIN_PARTICLE_COUNT = 40000;
	private readonly TERRAIN_TEXTURE_CANVAS_SIZE = 32;
	private readonly TERRAIN_TEXTURE_GRADIENT_CENTER = 16;
	private readonly DESERT_AREA_SPAN = 80; // Used for terrain and dust spawn area
	private readonly DUNE_FREQ_1 = 0.1;
	private readonly DUNE_AMP_1 = 4;
	private readonly DUNE_ANGLE_MULT_2 = 3;
	private readonly DUNE_FREQ_2 = 0.05;
	private readonly DUNE_AMP_2 = 2;
	private readonly DUNE_X_FREQ_3 = 0.1;
	private readonly DUNE_Z_FREQ_3 = 0.1;
	private readonly DUNE_AMP_3 = 3;
	private readonly TERRAIN_POS_RANDOM_FACTOR = 0.5;
	private readonly TERRAIN_VELOCITY_XZ_FACTOR = 0.01;
	private readonly TERRAIN_VELOCITY_Y_FACTOR = 0.005;
	private readonly TERRAIN_TURBULENCE_Y_FACTOR = 0.5;
	private readonly TERRAIN_PARTICLE_BASE_SIZE = 0.2;
	private readonly TERRAIN_PARTICLE_COLOR = 0xd4a017;
	private readonly TERRAIN_PARTICLE_BASE_OPACITY = 0.6;

	// Dust Particle System
	private readonly DUST_PARTICLE_COUNT = 15000;
	private readonly DUST_TEXTURE_CANVAS_SIZE = 64;
	private readonly DUST_TEXTURE_GRADIENT_CENTER = 32;
	private readonly DUST_SPAWN_HEIGHT_RANGE = 15;
	private readonly DUST_SPAWN_Y_OFFSET = 2;
	private readonly DUST_BEHIND_CAMERA_RATIO = 0.7;
	private readonly DUST_BEHIND_CAMERA_Z_MAX_OFFSET = 60; // e.g. -20 to -80 means (60 range, starting at 20)
	private readonly DUST_BEHIND_CAMERA_Z_MIN_OFFSET = 20;
	private readonly DUST_INITIAL_VELOCITY_XZ_FACTOR = 2;
	private readonly DUST_PARTICLE_BASE_SIZE = 1.0; // Previously 0.2, Original 0.15
	private readonly DUST_PARTICLE_COLOR = 0xb0a090;
	private readonly DUST_PARTICLE_BASE_OPACITY = 0.95; // Previously 0.75, Original 0.6
	private readonly DUST_BLOW_AWAY_LIMIT = 60;
	private readonly DUST_MAX_Y_CLAMP = 22.0;
	private readonly DUST_WIND_BASE_SPEED = 12.0;
	private readonly DUST_WIND_RESPONSIVENESS_MIN = 0.75;
	private readonly DUST_WIND_RESPONSIVENESS_RANGE = 0.7; // Max responsiveness = MIN + RANGE
	private readonly DUST_SIDEWIND_AMPLIFICATION = 2.0;
	private readonly DUST_FLOW_HEIGHT_ABOVE_TERRAIN = 0.8;
	private readonly DUST_TERRAIN_COLLISION_Y_RANDOM_ADD = 0.5;
	private readonly DUST_TERRAIN_COLLISION_UPWARD_VEL_MIN = 2.0;
	private readonly DUST_TERRAIN_COLLISION_UPWARD_VEL_RAND_ADD = 1.0;
	private readonly DUST_TERRAIN_FRICTION_FACTOR = 0.95;
	private readonly DUST_GRAVITY_ACCELERATION = 0.8;
	private readonly DUST_DAMPING_XZ = 0.99;
	private readonly DUST_DAMPING_Y = 0.9;
	private readonly DUST_RESET_BOUNDARY_RANDOM_OFFSET = 5;
	private readonly DUST_RESET_OTHER_COORD_SCALE_FACTOR = 0.8;
	private readonly DUST_RESET_SPAWN_HEIGHT_MIN_ABOVE_TERRAIN = 3;
	private readonly DUST_RESET_SPAWN_HEIGHT_RAND_ADD = 8;
	private readonly DUST_RESET_VELOCITY_XZ_FACTOR = 0.5;
	private readonly DUST_RESET_VELOCITY_Y_FACTOR = 0.05;

	// Wind Streak Particle System
	private readonly STREAK_PARTICLE_COUNT = 3000;
	private readonly STREAK_TEXTURE_CANVAS_SIZE = 32;
	private readonly STREAK_TEXTURE_CENTER_TRANSLATE = 16;
	private readonly STREAK_TEXTURE_ROTATION_RADIANS = -Math.PI / 4;
	private readonly STREAK_TEXTURE_GRADIENT_X_START = -16;
	private readonly STREAK_TEXTURE_GRADIENT_X_END = 16;
	private readonly STREAK_TEXTURE_RECT_X = -16;
	private readonly STREAK_TEXTURE_RECT_Y = -4;
	private readonly STREAK_TEXTURE_RECT_WIDTH = 32;
	private readonly STREAK_TEXTURE_RECT_HEIGHT = 8;
	private readonly STREAK_SPREAD_AREA = 90;
	private readonly STREAK_Y_MIN_SPAWN = 6.0;
	private readonly STREAK_Y_MAX_SPAWN = 18.0;
	private readonly STREAK_INITIAL_VELOCITY_XZ_FACTOR = 3;
	private readonly STREAK_PARTICLE_BASE_SIZE = 0.08;
	private readonly STREAK_PARTICLE_COLOR = 0xffffff;
	private readonly STREAK_PARTICLE_BASE_OPACITY = 0.25;

	// Audio Reactivity Parameters
	private readonly HEARTBEAT_INTERVAL_MS = 1000;
	private readonly AUDIO_SMOOTH_BASS_UPDATE = 0.25;
	private readonly AUDIO_SMOOTH_VOLUME_UPDATE = 0.15;
	private readonly AUDIO_SMOOTH_MID_UPDATE = 0.2;
	private readonly WIND_DIR_CHANGE_FACTOR = 0.15;
	private readonly WIND_STRENGTH_UPDATE_FACTOR = 0.2;
	private readonly WIND_STRENGTH_SENSITIVITY_THRESHOLD = 0.4;
	private readonly HEARTBEAT_BASS_THRESHOLD = 0.65;
	private readonly HEARTBEAT_INTERVAL_MULTIPLIER = 0.8; // For checking against lastHeartbeat

	// Camera Effects
	private readonly CAMERA_MOVEMENT_AMPLITUDE = 3;
	private readonly CAMERA_VOLUME_MOVEMENT_SCALE = 0.5;
	private readonly CAMERA_TIME_MOVEMENT_FREQ = 0.001;
	private readonly CAMERA_TIME_MOVEMENT_AMP = 0.5;
	private readonly DEFAULT_CAMERA_Y_FOR_DEPTH_EFFECT = 15;

	// Visual Effects Parameters
	private readonly AUDIO_SMOOTH_BASS_EFFECTS = 0.18;
	private readonly AUDIO_SMOOTH_VOLUME_EFFECTS = 0.12;
	private readonly AUDIO_SMOOTH_MID_EFFECTS = 0.15;

	private readonly TERRAIN_VISUAL_HUE_BASE = 0.08;
	private readonly TERRAIN_VISUAL_HUE_MID_FACTOR = 0.05;
	private readonly TERRAIN_VISUAL_SAT_BASE = 0.6;
	private readonly TERRAIN_VISUAL_SAT_BASS_FACTOR = 0.35;
	private readonly TERRAIN_VISUAL_LGT_BASE = 0.55;
	private readonly TERRAIN_VISUAL_LGT_VOLUME_FACTOR = 0.25;
	private readonly TERRAIN_VISUAL_OPACITY_MAX = 0.95; // Increased from 0.9
	private readonly TERRAIN_VISUAL_OPACITY_BASE = 0.5; // Increased from 0.25
	private readonly TERRAIN_VISUAL_OPACITY_WIND_FACTOR = 0.5; // Reduced from 0.7
	private readonly TERRAIN_VISUAL_OPACITY_BASS_FACTOR = 0.1; // Reduced from 0.2
	private readonly TERRAIN_VISUAL_SIZE_MIN = 0.03;
	private readonly TERRAIN_VISUAL_SIZE_BASE = 0.1;
	private readonly TERRAIN_VISUAL_SIZE_VOLUME_FACTOR = 0.1;
	private readonly TERRAIN_VISUAL_SIZE_WIND_FACTOR = 0.1;
	private readonly TERRAIN_VISUAL_SIZE_BASS_FACTOR = -0.05; // Note: negative factor

	private readonly DUST_DEPTH_CULL_NEAR_DISTANCE = 5;
	private readonly DUST_DEPTH_CULL_FAR_DISTANCE = 80;
	private readonly DUST_DEPTH_CULL_MIN_OPACITY = 0.3;
	private readonly SMOOTH_DEPTH_FACTOR_COEFF1 = 3.0; // For (3 - 2x) part of smoothstep like curve
	private readonly SMOOTH_DEPTH_FACTOR_COEFF2 = 2.0;
	private readonly DUST_VISUAL_BASE_OPACITY_EFFECT = 0.9; // Previously 0.5, Original 0.35
	private readonly DUST_VISUAL_OPACITY_WIND_FACTOR = 0.4;
	private readonly DUST_VISUAL_OPACITY_MID_FACTOR = 0.15;
	private readonly DUST_VISUAL_OPACITY_MAX = 1.0; // Previously 0.9, Original 0.8
	private readonly DUST_VISUAL_BASE_SIZE_EFFECT = 0.6; // Previously 0.12, Original 0.08
	private readonly DUST_VISUAL_SIZE_WIND_FACTOR = 0.05;
	private readonly DUST_VISUAL_SIZE_MID_FACTOR = 0.02;
	private readonly DUST_VISUAL_SIZE_MIN = 0.3; // Previously 0.06, Original 0.04
	private readonly DUST_VISUAL_SIZE_DEPTH_FACTOR_MIN_SCALE = 0.7; // Scale factor for min size at far distance
	private readonly DUST_VISUAL_SIZE_DEPTH_FACTOR_RANGE_SCALE = 0.3; // Scale factor for size range based on depth
	private readonly DUST_VISUAL_HUE_BASE = 0.1;
	private readonly DUST_VISUAL_HUE_MID_FACTOR = 0.03;
	private readonly DUST_VISUAL_SAT_MIN = 0.3;
	private readonly DUST_VISUAL_SAT_BASE = 0.5;
	private readonly DUST_VISUAL_SAT_BASS_FACTOR = 0.2;
	private readonly DUST_VISUAL_SAT_OPACITY_FACTOR = -0.2; // Note: negative factor

	private readonly DUST_VISUAL_LGT_BASE = 0.6;
	private readonly DUST_VISUAL_LGT_VOLUME_FACTOR = 0.15;

	private readonly STREAK_VISUAL_OPACITY_MAX = 0.5;
	private readonly STREAK_VISUAL_OPACITY_BASE = 0.03;
	private readonly STREAK_VISUAL_OPACITY_WIND_FACTOR = 0.75;
	private readonly STREAK_VISUAL_OPACITY_MID_FACTOR = 0.1;
	private readonly STREAK_VISUAL_SIZE_MIN = 0.015;
	private readonly STREAK_VISUAL_SIZE_BASE = 0.025;
	private readonly STREAK_VISUAL_SIZE_WIND_FACTOR = 0.05;
	private readonly STREAK_VISUAL_SIZE_VOLUME_FACTOR = 0.02;

	private particleGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
	private particleMaterial: THREE.PointsMaterial = new THREE.PointsMaterial();
	private initialPositions: Float32Array = new Float32Array(
		this.TERRAIN_PARTICLE_COUNT * 3,
	);
	private velocities: Float32Array = new Float32Array(
		this.TERRAIN_PARTICLE_COUNT * 3,
	);
	private turbulence: Float32Array = new Float32Array(
		this.TERRAIN_PARTICLE_COUNT * 3,
	);
	private lastHeartbeat = 0;
	// private heartbeatInterval = 1000; // Now: this.HEARTBEAT_INTERVAL_MS
	private windDirection: THREE.Vector2 = new THREE.Vector2(1, 0);
	private windStrength = 0;

	// Properties for the new dust particle system
	// private dustParticleCount = 15000; // Now: this.DUST_PARTICLE_COUNT
	private dustParticleGeometry: THREE.BufferGeometry =
		new THREE.BufferGeometry();
	private dustParticleMaterial: THREE.PointsMaterial =
		new THREE.PointsMaterial();
	private dustPositions: Float32Array = new Float32Array(
		this.DUST_PARTICLE_COUNT * 3,
	);
	private dustVelocities: Float32Array = new Float32Array(
		this.DUST_PARTICLE_COUNT * 3,
	);

	// Properties for the new wind streak particle system
	// private streakParticleCount = 3000; // Now: this.STREAK_PARTICLE_COUNT
	private streakParticleGeometry: THREE.BufferGeometry =
		new THREE.BufferGeometry();
	private streakParticleMaterial: THREE.PointsMaterial =
		new THREE.PointsMaterial();
	private streakPositions!: Float32Array; // Initialized in createContent
	private streakVelocities!: Float32Array; // Initialized in createContent

	protected async createContent(): Promise<void> {
		// Keep the desert plane horizontal, camera will look down at it
		this.group.position.y = this.GROUP_Y_OFFSET;

		const positions = new Float32Array(this.TERRAIN_PARTICLE_COUNT * 3);
		this.initialPositions = new Float32Array(this.TERRAIN_PARTICLE_COUNT * 3); // Ensure this is sized correctly
		this.velocities = new Float32Array(this.TERRAIN_PARTICLE_COUNT * 3);
		this.turbulence = new Float32Array(this.TERRAIN_PARTICLE_COUNT * 3);

		// Create circular texture for desert terrain particles
		const terrainTexture = createRadialGradientTexture(
			this.TERRAIN_TEXTURE_CANVAS_SIZE,
			this.TERRAIN_TEXTURE_GRADIENT_CENTER,
			[
				[0, "rgba(255, 255, 255, 1)"],
				[0.5, "rgba(255, 255, 255, 0.8)"],
				[1, "rgba(255, 255, 255, 0)"],
			],
		);

		// Create circular texture for dust particles (softer gradient)
		const dustTexture = createRadialGradientTexture(
			this.DUST_TEXTURE_CANVAS_SIZE,
			this.DUST_TEXTURE_GRADIENT_CENTER,
			[
				[0, "rgba(255, 255, 255, 0.6)"],
				[0.3, "rgba(255, 255, 255, 0.3)"],
				[1, "rgba(255, 255, 255, 0)"],
			],
		);

		// Create dunes with random dot placement instead of grid
		for (let i = 0; i < this.TERRAIN_PARTICLE_COUNT; i++) {
			// Random positions across the desert area
			let x = (Math.random() - 0.5) * this.DESERT_AREA_SPAN;
			let z = (Math.random() - 0.5) * this.DESERT_AREA_SPAN;

			// Add dune height variations using multiple sine waves
			const distanceFromCenter = Math.sqrt(x * x + z * z);
			const angle = Math.atan2(z, x);

			// More pronounced dune patterns
			const dune1 =
				Math.sin(distanceFromCenter * this.DUNE_FREQ_1) * this.DUNE_AMP_1;
			const dune2 =
				Math.sin(
					angle * this.DUNE_ANGLE_MULT_2 +
						distanceFromCenter * this.DUNE_FREQ_2,
				) * this.DUNE_AMP_2;
			const dune3 =
				Math.sin(x * this.DUNE_X_FREQ_3) *
				Math.cos(z * this.DUNE_Z_FREQ_3) *
				this.DUNE_AMP_3;

			// Y is now the height of the dunes
			const y = dune1 + dune2 + dune3;

			// Add subtle random variation
			x += (Math.random() - 0.5) * this.TERRAIN_POS_RANDOM_FACTOR;
			z += (Math.random() - 0.5) * this.TERRAIN_POS_RANDOM_FACTOR;

			// Store positions
			positions[i * 3] = this.initialPositions[i * 3] = x;
			positions[i * 3 + 1] = this.initialPositions[i * 3 + 1] = y;
			positions[i * 3 + 2] = this.initialPositions[i * 3 + 2] = z;

			// Initialize velocities
			this.velocities[i * 3] =
				(Math.random() - 0.5) * this.TERRAIN_VELOCITY_XZ_FACTOR;
			this.velocities[i * 3 + 1] =
				(Math.random() - 0.5) * this.TERRAIN_VELOCITY_Y_FACTOR;
			this.velocities[i * 3 + 2] =
				(Math.random() - 0.5) * this.TERRAIN_VELOCITY_XZ_FACTOR;

			// Initialize turbulence
			this.turbulence[i * 3] = Math.random();
			this.turbulence[i * 3 + 1] =
				Math.random() * this.TERRAIN_TURBULENCE_Y_FACTOR;
			this.turbulence[i * 3 + 2] = Math.random();
		}

		this.particleGeometry.setAttribute(
			"position",
			new THREE.BufferAttribute(positions, 3),
		);

		// Adjust particle material for top-down view with circular texture
		this.particleMaterial.size = this.TERRAIN_PARTICLE_BASE_SIZE;
		this.particleMaterial.color = new THREE.Color(this.TERRAIN_PARTICLE_COLOR);
		this.particleMaterial.transparent = true;
		this.particleMaterial.opacity = this.TERRAIN_PARTICLE_BASE_OPACITY;
		this.particleMaterial.blending = THREE.AdditiveBlending;
		this.particleMaterial.depthWrite = false;
		this.particleMaterial.map = terrainTexture;

		// Create and add particles
		this.particles.push(
			new THREE.Points(this.particleGeometry, this.particleMaterial),
		);
		this.group.add(this.particles[0]);

		// Store material for disposal
		this.materials.push(this.particleMaterial);

		// Initialize dust particle system
		this.dustPositions = new Float32Array(this.DUST_PARTICLE_COUNT * 3);
		this.dustVelocities = new Float32Array(this.DUST_PARTICLE_COUNT * 3);

		for (let i = 0; i < this.DUST_PARTICLE_COUNT; i++) {
			const i3 = i * 3;
			// Spawn dust particles primarily behind the camera (assuming camera looks down from positive Y)
			// Spread horizontally over the same area as dunes but bias towards back/distant areas
			this.dustPositions[i3] = (Math.random() - 0.5) * this.DESERT_AREA_SPAN; // x

			// Calculate terrain height at dust spawn position to spawn above terrain
			const dustX = this.dustPositions[i3];
			const dustZ = (Math.random() - 0.5) * this.DESERT_AREA_SPAN; // z position

			const distanceFromCenter = Math.sqrt(dustX * dustX + dustZ * dustZ);
			const angle = Math.atan2(dustZ, dustX);

			const dune1 =
				Math.sin(distanceFromCenter * this.DUNE_FREQ_1) * this.DUNE_AMP_1;
			const dune2 =
				Math.sin(
					angle * this.DUNE_ANGLE_MULT_2 +
						distanceFromCenter * this.DUNE_FREQ_2,
				) * this.DUNE_AMP_2;
			const dune3 =
				Math.sin(dustX * this.DUNE_X_FREQ_3) *
				Math.cos(dustZ * this.DUNE_Z_FREQ_3) *
				this.DUNE_AMP_3;

			const terrainHeight = dune1 + dune2 + dune3;
			// const spawnHeightRange = 15; // Now: this.DUST_SPAWN_HEIGHT_RANGE

			// Start at terrain height + random height for more vertical spread
			this.dustPositions[i3 + 1] =
				terrainHeight +
				Math.random() * this.DUST_SPAWN_HEIGHT_RANGE +
				this.DUST_SPAWN_Y_OFFSET;

			// Bias Z position towards behind camera (negative Z values if camera looks towards positive Z)
			// Mix of behind camera (70%) and some in front (30%) for natural distribution
			if (Math.random() < this.DUST_BEHIND_CAMERA_RATIO) {
				// Behind camera - farther Z values
				this.dustPositions[i3 + 2] = -(
					Math.random() * this.DUST_BEHIND_CAMERA_Z_MAX_OFFSET +
					this.DUST_BEHIND_CAMERA_Z_MIN_OFFSET
				);
			} else {
				// Some in front for natural mixing
				this.dustPositions[i3 + 2] = dustZ; // Use the calculated z position
			}

			// Initial velocities mostly horizontal, with some randomness
			this.dustVelocities[i3] =
				(Math.random() - 0.5) * this.DUST_INITIAL_VELOCITY_XZ_FACTOR; // x velocity
			this.dustVelocities[i3 + 1] = 0; // No initial vertical velocity for dust
			this.dustVelocities[i3 + 2] =
				(Math.random() - 0.5) * this.DUST_INITIAL_VELOCITY_XZ_FACTOR; // z velocity
		}
		this.dustParticleGeometry.setAttribute(
			"position",
			new THREE.BufferAttribute(this.dustPositions, 3),
		);

		this.dustParticleMaterial.size = this.DUST_PARTICLE_BASE_SIZE;
		this.dustParticleMaterial.color = new THREE.Color(this.DUST_PARTICLE_COLOR);
		this.dustParticleMaterial.transparent = true;
		this.dustParticleMaterial.opacity = this.DUST_PARTICLE_BASE_OPACITY;
		this.dustParticleMaterial.blending = THREE.AdditiveBlending;
		this.dustParticleMaterial.depthWrite = false;
		this.dustParticleMaterial.map = dustTexture;

		const dustSystem = new THREE.Points(
			this.dustParticleGeometry,
			this.dustParticleMaterial,
		);
		dustSystem.name = "DustParticles";
		this.group.add(dustSystem);
		this.materials.push(this.dustParticleMaterial);

		// Create texture for wind streaks
		const streakTexture = createStreakTexture({
			canvasSize: this.STREAK_TEXTURE_CANVAS_SIZE,
			gradientStops: [
				[0, "rgba(255, 255, 255, 0)"],
				[0.4, "rgba(255, 255, 255, 0.4)"],
				[0.5, "rgba(255, 255, 255, 0.8)"],
				[0.6, "rgba(255, 255, 255, 0.4)"],
				[1, "rgba(255, 255, 255, 0)"],
			],
			rect: {
				x: this.STREAK_TEXTURE_RECT_X,
				y: this.STREAK_TEXTURE_RECT_Y,
				width: this.STREAK_TEXTURE_RECT_WIDTH,
				height: this.STREAK_TEXTURE_RECT_HEIGHT,
			},
			rotation: this.STREAK_TEXTURE_ROTATION_RADIANS,
			translate: {
				x: this.STREAK_TEXTURE_CENTER_TRANSLATE,
				y: this.STREAK_TEXTURE_CENTER_TRANSLATE,
			},
		});

		// Initialize wind streak particle system
		this.streakPositions = new Float32Array(this.STREAK_PARTICLE_COUNT * 3);
		this.streakVelocities = new Float32Array(this.STREAK_PARTICLE_COUNT * 3);

		// const streakSpread = 90; // Now: this.STREAK_SPREAD_AREA
		// const streakYMin = 6.0; // Now: this.STREAK_Y_MIN_SPAWN
		// const streakYMax = 18.0; // Now: this.STREAK_Y_MAX_SPAWN

		for (let i = 0; i < this.STREAK_PARTICLE_COUNT; i++) {
			const i3 = i * 3;
			this.streakPositions[i3] =
				(Math.random() - 0.5) * this.STREAK_SPREAD_AREA; // x
			this.streakPositions[i3 + 1] =
				this.STREAK_Y_MIN_SPAWN +
				Math.random() * (this.STREAK_Y_MAX_SPAWN - this.STREAK_Y_MIN_SPAWN); // y
			this.streakPositions[i3 + 2] =
				(Math.random() - 0.5) * this.STREAK_SPREAD_AREA; // z

			this.streakVelocities[i3] =
				(Math.random() - 0.5) * this.STREAK_INITIAL_VELOCITY_XZ_FACTOR; // Initial horizontal velocity
			this.streakVelocities[i3 + 1] = 0; // No initial vertical velocity
			this.streakVelocities[i3 + 2] =
				(Math.random() - 0.5) * this.STREAK_INITIAL_VELOCITY_XZ_FACTOR; // Initial horizontal velocity
		}
		this.streakParticleGeometry.setAttribute(
			"position",
			new THREE.BufferAttribute(this.streakPositions, 3),
		);

		this.streakParticleMaterial.size = this.STREAK_PARTICLE_BASE_SIZE;
		this.streakParticleMaterial.color = new THREE.Color(
			this.STREAK_PARTICLE_COLOR,
		);
		this.streakParticleMaterial.transparent = true;
		this.streakParticleMaterial.opacity = this.STREAK_PARTICLE_BASE_OPACITY;
		this.streakParticleMaterial.blending = THREE.AdditiveBlending;
		this.streakParticleMaterial.depthWrite = false;
		this.streakParticleMaterial.map = streakTexture;

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

		const deltaSeconds = deltaTime / 1000; // Standard conversion, not a magic number for config
		const bassLevel = this.getSmoothedAudio(
			"bass",
			this.AUDIO_SMOOTH_BASS_UPDATE,
		);
		const volume = this.getSmoothedAudio(
			"volume",
			this.AUDIO_SMOOTH_VOLUME_UPDATE,
		);
		const midLevel = this.getSmoothedAudio("mid", this.AUDIO_SMOOTH_MID_UPDATE);

		// Update wind direction based on audio (for glow effects only)
		this.windDirection.x +=
			(Math.random() - 0.5) * this.WIND_DIR_CHANGE_FACTOR * volume;
		this.windDirection.y +=
			(Math.random() - 0.5) * this.WIND_DIR_CHANGE_FACTOR * volume;
		this.windDirection.normalize();

		// Update wind strength - more sensitive (for glow effects only)
		this.windStrength = Math.max(
			0,
			Math.min(
				1,
				this.windStrength +
					(volume - this.WIND_STRENGTH_SENSITIVITY_THRESHOLD) *
						this.WIND_STRENGTH_UPDATE_FACTOR,
			),
		);

		// Detect heartbeat (for glow effects only)
		if (
			bassLevel > this.HEARTBEAT_BASS_THRESHOLD &&
			this.time - this.lastHeartbeat >
				this.HEARTBEAT_INTERVAL_MS * this.HEARTBEAT_INTERVAL_MULTIPLIER
		) {
			this.lastHeartbeat = this.time;
		}

		// Desert particles remain static - no position updates
		// All movement logic has been removed to keep the terrain fixed

		// Audio-reactive camera movement (up and down) - using camera effects system
		if (this.areCameraEffectsEnabled()) {
			// Calculate audio-reactive vertical movement
			// const cameraMovementAmplitude = 3; // Now: this.CAMERA_MOVEMENT_AMPLITUDE
			const bassMovement = bassLevel * this.CAMERA_MOVEMENT_AMPLITUDE;
			const volumeMovement =
				volume *
				this.CAMERA_MOVEMENT_AMPLITUDE *
				this.CAMERA_VOLUME_MOVEMENT_SCALE;

			// Combine movements with slight randomness for organic feel
			const totalMovement =
				bassMovement +
				volumeMovement +
				Math.sin(this.time * this.CAMERA_TIME_MOVEMENT_FREQ) *
					this.CAMERA_TIME_MOVEMENT_AMP;

			// Create vertical offset vector
			const cameraOffset = new THREE.Vector3(0, totalMovement, 0);

			// Apply camera effect (only affects this act when active)
			this.applyCameraEffect(cameraOffset);
		}

		// Update dust particle system with movement, terrain collision, and depth culling
		const dustPosAttribute = this.dustParticleGeometry.attributes
			.position as THREE.BufferAttribute;
		const dustPosArray = dustPosAttribute.array as Float32Array;
		// const blowAwayLimit = 60; // Now: this.DUST_BLOW_AWAY_LIMIT
		// const dustMinY = 5.0; // Not used here, DUST_MAX_Y_CLAMP is used
		// const dustMaxY = 22.0; // Now: this.DUST_MAX_Y_CLAMP
		// const dustWindBaseSpeed = 12.0; // Now: this.DUST_WIND_BASE_SPEED

		for (let i = 0; i < this.DUST_PARTICLE_COUNT; i++) {
			const i3 = i * 3;

			// Wind influence on dust
			const dustWindForceFactor = this.windStrength * this.DUST_WIND_BASE_SPEED;
			const particleWindResponsiveness =
				this.DUST_WIND_RESPONSIVENESS_MIN +
				Math.random() * this.DUST_WIND_RESPONSIVENESS_RANGE;
			// const sidewindAmplification = 2.0; // Now: this.DUST_SIDEWIND_AMPLIFICATION

			// Apply wind forces
			this.dustVelocities[i3] +=
				this.windDirection.x *
				dustWindForceFactor *
				particleWindResponsiveness *
				this.DUST_SIDEWIND_AMPLIFICATION *
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

			const dune1 =
				Math.sin(distanceFromCenter * this.DUNE_FREQ_1) * this.DUNE_AMP_1;
			const dune2 =
				Math.sin(
					angle * this.DUNE_ANGLE_MULT_2 +
						distanceFromCenter * this.DUNE_FREQ_2,
				) * this.DUNE_AMP_2;
			const dune3 =
				Math.sin(dustX * this.DUNE_X_FREQ_3) *
				Math.cos(dustZ * this.DUNE_Z_FREQ_3) *
				this.DUNE_AMP_3;

			const terrainHeight = dune1 + dune2 + dune3;
			// const dustFlowHeight = 0.8; // Now: this.DUST_FLOW_HEIGHT_ABOVE_TERRAIN
			const minDustHeight = terrainHeight + this.DUST_FLOW_HEIGHT_ABOVE_TERRAIN;

			// If dust particle is below terrain + flow height, push it up and add upward velocity
			if (dustPosArray[i3 + 1] < minDustHeight) {
				dustPosArray[i3 + 1] =
					minDustHeight +
					Math.random() * this.DUST_TERRAIN_COLLISION_Y_RANDOM_ADD;

				// Add upward velocity when hitting terrain to simulate bouncing/flowing upward
				this.dustVelocities[i3 + 1] +=
					this.DUST_TERRAIN_COLLISION_UPWARD_VEL_MIN +
					Math.random() * this.DUST_TERRAIN_COLLISION_UPWARD_VEL_RAND_ADD;

				// Reduce horizontal velocity slightly due to terrain friction
				this.dustVelocities[i3] *= this.DUST_TERRAIN_FRICTION_FACTOR;
				this.dustVelocities[i3 + 2] *= this.DUST_TERRAIN_FRICTION_FACTOR;
			}

			// Add gravity to pull dust down naturally
			this.dustVelocities[i3 + 1] -=
				this.DUST_GRAVITY_ACCELERATION * deltaSeconds;

			// Damping
			this.dustVelocities[i3] *= this.DUST_DAMPING_XZ;
			this.dustVelocities[i3 + 1] *= this.DUST_DAMPING_Y;
			this.dustVelocities[i3 + 2] *= this.DUST_DAMPING_XZ;

			// Boundary conditions for dust - Blow away and reset
			let resetParticle = false;

			if (dustPosArray[i3] > this.DUST_BLOW_AWAY_LIMIT) {
				dustPosArray[i3] =
					-this.DUST_BLOW_AWAY_LIMIT -
					Math.random() * this.DUST_RESET_BOUNDARY_RANDOM_OFFSET;
				resetParticle = true;
			} else if (dustPosArray[i3] < -this.DUST_BLOW_AWAY_LIMIT) {
				dustPosArray[i3] =
					this.DUST_BLOW_AWAY_LIMIT +
					Math.random() * this.DUST_RESET_BOUNDARY_RANDOM_OFFSET;
				resetParticle = true;
			}

			if (dustPosArray[i3 + 2] > this.DUST_BLOW_AWAY_LIMIT) {
				dustPosArray[i3 + 2] =
					-this.DUST_BLOW_AWAY_LIMIT -
					Math.random() * this.DUST_RESET_BOUNDARY_RANDOM_OFFSET;
				resetParticle = true;
			} else if (dustPosArray[i3 + 2] < -this.DUST_BLOW_AWAY_LIMIT) {
				dustPosArray[i3 + 2] =
					this.DUST_BLOW_AWAY_LIMIT +
					Math.random() * this.DUST_RESET_BOUNDARY_RANDOM_OFFSET;
				resetParticle = true;
			}

			if (resetParticle) {
				// Randomize the other coordinate to avoid particle lines
				if (Math.abs(this.windDirection.x) > Math.abs(this.windDirection.y)) {
					dustPosArray[i3 + 2] =
						(Math.random() - 0.5) *
						this.DUST_BLOW_AWAY_LIMIT *
						this.DUST_RESET_OTHER_COORD_SCALE_FACTOR;
				} else {
					dustPosArray[i3] =
						(Math.random() - 0.5) *
						this.DUST_BLOW_AWAY_LIMIT *
						this.DUST_RESET_OTHER_COORD_SCALE_FACTOR;
				}

				// Calculate terrain height at new position for proper spawning
				const newX = dustPosArray[i3];
				const newZ = dustPosArray[i3 + 2];
				const newDistanceFromCenter = Math.sqrt(newX * newX + newZ * newZ);
				const newAngle = Math.atan2(newZ, newX);

				const newDune1 =
					Math.sin(newDistanceFromCenter * this.DUNE_FREQ_1) * this.DUNE_AMP_1;
				const newDune2 =
					Math.sin(
						newAngle * this.DUNE_ANGLE_MULT_2 +
							newDistanceFromCenter * this.DUNE_FREQ_2,
					) * this.DUNE_AMP_2;
				const newDune3 =
					Math.sin(newX * this.DUNE_X_FREQ_3) *
					Math.cos(newZ * this.DUNE_Z_FREQ_3) *
					this.DUNE_AMP_3;

				const newTerrainHeight = newDune1 + newDune2 + newDune3;
				const spawnHeight =
					this.DUST_RESET_SPAWN_HEIGHT_MIN_ABOVE_TERRAIN +
					Math.random() * this.DUST_RESET_SPAWN_HEIGHT_RAND_ADD;

				dustPosArray[i3 + 1] = newTerrainHeight + spawnHeight;

				// Reset velocities
				this.dustVelocities[i3] =
					-Math.sign(dustPosArray[i3]) *
					Math.random() *
					this.DUST_RESET_VELOCITY_XZ_FACTOR;
				this.dustVelocities[i3 + 2] =
					-Math.sign(dustPosArray[i3 + 2]) *
					Math.random() *
					this.DUST_RESET_VELOCITY_XZ_FACTOR;
				this.dustVelocities[i3 + 1] =
					(Math.random() - 0.5) * this.DUST_RESET_VELOCITY_Y_FACTOR;
			}

			// Vertical boundary clamping - only enforce upper limit now, lower limit handled by terrain collision
			if (dustPosArray[i3 + 1] > this.DUST_MAX_Y_CLAMP) {
				dustPosArray[i3 + 1] = this.DUST_MAX_Y_CLAMP;
				this.dustVelocities[i3 + 1] = Math.min(0, this.dustVelocities[i3 + 1]); // Only allow downward movement at ceiling
			}
		}
		dustPosAttribute.needsUpdate = true;
	}

	protected updateVisualEffects(deltaTime: number): void {
		const volume = this.getSmoothedAudio(
			"volume",
			this.AUDIO_SMOOTH_VOLUME_EFFECTS,
		);
		const bassLevel = this.getSmoothedAudio(
			"bass",
			this.AUDIO_SMOOTH_BASS_EFFECTS,
		);
		const midLevel = this.getSmoothedAudio(
			"mid",
			this.AUDIO_SMOOTH_MID_EFFECTS,
		);

		// Sunset-like color variations with enhanced contrast
		const hue =
			this.TERRAIN_VISUAL_HUE_BASE +
			midLevel * this.TERRAIN_VISUAL_HUE_MID_FACTOR;
		const saturation =
			this.TERRAIN_VISUAL_SAT_BASE +
			bassLevel * this.TERRAIN_VISUAL_SAT_BASS_FACTOR;
		const lightness =
			this.TERRAIN_VISUAL_LGT_BASE +
			volume * this.TERRAIN_VISUAL_LGT_VOLUME_FACTOR;
		this.particleMaterial.color.setHSL(hue, saturation, lightness);

		// Dynamic particle size and opacity for dusty wind effect - more pronounced
		this.particleMaterial.opacity = Math.min(
			this.TERRAIN_VISUAL_OPACITY_MAX,
			this.TERRAIN_VISUAL_OPACITY_BASE +
				this.windStrength * this.TERRAIN_VISUAL_OPACITY_WIND_FACTOR +
				bassLevel * this.TERRAIN_VISUAL_OPACITY_BASS_FACTOR,
		);
		this.particleMaterial.size = Math.max(
			this.TERRAIN_VISUAL_SIZE_MIN,
			this.TERRAIN_VISUAL_SIZE_BASE +
				volume * this.TERRAIN_VISUAL_SIZE_VOLUME_FACTOR +
				this.windStrength * this.TERRAIN_VISUAL_SIZE_WIND_FACTOR +
				bassLevel * this.TERRAIN_VISUAL_SIZE_BASS_FACTOR,
		);

		// Update dust particle visuals with depth-based culling effect
		if (this.dustParticleMaterial) {
			// Get camera position for depth calculations
			const cameraPosition =
				this.scene?.getObjectByName("camera")?.position ||
				new THREE.Vector3(0, this.DEFAULT_CAMERA_Y_FOR_DEPTH_EFFECT, 0);

			// Apply depth-based opacity culling to individual particles
			const dustPositions = this.dustParticleGeometry.attributes.position
				.array as Float32Array;
			const dustOpacities = new Float32Array(this.DUST_PARTICLE_COUNT);
			const dustSizes = new Float32Array(this.DUST_PARTICLE_COUNT);

			for (let i = 0; i < this.DUST_PARTICLE_COUNT; i++) {
				const i3 = i * 3;
				const particlePos = new THREE.Vector3(
					dustPositions[i3],
					dustPositions[i3 + 1],
					dustPositions[i3 + 2],
				);

				// Calculate distance from camera to particle
				const distanceToCamera = cameraPosition.distanceTo(particlePos);

				// Define more gentle depth culling parameters
				// const nearDistance = 5;   // Now: this.DUST_DEPTH_CULL_NEAR_DISTANCE
				// const farDistance = 80;   // Now: this.DUST_DEPTH_CULL_FAR_DISTANCE
				// const minOpacity = 0.3;   // Now: this.DUST_DEPTH_CULL_MIN_OPACITY

				// Calculate depth factor (1 = near/visible, 0 = far/faded)
				const depthFactor = Math.max(
					0,
					Math.min(
						1,
						(this.DUST_DEPTH_CULL_FAR_DISTANCE - distanceToCamera) /
							(this.DUST_DEPTH_CULL_FAR_DISTANCE -
								this.DUST_DEPTH_CULL_NEAR_DISTANCE),
					),
				);

				// Apply gentle falloff curve for more natural depth of field
				const smoothDepthFactor =
					depthFactor *
					depthFactor *
					(this.SMOOTH_DEPTH_FACTOR_COEFF1 -
						this.SMOOTH_DEPTH_FACTOR_COEFF2 * depthFactor);

				// Base opacity from audio
				const baseOpacityAudio =
					this.DUST_VISUAL_BASE_OPACITY_EFFECT +
					this.windStrength * this.DUST_VISUAL_OPACITY_WIND_FACTOR +
					midLevel * this.DUST_VISUAL_OPACITY_MID_FACTOR;

				// Apply gentler depth culling to opacity (blend between minOpacity and full opacity)
				const opacityRange = 1.0 - this.DUST_DEPTH_CULL_MIN_OPACITY;
				dustOpacities[i] = Math.min(
					this.DUST_VISUAL_OPACITY_MAX,
					baseOpacityAudio *
						(this.DUST_DEPTH_CULL_MIN_OPACITY +
							opacityRange * smoothDepthFactor),
				);

				// Much gentler size reduction with distance
				const baseSizeAudio =
					this.DUST_VISUAL_BASE_SIZE_EFFECT +
					this.windStrength * this.DUST_VISUAL_SIZE_WIND_FACTOR +
					midLevel * this.DUST_VISUAL_SIZE_MID_FACTOR;
				dustSizes[i] = Math.max(
					this.DUST_VISUAL_SIZE_MIN,
					baseSizeAudio *
						(this.DUST_VISUAL_SIZE_DEPTH_FACTOR_MIN_SCALE +
							this.DUST_VISUAL_SIZE_DEPTH_FACTOR_RANGE_SCALE *
								smoothDepthFactor),
				);
			}

			// Apply the calculated values
			// Note: For individual particle opacity/size, we'd need a custom shader
			// For now, we'll use the average values with enhanced depth-based effects
			const avgOpacity =
				dustOpacities.reduce((sum, val) => sum + val, 0) /
				this.DUST_PARTICLE_COUNT;
			const avgSize =
				dustSizes.reduce((sum, val) => sum + val, 0) / this.DUST_PARTICLE_COUNT;

			this.dustParticleMaterial.opacity = avgOpacity;
			this.dustParticleMaterial.size = avgSize;

			// Add subtle color shift for distant particles (atmospheric perspective)
			const dustHue =
				this.DUST_VISUAL_HUE_BASE + midLevel * this.DUST_VISUAL_HUE_MID_FACTOR;
			const dustSaturation = Math.max(
				this.DUST_VISUAL_SAT_MIN,
				this.DUST_VISUAL_SAT_BASE +
					bassLevel * this.DUST_VISUAL_SAT_BASS_FACTOR +
					(1 - avgOpacity) * this.DUST_VISUAL_SAT_OPACITY_FACTOR,
			);
			const dustLightness =
				this.DUST_VISUAL_LGT_BASE + volume * this.DUST_VISUAL_LGT_VOLUME_FACTOR;
			this.dustParticleMaterial.color.setHSL(
				dustHue,
				dustSaturation,
				dustLightness,
			);
		}

		// Update wind streak visuals - more pronounced
		if (this.streakParticleMaterial) {
			this.streakParticleMaterial.opacity = Math.min(
				this.STREAK_VISUAL_OPACITY_MAX,
				this.STREAK_VISUAL_OPACITY_BASE +
					this.windStrength * this.STREAK_VISUAL_OPACITY_WIND_FACTOR +
					midLevel * this.STREAK_VISUAL_OPACITY_MID_FACTOR,
			);
			// Size could also be dynamic, e.g., slightly larger with more wind
			this.streakParticleMaterial.size = Math.max(
				this.STREAK_VISUAL_SIZE_MIN,
				this.STREAK_VISUAL_SIZE_BASE +
					this.windStrength * this.STREAK_VISUAL_SIZE_WIND_FACTOR +
					volume * this.STREAK_VISUAL_SIZE_VOLUME_FACTOR,
			);
		}
	}

	protected async animateEnter(): Promise<void> {
		return this.createFadeTransition(this.FADE_TRANSITION_DURATION_MS);
	}

	protected async animateExit(): Promise<void> {
		return this.createFadeTransition(this.FADE_TRANSITION_DURATION_MS);
	}
}
