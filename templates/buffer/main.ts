/**
 * Shader Playground Entry Point
 */

import { App, createLayout, loadDemo } from 'shadertoy-runner';
import type { ShadertoyConfig, PassName } from 'shadertoy-runner';
import type { RecompileResult } from 'shadertoy-runner';

async function main() {
  try {
    // Load shaders using Vite's import.meta.glob
    const glslFiles = import.meta.glob<string>('./shaders/**/*.glsl', {
      query: '?raw',
      import: 'default',
    });

    const jsonFiles = import.meta.glob<ShadertoyConfig>('./shaders/**/*.json', {
      import: 'default',
    });

    const imageFiles = import.meta.glob<string>('./shaders/**/*.{jpg,jpeg,png,gif,webp,bmp}', {
      query: '?url',
      import: 'default',
    });

    // Load the demo project
    const project = await loadDemo('shaders', glslFiles, jsonFiles, imageFiles);

    console.log(`Loaded project: ${project.meta.title}`);

    // Get root container
    const rootContainer = document.getElementById('app');
    if (!rootContainer) {
      throw new Error('Container element #app not found');
    }

    // Create layout
    const layout = createLayout(project.layout, {
      container: rootContainer,
      project,
    });

    // Get canvas container from layout
    const canvasContainer = layout.getCanvasContainer();

    // Create app
    const app = new App({
      container: canvasContainer,
      project,
      pixelRatio: window.devicePixelRatio,
    });

    // Wire up recompile handler for live editing
    if (layout.setRecompileHandler) {
      layout.setRecompileHandler((passName: 'common' | PassName, newSource: string): RecompileResult => {
        const engine = app.getEngine();
        if (!engine) {
          return { success: false, error: 'Engine not initialized' };
        }

        if (passName === 'common') {
          const result = engine.recompileCommon(newSource);
          if (result.success) {
            return { success: true };
          } else {
            const firstError = result.errors[0];
            return {
              success: false,
              error: firstError ? `${firstError.passName}: ${firstError.error}` : 'Unknown error',
            };
          }
        } else {
          return engine.recompilePass(passName, newSource);
        }
      });
    }

    // Start if no errors
    if (!app.hasErrors()) {
      app.start();
      console.log('Shader playground started!');
    } else {
      console.warn('Not started due to shader compilation errors');
    }

    // Expose for debugging
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
