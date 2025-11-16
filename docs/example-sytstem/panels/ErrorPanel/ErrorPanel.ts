/**
 * ErrorPanel - Error Display
 *
 * Displays shader compilation errors and runtime errors.
 * Shows different styling for different error types.
 */

import type { App } from '@/app/App'
import type { Panel } from '../Panel'
import type { UnsubscribeFn } from '@/app/types'
import './ErrorPanel.css'

interface ErrorEntry {
  type: 'shader' | 'runtime'
  message: string
  timestamp: number
  passName?: string
  rawLog?: string
}

/**
 * ErrorPanel displays errors from App.
 */
export class ErrorPanel implements Panel {
  element: HTMLElement
  private app: App | null = null
  private unsubscribes: UnsubscribeFn[] = []
  private errors: ErrorEntry[] = []
  private errorContainer!: HTMLElement
  private noErrorsMsg!: HTMLElement

  constructor() {
    this.element = document.createElement('div')
    this.element.className = 'error-panel'
    this.buildUI()
  }

  attach(app: App): void {
    this.app = app

    // Subscribe to shader errors
    const unsubShader = app.on('shaderError', (event) => {
      this.addError({
        type: 'shader',
        message: event.message,
        passName: event.passName,
        rawLog: event.rawLog,
        timestamp: Date.now()
      })
    })
    this.unsubscribes.push(unsubShader)

    // Subscribe to runtime errors
    const unsubRuntime = app.on('runtimeError', (event) => {
      this.addError({
        type: 'runtime',
        message: event.message,
        timestamp: Date.now()
      })
    })
    this.unsubscribes.push(unsubRuntime)
  }

  detach(): void {
    // Unsubscribe from all events
    for (const unsub of this.unsubscribes) {
      unsub()
    }
    this.unsubscribes = []

    this.errors = []
    this.app = null
  }

  private buildUI(): void {
    this.element.innerHTML = `
      <div class="error-header">
        <h3 class="error-title">Errors</h3>
        <button class="clear-errors-btn">Clear</button>
      </div>
      <div class="error-container">
        <div class="no-errors">No errors</div>
      </div>
    `

    this.errorContainer = this.element.querySelector('.error-container')!
    this.noErrorsMsg = this.element.querySelector('.no-errors')!

    const clearBtn = this.element.querySelector('.clear-errors-btn')!
    clearBtn.addEventListener('click', () => {
      this.clearErrors()
    })
  }

  private addError(error: ErrorEntry): void {
    this.errors.push(error)

    // Hide "no errors" message
    this.noErrorsMsg.style.display = 'none'

    // Create error element
    const errorEl = document.createElement('div')
    errorEl.className = `error-entry error-${error.type}`

    const header = document.createElement('div')
    header.className = 'error-header-line'

    const typeLabel = document.createElement('span')
    typeLabel.className = 'error-type'
    typeLabel.textContent = error.type === 'shader' ? '🔴 Shader Error' : '⚠️ Runtime Error'
    header.appendChild(typeLabel)

    if (error.passName) {
      const passLabel = document.createElement('span')
      passLabel.className = 'error-pass'
      passLabel.textContent = `in ${error.passName}`
      header.appendChild(passLabel)
    }

    const time = document.createElement('span')
    time.className = 'error-time'
    time.textContent = new Date(error.timestamp).toLocaleTimeString()
    header.appendChild(time)

    errorEl.appendChild(header)

    const message = document.createElement('pre')
    message.className = 'error-message'
    message.textContent = error.message
    errorEl.appendChild(message)

    // Add raw log if available (collapsible)
    if (error.rawLog) {
      const rawToggle = document.createElement('button')
      rawToggle.className = 'raw-log-toggle'
      rawToggle.textContent = 'Show raw log'

      const rawLog = document.createElement('pre')
      rawLog.className = 'raw-log'
      rawLog.textContent = error.rawLog
      rawLog.style.display = 'none'

      rawToggle.addEventListener('click', () => {
        if (rawLog.style.display === 'none') {
          rawLog.style.display = 'block'
          rawToggle.textContent = 'Hide raw log'
        } else {
          rawLog.style.display = 'none'
          rawToggle.textContent = 'Show raw log'
        }
      })

      errorEl.appendChild(rawToggle)
      errorEl.appendChild(rawLog)
    }

    this.errorContainer.appendChild(errorEl)

    // Scroll to bottom
    this.errorContainer.scrollTop = this.errorContainer.scrollHeight
  }

  private clearErrors(): void {
    this.errors = []

    // Remove all error elements
    const errorEntries = this.errorContainer.querySelectorAll('.error-entry')
    errorEntries.forEach(el => el.remove())

    // Show "no errors" message
    this.noErrorsMsg.style.display = 'block'
  }

  private styleElement(): void {
    const style = document.createElement('style')
    style.textContent = `
      .error-panel {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: #f5f5f5;
        font-family: system-ui, -apple-system, sans-serif;
      }

      .error-header {
        padding: 12px 16px;
        background: #fff;
        border-bottom: 1px solid #ddd;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .error-title {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #333;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .clear-errors-btn {
        padding: 6px 12px;
        border: 1px solid #ccc;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s;
      }

      .clear-errors-btn:hover {
        background: #f0f0f0;
        border-color: #999;
      }

      .error-container {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .no-errors {
        padding: 40px 20px;
        text-align: center;
        color: #999;
        font-size: 13px;
        font-style: italic;
      }

      .error-entry {
        background: white;
        border-left: 4px solid #666;
        border-radius: 4px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .error-shader {
        border-left-color: #ef4444;
        background: #fef2f2;
      }

      .error-runtime {
        border-left-color: #f59e0b;
        background: #fffbeb;
      }

      .error-header-line {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .error-type {
        font-weight: 600;
        font-size: 13px;
      }

      .error-shader .error-type {
        color: #dc2626;
      }

      .error-runtime .error-type {
        color: #d97706;
      }

      .error-pass {
        font-size: 12px;
        color: #666;
        font-weight: 500;
      }

      .error-time {
        margin-left: auto;
        font-size: 11px;
        color: #999;
        font-family: 'Courier New', monospace;
      }

      .error-message {
        margin: 0;
        padding: 8px;
        background: rgba(0, 0, 0, 0.02);
        border-radius: 3px;
        font-size: 12px;
        font-family: 'Courier New', monospace;
        white-space: pre-wrap;
        word-wrap: break-word;
        color: #333;
      }

      .raw-log-toggle {
        padding: 4px 8px;
        border: 1px solid #ddd;
        background: white;
        border-radius: 3px;
        cursor: pointer;
        font-size: 11px;
        align-self: flex-start;
        transition: all 0.2s;
      }

      .raw-log-toggle:hover {
        background: #f5f5f5;
      }

      .raw-log {
        margin: 0;
        padding: 8px;
        background: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 3px;
        font-size: 11px;
        font-family: 'Courier New', monospace;
        white-space: pre-wrap;
        word-wrap: break-word;
        color: #666;
        max-height: 200px;
        overflow-y: auto;
      }
    `
    document.head.appendChild(style)
  }
}
