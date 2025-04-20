import * as THREE from 'three';

// 创建月球样式
export function createMoon(body: any): THREE.Group {
  const moonSize = body.size || 0.8;
  
  // 创建月球组
  const moonGroup = new THREE.Group();
  
  // 创建月球主体
  const moonGeometry = new THREE.SphereGeometry(moonSize, 32, 32);
  
  // 月球材质 - 略显灰白色
  const moonColor = new THREE.Color(body.color);
  const moonMaterial = new THREE.MeshBasicMaterial({ 
    color: moonColor
  });
  
  const moon = new THREE.Mesh(moonGeometry, moonMaterial);
  moonGroup.add(moon);
  
  // 创建月球表面 - 陨石坑效果
  for (let i = 0; i < 20; i++) {
    // 随机位置
    const phi = Math.acos(-1 + Math.random() * 2);
    const theta = Math.random() * Math.PI * 2;
    // 随机大小
    const craterSize = moonSize * THREE.MathUtils.randFloat(0.05, 0.2);
    
    const craterGeometry = new THREE.CircleGeometry(craterSize, 16);
    const craterMaterial = new THREE.MeshBasicMaterial({ 
      color: moonColor.clone().multiplyScalar(0.8), 
      side: THREE.DoubleSide
    });
    
    const crater = new THREE.Mesh(craterGeometry, craterMaterial);
    
    // 将陨石坑放置在月球表面
    const x = moonSize * Math.sin(phi) * Math.cos(theta);
    const y = moonSize * Math.sin(phi) * Math.sin(theta);
    const z = moonSize * Math.cos(phi);
    
    crater.position.set(x, y, z);
    // 使圆面朝向球心
    crater.lookAt(0, 0, 0);
    // 略微向外偏移以避免z-fighting
    crater.position.normalize().multiplyScalar(moonSize * 1.001);
    
    moonGroup.add(crater);
  }
  
  // 添加月球光晕效果
  const glowSize = moonSize * 1.1;
  const glowGeometry = new THREE.SphereGeometry(glowSize, 32, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: moonColor.clone().multiplyScalar(1.2),
    transparent: true,
    opacity: 0.2,
    side: THREE.BackSide
  });
  
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  moonGroup.add(glow);
  
  // 设置自转速度
  moonGroup.userData.rotationSpeed = 0.002;
  
  return moonGroup;
}
