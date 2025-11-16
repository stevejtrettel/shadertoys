/**
 * Layout Types
 *
 * Type definitions for layout system.
 */

/**
 * Layout template names.
 */
export type LayoutTemplate = 'fullscreen' | 'sidebar' | 'split' | 'teaching'

/**
 * Layout configuration object.
 */
export interface LayoutConfig {
  /** Layout template to use */
  template: LayoutTemplate

  /** Optional panel visibility configuration */
  panels?: {
    preview?: boolean
    params?: boolean
    controls?: boolean
    code?: boolean
    errors?: boolean
  }
}
