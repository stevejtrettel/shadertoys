/**
 * ParamsPanel - Parameter Controls
 *
 * Generates UI controls for all user-defined parameters.
 * Supports float, int, bool, and vec3 parameters.
 */

import type { App } from '@/app/App'
import type { Panel } from '../Panel'
import type { UnsubscribeFn } from '@/app/types'
import './ParamsPanel.css'

/**
 * ParamsPanel provides controls for user parameters.
 */
export class ParamsPanel implements Panel {
  element: HTMLElement
  private app: App | null = null
  private unsubscribes: UnsubscribeFn[] = []
  private paramControls: Map<string, HTMLElement> = new Map()

  constructor() {
    this.element = document.createElement('div')
    this.element.className = 'params-panel'
  }

  attach(app: App): void {
    this.app = app
    const project = app.getProject()

    // Build header
    this.buildHeader(project)

    // Build parameter controls
    if (project.params) {
      const paramsContainer = document.createElement('div')
      paramsContainer.className = 'params-container'

      for (const [name, config] of Object.entries(project.params)) {
        const control = this.createParamControl(name, config, app)
        paramsContainer.appendChild(control)
        this.paramControls.set(name, control)
      }

      this.element.appendChild(paramsContainer)
    } else {
      const noParams = document.createElement('div')
      noParams.className = 'no-params'
      noParams.textContent = 'No parameters defined'
      this.element.appendChild(noParams)
    }

    // Subscribe to param changes to sync UI
    const unsubParam = app.on('paramChange', (event) => {
      this.updateControlValue(event.name, event.value)
    })
    this.unsubscribes.push(unsubParam)
  }

  detach(): void {
    // Unsubscribe from all events
    for (const unsub of this.unsubscribes) {
      unsub()
    }
    this.unsubscribes = []

    this.paramControls.clear()
    this.app = null
  }

  private buildHeader(project: any): void {
    const header = document.createElement('div')
    header.className = 'params-header'

    const title = document.createElement('h3')
    title.className = 'params-title'
    title.textContent = 'Parameters'
    header.appendChild(title)

    // Add preset selector if presets exist
    if (project.presets && Object.keys(project.presets).length > 0) {
      const presetSelect = document.createElement('select')
      presetSelect.className = 'preset-select'

      const defaultOption = document.createElement('option')
      defaultOption.value = ''
      defaultOption.textContent = 'Select preset...'
      presetSelect.appendChild(defaultOption)

      for (const presetName of Object.keys(project.presets)) {
        const option = document.createElement('option')
        option.value = presetName
        option.textContent = presetName
        presetSelect.appendChild(option)
      }

      presetSelect.addEventListener('change', () => {
        if (presetSelect.value && this.app) {
          this.app.applyPreset(presetSelect.value)
          presetSelect.value = '' // Reset to default
        }
      })

      header.appendChild(presetSelect)
    }

    // Add restore defaults button
    const restoreBtn = document.createElement('button')
    restoreBtn.className = 'restore-defaults-btn'
    restoreBtn.textContent = '↻ Defaults'
    restoreBtn.addEventListener('click', () => {
      if (this.app) {
        this.app.restoreParamsToDefaults()
      }
    })
    header.appendChild(restoreBtn)

    this.element.appendChild(header)
  }

  private createParamControl(name: string, config: any, app: App): HTMLElement {
    const container = document.createElement('div')
    container.className = 'param-control'

    const label = document.createElement('label')
    label.className = 'param-label'
    label.textContent = config.label || name

    const currentValue = app.getParam(name)

    switch (config.type) {
      case 'float': {
        const input = document.createElement('input')
        input.type = 'range'
        input.className = 'param-slider'
        input.min = config.min.toString()
        input.max = config.max.toString()
        input.step = (config.step || (config.max - config.min) / 100).toString()
        input.value = (currentValue as number).toString()

        const valueDisplay = document.createElement('span')
        valueDisplay.className = 'param-value'
        valueDisplay.textContent = (currentValue as number).toFixed(3)

        input.addEventListener('input', () => {
          const value = parseFloat(input.value)
          valueDisplay.textContent = value.toFixed(3)
          app.setParam(name, value)
        })

        container.appendChild(label)
        container.appendChild(input)
        container.appendChild(valueDisplay)
        break
      }

      case 'int': {
        const input = document.createElement('input')
        input.type = 'range'
        input.className = 'param-slider'
        input.min = config.min.toString()
        input.max = config.max.toString()
        input.step = '1'
        input.value = (currentValue as number).toString()

        const valueDisplay = document.createElement('span')
        valueDisplay.className = 'param-value'
        valueDisplay.textContent = (currentValue as number).toString()

        input.addEventListener('input', () => {
          const value = parseInt(input.value, 10)
          valueDisplay.textContent = value.toString()
          app.setParam(name, value)
        })

        container.appendChild(label)
        container.appendChild(input)
        container.appendChild(valueDisplay)
        break
      }

      case 'bool': {
        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.className = 'param-checkbox'
        checkbox.checked = currentValue as boolean

        checkbox.addEventListener('change', () => {
          app.setParam(name, checkbox.checked)
        })

        label.appendChild(checkbox)
        container.appendChild(label)
        break
      }

      case 'vec3': {
        const value = currentValue as [number, number, number]
        const colorInput = document.createElement('input')
        colorInput.type = 'color'
        colorInput.className = 'param-color'
        colorInput.value = this.rgbToHex(value)

        colorInput.addEventListener('input', () => {
          const rgb = this.hexToRgb(colorInput.value)
          app.setParam(name, rgb)
        })

        container.appendChild(label)
        container.appendChild(colorInput)
        break
      }
    }

    return container
  }

  private updateControlValue(name: string, value: any): void {
    // Find and update the control's visual state
    // (This is called when parameters change from other sources)
    const control = this.paramControls.get(name)
    if (!control) return

    const slider = control.querySelector('.param-slider') as HTMLInputElement
    const valueDisplay = control.querySelector('.param-value') as HTMLSpanElement
    const checkbox = control.querySelector('.param-checkbox') as HTMLInputElement
    const colorInput = control.querySelector('.param-color') as HTMLInputElement

    if (slider && typeof value === 'number') {
      slider.value = value.toString()
      if (valueDisplay) {
        const isInt = slider.step === '1'
        valueDisplay.textContent = isInt ? value.toString() : value.toFixed(3)
      }
    } else if (checkbox && typeof value === 'boolean') {
      checkbox.checked = value
    } else if (colorInput && Array.isArray(value)) {
      colorInput.value = this.rgbToHex(value as [number, number, number])
    }
  }

  private rgbToHex(rgb: [number, number, number]): string {
    const r = Math.round(rgb[0] * 255).toString(16).padStart(2, '0')
    const g = Math.round(rgb[1] * 255).toString(16).padStart(2, '0')
    const b = Math.round(rgb[2] * 255).toString(16).padStart(2, '0')
    return `#${r}${g}${b}`
  }

  private hexToRgb(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    return [r, g, b]
  }

  private styleElement(): void {
    const style = document.createElement('style')
    style.textContent = `
      .params-panel {
        padding: 16px;
        background: #f5f5f5;
        font-family: system-ui, -apple-system, sans-serif;
        overflow-y: auto;
      }

      .params-header {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 16px;
      }

      .params-title {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #333;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .preset-select {
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 13px;
        background: white;
        cursor: pointer;
      }

      .restore-defaults-btn {
        padding: 8px 12px;
        border: 1px solid #ccc;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s;
      }

      .restore-defaults-btn:hover {
        background: #f0f0f0;
        border-color: #999;
      }

      .params-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .param-control {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .param-label {
        font-size: 13px;
        font-weight: 500;
        color: #333;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .param-slider {
        width: 100%;
        cursor: pointer;
      }

      .param-value {
        font-size: 13px;
        color: #666;
        font-family: 'Courier New', monospace;
        text-align: right;
      }

      .param-checkbox {
        width: 20px;
        height: 20px;
        cursor: pointer;
      }

      .param-color {
        width: 100%;
        height: 40px;
        border: 1px solid #ccc;
        border-radius: 4px;
        cursor: pointer;
      }

      .no-params {
        padding: 20px;
        text-align: center;
        color: #999;
        font-size: 13px;
        font-style: italic;
      }
    `
    document.head.appendChild(style)
  }
}
