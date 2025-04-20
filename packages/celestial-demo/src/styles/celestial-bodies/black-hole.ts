import * as THREE from 'three';

// 创建黑洞样式
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
