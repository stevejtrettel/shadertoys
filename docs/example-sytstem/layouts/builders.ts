/**
 * Layout Builders
 *
 * Pre-built layout functions for common UI configurations.
 */

import type { App } from '@/app/App'
import type { LayoutBuilder } from '@/app/types'
import { PreviewPanel } from '@/panels/PreviewPanel/PreviewPanel'
import { ControlsPanel } from '@/panels/ControlsPanel/ControlsPanel'
import { ParamsPanel } from '@/panels/ParamsPanel/ParamsPanel'
import { ErrorPanel } from '@/panels/ErrorPanel/ErrorPanel'
import { CodePanel } from '@/panels/CodePanel/CodePanel'

/**
 * Fullscreen Layout
 *
 * Just the preview panel filling the entire container.
 * Use for: Presentation mode, screensavers, simple demos.
 *
 * Layout:
 * ┌─────────────────────┐
 * │                     │
 * │      Preview        │
 * │                     │
 * └─────────────────────┘
 */
export const fullscreenLayout: LayoutBuilder = (app, container) => {
  container.style.cssText = `
    width: 100%;
    height: 100%;
    overflow: hidden;
  `

  // Create and attach preview panel
  const preview = new PreviewPanel()
  preview.attach(app)

  container.appendChild(preview.element)
}

/**
 * Sidebar Layout
 *
 * Preview on the left, controls/params/errors on the right sidebar.
 * Use for: Interactive demos, parameter exploration.
 *
 * Layout:
 * ┌──────────────┬───────┐
 * │              │Control│
 * │   Preview    ├───────┤
 * │              │Params │
 * │              ├───────┤
 * │              │Errors │
 * └──────────────┴───────┘
 */
export const sidebarLayout: LayoutBuilder = (app, container) => {
  container.style.cssText = `
    display: grid;
    grid-template-columns: 1fr 320px;
    width: 100%;
    height: 100%;
    overflow: hidden;
  `

  // Left: Preview
  const previewContainer = document.createElement('div')
  previewContainer.style.cssText = `
    position: relative;
    overflow: hidden;
  `

  // Right: Sidebar with controls, params, and errors
  const sidebar = document.createElement('div')
  sidebar.style.cssText = `
    display: flex;
    flex-direction: column;
    background: #f5f5f5;
    border-left: 1px solid #ddd;
    overflow: hidden;
  `

  const controlsContainer = document.createElement('div')
  controlsContainer.style.cssText = `
    flex: 0 0 auto;
    border-bottom: 1px solid #ddd;
  `

  const paramsContainer = document.createElement('div')
  paramsContainer.style.cssText = `
    flex: 1 1 auto;
    overflow-y: auto;
    border-bottom: 1px solid #ddd;
  `

  const errorsContainer = document.createElement('div')
  errorsContainer.style.cssText = `
    flex: 0 0 250px;
    overflow: hidden;
  `

  // Create panels
  const preview = new PreviewPanel()
  const controls = new ControlsPanel()
  const params = new ParamsPanel()
  const errors = new ErrorPanel()

  // Attach panels
  preview.attach(app)
  controls.attach(app)
  params.attach(app)
  errors.attach(app)

  // Assemble
  previewContainer.appendChild(preview.element)
  controlsContainer.appendChild(controls.element)
  paramsContainer.appendChild(params.element)
  errorsContainer.appendChild(errors.element)

  sidebar.appendChild(controlsContainer)
  sidebar.appendChild(paramsContainer)
  sidebar.appendChild(errorsContainer)

  container.appendChild(previewContainer)
  container.appendChild(sidebar)
}

/**
 * Split Layout
 *
 * Preview on the left, code editor on the right.
 * Use for: Live coding, shader development.
 *
 * Layout:
 * ┌────────────┬────────────┐
 * │            │            │
 * │  Preview   │    Code    │
 * │            │            │
 * └────────────┴────────────┘
 */
export const splitLayout: LayoutBuilder = (app, container) => {
  container.style.cssText = `
    display: grid;
    grid-template-columns: 1fr 1fr;
    width: 100%;
    height: 100%;
    overflow: hidden;
  `

  // Left: Preview
  const previewContainer = document.createElement('div')
  previewContainer.style.cssText = `
    position: relative;
    overflow: hidden;
  `

  // Right: Code editor
  const codeContainer = document.createElement('div')
  codeContainer.style.cssText = `
    position: relative;
    overflow: hidden;
    border-left: 1px solid #3e3e3e;
  `

  // Create panels
  const preview = new PreviewPanel()
  const code = new CodePanel()

  // Attach panels
  preview.attach(app)
  code.attach(app)

  // Assemble
  previewContainer.appendChild(preview.element)
  codeContainer.appendChild(code.element)

  container.appendChild(previewContainer)
  container.appendChild(codeContainer)
}

/**
 * Teaching Layout
 *
 * All panels visible in a quad layout.
 * Use for: Tutorials, learning environments, comprehensive debugging.
 *
 * Layout:
 * ┌──────────────┬──────────┐
 * │              │ Controls │
 * │   Preview    ├──────────┤
 * │              │  Params  │
 * ├──────────────┼──────────┤
 * │     Code     │  Errors  │
 * └──────────────┴──────────┘
 */
export const teachingLayout: LayoutBuilder = (app, container) => {
  container.style.cssText = `
    display: grid;
    grid-template-columns: 1fr 320px;
    grid-template-rows: 1fr 1fr;
    width: 100%;
    height: 100%;
    overflow: hidden;
    gap: 0;
  `

  // Top-left: Preview
  const previewContainer = document.createElement('div')
  previewContainer.style.cssText = `
    grid-column: 1;
    grid-row: 1;
    position: relative;
    overflow: hidden;
    border-right: 1px solid #ddd;
    border-bottom: 1px solid #ddd;
  `

  // Top-right: Controls + Params
  const rightTop = document.createElement('div')
  rightTop.style.cssText = `
    grid-column: 2;
    grid-row: 1;
    display: flex;
    flex-direction: column;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
    overflow: hidden;
  `

  const controlsContainer = document.createElement('div')
  controlsContainer.style.cssText = `
    flex: 0 0 auto;
    border-bottom: 1px solid #ddd;
  `

  const paramsContainer = document.createElement('div')
  paramsContainer.style.cssText = `
    flex: 1 1 auto;
    overflow-y: auto;
  `

  // Bottom-left: Code
  const codeContainer = document.createElement('div')
  codeContainer.style.cssText = `
    grid-column: 1;
    grid-row: 2;
    position: relative;
    overflow: hidden;
    border-right: 1px solid #3e3e3e;
  `

  // Bottom-right: Errors
  const errorsContainer = document.createElement('div')
  errorsContainer.style.cssText = `
    grid-column: 2;
    grid-row: 2;
    position: relative;
    overflow: hidden;
  `

  // Create panels
  const preview = new PreviewPanel()
  const controls = new ControlsPanel()
  const params = new ParamsPanel()
  const code = new CodePanel()
  const errors = new ErrorPanel()

  // Attach panels
  preview.attach(app)
  controls.attach(app)
  params.attach(app)
  code.attach(app)
  errors.attach(app)

  // Assemble right top
  controlsContainer.appendChild(controls.element)
  paramsContainer.appendChild(params.element)
  rightTop.appendChild(controlsContainer)
  rightTop.appendChild(paramsContainer)

  // Assemble layout
  previewContainer.appendChild(preview.element)
  codeContainer.appendChild(code.element)
  errorsContainer.appendChild(errors.element)

  container.appendChild(previewContainer)
  container.appendChild(rightTop)
  container.appendChild(codeContainer)
  container.appendChild(errorsContainer)
}

/**
 * Create a layout builder from a config object.
 * Convenience function for using pre-built layouts.
 *
 * @param config - Layout configuration
 * @returns LayoutBuilder function
 */
export function createLayout(config: { template: 'fullscreen' | 'sidebar' | 'split' | 'teaching' }): LayoutBuilder {
  switch (config.template) {
    case 'fullscreen':
      return fullscreenLayout
    case 'sidebar':
      return sidebarLayout
    case 'split':
      return splitLayout
    case 'teaching':
      return teachingLayout
    default:
      throw new Error(`Unknown layout template: ${config.template}`)
  }
}
