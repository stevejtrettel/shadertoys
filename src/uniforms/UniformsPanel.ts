/**
 * Uniforms Panel - Floating overlay for uniform controls
 *
 * A compact panel that floats on the right side of the canvas.
 * Includes a toggle button to show/hide. Starts closed by default.
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
  /** Start with panel open (default: false) */
  startOpen?: boolean;
}

export class UniformsPanel {
  private wrapper: HTMLElement;
  private panel: HTMLElement;
  private toggleButton: HTMLElement;
  private controls: UniformControls | null = null;
  private uniforms: UniformDefinitions;
  private onChange: (name: string, value: UniformValue) => void;
  private values: UniformValues = {};
  private isOpen: boolean;

  constructor(opts: UniformsPanelOptions) {
    this.uniforms = opts.uniforms;
    this.onChange = opts.onChange;
    this.isOpen = opts.startOpen ?? false;

    // Initialize values
    for (const [name, def] of Object.entries(this.uniforms)) {
      this.values[name] = opts.initialValues?.[name] ?? def.value;
    }

    // Create wrapper for both toggle button and panel
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'uniforms-panel-wrapper';

    // Create toggle button (always visible)
    this.toggleButton = document.createElement('button');
    this.toggleButton.className = 'uniforms-toggle-button';
    this.toggleButton.title = 'Toggle Uniforms Panel';
    this.toggleButton.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="4" y1="21" x2="4" y2="14"></line>
        <line x1="4" y1="10" x2="4" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12" y2="3"></line>
        <line x1="20" y1="21" x2="20" y2="16"></line>
        <line x1="20" y1="12" x2="20" y2="3"></line>
        <line x1="1" y1="14" x2="7" y2="14"></line>
        <line x1="9" y1="8" x2="15" y2="8"></line>
        <line x1="17" y1="16" x2="23" y2="16"></line>
      </svg>
    `;
    this.toggleButton.addEventListener('click', () => this.toggle());
    this.wrapper.appendChild(this.toggleButton);

    // Create panel element
    this.panel = document.createElement('div');
    this.panel.className = 'uniforms-panel';

    // Only create content if there are uniforms
    if (Object.keys(this.uniforms).length === 0) {
      this.wrapper.style.display = 'none';
      opts.container.appendChild(this.wrapper);
      return;
    }

    // Header with close button
    const header = document.createElement('div');
    header.className = 'uniforms-panel-header';

    const title = document.createElement('span');
    title.textContent = 'Uniforms';
    header.appendChild(title);

    const closeButton = document.createElement('button');
    closeButton.className = 'uniforms-panel-close';
    closeButton.innerHTML = '&times;';
    closeButton.title = 'Close';
    closeButton.addEventListener('click', () => this.hide());
    header.appendChild(closeButton);

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

    this.wrapper.appendChild(this.panel);

    // Set initial state
    if (!this.isOpen) {
      this.panel.classList.add('closed');
    }

    // Append to container
    opts.container.appendChild(this.wrapper);
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
      this.isOpen = true;
      this.toggleButton.classList.add('hidden');
      this.panel.classList.remove('closed');
    }
  }

  /**
   * Hide the panel.
   */
  hide(): void {
    this.isOpen = false;
    this.panel.classList.add('closed');
    this.toggleButton.classList.remove('hidden');
  }

  /**
   * Toggle panel visibility.
   */
  toggle(): void {
    if (this.isOpen) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Check if panel is visible.
   */
  isVisible(): boolean {
    return this.isOpen;
  }

  /**
   * Destroy the panel.
   */
  destroy(): void {
    this.controls?.destroy();
    this.wrapper.remove();
  }
}
