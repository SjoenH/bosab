# Copilot Instructions for "beneath our skin and bones"

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a Three.js generative visual performance project for the dance piece "beneath our skin and bones" performed at Oslo Jazzdansfestival. The project creates a 25-minute audio-reactive visual journey through four artistic acts.

## Technical Stack
- **Three.js** for 3D graphics and scene management
- **Web Audio API** for live microphone input and audio analysis
- **Vanilla JavaScript** for all logic and interactions
- **Vite** as build tool and development server

## Project Structure
- Four distinct visual acts with smooth transitions
- Audio-reactive particle systems and shaders
- Real-time microphone input processing
- Text overlay system for poetry integration
- Full-screen projection optimization

## Creative Acts
1. **Act 1 - Data/Matrix**: Flowing numbers, clinical waveforms, data visualization
2. **Act 2 - Desert/Dunes**: Shifting sand landscapes, heartbeat-driven terrain
3. **Act 3 - Human/Poetic**: Organic forms, poetry overlays, emotional visuals
4. **Act 4 - Stars/Cosmic**: Expanding starfield, meditative drift, cosmic wonder

## Code Guidelines
- Prioritize performance for real-time rendering
- Use modular scene management for act transitions
- Implement smooth audio-visual synchronization
- Create reusable particle systems and shaders
- Optimize for full-screen projection display
- Handle microphone permissions gracefully
- Use meaningful variable names reflecting the artistic vision

## Key Features to Implement
- Audio analyzer with FFT for frequency analysis
- Scene transition system with fade effects
- Particle systems responding to audio input
- Text rendering system for poetry overlays
- Keyboard controls for manual navigation
- Auto-play mode with timed transitions
- Responsive full-screen canvas

## Performance Considerations
- Optimize particle count for smooth 60fps
- Use efficient shader materials
- Implement object pooling for particles
- Minimize garbage collection during performance
- Use requestAnimationFrame for smooth animations
