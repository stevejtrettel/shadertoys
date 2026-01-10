/**
 * Uniform Controls Component
 *
 * Renders UI controls for custom uniforms defined in config.json.
 * Currently supports float type with slider control.
 */

import './uniform-controls.css';

import {
  UniformDefinitions,
  UniformDefinition,
  UniformValue,
  UniformValues,
  FloatUniformDefinition,
} from '../project/types';

export interface UniformControlsOptions {
  /** Container element to mount controls into */
  container: HTMLElement;
  /** Uniform definitions from project config */
  uniforms: UniformDefinitions;
  /** Callback when a uniform value changes */
  onChange: (name: string, value: UniformValue) => void;
  /** Initial values (optional, defaults to definition values) */
  initialValues?: UniformValues;
}

export class UniformControls {
  private container: HTMLElement;
  private uniforms: UniformDefinitions;
  private onChange: (name: string, value: UniformValue) => void;
  private values: UniformValues = {};
  private controlElements: Map<string, HTMLElement> = new Map();

  constructor(opts: UniformControlsOptions) {
    this.container = opts.container;
    this.uniforms = opts.uniforms;
    this.onChange = opts.onChange;

    // Initialize values
    for (const [name, def] of Object.entries(this.uniforms)) {
      this.values[name] = opts.initialValues?.[name] ?? def.value;
    }

    this.render();
  }

  /**
   * Render all uniform controls.
   */
  private render(): void {
    this.container.innerHTML = '';
    this.container.className = 'uniform-controls';

    const uniformEntries = Object.entries(this.uniforms);

    if (uniformEntries.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'uniform-controls-empty';
      emptyMsg.textContent = 'No uniforms defined';
      this.container.appendChild(emptyMsg);
      return;
    }

    // Header with reset button
    const header = document.createElement('div');
    header.className = 'uniform-controls-header';

    const resetButton = document.createElement('button');
    resetButton.className = 'uniform-controls-reset';
    resetButton.textContent = 'Reset';
    resetButton.title = 'Reset all uniforms to defaults';
    resetButton.addEventListener('click', () => this.resetToDefaults());

    header.appendChild(resetButton);
    this.container.appendChild(header);

    // Control list
    const controlList = document.createElement('div');
    controlList.className = 'uniform-controls-list';

    for (const [name, def] of uniformEntries) {
      const control = this.createControl(name, def);
      if (control) {
        this.controlElements.set(name, control);
        controlList.appendChild(control);
      }
    }

    this.container.appendChild(controlList);
  }

  /**
   * Create a control element for a uniform.
   */
  private createControl(name: string, def: UniformDefinition): HTMLElement | null {
    switch (def.type) {
      case 'float':
        return this.createFloatSlider(name, def);
      // TODO: Add more types
      default:
        return null;
    }
  }

  /**
   * Create a float slider control.
   */
  private createFloatSlider(name: string, def: FloatUniformDefinition): HTMLElement {
    const min = def.min ?? 0;
    const max = def.max ?? 1;
    const step = def.step ?? 0.01;
    const value = this.values[name] as number;
    const label = def.label ?? name;

    const wrapper = document.createElement('div');
    wrapper.className = 'uniform-control uniform-control-float';

    // Label row
    const labelRow = document.createElement('div');
    labelRow.className = 'uniform-control-label-row';

    const labelEl = document.createElement('label');
    labelEl.className = 'uniform-control-label';
    labelEl.textContent = label;

    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'uniform-control-value';
    valueDisplay.textContent = this.formatValue(value, step);

    labelRow.appendChild(labelEl);
    labelRow.appendChild(valueDisplay);

    // Slider
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'uniform-control-slider';
    slider.min = String(min);
    slider.max = String(max);
    slider.step = String(step);
    slider.value = String(value);

    slider.addEventListener('input', () => {
      const newValue = parseFloat(slider.value);
      this.values[name] = newValue;
      valueDisplay.textContent = this.formatValue(newValue, step);
      this.onChange(name, newValue);
    });

    wrapper.appendChild(labelRow);
    wrapper.appendChild(slider);

    return wrapper;
  }

  /**
   * Format a value for display.
   */
  private formatValue(value: number, step: number): string {
    // Determine decimal places from step
    const stepStr = String(step);
    const decimalIndex = stepStr.indexOf('.');
    const decimals = decimalIndex === -1 ? 0 : stepStr.length - decimalIndex - 1;
    return value.toFixed(decimals);
  }

  /**
   * Update a uniform value externally (e.g., from reset).
   */
  setValue(name: string, value: UniformValue): void {
    if (!(name in this.uniforms)) return;

    this.values[name] = value;

    // Update the UI
    const control = this.controlElements.get(name);
    if (!control) return;

    const def = this.uniforms[name];
    if (def.type === 'float') {
      const slider = control.querySelector('.uniform-control-slider') as HTMLInputElement;
      const valueDisplay = control.querySelector('.uniform-control-value') as HTMLSpanElement;
      if (slider && valueDisplay) {
        slider.value = String(value);
        valueDisplay.textContent = this.formatValue(value as number, def.step ?? 0.01);
      }
    }
  }

  /**
   * Reset all uniforms to their default values.
   */
  resetToDefaults(): void {
    for (const [name, def] of Object.entries(this.uniforms)) {
      this.setValue(name, def.value);
      this.onChange(name, def.value);
    }
  }

  /**
   * Destroy the controls and clean up.
   */
  destroy(): void {
    this.container.innerHTML = '';
    this.controlElements.clear();
  }
}
