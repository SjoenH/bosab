import type { PerformanceApp } from '../PerformanceApp';
import type { AudioAnalyzer } from '../audio/AudioAnalyzer';

interface TimingConfig {
    actDuration: number;
    transitionDuration: number;
    demoActDuration: number;
    demoTransitionDuration: number;
}

interface AudioLevels {
    volume: number;
    lowFreq: number;
    midFreq: number;
    highFreq: number;
    beat: boolean;
}

export class Controls {
    private app: PerformanceApp;
    private playButton: HTMLElement | null = null;
    private fullscreenButton: HTMLElement | null = null;
    private configButton: HTMLElement | null = null;
    private timingConfig: HTMLElement | null = null;
    private actIndicator: HTMLElement | null = null;
    private micStatus: HTMLElement | null = null;
    private volumeLevel: HTMLElement | null = null;
    private lowLevel: HTMLElement | null = null;
    private midLevel: HTMLElement | null = null;
    private highLevel: HTMLElement | null = null;
    private beatIndicator: HTMLElement | null = null;
    private isInitialized: boolean = false;

    // Timing configuration elements
    private actDurationInput: HTMLInputElement | null = null;
    private transitionDurationInput: HTMLInputElement | null = null;
    private demoActDurationInput: HTMLInputElement | null = null;
    private demoTransitionDurationInput: HTMLInputElement | null = null;
    private totalDurationDisplay: HTMLElement | null = null;
    private demoDurationDisplay: HTMLElement | null = null;

    // Event handlers as bound methods
    private handleKeyDown = (event: KeyboardEvent): void => {
        // Ignore key events while typing in input fields
        if (event.target instanceof HTMLInputElement) return;

        switch (event.key.toLowerCase()) {
            case ' ':
            case 'p':
                event.preventDefault();
                this.app.toggleAutoPlay();
                break;
            case 'arrowright':
            case 'n':
            case 'd':
                event.preventDefault();
                this.app.nextAct();
                break;
            case 'arrowleft':
            case 'b':
            case 'a':
                event.preventDefault();
                this.app.previousAct();
                break;
            case 'f':
                event.preventDefault();
                this.app.toggleFullscreen();
                break;
            case 'm':
                event.preventDefault();
                const analyzer = this.app.getAudioAnalyzer();
                if (analyzer) {
                    analyzer.toggleMicrophone();
                }
                break;
            case 'escape':
                this.hideTimingConfig();
                break;
            case '1':
            case '2':
            case '3':
            case '4':
                const actNumber = parseInt(event.key);
                event.preventDefault();
                this.app.setAct(actNumber);
                break;
        }
    }

    private handleKeyUp = (event: KeyboardEvent): void => {
        // Handle key up events if needed
    }

    private handleResize = (): void => {
        this.updatePositions();
    }

    constructor(app: PerformanceApp) {
        this.app = app;
    }

    public init(): void {
        this.playButton = document.getElementById('playButton');
        this.fullscreenButton = document.getElementById('fullscreenButton');
        this.configButton = document.getElementById('configButton');
        this.timingConfig = document.getElementById('timingConfig');
        this.actIndicator = document.getElementById('actIndicator');
        this.micStatus = document.getElementById('micStatus');
        this.volumeLevel = document.getElementById('volumeLevel');
        this.lowLevel = document.getElementById('lowLevel');
        this.midLevel = document.getElementById('midLevel');
        this.highLevel = document.getElementById('highLevel');
        this.beatIndicator = document.getElementById('beatIndicator');

        // Timing configuration elements
        this.actDurationInput = document.getElementById('actDuration') as HTMLInputElement;
        this.transitionDurationInput = document.getElementById('transitionDuration') as HTMLInputElement;
        this.demoActDurationInput = document.getElementById('demoActDuration') as HTMLInputElement;
        this.demoTransitionDurationInput = document.getElementById('demoTransitionDuration') as HTMLInputElement;
        this.totalDurationDisplay = document.getElementById('totalDuration');
        this.demoDurationDisplay = document.getElementById('demoDuration');

        if (!this.playButton || !this.actIndicator) {
            console.warn('Control elements not found');
            return;
        }

        this.setupPlayButton();
        this.setupFullscreenButton();
        this.setupTimingConfig();
        this.updateActIndicator(1);
        this.updateMicrophoneStatus('disconnected');
        this.isInitialized = true;

        // Add keyboard event listeners
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        window.addEventListener('resize', this.handleResize);

        console.log('🎮 Controls initialized with keyboard navigation');
    }

    private setupPlayButton(): void {
        if (!this.playButton) return;

        this.playButton.addEventListener('click', () => {
            this.app.toggleAutoPlay();
        });

        // Request microphone access when play is first clicked
        this.playButton.addEventListener('click', async () => {
            const analyzer = this.app.getAudioAnalyzer();
            if (analyzer && !analyzer.isMicrophoneConnected) {
                const connected = await analyzer.requestMicrophone();
                this.showMicrophoneStatus(connected);
            }
        }, { once: true });
    }

    private setupFullscreenButton(): void {
        if (!this.fullscreenButton) return;

        this.fullscreenButton.addEventListener('click', () => {
            this.app.toggleFullscreen();
        });

        // Listen for fullscreen changes to update button state
        document.addEventListener('fullscreenchange', () => {
            this.updateFullscreenButton();
        });

        // Update initial state
        this.updateFullscreenButton();
    }

    private updateFullscreenButton(): void {
        if (!this.fullscreenButton) return;

        if (document.fullscreenElement) {
            this.fullscreenButton.textContent = '⛶ Exit Fullscreen';
            this.fullscreenButton.classList.add('active');
        } else {
            this.fullscreenButton.textContent = '⛶ Fullscreen';
            this.fullscreenButton.classList.remove('active');
        }
    }

    public updatePlayButton(isPlaying: boolean): void {
        if (!this.playButton) return;

        if (isPlaying) {
            this.playButton.textContent = '⏸ Pause Auto Mode';
            this.playButton.classList.add('playing');
        } else {
            this.playButton.textContent = '▶ Play Auto Mode';
            this.playButton.classList.remove('playing');
        }
    }

    public updateActIndicator(actNumber: number): void {
        if (!this.actIndicator) return;

        const actNames: Record<number, string> = {
            1: 'Act 1 - Data/Matrix',
            2: 'Act 2 - Desert/Dunes',
            3: 'Act 3 - Human/Poetic',
            4: 'Act 4 - Stars/Cosmic'
        };

        this.actIndicator.textContent = actNames[actNumber] || `Act ${actNumber}`;

        // Add subtle color coding
        this.actIndicator.style.borderColor = this.getActColor(actNumber);
    }

    private getActColor(actNumber: number): string {
        const colors: Record<number, string> = {
            1: '#00ff41', // Matrix green
            2: '#d4a574', // Desert sand
            3: '#ff6b9d', // Human pink
            4: '#4dabf7'  // Cosmic blue
        };
        return colors[actNumber] || '#ffffff';
    }

    public showMessage(message: string, duration: number = 3000): void {
        // Create temporary message overlay
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            font-size: 14px;
            border: 1px solid rgba(255, 255, 255, 0.3);
        `;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);

        // Fade in
        messageDiv.style.opacity = '0';
        requestAnimationFrame(() => {
            messageDiv.style.transition = 'opacity 0.3s ease';
            messageDiv.style.opacity = '1';
        });

        // Remove after duration
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, duration);
    }

    private showMicrophoneStatus(connected: boolean): void {
        const status = connected ? 'Microphone Connected 🎤' : 'Running in Silent Mode 🔇';
        this.showMessage(status, 2000);
    }

    public hideControls(): void {
        const controls = document.getElementById('controls');
        if (controls) {
            controls.style.opacity = '0';
            controls.style.pointerEvents = 'none';
        }
    }

    public showControls(): void {
        const controls = document.getElementById('controls');
        if (controls) {
            controls.style.opacity = '0.8';
            controls.style.pointerEvents = 'auto';
        }
    }

    public showDemoMessage(message: string): void {
        this.showMessage(`🎬 DEMO: ${message}`, 2000);
    }

    private updateMicrophoneStatus(status: 'connected' | 'silent' | 'disconnected'): void {
        if (!this.micStatus) return;

        switch (status) {
            case 'connected':
                this.micStatus.textContent = '🎤 Live Mic';
                this.micStatus.className = 'connected';
                break;
            case 'silent':
                this.micStatus.textContent = '🔇 Silent Mode';
                this.micStatus.className = 'silent';
                break;
            default:
                this.micStatus.textContent = '🔇 No Mic';
                this.micStatus.className = '';
        }
    }

    private updateAudioLevels(audioData: AudioLevels): void {
        // Update volume level bar
        if (this.volumeLevel) {
            const volumePercent = Math.min(audioData.volume * 100, 100);
            this.volumeLevel.style.setProperty('--level', `${volumePercent}%`);
        }

        // Update frequency level bars
        if (this.lowLevel) {
            const lowPercent = Math.min(audioData.lowFreq * 100, 100);
            this.lowLevel.style.setProperty('--level', `${lowPercent}%`);
        }

        if (this.midLevel) {
            const midPercent = Math.min(audioData.midFreq * 100, 100);
            this.midLevel.style.setProperty('--level', `${midPercent}%`);
        }

        if (this.highLevel) {
            const highPercent = Math.min(audioData.highFreq * 100, 100);
            this.highLevel.style.setProperty('--level', `${highPercent}%`);
        }

        // Update beat indicator
        if (this.beatIndicator) {
            if (audioData.beat) {
                this.beatIndicator.classList.add('beat');
            } else {
                this.beatIndicator.classList.remove('beat');
            }
        }
    }

    public update(audioAnalyzer: AudioAnalyzer): void {
        if (!this.isInitialized) return;

        // Update microphone status
        if (audioAnalyzer.isMicrophoneConnected) {
            this.updateMicrophoneStatus('connected');
        } else if (audioAnalyzer.isEnabled) {
            this.updateMicrophoneStatus('silent');
        } else {
            this.updateMicrophoneStatus('disconnected');
        }

        // Update audio levels
        this.updateAudioLevels({
            volume: audioAnalyzer.getVolume(),
            lowFreq: audioAnalyzer.getLowFreq(),
            midFreq: audioAnalyzer.getMidFreq(),
            highFreq: audioAnalyzer.getHighFreq(),
            beat: audioAnalyzer.getBeat()
        });
    }

    private setupTimingConfig(): void {
        if (!this.configButton || !this.timingConfig) {
            console.warn('Timing configuration elements not found');
            return;
        }

        // Show/hide config panel
        this.configButton.addEventListener('click', () => {
            this.showTimingConfig();
        });

        // Close config panel
        const closeButton = document.getElementById('closeConfigButton');
        const resetButton = document.getElementById('resetTimingButton');

        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.hideTimingConfig();
            });
        }

        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.resetTimingDefaults();
            });
        }

        // Close on escape key
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Escape' && !this.timingConfig!.classList.contains('hidden')) {
                this.hideTimingConfig();
            }
        });

        // Update displays when inputs change
        const inputs = [
            this.actDurationInput,
            this.transitionDurationInput,
            this.demoActDurationInput,
            this.demoTransitionDurationInput
        ];

        inputs.forEach(input => {
            if (input) {
                input.addEventListener('input', () => {
                    this.updateTimingDisplays();
                });
            }
        });

        // Initialize displays
        this.updateTimingDisplays();
    }

    private showTimingConfig(): void {
        if (!this.timingConfig) return;
        this.timingConfig.classList.remove('hidden');
        this.updateTimingDisplays();
    }

    private hideTimingConfig(): void {
        if (!this.timingConfig) return;
        this.timingConfig.classList.add('hidden');
        this.applyTimingSettings();
    }

    private updateTimingDisplays(): void {
        // Update individual duration displays
        if (this.actDurationInput) {
            const actDuration = parseFloat(this.actDurationInput.value) || 6.25;
            const displaySpan = this.actDurationInput.parentNode?.querySelector('.duration-display') as HTMLElement;
            if (displaySpan) {
                displaySpan.textContent = `${actDuration} min`;
            }
        }

        if (this.transitionDurationInput) {
            const transitionDuration = parseFloat(this.transitionDurationInput.value) || 3;
            const displaySpan = this.transitionDurationInput.parentNode?.querySelector('.duration-display') as HTMLElement;
            if (displaySpan) {
                displaySpan.textContent = `${transitionDuration} sec`;
            }
        }

        if (this.demoActDurationInput) {
            const demoActDuration = parseFloat(this.demoActDurationInput.value) || 5;
            const displaySpan = this.demoActDurationInput.parentNode?.querySelector('.duration-display') as HTMLElement;
            if (displaySpan) {
                displaySpan.textContent = `${demoActDuration} sec`;
            }
        }

        if (this.demoTransitionDurationInput) {
            const demoTransitionDuration = parseFloat(this.demoTransitionDurationInput.value) || 0.5;
            const displaySpan = this.demoTransitionDurationInput.parentNode?.querySelector('.duration-display') as HTMLElement;
            if (displaySpan) {
                displaySpan.textContent = `${demoTransitionDuration} sec`;
            }
        }

        // Update total duration calculations
        this.updateTotalDurations();
    }

    private updateTotalDurations(): void {
        const actDuration = parseFloat(this.actDurationInput?.value || '6.25');
        const transitionDuration = parseFloat(this.transitionDurationInput?.value || '3');
        const demoActDuration = parseFloat(this.demoActDurationInput?.value || '5');
        const demoTransitionDuration = parseFloat(this.demoTransitionDurationInput?.value || '0.5');

        // Calculate full show duration (4 acts + 3 transitions)
        const totalMinutes = (actDuration * 4) + ((transitionDuration / 60) * 3);

        // Calculate demo duration (4 acts + 3 transitions)
        const demoSeconds = (demoActDuration * 4) + (demoTransitionDuration * 3);

        if (this.totalDurationDisplay) {
            this.totalDurationDisplay.textContent = `${totalMinutes.toFixed(1)} minutes`;
        }

        if (this.demoDurationDisplay) {
            this.demoDurationDisplay.textContent = `${demoSeconds.toFixed(1)} seconds`;
        }
    }

    private resetTimingDefaults(): void {
        if (this.actDurationInput) this.actDurationInput.value = '6.25';
        if (this.transitionDurationInput) this.transitionDurationInput.value = '3';
        if (this.demoActDurationInput) this.demoActDurationInput.value = '5';
        if (this.demoTransitionDurationInput) this.demoTransitionDurationInput.value = '0.5';

        this.updateTimingDisplays();
        this.showMessage('Timing reset to defaults');
    }

    private applyTimingSettings(): void {
        const actDuration = parseFloat(this.actDurationInput?.value || '6.25');
        const transitionDuration = parseFloat(this.transitionDurationInput?.value || '3');
        const demoActDuration = parseFloat(this.demoActDurationInput?.value || '5');
        const demoTransitionDuration = parseFloat(this.demoTransitionDurationInput?.value || '0.5');

        // Apply settings to the performance app
        if (this.app.setTimingConfig) {
            this.app.setTimingConfig({
                actDuration: actDuration * 60 * 1000, // Convert to milliseconds
                transitionDuration: transitionDuration * 1000, // Convert to milliseconds
                demoActDuration: demoActDuration * 1000, // Convert to milliseconds
                demoTransitionDuration: demoTransitionDuration * 1000 // Convert to milliseconds
            });
        }

        this.showMessage(`Timing updated: ${actDuration}min acts, ${demoActDuration}s demo`, 2000);
    }

    public getTimingConfig(): TimingConfig {
        return {
            actDuration: parseFloat(this.actDurationInput?.value || '6.25'),
            transitionDuration: parseFloat(this.transitionDurationInput?.value || '3'),
            demoActDuration: parseFloat(this.demoActDurationInput?.value || '5'),
            demoTransitionDuration: parseFloat(this.demoTransitionDurationInput?.value || '0.5')
        };
    }

    public dispose(): void {
        // Remove event listeners
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('resize', this.handleResize);

        // Clean up UI elements
        const container = document.querySelector('.controls-container');
        if (container) {
            container.remove();
        }
    }

    private updatePositions(): void {
        // Update positions of UI elements based on window size
        const margin = 20;
        const controlsContainer = document.querySelector('.controls-container');
        if (controlsContainer instanceof HTMLElement) {
            controlsContainer.style.left = `${margin}px`;
            controlsContainer.style.bottom = `${margin}px`;
        }

        const configContainer = document.querySelector('.config-container');
        if (configContainer instanceof HTMLElement) {
            configContainer.style.right = `${margin}px`;
            configContainer.style.top = `${margin}px`;
        }
    }
}
