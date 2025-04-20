import * as THREE from 'three';

// 创建星云样式
export function createNebula(body: any): THREE.Group {
  const nebulaSize = body.size || 4.0;
  const nebulaGroup = new THREE.Group();
  
  // 获取基础颜色，默认为紫色
  const baseColor = body.color ? new THREE.Color(body.color) : new THREE.Color(0x8a2be2);
  const hsl = { h: 0, s: 0, l: 0 };
  baseColor.getHSL(hsl);
  
  // 创建多个粒子层，每层有不同特性
  createDenseCore();
  createOuterLayer();
  createFineDustLayer();
  createStars();
  createGlow();
  
  // 1. 创建密集核心层
  function createDenseCore() {
    const particlesCount = 15000;
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesPositions = new Float32Array(particlesCount * 3);
    const particlesColors = new Float32Array(particlesCount * 3);
    const particlesSizes = new Float32Array(particlesCount);
    
    // 核心使用更密集的分布
    for (let i = 0; i < particlesCount; i++) {
      // 使用更加集中的分布
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.acos(2 * Math.random() - 1);
      
      // 核心区粒子分布 - 使用立方根分布，更加集中
      const radius = Math.pow(Math.random(), 0.33) * nebulaSize * 0.7;
      
      // 椭球参数 - 扁平一些
      const a = 1.0;
      const b = 0.8;
      const c = 0.6;
      
      const x = radius * Math.sin(theta) * Math.cos(phi) * a;
      const y = radius * Math.sin(theta) * Math.sin(phi) * b;
      const z = radius * Math.cos(theta) * c;
      
      particlesPositions[i * 3] = x;
      particlesPositions[i * 3 + 1] = y;
      particlesPositions[i * 3 + 2] = z;
      
      // 核心粒子略小，但更密集
      const distanceFromCenter = Math.sqrt(x*x + y*y + z*z);
      const normalizedDistance = distanceFromCenter / (nebulaSize * 0.7);
      particlesSizes[i] = 0.12 * (1.0 - normalizedDistance * 0.7);
      
      // 核心颜色更亮，更饱和
      const coreColor = new THREE.Color().setHSL(
        hsl.h,
        Math.min(1, hsl.s * (1.2 - normalizedDistance * 0.3)),
        Math.min(1, hsl.l * (1.5 - normalizedDistance * 0.5))
      );
      
      particlesColors[i * 3] = coreColor.r;
      particlesColors[i * 3 + 1] = coreColor.g;
      particlesColors[i * 3 + 2] = coreColor.b;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(particlesColors, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(particlesSizes, 1));
    
    const particlesMaterial = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: createCircleTexture(true) }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        
        void main() {
          gl_FragColor = vec4(vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    particles.userData.rotationSpeed = 0.0003;
    nebulaGroup.add(particles);
  }
  
  // 2. 创建外层
  function createOuterLayer() {
    const particlesCount = 20000;
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesPositions = new Float32Array(particlesCount * 3);
    const particlesColors = new Float32Array(particlesCount * 3);
    const particlesSizes = new Float32Array(particlesCount);
    
    // 外层分布
    for (let i = 0; i < particlesCount; i++) {
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.acos(2 * Math.random() - 1);
      
      // 分布范围稍大
      const radius = (0.3 + Math.pow(Math.random(), 0.7) * 0.7) * nebulaSize;
      
      // 更加扁平的椭球
      const a = 1.0;
      const b = 0.75;
      const c = 0.5;
      
      const x = radius * Math.sin(theta) * Math.cos(phi) * a;
      const y = radius * Math.sin(theta) * Math.sin(phi) * b;
      const z = radius * Math.cos(theta) * c;
      
      // 添加一些随机扰动，使形状更自然
      const jitter = 0.1;
      const jitterX = (Math.random() - 0.5) * jitter * radius;
      const jitterY = (Math.random() - 0.5) * jitter * radius;
      const jitterZ = (Math.random() - 0.5) * jitter * radius;
      
      particlesPositions[i * 3] = x + jitterX;
      particlesPositions[i * 3 + 1] = y + jitterY;
      particlesPositions[i * 3 + 2] = z + jitterZ;
      
      // 大小变化
      const distanceFromCenter = Math.sqrt(x*x + y*y + z*z);
      const normalizedDistance = distanceFromCenter / nebulaSize;
      
      // 外层粒子略大
      particlesSizes[i] = 0.18 * (1.0 - normalizedDistance * 0.6) * (0.7 + Math.random() * 0.6);
      
      // 外层颜色 - 稍微添加一些色相变化
      const hueShift = (Math.random() * 0.1 - 0.05 + 1) % 1;
      const outerColor = new THREE.Color().setHSL(
        (hsl.h + hueShift) % 1.0,
        Math.min(1, hsl.s * (0.8 + Math.random() * 0.4 - normalizedDistance * 0.2)),
        Math.min(1, Math.max(0.2, hsl.l * (0.7 + Math.random() * 0.3) * (1.0 - normalizedDistance * 0.5)))
      );
      
      particlesColors[i * 3] = outerColor.r;
      particlesColors[i * 3 + 1] = outerColor.g;
      particlesColors[i * 3 + 2] = outerColor.b;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(particlesColors, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(particlesSizes, 1));
    
    const particlesMaterial = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: createCircleTexture(false) }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        
        void main() {
          gl_FragColor = vec4(vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    particles.userData.rotationSpeed = 0.0002;
    particles.userData.rotationOffset = Math.PI / 6; // 稍微偏离核心的旋转轴
    particles.rotation.x = particles.userData.rotationOffset;
    nebulaGroup.add(particles);
  }
  
  // 3. 创建细小尘埃层 - 添加细节
  function createFineDustLayer() {
    const particlesCount = 10000;
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesPositions = new Float32Array(particlesCount * 3);
    const particlesColors = new Float32Array(particlesCount * 3);
    const particlesSizes = new Float32Array(particlesCount);
    
    // 尘埃分布 - 更广泛
    for (let i = 0; i < particlesCount; i++) {
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.acos(2 * Math.random() - 1);
      
      // 尘埃扩散到更大范围
      const radiusMin = nebulaSize * 0.6;
      const radiusMax = nebulaSize * 1.3;
      const radius = radiusMin + Math.random() * (radiusMax - radiusMin);
      
      // 非常扁平的分布
      const a = 1.0;
      const b = 0.8;
      const c = 0.3;
      
      const x = radius * Math.sin(theta) * Math.cos(phi) * a;
      const y = radius * Math.sin(theta) * Math.sin(phi) * b;
      const z = radius * Math.cos(theta) * c;
      
      // 添加大量随机扰动，形成尘埃状
      const turbulence = 0.3;
      const tx = (Math.random() - 0.5) * turbulence * radius;
      const ty = (Math.random() - 0.5) * turbulence * radius;
      const tz = (Math.random() - 0.5) * turbulence * radius;
      
      particlesPositions[i * 3] = x + tx;
      particlesPositions[i * 3 + 1] = y + ty;
      particlesPositions[i * 3 + 2] = z + tz;
      
      // 尘埃粒子非常小
      particlesSizes[i] = 0.08 * (0.5 + Math.random() * 0.5);
      
      // 尘埃颜色 - 非常接近基础色，但透明度高
      const dustColor = new THREE.Color().setHSL(
        (hsl.h + Math.random() * 0.15 - 0.075) % 1.0,
        Math.min(0.7, hsl.s * (0.6 + Math.random() * 0.4)),
        Math.min(0.8, hsl.l * (0.6 + Math.random() * 0.4))
      );
      
      particlesColors[i * 3] = dustColor.r;
      particlesColors[i * 3 + 1] = dustColor.g;
      particlesColors[i * 3 + 2] = dustColor.b;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(particlesColors, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(particlesSizes, 1));
    
    const particlesMaterial = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: createSoftDustTexture() }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        
        void main() {
          gl_FragColor = vec4(vColor, 0.7) * texture2D(pointTexture, gl_PointCoord);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    particles.userData.rotationSpeed = 0.0001;
    particles.userData.rotationOffset = -Math.PI / 8; // 与主要旋转轴略有不同
    particles.rotation.x = particles.userData.rotationOffset;
    particles.rotation.z = Math.PI / 10; // 再添加一个轴的旋转
    nebulaGroup.add(particles);
  }
  
  // 4. 创建星星
  function createStars() {
    const starsCount = 300; // 更多星星
    const starsGeometry = new THREE.BufferGeometry();
    const starsPositions = new Float32Array(starsCount * 3);
    const starsSizes = new Float32Array(starsCount);
    const starsColors = new Float32Array(starsCount * 3);
    
    for (let i = 0; i < starsCount; i++) {
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.acos(2 * Math.random() - 1);
      
      // 星星分布在更广的范围
      const radius = nebulaSize * (0.5 + Math.random() * 1.5);
      
      starsPositions[i * 3] = radius * Math.sin(theta) * Math.cos(phi);
      starsPositions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
      starsPositions[i * 3 + 2] = radius * Math.cos(theta);
      
      // 星星大小变化
      starsSizes[i] = 0.04 + Math.random() * 0.08;
      
      // 星星颜色 - 从白色到蓝色或黄色
      const starColorType = Math.random();
      let starColor;
      
      if (starColorType < 0.5) {
        // 白色星星
        starColor = new THREE.Color(0xffffff);
      } else if (starColorType < 0.8) {
        // 淡蓝色星星
        starColor = new THREE.Color(0xadd8e6);
      } else {
        // 淡黄色星星
        starColor = new THREE.Color(0xffefd5);
      }
      
      starsColors[i * 3] = starColor.r;
      starsColors[i * 3 + 1] = starColor.g;
      starsColors[i * 3 + 2] = starColor.b;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(starsSizes, 1));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(starsColors, 3));
    
    // 使用着色器材质创建星星闪烁效果
    const starsMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pointTexture: { value: createStarTexture() }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        uniform float time;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          
          // 添加闪烁效果
          float flickerSpeed = abs(sin(fract(position.x * 23.14159 + position.z) * 3.14159)) * 5.0;
          float flicker = sin(time * flickerSpeed) * 0.5 + 0.5;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (1.0 + flicker * 0.3) * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        
        void main() {
          vec4 texColor = texture2D(pointTexture, gl_PointCoord);
          gl_FragColor = vec4(vColor, 1.0) * texColor;
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    nebulaGroup.add(stars);
  }
  
  // 5. 创建整体辉光效果
  function createGlow() {
    const glowGeometry = new THREE.SphereGeometry(nebulaSize * 0.9, 32, 24);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(baseColor).multiplyScalar(0.8) }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          // 从中心向外渐变
          float intensity = pow(0.8 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(color, intensity * 0.25);
        }
      `,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    nebulaGroup.add(glow);
  }
  
  // 创建圆形纹理用于核心粒子
  function createCircleTexture(bright: boolean) {
    const canvas = document.createElement('canvas');
    const size = 128;
    canvas.width = size;
    canvas.height = size;
    
    const context = canvas.getContext('2d');
    if (!context) return new THREE.Texture();
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;
    
    // 亮区更大或更小
    const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    if (bright) {
      // 核心粒子 - 中心更亮，边缘更柔和
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    } else {
      // 外层粒子 - 更柔和的过渡
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)');
      gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.1)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    }
    
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2, false);
    context.fill();
    
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
  
  // 创建软尘埃纹理
  function createSoftDustTexture() {
    const canvas = document.createElement('canvas');
    const size = 64;
    canvas.width = size;
    canvas.height = size;
    
    const context = canvas.getContext('2d');
    if (!context) return new THREE.Texture();
    
    const centerX = size / 2;
    const centerY = size / 2;
    
    // 创建不规则形状
    context.fillStyle = 'white';
    context.fillRect(0, 0, size, size);
    
    // 创建噪点透明度
    const imageData = context.getImageData(0, 0, size, size);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % size;
      const y = Math.floor((i / 4) / size);
      
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 根据距离和一些随机性设置透明度
      let alpha = 0;
      if (distance < size / 2) {
        alpha = Math.max(0, 1 - distance / (size / 2));
        alpha *= alpha; // 平方使边缘更柔和
        alpha *= 0.3 + Math.random() * 0.7; // 添加随机性
        alpha = Math.min(1, alpha);
      }
      
      data[i + 3] = Math.floor(alpha * 255);
    }
    
    context.putImageData(imageData, 0, 0);
    
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
  
  // 创建星星纹理
  function createStarTexture() {
    const canvas = document.createElement('canvas');
    const size = 64;
    canvas.width = size;
    canvas.height = size;
    
    const context = canvas.getContext('2d');
    if (!context) return new THREE.Texture();
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 4;
    
    // 创建星星中心
    const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2, false);
    context.fill();
    
    // 添加十字光芒
    context.globalCompositeOperation = 'lighten';
    
    // 水平光芒
    const grd1 = context.createLinearGradient(0, centerY, size, centerY);
    grd1.addColorStop(0, 'rgba(255, 255, 255, 0)');
    grd1.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
    grd1.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    context.fillStyle = grd1;
    context.fillRect(0, centerY - 1, size, 2);
    
    // 垂直光芒
    const grd2 = context.createLinearGradient(centerX, 0, centerX, size);
    grd2.addColorStop(0, 'rgba(255, 255, 255, 0)');
    grd2.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
    grd2.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    context.fillStyle = grd2;
    context.fillRect(centerX - 1, 0, 2, size);
    
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
  
  // 设置整体旋转参数
  nebulaGroup.userData.rotationSpeed = 0.01;
  nebulaGroup.userData.rotationAxis = new THREE.Vector3(0.2, 1, 0.3).normalize();
  
  // 动画更新函数
  nebulaGroup.userData.update = function(delta: number) {
    const time = Date.now() * 0.001;
    
    // 更新各个粒子系统的旋转
    nebulaGroup.children.forEach(child => {
      if (child instanceof THREE.Points && child.userData.rotationSpeed) {
        // 给不同的粒子系统添加不同方向的旋转
        child.rotation.x += child.userData.rotationSpeed * delta * 0.5;
        child.rotation.y += child.userData.rotationSpeed * delta;
        child.rotation.z += child.userData.rotationSpeed * delta * 0.2;
      }
      
      // 更新星星闪烁
      if ('material' in child && child.material instanceof THREE.ShaderMaterial && 
          child.material.uniforms && 
          child.material.uniforms.time) {
        child.material.uniforms.time.value = time;
      }
    });
    
    // 整体轻微的呼吸效果
    const pulseFactor = Math.sin(time * 0.2) * 0.03 + 1.0;
    nebulaGroup.scale.set(pulseFactor, pulseFactor, pulseFactor);
    
    // 整体旋转
    nebulaGroup.rotation.set(
      nebulaGroup.rotation.x + nebulaGroup.userData.rotationSpeed * delta * nebulaGroup.userData.rotationAxis.x,
      nebulaGroup.rotation.y + nebulaGroup.userData.rotationSpeed * delta * nebulaGroup.userData.rotationAxis.y, 
      nebulaGroup.rotation.z + nebulaGroup.userData.rotationSpeed * delta * nebulaGroup.userData.rotationAxis.z
    );
  };
  
  return nebulaGroup;
}
