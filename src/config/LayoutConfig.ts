/**
 * Layout Configuration for "beneath our skin and bones"
 *
 * This file defines the spatial layout of all acts and camera positions,
 * making it easy to adjust spacing and positioning without touching act code.
 */

import * as THREE from "three";

interface BoundingBox {
	min: THREE.Vector3;
	max: THREE.Vector3;
}

interface ActConfig {
	name: string;
	position: THREE.Vector3;
	cameraPosition: THREE.Vector3;
	cameraLookAt: THREE.Vector3;
	boundingBox: BoundingBox;
}

interface CircularLayoutConfig {
	radius: number;
	acts: Record<number, { angle: number }>;
}

interface GridLayoutConfig {
	spacing: number;
	acts: Record<number, { row: number; col: number }>;
}

interface VerticalLayoutConfig {
	spacing: number;
	acts: Record<number, { y: number }>;
}

interface AlternativeLayouts {
	circular: CircularLayoutConfig;
	grid: GridLayoutConfig;
	vertical: VerticalLayoutConfig;
}

interface LayoutConfigType {
	spacing: {
		actSeparation: number;
		safeZone: number;
		verticalOffset: number;
		cameraDistance: number;
	};
	camera: {
		fov: number;
		near: number;
		far: number;
		transitionDuration: number;
		easing: string;
		smoothLookAt: boolean;
		lookAtTransitionDuration: number;
	};
	acts: Record<number, ActConfig>;
	alternativeLayouts: AlternativeLayouts;
	debug: {
		showBoundingBoxes: boolean;
		showCameraPath: boolean;
		showActCenters: boolean;
		wireframeMode: boolean;
	};
}

export const LAYOUT_CONFIG: LayoutConfigType = {
	// Global spacing and positioning settings
	spacing: {
		// Distance between acts along primary axis
		actSeparation: 50,

		// Safe zone around each act (prevents visual overlap)
		safeZone: 25,

		// Vertical offset for acts (can be used for layering)
		verticalOffset: 0,

		// Camera distance from acts
		cameraDistance: 15,
	},

	// Camera configuration for smooth navigation
	camera: {
		// Base camera settings
		fov: 75,
		near: 0.1,
		far: 1000,

		// Transition timing (milliseconds)
		transitionDuration: 3500, // Slightly longer for more graceful movement

		// Easing function for camera movement
		easing: "easeInOutQuart", // More dramatic easing for artistic transitions

		// Look-at behavior during transitions
		smoothLookAt: true,
		lookAtTransitionDuration: 2500, // Matched with main transition
	},

	// Act positioning - each act gets its own 3D space
	acts: {
		1: {
			name: "Matrix",
			position: new THREE.Vector3(0, 0, -50), // North
			cameraPosition: new THREE.Vector3(0, 0, -35), // Closer to act for better view
			cameraLookAt: new THREE.Vector3(0, 0, -50), // Look North
			boundingBox: {
				min: new THREE.Vector3(-25, -25, -60),
				max: new THREE.Vector3(25, 25, -40),
			},
		},
		2: {
			name: "Desert",
			position: new THREE.Vector3(50, 0, 0), // East (removed y offset)
			cameraPosition: new THREE.Vector3(35, 0, 0), // Move camera towards act
			cameraLookAt: new THREE.Vector3(50, 0, 0), // Look East
			boundingBox: {
				min: new THREE.Vector3(40, -25, -25),
				max: new THREE.Vector3(60, 25, 25),
			},
		},
		3: {
			name: "Human",
			position: new THREE.Vector3(0, 0, 50), // South
			cameraPosition: new THREE.Vector3(0, -8, 30), // Lower camera position and pull back slightly
			cameraLookAt: new THREE.Vector3(0, 5, 50), // Look up at elevated heart position
			boundingBox: {
				min: new THREE.Vector3(-25, -25, 40),
				max: new THREE.Vector3(25, 25, 60),
			},
		},
		4: {
			name: "Stars",
			position: new THREE.Vector3(-50, 0, 0), // West
			cameraPosition: new THREE.Vector3(-35, 0, 0), // Move camera towards act
			cameraLookAt: new THREE.Vector3(-50, 0, 0), // Look West
			boundingBox: {
				min: new THREE.Vector3(-60, -25, -25),
				max: new THREE.Vector3(-40, 25, 25),
			},
		},
	},

	// Alternative layouts (can be switched programmatically)
	alternativeLayouts: {
		// Circular arrangement
		circular: {
			radius: 40,
			acts: {
				1: { angle: 0 }, // 0 degrees
				2: { angle: Math.PI / 2 }, // 90 degrees
				3: { angle: Math.PI }, // 180 degrees
				4: { angle: (3 * Math.PI) / 2 }, // 270 degrees
			},
		},

		// Grid arrangement
		grid: {
			spacing: 50,
			acts: {
				1: { row: 0, col: 0 }, // Top-left
				2: { row: 0, col: 1 }, // Top-right
				3: { row: 1, col: 0 }, // Bottom-left
				4: { row: 1, col: 1 }, // Bottom-right
			},
		},

		// Vertical stack
		vertical: {
			spacing: 30,
			acts: {
				1: { y: 45 }, // Top
				2: { y: 15 }, // Upper middle
				3: { y: -15 }, // Lower middle
				4: { y: -45 }, // Bottom
			},
		},
	},

	// Debug and development settings
	debug: {
		// Show bounding boxes for acts
		showBoundingBoxes: false,

		// Show camera path visualization
		showCameraPath: false,

		// Show act center markers
		showActCenters: false,

		// Enable wireframe mode for easier positioning
		wireframeMode: false,
	},
};

/**
 * Helper functions for layout calculations
 */
export class LayoutHelper {
	/**
	 * Get the position for a specific act
	 */
	static getActPosition(actNumber: number): THREE.Vector3 {
		const actConfig = LAYOUT_CONFIG.acts[actNumber];
		return actConfig ? actConfig.position.clone() : new THREE.Vector3(0, 0, 0);
	}

	/**
	 * Get camera position for a specific act
	 */
	static getCameraPosition(actNumber: number): THREE.Vector3 {
		const actConfig = LAYOUT_CONFIG.acts[actNumber];
		return actConfig
			? actConfig.cameraPosition.clone()
			: new THREE.Vector3(0, 0, 15);
	}

	/**
	 * Get camera look-at target for a specific act
	 */
	static getCameraLookAt(actNumber: number): THREE.Vector3 {
		const actConfig = LAYOUT_CONFIG.acts[actNumber];
		return actConfig
			? actConfig.cameraLookAt.clone()
			: new THREE.Vector3(0, 0, 0);
	}

	/**
	 * Get bounding box for a specific act
	 */
	static getActBounds(actNumber: number): BoundingBox | null {
		const actConfig = LAYOUT_CONFIG.acts[actNumber];
		if (!actConfig) return null;

		return {
			min: actConfig.boundingBox.min.clone(),
			max: actConfig.boundingBox.max.clone(),
		};
	}

	/**
	 * Check if two acts would overlap visually
	 */
	static checkActOverlap(actNumber1: number, actNumber2: number): boolean {
		const bounds1 = LayoutHelper.getActBounds(actNumber1);
		const bounds2 = LayoutHelper.getActBounds(actNumber2);

		if (!bounds1 || !bounds2) return false;

		// Simple AABB overlap check
		return (
			bounds1.min.x <= bounds2.max.x &&
			bounds1.max.x >= bounds2.min.x &&
			bounds1.min.y <= bounds2.max.y &&
			bounds1.max.y >= bounds2.min.y &&
			bounds1.min.z <= bounds2.max.z &&
			bounds1.max.z >= bounds2.min.z
		);
	}

	/**
	 * Calculate distance between two acts
	 */
	static getActDistance(actNumber1: number, actNumber2: number): number {
		const pos1 = LayoutHelper.getActPosition(actNumber1);
		const pos2 = LayoutHelper.getActPosition(actNumber2);
		return pos1.distanceTo(pos2);
	}

	/**
	 * Apply alternative layout
	 */
	static applyLayout(layoutName: keyof AlternativeLayouts): boolean {
		const layout = LAYOUT_CONFIG.alternativeLayouts[layoutName];
		if (!layout) {
			console.warn(`Layout "${layoutName}" not found`);
			return false;
		}

		// Apply layout based on type
		switch (layoutName) {
			case "circular":
				LayoutHelper.applyCircularLayout(layout as CircularLayoutConfig);
				break;
			case "grid":
				LayoutHelper.applyGridLayout(layout as GridLayoutConfig);
				break;
			case "vertical":
				LayoutHelper.applyVerticalLayout(layout as VerticalLayoutConfig);
				break;
		}

		console.log(`📐 Applied "${layoutName}" layout`);
		return true;
	}

	private static applyCircularLayout(layout: CircularLayoutConfig): void {
		const { radius, acts } = layout;
		const cameraDistance = LAYOUT_CONFIG.spacing.cameraDistance;

		Object.entries(acts).forEach(([actNumber, config]) => {
			const { angle } = config;
			const x = Math.cos(angle) * radius;
			const z = Math.sin(angle) * radius;
			const actNum = Number.parseInt(actNumber);

			// Update act position
			LAYOUT_CONFIG.acts[actNum].position.set(x, 0, z);
			LAYOUT_CONFIG.acts[actNum].cameraPosition.set(
				x + Math.cos(angle) * cameraDistance,
				0,
				z + Math.sin(angle) * cameraDistance,
			);
			LAYOUT_CONFIG.acts[actNum].cameraLookAt.set(x, 0, z);
		});
	}

	private static applyGridLayout(layout: GridLayoutConfig): void {
		const { spacing, acts } = layout;
		const cameraDistance = LAYOUT_CONFIG.spacing.cameraDistance;

		Object.entries(acts).forEach(([actNumber, config]) => {
			const { row, col } = config;
			const x = (col - 0.5) * spacing;
			const y = -(row - 0.5) * spacing;
			const actNum = Number.parseInt(actNumber);

			LAYOUT_CONFIG.acts[actNum].position.set(x, y, 0);
			LAYOUT_CONFIG.acts[actNum].cameraPosition.set(x, y, cameraDistance);
			LAYOUT_CONFIG.acts[actNum].cameraLookAt.set(x, y, 0);
		});
	}

	private static applyVerticalLayout(layout: VerticalLayoutConfig): void {
		const { spacing, acts } = layout;
		const cameraDistance = LAYOUT_CONFIG.spacing.cameraDistance;

		Object.entries(acts).forEach(([actNumber, config]) => {
			const { y } = config;
			const actNum = Number.parseInt(actNumber);

			LAYOUT_CONFIG.acts[actNum].position.set(0, y, 0);
			LAYOUT_CONFIG.acts[actNum].cameraPosition.set(0, y, cameraDistance);
			LAYOUT_CONFIG.acts[actNum].cameraLookAt.set(0, y, 0);
		});
	}

	/**
	 * Validate layout configuration
	 */
	static validateLayout(): string[] {
		const issues: string[] = [];

		// Check for overlapping acts
		for (let i = 1; i <= 4; i++) {
			for (let j = i + 1; j <= 4; j++) {
				if (LayoutHelper.checkActOverlap(i, j)) {
					issues.push(`Acts ${i} and ${j} have overlapping bounding boxes`);
				}
			}
		}

		// Check minimum distances
		const minDistance = LAYOUT_CONFIG.spacing.safeZone;
		for (let i = 1; i <= 4; i++) {
			for (let j = i + 1; j <= 4; j++) {
				const distance = LayoutHelper.getActDistance(i, j);
				if (distance < minDistance) {
					issues.push(
						`Acts ${i} and ${j} are too close: ${distance.toFixed(1)} < ${minDistance}`,
					);
				}
			}
		}

		if (issues.length > 0) {
			console.warn("⚠️ Layout validation issues:", issues);
		} else {
			console.log("✅ Layout validation passed");
		}

		return issues;
	}
}
