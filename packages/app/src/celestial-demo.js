// 天体样式演示脚本
let scene, camera, renderer, controls;
let currentCelestialBody = null;
let currentType = 'planet';
let currentColor = '#3498db';
let currentSize = 1.0;
let hasRings = true;
let hasGlow = true;
let hasParticles = true;

// 颜色选项
const colors = [
  { name: '蓝色', value: '#3498db' },
  { name: '红色', value: '#e74c3c' },
  { name: '绿色', value: '#2ecc71' },
  { name: '黄色', value: '#f1c40f' },
  { name: '紫色', value: '#9b59b6' },
  { name: '橙色', value: '#e67e22' },
  { name: '青色', value: '#1abc9c' },
  { name: '白色', value: '#ecf0f1' }
];

// 初始化场景
function init() {
  try {
    // 更新调试信息
    updateDebug('初始化场景...');
    
    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    // 创建相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 10;
    
    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    updateDebug('渲染器创建完成，添加到DOM中');
    
    // 添加轨道控制
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // 添加灯光
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    updateDebug('添加灯光完成');
    
    // 创建星空背景
    createStarBackground();
    
    // 初始化控制面板
    initControlPanel();
    
    updateDebug('控制面板初始化完成');
    
    // 创建初始天体
    createCelestialBody();
    
    updateDebug('初始天体创建完成，开始动画循环');
    
    // 启动动画循环
    animate();
    
    // 添加窗口调整事件
    window.addEventListener('resize', onWindowResize);

    // 更新调试信息
    updateDebug('初始化完成，如果您看不到3D内容，请查看控制台错误');
  } catch (error) {
    console.error('初始化错误:', error);
    updateDebug('初始化错误: ' + error.message);
  }
}

// 更新调试信息
function updateDebug(message) {
  const debugInfo = document.getElementById('debug-info');
  if (debugInfo) {
    debugInfo.textContent = message;
    console.log(message);
  }
}

// 创建星空背景
function createStarBackground() {
  try {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true
    });
    
    const starsVertices = [];
    for (let i = 0; i < 2000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);
    
    updateDebug('星空背景创建完成');
  } catch (error) {
    console.error('创建星空背景错误:', error);
    updateDebug('创建星空背景错误: ' + error.message);
  }
}

// 初始化控制面板
function initControlPanel() {
  try {
    // 天体类型按钮
    document.getElementById('btn-planet').addEventListener('click', () => {
      setActiveButton('btn-planet');
      currentType = 'planet';
      createCelestialBody();
    });
    
    document.getElementById('btn-star').addEventListener('click', () => {
      setActiveButton('btn-star');
      currentType = 'star';
      createCelestialBody();
    });
    
    document.getElementById('btn-blackhole').addEventListener('click', () => {
      setActiveButton('btn-blackhole');
      currentType = 'blackhole';
      createCelestialBody();
    });
    
    // 颜色选择器
    const colorPalette = document.getElementById('color-palette');
    colors.forEach(color => {
      const colorOption = document.createElement('div');
      colorOption.className = 'color-option';
      colorOption.style.backgroundColor = color.value;
      colorOption.title = color.name;
      colorOption.addEventListener('click', () => {
        document.querySelectorAll('.color-option').forEach(el => el.classList.remove('active'));
        colorOption.classList.add('active');
        currentColor = color.value;
        createCelestialBody();
      });
      
      if (color.value === currentColor) {
        colorOption.classList.add('active');
      }
      
      colorPalette.appendChild(colorOption);
    });
    
    // 大小滑块
    const sizeSlider = document.getElementById('size-slider');
    const sizeValue = document.getElementById('size-value');
    
    sizeSlider.addEventListener('input', () => {
      currentSize = parseFloat(sizeSlider.value);
      sizeValue.textContent = currentSize.toFixed(1);
      createCelestialBody();
    });
    
    // 特效切换
    document.getElementById('toggle-rings').addEventListener('click', () => {
      hasRings = !hasRings;
      toggleActiveState('toggle-rings', hasRings);
      createCelestialBody();
    });
    
    document.getElementById('toggle-glow').addEventListener('click', () => {
      hasGlow = !hasGlow;
      toggleActiveState('toggle-glow', hasGlow);
      createCelestialBody();
    });
    
    document.getElementById('toggle-particles').addEventListener('click', () => {
      hasParticles = !hasParticles;
      toggleActiveState('toggle-particles', hasParticles);
      createCelestialBody();
    });
    
    // 设置初始状态
    toggleActiveState('toggle-rings', hasRings);
    toggleActiveState('toggle-glow', hasGlow);
    toggleActiveState('toggle-particles', hasParticles);
  } catch (error) {
    console.error('初始化控制面板错误:', error);
    updateDebug('初始化控制面板错误: ' + error.message);
  }
}

// 设置按钮激活状态
function setActiveButton(id) {
  const buttons = document.querySelectorAll('.control-group button');
  buttons.forEach(button => {
    if (button.id === id) {
      button.classList.add('active');
    } else if (button.id.startsWith('btn-')) {
      button.classList.remove('active');
    }
  });
}

// 切换按钮激活状态
function toggleActiveState(id, isActive) {
  const button = document.getElementById(id);
  if (button) {
    if (isActive) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  }
}

// 创建天体
function createCelestialBody() {
  try {
    // 如果已存在天体，则移除
    if (currentCelestialBody) {
      scene.remove(currentCelestialBody);
    }
    
    // 创建天体选项
    const options = {
      color: currentColor,
      size: currentSize,
      hasRings: hasRings,
      hasGlow: hasGlow,
      hasParticles: hasParticles
    };
    
    // 根据当前类型创建对应天体
    switch (currentType) {
      case 'planet':
        currentCelestialBody = createPlanet(options);
        updateDebug(`创建行星: 大小=${options.size}, 颜色=${options.color}`);
        break;
      case 'star':
        currentCelestialBody = createStar(options);
        updateDebug(`创建恒星: 大小=${options.size}, 颜色=${options.color}`);
        break;
      case 'blackhole':
        currentCelestialBody = createBlackHole(options);
        updateDebug(`创建黑洞: 大小=${options.size}, 颜色=${options.color}`);
        break;
    }
    
    // 添加到场景
    scene.add(currentCelestialBody);
  } catch (error) {
    console.error('创建天体错误:', error);
    updateDebug('创建天体错误: ' + error.message);
  }
}

// 创建行星
function createPlanet(options) {
  try {
    const planetGroup = new THREE.Group();
    
    // 行星主体
    const planetGeometry = new THREE.SphereGeometry(options.size, 32, 32);
    const planetMaterial = new THREE.MeshPhongMaterial({ 
      color: new THREE.Color(options.color),
      shininess: 10,
      flatShading: false
    });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    planetGroup.add(planet);
    
    // 行星大气层（发光效果）
    if (options.hasGlow) {
      const atmosphereGeometry = new THREE.SphereGeometry(options.size * 1.05, 32, 32);
      const atmosphereMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(options.color),
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
      });
      const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      planetGroup.add(atmosphere);
    }
    
    // 行星环
    if (options.hasRings) {
      const ringGeometry = new THREE.RingGeometry(
        options.size * 1.5, 
        options.size * 2.5, 
        64
      );
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(options.color),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      planetGroup.add(ring);
    }
    
    // 行星表面细节（使用额外的网格）
    const surfaceDetailsGeometry = new THREE.SphereGeometry(options.size * 1.001, 32, 32);
    const surfaceDetailsMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(options.color).offsetHSL(0, 0, 0.1),
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const surfaceDetails = new THREE.Mesh(surfaceDetailsGeometry, surfaceDetailsMaterial);
    planetGroup.add(surfaceDetails);
    
    // 粒子效果
    if (options.hasParticles) {
      // 行星周围的粒子
      const particlesCount = 500;
      const particlesGeometry = new THREE.BufferGeometry();
      const particlesPositions = new Float32Array(particlesCount * 3);
      
      for (let i = 0; i < particlesCount; i++) {
        const radius = options.size * (1.1 + Math.random() * 0.3);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        particlesPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        particlesPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        particlesPositions[i * 3 + 2] = radius * Math.cos(phi);
      }
      
      particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlesPositions, 3));
      
      const particlesMaterial = new THREE.PointsMaterial({
        color: new THREE.Color(options.color),
        size: 0.05,
        transparent: true,
        opacity: 0.7
      });
      
      const particles = new THREE.Points(particlesGeometry, particlesMaterial);
      planetGroup.add(particles);
    }
    
    // 添加自转
    planetGroup.userData.rotationSpeed = 0.005;
    planetGroup.userData.rotationAxis = new THREE.Vector3(0.1, 1, 0.1).normalize();
    
    return planetGroup;
  } catch (error) {
    console.error('创建行星错误:', error);
    updateDebug('创建行星错误: ' + error.message);
    return new THREE.Group(); // 返回空组避免报错
  }
}

// 创建恒星
function createStar(options) {
  try {
    const starGroup = new THREE.Group();
    
    // 恒星核心
    const coreGeometry = new THREE.SphereGeometry(options.size, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({ 
      color: new THREE.Color(options.color)
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    starGroup.add(core);
    
    // 恒星发光效果
    if (options.hasGlow) {
      // 内层发光
      const innerGlowGeometry = new THREE.SphereGeometry(options.size * 1.2, 32, 32);
      const innerGlowMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(options.color),
        transparent: true,
        opacity: 0.4,
        side: THREE.BackSide
      });
      const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
      starGroup.add(innerGlow);
      
      // 外层发光
      const outerGlowGeometry = new THREE.SphereGeometry(options.size * 1.5, 32, 32);
      const outerGlowMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(options.color),
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
      });
      const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
      starGroup.add(outerGlow);
    }
    
    // 恒星日冕
    if (options.hasRings) {
      const coronaRays = 16;
      
      for (let i = 0; i < coronaRays; i++) {
        const angle = (i / coronaRays) * Math.PI * 2;
        const length = options.size * (1 + Math.random() * 1.5);
        const width = options.size * 0.1;
        
        const rayGeometry = new THREE.PlaneGeometry(width, length);
        const rayMaterial = new THREE.MeshBasicMaterial({
          color: new THREE.Color(options.color),
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide
        });
        
        const ray = new THREE.Mesh(rayGeometry, rayMaterial);
        
        // 设置射线位置与旋转
        ray.position.x = Math.cos(angle) * options.size;
        ray.position.y = Math.sin(angle) * options.size;
        ray.rotation.z = angle;
        
        starGroup.add(ray);
      }
    }
    
    // 恒星粒子效果
    if (options.hasParticles) {
      const particlesCount = 2000;
      const particlesGeometry = new THREE.BufferGeometry();
      const particlesPositions = new Float32Array(particlesCount * 3);
      
      for (let i = 0; i < particlesCount; i++) {
        const radius = options.size * (1 + Math.random() * 1);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        particlesPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        particlesPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        particlesPositions[i * 3 + 2] = radius * Math.cos(phi);
      }
      
      particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlesPositions, 3));
      
      const particlesMaterial = new THREE.PointsMaterial({
        color: new THREE.Color(options.color),
        size: 0.08,
        transparent: true,
        opacity: 0.7
      });
      
      const particles = new THREE.Points(particlesGeometry, particlesMaterial);
      starGroup.add(particles);
    }
    
    // 添加脉冲效果
    starGroup.userData.pulseSpeed = 2;
    starGroup.userData.pulseTime = 0;
    
    // 缓慢自转
    starGroup.userData.rotationSpeed = 0.002;
    
    return starGroup;
  } catch (error) {
    console.error('创建恒星错误:', error);
    updateDebug('创建恒星错误: ' + error.message);
    return new THREE.Group(); // 返回空组避免报错
  }
}

// 创建黑洞
function createBlackHole(options) {
  try {
    const blackHoleGroup = new THREE.Group();
    
    // 黑洞事件视界
    const coreSize = options.size * 0.7;
    const coreGeometry = new THREE.SphereGeometry(coreSize, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x000000,
      transparent: false
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    blackHoleGroup.add(core);
    
    // 黑洞引力透镜效果
    if (options.hasGlow) {
      const lensGeometry = new THREE.SphereGeometry(coreSize * 1.3, 32, 32);
      const lensMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.7,
        side: THREE.BackSide
      });
      const lens = new THREE.Mesh(lensGeometry, lensMaterial);
      blackHoleGroup.add(lens);
      
      // 扭曲效果的外层
      const distortionGeometry = new THREE.SphereGeometry(coreSize * 1.8, 32, 32);
      const distortionMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(options.color).offsetHSL(0, -0.5, -0.7),
        wireframe: true,
        transparent: true,
        opacity: 0.2
      });
      const distortion = new THREE.Mesh(distortionGeometry, distortionMaterial);
      blackHoleGroup.add(distortion);
    }
    
    // 吸积盘
    if (options.hasRings) {
      const diskGeometry = new THREE.RingGeometry(
        options.size * 0.9, 
        options.size * 3, 
        64, 
        8
      );
      
      // 使用顶点颜色，创建吸积盘的温度渐变
      const diskPositions = diskGeometry.attributes.position;
      const diskColors = [];
      
      // 内部偏白/蓝，外部偏红/橙
      const innerColor = new THREE.Color(0xffffff);
      const outerColor = new THREE.Color(options.color);
      
      for (let i = 0; i < diskPositions.count; i++) {
        const vertex = new THREE.Vector3();
        vertex.fromBufferAttribute(diskPositions, i);
        
        // 计算到中心的距离比例
        const distanceRatio = (vertex.length() - options.size * 0.9) / (options.size * 2.1);
        
        // 基于距离比例混合颜色
        const color = new THREE.Color().lerpColors(innerColor, outerColor, distanceRatio);
        
        diskColors.push(color.r, color.g, color.b);
      }
      
      diskGeometry.setAttribute('color', new THREE.Float32BufferAttribute(diskColors, 3));
      
      const diskMaterial = new THREE.MeshBasicMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      
      const disk = new THREE.Mesh(diskGeometry, diskMaterial);
      disk.rotation.x = Math.PI / 2;
      blackHoleGroup.add(disk);
    }
    
    // 粒子效果
    if (options.hasParticles) {
      // 吸积盘粒子
      const particlesCount = 3000;
      const particlesGeometry = new THREE.BufferGeometry();
      const particlesPositions = new Float32Array(particlesCount * 3);
      const particlesColors = new Float32Array(particlesCount * 3);
      
      const innerColor = new THREE.Color(0xffffff);
      const outerColor = new THREE.Color(options.color);
      
      for (let i = 0; i < particlesCount; i++) {
        // 随机角度
        const angle = Math.random() * Math.PI * 2;
        // 在吸积盘半径范围内的随机距离
        const distance = options.size * 0.9 + Math.random() * options.size * 2.1;
        // 轻微垂直偏移
        const heightVariation = (Math.random() - 0.5) * options.size * 0.1;
        
        particlesPositions[i * 3] = Math.cos(angle) * distance;
        particlesPositions[i * 3 + 1] = heightVariation;
        particlesPositions[i * 3 + 2] = Math.sin(angle) * distance;
        
        // 颜色渐变
        const distanceRatio = (distance - options.size * 0.9) / (options.size * 2.1);
        const color = new THREE.Color().lerpColors(innerColor, outerColor, distanceRatio);
        
        particlesColors[i * 3] = color.r;
        particlesColors[i * 3 + 1] = color.g;
        particlesColors[i * 3 + 2] = color.b;
      }
      
      particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlesPositions, 3));
      particlesGeometry.setAttribute('color', new THREE.Float32BufferAttribute(particlesColors, 3));
      
      const particlesMaterial = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
      });
      
      const particles = new THREE.Points(particlesGeometry, particlesMaterial);
      blackHoleGroup.add(particles);
      
      // 引力射线
      const rayCount = 5;
      for (let i = 0; i < rayCount; i++) {
        const rayLength = options.size * (2 + Math.random() * 2);
        const rayGeometry = new THREE.CylinderGeometry(0.02, 0.1, rayLength, 8);
        const rayMaterial = new THREE.MeshBasicMaterial({
          color: new THREE.Color(options.color),
          transparent: true,
          opacity: 0.4
        });
        
        const ray = new THREE.Mesh(rayGeometry, rayMaterial);
        
        // 随机方向
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = Math.random() * Math.PI * 2;
        
        // 放置并旋转射线
        ray.position.setFromSphericalCoords(rayLength / 2, phi, theta);
        ray.lookAt(0, 0, 0);
        ray.rotateX(Math.PI / 2);
        
        blackHoleGroup.add(ray);
      }
    }
    
    // 设置自转
    blackHoleGroup.userData.rotationSpeed = 0.01;
    
    return blackHoleGroup;
  } catch (error) {
    console.error('创建黑洞错误:', error);
    updateDebug('创建黑洞错误: ' + error.message);
    return new THREE.Group(); // 返回空组避免报错
  }
}

// 动画循环
function animate() {
  try {
    requestAnimationFrame(animate);
    
    // 更新控制器
    if (controls) controls.update();
    
    // 旋转天体
    if (currentCelestialBody) {
      if (currentCelestialBody.userData.rotationSpeed) {
        if (currentCelestialBody.userData.rotationAxis) {
          currentCelestialBody.rotateOnAxis(
            currentCelestialBody.userData.rotationAxis,
            currentCelestialBody.userData.rotationSpeed
          );
        } else {
          currentCelestialBody.rotation.y += currentCelestialBody.userData.rotationSpeed;
        }
      }
      
      // 处理脉动效果
      if (currentCelestialBody.userData.pulseSpeed) {
        currentCelestialBody.userData.pulseTime = 
          (currentCelestialBody.userData.pulseTime || 0) + 0.01;
        
        const scale = 1 + Math.sin(currentCelestialBody.userData.pulseTime * 
                                 currentCelestialBody.userData.pulseSpeed) * 0.05;
        
        currentCelestialBody.scale.set(scale, scale, scale);
      }
    }
    
    // 渲染场景
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  } catch (error) {
    console.error('动画循环错误:', error);
    updateDebug('动画循环错误: ' + error.message);
  }
}

// 窗口大小调整
function onWindowResize() {
  try {
    if (camera && renderer) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
  } catch (error) {
    console.error('窗口调整错误:', error);
    updateDebug('窗口调整错误: ' + error.message);
  }
}

// 页面加载完成后初始化
window.addEventListener('load', init);
