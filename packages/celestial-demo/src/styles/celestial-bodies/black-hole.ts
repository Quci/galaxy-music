import * as THREE from 'three';

// 创建黑洞样式 - 精致光环效果
export function createBlackHole(body: any): THREE.Group {
  const blackHoleSize = body.size || 1.2;
  
  // 可调整参数
  const RING_TILT_ANGLE = -65 * (Math.PI / 180); // 25度角（转为弧度），负值使光环朝向屏幕
  
  // 创建黑洞组
  const blackHoleGroup = new THREE.Group();
  
  // 设置旋转属性
  blackHoleGroup.userData.rotationSpeed = 0.03; // 整体旋转速度增加3倍
  blackHoleGroup.userData.rotationAxis = new THREE.Vector3(0, 1, 0); // Y轴旋转
  
  // 创建黑洞核心 - 纯黑色球体
  const coreGeometry = new THREE.SphereGeometry(blackHoleSize, 64, 64);
  const coreMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: false
  });
  
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  blackHoleGroup.add(core);

  // 创建内部光环 - 蓝白相间，尺寸缩小
  const innerRingGeometry = new THREE.RingGeometry(
    blackHoleSize * 1.01, 
    blackHoleSize * 1.08, 
    128, 
    8
  );
  const innerRingMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0.0 }
    },
    vertexShader: `
      uniform float time;
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        
        // 添加微妙的波动
        vec3 pos = position;
        float wave = sin(position.x * 8.0 + time * 2.0) * cos(position.y * 8.0 + time) * 0.01;
        pos += normal * wave;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec2 vUv;
      
      void main() {
        // 创建光环上多个明亮点
        float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
        float normalizedAngle = angle / (2.0 * 3.14159) + 0.5;
        
        // 多个明亮点沿光环旋转
        float brightPoints = 0.0;
        for (int i = 0; i < 4; i++) {
          float offset = float(i) * 0.25;
          float pointAngle = normalizedAngle - mod(time * 0.1 + offset, 1.0);
          brightPoints += 0.5 * smoothstep(0.05, 0.0, abs(pointAngle - floor(pointAngle + 0.5)));
        }
        
        // 基础蓝白色渐变
        vec3 baseColor = mix(vec3(0.7, 0.9, 1.0), vec3(1.0, 1.0, 1.0), sin(normalizedAngle * 12.0 + time) * 0.5 + 0.5);
        
        // 添加明亮点的影响
        vec3 finalColor = mix(baseColor, vec3(1.0), brightPoints);
        
        // 添加光晕衰减
        float radialGradient = 1.0 - abs(vUv.y - 0.5) * 2.0;
        float alpha = radialGradient * (0.9 + brightPoints * 0.3);
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  
  const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
  // 使用常量角度
  innerRing.rotation.x = RING_TILT_ANGLE;
  innerRing.rotation.y = 0;
  blackHoleGroup.add(innerRing);
  
  // 创建光晕球 - 整体发光效果
  const glowGeometry = new THREE.SphereGeometry(blackHoleSize * 1.25, 32, 32);
  const glowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0.0 }
    },
    vertexShader: `
      uniform float time;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        // 基于法线和视角的菲涅尔效果
        float rim = 1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
        rim = pow(rim, 3.0);
        
        // 添加时间变化的效果
        float pulse = sin(time * 0.5) * 0.1 + 0.9;
        rim *= pulse;
        
        // 光晕颜色 - 蓝白渐变
        vec3 rimColor = mix(vec3(0.8, 0.9, 1.0), vec3(1.0), rim);
        
        // 设置透明度
        float alpha = rim * 0.4;
        
        gl_FragColor = vec4(rimColor, alpha);
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  blackHoleGroup.add(glow);
  
  // 动画更新函数
  blackHoleGroup.userData.update = function(delta: number) {
    const time = Date.now() * 0.001;
    
    // 更新所有着色器中的时间
    if (innerRingMaterial instanceof THREE.ShaderMaterial) {
      innerRingMaterial.uniforms.time.value = time;
    }
    
    if (glowMaterial instanceof THREE.ShaderMaterial) {
      glowMaterial.uniforms.time.value = time;
    }
    
    // 单独旋转光环
    innerRing.rotation.z += delta * 2.5; // 光环自转速度增加到2.5倍

    // 注意：整体旋转由animate函数通过userData.rotationSpeed和rotationAxis处理
  };
  
  return blackHoleGroup;
}
