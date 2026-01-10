/**
 * Tabbed Layout
 *
 * Single window with tabs to switch between shader output, editable code, and textures.
 * First tab shows the live shader, remaining tabs show editable GLSL source files and images.
 */

import './tabbed.css';

import { BaseLayout, LayoutOptions, RecompileHandler, UniformChangeHandler } from './types';
import { ShadertoyProject, PassName, UniformValue, UniformValues } from '../project/types';
import type { UniformControls as UniformControlsType } from '../uniforms/UniformControls';

type ShaderTab = { kind: 'shader'; name: string };
type UniformsTab = { kind: 'uniforms'; name: string };
type CodeTab = { kind: 'code'; name: string; passName: 'common' | PassName; source: string };
type ImageTab = { kind: 'image'; name: string; url: string };
type Tab = ShaderTab | UniformsTab | CodeTab | ImageTab;

export class TabbedLayout implements BaseLayout {
  private container: HTMLElement;
  private project: ShadertoyProject;
  private root: HTMLElement;
  private canvasContainer: HTMLElement;
  private contentArea: HTMLElement;
  private imageViewer: HTMLElement;

  private editorContainer: HTMLElement;
  private editorInstance: any = null;
  private buttonContainer: HTMLElement;
  private copyButton: HTMLElement;
  private recompileButton: HTMLElement;
  private errorDisplay: HTMLElement;
  private recompileHandler: RecompileHandler | null = null;
  private uniformChangeHandler: UniformChangeHandler | null = null;
  private modifiedSources: Map<string, string> = new Map();
  private tabs: Tab[] = [];
  private activeTabIndex: number = 0;

  // Uniforms support
  private uniformsContainer: HTMLElement;
  private uniformControls: UniformControlsType | null = null;
  private uniformValues: UniformValues = {};

  constructor(opts: LayoutOptions) {
    this.container = opts.container;
    this.project = opts.project;

    // Create root layout container
    this.root = document.createElement('div');
    this.root.className = 'layout-tabbed';

    // Create wrapper to constrain size (matches default layout)
    const wrapper = document.createElement('div');
    wrapper.className = 'tabbed-wrapper';

    // Create content area (holds either canvas, code, or image)
    this.contentArea = document.createElement('div');
    this.contentArea.className = 'tabbed-content';

    // Create canvas container (shown when Shader tab is active)
    this.canvasContainer = document.createElement('div');
    this.canvasContainer.className = 'tabbed-canvas-container';

    // Create image viewer (shown when image tabs are active)
    this.imageViewer = document.createElement('div');
    this.imageViewer.className = 'tabbed-image-viewer';
    this.imageViewer.style.visibility = 'hidden';

    this.contentArea.appendChild(this.canvasContainer);
    this.contentArea.appendChild(this.imageViewer);

    // Create editor container
    this.editorContainer = document.createElement('div');
    this.editorContainer.className = 'tabbed-editor-container';
    this.editorContainer.style.visibility = 'hidden';
    this.contentArea.appendChild(this.editorContainer);

    // Create uniforms container (semi-transparent overlay)
    this.uniformsContainer = document.createElement('div');
    this.uniformsContainer.className = 'tabbed-uniforms-container';
    this.uniformsContainer.style.visibility = 'hidden';
    this.contentArea.appendChild(this.uniformsContainer);

    // Initialize uniform values from project
    for (const [name, def] of Object.entries(this.project.uniforms)) {
      this.uniformValues[name] = def.value;
    }

    // Create button container for copy and recompile (will be added to toolbar)
    this.buttonContainer = document.createElement('div');
    this.buttonContainer.className = 'tabbed-button-container';
    this.buttonContainer.style.display = 'none';

    // Create copy button (icon only)
    this.copyButton = document.createElement('button');
    this.copyButton.className = 'tabbed-copy-button';
    this.copyButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2z" opacity="0.4"/>
        <path d="M2 5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H2zm0 1h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/>
      </svg>
    `;
    this.copyButton.title = 'Copy code to clipboard';
    this.copyButton.addEventListener('click', () => this.copyToClipboard());
    this.buttonContainer.appendChild(this.copyButton);

    // Create recompile button
    this.recompileButton = document.createElement('button');
    this.recompileButton.className = 'tabbed-recompile-button';
    this.recompileButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4 3v10l8-5-8-5z"/>
      </svg>
      Recompile
    `;
    this.recompileButton.title = 'Recompile shader (Ctrl+Enter)';
    this.recompileButton.addEventListener('click', () => this.recompile());
    this.buttonContainer.appendChild(this.recompileButton);

    // Create error display
    this.errorDisplay = document.createElement('div');
    this.errorDisplay.className = 'tabbed-error-display';
    this.errorDisplay.style.display = 'none';
    this.contentArea.appendChild(this.errorDisplay);

    // Set up keyboard shortcut for recompile
    this.setupKeyboardShortcut();

    // Build tab bar
    const tabBar = this.buildTabBar();

    // Assemble and append to DOM
    wrapper.appendChild(tabBar);
    wrapper.appendChild(this.contentArea);
    this.root.appendChild(wrapper);
    this.container.appendChild(this.root);
  }

  getCanvasContainer(): HTMLElement {
    return this.canvasContainer;
  }

  setRecompileHandler(handler: RecompileHandler): void {
    this.recompileHandler = handler;
  }

  setUniformHandler(handler: UniformChangeHandler): void {
    this.uniformChangeHandler = handler;
  }

  dispose(): void {
    if (this.editorInstance) {
      this.editorInstance.destroy();
      this.editorInstance = null;
    }
    if (this.uniformControls) {
      this.uniformControls.destroy();
      this.uniformControls = null;
    }
    this.container.innerHTML = '';
  }

  private setupKeyboardShortcut(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const tab = this.tabs[this.activeTabIndex];
        if (tab.kind === 'code') {
          e.preventDefault();
          this.recompile();
        }
      }
    });
  }

  private saveCurrentEditorContent(): void {
    if (this.editorInstance) {
      const tab = this.tabs[this.activeTabIndex];
      if (tab.kind === 'code') {
        const source = this.editorInstance.getSource();
        this.modifiedSources.set(tab.passName, source);
      }
    }
  }

  private recompile(): void {
    if (!this.recompileHandler) {
      console.warn('No recompile handler set');
      return;
    }

    this.saveCurrentEditorContent();

    const tab = this.tabs[this.activeTabIndex];
    if (tab.kind !== 'code') return;

    const source = this.modifiedSources.get(tab.passName) ?? tab.source;
    const result = this.recompileHandler(tab.passName, source);

    if (result.success) {
      this.hideError();
      tab.source = source;
    } else {
      this.showError(result.error || 'Compilation failed');
    }
  }

  private showError(message: string): void {
    if (this.errorDisplay) {
      this.errorDisplay.textContent = message;
      this.errorDisplay.style.display = 'block';
    }
  }

  private hideError(): void {
    if (this.errorDisplay) {
      this.errorDisplay.style.display = 'none';
    }
  }

  private async copyToClipboard(): Promise<void> {
    const tab = this.tabs[this.activeTabIndex];
    if (tab.kind !== 'code') return;

    // Get current source (modified or original)
    const source = this.editorInstance
      ? this.editorInstance.getSource()
      : (this.modifiedSources.get(tab.passName) ?? tab.source);

    try {
      await navigator.clipboard.writeText(source);
      // Show checkmark feedback
      const originalHTML = this.copyButton.innerHTML;
      this.copyButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
        </svg>
      `;
      this.copyButton.classList.add('copied');
      setTimeout(() => {
        this.copyButton.innerHTML = originalHTML;
        this.copyButton.classList.remove('copied');
      }, 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  private buildTabBar(): HTMLElement {
    // Create toolbar container (holds tabs + buttons)
    const toolbar = document.createElement('div');
    toolbar.className = 'tabbed-toolbar';

    // Create tab bar
    const tabBar = document.createElement('div');
    tabBar.className = 'tabbed-tab-bar';

    // Build tabs: Shader first, uniforms (if any), then code files, then textures
    this.tabs = [];

    // 1. Shader output tab
    this.tabs.push({ kind: 'shader', name: 'Shader' });

    // 2. Uniforms tab (if project has custom uniforms)
    if (Object.keys(this.project.uniforms).length > 0) {
      this.tabs.push({ kind: 'uniforms', name: 'Uniforms' });
    }

    // 3. Common (if exists)
    if (this.project.commonSource) {
      this.tabs.push({
        kind: 'code',
        name: 'common.glsl',
        passName: 'common',
        source: this.project.commonSource,
      });
    }

    // 4. Buffers in order
    const bufferOrder: ('BufferA' | 'BufferB' | 'BufferC' | 'BufferD')[] = [
      'BufferA', 'BufferB', 'BufferC', 'BufferD',
    ];
    for (const bufferName of bufferOrder) {
      const pass = this.project.passes[bufferName];
      if (pass) {
        this.tabs.push({
          kind: 'code',
          name: `${bufferName.toLowerCase()}.glsl`,
          passName: bufferName,
          source: pass.glslSource,
        });
      }
    }

    // 5. Image pass
    const imagePass = this.project.passes.Image;
    this.tabs.push({
      kind: 'code',
      name: 'image.glsl',
      passName: 'Image',
      source: imagePass.glslSource,
    });

    // 6. Textures (images)
    for (const texture of this.project.textures) {
      this.tabs.push({
        kind: 'image',
        name: texture.filename || texture.name,
        url: texture.source,
      });
    }

    // Function to show a specific tab
    const showTab = async (tabIndex: number) => {
      // Save current editor content before switching
      this.saveCurrentEditorContent();

      const tab = this.tabs[tabIndex];
      this.activeTabIndex = tabIndex;

      // Update active tab styling
      tabBar.querySelectorAll('.tabbed-tab-button').forEach((b, i) => {
        b.classList.toggle('active', i === tabIndex);
      });

      // Hide all content first (except canvas for uniforms overlay)
      this.canvasContainer.style.visibility = 'hidden';
      this.imageViewer.style.visibility = 'hidden';
      this.editorContainer.style.visibility = 'hidden';
      this.uniformsContainer.style.visibility = 'hidden';
      this.buttonContainer.style.display = 'none';

      // Destroy previous editor instance
      if (this.editorInstance) {
        this.editorInstance.destroy();
        this.editorInstance = null;
      }

      // Destroy previous uniform controls
      if (this.uniformControls) {
        this.uniformControls.destroy();
        this.uniformControls = null;
      }

      if (tab.kind === 'shader') {
        // Show shader canvas
        this.canvasContainer.style.visibility = 'visible';
      } else if (tab.kind === 'uniforms') {
        // Show both canvas AND uniforms overlay (semi-transparent)
        this.canvasContainer.style.visibility = 'visible';
        this.uniformsContainer.style.visibility = 'visible';

        // Load uniform controls
        this.uniformsContainer.innerHTML = '';
        try {
          const { UniformControls } = await import('../uniforms/UniformControls');
          this.uniformControls = new UniformControls({
            container: this.uniformsContainer,
            uniforms: this.project.uniforms,
            initialValues: this.uniformValues,
            onChange: (name: string, value: UniformValue) => {
              this.uniformValues[name] = value;
              if (this.uniformChangeHandler) {
                this.uniformChangeHandler(name, value);
              }
            },
          });
        } catch (err) {
          console.error('Failed to load uniform controls:', err);
          this.uniformsContainer.textContent = 'Failed to load uniform controls';
        }
      } else if (tab.kind === 'code') {
        // Show editor and buttons
        this.editorContainer.style.visibility = 'visible';
        this.buttonContainer.style.display = 'flex';

        // Get source (use modified if available)
        const source = this.modifiedSources.get(tab.passName) ?? tab.source;

        // Clear and load editor
        this.editorContainer.innerHTML = '';
        try {
          const { createEditor } = await import('../editor/prism-editor');
          this.editorInstance = createEditor(this.editorContainer, source, (newSource) => {
            this.modifiedSources.set(tab.passName, newSource);
          });
        } catch (err) {
          console.error('Failed to load editor:', err);
          // Fallback to textarea
          const textarea = document.createElement('textarea');
          textarea.className = 'tabbed-fallback-textarea';
          textarea.value = source;
          textarea.addEventListener('input', () => {
            this.modifiedSources.set(tab.passName, textarea.value);
          });
          this.editorContainer.appendChild(textarea);
        }
      } else {
        // Show image
        this.imageViewer.style.visibility = 'visible';

        const img = document.createElement('img');
        img.src = (tab as ImageTab).url;
        img.alt = tab.name;

        this.imageViewer.innerHTML = '';
        this.imageViewer.appendChild(img);
      }
    };

    // Create tab buttons
    this.tabs.forEach((tab, index) => {
      const tabButton = document.createElement('button');
      tabButton.className = 'tabbed-tab-button';
      if (tab.kind === 'shader') {
        tabButton.classList.add('shader-tab');
      } else if (tab.kind === 'uniforms') {
        tabButton.classList.add('uniforms-tab');
        // Use sliders icon instead of text
        tabButton.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="uniforms-icon">
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
        tabButton.title = 'Uniforms';
      } else if (tab.kind === 'image') {
        tabButton.classList.add('image-tab');
        tabButton.textContent = tab.name;
      } else {
        tabButton.textContent = tab.name;
      }
      if (index === 0) tabButton.classList.add('active');

      tabButton.addEventListener('click', () => showTab(index));

      tabBar.appendChild(tabButton);
    });

    // Assemble toolbar: tabs + buttons
    toolbar.appendChild(tabBar);
    toolbar.appendChild(this.buttonContainer);

    return toolbar;
  }
}
