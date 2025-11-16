/**
 * Panel Interface
 *
 * Base interface for all UI panels that interact with App.
 */

import type { App } from '@/app/App'

/**
 * Panel interface - all panels must implement this.
 *
 * Panels are UI components that:
 * - Own their DOM structure (element)
 * - Talk to App (never to Engine directly)
 * - Subscribe to App events
 * - Clean up on detach
 */
export interface Panel {
  /**
   * Root DOM element for this panel.
   */
  element: HTMLElement

  /**
   * Attach panel to an App instance.
   * Called once when the panel is created.
   *
   * Panel should:
   * - Subscribe to App events as needed
   * - Call App methods to read/update state
   * - Populate element with UI
   *
   * @param app - App instance to attach to
   */
  attach(app: App): void

  /**
   * Detach panel and clean up.
   * Called when panel is being destroyed.
   *
   * Panel should:
   * - Unsubscribe from all App events
   * - Clean up DOM as needed
   */
  detach(): void
}
