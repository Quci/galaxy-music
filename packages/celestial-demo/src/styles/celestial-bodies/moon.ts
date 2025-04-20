import * as THREE from 'three';

// 创建月球样式
export function createMoon(body: any): THREE.Group {
  const moonSize = body.size || 0.8;
  
  // 创建月球组
  const moonGroup = new THREE.Group();
  
  // 创建月球主体
  const moonGeometry = new THREE.SphereGeometry(moonSize, 32, 32);
  
  // 月球材质 - 略显灰白色
  const moonColor = new THREE.Color(body.color || 0xe0e0e0);
  
  // 使用漫反射材质替代基础材质，以便更好地表现光照
  const moonMaterial = new THREE.MeshStandardMaterial({ 
    color: moonColor,
    roughness: 0.8,
    metalness: 0.1,
    emissive: moonColor.clone().multiplyScalar(0.05), // 微弱的自发光
  });
  
  const moon = new THREE.Mesh(moonGeometry, moonMaterial);
  moonGroup.add(moon);
  
  // 创建月球表面 - 陨石坑效果
  for (let i = 0; i < 30; i++) {
    // 随机位置
    const phi = Math.acos(-1 + Math.random() * 2);
    const theta = Math.random() * Math.PI * 2;
    // 随机大小
    const craterSize = moonSize * THREE.MathUtils.randFloat(0.05, 0.2);
    
    const craterGeometry = new THREE.CircleGeometry(craterSize, 16);
    // 使用漫反射材质给陨石坑以便更好地表现光照
    const craterMaterial = new THREE.MeshStandardMaterial({ 
      color: moonColor.clone().multiplyScalar(0.7), 
      side: THREE.DoubleSide,
      roughness: 0.9,
      metalness: 0.0
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
  
  // 添加月球光晕效果 - 使用着色器实现更好的光晕
  const glowSize = moonSize * 1.2;
  const glowGeometry = new THREE.SphereGeometry(glowSize, 32, 32);
  const glowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: moonColor.clone().multiplyScalar(1.2) }
    },
    vertexShader: `
      varying vec3 vNormal;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      varying vec3 vNormal;
      
      void main() {
        float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
        gl_FragColor = vec4(color, intensity * 0.4);
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
  });
  
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  moonGroup.add(glow);
  
  // 添加辉光内层 - 更细腻的月球表面光晕
  const innerGlowSize = moonSize * 1.05;
  const innerGlowGeometry = new THREE.SphereGeometry(innerGlowSize, 32, 32);
  const innerGlowMaterial = new THREE.MeshBasicMaterial({
    color: moonColor.clone().multiplyScalar(1.5),
    transparent: true,
    opacity: 0.2,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending
  });
  
  const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
  moonGroup.add(innerGlow);
  
  // 设置自转速度
  moonGroup.userData.rotationSpeed = 0.002;
  
  // 添加动画效果
  moonGroup.userData.update = function(delta: number) {
    // 缓慢自转
    moonGroup.rotation.y += delta * moonGroup.userData.rotationSpeed;
  };
  
  return moonGroup;
}
