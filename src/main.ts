/**
 * Main Entry Point
 *
 * Loads a demo project from the demos/ folder and starts the App.
 *
 * Students can create their own demos by:
 * 1. Creating a new folder in demos/ (e.g., demos/my-shader/)
 * 2. Adding an image.glsl file with their shader code
 * 3. Changing DEMO_NAME below to load their shader
 */

import { App } from './app/App';
import { Layout, LayoutMode } from './app/Layout';
import { loadDemoProject } from './project/loadDemo';

// ===== Configuration =====

// Change this to load different demos!
// Try: 'simple-gradient', 'ping-pong-test', 'multi-buffer-test', 'demofox-pt2'
const DEMO_NAME = 'demofox-pt2';

// Choose layout mode
// 'shader-only': Centered canvas with styling (default)
// 'split-view': Code editor + shader side by side
const LAYOUT_MODE: LayoutMode = 'shader-only';

async function main() {
  try {
    console.log(`Loading demo: ${DEMO_NAME}`);

    // Load the demo project from demos/ folder
    const project = await loadDemoProject(DEMO_NAME);

    console.log(`Loaded project: ${project.meta.title}`);
    console.log(`Passes:`, Object.keys(project.passes).filter(k => project.passes[k as keyof typeof project.passes]));

    // Get root container element
    const rootContainer = document.getElementById('app');
    if (!rootContainer) {
      throw new Error('Container element #app not found');
    }

    // Create layout
    const layout = new Layout({
      mode: LAYOUT_MODE,
      container: rootContainer,
      project,
    });

    // Get canvas container from layout
    const canvasContainer = layout.getCanvasContainer();

    // Create and start app
    const app = new App({
      container: canvasContainer,
      project,
      pixelRatio: window.devicePixelRatio,
    });

    app.start();
    console.log('App started!');

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
