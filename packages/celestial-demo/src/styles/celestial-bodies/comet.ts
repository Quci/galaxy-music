import * as THREE from 'three';

// 创建彗星样式 - 扭曲尾巴的蝌蚪
export function createComet(body: any): THREE.Group {
  const cometGroup = new THREE.Group();
  const cometSize = body.size || 0.6;
  const cometColor = new THREE.Color(body.color || '#00bfff');
  
  // 蝌蚪头部 - 使用着色器材质提升外观
  const headSize = cometSize * 0.85; // 减小头部大小15%
  const headGeometry = new THREE.SphereGeometry(headSize, 32, 32);
  
  // 使用着色器材质替代基础材质
  const headMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: cometColor },
      time: { value: 0 }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float time;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec3 vPosition;
      
      // 噪声函数，生成纹理
      float noise(vec3 p) {
        vec3 i = floor(p);
        vec4 a = dot(i, vec3(1.0, 57.0, 21.0)) + vec4(0.0, 57.0, 21.0, 78.0);
        vec3 f = cos((p-i) * acos(-1.0)) * (-0.5) + 0.5;
        a = mix(sin(cos(a) * a), sin(cos(1.0+a) * (1.0+a)), f.x);
        a.xy = mix(a.xz, a.yw, f.y);
        return mix(a.x, a.y, f.z);
      }
      
      void main() {
        // 基础颜色
        vec3 baseColor = color;
        
        // 添加表面纹理和细节
        float n = noise(vPosition * 8.0 + time * 0.2);
        float spotEffect = smoothstep(0.4, 0.6, n) * 0.2;
        
        // 亮斑效果 - 添加一些明亮的斑点
        vec2 center1 = vec2(0.3, 0.4);
        vec2 center2 = vec2(0.7, 0.6);
        float dist1 = length(vUv - center1);
        float dist2 = length(vUv - center2);
        float spots = smoothstep(0.2, 0.1, dist1) * 0.3 + smoothstep(0.25, 0.15, dist2) * 0.3;
        
        // 边缘光效果，使边缘更亮
        float rim = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
        rim = pow(rim, 3.0) * 0.5;
        
        // 组合所有效果
        vec3 finalColor = baseColor * (1.0 + spotEffect + spots + rim);
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    transparent: false,
    depthWrite: true,
    depthTest: true
  });

  const head = new THREE.Mesh(headGeometry, headMaterial);
  cometGroup.add(head);
  
  // 添加内部发光效果 - 在头部内部有一种自发光感
  const innerGlowSize = headSize * 0.8;
  const innerGlowGeometry = new THREE.SphereGeometry(innerGlowSize, 32, 32);
  const innerGlowColor = new THREE.Color(cometColor).multiplyScalar(1.2); // 稍微亮一点的颜色
  const innerGlowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: innerGlowColor },
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
        // 脉动发光效果
        float pulse = (sin(time * 2.0) * 0.5 + 0.5) * 0.2 + 0.8;
        
        // 从中心向边缘渐变
        float intensity = pow(0.8 - dot(vNormal, vec3(0, 0, 1)), 2.0);
        vec3 glow = color * pulse * (0.8 + intensity * 0.5);
        
        gl_FragColor = vec4(glow, 1.0);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide // 从内部向外发光
  });
  
  const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
  head.add(innerGlow); // 添加到头部内部
  
  // 添加头部发光效果
  const glowSize = headSize * 1.5;
  const glowGeometry = new THREE.SphereGeometry(glowSize, 32, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: cometColor,
    transparent: true,
    opacity: 0.4,
    side: THREE.BackSide
  });
  
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  cometGroup.add(glow);
  
  // 创建更大幅度扭曲的蝌蚪尾巴
  const tailLength = cometSize * 5; // 大幅缩短尾巴长度
  
  // 创建尾巴曲线路径 - 更大幅度的扭曲（恢复原来的Z轴方向）
  const curve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0, 0, 0),                           // 起点连接头部
    new THREE.Vector3(0, cometSize * 0.5, -tailLength * 0.3),  // 控制点1 - 轻微向下弯曲
    new THREE.Vector3(0, -cometSize * 1.0, -tailLength * 0.6), // 控制点2 - 轻微向上弯曲
    new THREE.Vector3(0, cometSize * 0.2, -tailLength * 0.95)  // 尾巴末端 - 略微向上，同时缩短一点
  );
  
  // 创建沿曲线路径的一系列点
  const points = curve.getPoints(60);
  
  // 创建尾巴的几何体
  const tailPath = new THREE.CatmullRomCurve3(points);
  const tailRadiusSegments = 12; // 增加分段以获得更平滑的渐变效果
  
  // 创建管道几何体
  const tailGeometry = new THREE.TubeGeometry(
    tailPath,
    50,  // 增加管道分段数
    headSize * 0.35, // 减小尾巴粗细
    tailRadiusSegments,
    false
  );
  
  // 修改几何体顶点使尾巴逐渐变细
  const positions = tailGeometry.attributes.position;
  const vertex = new THREE.Vector3();
  
  // 为渐变色创建顶点颜色数组
  const colors = new Float32Array(positions.count * 3);
  const startColor = new THREE.Color(cometColor);
  const endColor = new THREE.Color();
  
  // 获取起始色的HSL
  const startHSL = { h: 0, s: 0, l: 0 };
  startColor.getHSL(startHSL);
  
  // 设置结束色为稍微暗一点的同色系颜色，而不是色相偏移
  endColor.setHSL(
    startHSL.h,              // 保持相同色相
    startHSL.s * 0.8,        // 略微降低饱和度
    startHSL.l * 0.7         // 略微降低亮度
  );
  
  // 循环处理每个顶点
  for (let i = 0; i < positions.count; i++) {
    // 读取顶点位置
    vertex.fromBufferAttribute(positions, i);
    
    // 计算顶点在路径上的位置比例 (0-1)
    let pathPosition = 0;
    
    // 假设z坐标表示沿路径的位置
    if (vertex.z < 0) {
      pathPosition = Math.abs(vertex.z) / tailLength;
    }
    
    // 通过缩小x和y坐标来使尾巴变细 - 更剧烈的变化
    const scaleFactor = 1 - (pathPosition * 0.98);
    
    vertex.x *= scaleFactor;
    vertex.y *= scaleFactor;
    
    // 更新顶点位置
    positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    
    // 设置渐变颜色
    const color = new THREE.Color().lerpColors(startColor, endColor, pathPosition);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  
  // 更新几何体
  positions.needsUpdate = true;
  tailGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  // 尾巴材质 - 使用顶点颜色
  const tailMaterial = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 1.0, // 增加不透明度到1.0
    side: THREE.DoubleSide
  });
  
  const tail = new THREE.Mesh(tailGeometry, tailMaterial);
  cometGroup.add(tail);
  
  // 确保正确的渲染顺序
  head.renderOrder = 1; // 头部需要最后渲染，确保它能遮挡尾巴
  tail.renderOrder = 0; // 尾巴先渲染
  
  // 调整整个彗星的初始方向，使头朝右，尾巴朝左
  cometGroup.rotation.y = Math.PI * 0.5; // 旋转90度，头部朝向右侧
  
  // 设置动画更新函数 - 更强烈的摆动
  cometGroup.userData.update = function(delta: number) {
    const time = Date.now() * 0.001;
    
    // 更新头部材质时间参数
    if (headMaterial instanceof THREE.ShaderMaterial) {
      headMaterial.uniforms.time.value = time;
    }
    
    // 更新内部发光效果时间参数
    if (innerGlow && innerGlow.material instanceof THREE.ShaderMaterial) {
      innerGlow.material.uniforms.time.value = time;
    }
    
    // 头部发光效果脉动
    const pulseScale = 1 + Math.sin(time * 2) * 0.05;
    glow.scale.set(pulseScale, pulseScale, pulseScale);
    
    // 更自然的上下摆动为主的尾巴效果
    // 基础摇摆 - 主要是上下摆动，减小幅度并增加频率
    const swingY = Math.sin(time * 6) * 0.08; 
    // 轻微的螺旋/旋转效果
    const twistZ = Math.sin(time * 5) * 0.04; 
    
    // 应用旋转
    tail.rotation.x = 0; // 保持水平方向
    tail.rotation.y = swingY; // 上下摆动
    tail.rotation.z = twistZ; // 轻微螺旋效果
    
    // 尾巴形状的波浪变形 - 更加专注于上下摆动
    const positions = tail.geometry.attributes.position;
    const vertex = new THREE.Vector3();
    
    for (let i = 0; i < positions.count; i++) {
      // 读取顶点原始位置
      vertex.fromBufferAttribute(positions, i);
      
      // 计算顶点在路径上的相对位置
      let pathPosition = 0;
      if (vertex.z < 0) {
        pathPosition = Math.abs(vertex.z) / tailLength;
      }
      
      // 添加随时间变化的波浪变形 - 主要是上下波动，减小幅度并增加频率
      // 上下波动随距离增强，频率提高，幅度减小
      const waveY = Math.sin(time * 8 + pathPosition * 12) * pathPosition * cometSize * 0.15;
      // 轻微的左右波动，营造螺旋感，频率提高，幅度减小
      const waveX = Math.cos(time * 7 + pathPosition * 10) * pathPosition * cometSize * 0.05;
      
      // 恢复原始形状
      const originalX = vertex.x / (1 - (pathPosition * 0.98));
      const originalY = vertex.y / (1 - (pathPosition * 0.98));
      
      // 施加波动并重新缩放
      const scaleFactor = 1 - (pathPosition * 0.98);
      vertex.x = (originalX + waveX) * scaleFactor;
      vertex.y = (originalY + waveY) * scaleFactor;
      
      // 更新顶点位置
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    // 标记顶点需要更新
    positions.needsUpdate = true;
  };
  
  // 确保在动画循环中调用更新函数
  const originalGroup = cometGroup.userData.update;
  
  // 确保尾巴的摇摆会自动更新
  setInterval(() => {
    const delta = 0.016; // 近似16ms的帧率
    if (originalGroup) {
      originalGroup(delta);
    }
  }, 16);
  
  return cometGroup;
}
