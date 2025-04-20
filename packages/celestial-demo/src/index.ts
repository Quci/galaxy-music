import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createPlanet, createStar, createBlackHole, createMoon, createComet, createNeutronStar, createNebula, createGalaxy } from './styles/celestial-styles';

// 全局变量
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let currentCelestialBody: THREE.Group | null = null;
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
    document.getElementById('canvas-container')?.appendChild(renderer.domElement);
    
    updateDebug('渲染器创建完成，添加到DOM中');
    
    // 添加轨道控制
    controls = new OrbitControls(camera, renderer.domElement);
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
    updateDebug('初始化完成');
  } catch (error) {
    console.error('初始化错误:', error);
    updateDebug('初始化错误: ' + (error as Error).message);
  }
}

// 更新调试信息
function updateDebug(message: string) {
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
    updateDebug('创建星空背景错误: ' + (error as Error).message);
  }
}

// 初始化控制面板
function initControlPanel() {
  try {
    // 天体类型按钮
    document.getElementById('btn-planet')?.addEventListener('click', () => {
      setActiveButton('btn-planet');
      currentType = 'planet';
      createCelestialBody();
    });
    
    document.getElementById('btn-star')?.addEventListener('click', () => {
      setActiveButton('btn-star');
      currentType = 'star';
      createCelestialBody();
    });
    
    document.getElementById('btn-blackhole')?.addEventListener('click', () => {
      setActiveButton('btn-blackhole');
      currentType = 'blackhole';
      createCelestialBody();
    });
    
    // 新增天体类型按钮
    document.getElementById('btn-moon')?.addEventListener('click', () => {
      setActiveButton('btn-moon');
      currentType = 'moon';
      createCelestialBody();
    });
    
    document.getElementById('btn-comet')?.addEventListener('click', () => {
      setActiveButton('btn-comet');
      currentType = 'comet';
      createCelestialBody();
    });
    
    document.getElementById('btn-neutronstar')?.addEventListener('click', () => {
      setActiveButton('btn-neutronstar');
      currentType = 'neutronstar';
      createCelestialBody();
    });
    
    document.getElementById('btn-nebula')?.addEventListener('click', () => {
      setActiveButton('btn-nebula');
      currentType = 'nebula';
      createCelestialBody();
    });
    
    document.getElementById('btn-galaxy')?.addEventListener('click', () => {
      setActiveButton('btn-galaxy');
      currentType = 'galaxy';
      createCelestialBody();
    });
    
    // 颜色选择器
    const colorPalette = document.getElementById('color-palette');
    if (colorPalette) {
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
    }
    
    // 大小滑块
    const sizeSlider = document.getElementById('size-slider') as HTMLInputElement;
    const sizeValue = document.getElementById('size-value');
    
    if (sizeSlider && sizeValue) {
      sizeSlider.addEventListener('input', () => {
        currentSize = parseFloat(sizeSlider.value);
        sizeValue.textContent = currentSize.toFixed(1);
        createCelestialBody();
      });
    }
    
    // 特效切换
    document.getElementById('toggle-rings')?.addEventListener('click', () => {
      hasRings = !hasRings;
      toggleActiveState('toggle-rings', hasRings);
      createCelestialBody();
    });
    
    document.getElementById('toggle-glow')?.addEventListener('click', () => {
      hasGlow = !hasGlow;
      toggleActiveState('toggle-glow', hasGlow);
      createCelestialBody();
    });
    
    document.getElementById('toggle-particles')?.addEventListener('click', () => {
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
    updateDebug('初始化控制面板错误: ' + (error as Error).message);
  }
}

// 设置按钮激活状态
function setActiveButton(id: string) {
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
function toggleActiveState(id: string, isActive: boolean) {
  const button = document.getElementById(id);
  if (button) {
    if (isActive) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  }
}

// 创建天体选项接口
interface CelestialOptions {
  color: string;
  size: number;
  hasRings: boolean;
  hasGlow: boolean;
  hasParticles: boolean;
}

// 创建天体
function createCelestialBody() {
  try {
    // 如果已存在天体，则移除
    if (currentCelestialBody) {
      scene.remove(currentCelestialBody);
    }
    
    // 创建天体选项
    const options: CelestialOptions = {
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
      case 'moon':
        currentCelestialBody = createMoon(options);
        updateDebug(`创建月球: 大小=${options.size}, 颜色=${options.color}`);
        break;
      case 'comet':
        currentCelestialBody = createComet(options);
        updateDebug(`创建彗星: 大小=${options.size}, 颜色=${options.color}`);
        break;
      case 'neutronstar':
        currentCelestialBody = createNeutronStar(options);
        updateDebug(`创建中子星: 大小=${options.size}, 颜色=${options.color}`);
        break;
      case 'nebula':
        currentCelestialBody = createNebula(options);
        updateDebug(`创建星云: 大小=${options.size}, 颜色=${options.color}`);
        break;
      case 'galaxy':
        currentCelestialBody = createGalaxy(options);
        updateDebug(`创建星系: 大小=${options.size}, 颜色=${options.color}`);
        break;
    }
    
    // 添加到场景
    if (currentCelestialBody) {
      scene.add(currentCelestialBody);
    }
  } catch (error) {
    console.error('创建天体错误:', error);
    updateDebug('创建天体错误: ' + (error as Error).message);
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
    updateDebug('动画循环错误: ' + (error as Error).message);
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
    updateDebug('窗口调整错误: ' + (error as Error).message);
  }
}

// 页面加载完成后初始化
window.addEventListener('load', init);
