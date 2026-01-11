/**
 * App Layer - Type Definitions
 *
 * Types for the browser runtime coordinator.
 */

import type { ShadertoyProject } from '../project/types';

/**
 * Options for creating the App.
 */
export interface AppOptions {
  /**
   * HTML container element (App will create canvas inside).
   */
  container: HTMLElement;

  /**
   * Loaded Shadertoy project.
   */
  project: ShadertoyProject;

  /**
   * Canvas pixel ratio (default: window.devicePixelRatio).
   * Set to 1 for performance, or higher for retina displays.
   */
  pixelRatio?: number;

  /**
   * Skip creating the floating uniforms panel.
   * Used by 'ui' layout which has its own uniforms panel.
   */
  skipUniformsPanel?: boolean;

  /**
   * Skip creating the playback controls overlay.
   * Used by 'ui' layout which has its own playback controls.
   */
  skipPlaybackControls?: boolean;
}

/**
 * Mouse state for iMouse uniform.
 * Format: [x, y, clickX, clickY]
 * - x, y: current mouse position in pixels
 * - clickX, clickY: position of last click (or -1, -1 if no click)
 */
export type MouseState = [number, number, number, number];
