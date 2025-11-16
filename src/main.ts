/**
 * Main Entry Point
 *
 * Creates a Shadertoy project and starts the App.
 *
 * NOTE: For the browser version, we inline the project definition.
 * The loadProject function is for Node.js environments (testing, build tools, etc.)
 */

import { App } from './app/App';
import { ShadertoyProject } from './project/types';

// Simple gradient shader (can be copy/pasted from Shadertoy!)
const simpleGradientShader = `
// Simple gradient shader - single pass, no config needed
// This can be copy/pasted from Shadertoy

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord / iResolution.xy;

    // Animated color gradient
    vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0, 2, 4));

    // Output to screen
    fragColor = vec4(col, 1.0);
}
`;

// Create project definition directly
const project: ShadertoyProject = {
  root: '.',
  meta: {
    title: 'Simple Gradient',
    author: null,
    description: 'A simple animated gradient shader',
  },
  commonSource: null,
  passes: {
    Image: {
      name: 'Image',
      glslSource: simpleGradientShader,
      channels: [
        { kind: 'none' },
        { kind: 'none' },
        { kind: 'none' },
        { kind: 'none' },
      ],
    },
  },
  textures: [],
};

async function main() {
  try {
    console.log(`Loading project: ${project.meta.title}`);
    console.log(`Passes:`, Object.keys(project.passes).filter(k => project.passes[k as keyof typeof project.passes]));

    // Get container element
    const container = document.getElementById('app');
    if (!container) {
      throw new Error('Container element #app not found');
    }

    // Create and start app
    const app = new App({
      container,
      project,
      pixelRatio: window.devicePixelRatio,
    });

    app.start();
    console.log('App started!');

    // Expose app globally for debugging
    (window as any).app = app;

  } catch (error) {
    console.error('Failed to initialize:', error);
    const container = document.getElementById('app');
    if (container) {
      container.innerHTML = `
        <div style="color: red; padding: 20px; font-family: monospace;">
          <h2>Error</h2>
          <pre>${error instanceof Error ? error.message : String(error)}</pre>
        </div>
      `;
    }
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
