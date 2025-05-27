import type * as THREE from "three";

// Audio Analysis Types
export interface AudioData {
	frequencyData: Uint8Array;
	volume: number;
	bass: number;
	mid: number;
	treble: number;
	pitch: number;
}

export interface AudioAnalyzerOptions {
	fftSize?: number;
	smoothingTimeConstant?: number;
	minDecibels?: number;
	maxDecibels?: number;
}

// Performance Types
export interface PerformanceConfig {
	actDuration: number;
	transitionDuration: number;
	demoActDuration: number;
	demoTransitionDuration: number;
}

export interface ActConfig {
	id: number;
	name: string;
	duration: number;
	description: string;
}

// Base Act Types
export interface BaseAct {
	init(): Promise<void>;
	update(audioData: AudioData, deltaTime: number): void;
	enter(fromAct?: number): Promise<void>;
	exit(toAct?: number): Promise<void>;
	prepareEntry?(): void;
	dispose(): void;
	getScene(): THREE.Scene;
	getCamera(): THREE.Camera;
}

// PoetryOverlay Interface
export interface PoetryOverlayInterface {
	init(): void;
	show(): void;
	hide(): void;
	showLine(lineIndex: number): void;
	update(animationState: AnimationState): void;
	dispose(): void;
}

// Controls Interface
export interface ControlsInterface {
	init(): void;
	updatePlayButton(isPlaying: boolean): void;
	updateActIndicator(actNumber: number): void;
	showMessage(message: string, duration?: number): void;
	hideControls(): void;
	showControls(): void;
	showDemoMessage(message: string): void;
	update(audioAnalyzer: AudioAnalyzerInterface): void;
	dispose(): void;
}

// Scene Types
export interface SceneConfig {
	camera: {
		position: THREE.Vector3;
		fov: number;
		near: number;
		far: number;
	};
	lighting: {
		ambient: {
			color: number;
			intensity: number;
		};
		directional?: {
			color: number;
			intensity: number;
			position: THREE.Vector3;
		};
	};
}

// Particle System Types
export interface ParticleSystemConfig {
	count: number;
	material: THREE.Material;
	geometry: THREE.BufferGeometry;
	updateFunction?: (
		particles: THREE.Points,
		audioData: AudioData,
		deltaTime: number,
	) => void;
}

// Act-specific Types
export interface Act1Config {
	matrixSize: number;
	flowSpeed: number;
	digitCount: number;
	waveformHeight: number;
	dataStreamCount: number;
}

export interface Act2Config {
	terrainResolution: number;
	duneHeight: number;
	windStrength: number;
	heartbeatSensitivity: number;
}

export interface Act3Config {
	organicFormCount: number;
	poetryFadeSpeed: number;
	emotionalResponseIntensity: number;
}

export interface Act4Config {
	starCount: number;
	expansionRate: number;
	cosmicDriftSpeed: number;
	meditativeIntensity: number;
}

// UI Types
export interface PoetryLine {
	text: string;
	timing: number;
	duration: number;
	style?: {
		fontSize?: string;
		color?: string;
		opacity?: number;
		position?: {
			x: string;
			y: string;
		};
	};
}

export interface PoetrySequence {
	act: number;
	lines: PoetryLine[];
}

// Control Types
export interface ControlsConfig {
	enableKeyboard: boolean;
	enableMouse: boolean;
	enableAutoPlay: boolean;
}

export interface KeyBinding {
	key: string;
	action: string;
	description: string;
}

// Animation Types
export interface AnimationState {
	isPlaying: boolean;
	currentTime: number;
	progress: number;
	act: number;
	isTransitioning: boolean;
}

// Shader Types
export interface ShaderConfig {
	vertexShader: string;
	fragmentShader: string;
	uniforms: { [key: string]: THREE.IUniform };
}

// Layout Types
export interface LayoutConfig {
	canvas: {
		width: number;
		height: number;
		aspectRatio: number;
	};
	ui: {
		padding: number;
		fontSize: {
			small: string;
			medium: string;
			large: string;
		};
	};
}

// Event Types
export interface AudioEvent {
	type: "volumeChange" | "beatDetected" | "frequencyPeak";
	data: AudioData;
	timestamp: number;
}

export interface SceneEvent {
	type: "actChange" | "transitionStart" | "transitionEnd";
	act: number;
	timestamp: number;
}

// Base class interfaces
export interface BaseActInterface {
	init(): Promise<void>;
	update(audioData: AudioData, deltaTime: number): void;
	enter(fromAct?: number): Promise<void>;
	exit(toAct?: number): Promise<void>;
	prepareEntry?(): void;
	dispose(): void;
}

export interface SceneManagerInterface {
	currentAct: number;
	isTransitioning: boolean;
	init(): void;
	setAct(actNumber: number): Promise<void>;
	update(audioData: AudioData, deltaTime: number): void;
	getCurrentScene(): { scene: THREE.Scene; camera: THREE.Camera };
	dispose(): void;
}

export interface AudioAnalyzerInterface {
	isEnabled: boolean;
	isMicrophoneConnected: boolean;
	volume: number;
	averageFrequency: number;
	lowFreq: number;
	midFreq: number;
	highFreq: number;
	beat: boolean;
	init(): Promise<boolean>;
	requestMicrophone(): Promise<boolean>;
	toggleMicrophone(): Promise<void>;
	update(): void;
	getAudioData(): AudioData;
	getVolume(): number;
	getAverageFrequency(startIndex?: number, endIndex?: number): number;
	getLowFreq(): number;
	getMidFreq(): number;
	getHighFreq(): number;
	getBeat(): boolean;
	getVolumeNormalized(min?: number, max?: number): number;
	getFrequencyNormalized(type?: string, min?: number, max?: number): number;
	dispose(): void;
}

// Controls types
export interface TimingConfig {
	actDuration: number;
	transitionDuration: number;
	demoActDuration: number;
	demoTransitionDuration: number;
}

export interface ControlsInterface {
	init(): void;
	updatePlayButton(isPlaying: boolean): void;
	updateActIndicator(actNumber: number): void;
	showMessage(message: string, duration?: number): void;
	hideControls(): void;
	showControls(): void;
	showDemoMessage(message: string): void;
	update(audioAnalyzer: AudioAnalyzerInterface): void;
	getTimingConfig(): TimingConfig;
	dispose(): void;
}

// Camera Controller types
export interface CameraState {
	act: number;
	position: THREE.Vector3;
	lookAt: THREE.Vector3;
	isTransitioning: boolean;
	transitionProgress: number;
}

export interface CameraControllerInterface {
	init(): void;
	moveToActImmediate(actNumber: number): void;
	transitionToAct(actNumber: number, duration?: number | null): boolean;
	update(time: number): void;
	stopTransition(): void;
	getCurrentState(): CameraState;
	setCustomPosition(
		position: THREE.Vector3,
		lookAt?: THREE.Vector3 | null,
	): void;
	calculateOptimalDistance(actNumber: number): number;
	updateLayout(): void;
	setEasing(easingName: string): void;
	dispose(): void;
}

// Poetry Overlay types
export interface PoetryOverlayInterface {
	init(): void;
	show(): void;
	hide(): void;
	showLine(lineIndex: number): void;
	triggerOnBeat(audioAnalyzer: AudioAnalyzerInterface): void;
	updateWithAudio(audioAnalyzer: AudioAnalyzerInterface): void;
	update(animationState: AnimationState): void;
	dispose(): void;
}

// Layout Config types
export interface BoundingBox {
	min: THREE.Vector3;
	max: THREE.Vector3;
}

export interface ActConfig {
	name: string;
	position: THREE.Vector3;
	cameraPosition: THREE.Vector3;
	cameraLookAt: THREE.Vector3;
	boundingBox: BoundingBox;
}

export interface LayoutConfigType {
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
	debug: {
		showBoundingBoxes: boolean;
		showCameraPath: boolean;
		showActCenters: boolean;
		wireframeMode: boolean;
	};
}
