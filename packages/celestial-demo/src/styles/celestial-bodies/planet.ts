import * as THREE from 'three';

// 创建行星样式
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
