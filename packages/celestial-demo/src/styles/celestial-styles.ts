import * as THREE from 'three';

// 创建行星样式 - 更具特色
export function createPlanet(body: any): THREE.Group {
  const planetSize = body.size || 1;
  
  // 创建行星组 - 可以包含多个组件
  const planetGroup = new THREE.Group();
  
  // 创建行星主体
  const planetGeometry = new THREE.SphereGeometry(planetSize, 32, 32);
  const planetMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(body.color)
  });
  const planet = new THREE.Mesh(planetGeometry, planetMaterial);
  
  // 添加表面细节 - 凹凸贴图效果
  const bumpGeometry = new THREE.SphereGeometry(planetSize * 1.01, 32, 32);
  const bumpMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(body.color).clone().multiplyScalar(1.4),
    transparent: true,
    opacity: 0.3,
    wireframe: true
  });
  const bumpLayer = new THREE.Mesh(bumpGeometry, bumpMaterial);
  
  // 添加行星环 - 70%的行星有环
  if (Math.random() > 0.3) {
    const ringSize = planetSize * THREE.MathUtils.randFloat(1.8, 2.5);
    const ringWidth = planetSize * THREE.MathUtils.randFloat(0.2, 0.5);
    const ringGeometry = new THREE.RingGeometry(
      ringSize - ringWidth, 
      ringSize, 
      64
    );
    
    // 随机环颜色 - 通常与行星基色相关但更亮
    const baseColor = new THREE.Color(body.color);
    const ringColor = new THREE.Color();
    const hsl = {h: 0, s: 0, l: 0};
    baseColor.getHSL(hsl);
    ringColor.setHSL(
      (hsl.h + THREE.MathUtils.randFloatSpread(0.2) + 1) % 1, 
      THREE.MathUtils.randFloat(0.5, 0.8), 
      THREE.MathUtils.randFloat(0.6, 0.8)
    );
    
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: ringColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.rotation.y = THREE.MathUtils.randFloatSpread(Math.PI / 6);
    planetGroup.add(ring);
    
    // 添加环的粒子效果 - 增强环的细节
    const particlesCount = 1000;
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesPositions = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radiusVariation = THREE.MathUtils.randFloatSpread(ringWidth * 0.8);
      const radius = ringSize - ringWidth / 2 + radiusVariation;
      
      particlesPositions[i * 3] = Math.cos(angle) * radius;
      particlesPositions[i * 3 + 1] = THREE.MathUtils.randFloatSpread(0.1);
      particlesPositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      color: ringColor,
      size: 0.1,
      transparent: true,
      opacity: 0.8
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    planetGroup.add(particles);
  }
  
  // 添加卫星 - 30%的行星有卫星
  if (Math.random() > 0.7) {
    const moonCount = Math.floor(THREE.MathUtils.randFloat(1, 3));
    
    for (let i = 0; i < moonCount; i++) {
      const moonSize = planetSize * THREE.MathUtils.randFloat(0.15, 0.3);
      const moonGeometry = new THREE.SphereGeometry(moonSize, 16, 16);
      
      // 卫星颜色 - 通常比行星浅一些
      const baseColor = new THREE.Color(body.color);
      const hsl = {h: 0, s: 0, l: 0};
      baseColor.getHSL(hsl);
      const moonColor = new THREE.Color().setHSL(
        hsl.h, 
        THREE.MathUtils.randFloat(0.1, 0.3), 
        THREE.MathUtils.randFloat(0.7, 0.9)
      );
      
      const moonMaterial = new THREE.MeshBasicMaterial({ color: moonColor });
      const moon = new THREE.Mesh(moonGeometry, moonMaterial);
      
      // 将卫星放置在行星周围的随机位置
      const moonDistance = planetSize * THREE.MathUtils.randFloat(2, 3);
      const moonAngle = THREE.MathUtils.randFloat(0, Math.PI * 2);
      const moonElevation = THREE.MathUtils.randFloatSpread(Math.PI / 4);
      
      moon.position.set(
        Math.cos(moonAngle) * Math.cos(moonElevation) * moonDistance,
        Math.sin(moonElevation) * moonDistance,
        Math.sin(moonAngle) * Math.cos(moonElevation) * moonDistance
      );
      
      planetGroup.add(moon);
    }
  }
  
  planetGroup.add(planet);
  planetGroup.add(bumpLayer);
  
  // 设置自转速度和轴
  planetGroup.userData.rotationSpeed = THREE.MathUtils.randFloat(0.2, 0.4) * 0.01;
  planetGroup.userData.rotationAxis = new THREE.Vector3(
    THREE.MathUtils.randFloatSpread(0.2),
    1,
    THREE.MathUtils.randFloatSpread(0.2)
  ).normalize();
  
  return planetGroup;
}

// 创建恒星样式 - 更具特色
export function createStar(body: any): THREE.Group {
  const starSize = body.size || 1.5;
  
  // 创建恒星组
  const starGroup = new THREE.Group();
  
  // 创建恒星核心
  const coreGeometry = new THREE.SphereGeometry(starSize, 32, 32);
  
  // 恒星材质 - 发光效果
  const coreColor = new THREE.Color(body.color);
  const coreMaterial = new THREE.MeshBasicMaterial({ 
    color: coreColor, 
    transparent: true, 
    opacity: 0.9
  });
  
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  starGroup.add(core);
  
  // 创建恒星外层 - 辉光效果
  const glowSize = starSize * 1.2;
  const glowGeometry = new THREE.SphereGeometry(glowSize, 32, 32);
  
  // 辉光材质 - 半透明
  const hsl = {h: 0, s: 0, l: 0};
  coreColor.getHSL(hsl);
  
  const glowColor = new THREE.Color().setHSL(
    hsl.h,
    Math.min(1, hsl.s * 1.2),
    Math.min(1, hsl.l * 1.5)
  );
  
  const glowMaterial = new THREE.MeshBasicMaterial({ 
    color: glowColor, 
    transparent: true, 
    opacity: 0.3,
    side: THREE.BackSide
  });
  
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  starGroup.add(glow);
  
  // 第三层辉光 - 更大更淡
  const outerGlowSize = starSize * 1.5;
  const outerGlowGeometry = new THREE.SphereGeometry(outerGlowSize, 32, 32);
  const outerGlowMaterial = new THREE.MeshBasicMaterial({ 
    color: glowColor, 
    transparent: true, 
    opacity: 0.15,
    side: THREE.BackSide
  });
  
  const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
  starGroup.add(outerGlow);
  
  // 添加日冕射线
  const coronaCount = 8 + Math.floor(Math.random() * 8);
  for (let i = 0; i < coronaCount; i++) {
    const rayLength = starSize * THREE.MathUtils.randFloat(0.5, 2);
    const rayWidth = starSize * THREE.MathUtils.randFloat(0.05, 0.2);
    
    const rayGeometry = new THREE.BoxGeometry(rayWidth, rayLength, rayWidth);
    const rayMaterial = new THREE.MeshBasicMaterial({ 
      color: glowColor, 
      transparent: true, 
      opacity: THREE.MathUtils.randFloat(0.2, 0.4)
    });
    
    const ray = new THREE.Mesh(rayGeometry, rayMaterial);
    
    // 随机角度放置射线
    const phi = Math.acos(-1 + (2 * Math.random()));
    const theta = Math.random() * Math.PI * 2;
    
    // 旋转并放置射线
    ray.position.setFromSphericalCoords(starSize + rayLength/2, phi, theta);
    ray.lookAt(0, 0, 0);
    
    starGroup.add(ray);
  }
  
  // 添加粒子效果 - 恒星大气
  const particlesCount = 1000;
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesPositions = new Float32Array(particlesCount * 3);
  
  for (let i = 0; i < particlesCount; i++) {
    const radius = starSize * THREE.MathUtils.randFloat(1.1, 1.8);
    const phi = Math.acos(-1 + (2 * Math.random()));
    const theta = Math.random() * Math.PI * 2;
    
    particlesPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    particlesPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    particlesPositions[i * 3 + 2] = radius * Math.cos(phi);
  }
  
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));
  
  const particlesMaterial = new THREE.PointsMaterial({
    color: glowColor,
    size: THREE.MathUtils.randFloat(0.05, 0.15),
    transparent: true,
    opacity: 0.6
  });
  
  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  starGroup.add(particles);
  
  // 设置脉动效果
  starGroup.userData.pulseSpeed = THREE.MathUtils.randFloat(1, 3) * 0.5;
  starGroup.userData.pulseTime = 0;
  
  // 轻微自转
  starGroup.userData.rotationSpeed = THREE.MathUtils.randFloat(0.05, 0.1) * 0.01;
  
  return starGroup;
}

// 创建黑洞样式 - 更具特色
export function createBlackHole(body: any): THREE.Group {
  const blackHoleSize = body.size || 1.2;
  
  // 创建黑洞组
  const blackHoleGroup = new THREE.Group();
  
  // 创建黑洞事件视界（中心黑色球体）
  const coreSize = blackHoleSize * 0.8;
  const coreGeometry = new THREE.SphereGeometry(coreSize, 32, 32);
  const coreMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x000000,
    transparent: true,
    opacity: 0.9
  });
  
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  blackHoleGroup.add(core);
  
  // 创建吸积盘
  const diskOuterRadius = blackHoleSize * 3;
  const diskInnerRadius = blackHoleSize * 1.2;
  const diskGeometry = new THREE.RingGeometry(diskInnerRadius, diskOuterRadius, 64, 8);
  
  // 为吸积盘创建渐变颜色
  const diskColors = [];
  const diskVertexCount = diskGeometry.attributes.position.count;
  
  // 基础颜色 - 通常带有红/橙色调
  const baseColor = new THREE.Color(body.color);
  const hsl = {h: 0, s: 0, l: 0};
  baseColor.getHSL(hsl);
  
  // 确保有明亮橙红色调
  const adjustedH = (hsl.h > 0.05 && hsl.h < 0.2) ? hsl.h : 0.05 + Math.random() * 0.15;
  
  for (let i = 0; i < diskVertexCount; i++) {
    // 从内到外的颜色渐变
    const t = i / diskVertexCount;
    
    // 内部更亮（偏白热），外部带有颜色
    const vertexColor = new THREE.Color().setHSL(
      adjustedH + t * 0.1,
      0.9 - t * 0.7,
      0.9 - t * 0.3
    );
    
    diskColors.push(vertexColor.r, vertexColor.g, vertexColor.b);
  }
  
  diskGeometry.setAttribute('color', new THREE.Float32BufferAttribute(diskColors, 3));
  
  const diskMaterial = new THREE.MeshBasicMaterial({ 
    vertexColors: true,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8
  });
  
  const disk = new THREE.Mesh(diskGeometry, diskMaterial);
  
  // 随机倾斜吸积盘
  disk.rotation.x = Math.PI / 2;
  disk.rotation.y = THREE.MathUtils.randFloatSpread(Math.PI / 6);
  
  blackHoleGroup.add(disk);
  
  // 创建吸积盘粒子效果 - 增强细节
  const particlesCount = 2000;
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesPositions = new Float32Array(particlesCount * 3);
  const particlesColors = new Float32Array(particlesCount * 3);
  
  for (let i = 0; i < particlesCount; i++) {
    // 在吸积盘区域生成粒子
    const angle = Math.random() * Math.PI * 2;
    const distance = THREE.MathUtils.randFloat(diskInnerRadius, diskOuterRadius);
    
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    const y = THREE.MathUtils.randFloatSpread(blackHoleSize * 0.3); // 薄盘
    
    particlesPositions[i * 3] = x;
    particlesPositions[i * 3 + 1] = y;
    particlesPositions[i * 3 + 2] = z;
    
    // 粒子颜色 - 从内到外
    const t = (distance - diskInnerRadius) / (diskOuterRadius - diskInnerRadius);
    const particleColor = new THREE.Color().setHSL(
      adjustedH + t * 0.1,
      0.9 - t * 0.7,
      1 - t * 0.4
    );
    
    particlesColors[i * 3] = particleColor.r;
    particlesColors[i * 3 + 1] = particleColor.g;
    particlesColors[i * 3 + 2] = particleColor.b;
  }
  
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));
  particlesGeometry.setAttribute('color', new THREE.BufferAttribute(particlesColors, 3));
  
  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.12,
    vertexColors: true,
    transparent: true,
    opacity: 0.8
  });
  
  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  blackHoleGroup.add(particles);
  
  // 添加引力透镜扭曲效果 - 半透明球形
  const lensSize = blackHoleSize * 1.5;
  const lensGeometry = new THREE.SphereGeometry(lensSize, 32, 32);
  const lensMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.1,
    side: THREE.BackSide
  });
  
  const lens = new THREE.Mesh(lensGeometry, lensMaterial);
  blackHoleGroup.add(lens);
  
  // 添加引力射线
  const rayCount = Math.floor(THREE.MathUtils.randFloat(3, 6));
  const rayColor = new THREE.Color().setHSL(adjustedH, 0.8, 0.5);
  
  for (let i = 0; i < rayCount; i++) {
    const rayLength = blackHoleSize * THREE.MathUtils.randFloat(3, 6);
    const rayGeometry = new THREE.CylinderGeometry(0.1, 0.3, rayLength, 6);
    const rayMaterial = new THREE.MeshBasicMaterial({
      color: rayColor,
      transparent: true,
      opacity: 0.4
    });
    
    const ray = new THREE.Mesh(rayGeometry, rayMaterial);
    
    // 随机方向
    const phi = Math.acos(-1 + (2 * Math.random()));
    const theta = Math.random() * Math.PI * 2;
    
    ray.position.setFromSphericalCoords(rayLength / 2, phi, theta);
    ray.lookAt(0, 0, 0);
    ray.rotateX(Math.PI / 2);
    
    blackHoleGroup.add(ray);
  }
  
  // 设置旋转和脉动
  blackHoleGroup.userData.rotationSpeed = THREE.MathUtils.randFloat(0.3, 0.6) * 0.01;
  blackHoleGroup.userData.rotationAxis = new THREE.Vector3(0, 1, 0);
  
  blackHoleGroup.userData.pulseSpeed = THREE.MathUtils.randFloat(0.5, 1.5);
  blackHoleGroup.userData.pulseTime = 0;
  
  return blackHoleGroup;
}
