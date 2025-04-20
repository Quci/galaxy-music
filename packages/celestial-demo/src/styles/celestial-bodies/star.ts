import * as THREE from 'three';

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
          rayIndex: { value: i },
          rayLength: { value: rayLength },
          rayWidth: { value: rayWidth }
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
          uniform float rayLength;
          uniform float rayWidth;
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
            float lengthFade = max(0.0, 1.0 - sqrt(distanceFromCenterY / rayLength));
            
            // 从中心向外的径向亮度衰减
            float radialFade = max(0.0, 1.0 - distanceFromCenterXZ / (rayWidth * 0.5));
            
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
