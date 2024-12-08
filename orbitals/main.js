import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r122/build/three.module.js';

async function main() {
    const canvas = document.querySelector('#c');
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



//get the mouse
    let mouseX = 0;
    let mouseY = 0;
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = rect.height - (e.clientY - rect.top) - 1;  // bottom is 0 in WebGL
    });
    var mouseDown = 0;
    document.body.onmousedown = function() {
        ++mouseDown;
    }
    document.body.onmouseup = function() {
        --mouseDown;
    }



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
            value: new THREE.Vector3()
        },
        iMouse: {
            value: new THREE.Vector4()
        },
    };
    const material = new THREE.ShaderMaterial({
        fragmentShader: fShader,
        uniforms,
    });
    scene.add(new THREE.Mesh(plane, material));

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    function render(time) {
        time *= 0.001; // convert to seconds

        resizeRendererToDisplaySize(renderer);

        const canvas = renderer.domElement;
        material.uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
        material.uniforms.iTime.value = time;
        material.uniforms.iMouse.value=new THREE.Vector4(mouseX,mouseY,mouseDown,0);

        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}


main();
