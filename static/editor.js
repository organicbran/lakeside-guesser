import * as THREE from 'https://cdn.skypack.dev/three@0.130.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.130.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.130.0/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.130.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.130.0/examples/jsm/postprocessing/RenderPass.js';
import { SAOPass } from 'https://cdn.skypack.dev/three@0.130.0/examples/jsm/postprocessing/SAOPass.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// COLOR
const tint = 0xffffff;
const color = 0x444444;

renderer.setClearColor(tint);
document.body.appendChild(renderer.domElement);
const canvas = renderer.domElement;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);

camera.position.set(-2, 2, 1.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

controls.minDistance = 1;
controls.maxDistance = 5;
controls.minPolarAngle = 0; // radians
controls.maxPolarAngle = 1.25; // radians
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.zoomSpeed = 0.25;
controls.rotateSpeed = 0.85;
controls.panSpeed = 1.4;
controls.screenSpacePanning = false;
controls.autoRotate = false;
controls.autoRotateSpeed = -1.25;

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
const material3 = new THREE.MeshBasicMaterial({ color: 0xeb1c61 });
const material4 = new THREE.MeshBasicMaterial({ color: 0x24d4ab });

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

var pin;
loader.load('./static/models/pin.gltf', function (gltf) {
    pin = gltf.scene.children[0];
    scene.add(pin);
    pin.material = material3;
});

var correctPin;
loader.load('./static/models/pin.gltf', function (gltf) {
    correctPin = gltf.scene.children[0];
    scene.add(correctPin);
    correctPin.material = material4;
    correctPin.position.set(0, -0.2, 0);
});


// INPUT AND RENDER

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
var pinLocked = false;
var mouseDown = false;
var mouseDrag = false;

window.addEventListener('pointermove', function () {

    mouseDrag = true;
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    for (let i = 0; i < intersects.length; i++) {
        const point = intersects[i].point;
        if (!pinLocked && !mouseDown && pin != null) {
            pin.position.set(point.x, point.y, point.z);
        }
    }
});

canvas.addEventListener('click', function () {
    lockPin();
});

canvas.addEventListener('pointerdown', function () {
    mouseDown = true;
    mouseDrag = false;
});

canvas.addEventListener('pointerup', function () {
    mouseDown = false;
});

window.addEventListener('resize', function () {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    composer.setSize(width, height);
});

var guess;
function render() {
    if (pin != null) {
        guess = new THREE.Vector3(pin.position.x, pin.position.y, pin.position.z);
        document.getElementById("coords-x").textContent = guess.x;
        document.getElementById("coords-y").textContent = guess.y;
        document.getElementById("coords-z").textContent = guess.z;
    }

    requestAnimationFrame(render);

    controls.update();
    composer.render();
};

render();

function lockPin() {
    if (!pinLocked && !mouseDrag) {
        pinLocked = true;
        animateClass("mid-panel", "mid-panel-hide", "mid-panel-show");
    }
}

document.getElementById("undo-button").addEventListener('click', function() {
    unpin();
});

function unpin() {
    pinLocked = false;
    animateClass("mid-panel", "mid-panel-show", "mid-panel-hide");
}

function animateClass(baseClass, oldAnimation, newAnimation) {
    let element = document.getElementsByClassName(baseClass)[0];
    element.classList.remove(oldAnimation);
    element.classList.add(newAnimation);
}

function addLocation(x, y, z, id) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {

        if (this.readyState == 4 && this.status == 200) {

        }
    };
    xhttp.open("POST", "./addlocation", true);
    xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    xhttp.send("x=" + x + "&" +
                "y=" + y + "&" +
                "z=" + z + "&" +
                "id=" + id);
}

document.getElementById("add-button").addEventListener('click', function() {
    addLocation(guess.x, guess.y, guess.z, document.getElementById("id").value);
});