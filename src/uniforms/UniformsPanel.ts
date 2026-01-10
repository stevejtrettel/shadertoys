/**
 * Uniforms Panel - Floating overlay for uniform controls
 *
 * A compact, always-visible panel that floats on the right side of the canvas.
 * Shows when uniforms are defined in the project.
 */

import './uniforms-panel.css';

import { UniformDefinitions, UniformValue, UniformValues } from '../project/types';
import { UniformControls } from './UniformControls';

export interface UniformsPanelOptions {
  /** Parent container to attach the panel to */
  container: HTMLElement;
  /** Uniform definitions from project */
  uniforms: UniformDefinitions;
  /** Callback when uniform value changes */
  onChange: (name: string, value: UniformValue) => void;
  /** Initial values (optional) */
  initialValues?: UniformValues;
}

export class UniformsPanel {
  private panel: HTMLElement;
  private controls: UniformControls | null = null;
  private uniforms: UniformDefinitions;
  private onChange: (name: string, value: UniformValue) => void;
  private values: UniformValues = {};

  constructor(opts: UniformsPanelOptions) {
    this.uniforms = opts.uniforms;
    this.onChange = opts.onChange;

    // Initialize values
    for (const [name, def] of Object.entries(this.uniforms)) {
      this.values[name] = opts.initialValues?.[name] ?? def.value;
    }

    // Create panel element
    this.panel = document.createElement('div');
    this.panel.className = 'uniforms-panel';

    // Only show if there are uniforms
    if (Object.keys(this.uniforms).length === 0) {
      this.panel.style.display = 'none';
      opts.container.appendChild(this.panel);
      return;
    }

    // Header
    const header = document.createElement('div');
    header.className = 'uniforms-panel-header';
    header.textContent = 'Uniforms';
    this.panel.appendChild(header);

    // Content area for controls
    const content = document.createElement('div');
    content.className = 'uniforms-panel-content';
    this.panel.appendChild(content);

    // Create uniform controls
    this.controls = new UniformControls({
      container: content,
      uniforms: this.uniforms,
      initialValues: this.values,
      onChange: (name: string, value: UniformValue) => {
        this.values[name] = value;
        this.onChange(name, value);
      },
    });

    // Append to container
    opts.container.appendChild(this.panel);
  }

  /**
   * Update a uniform value from external source.
   */
  setValue(name: string, value: UniformValue): void {
    this.values[name] = value;
    this.controls?.setValue(name, value);
  }

  /**
   * Get current uniform values.
   */
  getValues(): UniformValues {
    return { ...this.values };
  }

  /**
   * Show the panel.
   */
  show(): void {
    if (Object.keys(this.uniforms).length > 0) {
      this.panel.style.display = '';
    }
  }

  /**
   * Hide the panel.
   */
  hide(): void {
    this.panel.style.display = 'none';
  }

  /**
   * Toggle panel visibility.
   */
  toggle(): void {
    if (this.panel.style.display === 'none') {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Check if panel is visible.
   */
  isVisible(): boolean {
    return this.panel.style.display !== 'none';
  }

  /**
   * Destroy the panel.
   */
  destroy(): void {
    this.controls?.destroy();
    this.panel.remove();
  }
}
