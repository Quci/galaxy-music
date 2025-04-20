import * as THREE from 'three';

// 创建彗星样式
export function createComet(body: any): THREE.Group {
  const cometSize = body.size || 0.6;
  
  // 创建彗星组
  const cometGroup = new THREE.Group();
  
  // 彗星主体（冰核）
  const coreGeometry = new THREE.SphereGeometry(cometSize, 24, 24);
  const coreColor = new THREE.Color(body.color);
  const coreMaterial = new THREE.MeshBasicMaterial({
    color: coreColor
  });
  
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  cometGroup.add(core);
  
  // 彗星表面不规则性
  const bumpGeometry = new THREE.SphereGeometry(cometSize * 1.05, 12, 12);
  const bumpMaterial = new THREE.MeshBasicMaterial({
    color: coreColor.clone().multiplyScalar(0.9),
    wireframe: true,
    transparent: true,
    opacity: 0.5
  });
  
  const bump = new THREE.Mesh(bumpGeometry, bumpMaterial);
  cometGroup.add(bump);
  
  // 彗星尾 - 主尾
  const tailLength = cometSize * 10;
  const tailGeometry = new THREE.ConeGeometry(cometSize * 1.2, tailLength, 16, 1, true);
  
  // 调整尾巴的朝向和位置
  const tailMaterial = new THREE.MeshBasicMaterial({
    color: coreColor.clone().multiplyScalar(1.2),
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide
  });
  
  const tail = new THREE.Mesh(tailGeometry, tailMaterial);
  // 将尾巴放在彗星核心后面
  tail.position.z = -tailLength / 2;
  // 旋转尾巴使其朝向反方向
  tail.rotation.x = Math.PI;
  
  cometGroup.add(tail);
  
  // 彗星尾 - 粒子效果
  const particlesCount = 800;
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesPositions = new Float32Array(particlesCount * 3);
  const particlesSizes = new Float32Array(particlesCount);
  
  for (let i = 0; i < particlesCount; i++) {
    // 随机分布在尾巴范围内
    const z = -THREE.MathUtils.randFloat(cometSize, tailLength);
    const spread = cometSize * (1 + Math.abs(z) / tailLength * 2);
    const theta = Math.random() * Math.PI * 2;
    
    const x = Math.cos(theta) * THREE.MathUtils.randFloat(0, spread);
    const y = Math.sin(theta) * THREE.MathUtils.randFloat(0, spread);
    
    particlesPositions[i * 3] = x;
    particlesPositions[i * 3 + 1] = y;
    particlesPositions[i * 3 + 2] = z;
    
    // 越靠近彗星核心的粒子越大
    const distanceRatio = Math.abs(z) / tailLength;
    particlesSizes[i] = THREE.MathUtils.lerp(0.15, 0.05, distanceRatio);
  }
  
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));
  
  const particlesMaterial = new THREE.PointsMaterial({
    color: coreColor.clone().multiplyScalar(1.5),
    size: 0.1,
    transparent: true,
    opacity: 0.7
  });
  
  // 为粒子设置不同大小
  particlesMaterial.size = 0.12;
  particlesMaterial.sizeAttenuation = true;
  
  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  cometGroup.add(particles);
  
  // 设置彗星运动参数
  cometGroup.userData.rotationSpeed = 0.01;
  cometGroup.userData.rotationAxis = new THREE.Vector3(0, 1, 0);
  
  return cometGroup;
}
