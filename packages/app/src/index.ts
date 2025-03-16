import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import songsData from './data/celestial-songs.json';

// Type definitions
interface CelestialBody {
  type: string;
  color: string;
  size: number;
  [key: string]: any; // For additional properties based on type
}

interface Song {
  title: string;
  celestialBody: CelestialBody;
}

// Custom shader for dreamy effect
const DreamyShader = {
  uniforms: {
    "tDiffuse": { value: null },
    "time": { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    varying vec2 vUv;
    
    void main() {
      vec2 p = vUv;
      vec2 distortion = 0.02 * vec2(
        sin(time * 0.1 + p.y * 5.0),
        cos(time * 0.1 + p.x * 5.0)
      );
      vec4 color = texture2D(tDiffuse, p + distortion);
      
      // Add dreamy color shifts
      color.r = texture2D(tDiffuse, p + distortion * 1.1).r;
      color.g = texture2D(tDiffuse, p + distortion * 0.9).g;
      color.b = texture2D(tDiffuse, p + distortion * 0.7).b;
      
      gl_FragColor = color;
    }
  `
};

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080028); // Deep indigo background

// Camera setup
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 30;

// 添加时钟用于动画
const clock = new THREE.Clock();

// Renderer setup
const renderer = new THREE.WebGLRenderer({ 
  antialias: true,
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.getElementById('canvas-container')?.appendChild(renderer.domElement);

// Post-processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Bloom effect
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,    // strength
  0.4,    // radius
  0.85    // threshold
);
composer.addPass(bloomPass);

// Dreamy effect shader
const dreamyPass = new ShaderPass(DreamyShader);
composer.addPass(dreamyPass);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 150; // 增加最大距离，可以查看更广阔的宇宙
controls.autoRotate = false; // 关闭自动旋转，让用户完全控制
controls.enablePan = true; // 允许平移
controls.panSpeed = 0.8; // 平移速度
controls.rotateSpeed = 0.8; // 旋转速度
controls.zoomSpeed = 1.2; // 缩放速度
controls.maxPolarAngle = Math.PI; // 允许完全旋转到底部

// Lights
const ambientLight = new THREE.AmbientLight(0x8a2be2, 0.4); // Purple ambient light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xf8bff8, 0.8); // Soft pink light
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Point lights with different dreamy colors
const colors = [0xff79c6, 0x8be9fd, 0x50fa7b, 0xbd93f9];
colors.forEach((color, index) => {
  const pointLight = new THREE.PointLight(color, 1, 100);
  const angle = (index / colors.length) * Math.PI * 2;
  pointLight.position.set(
    30 * Math.cos(angle),
    15 * Math.sin(angle),
    30 * Math.sin(angle)
  );
  scene.add(pointLight);
});

// Fog for dreamy atmosphere
scene.fog = new THREE.FogExp2(0x080028, 0.005);

// Stars background
function createStarField() {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const sizes = [];
  const colors = [];
  
  // Reduce the number of stars from 20000 to 5000
  for (let i = 0; i < 5000; i++) {
    const x = THREE.MathUtils.randFloatSpread(2000);
    const y = THREE.MathUtils.randFloatSpread(2000);
    const z = THREE.MathUtils.randFloatSpread(2000);
    vertices.push(x, y, z);
    
    // Make stars smaller to reduce visual clutter
    sizes.push(THREE.MathUtils.randFloat(0.3, 1.5));
    
    // More subtle colors
    const color = new THREE.Color();
    color.setHSL(Math.random(), 0.3, 0.7);
    colors.push(color.r, color.g, color.b);
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  
  const material = new THREE.PointsMaterial({
    size: 2,
    sizeAttenuation: true,
    alphaTest: 0.5,
    transparent: true,
    vertexColors: true,
    opacity: 0.7 // Reduce opacity to make them less distracting
  });
  
  const stars = new THREE.Points(geometry, material);
  scene.add(stars);
  
  // Reduce nebula particles
  // Create a subtle nebula effect with fewer particles
  const nebulaGeometry = new THREE.BufferGeometry();
  const nebulaVertices = [];
  const nebulaSizes = [];
  const nebulaColors = [];
  
  // Reduce particles from 1000 to 300
  for (let i = 0; i < 300; i++) {
    const x = THREE.MathUtils.randFloatSpread(1500);
    const y = THREE.MathUtils.randFloatSpread(1500);
    const z = THREE.MathUtils.randFloatSpread(1500);
    nebulaVertices.push(x, y, z);
    
    // Larger particles for nebula effect
    nebulaSizes.push(THREE.MathUtils.randFloat(5, 15));
    
    // Soft pastel colors for nebula
    const color = new THREE.Color();
    color.setHSL(Math.random() * 0.1 + 0.7, 0.5, 0.6); // Mostly in the purple/blue range
    nebulaColors.push(color.r, color.g, color.b);
  }
  
  nebulaGeometry.setAttribute('position', new THREE.Float32BufferAttribute(nebulaVertices, 3));
  nebulaGeometry.setAttribute('size', new THREE.Float32BufferAttribute(nebulaSizes, 1));
  nebulaGeometry.setAttribute('color', new THREE.Float32BufferAttribute(nebulaColors, 3));
  
  const nebulaTexture = new THREE.TextureLoader().load('');
  const nebulaMaterial = new THREE.PointsMaterial({
    size: 30,
    sizeAttenuation: true,
    map: nebulaTexture,
    alphaTest: 0.01,
    transparent: true,
    vertexColors: true,
    opacity: 0.2 // Reduce opacity significantly
  });
  
  const nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
  scene.add(nebula);
  
  return { stars, nebula };
}

// Create dreamy nebula clouds
function createDreamyNebulaClouds() {
  const particleCount = 1000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  
  const colorPalette = [
    new THREE.Color(0xff79c6), // Pink
    new THREE.Color(0x8be9fd), // Cyan
    new THREE.Color(0x50fa7b), // Green
    new THREE.Color(0xbd93f9), // Purple
  ];
  
  for (let i = 0; i < particleCount; i++) {
    // Distribute particles in cloud-like formations
    const angle = Math.random() * Math.PI * 2;
    const radius = 20 + Math.random() * 30; 
    
    // Create swirling formations
    const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 15;
    const y = (Math.random() - 0.5) * 20;
    const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 15;
    
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    
    // Assign colors from palette
    const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
    
    // Varied sizes
    sizes[i] = THREE.MathUtils.randFloat(2, 8);
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  
  // Custom shader for nebula particles
  const particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 }
    },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      uniform float time;
      
      void main() {
        vColor = color;
        
        // Gentle wave movement
        vec3 pos = position;
        pos.x += sin(time * 0.2 + position.z * 0.05) * 1.5;
        pos.y += cos(time * 0.2 + position.x * 0.05) * 1.5;
        pos.z += sin(time * 0.2 + position.y * 0.05) * 1.5;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      
      void main() {
        // Calculate distance from center of point
        float r = 0.5 * length(gl_PointCoord - vec2(0.5, 0.5));
        
        // Soft, glowy circles
        float intensity = 1.0 - smoothstep(0.2, 0.5, r);
        gl_FragColor = vec4(vColor, intensity * 0.7);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  
  const nebulaClouds = new THREE.Points(geometry, particleMaterial);
  nebulaClouds.userData = { time: 0 };
  scene.add(nebulaClouds);
  
  // Add to list for animation
  specialEffects.push(nebulaClouds);
}

// Array for special effect objects that need animation
const specialEffects: THREE.Object3D[] = [];

// 更新星云效果动画
function updateNebula() {
  for (const effect of specialEffects) {
    if (effect instanceof THREE.Points && effect.material instanceof THREE.ShaderMaterial) {
      if (effect.material.uniforms && effect.material.uniforms.time) {
        effect.material.uniforms.time.value = clock.getElapsedTime();
      }
      
      // 增加一些轻微的旋转效果，使星云看起来更有动感
      effect.rotation.y += 0.0003;
      effect.rotation.x += 0.0001;
    }
  }
}

// Helper function for random position
function getRandomPosition(minRadius: number, maxRadius: number): THREE.Vector3 {
  const radius = THREE.MathUtils.randFloat(minRadius, maxRadius);
  const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
  const phi = THREE.MathUtils.randFloat(0, Math.PI);
  
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);
  
  return new THREE.Vector3(x, y, z);
}

// Create celestial bodies
const celestialBodies: THREE.Object3D[] = [];
const bodyData: {object: THREE.Object3D, song: Song}[] = [];

// Create a planet
function createPlanet(body: CelestialBody): THREE.Group {
  const group = new THREE.Group();
  
  // Core of the planet
  const geometry = new THREE.SphereGeometry(body.size, 32, 32);
  
  // Ethereal material with custom shading
  const material = new THREE.MeshPhongMaterial({
    color: new THREE.Color(body.color),
    shininess: 50,
    specular: new THREE.Color(0xffffff),
    emissive: new THREE.Color(body.color).multiplyScalar(0.3),
    transparent: true,
    opacity: 0.9,
  });
  
  const planet = new THREE.Mesh(geometry, material);
  group.add(planet);
  
  // Add glow effect
  const glowSize = body.size * 1.2;
  const glowGeometry = new THREE.SphereGeometry(glowSize, 32, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(body.color),
    transparent: true,
    opacity: 0.3,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending
  });
  
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  group.add(glow);
  
  // Add rings if the planet has them
  if (body.hasRings) {
    const ringGeometry = new THREE.RingGeometry(body.size * 1.5, body.size * 3, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(body.ringColor || 0xffffff),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    
    // Add particle effects to the rings
    const particleCount = 200;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = THREE.MathUtils.randFloat(body.size * 1.5, body.size * 3);
      
      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 0.2; // slight thickness
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(body.ringColor || 0xffffff),
      size: THREE.MathUtils.randFloat(0.1, 0.3),
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    
    const ringParticles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(ringParticles);
  }
  
  // Make the planet rotate
  group.userData = { 
    rotationSpeed: THREE.MathUtils.randFloat(0.01, 0.05),
    rotationAxis: new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(1),
      THREE.MathUtils.randFloatSpread(1),
      THREE.MathUtils.randFloatSpread(1)
    ).normalize() 
  };
  
  return group;
}

// Create a star
function createStar(body: CelestialBody): THREE.Group {
  const group = new THREE.Group();
  
  // Core
  const coreGeometry = new THREE.SphereGeometry(body.size, 32, 32);
  const coreMaterial = new THREE.MeshPhongMaterial({
    color: new THREE.Color(body.color),
    emissive: new THREE.Color(body.color),
    emissiveIntensity: 1.0,
    transparent: true,
    opacity: 0.95
  });
  
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  group.add(core);
  
  // Multiple glow layers
  for (let i = 0; i < 3; i++) {
    const glowSize = body.size * (1.3 + i * 0.3);
    const glowGeometry = new THREE.SphereGeometry(glowSize, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(body.color),
      transparent: true,
      opacity: 0.2 - i * 0.05,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);
  }
  
  // Add light rays (spikes)
  const rayCount = 8;
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2;
    const length = body.size * THREE.MathUtils.randFloat(3, 6);
    
    const rayGeometry = new THREE.PlaneGeometry(length, length * 0.15);
    
    // Custom shader for rays
    const rayMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(body.color) },
        time: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        varying vec2 vUv;
        
        void main() {
          float intensity = smoothstep(0.0, 0.5, 1.0 - abs(vUv.x - 0.5) * 2.0);
          intensity *= sin(time + vUv.x * 10.0) * 0.25 + 0.75;
          gl_FragColor = vec4(color, intensity * 0.7);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    
    const ray = new THREE.Mesh(rayGeometry, rayMaterial);
    ray.position.set(Math.cos(angle) * body.size, Math.sin(angle) * body.size, 0);
    ray.rotation.z = angle;
    
    // Add to animation system
    ray.userData = { time: Math.random() * 10 };
    specialEffects.push(ray);
    
    group.add(ray);
  }
  
  // Create particle system for the corona
  const particleCount = 300;
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleSizes = new Float32Array(particleCount);
  
  for (let i = 0; i < particleCount; i++) {
    const radius = body.size * THREE.MathUtils.randFloat(1.2, 3);
    const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
    const phi = THREE.MathUtils.randFloat(0, Math.PI);
    
    particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    particlePositions[i * 3 + 2] = radius * Math.cos(phi);
    
    particleSizes[i] = THREE.MathUtils.randFloat(0.2, 1.0);
  }
  
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
  
  const particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(body.color) },
      time: { value: 0 }
    },
    vertexShader: `
      attribute float size;
      uniform float time;
      
      void main() {
        vec3 pos = position;
        // Gentle pulsing movement
        float dist = length(pos);
        pos = normalize(pos) * (dist + sin(time * 0.5 + dist * 2.0) * 0.2);
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (30.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      
      void main() {
        float r = 0.5 * length(gl_PointCoord - vec2(0.5, 0.5));
        float intensity = 1.0 - smoothstep(0.2, 0.5, r);
        gl_FragColor = vec4(color, intensity * 0.6);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  
  const coronaParticles = new THREE.Points(particleGeometry, particleMaterial);
  coronaParticles.userData = { time: 0 };
  group.add(coronaParticles);
  specialEffects.push(coronaParticles);
  
  // Rotation animation
  group.userData = { 
    rotationSpeed: THREE.MathUtils.randFloat(0.005, 0.02),
    pulseSpeed: THREE.MathUtils.randFloat(0.5, 1.5)
  };
  
  return group;
}

// Create a black hole
function createBlackHole(body: CelestialBody): THREE.Group {
  const group = new THREE.Group();
  
  // Event horizon
  const horizonGeometry = new THREE.SphereGeometry(body.size, 32, 32);
  const horizonMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.9
  });
  
  const horizon = new THREE.Mesh(horizonGeometry, horizonMaterial);
  group.add(horizon);
  
  // Ethereal glow around event horizon
  const glowGeometry = new THREE.SphereGeometry(body.size * 1.2, 32, 32);
  const glowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(body.color || 0x8a2be2) },
      time: { value: 0 }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float time;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float time;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        // Edge glow effect
        float intensity = 1.0 - dot(vNormal, vec3(0, 0, 1));
        intensity = pow(intensity, 2.0) * 1.5;
        
        // Pulsing effect
        intensity *= 0.8 + 0.2 * sin(time * 2.0);
        
        vec3 glow = color * intensity;
        gl_FragColor = vec4(glow, intensity * 0.7);
      }
    `,
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending
  });
  
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  group.add(glow);
  specialEffects.push(glow);
  
  // Accretion disk
  const diskGeometry = new THREE.RingGeometry(body.size * 1.5, body.size * 4, 64);
  
  // Shader for the swirling accretion disk
  const diskMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(body.accretionDiskColor || 0xff79c6) },
      time: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying float vRadius;
      
      void main() {
        vUv = uv;
        vec3 pos = position;
        vRadius = length(pos.xy);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float time;
      varying vec2 vUv;
      varying float vRadius;
      
      void main() {
        float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
        float swirl = sin(angle * 6.0 + time * 2.0 + vRadius * 10.0);
        
        // Create swirling bands
        float band = smoothstep(0.3, 0.5, swirl);
        
        // Fade at edges
        float edge = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
        
        // Create color variation
        vec3 diskColor = mix(color, vec3(1.0, 0.9, 0.8), band * 0.5);
        
        float alpha = band * edge * (1.0 - abs(vUv.y - 0.5) * 2.0);
        gl_FragColor = vec4(diskColor, alpha * 0.8);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  
  const disk = new THREE.Mesh(diskGeometry, diskMaterial);
  disk.rotation.x = Math.PI / 2;
  disk.userData = { time: 0 };
  group.add(disk);
  specialEffects.push(disk);
  
  // Add gravitational lens effect particles
  const particleCount = 500;
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleSizes = new Float32Array(particleCount);
  
  for (let i = 0; i < particleCount; i++) {
    const radius = body.size * THREE.MathUtils.randFloat(2, 8);
    const angle = Math.random() * Math.PI * 2;
    const height = THREE.MathUtils.randFloatSpread(body.size * 2);
    
    particlePositions[i * 3] = Math.cos(angle) * radius;
    particlePositions[i * 3 + 1] = height;
    particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
    
    particleSizes[i] = THREE.MathUtils.randFloat(0.05, 0.2);
  }
  
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
  
  const particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(0xffffff) },
      time: { value: 0 }
    },
    vertexShader: `
      attribute float size;
      uniform float time;
      
      void main() {
        vec3 pos = position;
        
        // Calculate distance from center
        float dist = length(pos.xz);
        
        // Spiraling effect towards the center
        float angle = atan(pos.z, pos.x) + time * (1.0 - dist / 20.0) * 2.0;
        float newDist = max(dist - 0.1 * time, 0.1);
        
        pos.x = cos(angle) * newDist;
        pos.z = sin(angle) * newDist;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (50.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      
      void main() {
        float r = length(gl_PointCoord - vec2(0.5, 0.5));
        if (r > 0.5) discard;
        float intensity = 1.0 - r * 2.0;
        gl_FragColor = vec4(color, intensity * 0.7);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  
  const lensParticles = new THREE.Points(particleGeometry, particleMaterial);
  lensParticles.userData = { time: 0 };
  group.add(lensParticles);
  specialEffects.push(lensParticles);
  
  return group;
}

// 重新实现文本标签类，使用更精确的文本大小控制
class TextSprite {
  sprite: THREE.Sprite;

  constructor(text: string, color: string = '#ffffff') {
    // 创建画布和上下文
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    
    // 根据文本长度自适应宽度
    const textWidth = Math.max(64, text.length * 7);
    canvas.width = textWidth;
    canvas.height = 20;
    
    // 完全清除画布
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // 创建一个只有一次渲染的文本
    context.font = '16px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // 使用矩形背景提升可读性
    context.fillStyle = 'rgba(0, 0, 0, 0.6)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // 只渲染一次文字，使用明亮的颜色确保可见性
    context.fillStyle = color;
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // 创建纹理，确保使用正确的过滤器设置
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    
    // 创建材质，禁用深度写入以避免z-fighting
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: true
    });
    
    // 创建精灵
    this.sprite = new THREE.Sprite(material);
    this.sprite.scale.set(1, 0.2, 1);
    
    // 确保精灵的renderOrder较高，这样会在其他对象之上渲染
    this.sprite.renderOrder = 999;
  }
  
  positionNextTo(object: THREE.Object3D, offsetY: number = 0.7) {
    const position = object.position.clone();
    position.y += offsetY;
    this.sprite.position.copy(position);
  }
}

// Create celestial bodies from songs data
function createCelestialBodiesFromSongs() {
  try {
    const songs = (songsData as any).songs as Song[];
    
    console.log('Songs data loaded:', songs.length, 'songs found');
    
    // 按类型组织天体，避免拥挤
    const regions = {
      planet: new THREE.Vector3(-1, 0, 0),
      star: new THREE.Vector3(1, 0, 0),
      blackHole: new THREE.Vector3(0, 0, 1),
      moon: new THREE.Vector3(0, 0, -1),
      comet: new THREE.Vector3(-1, 0, 1),
      neutronStar: new THREE.Vector3(1, 0, 1),
      nebula: new THREE.Vector3(-1, 0, -1),
      galaxy: new THREE.Vector3(1, 0, -1)
    };
    
    const regionRadius = 50; // 减小空间进一步压缩天体分布
    
    // 只显示少量天体，以减轻视觉负担
    const maxBodies = 30; // 限制为30个天体
    
    songs.forEach((song, index) => {
      // 只处理前30个歌曲
      if (index >= maxBodies) return;
      
      let celestialObject: THREE.Object3D | null = null;
      
      // 创建不同类型的天体
      switch (song.celestialBody.type) {
        case 'planet':
          celestialObject = createPlanet(song.celestialBody);
          break;
        case 'star':
          celestialObject = createStar(song.celestialBody);
          break;
        case 'blackHole':
          celestialObject = createBlackHole(song.celestialBody);
          break;
        case 'moon':
          celestialObject = createPlanet(song.celestialBody);
          break;
        case 'comet':
          celestialObject = createStar(song.celestialBody);
          break;
        case 'neutronStar':
          celestialObject = createStar(song.celestialBody);
          break;
        case 'nebula':
          celestialObject = createBlackHole(song.celestialBody);
          break;
        case 'galaxy':
          celestialObject = createBlackHole(song.celestialBody);
          break;
        default:
          celestialObject = createPlanet(song.celestialBody);
      }
      
      if (celestialObject) {
        // 降低天体尺寸，使场景不那么拥挤
        celestialObject.scale.multiplyScalar(0.7);
        
        // 从此类型的区域获取基础位置
        const regionCenter = regions[song.celestialBody.type as keyof typeof regions] || new THREE.Vector3(0, 0, 0);
        
        // 在区域内添加随机偏移
        const theta = Math.random() * Math.PI * 2; // 随机角度
        const phi = Math.acos(2 * Math.random() - 1); // 随机倾角
        const radius = regionRadius * (0.5 + Math.random() * 0.5); // 从中心的随机距离
        
        const offset = new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        );
        
        // 设置位置
        const position = regionCenter.clone().multiplyScalar(regionRadius).add(offset);
        celestialObject.position.copy(position);
        
        // 添加到场景并跟踪
        scene.add(celestialObject);
        celestialBodies.push(celestialObject);
        
        // 添加带有歌曲标题的文本标签
        const textColor = song.celestialBody.color;
        const textLabel = new TextSprite(song.title, textColor);
        textLabel.positionNextTo(celestialObject, celestialObject.scale.y * 2); // 确保文字不与天体重叠
        scene.add(textLabel.sprite);
        
        // 将文本标签引用存储在userData中
        celestialObject.userData.textLabel = textLabel.sprite;
        celestialObject.userData.song = song;
        
        // 存储歌曲数据
        bodyData.push({ object: celestialObject, song });
      }
    });
    
    console.log('Total celestial bodies created:', celestialBodies.length);
    
  } catch (error) {
    console.error('Error creating celestial bodies:', error);
  }
}

// Initialize the scene
function init() {
  console.log('Initializing scene...');
  createStarField();
  createCelestialBodiesFromSongs();
  console.log('Scene initialized');
}

// Raycasting for object selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Update song info panel
function updateInfoPanel(song: Song | null) {
  const titleElement = document.getElementById('song-title');
  const artistElement = document.getElementById('song-artist');
  const infoElement = document.getElementById('celestial-info');
  
  if (song && titleElement && infoElement) {
    titleElement.textContent = song.title;
    infoElement.textContent = `Type: ${song.celestialBody.type}`;
  } else if (titleElement && infoElement) {
    titleElement.textContent = 'Select a celestial body';
    infoElement.textContent = 'Navigate through the cosmic dream and discover songs represented by magical celestial bodies.';
  }
}

// Handle mouse click for object selection with enhanced camera movement
function onMouseClick(event: MouseEvent) {
  // Calculate mouse position in normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // Update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);
  
  // Calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects(celestialBodies, true);
  
  if (intersects.length > 0) {
    // Find the parent object that represents the celestial body
    let selectedObject = intersects[0].object;
    while (selectedObject.parent && !celestialBodies.includes(selectedObject)) {
      selectedObject = selectedObject.parent;
    }
    
    // Find the corresponding song data
    const selectedData = bodyData.find(data => data.object === selectedObject);
    if (selectedData) {
      updateInfoPanel(selectedData.song);
      
      // 增强功能：平滑移动相机到所选天体
      const targetPosition = selectedObject.position.clone();
      const distance = 15; // 保持一定距离观察
      
      // 保存当前相机位置，用于平滑过渡
      const startPosition = camera.position.clone();
      
      // 计算新位置：从目标物体向当前相机方向偏移一定距离
      const direction = new THREE.Vector3().subVectors(camera.position, targetPosition).normalize();
      const newPosition = targetPosition.clone().add(direction.multiplyScalar(distance));
      
      // 动画过渡到新位置和新的视点
      const animateDuration = 1000; // 1秒
      const startTime = Date.now();
      
      // 创建动画函数
      function animateCamera() {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / animateDuration, 1);
        
        // 使用平滑的缓动函数
        const easeProgress = progress < 0.5 ? 
          2 * progress * progress : 
          -1 + (4 - 2 * progress) * progress;
        
        // 插值计算当前位置
        camera.position.lerpVectors(startPosition, newPosition, easeProgress);
        
        // 将控制器的目标设为天体位置
        controls.target.lerpVectors(controls.target, targetPosition, easeProgress);
        
        // 更新控制器
        controls.update();
        
        // 如果动画未完成，继续请求帧
        if (progress < 1) {
          requestAnimationFrame(animateCamera);
        }
      }
      
      // 开始动画
      animateCamera();
    }
  } else {
    updateInfoPanel(null);
  }
}

// Animation variables
let lastTime = 0;

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  // Calculate delta time
  const currentTime = performance.now() / 1000;
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  
  // Update controls
  controls.update();
  
  // Update celestial bodies
  updateCelestialBodies(deltaTime);
  
  // Update text labels to always face the camera
  updateTextLabels();
  
  // Update dreamy shader uniform
  if (dreamyPass && dreamyPass.uniforms && dreamyPass.uniforms.time) {
    dreamyPass.uniforms.time.value = clock.getElapsedTime();
  }
  
  // Render scene using composer
  composer.render();
}

// Update the celestial bodies animation
function updateCelestialBodies(deltaTime: number) {
  celestialBodies.forEach(body => {
    // Handle standard rotation
    if (body.userData.rotationSpeed) {
      if (body.userData.rotationAxis) {
        // Rotate around custom axis
        body.rotateOnAxis(body.userData.rotationAxis, body.userData.rotationSpeed);
      } else {
        // Default Y-axis rotation
        body.rotation.y += body.userData.rotationSpeed;
      }
    }
    
    // Handle pulsing for stars
    if (body.userData.pulseSpeed) {
      const scale = 1 + Math.sin(Date.now() * 0.001 * body.userData.pulseSpeed) * 0.05;
      body.scale.set(scale, scale, scale);
      
      // Also update text label position if the body pulses
      if (body.userData.textLabel) {
        const textLabel = body.userData.textLabel as THREE.Sprite;
        const position = body.position.clone();
        position.y += body.scale.y * 2;
        textLabel.position.copy(position);
      }
    }
  });
  
  // Update special effects (like shader animations)
  specialEffects.forEach(effect => {
    if (effect.userData && effect.userData.time !== undefined) {
      effect.userData.time += deltaTime;
      
      // TypeScript-safe check for ShaderMaterial
      const mesh = effect as THREE.Mesh | THREE.Points;
      const material = mesh.material as THREE.ShaderMaterial;
      
      if (material && 
          material instanceof THREE.ShaderMaterial && 
          material.uniforms && 
          material.uniforms.time) {
        material.uniforms.time.value = effect.userData.time;
      }
    }
  });
}

// 更新文本标签以确保其在摄像机移动时保持可见
function updateTextLabels() {
  celestialBodies.forEach(body => {
    if (body.userData.textLabel) {
      const textLabel = body.userData.textLabel as THREE.Sprite;
      
      // 获取与摄像机的距离
      const distanceToCamera = camera.position.distanceTo(body.position);
      
      // 更新文字位置，确保其跟随天体
      const position = body.position.clone();
      position.y += body.scale.y * 2; // 保持在天体上方
      textLabel.position.copy(position);
      
      // 让文字始终面向摄像机，但避免旋转引起的抖动
      textLabel.quaternion.copy(camera.quaternion);
      
      // 使用固定大小的文本标签，避免缩放导致的重影
      const baseScale = 3.5;
      // 随距离略微调整，但范围很小，避免缩放产生的伪影
      const scaleFactor = Math.min(1.5, Math.max(0.8, 1 + (distanceToCamera - 50) / 100));
      const finalScale = baseScale * scaleFactor;
      
      // 使用整数缩放值可以减少重影
      textLabel.scale.set(
        Math.round(finalScale * 10) / 10, 
        Math.round(finalScale * 0.25 * 10) / 10, 
        1
      );
      
      // 确保文本标签始终可见
      textLabel.visible = true;
    }
  });
}

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

// Event listeners
window.addEventListener('resize', onWindowResize);
window.addEventListener('click', onMouseClick);

// Initialize and start animation
console.log('Starting application...');
init();
animate();

// 添加键盘控制以增强导航能力
window.addEventListener('keydown', onKeyDown);

function onKeyDown(event: KeyboardEvent) {
  const moveSpeed = 5; // 移动速度
  
  switch(event.key) {
    // WASD键移动
    case 'w':
    case 'W':
    case 'ArrowUp':
      // 向前移动
      camera.position.addScaledVector(
        new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion), 
        moveSpeed
      );
      controls.target.addScaledVector(
        new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion), 
        moveSpeed
      );
      break;
      
    case 's':
    case 'S':
    case 'ArrowDown':
      // 向后移动
      camera.position.addScaledVector(
        new THREE.Vector3(0, 0, 1).applyQuaternion(camera.quaternion), 
        moveSpeed
      );
      controls.target.addScaledVector(
        new THREE.Vector3(0, 0, 1).applyQuaternion(camera.quaternion), 
        moveSpeed
      );
      break;
      
    case 'a':
    case 'A':
    case 'ArrowLeft':
      // 向左移动
      camera.position.addScaledVector(
        new THREE.Vector3(-1, 0, 0).applyQuaternion(camera.quaternion), 
        moveSpeed
      );
      controls.target.addScaledVector(
        new THREE.Vector3(-1, 0, 0).applyQuaternion(camera.quaternion), 
        moveSpeed
      );
      break;
      
    case 'd':
    case 'D':
    case 'ArrowRight':
      // 向右移动
      camera.position.addScaledVector(
        new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion), 
        moveSpeed
      );
      controls.target.addScaledVector(
        new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion), 
        moveSpeed
      );
      break;
      
    // 空格和Shift控制上下移动
    case ' ':
      // 向上移动
      camera.position.y += moveSpeed;
      controls.target.y += moveSpeed;
      break;
      
    case 'Shift':
      // 向下移动
      camera.position.y -= moveSpeed;
      controls.target.y -= moveSpeed;
      break;
      
    // 恢复视图到原点
    case 'Home':
    case 'h':
    case 'H':
      camera.position.set(0, 10, 30);
      controls.target.set(0, 0, 0);
      break;
  }
  
  // 更新控制器
  controls.update();
}
