import * as THREE from 'https://cdn.skypack.dev/three@0.130.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.130.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.130.0/examples/jsm/loaders/GLTFLoader.js';
import { Clock } from 'https://cdn.skypack.dev/three@0.130.0/src/core/Clock.js';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.130.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.130.0/examples/jsm/postprocessing/RenderPass.js';
import { SAOPass } from 'https://cdn.skypack.dev/three@0.130.0/examples/jsm/postprocessing/SAOPass.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// COLOR
const tint = 0xED4C67;
const color = 0xFFC312;

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

/* GAME SETTINGS */

const maxRounds = 5;
const locationCount = 60;

const clock = new Clock();
var totalTime = 0;
var timeBonus = 0;

var guess = new THREE.Vector2();
var guessed = false;
var scored = false;
var finished = false;
var submitted = false;
var round = 1;

var totalScore = 0;

function render() {
    if (pin != null) {
        guess = new THREE.Vector2(pin.position.x, pin.position.z);
    }

    requestAnimationFrame(render);

    controls.update();
    composer.render();

    if (!guessed) {
        var time = Math.round(clock.getElapsedTime() * 10) / 10;
        document.getElementById("timer-text").textContent = new Date((time) * 1000).toISOString().substring(15, 21);

        timeBonus = Math.max(Math.ceil(400 - (40/3) * time), 0);
    }
};

render();

var locationID = reset();

function scoreGuess(x, z) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {

        if (this.readyState == 4 && this.status == 200) {

            scored = true;

            let response = this.responseText.split(" ");
            let distance = response[0];
            let score = response[1];
            let correctX = response[2];
            let correctY = response[3];
            let correctZ = response[4];

            document.getElementById("distance").textContent = Math.round(distance * 100)/100 + " meters";

            document.getElementById("points-text").textContent = score + " POINTS";
            let actualTimeBonus = 0;
            if (score > 0) {
                actualTimeBonus = timeBonus;
            }
            
            totalScore += parseInt(score) + actualTimeBonus;
            document.getElementById("time-bonus-text").textContent = "+ " + actualTimeBonus;
            document.getElementById("score-text").textContent = totalScore;
            document.getElementById("total-time-text").textContent = new Date(totalTime * 1000).toISOString().substring(15, 21);
            document.getElementById("total-round-points").textContent = "+ " + (parseInt(score) + actualTimeBonus);

            cardShuffle();
            animateClass("left-panel", "stats-panel-shrink", "stats-panel-expand");
            animateClass("round-stats", "stats-details-hide", "stats-details-show");
            animateClass("location-image", "image-card-enter", "image-card-exit");

            correctPin.position.set(correctX, correctY, correctZ);

            controls.autoRotate = true;

            if (!finished) {
                let confirm = document.getElementsByClassName("confirm-button")[0];
                confirm.textContent = "NEXT ROUND";
                confirm.classList.add("confirm-button-next");
            }
            else {
                submitScore();
            }
        }
    };

    xhttp.open("POST", "./score", true);
    xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    xhttp.send("x=" + x + "&" +
                "z=" + z + "&" +
                "id=" + locationID);
}

let username = "bryan";
username = document.getElementById("name-panel").textContent;

function submitScore() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {

        if (this.readyState == 4 && this.status == 200) {
            submitted = true;
            let confirm = document.getElementsByClassName("confirm-button")[0];
            confirm.textContent = "CONTINUE";
            confirm.classList.add("confirm-button-next");
        }
    };

    xhttp.open("POST", "./loggame", true);
    xhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    xhttp.send("score=" + totalScore + "&" +
                "name=" + username);
}

document.getElementsByClassName("confirm-button")[0].addEventListener('click', function() {
    if (!finished && scored) {
        // NEXT ROUND
        animateClass("left-panel", "stats-panel-expand", "stats-panel-shrink");
        animateClass("round-stats", "stats-details-show", "stats-details-hide");
        for (var i = 0; i < 4; i++) {
            animateClass("card-" + (i + 1), "card-shuffle", "card-retreat");
        }
        animateClass("card-5", "card-shuffle", "card-deal");
        animateClass("location-image", "image-card-exit", "image-card-enter");

        guessed = false;
        scored = false;

        if (round < maxRounds) {
            round++;
            document.getElementById("round-text").textContent = "ROUND " + round + "/" + maxRounds;
            locationID = reset();
            unpin();
            clock.start();
        }
    }
    else if (!guessed && pinLocked) {
        // GUESS
        scoreGuess(guess.x, guess.y);
        totalTime += Math.round(clock.getElapsedTime() * 10) / 10;
        clock.stop();
        animateClass("mid-panel", "mid-panel-show", "mid-panel-hide");

        let confirm = document.getElementsByClassName("confirm-button")[0];
        confirm.textContent = "LOADING...";
        confirm.classList.remove("confirm-button-allow");

        guessed = true;

        if (round < maxRounds) {

        }
        else {
            finished = true;
        }
    }
    else if (finished && submitted) {
        let form = document.getElementById("continue-form");
        form.score.value = totalScore;
        form.name.value = username;
        form.submit()
    }
});

document.getElementById("undo-button").addEventListener('click', function() {
    unpin();
});

function reset() {
    if (correctPin != null) {
        correctPin.position.set(0, -0.2, 0);
    }
    const id = Math.floor(Math.random() * locationCount) + 1;
    const path = 'url(./static/locations/loc' + id + '.jpeg';
    document.getElementsByClassName("location-image")[0].style.backgroundImage = path;
    return id;
}

function lockPin() {
    if (!pinLocked && !mouseDrag) {
        pinLocked = true;
        let confirm = document.getElementsByClassName("confirm-button")[0];
        confirm.textContent = "GUESS";
        confirm.classList.add("confirm-button-allow");

        animateClass("mid-panel", "mid-panel-hide", "mid-panel-show");
    }
}

function unpin() {
    pinLocked = false;
    controls.autoRotate = false;
    let confirm = document.getElementsByClassName("confirm-button")[0];
    confirm.textContent = "PIN A LOCATION";
    confirm.classList.remove("confirm-button-allow");
    confirm.classList.remove("confirm-button-next");
    animateClass("mid-panel", "mid-panel-show", "mid-panel-hide");
}

function animateClass(baseClass, oldAnimation, newAnimation) {
    // remove animation class and replace it with a new one
    let element = document.getElementsByClassName(baseClass)[0];
    element.classList.remove(oldAnimation);
    element.classList.add(newAnimation);
}

function cardShuffle() {
    for (var i = 0; i < 4; i++) {
        animateClass("card-" + (i + 1), "card-retreat", "card-shuffle");
        let card = document.getElementsByClassName("card")[i];
        card.classList.add("card-shuffle" + "-" + (i + 1));

        card.style.backgroundImage = getRandomImage();
    }
    animateClass("card-5", "card-deal", "card-shuffle");
    document.getElementsByClassName("card-5")[0].classList.add("card-shuffle-5");
}

function animationSetup() {
    for (var i = 0; i < 4; i++) {
        document.getElementsByClassName("card")[i].style.backgroundImage = getRandomImage();
        document.getElementsByClassName("card")[i].classList.add("card-retreat");
    }
    document.getElementsByClassName("card-5")[0].classList.add("card-deal");
    document.getElementsByClassName("location-image")[0].classList.add("image-card-enter");
}

animationSetup();

function getRandomImage() {
    let id = Math.floor(Math.random() * locationCount) + 1;
    return 'url(./static/locations/loc' + id + '.jpeg';
}