import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import songsData from './data/celestial-songs.json';
import { createPlanet, createStar, createBlackHole, createMoon, createComet, createNeutronStar, createNebula, createGalaxy } from './styles/celestial-styles';

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

interface MovementParams {
  velocity: THREE.Vector3;     // 当前速度向量
  maxSpeed: number;            // 最大速度
  acceleration: number;        // 加速度系数
  changeDirectionChance: number; // 改变方向的概率
  currentTarget: THREE.Vector3; // 当前目标点
  targetReachedThreshold: number; // 认为已到达目标的距离阈值
  lastDirectionChange: number;   // 上次改变方向的时间
  minDirectionChangeInterval: number; // 最短方向改变间隔
  personalSpace: number;       // 个体空间，用于避让其他天体
}

interface OrbitParams {
  center: THREE.Vector3;
  radius: number;
  speed: number;
  direction: THREE.Vector3;
  phase: number;
  type: string; // 运动类型
  boundingRadius: number; // 活动边界半径
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
    
    // 在整个3D空间中分布天体
    songs.forEach((song) => {
      // 使用球坐标系来确保天体分布在整个3D空间而不是平面上
      const radius = THREE.MathUtils.randFloat(15, 70); 
      const theta = Math.random() * Math.PI * 2;  // 水平角度 0-2π
      const phi = Math.acos(2 * Math.random() - 1); // 垂直角度 0-π
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      const position = new THREE.Vector3(x, y, z);
      
      // 创建天体
      createBodyObject(song, position);
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
  // 定义宇宙边界球体半径
  const universeRadius = 80;

  celestialBodies.forEach(body => {
    // 处理自转
    if (body.userData.rotationSpeed) {
      if (body.userData.rotationAxis) {
        // 绕自定义轴旋转
        body.rotateOnAxis(body.userData.rotationAxis, body.userData.rotationSpeed);
      } else {
        // 默认绕Y轴旋转
        body.rotation.y += body.userData.rotationSpeed;
      }
    }
    
    // 处理星体脉动
    if (body.userData.pulseSpeed) {
      body.userData.pulseTime = (body.userData.pulseTime || 0) + deltaTime;
      const scale = 1 + Math.sin(body.userData.pulseTime * body.userData.pulseSpeed) * 0.1;
      body.scale.set(scale, scale, scale);
    }
    
    // 处理自由游动
    if (body.userData.movementParams) {
      const movement = body.userData.movementParams as MovementParams;
      
      // 累计时间
      movement.lastDirectionChange += deltaTime;
      
      // 检查是否需要改变目标点
      const distanceToTarget = body.position.distanceTo(movement.currentTarget);
      if (distanceToTarget < movement.targetReachedThreshold || 
          (movement.lastDirectionChange > movement.minDirectionChangeInterval && 
           Math.random() < movement.changeDirectionChance)) {
        
        // 选择一个新的随机目标点
        movement.currentTarget.set(
          THREE.MathUtils.randFloatSpread(120),
          THREE.MathUtils.randFloatSpread(120),
          THREE.MathUtils.randFloatSpread(120)
        ).normalize().multiplyScalar(THREE.MathUtils.randFloat(20, 60));
        
        // 重置计时器
        movement.lastDirectionChange = 0;
      }
      
      // 计算朝向目标的方向
      const direction = new THREE.Vector3().subVectors(movement.currentTarget, body.position).normalize();
      
      // 应用加速度朝向目标方向
      const acceleration = direction.clone().multiplyScalar(movement.acceleration * deltaTime);
      movement.velocity.add(acceleration);
      
      // 限制最大速度
      if (movement.velocity.length() > movement.maxSpeed) {
        movement.velocity.normalize().multiplyScalar(movement.maxSpeed);
      }
      
      // 轻微的随机运动 - 模拟水中波动
      movement.velocity.x += THREE.MathUtils.randFloatSpread(0.5) * deltaTime;
      movement.velocity.y += THREE.MathUtils.randFloatSpread(0.5) * deltaTime;
      movement.velocity.z += THREE.MathUtils.randFloatSpread(0.5) * deltaTime;
      
      // 应用速度更新位置
      body.position.addScaledVector(movement.velocity, deltaTime * 2);
      
      // 检查是否超出宇宙边界，如果是则反弹
      if (body.position.length() > universeRadius) {
        // 超出边界，将位置拉回边界内
        body.position.normalize().multiplyScalar(universeRadius * 0.95);
        
        // 反弹速度，但加入一些随机性
        movement.velocity.negate().multiplyScalar(0.7);
        movement.velocity.x += THREE.MathUtils.randFloatSpread(2);
        movement.velocity.y += THREE.MathUtils.randFloatSpread(2);
        movement.velocity.z += THREE.MathUtils.randFloatSpread(2);
        movement.velocity.normalize().multiplyScalar(movement.maxSpeed * 0.5);
        
        // 设置新的目标点朝向宇宙中心
        movement.currentTarget.set(0, 0, 0).add(
          new THREE.Vector3(
            THREE.MathUtils.randFloatSpread(30),
            THREE.MathUtils.randFloatSpread(30),
            THREE.MathUtils.randFloatSpread(30)
          )
        );
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

// 创建天体对象并添加到场景
function createBodyObject(song: Song, position: THREE.Vector3) {
  // 创建对应类型的天体
  const body = song.celestialBody;
  let object: THREE.Object3D | null = null;
  
  // 创建选项对象，适配celestial-styles中的函数参数格式
  const options = {
    color: body.color,
    size: body.size,
    hasRings: Math.random() > 0.6,
    hasGlow: true,
    hasParticles: true
  };
  
  switch (body.type) {
    case 'planet':
      object = createPlanet(options);
      break;
    case 'star':
      object = createStar(options);
      break;
    case 'blackHole':
      object = createBlackHole(options);
      break;
    case 'moon':
      object = createMoon(options);
      break;
    case 'comet':
      object = createComet(options);
      break;
    case 'neutronStar':
      object = createNeutronStar(options);
      break;
    case 'nebula':
      object = createNebula(options);
      break;
    case 'galaxy':
      object = createGalaxy(options);
      break;
    default:
      object = createPlanet(options); // 默认创建行星
  }
  
  // 设置位置
  object.position.copy(position);
  
  // 根据天体类型设置不同的运动参数
  let speed = 0;
  let changeRate = 0;
  
  switch (body.type) {
    case 'planet':
      // 行星：中等速度，中等变向频率
      speed = THREE.MathUtils.randFloat(3, 5);
      changeRate = 0.01;
      break;
    case 'star':
      // 恒星：慢速漂浮，很少变向
      speed = THREE.MathUtils.randFloat(1, 2);
      changeRate = 0.003;
      break;
    case 'blackHole':
      // 黑洞：快速，频繁变向
      speed = THREE.MathUtils.randFloat(4, 7);
      changeRate = 0.02;
      break;
    case 'moon':
      // 月球：较慢速度，中等变向
      speed = THREE.MathUtils.randFloat(2, 4);
      changeRate = 0.008;
      break;
    case 'comet':
      // 彗星：高速，直线运动为主
      speed = THREE.MathUtils.randFloat(6, 9);
      changeRate = 0.005;
      break;
    case 'neutronStar':
      // 中子星：中速，偶尔突然加速
      speed = THREE.MathUtils.randFloat(3, 6);
      changeRate = 0.015;
      break;
    case 'nebula':
      // 星云：缓慢漂移
      speed = THREE.MathUtils.randFloat(0.5, 1.5);
      changeRate = 0.002;
      break;
    case 'galaxy':
      // 星系：极慢移动
      speed = THREE.MathUtils.randFloat(0.2, 1);
      changeRate = 0.001;
      break;
    default:
      speed = THREE.MathUtils.randFloat(2, 4);
      changeRate = 0.008;
  }
  
  // 添加自由游动参数
  const movementParams: MovementParams = {
    velocity: new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(2), 
      THREE.MathUtils.randFloatSpread(2), 
      THREE.MathUtils.randFloatSpread(2)
    ).normalize().multiplyScalar(speed * 0.5),
    maxSpeed: speed,
    acceleration: speed * 0.1,
    changeDirectionChance: changeRate,
    currentTarget: new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(100),
      THREE.MathUtils.randFloatSpread(100),
      THREE.MathUtils.randFloatSpread(100)
    ).normalize().multiplyScalar(THREE.MathUtils.randFloat(20, 60)),
    targetReachedThreshold: 5,
    lastDirectionChange: 0,
    minDirectionChangeInterval: THREE.MathUtils.randFloat(2, 5),
    personalSpace: body.size * 4
  };
  
  // 将自由游动参数存储在对象的userData中
  object.userData.movementParams = movementParams;
  
  // 添加到场景
  scene.add(object);
  celestialBodies.push(object);
  
  // 创建精灵文本标签
  const textColor = body.color;
  const label = new SpriteLabel(song.title, textColor);
  label.attachTo(object);
  spriteLabels.push(label);
  
  // 将歌曲和对象关联起来
  bodyData.push({object, song});
  
  return object;
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
