import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// 导入celestial-demo项目中的天体样式
import { createPlanet, createStar, createBlackHole, createMoon, createComet, createNebula } from '../../celestial-demo/src/styles/celestial-styles';

// 导入天体数据
import celestialSongsData from './data/new-celestial-songs.json';

// 全局变量
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let composer: EffectComposer;
let controls: TrackballControls;
let currentCelestialBody: THREE.Object3D | null = null;
let clock: THREE.Clock;
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;
let currentPlayingMusic: number = -1;

// 音乐列表
const musicList = [
  "//music.163.com/outchain/player?type=2&id=1977970262&auto=1&height=66",
  "//music.163.com/outchain/player?type=2&id=1940453571&auto=1&height=66",
  "//music.163.com/outchain/player?type=2&id=2068989324&auto=1&height=66",
  "//music.163.com/outchain/player?type=2&id=2647018610&auto=1&height=66"
];

// 保存所有标签
const songLabels: THREE.Sprite[] = [];

// 当前选择的天体类型、颜色和大小
let currentType = 'planet';
let currentColor = '#3498db';
let currentSize = 1.0;

// 存储所有创建的天体
const celestialBodies: THREE.Object3D[] = [];

// 初始化函数
function init() {
  // 创建场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000814);

  // 创建相机 - 修改近平面和远平面距离
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.0001, 1000000);
  camera.position.z = 100;

  // 创建渲染器
  const canvas = document.querySelector('canvas');
  if (!canvas) throw new Error('Canvas element not found');
  
  renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    canvas: canvas
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  // 创建后期处理
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  
  // 使用TrackballControls替代OrbitControls
  controls = new TrackballControls(camera, renderer.domElement);
  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 5.0; // 更高的缩放速度
  controls.panSpeed = 0.8;
  controls.noPan = false;
  controls.noZoom = false;
  controls.noRotate = false;
  controls.staticMoving = true; // 静态移动，没有动量
  controls.dynamicDampingFactor = 0.3;
  
  // 完全移除Z轴移动限制
  controls.minDistance = 0.0001;
  controls.maxDistance = Infinity;
  
  // 添加时钟
  clock = new THREE.Clock();
  
  // 添加灯光
  addLights();
  
  // 添加天体
  createCelestialBodies();
  
  // 创建音乐播放器
  createMusicPlayer();
  
  // 添加射线检测器，用于捕获天体点击事件
  setupRaycaster();
  
  // 添加窗口大小改变事件监听
  window.addEventListener('resize', onWindowResize);
}

// 添加灯光
function addLights() {
  // 环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);
  
  // 方向光
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
  
  // 背光
  const backLight = new THREE.DirectionalLight(0xffffff, 0.2);
  backLight.position.set(-1, -1, -1);
  scene.add(backLight);
}

// 创建文本精灵
function createTextSprite(text: string, color: string): THREE.Sprite {
  // 创建画布
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  
  // 设置文本样式
  const fontSize = 24;
  context.font = `${fontSize}px Arial, sans-serif`;
  
  // 获取文本宽度
  const textWidth = context.measureText(text).width;
  
  // 设置画布大小
  canvas.width = textWidth + 20;
  canvas.height = fontSize + 10;
  
  // 清空画布 - 透明背景
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  // 设置文本样式
  context.font = `${fontSize}px Arial, sans-serif`;
  context.fillStyle = color || '#ffffff';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  // 绘制文本
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  
  // 创建纹理
  const texture = new THREE.CanvasTexture(canvas);
  
  // 创建精灵材质
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true
  });
  
  // 创建精灵
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(5, 1.25, 1); // 设置精灵大小
  
  return sprite;
}

// 获取太极分布的位置
function getTaijiPosition(index: number, totalCount: number, universeRadius: number, bodyJitterMap?: Map<number, THREE.Vector3>): THREE.Vector3 {
  // 将索引归一化为0-1范围
  const normalizedIndex = index / totalCount;
  
  // 太极球半径
  const radius = universeRadius * 0.8;
  
  // 决定是在阴部分还是阳部分
  const isYang = normalizedIndex < 0.5;
  
  // 在各自半球中的位置比例
  const halfNormalizedIndex = isYang ? normalizedIndex * 2 : (normalizedIndex - 0.5) * 2;
  
  // 相对于太极中心的角度，用于螺旋分布
  const angle = halfNormalizedIndex * Math.PI * 4; // 螺旋两圈
  
  // 高度 - 从-1到1的范围，对应太极的上下
  let height;
  if (isYang) {
    // 阳部分 - 在上半球，但逐渐向中心螺旋
    height = Math.cos(halfNormalizedIndex * Math.PI);
  } else {
    // 阴部分 - 在下半球，但逐渐向中心螺旋
    height = -Math.cos(halfNormalizedIndex * Math.PI);
  }
  
  // 在水平面上的半径，随着高度变化而变化
  const horizontalRadius = radius * Math.sqrt(1 - height * height);
  
  // 计算笛卡尔坐标
  const x = horizontalRadius * Math.cos(angle);
  const z = horizontalRadius * Math.sin(angle);
  const y = height * radius;
  
  // 基础位置（无扰动）
  const basePosition = new THREE.Vector3(x, y, z);
  
  // 如果提供了扰动映射且存在该索引的扰动，则使用现有扰动
  if (bodyJitterMap && bodyJitterMap.has(index)) {
    const jitter = bodyJitterMap.get(index)!;
    return new THREE.Vector3(
      basePosition.x + jitter.x,
      basePosition.y + jitter.y,
      basePosition.z + jitter.z
    );
  }
  
  // 否则生成新的扰动
  const jitter = radius * 0.02; // 减小扰动量以减少抖动感
  const jitterVec = new THREE.Vector3(
    (Math.random() - 0.5) * jitter,
    (Math.random() - 0.5) * jitter,
    (Math.random() - 0.5) * jitter
  );
  
  // 如果有扰动映射，存储这个扰动以便复用
  if (bodyJitterMap) {
    bodyJitterMap.set(index, jitterVec);
  }
  
  return new THREE.Vector3(
    basePosition.x + jitterVec.x,
    basePosition.y + jitterVec.y,
    basePosition.z + jitterVec.z
  );
}

// 加载太极运动函数
function rotateTaiji() {
  // 获取当前时间
  const time = Date.now() * 0.001;
  
  // 遍历每个天体
  celestialBodies.forEach((body, index) => {
    // 获取用户数据
    const userData = body.userData;
    
    // 确定旋转方向（阳顺时针，阴逆时针）
    const isYang = index < celestialBodies.length / 2;
    const rotationDirection = isYang ? 1 : -1;
    
    // 保存天体前一个位置（用于彗星方向计算）
    const previousPosition = body.position.clone();
    
    // 获取当前位置
    const currentPos = body.position.clone();
    
    // 提取球面坐标
    const radius = Math.sqrt(currentPos.x * currentPos.x + currentPos.z * currentPos.z);
    const theta = Math.atan2(currentPos.z, currentPos.x);
    
    // 计算新的角度 - 显著增加旋转速度
    const newTheta = theta + rotationDirection * 0.005; // 大幅提高太极旋转速度
    
    // 保持Y坐标不变，更新X和Z
    const newX = radius * Math.cos(newTheta) * Math.sqrt(currentPos.x * currentPos.x + currentPos.z * currentPos.z) / radius;
    const newZ = radius * Math.sin(newTheta) * Math.sqrt(currentPos.x * currentPos.x + currentPos.z * currentPos.z) / radius;
    
    // 应用新位置，保持Y不变
    body.position.set(newX, currentPos.y, newZ);
    
    // 如果是彗星，让其头部朝向运动方向
    if (userData.song && userData.song.celestialBody.type === 'comet') {
      // 计算运动向量
      const movementVector = new THREE.Vector3().subVectors(body.position, previousPosition);
      if (movementVector.length() > 0.001) { // 确保运动量足够大，避免微小抖动
        // 创建一个指向运动方向的临时向量（注意彗星在THREE.js中默认是沿着Z轴指向的）
        const direction = new THREE.Vector3(0, 0, 1);
        // 计算四元数，将Z轴旋转到运动方向
        const quaternion = new THREE.Quaternion().setFromUnitVectors(direction, movementVector.normalize());
        // 应用旋转
        body.quaternion.copy(quaternion);
      }
    } 
    // 其他天体正常自转
    else if (body.userData.rotation && body.userData.rotationSpeed) {
      const rotationAxis = body.userData.rotation as THREE.Vector3;
      const rotationSpeed = body.userData.rotationSpeed as number;
      
      body.rotateOnAxis(rotationAxis.normalize(), rotationSpeed);
    }
  });
  
  // 更新标签位置
  updateSongLabels();
}

// 动画更新函数
function animate() {
  requestAnimationFrame(animate);
  
  // 最大化更新频率，使用每帧更新
  // 旋转太极
  rotateTaiji();
  
  // 更新控制器
  controls.update();
  
  // 渲染场景
  composer.render();
}

// 处理窗口大小变化
function onWindowResize() {
  // 更新相机
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  
  // 更新渲染器
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

// 更新标签位置和朝向
function updateSongLabels() {
  songLabels.forEach(label => {
    const celestialBody = label.userData.celestialBody as THREE.Object3D;
    if (celestialBody) {
      // 从天体位置复制
      const position = celestialBody.position.clone();
      
      // 根据天体类型和大小调整标签位置
      const bodySize = celestialBody.userData.song.celestialBody.size || 1;
      const bodyType = celestialBody.userData.song.celestialBody.type;
      
      // 不同天体类型的标签高度调整
      let heightOffset = bodySize * 3;
      if (bodyType === 'nebula') {
        heightOffset = bodySize * 5; // 星云需要更高的标签
      } else if (bodyType === 'blackhole') {
        heightOffset = bodySize * 4; // 黑洞也需要更高一些
      }
      
      position.y += heightOffset;
      
      // 更新标签位置
      label.position.copy(position);
      
      // 使标签始终朝向相机
      label.lookAt(camera.position);
    }
  });
}

// 创建所有天体
function createCelestialBodies() {
  const songs = celestialSongsData.songs;
  const universeRadius = 60; // 设置宇宙半径
  
  // 创建扰动映射，确保每个天体使用相同的扰动值
  const bodyJitterMap = new Map<number, THREE.Vector3>();
  
  // 按照天体类型对歌曲进行分组
  const yangBodies = songs.filter(song => 
    ['star', 'comet', 'planet'].includes(song.celestialBody.type)
  );
  
  const yinBodies = songs.filter(song => 
    ['moon', 'blackhole', 'nebula'].includes(song.celestialBody.type)
  );
  
  // 合并所有天体，阳在前，阴在后
  const allBodies = [...yangBodies, ...yinBodies];
  
  // 创建天体并按太极形状分布
  allBodies.forEach((song, index) => {
    const body = song.celestialBody;
    const options = {
      color: body.color,
      size: body.size
    };
    
    let celestialBody: THREE.Object3D | null = null;
    
    // 根据类型创建不同的天体
    switch(body.type) {
      case 'planet':
        celestialBody = createPlanet(options);
        break;
      case 'star': 
        celestialBody = createStar(options);
        break;
      case 'blackhole':
        celestialBody = createBlackHole(options);
        break;
      case 'moon':
        celestialBody = createMoon(options);
        break;
      case 'comet':
        celestialBody = createComet(options);
        break;
      case 'nebula':
        celestialBody = createNebula(options);
        break;
      default:
        celestialBody = createPlanet(options);
    }
    
    if (celestialBody) {
      // 按照太极形状分布天体
      const position = getTaijiPosition(index, allBodies.length, universeRadius, bodyJitterMap);
      celestialBody.position.copy(position);
      
      // 根据阴阳设置不同的旋转，但彗星不应该自转
      if (body.type !== 'comet') {  // 彗星不自转
        if (index < yangBodies.length) {
          // 阳天体顺时针缓慢旋转
          celestialBody.userData.rotation = new THREE.Vector3(0, 1, 0);
          celestialBody.userData.rotationSpeed = 0.03; // 大幅提高旋转速度
        } else {
          // 阴天体逆时针缓慢旋转
          celestialBody.userData.rotation = new THREE.Vector3(0, -1, 0);
          celestialBody.userData.rotationSpeed = 0.03; // 大幅提高旋转速度
        }
      } else {
        // 彗星应该保持尾部指向，不自转
        celestialBody.userData.rotation = null;
        celestialBody.userData.rotationSpeed = 0;
      }
      
      // 保存歌曲信息
      celestialBody.userData.song = song;
      
      // 添加到场景
      scene.add(celestialBody);
      celestialBodies.push(celestialBody);
      
      // 创建并添加歌曲名称标签
      const songLabel = createTextSprite(song.title, body.color);
      songLabel.position.copy(position);
      // 将标签位置设在天体上方
      songLabel.position.y += body.size * 3;
      scene.add(songLabel);
      // 在标签上保存对应的天体引用，用于后续更新位置
      songLabel.userData.celestialBody = celestialBody;
      songLabels.push(songLabel);
    }
  });
  
  console.log(`已创建 ${celestialBodies.length} 个天体和标签，按立体太极形状排列`);
}

// 创建音乐播放器容器
function createMusicPlayer() {
  // 创建一个div来放置音乐播放器，放在右上角
  const musicPlayerContainer = document.createElement('div');
  musicPlayerContainer.id = 'music-player-container';
  musicPlayerContainer.style.position = 'fixed';
  musicPlayerContainer.style.top = '20px';
  musicPlayerContainer.style.right = '20px';
  musicPlayerContainer.style.zIndex = '1000';
  musicPlayerContainer.style.width = '330px';
  musicPlayerContainer.style.height = '86px';
  musicPlayerContainer.style.opacity = '0.5'; // 设置透明度为0.5
  document.body.appendChild(musicPlayerContainer);
  
  // 添加当前播放信息
  const musicInfo = document.createElement('div');
  musicInfo.id = 'music-info';
  musicInfo.style.position = 'fixed';
  musicInfo.style.top = '110px'; // 放在播放器下方
  musicInfo.style.right = '20px';
  musicInfo.style.color = 'white';
  musicInfo.style.fontFamily = 'Arial, sans-serif';
  musicInfo.style.fontSize = '14px';
  musicInfo.style.padding = '5px 10px';
  musicInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  musicInfo.style.borderRadius = '5px';
  musicInfo.style.textShadow = '0 0 5px black';
  musicInfo.textContent = '点击星体播放音乐';
  document.body.appendChild(musicInfo);
  
  console.log('音乐播放器已创建');
}

// 播放或切换音乐
function playRandomMusic() {
  const musicPlayerContainer = document.getElementById('music-player-container');
  const musicInfo = document.getElementById('music-info');
  
  if (!musicPlayerContainer || !musicInfo) return;
  
  // 清空当前播放器
  musicPlayerContainer.innerHTML = '';
  
  // 随机选择不同于当前播放的音乐
  let newMusicIndex;
  do {
    newMusicIndex = Math.floor(Math.random() * musicList.length);
  } while (newMusicIndex === currentPlayingMusic && musicList.length > 1);
  
  currentPlayingMusic = newMusicIndex;
  
  // 创建iframe - 依赖网易云音乐的auto=1参数自动播放音乐
  const iframe = document.createElement('iframe');
  iframe.setAttribute('frameborder', 'no');
  iframe.setAttribute('border', '0');
  iframe.setAttribute('marginwidth', '0');
  iframe.setAttribute('marginheight', '0');
  iframe.width = '330';
  iframe.height = '86';
  iframe.src = musicList[currentPlayingMusic];
  iframe.id = 'music-iframe';
  
  // 添加到容器
  musicPlayerContainer.appendChild(iframe);
  
  // 更新信息
  musicInfo.textContent = `正在播放音乐 ${currentPlayingMusic + 1}/${musicList.length}`;
  
  console.log(`正在播放音乐 ${currentPlayingMusic + 1}`);
}

// 设置射线检测器用于检测点击
function setupRaycaster() {
  // 初始化射线检测器和鼠标向量
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  
  // 添加点击事件监听
  window.addEventListener('click', onDocumentClick, false);
  
  console.log('射线检测器已设置');
}

// 处理点击事件
function onDocumentClick(event: MouseEvent) {
  // 计算鼠标位置的归一化设备坐标 (-1 到 +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  
  // 使用相机和鼠标位置更新射线
  raycaster.setFromCamera(mouse, camera);
  
  // 计算射线和天体的交叉点
  const intersects = raycaster.intersectObjects(celestialBodies);
  
  // 如果有交叉点，则选择第一个
  if (intersects.length > 0) {
    const selectedObject = intersects[0].object;
    
    // 处理层级模型（如果对象是一个组）
    let celestialBodyObject = selectedObject;
    while (celestialBodyObject.parent && !celestialBodies.includes(celestialBodyObject)) {
      celestialBodyObject = celestialBodyObject.parent;
    }
    
    // 如果找到有效的天体对象
    if (celestialBodies.includes(celestialBodyObject)) {
      // 播放音乐
      playRandomMusic();
      
      // 高亮选中的天体（可选）
      highlightCelestialBody(celestialBodyObject);
    }
  }
}

// 高亮选中的天体
function highlightCelestialBody(celestialBody: THREE.Object3D) {
  // 如果之前有选中的天体，恢复其原始比例
  if (currentCelestialBody && currentCelestialBody !== celestialBody) {
    currentCelestialBody.scale.set(1, 1, 1);
  }
  
  // 设置新选中的天体
  currentCelestialBody = celestialBody;
  
  // 稍微放大以示高亮
  celestialBody.scale.set(1.2, 1.2, 1.2);
  
  // 5秒后恢复原始大小
  setTimeout(() => {
    if (currentCelestialBody === celestialBody) {
      celestialBody.scale.set(1, 1, 1);
      currentCelestialBody = null;
    }
  }, 5000);
}

// 启动应用
init();
animate();
