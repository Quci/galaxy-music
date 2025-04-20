import * as THREE from 'three';

// 创建中子星样式
export function createNeutronStar(body: any): THREE.Group {
  const neutronStarSize = body.size || 0.7;
  
  // 创建中子星组
  const neutronStarGroup = new THREE.Group();
  
  // 中子星核心 - 极其密集的小型恒星
  const coreGeometry = new THREE.SphereGeometry(neutronStarSize, 32, 32);
  const coreColor = new THREE.Color(body.color);
  
  // 调整颜色以反映极高温度 - 通常偏蓝色
  const hsl = {h: 0, s: 0, l: 0};
  coreColor.getHSL(hsl);
  const adjustedColor = new THREE.Color().setHSL(
    Math.max(0.55, hsl.h), // 确保偏蓝色调
    Math.min(0.9, hsl.s + 0.3),
    Math.min(0.9, hsl.l + 0.2)
  );
  
  const coreMaterial = new THREE.MeshBasicMaterial({ 
    color: adjustedColor,
    transparent: true,
    opacity: 0.9
  });
  
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  neutronStarGroup.add(core);
  
  // 中子星强烈辐射效果 - 多层辉光
  for (let i = 1; i <= 3; i++) {
    const glowSize = neutronStarSize * (1 + i * 0.2);
    const glowGeometry = new THREE.SphereGeometry(glowSize, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
      color: adjustedColor,
      transparent: true,
      opacity: 0.3 / i,
      side: THREE.BackSide
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    neutronStarGroup.add(glow);
  }
  
  // 磁力线效果 - 两极辐射束
  const beamLength = neutronStarSize * 5;
  const beamRadius = neutronStarSize * 0.4;
  
  // 北极辐射束
  const northBeamGeometry = new THREE.CylinderGeometry(
    beamRadius * 0.2, beamRadius, beamLength, 16, 1, true
  );
  const beamMaterial = new THREE.MeshBasicMaterial({
    color: adjustedColor,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
  });
  
  const northBeam = new THREE.Mesh(northBeamGeometry, beamMaterial);
  northBeam.position.y = beamLength / 2;
  neutronStarGroup.add(northBeam);
  
  // 南极辐射束
  const southBeamGeometry = new THREE.CylinderGeometry(
    beamRadius * 0.2, beamRadius, beamLength, 16, 1, true
  );
  const southBeam = new THREE.Mesh(southBeamGeometry, beamMaterial);
  southBeam.position.y = -beamLength / 2;
  southBeam.rotation.x = Math.PI; // 旋转使锥体朝下
  neutronStarGroup.add(southBeam);
  
  // 脉冲星特有的粒子效果 - 旋转扫描光束
  const pulsesCount = 1000;
  const pulsesGeometry = new THREE.BufferGeometry();
  const pulsesPositions = new Float32Array(pulsesCount * 3);
  
  for (let i = 0; i < pulsesCount; i++) {
    // 将粒子分布在两个辐射束上
    const isNorthBeam = Math.random() > 0.5;
    
    // 随机弧度
    const theta = Math.random() * Math.PI * 2;
    // 沿射线的随机距离
    const distance = isNorthBeam ? 
      THREE.MathUtils.randFloat(0, beamLength) : 
      -THREE.MathUtils.randFloat(0, beamLength);
    
    // 根据距离计算半径
    const radius = Math.abs(distance) / beamLength * beamRadius;
    
    // 坐标
    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;
    const y = distance;
    
    pulsesPositions[i * 3] = x;
    pulsesPositions[i * 3 + 1] = y;
    pulsesPositions[i * 3 + 2] = z;
  }
  
  pulsesGeometry.setAttribute('position', new THREE.BufferAttribute(pulsesPositions, 3));
  
  const pulsesMaterial = new THREE.PointsMaterial({
    color: adjustedColor,
    size: 0.05,
    transparent: true,
    opacity: 0.8
  });
  
  const pulses = new THREE.Points(pulsesGeometry, pulsesMaterial);
  neutronStarGroup.add(pulses);
  
  // 中子星围绕自身快速旋转
  neutronStarGroup.userData.rotationSpeed = 0.03;
  neutronStarGroup.userData.rotationAxis = new THREE.Vector3(0.2, 1, 0.1).normalize();
  
  // 给中子星添加脉冲效果
  neutronStarGroup.userData.pulseSpeed = 10;
  neutronStarGroup.userData.pulseTime = 0;
  
  return neutronStarGroup;
}
