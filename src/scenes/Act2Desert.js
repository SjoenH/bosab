import * as THREE from 'three'

export class Act2Desert {
  constructor(scene, camera, audioAnalyzer) {
    this.scene = scene
    this.camera = camera
    this.audioAnalyzer = audioAnalyzer
    
    this.group = new THREE.Group()
    this.terrain = null
    this.particles = null
    this.sandParticles = []
    
    this.isActive = false
    this.time = 0
    
    // Terrain properties
    this.terrainSize = 50
    this.terrainResolution = 64
    this.noiseScale = 0.1
    
    this.colors = {
      sand: new THREE.Color(0xd4a574),
      darkSand: new THREE.Color(0x8b5a2b),
      wind: new THREE.Color(0xf5e6d3),
      sky: new THREE.Color(0x87ceeb)
    }
  }

  init() {
    this.scene.add(this.group)
    this.createTerrain()
    this.createSandParticles()
    this.createWindEffects()
    
    console.log('🏜️ Act 2 - Desert initialized')
  }

  createTerrain() {
    // Create procedural terrain geometry
    const geometry = new THREE.PlaneGeometry(
      this.terrainSize, 
      this.terrainSize, 
      this.terrainResolution - 1, 
      this.terrainResolution - 1
    )
    
    // Create custom shader material for the sand
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        audioVolume: { value: 0 },
        audioLow: { value: 0 },
        heartbeat: { value: 0 },
        sandColor: { value: this.colors.sand },
        darkSandColor: { value: this.colors.darkSand }
      },
      vertexShader: `
        uniform float time;
        uniform float audioVolume;
        uniform float audioLow;
        uniform float heartbeat;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying float vElevation;
        
        // Simple noise function
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
          vPosition = position;
          vNormal = normal;
          
          vec3 pos = position;
          
          // Base terrain using noise
          float elevation = 0.0;
          elevation += noise(pos.xy * 0.1) * 2.0;
          elevation += noise(pos.xy * 0.2) * 1.0;
          elevation += noise(pos.xy * 0.4) * 0.5;
          
          // Heartbeat influence
          float heartbeatWave = sin(time * 3.14159 + length(pos.xy) * 0.1) * heartbeat;
          elevation += heartbeatWave * 2.0;
          
          // Audio reactivity
          float audioWave = sin(time * 6.28 + pos.x * 0.2) * audioLow * 3.0;
          elevation += audioWave;
          
          // Wind patterns
          float windWave = sin(time * 2.0 + pos.x * 0.15 + pos.y * 0.1) * 0.5;
          elevation += windWave;
          
          pos.z = elevation;
          vElevation = elevation;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 sandColor;
        uniform vec3 darkSandColor;
        uniform float time;
        uniform float audioVolume;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying float vElevation;
        
        void main() {
          // Color based on elevation and normal
          float elevationFactor = (vElevation + 2.0) / 4.0;
          vec3 color = mix(darkSandColor, sandColor, elevationFactor);
          
          // Add some variation based on position
          float variation = sin(vPosition.x * 0.3 + vPosition.y * 0.2 + time * 0.5) * 0.1;
          color += variation;
          
          // Audio-reactive brightness
          color += audioVolume * 0.2;
          
          // Simple lighting based on normal
          float light = dot(normalize(vNormal), normalize(vec3(1.0, 1.0, 1.0))) * 0.5 + 0.5;
          color *= light;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      wireframe: false,
      side: THREE.DoubleSide
    })
    
    this.terrain = new THREE.Mesh(geometry, material)
    this.terrain.rotation.x = -Math.PI / 2
    this.terrain.position.y = -5
    this.group.add(this.terrain)
  }

  createSandParticles() {
    // Create particle system for flying sand
    const particleCount = 1000
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      
      // Random positions
      positions[i3] = (Math.random() - 0.5) * 100
      positions[i3 + 1] = Math.random() * 20
      positions[i3 + 2] = (Math.random() - 0.5) * 100
      
      // Random velocities
      velocities[i3] = (Math.random() - 0.5) * 0.1
      velocities[i3 + 1] = Math.random() * 0.05
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.1
      
      sizes[i] = Math.random() * 0.1 + 0.05
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        audioVolume: { value: 0 },
        windForce: { value: 0 },
        color: { value: this.colors.wind }
      },
      vertexShader: `
        attribute vec3 velocity;
        attribute float size;
        uniform float time;
        uniform float audioVolume;
        uniform float windForce;
        
        varying float vOpacity;
        
        void main() {
          vec3 pos = position;
          
          // Wind movement
          pos += velocity * time * (1.0 + windForce);
          
          // Audio influence
          pos.y += sin(time * 5.0 + pos.x * 0.1) * audioVolume * 2.0;
          
          vOpacity = 0.3 + audioVolume * 0.4;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z) * (1.0 + audioVolume);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float vOpacity;
        
        void main() {
          float distance = length(gl_PointCoord - vec2(0.5));
          if (distance > 0.5) discard;
          
          float alpha = (0.5 - distance) * 2.0 * vOpacity;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    })
    
    this.particles = new THREE.Points(geometry, material)
    this.group.add(this.particles)
  }

  createWindEffects() {
    // Create subtle wind lines
    const lineCount = 20
    
    for (let i = 0; i < lineCount; i++) {
      const points = []
      const segmentCount = 50
      
      for (let j = 0; j < segmentCount; j++) {
        const x = (j / segmentCount) * 100 - 50
        const y = Math.random() * 10 + 5
        const z = (Math.random() - 0.5) * 100
        points.push(new THREE.Vector3(x, y, z))
      }
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      const material = new THREE.LineBasicMaterial({
        color: this.colors.wind,
        transparent: true,
        opacity: 0.1
      })
      
      const line = new THREE.Line(geometry, material)
      line.userData = {
        originalPoints: points,
        speed: Math.random() * 0.02 + 0.01,
        amplitude: Math.random() * 0.5 + 0.2
      }
      
      this.group.add(line)
    }
  }

  enter() {
    this.isActive = true
    this.group.visible = true
    
    // Smooth camera transition
    this.animateCameraToDesert()
  }

  exit() {
    this.isActive = false
    
    setTimeout(() => {
      this.group.visible = false
    }, 2000)
  }

  animateCameraToDesert() {
    const startPosition = this.camera.position.clone()
    const targetPosition = new THREE.Vector3(0, 8, 15)
    const startTime = performance.now()
    const duration = 3000
    
    const animate = () => {
      const elapsed = performance.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease in-out
      const easeProgress = 0.5 - 0.5 * Math.cos(progress * Math.PI)
      
      this.camera.position.lerpVectors(startPosition, targetPosition, easeProgress)
      this.camera.lookAt(0, 0, 0)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    animate()
  }

  update(time) {
    if (!this.isActive) return
    
    this.time = time * 0.001
    
    // Update terrain with heartbeat
    this.updateTerrain()
    
    // Update sand particles
    this.updateParticles()
    
    // Update camera movement
    this.updateCamera()
  }

  updateTerrain() {
    if (!this.terrain) return
    
    const audioVolume = this.audioAnalyzer.getVolume()
    const audioLow = this.audioAnalyzer.getLowFreq()
    const beat = this.audioAnalyzer.getBeat()
    
    // Simulate heartbeat pattern
    const heartbeatPattern = Math.sin(this.time * 1.2) * 0.5 + 0.5
    const heartbeat = beat ? 1.0 : heartbeatPattern * 0.3
    
    // Update shader uniforms
    this.terrain.material.uniforms.time.value = this.time
    this.terrain.material.uniforms.audioVolume.value = audioVolume
    this.terrain.material.uniforms.audioLow.value = audioLow
    this.terrain.material.uniforms.heartbeat.value = heartbeat
  }

  updateParticles() {
    if (!this.particles) return
    
    const audioVolume = this.audioAnalyzer.getVolume()
    const audioMid = this.audioAnalyzer.getMidFreq()
    
    // Wind effect based on audio
    const windForce = audioMid * 2.0
    
    this.particles.material.uniforms.time.value = this.time
    this.particles.material.uniforms.audioVolume.value = audioVolume
    this.particles.material.uniforms.windForce.value = windForce
    
    // Update particle positions
    const positions = this.particles.geometry.attributes.position.array
    const velocities = this.particles.geometry.attributes.velocity.array
    
    for (let i = 0; i < positions.length; i += 3) {
      // Apply wind movement
      positions[i] += velocities[i] * (1 + windForce)
      positions[i + 1] += velocities[i + 1] * (1 + audioVolume)
      positions[i + 2] += velocities[i + 2] * (1 + windForce)
      
      // Reset particles that go too far
      if (positions[i] > 50) positions[i] = -50
      if (positions[i] < -50) positions[i] = 50
      if (positions[i + 2] > 50) positions[i + 2] = -50
      if (positions[i + 2] < -50) positions[i + 2] = 50
      if (positions[i + 1] > 30) positions[i + 1] = 0
    }
    
    this.particles.geometry.attributes.position.needsUpdate = true
  }

  updateCamera() {
    // Gentle breathing-like camera movement
    const audioVolume = this.audioAnalyzer.getVolume()
    const breathingPattern = Math.sin(this.time * 0.5) * 0.3
    
    this.camera.position.y = 8 + breathingPattern + audioVolume * 2
    this.camera.position.z = 15 + Math.sin(this.time * 0.3) * 1
    
    // Look slightly into the distance
    const lookTarget = new THREE.Vector3(
      Math.sin(this.time * 0.2) * 2,
      -2 + audioVolume * 1,
      -5
    )
    this.camera.lookAt(lookTarget)
  }

  updateBackground(time) {
    if (this.isActive) return
    this.time = time * 0.001
  }

  dispose() {
    if (this.terrain) {
      this.terrain.geometry.dispose()
      this.terrain.material.dispose()
    }
    
    if (this.particles) {
      this.particles.geometry.dispose()
      this.particles.material.dispose()
    }
    
    this.scene.remove(this.group)
  }
}
