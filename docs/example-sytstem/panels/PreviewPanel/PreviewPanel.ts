/**
 * PreviewPanel - Canvas Display Panel
 *
 * Displays the shader canvas and manages its container.
 * Calls app.setCanvasContainer() to enable resize handling.
 */

import type { App } from '@/app/App'
import type { Panel } from '../Panel'
import './PreviewPanel.css'

/**
 * PreviewPanel displays the shader output canvas.
 */
export class PreviewPanel implements Panel {
  element: HTMLElement
  private app: App | null = null

  constructor() {
    this.element = document.createElement('div')
    this.element.className = 'preview-panel'
  }

  attach(app: App): void {
    this.app = app

    // Add canvas to panel
    const canvas = app.getCanvas()
    this.element.appendChild(canvas)

    // Style canvas to fill container
    canvas.style.cssText = `
      width: 100%;
      height: 100%;
      display: block;
    `

    // Tell app this is the canvas container (enables resize)
    app.setCanvasContainer(this.element)
  }

  detach(): void {
    // Remove canvas from panel
    if (this.app) {
      const canvas = this.app.getCanvas()
      if (canvas.parentElement === this.element) {
        this.element.removeChild(canvas)
      }
    }

    this.app = null
  }
}
