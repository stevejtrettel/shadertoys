/**
 * Layouts - Modular layout system for Shadertoy viewer
 *
 * Provides four layout modes:
 * - Default: Canvas centered with styling
 * - Fullscreen: Canvas fills entire viewport
 * - Split: Canvas on left, code viewer on right
 * - Tabbed: Single window with tabs for shader and code
 */

export { FullscreenLayout } from './FullscreenLayout';
export { DefaultLayout } from './DefaultLayout';
export { SplitLayout } from './SplitLayout';
export { TabbedLayout } from './TabbedLayout';
export type { BaseLayout, LayoutOptions, LayoutMode } from './types';

import { FullscreenLayout } from './FullscreenLayout';
import { DefaultLayout } from './DefaultLayout';
import { SplitLayout } from './SplitLayout';
import { TabbedLayout } from './TabbedLayout';
import { BaseLayout, LayoutOptions, LayoutMode } from './types';
import { ThemeMode } from '../project/types';

/**
 * Apply theme to the document.
 * Sets the data-theme attribute on the html element.
 *
 * @param theme - Theme mode to apply ('light', 'dark', or 'system')
 */
export function applyTheme(theme: ThemeMode): void {
  document.documentElement.setAttribute('data-theme', theme);
}

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
  // Apply theme from project configuration
  applyTheme(options.project.theme);

  switch (mode) {
    case 'fullscreen':
      return new FullscreenLayout(options);
    case 'default':
      return new DefaultLayout(options);
    case 'split':
      return new SplitLayout(options);
    case 'tabbed':
      return new TabbedLayout(options);
  }
}
