/**
 * Layout - Simple layout system with two modes
 *
 * Mode 1: Shader-only (centered canvas with styling)
 * Mode 2: Split view (code + shader side by side)
 */

import { ShadertoyProject } from '../project/types';

export type LayoutMode = 'shader-only' | 'split-view';

export interface LayoutOptions {
  mode: LayoutMode;
  container: HTMLElement;
  project: ShadertoyProject;
}

export class Layout {
  private container: HTMLElement;
  private mode: LayoutMode;
  private project: ShadertoyProject;

  // DOM elements
  private root!: HTMLElement;
  private canvasContainer!: HTMLElement;
  private codePanel?: HTMLElement;

  private constructor(opts: LayoutOptions) {
    this.container = opts.container;
    this.mode = opts.mode;
    this.project = opts.project;
  }

  /**
   * Create and initialize a Layout instance.
   * Use this instead of constructor to handle async initialization.
   */
  static async create(opts: LayoutOptions): Promise<Layout> {
    const layout = new Layout(opts);
    await layout.buildLayout();
    return layout;
  }

  /**
   * Get the canvas container element where App should render.
   */
  getCanvasContainer(): HTMLElement {
    return this.canvasContainer;
  }

  /**
   * Build the layout based on mode.
   */
  private async buildLayout(): Promise<void> {
    // Clear container
    this.container.innerHTML = '';

    if (this.mode === 'shader-only') {
      this.buildShaderOnlyLayout();
    } else {
      await this.buildSplitViewLayout();
    }
  }

  /**
   * Mode 1: Shader-only layout
   * Centered canvas with rounded corners and drop shadow.
   */
  private buildShaderOnlyLayout(): void {
    this.root = document.createElement('div');
    this.root.className = 'layout-shader-only';

    this.canvasContainer = document.createElement('div');
    this.canvasContainer.className = 'canvas-container';

    this.root.appendChild(this.canvasContainer);
    this.container.appendChild(this.root);
  }

  /**
   * Mode 2: Split view layout
   * Shader on left, code editor on right, with tabs for multi-buffer.
   */
  private async buildSplitViewLayout(): Promise<void> {
    this.root = document.createElement('div');
    this.root.className = 'layout-split-view';

    // Canvas container (left side)
    this.canvasContainer = document.createElement('div');
    this.canvasContainer.className = 'canvas-container';

    // Code panel (right side)
    this.codePanel = document.createElement('div');
    this.codePanel.className = 'code-panel';
    await this.buildCodePanel(this.codePanel);

    this.root.appendChild(this.canvasContainer);
    this.root.appendChild(this.codePanel);
    this.container.appendChild(this.root);
  }

  /**
   * Build the code panel with tabs for each shader pass.
   * Uses Prism.js with C++ syntax highlighting (lightweight, works well for GLSL).
   */
  private async buildCodePanel(panel: HTMLElement): Promise<void> {
    // Get all passes
    const passes = Object.entries(this.project.passes).map(([name, pass]) => ({
      name,
      source: pass.glslSource,
    }));

    // Add common code if it exists
    const tabs: Array<{ name: string; source: string }> = [];
    if (this.project.commonSource) {
      tabs.push({ name: 'common.glsl', source: this.project.commonSource });
    }
    tabs.push(...passes.map(p => ({ name: `${p.name.toLowerCase()}.glsl`, source: p.source })));

    // Create tab bar
    const tabBar = document.createElement('div');
    tabBar.className = 'tab-bar';

    // Create code viewer container
    const codeViewer = document.createElement('div');
    codeViewer.className = 'code-viewer';

    // Dynamically import Prism.js (only loaded in split-view mode!)
    const Prism = await import('prismjs');
    // @ts-ignore - Language components don't have type definitions
    await import('prismjs/components/prism-c');
    // @ts-ignore - Language components don't have type definitions
    await import('prismjs/components/prism-cpp');

    const showTab = (tabIndex: number) => {
      const tab = tabs[tabIndex];

      // Create pre/code elements for Prism
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.className = 'language-cpp';
      code.textContent = tab.source;
      pre.appendChild(code);

      // Clear and append
      codeViewer.innerHTML = '';
      codeViewer.appendChild(pre);

      // Highlight with Prism
      Prism.highlightElement(code);
    };

    // Create tabs
    tabs.forEach((tab, index) => {
      const tabButton = document.createElement('button');
      tabButton.className = 'tab-button';
      tabButton.textContent = tab.name;
      if (index === 0) tabButton.classList.add('active');

      tabButton.addEventListener('click', () => {
        // Update active tab
        tabBar.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        tabButton.classList.add('active');

        // Update code viewer
        showTab(index);
      });

      tabBar.appendChild(tabButton);
    });

    panel.appendChild(tabBar);
    panel.appendChild(codeViewer);

    // Show first tab
    if (tabs.length > 0) {
      showTab(0);
    }
  }

  /**
   * Clean up layout.
   */
  dispose(): void {
    this.container.innerHTML = '';
  }
}
