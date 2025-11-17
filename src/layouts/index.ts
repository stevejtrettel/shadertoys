/**
 * Layouts - Modular layout system for Shadertoy viewer
 *
 * Provides three layout modes:
 * - Fullscreen: Canvas fills entire viewport
 * - Centered: Canvas centered with styling (default)
 * - Split: Canvas on left, code viewer on right
 */

export { FullscreenLayout } from './FullscreenLayout';
export { CenteredLayout } from './CenteredLayout';
export { SplitLayout } from './SplitLayout';
export type { BaseLayout, LayoutOptions, LayoutMode } from './types';

import { FullscreenLayout } from './FullscreenLayout';
import { CenteredLayout } from './CenteredLayout';
import { SplitLayout } from './SplitLayout';
import { BaseLayout, LayoutOptions, LayoutMode } from './types';

/**
 * Factory function to create the appropriate layout based on mode.
 *
 * @param mode - Layout mode to create
 * @param options - Layout options
 * @returns Layout instance implementing BaseLayout interface
 */
export function createLayout(
  mode: LayoutMode,
  options: LayoutOptions
): BaseLayout {
  switch (mode) {
    case 'fullscreen':
      return new FullscreenLayout(options);
    case 'centered':
      return new CenteredLayout(options);
    case 'split':
      return new SplitLayout(options);
  }
}
