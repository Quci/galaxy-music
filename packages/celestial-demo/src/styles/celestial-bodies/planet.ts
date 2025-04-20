import * as THREE from 'three';

// 创建双子星系统
export function createPlanet(body: any): THREE.Group {
  // 创建双子星系统组
  const binaryStarGroup = new THREE.Group();
  
  // 设定恒星大小 - 两颗恒星大小相同
  const starSize = body.size || 1;
  
  // 创建两颗恒星，一颗红色，一颗蓝色
  const star1Geometry = new THREE.SphereGeometry(starSize, 32, 32);
  const star2Geometry = new THREE.SphereGeometry(starSize, 32, 32);
  
  // 第一颗恒星 - 红色
  const star1Material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xff4500) // 红色
  });
  
  // 第二颗恒星 - 蓝色 
  const star2Material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0x4169e1) // 蓝色
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
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5 - i * 0.1
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
      ring.userData.rotationSpeed = 0.01 + i * 0.005; // 环的旋转速度较快
      
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
  const star1Rings = createRings(star1, new THREE.Color(0xff4500));
  const star2Rings = createRings(star2, new THREE.Color(0x4169e1));
  
  const star1Glow = addGlow(star1, new THREE.Color(0xff4500));
  const star2Glow = addGlow(star2, new THREE.Color(0x4169e1));
  
  // 创建独立的星体容器以便轨道旋转
  const star1System = new THREE.Group();
  const star2System = new THREE.Group();
  
  star1System.add(star1);
  star2System.add(star2);
  
  // 设置恒星间距离
  const orbitRadius = starSize * 4;
  
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
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      
      // 初始化颜色数组 - 设置两端不同颜色，中间自动形成渐变
      const colors = new Float32Array((segments + 1) * 3);
      
      // 设置初始端点颜色
      const startColor = new THREE.Color(0xff0000); // 红色
      const endColor = new THREE.Color(0x0000ff); // 蓝色
      
      // 应用渐变色
      for (let j = 0; j <= segments; j++) {
        const t = j / segments;
        const color = new THREE.Color().lerpColors(startColor, endColor, t);
        
        colors[j * 3] = color.r;
        colors[j * 3 + 1] = color.g;
        colors[j * 3 + 2] = color.b;
      }
      
      // 将颜色属性添加到几何体
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      
      // 使用顶点颜色材质
      const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        linewidth: 5  // 加粗线条
      });
      
      const bridge = new THREE.Line(geometry, material);
      
      // 存储动画参数
      bridge.userData = {
        curveIndex: i,
        time: 0, // 初始时间
        flowSpeed: i === 0 ? 1.0 : -1.0, // 流动速度和方向
        startHue: 0, // 初始色相
        endHue: 0.5, // 初始终点色相
        hueSpeed: 0.2, // 色相变化速度
        yOffset: yOffset
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
