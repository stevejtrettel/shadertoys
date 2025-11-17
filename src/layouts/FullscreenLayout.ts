/**
 * Fullscreen Layout
 *
 * Canvas fills entire viewport, no padding or styling.
 * Used for immersive shader experiences.
 */

import './fullscreen.css';

import { BaseLayout, LayoutOptions } from './types';

export class FullscreenLayout implements BaseLayout {
  private container: HTMLElement;
  private root: HTMLElement;
  private canvasContainer: HTMLElement;

  constructor(opts: LayoutOptions) {
    this.container = opts.container;

    // Create root layout container
    this.root = document.createElement('div');
    this.root.className = 'layout-fullscreen';

    // Create canvas container
    this.canvasContainer = document.createElement('div');
    this.canvasContainer.className = 'canvas-container';

    // Assemble and append to DOM
    this.root.appendChild(this.canvasContainer);
    this.container.appendChild(this.root);
  }

  getCanvasContainer(): HTMLElement {
    return this.canvasContainer;
  }

  dispose(): void {
    this.container.innerHTML = '';
  }
}
