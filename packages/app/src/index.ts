import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

// 创建一个场景
const scene = new THREE.Scene();

// 创建一个相机
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5; // 将相机向后移动，以便我们可以看到半椭球体

// 创建一个渲染器，并设置其大小
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 创建半椭球体的几何体
const xRadius = 1, yRadius = 2, zRadius = 1; // 椭球体的x、y、z轴半径
const hemisphereGeometry = new THREE.SphereGeometry(yRadius, 32, 32, 0, Math.PI / 10, 0, Math.PI); // 创建上半球

// 创建一个材质
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: false });

// 创建一个网格（Mesh）并添加到场景中
const hemisphere = new THREE.Mesh(hemisphereGeometry, material);
hemisphere.scale.set(xRadius, yRadius, zRadius); // 缩放以匹配椭球体的半径
hemisphere.rotation.y = Math.PI / 4;
hemisphere.rotation.x = Math.PI / 14;

scene.add(hemisphere);

// 创建一个光源
const light = new THREE.HemisphereLight(0xffffff, 0x444444);
light.position.set(0, 1, 0);
scene.add(light);

// 添加一个环境光
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// 创建OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0); // 设置控制的焦点，即半椭球体的中心

// 加载字体并创建文字
const loader = new FontLoader();
loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
    const textGeometry = new TextGeometry('hello world', {
        font: font,
        size: 0.2,
        height: 0.05,
        curveSegments: 12,
    });

    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);

    // Compute bounding box to center the text
    textGeometry.computeBoundingBox();

    const boundingBox = textGeometry.boundingBox;
    if (boundingBox) {
        const centerOffset = -0.5 * (boundingBox.max.x - boundingBox.min.x);

        textMesh.position.x = centerOffset;
        textMesh.position.y = 0;

        // 将文字顶点设置在弧面上
        const vertices = textGeometry.attributes.position.array;
        const radiusModifier = 1.0;  // 半径修正值，根据实际需要调整

        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const y = vertices[i + 1];
            const z = vertices[i + 2];

            const theta = (x - centerOffset) / yRadius;  // 计算角度
            const phi = y / yRadius;
            const r = yRadius * radiusModifier;

            vertices[i] = r * Math.sin(theta) * Math.cos(phi);  // 重新映射 x 坐标
            vertices[i + 1] = r * Math.sin(phi);  // 重新映射 y 坐标
            vertices[i + 2] = r * Math.cos(theta) * Math.cos(phi);  // 重新映射 z 坐标
        }

        textGeometry.attributes.position.needsUpdate = true;

        //根据实际需要旋转文字
        textMesh.rotation.y = Math.PI / 4;
        textMesh.rotation.x = Math.PI / 14;

        scene.add(textMesh);
    }
});

// 创建一个动画循环来渲染场景
const animate = function () {
    requestAnimationFrame(animate);

    // 更新控制器
    controls.update();

    renderer.render(scene, camera);
};

// 调用动画循环
animate();

// 监听窗口大小变化事件，以适应不同屏幕尺寸
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
