/**
 * BufferViewerPanel - Render Target Visualization
 *
 * Displays any render target (intermediate buffers or screen output)
 * for debugging and visualization purposes.
 */

import type { App } from '@/app/App'
import type { Panel } from '../Panel'
import type { UnsubscribeFn } from '@/app/types'
import './BufferViewerPanel.css'

/**
 * BufferViewerPanel visualizes render targets.
 */
export class BufferViewerPanel implements Panel {
  element: HTMLElement
  private app: App | null = null
  private unsubscribes: UnsubscribeFn[] = []

  // UI elements
  private bufferSelect!: HTMLSelectElement
  private displayCanvas!: HTMLCanvasElement
  private displayCtx!: CanvasRenderingContext2D
  private resolutionDisplay!: HTMLElement
  private updateToggle!: HTMLInputElement
  private refreshBtn!: HTMLButtonElement

  // State
  private selectedBuffer: string = ''
  private autoUpdate: boolean = true

  constructor() {
    this.element = document.createElement('div')
    this.element.className = 'buffer-viewer-panel'
    this.buildUI()
  }

  attach(app: App): void {
    this.app = app
    const project = app.getProject()

    // Populate buffer selector
    this.bufferSelect.innerHTML = ''

    // Add all buffers (skip 'screen' - use PreviewPanel for final output)
    const bufferNames = Object.keys(project.buffers)
    for (const bufferName of bufferNames) {
      const option = document.createElement('option')
      option.value = bufferName
      option.textContent = bufferName
      this.bufferSelect.appendChild(option)
    }

    // Set default selection to first buffer
    if (bufferNames.length > 0) {
      this.selectedBuffer = bufferNames[0]
    }

    // Set up event listeners
    this.bufferSelect.addEventListener('change', () => {
      this.selectedBuffer = this.bufferSelect.value
      this.updateDisplay()
    })

    this.updateToggle.addEventListener('change', () => {
      this.autoUpdate = this.updateToggle.checked
    })

    this.refreshBtn.addEventListener('click', () => {
      this.updateDisplay()
    })

    // Subscribe to frame events for auto-update
    const unsubFrame = app.on('frame', () => {
      if (this.autoUpdate) {
        this.updateDisplay()
      }
    })
    this.unsubscribes.push(unsubFrame)

    // No initial display - wait for first frame event to avoid reading black screen
  }

  detach(): void {
    // Unsubscribe from all events
    for (const unsub of this.unsubscribes) {
      unsub()
    }
    this.unsubscribes = []
    this.app = null
  }

  private buildUI(): void {
    this.element.innerHTML = `
      <div class="buffer-viewer-header">
        <h3 class="buffer-viewer-title">Buffer Viewer</h3>
      </div>

      <div class="buffer-viewer-controls">
        <div class="control-row">
          <label class="control-label">Buffer:</label>
          <select class="buffer-select"></select>
        </div>
        <div class="control-row">
          <label class="control-label">
            <input type="checkbox" class="update-toggle" checked />
            Auto-update
          </label>
          <button class="refresh-btn">↻ Refresh</button>
        </div>
        <div class="control-row">
          <span class="resolution-display">--</span>
        </div>
      </div>

      <div class="buffer-display-container">
        <canvas class="display-canvas"></canvas>
      </div>
    `

    // Get references
    this.bufferSelect = this.element.querySelector('.buffer-select')!
    this.displayCanvas = this.element.querySelector('.display-canvas')!
    this.displayCtx = this.displayCanvas.getContext('2d', { willReadFrequently: true })!
    this.resolutionDisplay = this.element.querySelector('.resolution-display')!
    this.updateToggle = this.element.querySelector('.update-toggle')!
    this.refreshBtn = this.element.querySelector('.refresh-btn')!
  }

  private updateDisplay(): void {
    if (!this.app) return

    const engine = this.app.getEngine()
    if (!engine) return

    try {
      // Read buffer data
      const imageData = engine.readBuffer(this.selectedBuffer)

      // Update canvas size if needed
      if (
        this.displayCanvas.width !== imageData.width ||
        this.displayCanvas.height !== imageData.height
      ) {
        this.displayCanvas.width = imageData.width
        this.displayCanvas.height = imageData.height
      }

      // Draw to canvas (flip vertically since WebGL uses bottom-left origin)
      this.displayCtx.save()
      this.displayCtx.translate(0, imageData.height)
      this.displayCtx.scale(1, -1)
      this.displayCtx.putImageData(imageData, 0, 0)
      this.displayCtx.restore()

      // Update resolution display
      this.resolutionDisplay.textContent = `${imageData.width} × ${imageData.height}`
    } catch (error) {
      console.error(`Failed to read buffer '${this.selectedBuffer}':`, error)
      this.resolutionDisplay.textContent = 'Error reading buffer'
    }
  }
}
