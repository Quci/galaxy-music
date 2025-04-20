import * as THREE from 'three';

// 创建星云样式
export function createNebula(body: any): THREE.Group {
  const nebulaSize = body.size || 3.5;
  
  // 创建星云组
  const nebulaGroup = new THREE.Group();
  
  // 星云主体 - 使用粒子系统创建气体云团
  const particlesCount = 5000;
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesPositions = new Float32Array(particlesCount * 3);
  const particlesColors = new Float32Array(particlesCount * 3);
  
  // 获取基础颜色
  const baseColor = new THREE.Color(body.color);
  const hsl = {h: 0, s: 0, l: 0};
  baseColor.getHSL(hsl);
  
  // 创建几个略有变化的颜色供星云使用
  const colorVariants = [
    new THREE.Color().setHSL((hsl.h + 0.05) % 1, Math.min(1, hsl.s + 0.1), Math.min(1, hsl.l + 0.15)),
    new THREE.Color().setHSL((hsl.h - 0.05 + 1) % 1, Math.min(1, hsl.s + 0.2), Math.min(1, hsl.l + 0.05)),
    new THREE.Color().setHSL(hsl.h, Math.min(1, hsl.s + 0.15), Math.min(1, hsl.l + 0.1))
  ];
  
  // 星云形状参数
  const shape = Math.random() > 0.5 ? 'elliptical' : 'irregular';
  
  for (let i = 0; i < particlesCount; i++) {
    let x, y, z;
    
    if (shape === 'elliptical') {
      // 椭圆形星云
      const phi = Math.acos(-1 + Math.random() * 2);
      const theta = Math.random() * Math.PI * 2;
      
      // 椭球参数 a, b, c
      const a = nebulaSize;
      const b = nebulaSize * THREE.MathUtils.randFloat(0.6, 0.9);
      const c = nebulaSize * THREE.MathUtils.randFloat(0.4, 0.7);
      
      const radius = nebulaSize * Math.random();
      x = a * Math.sin(phi) * Math.cos(theta);
      y = b * Math.sin(phi) * Math.sin(theta);
      z = c * Math.cos(phi);
      
      // 增加一些随机性使其不太规则
      x += THREE.MathUtils.randFloatSpread(nebulaSize * 0.2);
      y += THREE.MathUtils.randFloatSpread(nebulaSize * 0.2);
      z += THREE.MathUtils.randFloatSpread(nebulaSize * 0.2);
    } else {
      // 不规则星云
      const radius = THREE.MathUtils.randFloat(0, nebulaSize);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(-1 + Math.random() * 2);
      
      // 基本球形分布
      x = radius * Math.sin(phi) * Math.cos(theta);
      y = radius * Math.sin(phi) * Math.sin(theta);
      z = radius * Math.cos(phi);
      
      // 添加扭曲和不规则性 - 使用柏林噪声或简化的随机变形
      const distortion = THREE.MathUtils.randFloat(0.7, 1.3);
      x *= distortion;
      y *= distortion;
      z *= distortion;
    }
    
    particlesPositions[i * 3] = x;
    particlesPositions[i * 3 + 1] = y;
    particlesPositions[i * 3 + 2] = z;
    
    // 随机选择一个颜色变体
    const colorIndex = Math.floor(Math.random() * colorVariants.length);
    const color = colorVariants[colorIndex];
    
    // 边缘处颜色较淡
    const distanceFromCenter = Math.sqrt(x*x + y*y + z*z);
    const normalizedDistance = distanceFromCenter / nebulaSize;
    const fadeFactor = 1 - Math.min(1, normalizedDistance * 0.8);
    
    particlesColors[i * 3] = color.r * fadeFactor;
    particlesColors[i * 3 + 1] = color.g * fadeFactor;
    particlesColors[i * 3 + 2] = color.b * fadeFactor;
  }
  
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));
  particlesGeometry.setAttribute('color', new THREE.BufferAttribute(particlesColors, 3));
  
  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.15,
    transparent: true,
    opacity: 0.8,
    vertexColors: true,
    blending: THREE.AdditiveBlending
  });
  
  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  nebulaGroup.add(particles);
  
  // 星云中的恒星 - 随机点缀一些亮点
  const starsCount = 100;
  const starsGeometry = new THREE.BufferGeometry();
  const starsPositions = new Float32Array(starsCount * 3);
  
  for (let i = 0; i < starsCount; i++) {
    const phi = Math.acos(-1 + Math.random() * 2);
    const theta = Math.random() * Math.PI * 2;
    const radius = THREE.MathUtils.randFloat(0, nebulaSize * 0.9);
    
    starsPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    starsPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    starsPositions[i * 3 + 2] = radius * Math.cos(phi);
  }
  
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
  
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.2,
    transparent: true,
    opacity: 0.9
  });
  
  const stars = new THREE.Points(starsGeometry, starsMaterial);
  nebulaGroup.add(stars);
  
  // 添加轻微旋转
  nebulaGroup.userData.rotationSpeed = 0.0005;
  
  return nebulaGroup;
}
