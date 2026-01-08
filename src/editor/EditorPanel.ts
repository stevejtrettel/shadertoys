/**
 * Editor Panel - Shared component for code editing in layouts
 *
 * Provides:
 * - CodeMirror editor (dynamically loaded)
 * - Recompile button with keyboard shortcut
 * - Error display
 * - Tab management for multiple passes
 */

import { ShadertoyProject, PassName } from '../project/types';
import { RecompileHandler } from '../layouts/types';

import './editor-panel.css';

type CodeTab = { kind: 'code'; name: string; passName: 'common' | PassName; source: string };
type ImageTab = { kind: 'image'; name: string; url: string };
type Tab = CodeTab | ImageTab;

interface EditorInstance {
  view: any;
  getSource: () => string;
  setSource: (source: string) => void;
  destroy: () => void;
}

export class EditorPanel {
  private container: HTMLElement;
  private project: ShadertoyProject;
  private recompileHandler: RecompileHandler | null = null;

  private tabBar: HTMLElement;
  private contentArea: HTMLElement;
  private recompileButton: HTMLElement;
  private errorDisplay: HTMLElement;

  private tabs: Tab[] = [];
  private activeTabIndex: number = 0;

  // Editor instance (null if not in editor mode or viewing image)
  private editorInstance: EditorInstance | null = null;

  // Track modified sources (passName -> modified source)
  private modifiedSources: Map<string, string> = new Map();

  constructor(container: HTMLElement, project: ShadertoyProject) {
    this.container = container;
    this.project = project;

    // Build tabs
    this.buildTabs();

    // Create tab bar
    this.tabBar = document.createElement('div');
    this.tabBar.className = 'editor-tab-bar';
    this.buildTabBar();

    // Create content area
    this.contentArea = document.createElement('div');
    this.contentArea.className = 'editor-content-area';

    // Create recompile button
    this.recompileButton = document.createElement('button');
    this.recompileButton.className = 'editor-recompile-button';
    this.recompileButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4 3v10l8-5-8-5z"/>
      </svg>
      Recompile
    `;
    this.recompileButton.title = 'Recompile shader (Ctrl+Enter)';
    this.recompileButton.addEventListener('click', () => this.recompile());

    // Create error display
    this.errorDisplay = document.createElement('div');
    this.errorDisplay.className = 'editor-error-display';
    this.errorDisplay.style.display = 'none';

    // Assemble panel
    const toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';
    toolbar.appendChild(this.tabBar);
    toolbar.appendChild(this.recompileButton);

    this.container.appendChild(toolbar);
    this.container.appendChild(this.contentArea);
    this.container.appendChild(this.errorDisplay);

    // Set up keyboard shortcut
    this.setupKeyboardShortcut();

    // Load editor for first tab
    this.showTab(0);
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

  private buildTabs(): void {
    this.tabs = [];

    // 1. Common first (if exists)
    if (this.project.commonSource) {
      this.tabs.push({
        kind: 'code',
        name: 'common.glsl',
        passName: 'common',
        source: this.project.commonSource,
      });
    }

    // 2. Buffers in order (A, B, C, D)
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

    // 3. Image pass
    const imagePass = this.project.passes.Image;
    this.tabs.push({
      kind: 'code',
      name: 'image.glsl',
      passName: 'Image',
      source: imagePass.glslSource,
    });

    // 4. Textures (images) - not editable
    for (const texture of this.project.textures) {
      const filename = texture.source.split('/').pop() || texture.source;
      this.tabs.push({
        kind: 'image',
        name: filename,
        url: texture.source,
      });
    }
  }

  private buildTabBar(): void {
    this.tabBar.innerHTML = '';

    this.tabs.forEach((tab, index) => {
      const tabButton = document.createElement('button');
      tabButton.className = 'editor-tab-button';
      if (tab.kind === 'image') {
        tabButton.classList.add('image-tab');
      }
      tabButton.textContent = tab.name;
      if (index === this.activeTabIndex) {
        tabButton.classList.add('active');
      }

      tabButton.addEventListener('click', () => this.showTab(index));
      this.tabBar.appendChild(tabButton);
    });
  }

  private async showTab(index: number): Promise<void> {
    // Save current editor content before switching
    this.saveCurrentEditorContent();

    this.activeTabIndex = index;
    const tab = this.tabs[index];

    // Update tab bar active state
    this.tabBar.querySelectorAll('.editor-tab-button').forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
    });

    // Clear content area
    this.contentArea.innerHTML = '';

    // Destroy previous editor instance
    if (this.editorInstance) {
      this.editorInstance.destroy();
      this.editorInstance = null;
    }

    if (tab.kind === 'code') {
      // Show recompile button
      this.recompileButton.style.display = '';

      // Get source (use modified if available, otherwise original)
      const source = this.modifiedSources.get(tab.passName) ?? tab.source;

      // Create editor container
      const editorContainer = document.createElement('div');
      editorContainer.className = 'editor-codemirror-container';
      this.contentArea.appendChild(editorContainer);

      // Dynamically load CodeMirror and create editor
      try {
        const { createEditor } = await import('./codemirror');
        this.editorInstance = createEditor(editorContainer, source, (newSource) => {
          // Track modifications
          this.modifiedSources.set(tab.passName, newSource);
        });
      } catch (err) {
        console.error('Failed to load CodeMirror:', err);
        // Fallback to textarea
        const textarea = document.createElement('textarea');
        textarea.className = 'editor-fallback-textarea';
        textarea.value = source;
        textarea.addEventListener('input', () => {
          this.modifiedSources.set(tab.passName, textarea.value);
        });
        editorContainer.appendChild(textarea);
      }
    } else {
      // Hide recompile button for image tabs
      this.recompileButton.style.display = 'none';

      // Show image
      const imgContainer = document.createElement('div');
      imgContainer.className = 'editor-image-viewer';

      const img = document.createElement('img');
      img.src = tab.url;
      img.alt = tab.name;

      imgContainer.appendChild(img);
      this.contentArea.appendChild(imgContainer);
    }
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

    // Save current content first
    this.saveCurrentEditorContent();

    const tab = this.tabs[this.activeTabIndex];
    if (tab.kind !== 'code') {
      return;
    }

    const source = this.modifiedSources.get(tab.passName) ?? tab.source;
    const result = this.recompileHandler(tab.passName, source);

    if (result.success) {
      this.hideError();
      // Update the original source in the tab
      tab.source = source;
    } else {
      this.showError(result.error || 'Compilation failed');
    }
  }

  private showError(message: string): void {
    this.errorDisplay.textContent = message;
    this.errorDisplay.style.display = 'block';
  }

  private hideError(): void {
    this.errorDisplay.style.display = 'none';
  }

  private setupKeyboardShortcut(): void {
    // Listen for Ctrl+Enter / Cmd+Enter
    this.container.addEventListener('keydown', (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.recompile();
      }
    });
  }
}
