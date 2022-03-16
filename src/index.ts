import { 
    AdditiveBlending,
    AmbientLight,
    AxesHelper,
    BufferAttribute,
    BufferGeometry,
    Color,
    Light,
    PCFSoftShadowMap,
    PerspectiveCamera,
    Points,
    PointsMaterial,
    Scene,
    WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui';
import { Cursor } from '~models/cursor';
import { GalaxyParameters } from '~models/galaxyParameters';

const debugGui = generateDebugGui();

const cursor: Cursor = { x: 1, y: 1 };
const scene = generateScene();
const camera = generatePerspectivCamera();
const renderer = generateRenderer();

let galaxyGeometry: BufferGeometry = new BufferGeometry();
let galaxyMaterial: PointsMaterial = new PointsMaterial();
let galaxyPoints: Points = new Points();

function startup(): void {
    const controls = generateControls();
    const axesHelper = new AxesHelper();
    scene.add(axesHelper);

    const container: HTMLElement | any = document.getElementById("three");
    container.appendChild( renderer.domElement );

    const ambientLight = new AmbientLight( "#b9d5ff", 0.2 );
    scene.add(ambientLight);

    const params = {
        branches: 3,
        count: 1000,
        insideColor: '#ff6633',
        outsideColor: '#1b3984',
        radius: 5,
        randomness: 0.2,
        randomnessPower: 3,
        size: 0.02,
        spin: 1
    }
    const galaxy = generateGalaxy(params);
    scene.add(galaxy);

    const animate = function () {
        requestAnimationFrame(animate);

        controls.update();
        renderer.render(scene, camera);
    };

    debugGui.add(params, 'branches').min(2).max(8).step(1).onFinishChange(() => { const galaxy = generateGalaxy(params); scene.add(galaxy)});
    debugGui.add(params, 'count').min(100).max(100000).step(100).onFinishChange(() => { const galaxy = generateGalaxy(params); scene.add(galaxy)});
    debugGui.add(params, 'radius').min(0.01).max(20).step(0.01).onFinishChange(() => { const galaxy = generateGalaxy(params); scene.add(galaxy)});
    debugGui.add(params, 'randomness').min(0).max(2).step(0.001).onFinishChange(() => { const galaxy = generateGalaxy(params); scene.add(galaxy)});
    debugGui.add(params, 'randomnessPower').min(1).max(10).step(0.01).onFinishChange(() => { const galaxy = generateGalaxy(params); scene.add(galaxy)});
    debugGui.add(params, 'size').min(0.01).max(0.8).step(0.01).onFinishChange(() => { const galaxy = generateGalaxy(params); scene.add(galaxy)});
    debugGui.add(params, 'spin').min(-5).max(5).step(0.001).onFinishChange(() => { const galaxy = generateGalaxy(params); scene.add(galaxy)});
    
    debugGui.addColor(params, 'insideColor').onFinishChange(() => { const galaxy = generateGalaxy(params); scene.add(galaxy)});
    debugGui.addColor(params, 'outsideColor').onFinishChange(() => { const galaxy = generateGalaxy(params); scene.add(galaxy)});

    configureLightDebug(ambientLight, 'ambient light');
    animate();
}

function generateDebugGui(): dat.GUI {
    const debugGui = new dat.GUI({ 
        closed: true, 
        width: 350,
    });
    debugGui.hide();

    return debugGui;
}

function configureLightDebug(light: Light, name: string): void {
    const folder = debugGui.addFolder(`${name} section`);
    folder.add(light, 'intensity').min(0).max(10).step(0.05);
    
    folder.add(light.position, 'x').min(light.position.x-40).max(light.position.x+40).step(0.01).name('x-axis');
    folder.add(light.position, 'y').min(light.position.y-40).max(light.position.y+40).step(0.01).name('y-axis');
    folder.add(light.position, 'z').min(light.position.z-40).max(light.position.z+40).step(0.01).name('z-axis');

    folder.add(light.rotation, 'x').min(0).max(Math.PI * 2).step(0.01).name('x-axis rotation');
    folder.add(light.rotation, 'y').min(0).max(Math.PI * 2).step(0.01).name('y-axis rotation');
    folder.add(light.rotation, 'z').min(0).max(Math.PI * 2).step(0.01).name('z-axis rotation');
    
    folder.add(light, 'visible');

    const parameters = {
        color: light.color.getHex()
    };

    folder.addColor(parameters, 'color').onChange(() => {
        light.color.set(parameters.color);
    });

    if(light.hasOwnProperty('castShadow')) {
        folder.add(light, 'castShadow');
    }
}

function generateScene(): Scene {
    const scene = new Scene();
    return scene;
}

function generatePerspectivCamera(): PerspectiveCamera { // Vision like a cone
    // A field of view between 45 and 75 is generally sufficent depending on your needs
    const camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.setZ(10);

    return camera;
}

function generateRenderer(): WebGLRenderer {
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.setClearColor("#262837");

    return renderer;
}

function generateGalaxy(parameters: GalaxyParameters): Points {
    galaxyGeometry.dispose();
    galaxyMaterial.dispose();
    scene.remove(galaxyPoints);

    const { branches, count, size, spin, randomnessPower } = parameters;
    galaxyGeometry = new BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const colorInside = new Color(parameters.insideColor);
    const colorOutside = new Color(parameters.outsideColor);

    for(let i = 0; i < count; i++) {
        const pointIndex = i * 3;
        const radius = Math.random() * parameters.radius;
        const branchAngle = (i % branches) / branches * Math.PI * 2;
        const spinAngle = radius * spin;

        const randomX = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1);
        const randomY = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1);
        const randomZ = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1);
        
        positions[pointIndex] = Math.cos(branchAngle + spinAngle) * radius + randomX;
        positions[pointIndex + 1] = randomY;
        positions[pointIndex + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

        const mixedColor = colorInside.clone();
        mixedColor.lerp(colorOutside, Math.random());

        colors[pointIndex] = mixedColor.r;
        colors[pointIndex + 1] = mixedColor.g;
        colors[pointIndex + 2] = mixedColor.b;
    }

    galaxyGeometry.setAttribute('position', new BufferAttribute(positions, 3));
    galaxyGeometry.setAttribute('color', new BufferAttribute(colors, 3));

    galaxyMaterial = new PointsMaterial({
        blending: AdditiveBlending,
        depthWrite: false,
        size: size,
        sizeAttenuation: true,
        vertexColors: true,
   });

   galaxyPoints = new Points(galaxyGeometry, galaxyMaterial);
   return galaxyPoints;

}

function generateControls(): OrbitControls {
    const controls = new OrbitControls( camera, renderer.domElement );
    controls.enableDamping = true;
    return controls;
}

function onKeyDown(event: any): void{
    switch(event.keyCode) {
        case 83: // forward W
            camera.position.z += 0.25;
            break;
        case 87: // backward S
            camera.position.z -= 0.25;
            break;
        case 65: // left A
            camera.position.x -= 0.25;
            break;
        case 68: // right D
            camera.position.x += 0.25;
            break;
        case 38: // up arrow
            camera.position.y += 0.25;
            break;
        case 40: // down arrow
            camera.position.y -= 0.25;
            break;
        default:
            break;
    }
}

document.body.addEventListener( 'keydown', onKeyDown, false );

window.addEventListener('mousemove', (event: any) => {
    cursor.x = event.clientX / window.innerWidth - 0.5;
    cursor.y = (event.clientY / window.innerHeight - 0.5);
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

window.addEventListener('dblclick', () => {
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
    if(!fullscreenElement) {
        if(container.requestFullscreen){
            container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
        }
    } else {
        if(document.exitFullscreen){
            document.exitFullscreen();
        } else if(document.webkitExitFullscreen){
            document.webkitExitFullscreen();
        }
    }
});

startup();
