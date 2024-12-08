import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r122/build/three.module.js';



let xRes = 12000;
let yRes = 9600;


async function main() {
    const canvas = document.querySelector('#c');
    canvas.width=xRes;
    canvas.height=yRes;

    const renderer = new THREE.WebGLRenderer({
        canvas
    });
    renderer.autoClearColor = false;

    const camera = new THREE.OrthographicCamera(
        -1, // left
        1, // right
        1, // top
        -1, // bottom
        -1, // near,
        1, // far
    );
    const scene = new THREE.Scene();
    const plane = new THREE.PlaneBufferGeometry(2, 2);




    //load the fragment shader file
    const response = await fetch('./fragmentShader.glsl');
    const shaderToy = await response.text();

    //call the fixed starting and ending code that goes around the shadertoy
    const shaderStart = `
  uniform vec3 iResolution;
  uniform float iTime;
uniform vec4 iMouse;
  `;

    const shaderEnd = `
  void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
  }
  `;

    const fShader = shaderStart.concat(shaderToy.concat(shaderEnd));

    const uniforms = {
        iTime: {
            value: 0
        },
        iResolution: {
            value: new THREE.Vector3(xRes,yRes,1)
        },
        iMouse: {
            value: new THREE.Vector4(0,0,0,0)
        },
    };
    const material = new THREE.ShaderMaterial({
        fragmentShader: fShader,
        uniforms,
    });
    scene.add(new THREE.Mesh(plane, material));



    function render(time) {

        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}


main();
