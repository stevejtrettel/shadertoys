/**
 * Uniform Controls Component
 *
 * Renders UI controls for custom uniforms defined in config.json.
 * Supports: float, int, bool, vec2 (XY pad), vec3 (color picker)
 */

import './uniform-controls.css';

import {
  UniformDefinitions,
  UniformDefinition,
  UniformValue,
  UniformValues,
  FloatUniformDefinition,
  IntUniformDefinition,
  BoolUniformDefinition,
  Vec2UniformDefinition,
  Vec3UniformDefinition,
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

  // Track document-level event listeners for cleanup
  private documentListeners: Array<{ type: string; handler: EventListener }> = [];

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
      case 'int':
        return this.createIntSlider(name, def);
      case 'bool':
        return this.createBoolToggle(name, def);
      case 'vec2':
        return this.createVec2Pad(name, def);
      case 'vec3':
        return def.color ? this.createColorPicker(name, def) : this.createVec3Sliders(name, def);
      case 'vec4':
        // vec4 color picker would need alpha - for now fall through to null
        console.warn(`Uniform '${name}': vec4 type not yet supported`);
        return null;
      default:
        console.warn(`Uniform '${name}': unknown type '${(def as any).type}'`);
        return null;
    }
  }

  // ===========================================================================
  // Float Slider
  // ===========================================================================

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
    valueDisplay.textContent = this.formatNumber(value, step);

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
      valueDisplay.textContent = this.formatNumber(newValue, step);
      this.onChange(name, newValue);
    });

    wrapper.appendChild(labelRow);
    wrapper.appendChild(slider);

    return wrapper;
  }

  // ===========================================================================
  // Int Slider
  // ===========================================================================

  private createIntSlider(name: string, def: IntUniformDefinition): HTMLElement {
    const min = def.min ?? 0;
    const max = def.max ?? 10;
    const step = def.step ?? 1;
    const value = this.values[name] as number;
    const label = def.label ?? name;

    const wrapper = document.createElement('div');
    wrapper.className = 'uniform-control uniform-control-int';

    // Label row
    const labelRow = document.createElement('div');
    labelRow.className = 'uniform-control-label-row';

    const labelEl = document.createElement('label');
    labelEl.className = 'uniform-control-label';
    labelEl.textContent = label;

    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'uniform-control-value';
    valueDisplay.textContent = String(Math.round(value));

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
      const newValue = parseInt(slider.value, 10);
      this.values[name] = newValue;
      valueDisplay.textContent = String(newValue);
      this.onChange(name, newValue);
    });

    wrapper.appendChild(labelRow);
    wrapper.appendChild(slider);

    return wrapper;
  }

  // ===========================================================================
  // Bool Toggle
  // ===========================================================================

  private createBoolToggle(name: string, def: BoolUniformDefinition): HTMLElement {
    const value = this.values[name] as boolean;
    const label = def.label ?? name;

    const wrapper = document.createElement('div');
    wrapper.className = 'uniform-control uniform-control-bool';

    // Label row with toggle
    const labelRow = document.createElement('div');
    labelRow.className = 'uniform-control-label-row';

    const labelEl = document.createElement('label');
    labelEl.className = 'uniform-control-label';
    labelEl.textContent = label;

    // Toggle switch
    const toggleWrapper = document.createElement('label');
    toggleWrapper.className = 'uniform-control-toggle';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = value;

    const slider = document.createElement('span');
    slider.className = 'uniform-control-toggle-slider';

    checkbox.addEventListener('change', () => {
      const newValue = checkbox.checked;
      this.values[name] = newValue;
      this.onChange(name, newValue);
    });

    toggleWrapper.appendChild(checkbox);
    toggleWrapper.appendChild(slider);

    labelRow.appendChild(labelEl);
    labelRow.appendChild(toggleWrapper);

    wrapper.appendChild(labelRow);

    return wrapper;
  }

  // ===========================================================================
  // Vec2 XY Pad
  // ===========================================================================

  private createVec2Pad(name: string, def: Vec2UniformDefinition): HTMLElement {
    const value = this.values[name] as number[];
    const min = def.min ?? [0, 0];
    const max = def.max ?? [1, 1];
    const label = def.label ?? name;

    const wrapper = document.createElement('div');
    wrapper.className = 'uniform-control uniform-control-vec2';

    // Label row
    const labelRow = document.createElement('div');
    labelRow.className = 'uniform-control-label-row';

    const labelEl = document.createElement('label');
    labelEl.className = 'uniform-control-label';
    labelEl.textContent = label;

    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'uniform-control-value';
    valueDisplay.textContent = this.formatVec2(value);

    labelRow.appendChild(labelEl);
    labelRow.appendChild(valueDisplay);

    // XY Pad
    const padContainer = document.createElement('div');
    padContainer.className = 'uniform-control-xy-pad';

    const handle = document.createElement('div');
    handle.className = 'uniform-control-xy-handle';

    padContainer.appendChild(handle);

    // Position handle based on value
    const updateHandlePosition = () => {
      const xPercent = ((value[0] - min[0]) / (max[0] - min[0])) * 100;
      const yPercent = (1 - (value[1] - min[1]) / (max[1] - min[1])) * 100; // Invert Y
      handle.style.left = `${xPercent}%`;
      handle.style.top = `${yPercent}%`;
    };
    updateHandlePosition();

    // Drag handling
    let isDragging = false;

    const updateFromEvent = (e: MouseEvent | TouchEvent) => {
      const rect = padContainer.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      let xPercent = (clientX - rect.left) / rect.width;
      let yPercent = (clientY - rect.top) / rect.height;

      // Clamp
      xPercent = Math.max(0, Math.min(1, xPercent));
      yPercent = Math.max(0, Math.min(1, yPercent));

      // Convert to value (invert Y)
      const newX = min[0] + xPercent * (max[0] - min[0]);
      const newY = min[1] + (1 - yPercent) * (max[1] - min[1]);

      const newValue = [newX, newY];
      this.values[name] = newValue;

      // Update UI
      handle.style.left = `${xPercent * 100}%`;
      handle.style.top = `${yPercent * 100}%`;
      valueDisplay.textContent = this.formatVec2(newValue);

      this.onChange(name, newValue);
    };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      updateFromEvent(e);
      e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateFromEvent(e);
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    padContainer.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    // Track document listeners for cleanup
    this.documentListeners.push({ type: 'mousemove', handler: onMouseMove as EventListener });
    this.documentListeners.push({ type: 'mouseup', handler: onMouseUp as EventListener });

    // Touch support
    const onTouchStart = (e: TouchEvent) => {
      isDragging = true;
      updateFromEvent(e);
      e.preventDefault();
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging) updateFromEvent(e);
    };

    padContainer.addEventListener('touchstart', onTouchStart);
    document.addEventListener('touchmove', onTouchMove as EventListener);
    document.addEventListener('touchend', onMouseUp);

    // Track document listeners for cleanup
    this.documentListeners.push({ type: 'touchmove', handler: onTouchMove as EventListener });
    this.documentListeners.push({ type: 'touchend', handler: onMouseUp as EventListener });

    wrapper.appendChild(labelRow);
    wrapper.appendChild(padContainer);

    return wrapper;
  }

  // ===========================================================================
  // Vec3 Color Picker
  // ===========================================================================

  private createColorPicker(name: string, def: Vec3UniformDefinition): HTMLElement {
    const value = this.values[name] as number[];
    const label = def.label ?? name;

    const wrapper = document.createElement('div');
    wrapper.className = 'uniform-control uniform-control-color';

    // Label row
    const labelRow = document.createElement('div');
    labelRow.className = 'uniform-control-label-row';

    const labelEl = document.createElement('label');
    labelEl.className = 'uniform-control-label';
    labelEl.textContent = label;

    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'uniform-control-value';
    valueDisplay.textContent = this.rgbToHex(value);

    labelRow.appendChild(labelEl);
    labelRow.appendChild(valueDisplay);

    // Color input wrapper
    const colorWrapper = document.createElement('div');
    colorWrapper.className = 'uniform-control-color-wrapper';

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'uniform-control-color-input';
    colorInput.value = this.rgbToHex(value);

    // Preview swatch
    const swatch = document.createElement('div');
    swatch.className = 'uniform-control-color-swatch';
    swatch.style.backgroundColor = this.rgbToHex(value);

    colorInput.addEventListener('input', () => {
      const newValue = this.hexToRgb(colorInput.value);
      this.values[name] = newValue;
      valueDisplay.textContent = colorInput.value;
      swatch.style.backgroundColor = colorInput.value;
      this.onChange(name, newValue);
    });

    // Click swatch to open picker
    swatch.addEventListener('click', () => colorInput.click());

    colorWrapper.appendChild(swatch);
    colorWrapper.appendChild(colorInput);

    wrapper.appendChild(labelRow);
    wrapper.appendChild(colorWrapper);

    return wrapper;
  }

  // ===========================================================================
  // Vec3 Sliders (fallback when not color)
  // ===========================================================================

  private createVec3Sliders(name: string, def: Vec3UniformDefinition): HTMLElement {
    const value = this.values[name] as number[];
    const label = def.label ?? name;

    const wrapper = document.createElement('div');
    wrapper.className = 'uniform-control uniform-control-vec3';

    // Label
    const labelEl = document.createElement('div');
    labelEl.className = 'uniform-control-label';
    labelEl.textContent = label;
    wrapper.appendChild(labelEl);

    // Three sliders for X, Y, Z
    const components = ['X', 'Y', 'Z'];
    components.forEach((comp, i) => {
      const sliderRow = document.createElement('div');
      sliderRow.className = 'uniform-control-vec-slider-row';

      const compLabel = document.createElement('span');
      compLabel.className = 'uniform-control-vec-component';
      compLabel.textContent = comp;

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.className = 'uniform-control-slider uniform-control-vec-slider';
      slider.min = '0';
      slider.max = '1';
      slider.step = '0.01';
      slider.value = String(value[i]);

      const valueDisplay = document.createElement('span');
      valueDisplay.className = 'uniform-control-value uniform-control-vec-value';
      valueDisplay.textContent = value[i].toFixed(2);

      slider.addEventListener('input', () => {
        const currentValue = this.values[name] as number[];
        currentValue[i] = parseFloat(slider.value);
        valueDisplay.textContent = currentValue[i].toFixed(2);
        this.onChange(name, [...currentValue]);
      });

      sliderRow.appendChild(compLabel);
      sliderRow.appendChild(slider);
      sliderRow.appendChild(valueDisplay);
      wrapper.appendChild(sliderRow);
    });

    return wrapper;
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  private formatNumber(value: number, step: number): string {
    const stepStr = String(step);
    const decimalIndex = stepStr.indexOf('.');
    const decimals = decimalIndex === -1 ? 0 : stepStr.length - decimalIndex - 1;
    return value.toFixed(decimals);
  }

  private formatVec2(value: number[]): string {
    return `(${value[0].toFixed(2)}, ${value[1].toFixed(2)})`;
  }

  private rgbToHex(rgb: number[]): string {
    const r = Math.round(rgb[0] * 255);
    const g = Math.round(rgb[1] * 255);
    const b = Math.round(rgb[2] * 255);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private hexToRgb(hex: string): number[] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [0, 0, 0];
    return [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255,
    ];
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * Update a uniform value externally (e.g., from reset).
   */
  setValue(name: string, value: UniformValue): void {
    if (!(name in this.uniforms)) return;

    this.values[name] = value;

    const control = this.controlElements.get(name);
    if (!control) return;

    const def = this.uniforms[name];

    switch (def.type) {
      case 'float': {
        const slider = control.querySelector('.uniform-control-slider') as HTMLInputElement;
        const valueDisplay = control.querySelector('.uniform-control-value') as HTMLSpanElement;
        if (slider && valueDisplay) {
          slider.value = String(value);
          valueDisplay.textContent = this.formatNumber(value as number, def.step ?? 0.01);
        }
        break;
      }
      case 'int': {
        const slider = control.querySelector('.uniform-control-slider') as HTMLInputElement;
        const valueDisplay = control.querySelector('.uniform-control-value') as HTMLSpanElement;
        if (slider && valueDisplay) {
          slider.value = String(value);
          valueDisplay.textContent = String(Math.round(value as number));
        }
        break;
      }
      case 'bool': {
        const checkbox = control.querySelector('input[type="checkbox"]') as HTMLInputElement;
        if (checkbox) {
          checkbox.checked = value as boolean;
        }
        break;
      }
      case 'vec2': {
        const handle = control.querySelector('.uniform-control-xy-handle') as HTMLElement;
        const valueDisplay = control.querySelector('.uniform-control-value') as HTMLSpanElement;
        const v = value as number[];
        const min = def.min ?? [0, 0];
        const max = def.max ?? [1, 1];
        if (handle && valueDisplay) {
          const xPercent = ((v[0] - min[0]) / (max[0] - min[0])) * 100;
          const yPercent = (1 - (v[1] - min[1]) / (max[1] - min[1])) * 100;
          handle.style.left = `${xPercent}%`;
          handle.style.top = `${yPercent}%`;
          valueDisplay.textContent = this.formatVec2(v);
        }
        break;
      }
      case 'vec3': {
        if (def.color) {
          const colorInput = control.querySelector('.uniform-control-color-input') as HTMLInputElement;
          const swatch = control.querySelector('.uniform-control-color-swatch') as HTMLElement;
          const valueDisplay = control.querySelector('.uniform-control-value') as HTMLSpanElement;
          const hex = this.rgbToHex(value as number[]);
          if (colorInput && swatch && valueDisplay) {
            colorInput.value = hex;
            swatch.style.backgroundColor = hex;
            valueDisplay.textContent = hex;
          }
        } else {
          const sliders = control.querySelectorAll('.uniform-control-vec-slider') as NodeListOf<HTMLInputElement>;
          const valueDisplays = control.querySelectorAll('.uniform-control-vec-value') as NodeListOf<HTMLSpanElement>;
          const v = value as number[];
          sliders.forEach((slider, i) => {
            slider.value = String(v[i]);
            if (valueDisplays[i]) {
              valueDisplays[i].textContent = v[i].toFixed(2);
            }
          });
        }
        break;
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
    // Remove document-level event listeners to prevent memory leaks
    for (const { type, handler } of this.documentListeners) {
      document.removeEventListener(type, handler);
    }
    this.documentListeners = [];

    this.container.innerHTML = '';
    this.controlElements.clear();
  }
}
