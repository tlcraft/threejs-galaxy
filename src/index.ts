import { 
    AdditiveBlending,
    AmbientLight,
    AxesHelper,
    BufferAttribute,
    BufferGeometry,
    Clock,
    Light,
    Material,
    Mesh,
    MeshBasicMaterial,
    MeshLambertMaterial,
    PCFSoftShadowMap,
    PerspectiveCamera,
    Points,
    PointsMaterial,
    RepeatWrapping,
    Scene,
    Texture,
    TextureLoader,
    WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui';
import { Cursor } from '~models/cursor';

const debugGui = generateDebugGui();

const clock = new Clock();
const cursor: Cursor = { x: 1, y: 1 };
const scene = generateScene();
const camera = generatePerspectivCamera();
const renderer = generateRenderer();
const textureLoader = new TextureLoader();

let galaxyGeometry: BufferGeometry = new BufferGeometry();
let galaxyMaterial: PointsMaterial = new PointsMaterial();
let galaxyPoints: Points = new Points();

function configureTexture(textureImage: string): Texture {
    const texture = textureLoader.load(textureImage);
    texture.repeat.set(8, 8);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    
    return texture;
}

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
        radius: 5,
        size: 0.02,
    }
    const galaxy = generateGalaxy(params);
    scene.add(galaxy);

    const animate = function () {
        requestAnimationFrame(animate);

        const elapsedTime = clock.getElapsedTime();

        controls.update();
        renderer.render(scene, camera);
    };

    debugGui.add(params, 'branches').min(2).max(8).step(1).onFinishChange(() => { const galaxy = generateGalaxy(params); scene.add(galaxy)});
    debugGui.add(params, 'count').min(100).max(100000).step(100).onFinishChange(() => { const galaxy = generateGalaxy(params); scene.add(galaxy)});
    debugGui.add(params, 'radius').min(0.01).max(20).step(0.01).onFinishChange(() => { const galaxy = generateGalaxy(params); scene.add(galaxy)});
    debugGui.add(params, 'size').min(0.01).max(0.8).step(0.01).onFinishChange(() => { const galaxy = generateGalaxy(params); scene.add(galaxy)});
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

function configureMeshDebug(mesh: Mesh<BufferGeometry, MeshLambertMaterial | MeshBasicMaterial | Material>, name: string): void {
    const folder = debugGui.addFolder(`${name} section`);
    folder.add(mesh.position, 'x').min(mesh.position.x-40).max(mesh.position.x+40).step(0.01).name('x-axis');
    folder.add(mesh.position, 'y').min(mesh.position.y-40).max(mesh.position.y+40).step(0.01).name('y-axis');
    folder.add(mesh.position, 'z').min(mesh.position.z-40).max(mesh.position.z+40).step(0.01).name('z-axis');

    folder.add(mesh.rotation, 'x').min(0).max(Math.PI * 2).step(0.01).name('x-axis rotation');
    folder.add(mesh.rotation, 'y').min(0).max(Math.PI * 2).step(0.01).name('y-axis rotation');
    folder.add(mesh.rotation, 'z').min(0).max(Math.PI * 2).step(0.01).name('z-axis rotation');

    folder.add(mesh, 'visible');
    folder.add(mesh.material, 'wireframe');

    if(mesh.material.hasOwnProperty('color')) {
        const parameters = {
            color: mesh.material.color.getHex()
        };
    
        folder.addColor(parameters, 'color').onChange(() => {
            mesh.material.color.set(parameters.color);
        });
    }

    if(mesh.material.hasOwnProperty('metalness')) {
        folder.add(mesh.material, 'metalness').min(0).max(1).step(0.001);
    }

    if(mesh.material.hasOwnProperty('roughness')) {
        folder.add(mesh.material, 'roughness').min(0).max(1).step(0.001);
    }

    if(mesh.material.hasOwnProperty('aoMapIntensity')) {
        folder.add(mesh.material, 'aoMapIntensity').min(0).max(10).step(0.001);
    }
        
    if(mesh.material.hasOwnProperty('displacementScale')) {
        folder.add(mesh.material, 'displacementScale').min(0).max(1).step(0.001);
    }
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

function generateGalaxy(parameters: { branches: number, count: number, radius: number, size: number }): Points {
    galaxyGeometry.dispose();
    galaxyMaterial.dispose();
    scene.remove(galaxyPoints);

    const { branches, count, size } = parameters;
    galaxyGeometry = new BufferGeometry();
    const positions = new Float32Array(count * 3);

    for(let i = 0; i < count; i++) {
        const pointIndex = i * 3;
        const radius = Math.random() * parameters.radius;
        const branchAngle = (i % branches) / branches * Math.PI * 2;

        positions[pointIndex] = Math.cos(branchAngle) * radius;
        positions[pointIndex+1] = Math.sin(i) * 0.5;
        positions[pointIndex+2] = Math.sin(branchAngle) * radius;
    }

    galaxyGeometry.addAttribute('position', new BufferAttribute(positions, 3));

    galaxyMaterial = new PointsMaterial({
       size: size,
       sizeAttenuation: true,
       depthWrite: false,
       blending: AdditiveBlending
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
