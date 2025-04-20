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
const canvas = document.querySelector('canvas');
if (!canvas) throw new Error('Canvas element not found');

const renderer = new THREE.WebGLRenderer({ 
  antialias: true,
  alpha: true,
  canvas: canvas
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000000, 0); // 设置透明背景
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
// 不再需要手动添加到DOM，因为我们已经在创建时指定了canvas

// Post-processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Bloom effect - 完全禁用泛光效果以解决文字重影问题
// const bloomPass = new UnrealBloomPass(
//   new THREE.Vector2(window.innerWidth, window.innerHeight),
//   0.8,    // strength
//   0.3,    // radius
//   0.9    // threshold
// );
// composer.addPass(bloomPass);

// Dreamy effect shader
const dreamyPass = new ShaderPass(DreamyShader);
composer.addPass(dreamyPass);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 1; // 减小最小距离以允许更近距离查看
controls.maxDistance = Infinity; // 移除最大距离限制
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
  const particles = 2000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particles * 3);
  const colors = new Float32Array(particles * 3);
  const sizes = new Float32Array(particles);

  const color = new THREE.Color();

  for (let i = 0; i < positions.length; i += 3) {
    // 确保星星分布在较远的距离，不会与中心重叠
    const radius = THREE.MathUtils.randFloat(300, 1000);
    const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
    const phi = THREE.MathUtils.randFloat(0, Math.PI);
  
    positions[i] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i + 2] = radius * Math.cos(phi);

    // 使用较暗的颜色，避免过亮
    const brightnessFactor = THREE.MathUtils.randFloat(0.3, 0.8);
    
    // 混合蓝色和白色，创造冰冷星空
    color.setRGB(
      brightnessFactor, 
      brightnessFactor, 
      THREE.MathUtils.randFloat(brightnessFactor, 1.0)
    );

    colors[i] = color.r;
    colors[i + 1] = color.g;
    colors[i + 2] = color.b;

    // 随机大小，但不要太大
    sizes[i / 3] = THREE.MathUtils.randFloat(0.5, 2.0);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size: 1.0,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    // 这里必须设置alphaTest，不然会导致白色块
    alphaTest: 0.01,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const stars = new THREE.Points(geometry, material);
  scene.add(stars);
}

// 新增：添加Three.js精灵标签系统 - 这将替代HTML标签
class SpriteLabel {
  sprite: THREE.Sprite;
  object3D: THREE.Object3D | null = null;

  constructor(text: string, color: string = '#ffffff') {
    // 创建画布以绘制文本
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D context');
    
    // 设置画布大小
    canvas.width = 256;
    canvas.height = 64;
    
    // 绘制背景
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // 设置文本样式
    context.font = 'bold 20px Arial';
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // 绘制文本
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // 创建纹理
    const texture = new THREE.CanvasTexture(canvas);
    
    // 创建材质
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: true
    });
    
    // 创建精灵
    this.sprite = new THREE.Sprite(spriteMaterial);
    this.sprite.scale.set(2, 0.5, 1);
    
    // 设置初始位置和可见性
    this.sprite.visible = true;
  }
  
  // 将标签与3D对象关联
  attachTo(object: THREE.Object3D) {
    this.object3D = object;
    
    // 将精灵添加到场景
    if (this.object3D) {
      // 设置精灵位置为物体上方
      this.sprite.position.copy(this.object3D.position);
      this.sprite.position.y += 2.0; // 向上偏移
      
      // 添加到场景
      scene.add(this.sprite);
    }
  }
  
  // 更新精灵位置
  update() {
    if (!this.object3D) return;
    
    // 直接跟随对象位置，并保持在上方
    const pos = this.object3D.position.clone();
    pos.y += 2.0; // 保持在上方
    this.sprite.position.copy(pos);
    
    // 计算距离摄像机的距离
    const distance = this.sprite.position.distanceTo(camera.position);
    
    // 根据距离调整精灵的大小
    const scale = Math.max(1, Math.min(3, 10 / Math.sqrt(distance)));
    this.sprite.scale.set(scale * 2, scale * 0.5, 1);
  }
  
  // 移除精灵
  remove() {
    if (this.sprite.parent) {
      this.sprite.parent.remove(this.sprite);
    }
  }
}

// 存储精灵标签
const spriteLabels: SpriteLabel[] = [];

// Create celestial bodies
const celestialBodies: THREE.Object3D[] = [];
const bodyData: {object: THREE.Object3D, song: Song}[] = [];

// Array for special effect objects that need animation
const specialEffects: THREE.Object3D[] = [];

// Helper function for random position - 调整天体间距离
function getRandomPosition(minRadius: number, maxRadius: number): THREE.Vector3 {
  const radius = THREE.MathUtils.randFloat(minRadius, maxRadius); // 恢复原来的最大半径
  const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
  const phi = THREE.MathUtils.randFloat(0, Math.PI);
  
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);
  
  return new THREE.Vector3(x, y, z);
}

// Create celestial bodies from songs data
function createCelestialBodiesFromSongs() {
  try {
    const songs = (songsData as any).songs as Song[];
    
    console.log('Songs data loaded:', songs.length, 'songs found');
    
    // 按类型组织天体，避免拥挤
    const regions = {
      planet: new THREE.Vector3(-1, 0, 0), // 增加偏移以增大天体间距
      star: new THREE.Vector3(1, 0, 0),    // 增加偏移以增大天体间距
      blackHole: new THREE.Vector3(0, 0, 1), // 增加偏移以增大天体间距
      moon: new THREE.Vector3(0, 0, -1), // 增加偏移以增大天体间距
      comet: new THREE.Vector3(-1, 0, 1), // 增加偏移以增大天体间距
      neutronStar: new THREE.Vector3(1, 0, 1), // 增加偏移以增大天体间距
      nebula: new THREE.Vector3(-1, 0, -1), // 增加偏移以增大天体间距
      galaxy: new THREE.Vector3(1, 0, -1) // 增加偏移以增大天体间距
    };
    
    const regionRadius = 40; // 增加区域半径，让天体更分散
    
    // 显示全部天体
    // const maxBodies = 30; // 限制为30个天体
    
    songs.forEach((song, index) => {
      // 允许显示所有歌曲
      // if (index >= maxBodies) return;
      
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
        // 可以根据需要添加其他天体类型
        default:
          celestialObject = createPlanet(song.celestialBody); // 默认创建行星
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
        
        // 创建精灵文本标签
        const textColor = song.celestialBody.color;
        const label = new SpriteLabel(song.title, textColor);
        label.attachTo(celestialObject);
        spriteLabels.push(label);
        
        // 将歌曲数据存储
        bodyData.push({ object: celestialObject, song });
      }
    });
    
    console.log('Total celestial bodies created:', celestialBodies.length);
    
  } catch (error) {
    console.error('Error creating celestial bodies:', error);
  }
}

// 主初始化函数
function initialize() {
  console.log('Initializing scene...');
  
  // 清理场景，确保没有遗留元素
  while (scene.children.length > 0) {
    scene.remove(scene.children[0]);
  }
  
  // 创建星空背景（使用优化的版本，解决白色块问题）
  createStarField();
  
  // 创建天体
  createCelestialBodiesFromSongs();
  
  // 更新控制器
  controls.update();
  
  console.log('Scene initialized');
}

// Animation variables
let lastTime = 0;

// 动画循环
function animate() {
  requestAnimationFrame(animate);
  
  const deltaTime = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();
  
  // 更新精灵标签位置
  for (const label of spriteLabels) {
    label.update();
  }

  // 更新天体的旋转和特效
  updateCelestialBodies(deltaTime);
  
  // 更新控件
  controls.update();
  
  // Update dreamy shader uniform
  if (dreamyPass && dreamyPass.uniforms && dreamyPass.uniforms.time) {
    dreamyPass.uniforms.time.value = elapsedTime;
  }
  
  // 渲染场景
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

// 创建天体对象并添加到场景
function createBodyObject(song: Song, position: THREE.Vector3) {
  // 创建对应类型的天体
  const body = song.celestialBody;
  let object: THREE.Object3D | null = null;
  
  switch (body.type) {
    case 'planet':
      object = createPlanet(body);
      break;
    case 'star':
      object = createStar(body);
      break;
    case 'blackHole':
      object = createBlackHole(body);
      break;
    // 可以根据需要添加其他天体类型
    default:
      object = createPlanet(body); // 默认创建行星
  }
  
  // 设置位置
  object.position.copy(position);
  
  // 添加到场景
  scene.add(object);
  celestialBodies.push(object);
  
  // 创建精灵文本标签
  const textColor = body.textColor || '#ffffff';
  const label = new SpriteLabel(song.title, textColor);
  label.attachTo(object);
  spriteLabels.push(label);
  
  // 将歌曲和对象关联起来
  bodyData.push({object, song});
  
  return object;
}

// 创建行星材质 - 修复白块问题
function createPlanetMaterial(color: THREE.Color) {
  return new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.8,
    alphaTest: 0.05,  // 使用alphaTest解决透明问题
    depthWrite: false  // 避免深度写入问题
  });
}

// 创建行星光晕材质 - 修复白块问题
function createPlanetGlowMaterial(color: THREE.Color) {
  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: color.clone() }
    },
    vertexShader: `
      varying vec3 vNormal;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      varying vec3 vNormal;
      
      void main() {
        float intensity = 1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0));
        intensity = pow(intensity, 1.5);
        gl_FragColor = vec4(color, intensity * 0.5);
      }
    `,
    transparent: true,
    alphaTest: 0.01,  // 使用alphaTest解决透明问题
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
}

// Create a planet - 优化版本，解决白色块问题
function createPlanet(body: CelestialBody): THREE.Group {
  const group = new THREE.Group();
  
  // 行星核心
  const geometry = new THREE.SphereGeometry(body.size, 32, 32);
  const material = createPlanetMaterial(new THREE.Color(body.color));
  
  const core = new THREE.Mesh(geometry, material);
  group.add(core);
  
  // 大气光晕
  const glowGeometry = new THREE.SphereGeometry(body.size * 1.2, 32, 32);
  const glowMaterial = createPlanetGlowMaterial(new THREE.Color(body.color));
  
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  group.add(glow);
  
  // 环系统（如果适用）
  if (Math.random() > 0.6) {
    const ringGeometry = new THREE.RingGeometry(
      body.size * 1.5,
      body.size * 2.5,
      64
    );
    
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(body.color).multiplyScalar(1.2),
      transparent: true,
      opacity: 0.4,
      alphaTest: 0.01,  // 使用alphaTest解决透明问题
      side: THREE.DoubleSide,
      depthWrite: false
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
  }
  
  // 添加少量悬浮粒子以增强梦幻质感，但避免过度使用
  const particleCount = 30;
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    const radius = body.size * THREE.MathUtils.randFloat(1.3, 2.0);
    const angle = Math.random() * Math.PI * 2;
    const height = THREE.MathUtils.randFloatSpread(body.size * 1.5);
    
    particlePositions[i * 3] = Math.cos(angle) * radius;
    particlePositions[i * 3 + 1] = height;
    particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  
  const particleMaterial = new THREE.PointsMaterial({
    color: new THREE.Color(body.color).multiplyScalar(1.2),
    size: 0.15,
    transparent: true,
    opacity: 0.6,
    alphaTest: 0.01,  // 使用alphaTest解决透明问题
    depthWrite: false
  });
  
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  group.add(particles);
  
  // 在需要时设置自旋转
  group.userData = { 
    rotationSpeed: THREE.MathUtils.randFloat(0.001, 0.003), 
    wobbleSpeed: THREE.MathUtils.randFloat(0.0005, 0.001) 
  };
  
  return group;
}

// Create a star - 优化版本，解决白色块问题
function createStar(body: CelestialBody): THREE.Group {
  const group = new THREE.Group();
  
  // 恒星核心
  const coreGeometry = new THREE.SphereGeometry(body.size * 0.7, 32, 32);
  const coreMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(body.color) },
      time: { value: 0 }
    },
    vertexShader: `
      varying vec3 vNormal;
      uniform float time;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec3 pos = position * (1.0 + sin(time * 0.5) * 0.02);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float time;
      varying vec3 vNormal;
      
      void main() {
        float pulse = 0.9 + 0.1 * sin(time * 0.5);
        float gradient = 0.6 + 0.4 * dot(vNormal, vec3(0, 0, 1));
        vec3 finalColor = color * gradient * pulse;
        gl_FragColor = vec4(finalColor, 0.9);
      }
    `,
    transparent: true,
    alphaTest: 0.01, // 添加alphaTest解决透明问题
    depthWrite: false
  });
  
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  group.add(core);
  core.userData.time = 0;
  specialEffects.push(core);
  
  // 恒星光晕
  const glowGeometry = new THREE.SphereGeometry(body.size, 32, 32);
  const glowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(body.color) },
      time: { value: 0 }
    },
    vertexShader: `
      varying vec3 vNormal;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      varying vec3 vNormal;
      
      void main() {
        // 边缘光晕效果
        float rim = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
        rim = pow(rim, 3.0);
        
        vec3 glow = color * rim;
        gl_FragColor = vec4(glow, rim * 0.6);
      }
    `,
    transparent: true,
    alphaTest: 0.01, // 添加alphaTest解决透明问题
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  group.add(glow);
  
  // 添加少量光芒射线
  const rayCount = 4;
  const rayGeometry = new THREE.CylinderGeometry(0.1, 0.3, body.size * 5, 8, 1);
  
  for (let i = 0; i < rayCount; i++) {
    const angle = (Math.PI * 2 / rayCount) * i;
    
    const rayMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(body.color),
      transparent: true,
      opacity: 0.15,
      alphaTest: 0.01, // 添加alphaTest解决透明问题
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const ray = new THREE.Mesh(rayGeometry, rayMaterial);
    
    // 设置光芒的方向
    ray.rotation.z = Math.PI / 2;
    ray.rotation.y = angle;
    
    // 随机旋转效果
    ray.userData = {
      rotationSpeed: THREE.MathUtils.randFloat(0.005, 0.01),
      originalRotation: angle
    };
    
    specialEffects.push(ray);
    group.add(ray);
  }
  
  // 添加星尘粒子
  const dustCount = 100;
  const dustGeometry = new THREE.BufferGeometry();
  const dustPositions = new Float32Array(dustCount * 3);
  
  for (let i = 0; i < dustCount; i++) {
    const radius = body.size * THREE.MathUtils.randFloat(1.5, 3.0);
    const angle = Math.random() * Math.PI * 2;
    const heightRange = body.size * 1.5;
    const height = THREE.MathUtils.randFloatSpread(heightRange);
    
    dustPositions[i * 3] = Math.cos(angle) * radius;
    dustPositions[i * 3 + 1] = height;
    dustPositions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  
  const dustMaterial = new THREE.PointsMaterial({
    color: new THREE.Color(body.color),
    size: 0.1,
    transparent: true,
    opacity: 0.4,
    alphaTest: 0.01, // 添加alphaTest解决透明问题
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  group.add(dust);
  
  group.userData = { 
    rotationSpeed: THREE.MathUtils.randFloat(0.001, 0.002)
  };
  
  return group;
}

// Create a black hole - 优化版本，解决白色块问题
function createBlackHole(body: CelestialBody): THREE.Group {
  const group = new THREE.Group();
  
  // 事件视界 - 使用柔和的黑色球体
  const horizonGeometry = new THREE.SphereGeometry(body.size * 0.7, 32, 32);
  const horizonMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.8,
    alphaTest: 0.01 // 添加alphaTest解决透明问题
  });
  
  const horizon = new THREE.Mesh(horizonGeometry, horizonMaterial);
  group.add(horizon);
  
  // 梦幻光环效果
  const glowGeometry = new THREE.SphereGeometry(body.size * 1.1, 32, 32);
  const glowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(body.color || 0x6a0dad) },
      time: { value: 0 }
    },
    vertexShader: `
      varying vec3 vNormal;
      uniform float time;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float time;
      varying vec3 vNormal;
      
      void main() {
        // 边缘光晕效果
        float rim = 1.0 - abs(dot(vNormal, vec3(0, 0, 1)));
        rim = pow(rim, 2.0);
        
        // 脉动效果
        float pulse = 0.8 + 0.2 * sin(time * 0.5);
        rim *= pulse;
        
        vec3 glowColor = color * rim;
        gl_FragColor = vec4(glowColor, rim * 0.6);
      }
    `,
    transparent: true,
    alphaTest: 0.01, // 添加alphaTest解决透明问题
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.userData = { time: 0 };
  group.add(glow);
  specialEffects.push(glow);
  
  // 简化的漩涡盘
  const diskGeometry = new THREE.RingGeometry(body.size * 1.2, body.size * 3, 64, 4);
  const diskMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(body.color || 0x9370db) },
      time: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying float vDistance;
      
      void main() {
        vUv = uv;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vDistance = length(position.xy) / (${body.size} * 3.0);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float time;
      varying vec2 vUv;
      varying float vDistance;
      
      void main() {
        // 创建平滑的漩涡效果
        float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
        float dist = distance(vUv, vec2(0.5));
        
        // 柔和的渐变
        float gradient = smoothstep(0.4, 0.5, 1.0 - vDistance);
        
        // 流动的漩涡
        float swirl = sin(angle * 6.0 + time * 0.5 + 10.0 * vDistance);
        float pattern = smoothstep(0.3, 0.7, swirl);
        
        // 梦幻色彩变化
        vec3 outerColor = vec3(0.6, 0.4, 0.8); // 梦幻紫色
        vec3 innerColor = color;
        vec3 finalColor = mix(outerColor, innerColor, vDistance);
        
        float alpha = gradient * (0.3 + 0.1 * pattern);
        alpha *= (1.0 - vDistance * 0.8); // 向外渐变消失
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    transparent: true,
    alphaTest: 0.01, // 添加alphaTest解决透明问题
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  
  const disk = new THREE.Mesh(diskGeometry, diskMaterial);
  disk.rotation.x = Math.PI / 2;
  disk.userData = { time: 0 };
  group.add(disk);
  specialEffects.push(disk);
  
  // 添加微光粒子
  const particleCount = 100;
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    const radius = body.size * THREE.MathUtils.randFloat(1.2, 3.0);
    const angle = Math.random() * Math.PI * 2;
    const height = THREE.MathUtils.randFloatSpread(body.size * 0.6);
    
    particlePositions[i * 3] = Math.cos(angle) * radius;
    particlePositions[i * 3 + 1] = height;
    particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  
  const particleMaterial = new THREE.PointsMaterial({
    color: new THREE.Color(body.color || 0xb19cd9),
    size: 0.1,
    transparent: true,
    opacity: 0.5,
    alphaTest: 0.01, // 添加alphaTest解决透明问题
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  group.add(particles);
  
  // 旋转效果
  group.userData = { 
    rotationSpeed: THREE.MathUtils.randFloat(0.002, 0.005)
  };
  
  return group;
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

// Initialize and start animation
console.log('Starting application...');
initialize();

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

animate();

// 添加样式到document
function addLabelStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .celestial-label {
      font-size: 14px;
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      pointer-events: none;
      user-select: none;
      text-shadow: none !important;
      box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.5);
      z-index: 1000;
    }
  `;
  document.head.appendChild(style);
}

// 确保页面加载时初始化标签样式
document.addEventListener('DOMContentLoaded', () => {
  addLabelStyles();
});

// 在窗口大小改变时更新标签位置
window.addEventListener('resize', () => {
  for (const label of spriteLabels) {
    label.update();
  }
});
