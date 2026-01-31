/**
 * Embeddable Entry Point
 */

import './styles/embed.css';  // <-- changed from base.css

import { App } from './app/App';
import { createLayout } from './layouts';
import { loadDemoProject, DEMO_NAME } from './project/generatedLoader';

export interface EmbedOptions {
  container: HTMLElement | string;
  pixelRatio?: number;
}

export interface EmbedResult {
  app: App;
  destroy: () => void;
}

export async function embed(options: EmbedOptions): Promise<EmbedResult> {
  const container = typeof options.container === 'string'
    ? document.querySelector(options.container)
    : options.container;

  if (!container || !(container instanceof HTMLElement)) {
    throw new Error(`Container not found: ${options.container}`);
  }

  const project = await loadDemoProject();

  const layout = createLayout(project.layout, {
    container,
    project,
  });

  const app = new App({
    container: layout.getCanvasContainer(),
    project,
    pixelRatio: options.pixelRatio ?? window.devicePixelRatio,
  });

  if (!app.hasErrors()) {
    app.start();
  }

  return {
    app,
    destroy: () => {
      app.dispose();
    },
  };
}

export { DEMO_NAME };