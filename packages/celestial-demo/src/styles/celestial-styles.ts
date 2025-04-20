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

// 创建恒星样式 - 太阳风格
export function createStar(body: any): THREE.Group {
  const starSize = body.size || 1.5;
  
  // 创建恒星组
  const starGroup = new THREE.Group();
  
  // 核心着色器材质 - 实现闪亮的太阳表面效果
  const coreGeometry = new THREE.SphereGeometry(starSize, 64, 64);
  const coreColor = new THREE.Color(body.color);
  
  // 太阳表面着色器 - 实现闪烁和表面细节
  const coreMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: coreColor },
      time: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float time;
      varying vec2 vUv;
      varying vec3 vNormal;
      
      // 柏林噪声函数
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        
        // 计算网格坐标
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        
        // 计算四个顶点坐标
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        
        // 计算哈希值
        i = mod289(i);
        vec4 p = permute(permute(permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0));
               
        // 梯度计算
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        
        // 归一化梯度
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        
        // 混合
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }
      
      void main() {
        // 基于法线创建光照效果
        float lightIntensity = 1.0 - 0.8 * max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
        
        // 表面细节 - 多层噪声叠加
        vec3 noisePos = vNormal * 2.0;
        float smallNoise = snoise(noisePos * 15.0 + time * 0.1) * 0.2;
        float mediumNoise = snoise(noisePos * 7.0 + time * 0.05) * 0.3;
        float largeNoise = snoise(noisePos * 3.0 + time * 0.02) * 0.5;
        
        // 组合噪声创建表面细节
        float surfaceDetail = (smallNoise + mediumNoise + largeNoise) * 0.5;
        
        // 明亮的边缘
        float rimLight = pow(lightIntensity, 2.0) * 1.5;
        
        // 扰动基础颜色
        vec3 baseColor = color;
        
        // 闪光点
        float flare = pow(max(0.0, 
          snoise(vNormal * 10.0 + time * 0.2) * 0.5 +
          snoise(vNormal * 20.0 + time * 0.3) * 0.3
        ), 3.0) * 0.5;
        
        // 温度变化 - 更热的区域更亮
        float hotSpot = max(0.0, surfaceDetail) * 0.8;
        
        // 最终颜色
        vec3 finalColor = baseColor * (1.0 + surfaceDetail * 0.3) + vec3(rimLight) + vec3(flare) + vec3(hotSpot) * 0.7;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    transparent: true
  });
  
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  core.userData = { isAnimated: true, animationType: 'solarSurface', time: 0 };
  starGroup.add(core);
  
  // 创建太阳日冕/光晕
  const coronaGeometry = new THREE.SphereGeometry(starSize * 1.4, 32, 32);
  const coronaMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: coreColor },
      time: { value: 0 }
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
      uniform float time;
      varying vec3 vNormal;
      
      void main() {
        // 计算视线方向和法线的夹角，用于创建边缘光晕
        float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        
        // 使用时间参数创建脉动效果
        float pulse = 0.9 + 0.1 * sin(time * 0.5);
        intensity *= pulse;
        
        // 创建柔和的梯度
        float falloff = 1.0 - pow(intensity * 0.8, 2.0);
        
        // 调整颜色 - 使光晕比核心稍微偏黄/红
        vec3 coronaColor = mix(color, vec3(1.0, 0.6, 0.3), 0.3);
        
        gl_FragColor = vec4(coronaColor, intensity * falloff);
      }
    `,
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  
  const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
  corona.userData = { isAnimated: true, animationType: 'corona', time: 0 };
  starGroup.add(corona);
  
  // 添加太阳耀斑和光芒
  if (body.hasParticles !== false) {
    // 太阳耀斑射线 - 使用斐波那契球面分布
    const flareCount = 55; // 使用斐波那契数
    
    // 定义几类不同长度的光芒
    const rayLengthCategories = [
      starSize * 1.2,  // 短光芒
      starSize * 2.0,  // 中等光芒
      starSize * 3.0   // 长光芒
    ];
    
    for (let i = 0; i < flareCount; i++) {
      // 使用斐波那契球面分布算法获取均匀点分布
      const y = 1 - (i / (flareCount - 1)) * 2; // 从1到-1的均匀映射
      const radius = Math.sqrt(1 - y * y);      // 半径
      
      // 黄金角度 ≈ 137.5°
      const theta = Math.PI * (3 - Math.sqrt(5)) * i;
      
      // 球面坐标
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      
      // 根据位置确定光芒长度 - 形成对称美学模式
      // 赤道区域光芒更长，极区光芒更短，创建有节奏的变化
      let rayLengthIndex;
      const absY = Math.abs(y);
      
      if (absY < 0.3) {
        // 赤道区域 - 长光芒
        rayLengthIndex = 2;
      } else if (absY < 0.7) {
        // 中间区域 - 中等光芒
        rayLengthIndex = 1;
      } else {
        // 极区 - 短光芒
        rayLengthIndex = 0;
      }
      
      // 添加一些变化，但保持数学模式
      // 按照斐波那契序列的索引位置微调长度
      const isFibonacciIndex = [1, 2, 3, 5, 8, 13, 21, 34].includes(i % 55);
      if (isFibonacciIndex) {
        rayLengthIndex = Math.min(2, rayLengthIndex + 1); // 斐波那契位置的光芒更长
      }
      
      // 最终光芒长度和宽度
      const rayLength = rayLengthCategories[rayLengthIndex];
      const rayWidth = starSize * 0.08 * (1 + 0.5 * rayLengthIndex); // 更长的光芒略微更宽
      
      // 创建射线几何体
      const rayGeometry = new THREE.BoxGeometry(rayWidth, rayLength, rayWidth);
      
      // 光芒材质 - 发光效果，随时间变化亮度
      const rayMaterial = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: coreColor },
          time: { value: 0 },
          rayIndex: { value: i }
        },
        vertexShader: `
          uniform float time;
          uniform float rayIndex;
          varying vec2 vUv;
          varying vec3 vPosition;
          
          // 周期函数，使用正弦组合产生更复杂的周期变化
          float cyclicFunction(float t, float phase, float frequency) {
            return 0.5 * sin(t * frequency + phase) + 0.5 * sin(t * frequency * 1.618 + phase * 0.618);
          }
          
          // 原始顶点变换函数，用于伸缩动画
          vec3 transformVertex(vec3 position, float time, float index) {
            // 使用不同频率的正弦函数组合
            float phaseOffset = index * 0.618033988749895; // 黄金比例相位偏移
            
            // 数学美学：每个光芒按照黄金分割比例相移的正弦波
            float pulseFactor = 0.4 * cyclicFunction(time, phaseOffset, 0.5) + 0.6;
            
            // 沿Y轴伸缩，Y轴是光芒的长度方向
            if (position.y > 0.0) {
              position.y *= pulseFactor;
            }
            
            return position;
          }
          
          void main() {
            // 通过变换坐标实现伸缩效果
            vec3 transformedPosition = transformVertex(position, time, rayIndex);
            
            vUv = uv;
            vPosition = transformedPosition;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(transformedPosition, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          uniform float time;
          uniform float rayIndex;
          varying vec2 vUv;
          varying vec3 vPosition;
          
          // 周期函数，使用正弦组合产生更复杂的周期变化
          float cyclicFunction(float t, float phase, float frequency) {
            return 0.5 * sin(t * frequency + phase) + 0.5 * sin(t * frequency * 1.618 + phase * 0.618);
          }
          
          void main() {
            // 距离核心的距离决定亮度衰减
            float distanceFromCenterY = abs(vPosition.y);
            float distanceFromCenterXZ = length(vPosition.xz);
            
            // 沿长度方向的亮度衰减 - 使用平方根函数使衰减更加自然
            float lengthFade = max(0.0, 1.0 - sqrt(distanceFromCenterY / ${rayLength.toFixed(1)}));
            
            // 从中心向外的径向亮度衰减
            float radialFade = max(0.0, 1.0 - distanceFromCenterXZ / (${rayWidth.toFixed(1)} * 0.5));
            
            // 相位偏移 - 基于黄金分割比例
            float phaseOffset = rayIndex * 0.618033988749895;
            
            // 基于时间的脉动亮度 - 使用复合周期函数
            float pulse = 0.4 * cyclicFunction(time, phaseOffset, 0.5) + 0.6;
            
            // 最终亮度，随着伸缩变化
            float brightness = lengthFade * radialFade * pulse;
            brightness = pow(brightness, 0.5); // 使衰减更平滑
            
            // 从核心颜色向更亮/更热的颜色过渡
            vec3 hotColor = vec3(1.0, 0.8, 0.5); // 更热的黄白色
            vec3 finalColor = mix(color, hotColor, brightness * 0.7);
            
            gl_FragColor = vec4(finalColor, brightness);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      
      const ray = new THREE.Mesh(rayGeometry, rayMaterial);
      
      // 使用计算好的球面坐标放置光芒
      const rayPosition = new THREE.Vector3(x, y, z).multiplyScalar(starSize);
      
      // 设置光芒位置
      ray.position.copy(rayPosition);
      
      // 让光芒指向外部 - 关键是要让光芒指向球面法线方向
      ray.lookAt(rayPosition.clone().multiplyScalar(2)); // 向外看
      
      // 存储原始位置以便动画
      ray.userData = { 
        isAnimated: true, 
        animationType: 'solarRay', 
        time: i * 0.618033988749895, // 黄金比例相位差
        originalPosition: rayPosition.clone(),
        rayIndex: i
      };
      
      starGroup.add(ray);
    }
    
    // 添加热粒子 - 模拟向外扩散的热量粒子
    const heatParticlesCount = 1000;
    const heatParticlesGeometry = new THREE.BufferGeometry();
    const heatParticlesPositions = new Float32Array(heatParticlesCount * 3);
    const heatParticlesSizes = new Float32Array(heatParticlesCount);
    
    // 生成粒子位置和大小
    for (let i = 0; i < heatParticlesCount; i++) {
      // 在恒星周围生成粒子
      const radius = starSize * THREE.MathUtils.randFloat(1.2, 2.5);
      const phi = Math.acos(-1 + (2 * Math.random()));
      const theta = Math.random() * Math.PI * 2;
      
      heatParticlesPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      heatParticlesPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      heatParticlesPositions[i * 3 + 2] = radius * Math.cos(phi);
      
      // 随机粒子大小
      heatParticlesSizes[i] = THREE.MathUtils.randFloat(0.05, 0.2);
    }
    
    heatParticlesGeometry.setAttribute('position', new THREE.BufferAttribute(heatParticlesPositions, 3));
    heatParticlesGeometry.setAttribute('size', new THREE.BufferAttribute(heatParticlesSizes, 1));
    
    // 粒子着色器 - 带有闪烁效果
    const heatParticlesMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: coreColor },
        time: { value: 0 },
        pointTexture: { value: new THREE.TextureLoader().load('') } // 空纹理
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float time;
        
        void main() {
          vColor = vec3(1.0, 0.6, 0.1); // 偏黄/橙色的热量粒子
          
          // 添加一些运动
          vec3 pos = position;
          float offset = fract(time * 0.1 + length(position) * 0.1);
          
          // 让粒子随时间向外移动
          vec3 direction = normalize(position);
          pos += direction * offset * 0.5;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        varying vec3 vColor;
        
        void main() {
          // 圆形粒子
          float r = length(gl_PointCoord - vec2(0.5, 0.5)) * 2.0;
          if (r > 1.0) discard;
          
          // 柔和的粒子边缘
          float alpha = 1.0 - r;
          alpha = pow(alpha, 1.5);
          
          // 混合颜色
          vec3 finalColor = mix(vColor, color, 0.5);
          
          gl_FragColor = vec4(finalColor, alpha * 0.7);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const heatParticles = new THREE.Points(heatParticlesGeometry, heatParticlesMaterial);
    heatParticles.userData = { isAnimated: true, animationType: 'heatParticles', time: 0 };
    starGroup.add(heatParticles);
  }
  
  // 更新动画函数
  starGroup.userData.update = function(delta: number) {
    // 更新所有着色器时间
    starGroup.children.forEach(child => {
      if (child.userData && child.userData.isAnimated) {
        child.userData.time = (child.userData.time || 0) + delta;
        
        // 使用类型断言来安全地访问材质和uniforms
        const mesh = child as THREE.Mesh;
        if (mesh.material && mesh.material instanceof THREE.ShaderMaterial) {
          mesh.material.uniforms.time.value = child.userData.time;
        }
      }
    });
    
    // 星体轻微自转
    starGroup.rotation.y += 0.05 * delta;
  };
  
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
