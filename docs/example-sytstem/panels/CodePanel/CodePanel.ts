/**
 * CodePanel - Shader Code Display/Editor
 *
 * Displays shader source code with optional editing and syntax highlighting.
 * Uses CodeMirror with C++ mode (works well for GLSL).
 */

import type { App } from '@/app/App'
import type { Panel } from '../Panel'
import type { UnsubscribeFn } from '@/app/types'
import { EditorView, basicSetup } from 'codemirror'
import { cpp } from '@codemirror/lang-cpp'
import { EditorState } from '@codemirror/state'
import './CodePanel.css'

export interface CodePanelOptions {
  /** Whether the code is editable (default: true) */
  editable?: boolean
}

/**
 * CodePanel provides shader code display/editing with syntax highlighting.
 */
export class CodePanel implements Panel {
  element: HTMLElement
  private app: App | null = null
  private unsubscribes: UnsubscribeFn[] = []
  private passSelect!: HTMLSelectElement
  private editorView: EditorView | null = null
  private editorContainer!: HTMLElement
  private reloadBtn?: HTMLButtonElement
  private statusMsg!: HTMLElement
  private editable: boolean

  constructor(options: CodePanelOptions = {}) {
    this.editable = options.editable ?? true
    this.element = document.createElement('div')
    this.element.className = 'code-panel'
    this.buildUI()
  }

  attach(app: App): void {
    this.app = app
    const project = app.getProject()

    // Populate pass selector
    this.passSelect.innerHTML = ''
    for (const pass of project.passes) {
      const option = document.createElement('option')
      option.value = pass.name
      option.textContent = pass.name
      this.passSelect.appendChild(option)
    }

    // Load first pass
    if (project.passes.length > 0) {
      this.loadPass(project.passes[0].name)
    }

    // Set up event listeners
    this.passSelect.addEventListener('change', () => {
      this.loadPass(this.passSelect.value)
    })

    if (this.reloadBtn) {
      this.reloadBtn.addEventListener('click', () => {
        this.reloadCurrentPass()
      })
    }

    // Subscribe to shader errors
    const unsubShader = app.on('shaderError', (event) => {
      if (event.passName === this.passSelect.value) {
        this.showStatus('error', `Compile error: ${event.message}`)
      }
    })
    this.unsubscribes.push(unsubShader)
  }

  detach(): void {
    // Unsubscribe from all events
    for (const unsub of this.unsubscribes) {
      unsub()
    }
    this.unsubscribes = []

    // Destroy CodeMirror
    if (this.editorView) {
      this.editorView.destroy()
      this.editorView = null
    }

    this.app = null
  }

  private buildUI(): void {
    const reloadButtonHTML = this.editable
      ? '<button class="reload-btn">↻ Reload</button>'
      : ''

    const title = this.editable ? 'Shader Editor' : 'Shader Code'

    this.element.innerHTML = `
      <div class="code-header">
        <h3 class="code-title">${title}</h3>
        <div class="code-controls">
          <select class="pass-select"></select>
          ${reloadButtonHTML}
        </div>
      </div>
      <div class="code-status"></div>
      <div class="code-editor-container"></div>
    `

    this.passSelect = this.element.querySelector('.pass-select')!
    this.editorContainer = this.element.querySelector('.code-editor-container')!
    this.statusMsg = this.element.querySelector('.code-status')!

    if (this.editable) {
      this.reloadBtn = this.element.querySelector('.reload-btn')!
    }
  }

  private loadPass(passName: string): void {
    if (!this.app) return

    const project = this.app.getProject()
    const pass = project.passes.find(p => p.name === passName)

    if (pass) {
      // Destroy old editor
      if (this.editorView) {
        this.editorView.destroy()
      }

      // Create new CodeMirror editor
      this.editorView = new EditorView({
        doc: pass.source,
        extensions: [
          basicSetup,
          cpp(), // C++ mode works great for GLSL
          EditorView.editable.of(this.editable),
          EditorState.readOnly.of(!this.editable),
          EditorView.theme({
            "&": {
              height: "100%",
              fontSize: "13px"
            },
            ".cm-scroller": {
              overflow: "auto",
              fontFamily: "'Courier New', Monaco, monospace"
            },
            ".cm-content": {
              padding: "16px 0"
            },
            ".cm-line": {
              padding: "0 16px"
            }
          })
        ],
        parent: this.editorContainer
      })

      this.showStatus('info', `Loaded ${passName}`)
    }
  }

  private async reloadCurrentPass(): Promise<void> {
    if (!this.app || !this.editorView || !this.reloadBtn) return

    const passName = this.passSelect.value
    const newSource = this.editorView.state.doc.toString()

    this.showStatus('info', 'Reloading...')
    this.reloadBtn.disabled = true

    try {
      await this.app.reloadPass(passName, newSource)
      this.showStatus('success', `✓ ${passName} reloaded successfully`)
    } catch (error) {
      this.showStatus('error', `✗ Reload failed (see errors panel)`)
    } finally {
      this.reloadBtn.disabled = false
    }
  }

  private showStatus(type: 'info' | 'success' | 'error', message: string): void {
    this.statusMsg.textContent = message
    this.statusMsg.className = `code-status code-status-${type}`
    this.statusMsg.style.display = 'block'

    // Auto-hide after 3 seconds for success/info
    if (type !== 'error') {
      setTimeout(() => {
        this.statusMsg.style.display = 'none'
      }, 3000)
    }
  }
}
