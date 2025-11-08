// main.js
import '../../src/style.css';
import ShaderDisplay from '../../src/ShaderDisplay.js';

// Import shader as raw text using Vite's ?raw suffix
import shader from './shadertoy.glsl?raw';

const display = new ShaderDisplay(shader, {
    containerId: 'World',
    createUI: false,  // Enable lil-gui
});

// Add custom uniforms
// display.addUniform('uScale', 'float', 1.0);
// display.addUniform('uColor', 'vec3', [1.0, 0.5, 0.2]);
// display.addUniform('uSpeed', 'float', 1.0);
//
// // Add GUI controls for your custom uniforms
// display.addControl('uScale', { min: 0.1, max: 5.0, step: 0.1, name: 'Scale' });
// display.addControl('uColor', { type: 'color', name: 'Base Color' });
// display.addControl('uSpeed', { min: 0.0, max: 3.0, step: 0.1, name: 'Speed' });

display.start();
