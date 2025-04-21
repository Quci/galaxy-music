import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createPlanet, createStar, createBlackHole } from './celestial-styles.js';
export class CelestialDemo {
    constructor(containerId) {
        this.celestialBodies = [];
        this.animationId = null;
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container element with id ${containerId} not found`);
        }
        this.container = container;
        // 初始化场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        // 初始化相机
        this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.camera.position.z = 15;
        // 初始化渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);
        // 初始化控制器
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        // 添加灯光
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
        // 创建星空背景
        this.createStarBackground();
        // 窗口大小调整事件
        window.addEventListener('resize', this.onWindowResize.bind(this));
        // 创建示例天体
        this.createDemoCelestialBodies();
        // 开始动画循环
        this.animate();
    }
    createStarBackground() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.05,
            transparent: true
        });
        const starsVertices = [];
        for (let i = 0; i < 2000; i++) {
            const x = (Math.random() - 0.5) * 2000;
            const y = (Math.random() - 0.5) * 2000;
            const z = (Math.random() - 0.5) * 2000;
            starsVertices.push(x, y, z);
        }
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const starField = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(starField);
    }
    createDemoCelestialBodies() {
        // 创建行星示例
        const planet = createPlanet({
            color: '#3498db',
            size: 1.5
        });
        planet.position.x = -8;
        this.celestialBodies.push(planet);
        this.scene.add(planet);
        // 创建恒星示例
        const star = createStar({
            color: '#e74c3c',
            size: 2
        });
        star.position.x = 0;
        this.celestialBodies.push(star);
        this.scene.add(star);
        // 创建黑洞示例
        const blackHole = createBlackHole({
            color: '#9b59b6',
            size: 1.2
        });
        blackHole.position.x = 8;
        this.celestialBodies.push(blackHole);
        this.scene.add(blackHole);
    }
    animate() {
        this.animationId = requestAnimationFrame(this.animate.bind(this));
        // 更新控制器
        this.controls.update();
        // 更新天体
        this.updateCelestialBodies();
        // 渲染场景
        this.renderer.render(this.scene, this.camera);
    }
    updateCelestialBodies() {
        const deltaTime = 0.016; // 假设约60fps
        this.celestialBodies.forEach(body => {
            // 处理旋转
            if (body.userData.rotationSpeed) {
                if (body.userData.rotationAxis) {
                    body.rotateOnAxis(body.userData.rotationAxis, body.userData.rotationSpeed);
                }
                else {
                    body.rotation.y += body.userData.rotationSpeed;
                }
            }
            // 处理脉动
            if (body.userData.pulseSpeed) {
                body.userData.pulseTime = (body.userData.pulseTime || 0) + deltaTime;
                const pulseFactor = Math.sin(body.userData.pulseTime * body.userData.pulseSpeed) * 0.05;
                const scale = 1 + pulseFactor;
                body.scale.set(scale, scale, scale);
            }
        });
    }
    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
    // 清理资源
    dispose() {
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
        }
        // 清理场景
        while (this.scene.children.length > 0) {
            const child = this.scene.children[0];
            this.scene.remove(child);
        }
        // 清理事件监听器
        window.removeEventListener('resize', this.onWindowResize.bind(this));
        // 清除渲染器
        this.renderer.dispose();
        this.controls.dispose();
    }
}
