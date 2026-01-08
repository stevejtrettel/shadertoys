/**
 * Tabbed Layout
 *
 * Single window with tabs to switch between shader output, editable code, and textures.
 * First tab shows the live shader, remaining tabs show editable GLSL source files and images.
 */

import './tabbed.css';

import { BaseLayout, LayoutOptions, RecompileHandler } from './types';
import { ShadertoyProject, PassName } from '../project/types';

type ShaderTab = { kind: 'shader'; name: string };
type CodeTab = { kind: 'code'; name: string; passName: 'common' | PassName; source: string };
type ImageTab = { kind: 'image'; name: string; url: string };
type Tab = ShaderTab | CodeTab | ImageTab;

export class TabbedLayout implements BaseLayout {
  private container: HTMLElement;
  private project: ShadertoyProject;
  private root: HTMLElement;
  private canvasContainer: HTMLElement;
  private contentArea: HTMLElement;
  private imageViewer: HTMLElement;

  private editorContainer: HTMLElement;
  private editorInstance: any = null;
  private recompileButton: HTMLElement;
  private errorDisplay: HTMLElement;
  private recompileHandler: RecompileHandler | null = null;
  private modifiedSources: Map<string, string> = new Map();
  private tabs: Tab[] = [];
  private activeTabIndex: number = 0;

  constructor(opts: LayoutOptions) {
    this.container = opts.container;
    this.project = opts.project;

    // Create root layout container
    this.root = document.createElement('div');
    this.root.className = 'layout-tabbed';

    // Create wrapper to constrain size (matches centered layout)
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
    this.recompileButton.style.visibility = 'hidden';
    this.recompileButton.addEventListener('click', () => this.recompile());
    this.contentArea.appendChild(this.recompileButton);

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

  dispose(): void {
    if (this.editorInstance) {
      this.editorInstance.destroy();
      this.editorInstance = null;
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

  private buildTabBar(): HTMLElement {
    const tabBar = document.createElement('div');
    tabBar.className = 'tabbed-tab-bar';

    // Build tabs: Shader first, then code files, then textures
    this.tabs = [];

    // 1. Shader output tab
    this.tabs.push({ kind: 'shader', name: 'Shader' });

    // 2. Common (if exists)
    if (this.project.commonSource) {
      this.tabs.push({
        kind: 'code',
        name: 'common.glsl',
        passName: 'common',
        source: this.project.commonSource,
      });
    }

    // 3. Buffers in order
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

    // 4. Image pass
    const imagePass = this.project.passes.Image;
    this.tabs.push({
      kind: 'code',
      name: 'image.glsl',
      passName: 'Image',
      source: imagePass.glslSource,
    });

    // 5. Textures (images)
    for (const texture of this.project.textures) {
      const filename = texture.source.split('/').pop() || texture.source;
      this.tabs.push({
        kind: 'image',
        name: filename,
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

      // Hide all content first
      this.canvasContainer.style.visibility = 'hidden';
      this.imageViewer.style.visibility = 'hidden';
      this.editorContainer.style.visibility = 'hidden';
      this.recompileButton.style.visibility = 'hidden';

      // Destroy previous editor instance
      if (this.editorInstance) {
        this.editorInstance.destroy();
        this.editorInstance = null;
      }

      if (tab.kind === 'shader') {
        // Show shader canvas
        this.canvasContainer.style.visibility = 'visible';
      } else if (tab.kind === 'code') {
        // Show editor
        this.editorContainer.style.visibility = 'visible';
        this.recompileButton.style.visibility = 'visible';

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
        img.src = tab.url;
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
      } else if (tab.kind === 'image') {
        tabButton.classList.add('image-tab');
      }
      tabButton.textContent = tab.name;
      if (index === 0) tabButton.classList.add('active');

      tabButton.addEventListener('click', () => showTab(index));

      tabBar.appendChild(tabButton);
    });

    return tabBar;
  }
}
