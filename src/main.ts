/**
 * Main Entry Point
 *
 * Loads a demo project from the demos/ folder and starts the App.
 *
 * To run a specific demo:
 *   npm run dev:demo <demo-name>
 *   npm run build:demo <demo-name>
 *
 * Examples:
 *   npm run dev:demo keyboard-test
 *   npm run build:demo simple-gradient
 */

import './styles/base.css';

import { App } from './app/App';
import { createLayout } from './layouts';
import { UILayout } from './layouts/UILayout';
import { loadDemoProject, DEMO_NAME } from './project/generatedLoader';
import { PassName, UniformValue } from './project/types';
import { RecompileResult } from './layouts/types';

async function main() {
  try {
    console.log(`Loading demo: ${DEMO_NAME}`);

    // Load the demo project from demos/ folder
    // The demo is determined by the generated loader (created by dev-demo.cjs or build-demo.cjs)
    const project = await loadDemoProject();

    console.log(`Loaded project: ${project.meta.title}`);
    console.log(`Passes:`, Object.keys(project.passes).filter(k => project.passes[k as keyof typeof project.passes]));

    // Get root container element
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

    // Check if this is a UILayout (which has its own uniforms panel and playback controls)
    const isUILayout = layout instanceof UILayout;

    // Create app
    const app = new App({
      container: canvasContainer,
      project,
      pixelRatio: window.devicePixelRatio,
      skipUniformsPanel: isUILayout,
      skipPlaybackControls: isUILayout,
    });

    // Wire up recompile handler for layouts that support it (split, tabbed)
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
            // Return first error
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

    // Wire up uniform change handler for layouts that support it (split, tabbed)
    if (layout.setUniformHandler) {
      layout.setUniformHandler((name: string, value: UniformValue) => {
        const engine = app.getEngine();
        if (engine) {
          engine.setUniformValue(name, value);
        }
      });
    }

    // Wire up UILayout callbacks (playback controls and uniforms)
    if (layout instanceof UILayout) {
      layout.setPlaybackCallbacks({
        onPlayPause: () => {
          app.togglePlayPause();
          layout.setPaused(app.getPaused());
        },
        onReset: () => app.reset(),
        onScreenshot: () => app.screenshot(),
      });

      layout.setUniformCallback((name: string, value: UniformValue) => {
        const engine = app.getEngine();
        if (engine) {
          engine.setUniformValue(name, value);
        }
      });
    }

    // Only start animation loop if there are no compilation errors
    // If there are errors, the error overlay is already shown by App constructor
    if (!app.hasErrors()) {
      app.start();
      console.log('App started!');
    } else {
      console.warn('App not started due to shader compilation errors');
    }

    // Expose for debugging
    (window as any).app = app;
    (window as any).layout = layout;

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
