/**
 * Layout Types - Common interface for all layout modes
 */

import { ShadertoyProject } from '../project/types';

/**
 * Base interface that all layouts must implement.
 */
export interface BaseLayout {
  /**
   * Get the canvas container element where App should render.
   */
  getCanvasContainer(): HTMLElement;

  /**
   * Clean up all DOM elements and resources.
   */
  dispose(): void;
}

/**
 * Options for creating a layout.
 */
export interface LayoutOptions {
  container: HTMLElement;
  project: ShadertoyProject;
}

/**
 * Available layout modes.
 */
export type LayoutMode = 'fullscreen' | 'centered' | 'split' | 'tabbed';
