import ShaderDisplay from '../../src/ShaderDisplay.js';
import shadertoy from './shadertoy.glsl?raw';

const display = new ShaderDisplay(shadertoy, {
    viewportScale: 0.5,           // Render at 50% size (4x fewer pixels!)
    showFullscreenButton: true,   // Show fullscreen button
    createUI: true,
});

// Optionally add a GUI control for viewport scale
const qualityProxy = { scale: 0.5 };
display.gui.add(qualityProxy, 'scale', 0.25, 1.0, 0.25)
    .name('Viewport Size')
    .onChange(v => display.setViewportScale(v));

display.start();
