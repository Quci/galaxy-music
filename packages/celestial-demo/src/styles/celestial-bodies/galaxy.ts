import * as THREE from 'three';

// 创建星系样式
export function createGalaxy(body: any): THREE.Group {
  const galaxySize = body.size || 6.0;
  
  // 创建星系组
  const galaxyGroup = new THREE.Group();
  
  // 星系参数
  const arms = 5; // 旋臂数量
  const armWidth = 0.8; // 旋臂宽度
  const revolutions = 2.5; // 旋臂螺旋程度
  const bulgeSize = galaxySize * 0.2; // 星系中央核球大小
  const particlesCount = 10000; // 星系中的恒星数量
  
  // 获取基础颜色
  const baseColor = new THREE.Color(body.color);
  const hsl = {h: 0, s: 0, l: 0};
  baseColor.getHSL(hsl);
  
  // 星系中央核球 - 高密度恒星区域
  const bulgeGeometry = new THREE.BufferGeometry();
  const bulgePositions = new Float32Array(particlesCount * 0.2 * 3); // 20%的粒子用于核球
  const bulgeColors = new Float32Array(particlesCount * 0.2 * 3);
  
  // 核球颜色 - 通常偏黄/白
  const bulgeColor = new THREE.Color().setHSL(
    (hsl.h * 0.5 + 0.09) % 1, // 偏向黄色
    Math.min(0.8, hsl.s),
    Math.min(0.9, hsl.l + 0.2)
  );
  
  // 创建核球
  for (let i = 0; i < bulgePositions.length / 3; i++) {
    // 球形分布
    const radius = bulgeSize * Math.pow(Math.random(), 0.5); // 密度向中心增加
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(-1 + Math.random() * 2);
    
    bulgePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    bulgePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.3; // 扁平化
    bulgePositions[i * 3 + 2] = radius * Math.cos(phi) * 0.3; // 扁平化
    
    // 核球发光亮度随距离衰减
    const distanceRatio = radius / bulgeSize;
    const brightness = 1 - distanceRatio * 0.6;
    
    bulgeColors[i * 3] = bulgeColor.r * brightness;
    bulgeColors[i * 3 + 1] = bulgeColor.g * brightness;
    bulgeColors[i * 3 + 2] = bulgeColor.b * brightness;
  }
  
  bulgeGeometry.setAttribute('position', new THREE.BufferAttribute(bulgePositions, 3));
  bulgeGeometry.setAttribute('color', new THREE.BufferAttribute(bulgeColors, 3));
  
  // 旋臂中的恒星
  const diskGeometry = new THREE.BufferGeometry();
  const diskPositions = new Float32Array(particlesCount * 0.8 * 3); // 80%的粒子用于旋臂
  const diskColors = new Float32Array(particlesCount * 0.8 * 3);
  
  // 创建几个颜色变体用于旋臂
  const diskColorVariants = [
    new THREE.Color().setHSL((hsl.h + 0.6) % 1, 0.8, 0.6), // 蓝色恒星
    new THREE.Color().setHSL((hsl.h + 0.1) % 1, 0.7, 0.6), // 黄色恒星
    new THREE.Color().setHSL((hsl.h + 0.05) % 1, 0.9, 0.7), // 白色恒星
    new THREE.Color().setHSL((hsl.h - 0.05) % 1, 0.8, 0.5)  // 偏红恒星
  ];
  
  // 创建旋臂上的恒星
  for (let i = 0; i < diskPositions.length / 3; i++) {
    // 决定是在旋臂上还是弥散区域
    const onArm = Math.random() < 0.8;
    
    let x, y, z;
    
    if (onArm) {
      // 在旋臂上
      const armIndex = Math.floor(Math.random() * arms);
      const angle = Math.random() * Math.PI * 2 * revolutions;
      const armOffset = (Math.random() - 0.5) * armWidth;
      const radialDistance = bulgeSize + Math.random() * (galaxySize - bulgeSize);
      
      // 螺旋数学公式
      x = radialDistance * Math.cos(angle + armIndex * (2 * Math.PI / arms));
      z = radialDistance * Math.sin(angle + armIndex * (2 * Math.PI / arms));
      
      // 添加旋臂宽度
      const perpAngle = Math.atan2(z, x) + Math.PI / 2;
      x += Math.cos(perpAngle) * armOffset * radialDistance / galaxySize;
      z += Math.sin(perpAngle) * armOffset * radialDistance / galaxySize;
      
      // Y轴扁平化
      y = THREE.MathUtils.randFloatSpread(radialDistance * 0.1);
      
    } else {
      // 在弥散区域
      const angle = Math.random() * Math.PI * 2;
      const radialDistance = bulgeSize + Math.random() * (galaxySize - bulgeSize);
      
      x = radialDistance * Math.cos(angle);
      z = radialDistance * Math.sin(angle);
      y = THREE.MathUtils.randFloatSpread(radialDistance * 0.15);
    }
    
    diskPositions[i * 3] = x;
    diskPositions[i * 3 + 1] = y;
    diskPositions[i * 3 + 2] = z;
    
    // 随机选择恒星颜色
    const colorIndex = Math.floor(Math.random() * diskColorVariants.length);
    const color = diskColorVariants[colorIndex];
    
    // 根据距离调整亮度
    const distance = Math.sqrt(x*x + z*z);
    const brightness = THREE.MathUtils.mapLinear(distance, bulgeSize, galaxySize, 1, 0.6);
    
    diskColors[i * 3] = color.r * brightness;
    diskColors[i * 3 + 1] = color.g * brightness;
    diskColors[i * 3 + 2] = color.b * brightness;
  }
  
  diskGeometry.setAttribute('position', new THREE.BufferAttribute(diskPositions, 3));
  diskGeometry.setAttribute('color', new THREE.BufferAttribute(diskColors, 3));
  
  // 创建核球和旋臂粒子系统
  const bulgeParticles = new THREE.Points(
    bulgeGeometry,
    new THREE.PointsMaterial({
      size: 0.15,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      blending: THREE.AdditiveBlending
    })
  );
  galaxyGroup.add(bulgeParticles);
  
  const diskParticles = new THREE.Points(
    diskGeometry,
    new THREE.PointsMaterial({
      size: 0.12,
      transparent: true,
      opacity: 0.7,
      vertexColors: true,
      blending: THREE.AdditiveBlending
    })
  );
  galaxyGroup.add(diskParticles);
  
  // 星系中心的超大质量黑洞
  const blackHoleGeometry = new THREE.SphereGeometry(bulgeSize * 0.05, 32, 32);
  const blackHoleMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.8
  });
  const blackHole = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial);
  galaxyGroup.add(blackHole);
  
  // 黑洞光环效果
  const ringGeometry = new THREE.RingGeometry(bulgeSize * 0.05, bulgeSize * 0.12, 32);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: bulgeColor,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI / 2;
  galaxyGroup.add(ring);
  
  // 设置星系的旋转
  galaxyGroup.userData.rotationSpeed = 0.0002;
  galaxyGroup.userData.rotationAxis = new THREE.Vector3(0, 1, 0);
  
  return galaxyGroup;
}
