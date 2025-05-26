import * as THREE from 'three'

export class Act3Human {
    constructor(scene, camera, audioAnalyzer) {
        this.scene = scene
        this.camera = camera
        this.audioAnalyzer = audioAnalyzer

        this.group = new THREE.Group()
        this.ribbons = []
        this.organicParticles = []
        this.heartPulse = null
        this.connectionLines = []

        this.isActive = false
        this.time = 0

        this.colors = {
            flesh: new THREE.Color(0xffdbac),
            blood: new THREE.Color(0xff6b6b),
            soul: new THREE.Color(0xff6b9d),
            connection: new THREE.Color(0xffa8e4),
            warm: new THREE.Color(0xffd93d)
        }
    }

    init() {
        this.scene.add(this.group)
        this.createOrganicRibbons()
        this.createHeartPulse()
        this.createConnectionNetwork()
        this.createBreathingParticles()

        console.log('🫀 Act 3 - Human initialized')
    }

    createOrganicRibbons() {
        // Create flowing ribbon-like forms representing human connection
        const ribbonCount = 8

        for (let i = 0; i < ribbonCount; i++) {
            const points = []
            const segments = 100
            const radius = 5 + i * 0.5

            for (let j = 0; j <= segments; j++) {
                const t = j / segments
                const angle = t * Math.PI * 4 + i * Math.PI / 4

                const x = Math.sin(angle) * radius * (1 - t * 0.3)
                const y = Math.cos(angle * 0.7) * 3 * (1 - t * 0.5)
                const z = Math.sin(t * Math.PI * 2) * 2 + (t - 0.5) * 8

                points.push(new THREE.Vector3(x, y, z))
            }

            // Create tube geometry from the curve
            const curve = new THREE.CatmullRomCurve3(points)
            const geometry = new THREE.TubeGeometry(curve, segments, 0.1, 8, false)

            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    audioVolume: { value: 0 },
                    audioMid: { value: 0 },
                    color1: { value: this.colors.flesh },
                    color2: { value: this.colors.soul },
                    pulse: { value: 0 }
                },
                vertexShader: `
          uniform float time;
          uniform float audioVolume;
          uniform float pulse;
          
          varying vec2 vUv;
          varying vec3 vPosition;
          varying float vPulse;
          
          void main() {
            vUv = uv;
            vPosition = position;
            
            vec3 pos = position;
            
            // Breathing/pulsing effect
            float breathe = sin(time * 2.0 + pos.z * 0.1) * 0.1;
            pos += normal * breathe * (1.0 + audioVolume * 2.0);
            
            // Heartbeat pulse
            pos += normal * pulse * 0.5;
            
            vPulse = pulse;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
                fragmentShader: `
          uniform vec3 color1;
          uniform vec3 color2;
          uniform float time;
          uniform float audioMid;
          
          varying vec2 vUv;
          varying vec3 vPosition;
          varying float vPulse;
          
          void main() {
            // Gradient along the ribbon
            float gradient = sin(vUv.x * 3.14159 + time) * 0.5 + 0.5;
            vec3 color = mix(color1, color2, gradient);
            
            // Audio reactivity
            color += audioMid * 0.3;
            
            // Pulse effect
            color += vPulse * 0.4;
            
            // Soft edges
            float edgeFade = 1.0 - abs(vUv.y - 0.5) * 2.0;
            
            gl_FragColor = vec4(color, edgeFade * 0.8);
          }
        `,
                transparent: true,
                side: THREE.DoubleSide
            })

            const ribbon = new THREE.Mesh(geometry, material)
            ribbon.userData = {
                originalPoints: points,
                rotationSpeed: (Math.random() - 0.5) * 0.02,
                pulsePhase: i * Math.PI / 4
            }

            this.group.add(ribbon)
            this.ribbons.push(ribbon)
        }
    }

    createHeartPulse() {
        // Create a central pulsing heart-like geometry
        const geometry = new THREE.SphereGeometry(1.5, 32, 32)

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                audioLow: { value: 0 },
                heartbeat: { value: 0 },
                color: { value: this.colors.blood }
            },
            vertexShader: `
        uniform float time;
        uniform float audioLow;
        uniform float heartbeat;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          vPosition = position;
          vNormal = normal;
          
          vec3 pos = position;
          
          // Heart shape distortion
          float heartShape = 1.0 + sin(pos.y * 2.0) * 0.2;
          pos *= heartShape;
          
          // Pulsing based on heartbeat
          float pulse = 1.0 + heartbeat * 0.3 + audioLow * 0.5;
          pos *= pulse;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
            fragmentShader: `
        uniform vec3 color;
        uniform float time;
        uniform float heartbeat;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          vec3 finalColor = color;
          
          // Pulsing brightness
          float brightness = 0.7 + heartbeat * 0.5 + sin(time * 5.0) * 0.2;
          finalColor *= brightness;
          
          // Fresnel effect
          float fresnel = 1.0 - dot(normalize(vNormal), vec3(0.0, 0.0, 1.0));
          finalColor += fresnel * 0.3;
          
          gl_FragColor = vec4(finalColor, 0.9);
        }
      `,
            transparent: true
        })

        this.heartPulse = new THREE.Mesh(geometry, material)
        this.heartPulse.position.y = 0
        this.group.add(this.heartPulse)
    }

    createConnectionNetwork() {
        // Create lines representing human connections
        const connectionCount = 20

        for (let i = 0; i < connectionCount; i++) {
            const start = new THREE.Vector3(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 20
            )

            const end = new THREE.Vector3(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 20
            )

            const points = []
            const segments = 20

            for (let j = 0; j <= segments; j++) {
                const t = j / segments
                const point = start.clone().lerp(end, t)

                // Add some curve to make it more organic
                point.y += Math.sin(t * Math.PI) * 2
                point.x += Math.sin(t * Math.PI * 2) * 1

                points.push(point)
            }

            const geometry = new THREE.BufferGeometry().setFromPoints(points)
            const material = new THREE.LineBasicMaterial({
                color: this.colors.connection,
                transparent: true,
                opacity: 0.3
            })

            const line = new THREE.Line(geometry, material)
            line.userData = {
                originalPoints: points,
                pulseSpeed: Math.random() * 0.1 + 0.05,
                intensity: Math.random()
            }

            this.group.add(line)
            this.connectionLines.push(line)
        }
    }

    createBreathingParticles() {
        // Create particles that move like breath or life force
        const particleCount = 500
        const geometry = new THREE.BufferGeometry()
        const positions = new Float32Array(particleCount * 3)
        const colors = new Float32Array(particleCount * 3)
        const sizes = new Float32Array(particleCount)

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3

            // Spherical distribution
            const radius = Math.random() * 15 + 5
            const theta = Math.random() * Math.PI * 2
            const phi = Math.random() * Math.PI

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
            positions[i3 + 2] = radius * Math.cos(phi)

            // Warm colors
            const colorChoice = Math.random()
            const color = colorChoice < 0.5 ? this.colors.warm : this.colors.soul
            colors[i3] = color.r
            colors[i3 + 1] = color.g
            colors[i3 + 2] = color.b

            sizes[i] = Math.random() * 0.2 + 0.1
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                audioVolume: { value: 0 }
            },
            vertexShader: `
        attribute float size;
        uniform float time;
        uniform float audioVolume;
        
        varying vec3 vColor;
        varying float vOpacity;
        
        void main() {
          vColor = color;
          
          vec3 pos = position;
          
          // Breathing motion
          float breath = sin(time * 1.5 + length(pos) * 0.1) * 2.0;
          pos = normalize(pos) * (length(pos) + breath);
          
          // Audio influence
          pos += normalize(pos) * audioVolume * 3.0;
          
          vOpacity = 0.5 + audioVolume * 0.5;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z) * (1.0 + audioVolume);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
            fragmentShader: `
        varying vec3 vColor;
        varying float vOpacity;
        
        void main() {
          float distance = length(gl_PointCoord - vec2(0.5));
          if (distance > 0.5) discard;
          
          float alpha = (0.5 - distance) * 2.0 * vOpacity;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
            transparent: true,
            vertexColors: true,
            blending: THREE.AdditiveBlending
        })

        const particles = new THREE.Points(geometry, material)
        this.group.add(particles)
        this.organicParticles.push(particles)
    }

    enter() {
        this.isActive = true
        this.group.visible = true

        // Gentle entrance animation
        this.group.scale.set(0.3, 0.3, 0.3)
        this.animateEntrance()
    }

    exit() {
        this.isActive = false

        setTimeout(() => {
            this.group.visible = false
        }, 2000)
    }

    animateEntrance() {
        const startTime = performance.now()
        const duration = 3000

        const animate = () => {
            const elapsed = performance.now() - startTime
            const progress = Math.min(elapsed / duration, 1)

            // Gentle breathing-in effect
            const scale = 0.3 + (1 - 0.3) * (1 - Math.pow(1 - progress, 3))
            this.group.scale.set(scale, scale, scale)

            if (progress < 1) {
                requestAnimationFrame(animate)
            }
        }

        animate()
    }

    update(time) {
        if (!this.isActive) return

        this.time = time * 0.001

        this.updateRibbons()
        this.updateHeartPulse()
        this.updateConnections()
        this.updateBreathingParticles()
        this.updateCamera()
    }

    updateRibbons() {
        const audioVolume = this.audioAnalyzer.getVolume()
        const audioMid = this.audioAnalyzer.getMidFreq()
        const beat = this.audioAnalyzer.getBeat()

        this.ribbons.forEach((ribbon, index) => {
            const userData = ribbon.userData

            // Rotation
            ribbon.rotation.y += userData.rotationSpeed
            ribbon.rotation.z = Math.sin(this.time + userData.pulsePhase) * 0.2

            // Update shader uniforms
            ribbon.material.uniforms.time.value = this.time
            ribbon.material.uniforms.audioVolume.value = audioVolume
            ribbon.material.uniforms.audioMid.value = audioMid
            ribbon.material.uniforms.pulse.value = beat ? 1.0 : 0.0
        })
    }

    updateHeartPulse() {
        if (!this.heartPulse) return

        const audioLow = this.audioAnalyzer.getLowFreq()
        const beat = this.audioAnalyzer.getBeat()

        // Heartbeat simulation
        const heartbeat = beat ? 1.0 : Math.sin(this.time * 1.2) * 0.3 + 0.3

        this.heartPulse.material.uniforms.time.value = this.time
        this.heartPulse.material.uniforms.audioLow.value = audioLow
        this.heartPulse.material.uniforms.heartbeat.value = heartbeat

        // Subtle rotation
        this.heartPulse.rotation.y = this.time * 0.2
    }

    updateConnections() {
        const audioVolume = this.audioAnalyzer.getVolume()

        this.connectionLines.forEach((line, index) => {
            const userData = line.userData

            // Pulsing opacity
            const pulse = Math.sin(this.time * userData.pulseSpeed + index) * 0.3 + 0.5
            line.material.opacity = pulse * userData.intensity * (0.3 + audioVolume * 0.4)
        })
    }

    updateBreathingParticles() {
        const audioVolume = this.audioAnalyzer.getVolume()

        this.organicParticles.forEach(particles => {
            particles.material.uniforms.time.value = this.time
            particles.material.uniforms.audioVolume.value = audioVolume

            // Gentle rotation
            particles.rotation.y = this.time * 0.1
        })
    }

    updateCamera() {
        // Gentle breathing camera movement
        const audioVolume = this.audioAnalyzer.getVolume()
        const breathPattern = Math.sin(this.time * 0.8) * 1.5

        this.camera.position.y = breathPattern + audioVolume * 2
        this.camera.position.z = 10 + Math.sin(this.time * 0.3) * 2
        this.camera.lookAt(0, 0, 0)
    }

    updateBackground(time) {
        if (this.isActive) return
        this.time = time * 0.001
    }

    dispose() {
        this.ribbons.forEach(ribbon => {
            ribbon.geometry.dispose()
            ribbon.material.dispose()
        })

        if (this.heartPulse) {
            this.heartPulse.geometry.dispose()
            this.heartPulse.material.dispose()
        }

        this.connectionLines.forEach(line => {
            line.geometry.dispose()
            line.material.dispose()
        })

        this.organicParticles.forEach(particles => {
            particles.geometry.dispose()
            particles.material.dispose()
        })

        this.scene.remove(this.group)
    }
}
