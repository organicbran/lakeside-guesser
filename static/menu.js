import * as THREE from 'https://cdn.skypack.dev/three@0.130.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.130.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.130.0/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.130.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.130.0/examples/jsm/postprocessing/RenderPass.js';
import { SAOPass } from 'https://cdn.skypack.dev/three@0.130.0/examples/jsm/postprocessing/SAOPass.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// COLOR
const tint = 0x0652DD;
const color = 0x9980FA;

renderer.setClearColor(tint);
document.body.appendChild(renderer.domElement);
const canvas = renderer.domElement;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);

camera.position.set(-2, 2, 1.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

controls.enabled = false;
controls.autoRotate = true;
controls.autoRotateSpeed = -0.3;

const light = new THREE.DirectionalLight(color, 1.25);
light.position.set(-0.5, 2, 2);
scene.add(light);

const fill = new THREE.AmbientLight(0x999999, 1);
scene.add(fill);

scene.fog = new THREE.Fog(tint, 1, 7);

const composer = new EffectComposer(renderer);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const saoPass = new SAOPass(scene, camera, false, true);
saoPass.params.saoBias = 1;
saoPass.params.saoIntensity = 0.075;
saoPass.params.saoScale = 100;
saoPass.params.saoKernelRadius = 100;
saoPass.params.saoBlur = true;
saoPass.params.saoBlurRadius = 4;
composer.addPass(saoPass);


// MESHES 

const material = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
const material2 = new THREE.MeshLambertMaterial({ color: 0xdddddd });

const geometry = new THREE.PlaneGeometry(1, 1, 1);
const plane = new THREE.Mesh(geometry, material2);
plane.rotation.x = -Math.PI / 2;
plane.scale.set(200, 200, 200);
plane.position.y = -0.005;
scene.add(plane);

const loader = new GLTFLoader();

loader.load('./static/models/map.gltf', function (gltf) {
    let map = gltf.scene.children[0];
    scene.add(map);
    map.material = material;
});

// RENDER

window.addEventListener('resize', function () {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    composer.setSize(width, height);
});

function render() {
    requestAnimationFrame(render);

    controls.update();
    composer.render();
};

render();