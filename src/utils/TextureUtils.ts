import * as THREE from "three";

/**
 * Creates a radial gradient texture.
 * @param size The width and height of the canvas.
 * @param center The center point for the gradient.
 * @param colorStops An array of [offset, color] tuples.
 * @returns A THREE.CanvasTexture.
 */
export function createRadialGradientTexture(
	size: number,
	center: number,
	colorStops: Array<[number, string]>,
): THREE.CanvasTexture {
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	const context = canvas.getContext("2d");

	if (!context) {
		throw new Error("Could not create 2D context for texture");
	}

	const gradient = context.createRadialGradient(
		center,
		center,
		0,
		center,
		center,
		center,
	);

	for (const [offset, color] of colorStops) {
		gradient.addColorStop(offset, color);
	}

	context.fillStyle = gradient;
	context.fillRect(0, 0, size, size);

	const texture = new THREE.CanvasTexture(canvas);
	texture.needsUpdate = true;
	return texture;
}

/**
 * Creates a character texture for effects like Matrix rain.
 * @param char The character to render.
 * @param config Configuration for character texture.
 * @returns A THREE.CanvasTexture.
 */
export function createCharacterTexture(
	char: string,
	config: {
		canvasWidth: number;
		canvasHeight: number;
		fontStyle: string; // e.g., "bold 192px monospace"
		fillStyle: string;
		trailCount?: number;
		trailOpacityStep?: number;
		glow?: {
			gradientRadius: number;
			colorStart: string;
			colorEnd: string;
		};
	},
): THREE.CanvasTexture {
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d");

	if (!context) {
		throw new Error("Could not create 2D context for character texture");
	}

	canvas.width = config.canvasWidth;
	canvas.height = config.canvasHeight;

	context.fillStyle = config.fillStyle;
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.font = config.fontStyle;

	const fontSizeMatch = config.fontStyle.match(/(\\d+)px/);
	const fontSize = fontSizeMatch ? Number.parseInt(fontSizeMatch[1], 10) : 24; // Default to 24px if not found

	const charX = config.canvasWidth / 2;
	const charY = fontSize / 2;

	context.fillText(char, charX, charY);

	if (config.trailCount && config.trailOpacityStep) {
		const baseFillStyle = config.fillStyle;
		// Extract color part if fillStyle is rgba, otherwise assume it's a hex or named color
		let baseColor = baseFillStyle;
		let baseAlpha = 1.0;
		if (baseFillStyle.startsWith("rgba")) {
			const parts = baseFillStyle.match(
				/rgba\\((\\d+),\\s*(\\d+),\\s*(\\d+),\\s*([\\d.]+)\\)/,
			);
			if (parts) {
				baseColor = `rgb(${parts[1]},${parts[2]},${parts[3]})`;
				baseAlpha = Number.parseFloat(parts[4]);
			}
		} else if (baseFillStyle.startsWith("rgb")) {
			// no change needed
		} else {
			// hex or named color
			// no change, but alpha needs to be handled
		}

		for (let i = 1; i < config.trailCount; i++) {
			const opacity = Math.max(0, baseAlpha - i * config.trailOpacityStep);
			// Reconstruct fillStyle with new opacity
			if (baseColor.startsWith("rgb(")) {
				// was originally rgb or rgba
				context.fillStyle = baseColor
					.replace("rgb(", "rgba(")
					.replace(")", `, ${opacity})`);
			} else {
				// was hex or named, need to convert to rgba. This is a simplification.
				// For a robust solution, a hex-to-rgba function would be needed.
				// Assuming white for simplicity if not rgb/rgba
				const tempColor = new THREE.Color(baseColor);
				context.fillStyle = `rgba(${tempColor.r * 255}, ${tempColor.g * 255}, ${tempColor.b * 255}, ${opacity})`;
			}
			context.fillText(char, charX, charY + i * fontSize); // Use extracted fontSize here
		}
		context.fillStyle = config.fillStyle; // Reset to original
	}

	if (config.glow) {
		const glowGradient = context.createRadialGradient(
			charX,
			charY,
			0,
			charX,
			charY,
			config.glow.gradientRadius,
		);
		glowGradient.addColorStop(0, config.glow.colorStart);
		glowGradient.addColorStop(1, config.glow.colorEnd);
		context.globalCompositeOperation = "screen"; // Or 'lighter' for different glow
		context.fillStyle = glowGradient;
		context.fillRect(0, 0, config.canvasWidth, config.canvasHeight); // Apply glow over the whole canvas or char area
		context.globalCompositeOperation = "source-over"; // Reset composite operation
	}

	const texture = new THREE.CanvasTexture(canvas);
	texture.needsUpdate = true;
	texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;
	texture.generateMipmaps = false;
	return texture;
}

/**
 * Creates an elongated gradient texture for streaks.
 * @param config Configuration for the streak texture.
 * @returns A THREE.CanvasTexture.
 */
export function createStreakTexture(config: {
	canvasSize: number;
	gradientStops: Array<[number, string]>;
	rect: { x: number; y: number; width: number; height: number };
	rotation?: number;
	translate?: { x: number; y: number };
}): THREE.CanvasTexture {
	const canvas = document.createElement("canvas");
	canvas.width = config.canvasSize;
	canvas.height = config.canvasSize;
	const context = canvas.getContext("2d");

	if (!context) {
		throw new Error("Could not create 2D context for streak texture");
	}

	if (config.translate) {
		context.translate(config.translate.x, config.translate.y);
	}
	if (config.rotation) {
		context.rotate(config.rotation);
	}

	const gradient = context.createLinearGradient(
		config.rect.x,
		0,
		config.rect.x + config.rect.width,
		0, // Horizontal gradient
	);

	for (const [offset, color] of config.gradientStops) {
		gradient.addColorStop(offset, color);
	}

	context.fillStyle = gradient;
	context.fillRect(
		config.rect.x,
		config.rect.y,
		config.rect.width,
		config.rect.height,
	);

	const texture = new THREE.CanvasTexture(canvas);
	texture.needsUpdate = true;
	return texture;
}
