import * as THREE from 'three';

// 创建双子星系统
export function createPlanet(body: any): THREE.Group {
  // 创建双子星系统组
  const binaryStarGroup = new THREE.Group();
  
  // 设定恒星大小 - 两颗恒星大小相同
  const starSize = (body.size || 1) * 0.75;
  
  // 获取UI传入的颜色
  const uiColor = new THREE.Color(body.color || '#3498db');
  
  // 创建两颗恒星，一颗红色，一颗蓝色
  const star1Geometry = new THREE.SphereGeometry(starSize, 32, 32);
  const star2Geometry = new THREE.SphereGeometry(starSize, 32, 32);
  
  // 第一颗恒星 - 根据UI颜色派生红色调
  const star1Color = new THREE.Color().copy(uiColor).offsetHSL(-0.05, 0.2, 0);
  const star1Material = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: star1Color }, // 使用UI颜色的红色变体
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
        
        // 表面热点
        vec3 hotspotPos = normalize(vNormal + vec3(0.0, 0.0, 1.0));
        float hotspot = pow(max(0.0, dot(hotspotPos, vNormal)), 4.0);
        
        // 计算最终颜色
        vec3 baseColor = color;
        vec3 brightColor = mix(baseColor, vec3(1.0, 0.9, 0.6), 0.7); // 更亮的边缘
        
        // 混合表面颜色
        vec3 finalColor = mix(baseColor, brightColor, rimLight);
        
        // 添加表面细节
        finalColor += surfaceDetail * 0.3 * brightColor;
        
        // 添加热点
        finalColor += hotspot * vec3(1.0, 0.8, 0.6) * 0.5;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `
  });
  
  // 第二颗恒星 - 根据UI颜色派生蓝色调
  const star2Color = new THREE.Color().copy(uiColor).offsetHSL(0.3, 0.2, 0);
  const star2Material = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: star2Color }, // 使用UI颜色的蓝色变体
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
        
        // 表面细节 - 多层噪声叠加（蓝色星体使用不同频率）
        vec3 noisePos = vNormal * 2.0;
        float smallNoise = snoise(noisePos * 18.0 + time * 0.12) * 0.2;
        float mediumNoise = snoise(noisePos * 9.0 + time * 0.07) * 0.3;
        float largeNoise = snoise(noisePos * 4.0 + time * 0.03) * 0.5;
        
        // 组合噪声创建表面细节
        float surfaceDetail = (smallNoise + mediumNoise + largeNoise) * 0.5;
        
        // 明亮的边缘
        float rimLight = pow(lightIntensity, 2.0) * 1.5;
        
        // 表面热点
        vec3 hotspotPos = normalize(vNormal + vec3(0.0, 0.0, 1.0));
        float hotspot = pow(max(0.0, dot(hotspotPos, vNormal)), 4.0);
        
        // 计算最终颜色
        vec3 baseColor = color;
        vec3 brightColor = mix(baseColor, vec3(0.6, 0.9, 1.0), 0.7); // 更亮的蓝色边缘
        
        // 混合表面颜色
        vec3 finalColor = mix(baseColor, brightColor, rimLight);
        
        // 添加表面细节
        finalColor += surfaceDetail * 0.3 * brightColor;
        
        // 添加热点
        finalColor += hotspot * vec3(0.8, 0.9, 1.0) * 0.5;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `
  });
  
  const star1 = new THREE.Mesh(star1Geometry, star1Material);
  const star2 = new THREE.Mesh(star2Geometry, star2Material);
  
  // 为每颗恒星创建三个环，围绕X、Y、Z轴独立旋转
  const createRings = (star: THREE.Mesh, color: THREE.Color) => {
    // 创建三个环，分别围绕X、Y、Z轴
    const axes = ['x', 'y', 'z'];
    const rings = [];
    
    for (let i = 0; i < 3; i++) {
      const ringSize = starSize * 1.5 + i * 0.3;
      const ringGeometry = new THREE.RingGeometry(ringSize - 0.1, ringSize, 64);
      
      // 使用着色器材质替代基础材质
      const ringMaterial = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: color },
          time: { value: 0.0 },
          opacity: { value: 0.8 - i * 0.15 }
        },
        vertexShader: `
          varying vec2 vUv;
          uniform float time;
          
          void main() {
            vUv = uv;
            
            // 添加微妙的波动
            vec3 pos = position;
            float wave = sin(position.x * 5.0 + time * 2.0) * cos(position.y * 5.0 + time) * 0.02;
            pos += normal * wave;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          uniform float time;
          uniform float opacity;
          varying vec2 vUv;
          
          void main() {
            // 创建环上明亮光点流动效果
            float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
            float normalizedAngle = angle / (2.0 * 3.14159) + 0.5;
            
            // 在环上创建多个明亮点
            float brightPoints = 0.0;
            for (int i = 0; i < 6; i++) {
              float offset = float(i) * 0.16667;
              float pointAngle = normalizedAngle - mod(time * 0.2 + offset, 1.0);
              brightPoints += 0.5 * smoothstep(0.05, 0.0, abs(pointAngle - floor(pointAngle + 0.5)));
            }
            
            // 创建随角度变化的基础颜色
            vec3 baseColor = color;
            
            // 添加随时间的辉光波纹
            float wave = sin(normalizedAngle * 20.0 - time * 2.0) * 0.5 + 0.5;
            wave *= 0.3;
            
            // 混合最终颜色
            vec3 finalColor = baseColor * (1.0 + wave);
            
            // 增加光点亮度
            finalColor = mix(finalColor, vec3(1.0), brightPoints * 0.7);
            
            // 添加半透明度 - 边缘更透明
            float alpha = opacity * (0.7 + brightPoints * 0.3);
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        side: THREE.DoubleSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      
      // 根据轴设置旋转
      if (axes[i] === 'x') {
        ring.rotation.y = Math.PI / 2;
      } else if (axes[i] === 'z') {
        ring.rotation.x = Math.PI / 2;
      }
      
      // 存储环的信息以供动画更新
      ring.userData.axis = axes[i];
      ring.userData.rotationSpeed = 0.01 + i * 0.005; // 环的旋转速度
      
      star.add(ring);
      rings.push(ring);
    }
    
    return rings;
  };
  
  // 为每颗恒星添加发光效果
  const addGlow = (star: THREE.Mesh, color: THREE.Color) => {
    const glowSize = starSize * 1.2;
    const glowGeometry = new THREE.SphereGeometry(glowSize, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    star.add(glow);
    
    return glow;
  };
  
  // 为恒星添加环和发光效果
  const star1Rings = createRings(star1, star1Color);
  const star2Rings = createRings(star2, star2Color);
  
  const star1Glow = addGlow(star1, star1Color);
  const star2Glow = addGlow(star2, star2Color);
  
  // 创建独立的星体容器以便轨道旋转
  const star1System = new THREE.Group();
  const star2System = new THREE.Group();
  
  star1System.add(star1);
  star2System.add(star2);
  
  // 设置恒星间距离 - 也缩小为75%
  const orbitRadius = starSize * 4 * 0.75;
  
  // 将恒星放置在预定位置
  star1.position.set(orbitRadius, 0, 0);
  star2.position.set(-orbitRadius, 0, 0);
  
  // 创建连接两颗恒星的光幔
  const createConnectionBridges = () => {
    const bridgeGroup = new THREE.Group();
    const bridgeCount = 2; // 只创建两条连接线
    
    for (let i = 0; i < bridgeCount; i++) {
      // 创建一条基于贝塞尔曲线的光幔
      const segments = 50;
      
      // 创建更有动感的曲线路径
      const yOffset = (i === 0) ? starSize * 1.5 : -starSize * 1.5; // 一条在上方，一条在下方
      
      const curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(orbitRadius, 0, 0), // 起点 - 第一颗恒星位置
        new THREE.Vector3(orbitRadius * 0.3, yOffset, starSize), // 控制点1 - 更加弯曲
        new THREE.Vector3(-orbitRadius * 0.3, yOffset, -starSize), // 控制点2 - 更加弯曲
        new THREE.Vector3(-orbitRadius, 0, 0) // 终点 - 第二颗恒星位置
      );
      
      const points = curve.getPoints(segments);
      const bridgeGeometry = new THREE.BufferGeometry().setFromPoints(points);
      
      // 创建颜色数组 - 从红色渐变到蓝色
      const colors = new Float32Array((segments + 1) * 3);
      
      // 设置颜色 - 上面的线从红到蓝，下面的线从蓝到红
      const startColor = i === 0 ? 
                         star1Color.clone() : // 上面的线从第一颗恒星颜色开始
                         star2Color.clone();  // 下面的线从第二颗恒星颜色开始
                         
      const endColor = i === 0 ? 
                       star2Color.clone() : // 上面的线到第二颗恒星颜色结束
                       star1Color.clone();  // 下面的线到第一颗恒星颜色结束
      
      for (let j = 0; j <= segments; j++) {
        const t = j / segments;
        const color = new THREE.Color().lerpColors(startColor, endColor, t);
        
        colors[j * 3] = color.r;
        colors[j * 3 + 1] = color.g;
        colors[j * 3 + 2] = color.b;
      }
      
      bridgeGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      
      // 使用顶点颜色的材质
      const bridgeMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        linewidth: 2
      });
      
      const bridge = new THREE.Line(bridgeGeometry, bridgeMaterial);
      
      // 存储桥的数据，用于动画
      bridge.userData = {
        time: 0,
        yOffset: yOffset,
        startHue: i === 0 ? 0.05 : 0.65, // 红色或蓝色色相起点
        endHue: i === 0 ? 0.65 : 0.05,   // 另一端的色相
        hueSpeed: 0.1,
        flowSpeed: i === 0 ? 1.0 : -1.0  // 上线正向流动，下线反向流动
      };
      
      bridgeGroup.add(bridge);
    }
    
    return bridgeGroup;
  };
  
  const connectionBridges = createConnectionBridges();
  
  // 将所有组件添加到主组
  binaryStarGroup.add(star1System);
  binaryStarGroup.add(star2System);
  binaryStarGroup.add(connectionBridges);
  
  // 设置动画更新函数
  binaryStarGroup.userData.update = function(delta: number) {
    // 恒星系统慢慢围绕中心旋转
    const orbitSpeed = 0.02; // 非常慢的轨道旋转速度
    const time = Date.now() * 0.001;
    
    // 更新恒星位置，使其围绕中心旋转
    star1System.position.x = Math.cos(time * orbitSpeed) * orbitRadius;
    star1System.position.z = Math.sin(time * orbitSpeed) * orbitRadius;
    
    star2System.position.x = -Math.cos(time * orbitSpeed) * orbitRadius;
    star2System.position.z = -Math.sin(time * orbitSpeed) * orbitRadius;
    
    // 恒星自转
    star1.rotation.y += 0.005;
    star2.rotation.y += 0.005;
    
    // 更新环的旋转
    star1Rings.forEach(ring => {
      const axis = ring.userData.axis;
      const speed = ring.userData.rotationSpeed;
      if (axis === 'x') ring.rotation.x += speed;
      if (axis === 'y') ring.rotation.y += speed;
      if (axis === 'z') ring.rotation.z += speed;
    });
    
    star2Rings.forEach(ring => {
      const axis = ring.userData.axis;
      const speed = ring.userData.rotationSpeed;
      if (axis === 'x') ring.rotation.x += speed;
      if (axis === 'y') ring.rotation.y += speed;
      if (axis === 'z') ring.rotation.z += speed;
    });
    
    // 更新环的着色器时间
    star1Rings.forEach(ring => {
      if (ring.material instanceof THREE.ShaderMaterial) {
        ring.material.uniforms.time.value = time;
      }
    });
    
    star2Rings.forEach(ring => {
      if (ring.material instanceof THREE.ShaderMaterial) {
        ring.material.uniforms.time.value = time;
      }
    });
    
    // 更新连接光幔动画
    connectionBridges.children.forEach((bridge) => {
      if (bridge instanceof THREE.Line) {
        // 更新时间
        bridge.userData.time += delta;
        
        // 轻微移动光幔控制点，形成动态效果
        const segments = 50;
        
        // 使曲线变得更加活跃
        const waveTime = bridge.userData.time * 0.3;
        const offset = Math.sin(waveTime) * starSize * 0.3;
        const yOffset = bridge.userData.yOffset + Math.sin(waveTime * 0.7) * starSize * 0.1;
        
        // 动态控制点，使曲线看起来微微摆动
        const curve = new THREE.CubicBezierCurve3(
          new THREE.Vector3(star1System.position.x, star1System.position.y, star1System.position.z),
          new THREE.Vector3(star1System.position.x * 0.3, yOffset + offset, starSize),
          new THREE.Vector3(star2System.position.x * 0.3, yOffset - offset, -starSize),
          new THREE.Vector3(star2System.position.x, star2System.position.y, star2System.position.z)
        );
        
        const newPoints = curve.getPoints(segments);
        
        // 更新曲线几何形状和颜色
        if (bridge.geometry instanceof THREE.BufferGeometry) {
          // 更新顶点位置
          const positions = new Float32Array(newPoints.length * 3);
          for (let i = 0; i < newPoints.length; i++) {
            positions[i * 3] = newPoints[i].x;
            positions[i * 3 + 1] = newPoints[i].y;
            positions[i * 3 + 2] = newPoints[i].z;
          }
          bridge.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          
          // 更新端点颜色 - 随时间变化形成流动效果
          // 计算当前色相值
          bridge.userData.startHue = (bridge.userData.startHue + delta * bridge.userData.hueSpeed * bridge.userData.flowSpeed) % 1.0;
          bridge.userData.endHue = (bridge.userData.endHue + delta * bridge.userData.hueSpeed * bridge.userData.flowSpeed) % 1.0;
          
          // 确保色相为正值
          if (bridge.userData.startHue < 0) bridge.userData.startHue += 1.0;
          if (bridge.userData.endHue < 0) bridge.userData.endHue += 1.0;
          
          // 创建HSL颜色，保持高饱和度和中等亮度
          const startColor = new THREE.Color().setHSL(bridge.userData.startHue, 1.0, 0.5);
          const endColor = new THREE.Color().setHSL(bridge.userData.endHue, 1.0, 0.5);
          
          // 更新颜色属性
          const colors = new Float32Array((segments + 1) * 3);
          for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const color = new THREE.Color().lerpColors(startColor, endColor, t);
            
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
          }
          
          bridge.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
          bridge.geometry.attributes.position.needsUpdate = true;
          bridge.geometry.attributes.color.needsUpdate = true;
        }
        
        // 更新线条透明度
        if (bridge.material instanceof THREE.LineBasicMaterial) {
          bridge.material.opacity = 0.6 + 0.4 * Math.sin(bridge.userData.time * 0.3);
        }
      }
    });
    
    // 更新恒星表面着色器的时间
    if (star1.material instanceof THREE.ShaderMaterial) {
      star1.material.uniforms.time.value += delta;
    }
    
    if (star2.material instanceof THREE.ShaderMaterial) {
      star2.material.uniforms.time.value += delta;
    }
    
    // 更新恒星辉光的透明度，产生脉动效果
    if (star1Glow.material instanceof THREE.MeshBasicMaterial) {
      star1Glow.material.opacity = 0.2 + 0.1 * Math.sin(time * 2);
    }
    
    if (star2Glow.material instanceof THREE.MeshBasicMaterial) {
      star2Glow.material.opacity = 0.2 + 0.1 * Math.sin(time * 2 + Math.PI); // 与star1相位相反
    }
  };
  
  // 设置统一的旋转数据，但实际上动画是在update函数中处理的
  binaryStarGroup.userData.rotationSpeed = 0.02;
  binaryStarGroup.userData.rotationAxis = new THREE.Vector3(0, 1, 0);
  
  return binaryStarGroup;
}
