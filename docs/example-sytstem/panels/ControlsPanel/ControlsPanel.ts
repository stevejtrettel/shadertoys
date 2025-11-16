/**
 * ControlsPanel - Playback Controls
 *
 * Provides play/pause/reset/step controls and time mode selection.
 */

import type { App } from '@/app/App'
import type { Panel } from '../Panel'
import type { UnsubscribeFn } from '@/app/types'
import './ControlsPanel.css'

/**
 * ControlsPanel provides playback controls.
 */
export class ControlsPanel implements Panel {
  element: HTMLElement
  private app: App | null = null
  private unsubscribes: UnsubscribeFn[] = []

  // UI elements
  private playPauseBtn!: HTMLButtonElement
  private resetBtn!: HTMLButtonElement
  private stepBtn!: HTMLButtonElement
  private timeModeSelect!: HTMLSelectElement
  private fixedDtInput!: HTMLInputElement
  private frameDisplay!: HTMLSpanElement
  private timeDisplay!: HTMLSpanElement

  private isRunning: boolean = true // App starts automatically

  constructor() {
    this.element = document.createElement('div')
    this.element.className = 'controls-panel'
    this.buildUI()
  }

  attach(app: App): void {
    this.app = app

    // Subscribe to frame events for display updates
    const unsubFrame = app.on('frame', (event) => {
      this.frameDisplay.textContent = event.frame.toString()
      this.timeDisplay.textContent = event.time.toFixed(2) + 's'
    })
    this.unsubscribes.push(unsubFrame)

    // Set up button handlers
    this.playPauseBtn.addEventListener('click', this.handlePlayPause)
    this.resetBtn.addEventListener('click', this.handleReset)
    this.stepBtn.addEventListener('click', this.handleStep)
    this.timeModeSelect.addEventListener('change', this.handleTimeModeChange)
    this.fixedDtInput.addEventListener('change', this.handleFixedDtChange)
  }

  detach(): void {
    // Unsubscribe from all events
    for (const unsub of this.unsubscribes) {
      unsub()
    }
    this.unsubscribes = []

    // Remove event listeners
    this.playPauseBtn.removeEventListener('click', this.handlePlayPause)
    this.resetBtn.removeEventListener('click', this.handleReset)
    this.stepBtn.removeEventListener('click', this.handleStep)
    this.timeModeSelect.removeEventListener('change', this.handleTimeModeChange)
    this.fixedDtInput.removeEventListener('change', this.handleFixedDtChange)

    this.app = null
  }

  private buildUI(): void {
    this.element.innerHTML = `
      <div class="controls-section">
        <h3 class="controls-title">Playback</h3>
        <div class="controls-buttons">
          <button class="control-btn play-pause-btn">⏸ Pause</button>
          <button class="control-btn reset-btn">↻ Reset</button>
          <button class="control-btn step-btn">⏭ Step</button>
        </div>
      </div>

      <div class="controls-section">
        <h3 class="controls-title">Time Mode</h3>
        <select class="time-mode-select">
          <option value="realtime" selected>Realtime</option>
          <option value="fixed">Fixed Step</option>
        </select>
        <div class="fixed-dt-container">
          <label class="fixed-dt-label">
            Fixed Δt:
            <input type="number" class="fixed-dt-input" value="0.0167" step="0.001" min="0.001" max="1.0" />
          </label>
        </div>
      </div>

      <div class="controls-section">
        <h3 class="controls-title">Stats</h3>
        <div class="stats-display">
          <div class="stat-row">
            <span class="stat-label">Frame:</span>
            <span class="stat-value frame-display">0</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Time:</span>
            <span class="stat-value time-display">0.00s</span>
          </div>
        </div>
      </div>
    `

    // Get references to elements
    this.playPauseBtn = this.element.querySelector('.play-pause-btn')!
    this.resetBtn = this.element.querySelector('.reset-btn')!
    this.stepBtn = this.element.querySelector('.step-btn')!
    this.timeModeSelect = this.element.querySelector('.time-mode-select')!
    this.fixedDtInput = this.element.querySelector('.fixed-dt-input')!
    this.frameDisplay = this.element.querySelector('.frame-display')!
    this.timeDisplay = this.element.querySelector('.time-display')!
  }

  private handlePlayPause = (): void => {
    if (!this.app) return

    if (this.isRunning) {
      this.app.pause()
      this.playPauseBtn.textContent = '▶ Play'
      this.isRunning = false
    } else {
      this.app.start()
      this.playPauseBtn.textContent = '⏸ Pause'
      this.isRunning = true
    }
  }

  private handleReset = (): void => {
    if (!this.app) return
    this.app.reset()
  }

  private handleStep = (): void => {
    if (!this.app) return
    this.app.stepOnce()
  }

  private handleTimeModeChange = (): void => {
    if (!this.app) return
    const mode = this.timeModeSelect.value as 'realtime' | 'fixed'
    this.app.setTimeMode(mode)
  }

  private handleFixedDtChange = (): void => {
    if (!this.app) return
    const dt = parseFloat(this.fixedDtInput.value)
    if (!isNaN(dt) && dt > 0) {
      this.app.setFixedDeltaTime(dt)
    }
  }
}
