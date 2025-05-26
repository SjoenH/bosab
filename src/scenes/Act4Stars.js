import * as THREE from 'three';

export class Act4Stars {
    constructor(scene, camera, audioAnalyzer) {
        this.scene = scene;
        this.camera = camera;
        this.audioAnalyzer = audioAnalyzer;
        
        this.group = new THREE.Group();
        this.stars = [];
        this.nebula = null;
        this.cosmicDust = [];
        this.galaxySpiral = null;
        this.time = 0;
        this.isActive = false;
    }
    
    init() {
        this.scene.add(this.group);
        this.createStarfield();
        this.createNebula();
        this.createCosmicDust();
        this.createGalaxySpiral();
        this.createAmbientLighting();
        
        console.log('✨ Act 4 - Stars initialized');
    }
    
    createStarfield() {
        // Create multiple layers of stars for depth
        const starLayers = [
            { count: 2000, size: 0.5, distance: 500, brightness: 0.8 },
            { count: 1500, size: 1.0, distance: 300, brightness: 1.0 },
            { count: 800, size: 1.5, distance: 150, brightness: 1.2 },
            { count: 200, size: 2.0, distance: 80, brightness: 1.5 }
        ];
        
        starLayers.forEach((layer, layerIndex) => {
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(layer.count * 3);
            const colors = new Float32Array(layer.count * 3);
            const sizes = new Float32Array(layer.count);
            
            for (let i = 0; i < layer.count; i++) {
                // Create spherical distribution
                const radius = layer.distance + Math.random() * 50;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                
                positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
                positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
                positions[i * 3 + 2] = radius * Math.cos(phi);
                
                // Vary star colors from blue-white to orange
                const temperature = Math.random();
                if (temperature < 0.3) {
                    // Blue stars
                    colors[i * 3] = 0.7 + Math.random() * 0.3;
                    colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
                    colors[i * 3 + 2] = 1.0;
                } else if (temperature < 0.7) {
                    // White stars
                    colors[i * 3] = 0.9 + Math.random() * 0.1;
                    colors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
                    colors[i * 3 + 2] = 0.9 + Math.random() * 0.1;
                } else {
                    // Orange/red stars
                    colors[i * 3] = 1.0;
                    colors[i * 3 + 1] = 0.6 + Math.random() * 0.4;
                    colors[i * 3 + 2] = 0.3 + Math.random() * 0.3;
                }
                
                sizes[i] = layer.size * (0.5 + Math.random() * 1.5);
            }
            
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
            
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    brightness: { value: layer.brightness },
                    audioIntensity: { value: 0 }
                },
                vertexShader: `
                    attribute float size;
                    attribute vec3 color;
                    uniform float time;
                    uniform float audioIntensity;
                    varying vec3 vColor;
                    varying float vTwinkle;
                    
                    void main() {
                        vColor = color;
                        
                        // Twinkle effect based on position and time
                        float twinkleFreq = sin(position.x * 0.01 + time * 2.0) * 
                                          sin(position.y * 0.01 + time * 1.5) * 
                                          sin(position.z * 0.01 + time * 1.8);
                        vTwinkle = 0.5 + 0.5 * twinkleFreq + audioIntensity * 0.3;
                        
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        gl_PointSize = size * (300.0 / -mvPosition.z) * vTwinkle;
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    uniform float brightness;
                    varying vec3 vColor;
                    varying float vTwinkle;
                    
                    void main() {
                        float r = distance(gl_PointCoord, vec2(0.5, 0.5));
                        if (r > 0.5) discard;
                        
                        float alpha = 1.0 - smoothstep(0.0, 0.5, r);
                        alpha *= vTwinkle * brightness;
                        
                        gl_FragColor = vec4(vColor, alpha);
                    }
                `,
                blending: THREE.AdditiveBlending,
                depthTest: false,
                transparent: true,
                vertexColors: true
            });
            
            const stars = new THREE.Points(geometry, material);
            stars.userData = { layer: layerIndex, material };
            this.stars.push(stars);
            this.group.add(stars);
        });
    }
    
    createNebula() {
        // Create volumetric nebula clouds
        const nebulaGeometry = new THREE.PlaneGeometry(400, 400, 32, 32);
        
        const nebulaMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                opacity: { value: 0.3 },
                color1: { value: new THREE.Color(0.2, 0.1, 0.8) }, // Deep blue
                color2: { value: new THREE.Color(0.8, 0.3, 0.9) }, // Purple
                color3: { value: new THREE.Color(0.9, 0.6, 0.2) }, // Orange
                audioIntensity: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                uniform float time;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    
                    // Gentle wave motion
                    vec3 pos = position;
                    pos.z += sin(pos.x * 0.01 + time * 0.5) * 5.0;
                    pos.z += cos(pos.y * 0.01 + time * 0.3) * 3.0;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float opacity;
                uniform float audioIntensity;
                uniform vec3 color1;
                uniform vec3 color2;
                uniform vec3 color3;
                varying vec2 vUv;
                varying vec3 vPosition;
                
                // Noise function
                float noise(vec2 p) {
                    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
                }
                
                float fbm(vec2 p) {
                    float value = 0.0;
                    float amplitude = 0.5;
                    for (int i = 0; i < 4; i++) {
                        value += amplitude * noise(p);
                        p *= 2.0;
                        amplitude *= 0.5;
                    }
                    return value;
                }
                
                void main() {
                    vec2 p = vUv * 3.0 + time * 0.1;
                    float n1 = fbm(p);
                    float n2 = fbm(p + vec2(1.7, 9.2));
                    float n3 = fbm(p + vec2(8.3, 2.8));
                    
                    float pattern = n1 * n2 * n3;
                    pattern = smoothstep(0.2, 0.8, pattern);
                    
                    // Color mixing based on noise
                    vec3 color = mix(color1, color2, n1);
                    color = mix(color, color3, n2 * 0.5);
                    
                    // Audio reactivity
                    pattern += audioIntensity * 0.3;
                    
                    float alpha = pattern * opacity;
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        // Create multiple nebula layers
        for (let i = 0; i < 3; i++) {
            const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial.clone());
            nebula.position.set(
                (Math.random() - 0.5) * 200,
                (Math.random() - 0.5) * 200,
                -100 - i * 50
            );
            nebula.rotation.z = Math.random() * Math.PI * 2;
            nebula.scale.setScalar(0.5 + Math.random() * 1.5);
            
            this.group.add(nebula);
            this.cosmicDust.push(nebula);
        }
    }
    
    createCosmicDust() {
        // Floating cosmic dust particles
        const dustCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(dustCount * 3);
        const velocities = new Float32Array(dustCount * 3);
        
        for (let i = 0; i < dustCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 400;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 400;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 400;
            
            velocities[i * 3] = (Math.random() - 0.5) * 0.1;
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                audioIntensity: { value: 0 }
            },
            vertexShader: `
                attribute vec3 velocity;
                uniform float time;
                uniform float audioIntensity;
                varying float vAlpha;
                
                void main() {
                    vec3 pos = position + velocity * time * 100.0;
                    
                    // Wrap around space
                    pos = mod(pos + 200.0, 400.0) - 200.0;
                    
                    vAlpha = 0.3 + audioIntensity * 0.7;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = 2.0 * (100.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying float vAlpha;
                
                void main() {
                    float r = distance(gl_PointCoord, vec2(0.5));
                    if (r > 0.5) discard;
                    
                    float alpha = (1.0 - r * 2.0) * vAlpha;
                    gl_FragColor = vec4(0.8, 0.9, 1.0, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthTest: false
        });
        
        const dust = new THREE.Points(geometry, material);
        this.cosmicDust.push(dust);
        this.group.add(dust);
    }
    
    createGalaxySpiral() {
        // Create a distant galaxy spiral
        const spiralGeometry = new THREE.BufferGeometry();
        const spiralCount = 3000;
        const positions = new Float32Array(spiralCount * 3);
        const colors = new Float32Array(spiralCount * 3);
        
        for (let i = 0; i < spiralCount; i++) {
            const t = i / spiralCount;
            const angle = t * Math.PI * 8; // 4 arms
            const radius = t * 80 + 20;
            
            // Create spiral arms
            const armOffset = Math.sin(angle * 2) * 5;
            const x = Math.cos(angle) * (radius + armOffset);
            const y = Math.sin(angle) * (radius + armOffset);
            const z = (Math.random() - 0.5) * 10;
            
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z - 200; // Far in the distance
            
            // Core is brighter and more yellow
            const distanceFromCore = radius / 100;
            const brightness = 1.0 - Math.min(distanceFromCore, 0.8);
            
            colors[i * 3] = 0.8 + brightness * 0.2; // Red
            colors[i * 3 + 1] = 0.6 + brightness * 0.4; // Green
            colors[i * 3 + 2] = 0.4 + brightness * 0.1; // Blue
        }
        
        spiralGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        spiralGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const spiralMaterial = new THREE.PointsMaterial({
            size: 0.5,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            vertexColors: true
        });
        
        this.galaxySpiral = new THREE.Points(spiralGeometry, spiralMaterial);
        this.galaxySpiral.rotation.x = Math.PI * 0.2;
        this.group.add(this.galaxySpiral);
    }
    
    createAmbientLighting() {
        // Subtle ambient light for cosmic atmosphere
        const ambientLight = new THREE.AmbientLight(0x112244, 0.1);
        this.group.add(ambientLight);
        
        // Distant starlight
        const starLight = new THREE.DirectionalLight(0x4466aa, 0.2);
        starLight.position.set(100, 100, 100);
        this.group.add(starLight);
    }
    
    activate() {
        this.isActive = true;
        this.time = 0;
        
        // Fade in effect
        this.stars.forEach(starLayer => {
            starLayer.material.uniforms.brightness.value = 0;
        });
        
        this.cosmicDust.forEach(dust => {
            if (dust.material.uniforms && dust.material.uniforms.opacity) {
                dust.material.uniforms.opacity.value = 0;
            }
        });
        
        if (this.galaxySpiral) {
            this.galaxySpiral.material.opacity = 0;
        }
    }
    
    deactivate() {
        this.isActive = false;
    }
    
    enter() {
        this.activate();
        console.log('✨ Entering Act 4 - Stars/Cosmic');
    }
    
    exit() {
        this.deactivate();
        console.log('🌌 Exiting Act 4 - Stars/Cosmic');
    }
    
    updateBackground(deltaTime) {
        // Minimal updates when not active
        if (!this.isActive) {
            this.time += deltaTime * 0.1; // Slow background time progression
        }
    }
    
    update(deltaTime) {
        if (!this.isActive) return;
        
        this.time += deltaTime;
        
        // Get audio data
        const audioData = this.audioAnalyzer.getAudioData();
        const bassIntensity = audioData.frequencyData[0] / 255;
        const midIntensity = audioData.frequencyData[Math.floor(audioData.frequencyData.length / 2)] / 255;
        const trebleIntensity = audioData.frequencyData[audioData.frequencyData.length - 1] / 255;
        const averageIntensity = (bassIntensity + midIntensity + trebleIntensity) / 3;
        
        // Update stars with twinkling
        this.stars.forEach((starLayer, index) => {
            if (starLayer.material.uniforms) {
                starLayer.material.uniforms.time.value = this.time;
                starLayer.material.uniforms.audioIntensity.value = averageIntensity;
                
                // Gradually fade in brightness
                const targetBrightness = [0.8, 1.0, 1.2, 1.5][index];
                starLayer.material.uniforms.brightness.value = THREE.MathUtils.lerp(
                    starLayer.material.uniforms.brightness.value,
                    targetBrightness,
                    deltaTime * 0.5
                );
            }
            
            // Slow rotation for depth
            starLayer.rotation.y += deltaTime * 0.01 * (index + 1);
            starLayer.rotation.x += deltaTime * 0.005 * (index + 1);
        });
        
        // Update nebula
        this.cosmicDust.forEach((dust, index) => {
            if (dust.material.uniforms) {
                dust.material.uniforms.time.value = this.time;
                dust.material.uniforms.audioIntensity.value = midIntensity;
                
                if (dust.material.uniforms.opacity) {
                    dust.material.uniforms.opacity.value = THREE.MathUtils.lerp(
                        dust.material.uniforms.opacity.value,
                        0.3,
                        deltaTime * 0.3
                    );
                }
            }
            
            // Gentle rotation
            dust.rotation.z += deltaTime * 0.02;
        });
        
        // Update galaxy spiral
        if (this.galaxySpiral) {
            this.galaxySpiral.rotation.z += deltaTime * 0.05;
            this.galaxySpiral.material.opacity = THREE.MathUtils.lerp(
                this.galaxySpiral.material.opacity,
                0.6,
                deltaTime * 0.2
            );
        }
        
        // Camera drift for meditative effect
        if (this.time > 5) { // Start drifting after 5 seconds
            const driftX = Math.sin(this.time * 0.1) * 2;
            const driftY = Math.cos(this.time * 0.15) * 1;
            const driftZ = Math.sin(this.time * 0.08) * 3;
            
            // Apply gentle camera movement (this will be handled by the main app)
            this.cameraOffset = {
                x: driftX,
                y: driftY,
                z: driftZ
            };
        }
    }
    
    dispose() {
        // Clean up geometries and materials
        this.stars.forEach(starLayer => {
            if (starLayer.geometry) starLayer.geometry.dispose();
            if (starLayer.material) starLayer.material.dispose();
            this.group.remove(starLayer);
        });
        
        this.cosmicDust.forEach(dust => {
            if (dust.geometry) dust.geometry.dispose();
            if (dust.material) dust.material.dispose();
            this.group.remove(dust);
        });
        
        if (this.galaxySpiral) {
            this.galaxySpiral.geometry.dispose();
            this.galaxySpiral.material.dispose();
            this.group.remove(this.galaxySpiral);
        }
        
        // Remove group from scene
        this.scene.remove(this.group);
        
        this.stars = [];
        this.cosmicDust = [];
        this.galaxySpiral = null;
    }
}
