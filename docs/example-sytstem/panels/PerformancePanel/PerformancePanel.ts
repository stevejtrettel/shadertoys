/**
 * PerformancePanel - FPS and Frame Time Monitor
 *
 * Displays real-time FPS, frame time statistics, and a visual graph
 * showing frame time history.
 */

import type { App } from '@/app/App'
import type { Panel } from '../Panel'
import type { UnsubscribeFn } from '@/app/types'
import './PerformancePanel.css'

interface FrameStats {
  fps: number
  frameTime: number
  minFps: number
  maxFps: number
  avgFps: number
}

/**
 * PerformancePanel provides real-time performance monitoring.
 */
export class PerformancePanel implements Panel {
  element: HTMLElement
  private app: App | null = null
  private unsubscribes: UnsubscribeFn[] = []

  // UI elements
  private fpsDisplay!: HTMLElement
  private frameTimeDisplay!: HTMLElement
  private minFpsDisplay!: HTMLElement
  private maxFpsDisplay!: HTMLElement
  private avgFpsDisplay!: HTMLElement
  private graphCanvas!: HTMLCanvasElement
  private graphCtx!: CanvasRenderingContext2D

  // Performance tracking
  private frameTimes: number[] = []
  private maxFrameHistory = 120 // 2 seconds at 60fps
  private lastFrameTime = 0
  private fpsValues: number[] = []
  private statsUpdateInterval = 500 // Update stats every 500ms
  private lastStatsUpdate = 0

  constructor() {
    this.element = document.createElement('div')
    this.element.className = 'performance-panel'
    this.buildUI()
  }

  attach(app: App): void {
    this.app = app

    // Subscribe to frame events
    const unsubFrame = app.on('frame', (event) => {
      this.updatePerformance(event.time)
    })
    this.unsubscribes.push(unsubFrame)

    // Initialize last frame time
    this.lastFrameTime = performance.now() / 1000
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
      <div class="performance-header">
        <h3 class="performance-title">Performance</h3>
      </div>

      <div class="performance-stats">
        <div class="stat-row">
          <span class="stat-label">FPS:</span>
          <span class="stat-value fps-display">--</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Frame Time:</span>
          <span class="stat-value frame-time-display">-- ms</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Min FPS:</span>
          <span class="stat-value min-fps-display">--</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Max FPS:</span>
          <span class="stat-value max-fps-display">--</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Avg FPS:</span>
          <span class="stat-value avg-fps-display">--</span>
        </div>
      </div>

      <div class="graph-container">
        <canvas class="graph-canvas" width="300" height="100"></canvas>
      </div>
    `

    // Get references
    this.fpsDisplay = this.element.querySelector('.fps-display')!
    this.frameTimeDisplay = this.element.querySelector('.frame-time-display')!
    this.minFpsDisplay = this.element.querySelector('.min-fps-display')!
    this.maxFpsDisplay = this.element.querySelector('.max-fps-display')!
    this.avgFpsDisplay = this.element.querySelector('.avg-fps-display')!
    this.graphCanvas = this.element.querySelector('.graph-canvas')!
    this.graphCtx = this.graphCanvas.getContext('2d')!

    // Set canvas resolution based on device pixel ratio
    const dpr = window.devicePixelRatio || 1
    const rect = this.graphCanvas.getBoundingClientRect()
    this.graphCanvas.width = rect.width * dpr
    this.graphCanvas.height = rect.height * dpr
    this.graphCtx.scale(dpr, dpr)
  }

  private updatePerformance(currentTime: number): void {
    const now = performance.now() / 1000
    const deltaTime = now - this.lastFrameTime
    this.lastFrameTime = now

    // Calculate FPS and frame time
    const fps = deltaTime > 0 ? 1 / deltaTime : 60
    const frameTimeMs = deltaTime * 1000

    // Store frame time history
    this.frameTimes.push(frameTimeMs)
    if (this.frameTimes.length > this.maxFrameHistory) {
      this.frameTimes.shift()
    }

    // Store FPS for statistics
    this.fpsValues.push(fps)
    if (this.fpsValues.length > this.maxFrameHistory) {
      this.fpsValues.shift()
    }

    // Update displays
    this.fpsDisplay.textContent = fps.toFixed(1)
    this.frameTimeDisplay.textContent = frameTimeMs.toFixed(2) + ' ms'

    // Update statistics periodically (not every frame for performance)
    if (now - this.lastStatsUpdate > this.statsUpdateInterval / 1000) {
      this.updateStats()
      this.lastStatsUpdate = now
    }

    // Draw graph
    this.drawGraph()
  }

  private updateStats(): void {
    if (this.fpsValues.length === 0) return

    const minFps = Math.min(...this.fpsValues)
    const maxFps = Math.max(...this.fpsValues)
    const avgFps = this.fpsValues.reduce((a, b) => a + b, 0) / this.fpsValues.length

    this.minFpsDisplay.textContent = minFps.toFixed(1)
    this.maxFpsDisplay.textContent = maxFps.toFixed(1)
    this.avgFpsDisplay.textContent = avgFps.toFixed(1)
  }

  private drawGraph(): void {
    const canvas = this.graphCanvas
    const ctx = this.graphCtx
    const width = canvas.width / (window.devicePixelRatio || 1)
    const height = canvas.height / (window.devicePixelRatio || 1)

    // Clear canvas
    ctx.fillStyle = '#1e1e1e'
    ctx.fillRect(0, 0, width, height)

    if (this.frameTimes.length < 2) return

    // Find max frame time for scaling (cap at 50ms = 20fps)
    const maxFrameTime = Math.min(Math.max(...this.frameTimes, 16.67), 50)

    // Draw reference line at 16.67ms (60fps)
    const targetY = height - (16.67 / maxFrameTime) * height
    ctx.strokeStyle = '#4a4a4a'
    ctx.lineWidth = 1
    ctx.setLineDash([2, 2])
    ctx.beginPath()
    ctx.moveTo(0, targetY)
    ctx.lineTo(width, targetY)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw frame time graph
    ctx.strokeStyle = '#0066cc'
    ctx.lineWidth = 2
    ctx.beginPath()

    const step = width / this.maxFrameHistory
    for (let i = 0; i < this.frameTimes.length; i++) {
      const x = i * step
      const frameTime = this.frameTimes[i]
      const y = height - (frameTime / maxFrameTime) * height

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }

    ctx.stroke()

    // Fill area under graph
    ctx.lineTo(this.frameTimes.length * step, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fillStyle = 'rgba(0, 102, 204, 0.2)'
    ctx.fill()

    // Draw FPS text on graph
    ctx.fillStyle = '#8bb4e8'
    ctx.font = '10px monospace'
    ctx.fillText('60 FPS', 4, targetY - 2)
  }
}
