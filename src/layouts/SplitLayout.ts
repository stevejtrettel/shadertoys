/**
 * Split Layout
 *
 * Shader on left, code viewer on right with syntax highlighting.
 * Ideal for teaching and presentations where viewers need to see the code.
 *
 * When editor mode is enabled (project.editor = true), uses CodeMirror
 * for live code editing with a recompile button.
 */

import './split.css';

import * as Prism from 'prismjs';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';

import { BaseLayout, LayoutOptions, RecompileHandler } from './types';
import { ShadertoyProject } from '../project/types';

type CodeTab = { kind: 'code'; name: string; source: string };
type ImageTab = { kind: 'image'; name: string; url: string };
type Tab = CodeTab | ImageTab;

export class SplitLayout implements BaseLayout {
  private container: HTMLElement;
  private project: ShadertoyProject;
  private root: HTMLElement;
  private canvasContainer: HTMLElement;
  private codePanel: HTMLElement;

  // Editor mode support (only used when __EDITOR_ENABLED__)
  private editorPanel: any = null;
  private recompileHandler: RecompileHandler | null = null;

  constructor(opts: LayoutOptions) {
    this.container = opts.container;
    this.project = opts.project;

    // Create root layout container
    this.root = document.createElement('div');
    this.root.className = 'layout-split';

    // Create canvas container (left side)
    this.canvasContainer = document.createElement('div');
    this.canvasContainer.className = 'canvas-container';

    // Create code panel (right side)
    this.codePanel = document.createElement('div');
    this.codePanel.className = 'code-panel';

    // Build code panel based on editor mode
    // __EDITOR_ENABLED__ is a compile-time flag - when false, this entire branch is tree-shaken
    if (__EDITOR_ENABLED__ && this.project.editor) {
      this.buildEditorPanel();
    } else {
      this.buildCodePanel();
    }

    // Assemble and append to DOM
    this.root.appendChild(this.canvasContainer);
    this.root.appendChild(this.codePanel);
    this.container.appendChild(this.root);
  }

  getCanvasContainer(): HTMLElement {
    return this.canvasContainer;
  }

  setRecompileHandler(handler: RecompileHandler): void {
    this.recompileHandler = handler;
    if (this.editorPanel) {
      this.editorPanel.setRecompileHandler(handler);
    }
  }

  dispose(): void {
    if (this.editorPanel) {
      this.editorPanel.dispose();
      this.editorPanel = null;
    }
    this.container.innerHTML = '';
  }

  /**
   * Build editor panel with CodeMirror (dynamically loaded).
   */
  private async buildEditorPanel(): Promise<void> {
    try {
      const { EditorPanel } = await import('../editor/EditorPanel');
      this.editorPanel = new EditorPanel(this.codePanel, this.project);
      if (this.recompileHandler) {
        this.editorPanel.setRecompileHandler(this.recompileHandler);
      }
    } catch (err) {
      console.error('Failed to load editor panel:', err);
      // Fallback to static code viewer
      this.buildCodePanel();
    }
  }

  /**
   * Build the code panel with tabs for each shader pass and texture.
   * Uses Prism.js with C++ syntax highlighting (lightweight, works well for GLSL).
   */
  private buildCodePanel(): void {
    // Build tabs in order: common, BufferA-D, Image, textures
    const tabs: Tab[] = [];

    // 1. Common first (if exists)
    if (this.project.commonSource) {
      tabs.push({ kind: 'code', name: 'common.glsl', source: this.project.commonSource });
    }

    // 2. Buffers in order (A, B, C, D)
    const bufferOrder: ('BufferA' | 'BufferB' | 'BufferC' | 'BufferD')[] = [
      'BufferA',
      'BufferB',
      'BufferC',
      'BufferD',
    ];
    for (const bufferName of bufferOrder) {
      const pass = this.project.passes[bufferName];
      if (pass) {
        tabs.push({
          kind: 'code',
          name: `${bufferName.toLowerCase()}.glsl`,
          source: pass.glslSource,
        });
      }
    }

    // 3. Image pass
    const imagePass = this.project.passes.Image;
    tabs.push({ kind: 'code', name: 'image.glsl', source: imagePass.glslSource });

    // 4. Textures (images)
    for (const texture of this.project.textures) {
      // Extract filename from source path
      const filename = texture.source.split('/').pop() || texture.source;
      tabs.push({
        kind: 'image',
        name: filename,
        url: texture.source,
      });
    }

    // Create tab bar
    const tabBar = document.createElement('div');
    tabBar.className = 'tab-bar';

    // Create content viewer container
    const contentViewer = document.createElement('div');
    contentViewer.className = 'code-viewer';

    // Create copy button with clipboard icon
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2z" opacity="0.4"/>
        <path d="M2 5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H2zm0 1h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/>
      </svg>
    `;
    copyButton.title = 'Copy code to clipboard';

    // Track current source for copying
    let currentSource = '';

    // Icon SVGs
    const clipboardIcon = copyButton.innerHTML;
    const checkIcon = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
      </svg>
    `;

    // Function to show a specific tab
    const showTab = (tabIndex: number) => {
      const tab = tabs[tabIndex];

      // Clear viewer
      contentViewer.innerHTML = '';

      if (tab.kind === 'code') {
        // Show code with syntax highlighting
        currentSource = tab.source;
        copyButton.style.display = '';

        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.className = 'language-cpp';
        code.textContent = tab.source;
        pre.appendChild(code);
        contentViewer.appendChild(pre);

        // Highlight with Prism
        Prism.highlightElement(code);
      } else {
        // Show image
        currentSource = '';
        copyButton.style.display = 'none';

        const imgContainer = document.createElement('div');
        imgContainer.className = 'image-viewer';

        const img = document.createElement('img');
        img.src = tab.url;
        img.alt = tab.name;

        imgContainer.appendChild(img);
        contentViewer.appendChild(imgContainer);
      }
    };

    // Copy button handler
    copyButton.addEventListener('click', async () => {
      if (!currentSource) return;
      try {
        await navigator.clipboard.writeText(currentSource);
        // Visual feedback - show checkmark
        copyButton.innerHTML = checkIcon;
        copyButton.classList.add('copied');
        setTimeout(() => {
          copyButton.innerHTML = clipboardIcon;
          copyButton.classList.remove('copied');
        }, 1500);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    });

    // Create tab buttons
    tabs.forEach((tab, index) => {
      const tabButton = document.createElement('button');
      tabButton.className = 'tab-button';
      if (tab.kind === 'image') {
        tabButton.classList.add('image-tab');
      }
      tabButton.textContent = tab.name;
      if (index === 0) tabButton.classList.add('active');

      tabButton.addEventListener('click', () => {
        // Update active tab
        tabBar
          .querySelectorAll('.tab-button')
          .forEach((b) => b.classList.remove('active'));
        tabButton.classList.add('active');

        // Update content viewer
        showTab(index);
      });

      tabBar.appendChild(tabButton);
    });

    // Assemble code panel
    this.codePanel.appendChild(tabBar);
    this.codePanel.appendChild(copyButton);
    this.codePanel.appendChild(contentViewer);

    // Show first tab
    if (tabs.length > 0) {
      showTab(0);
    }
  }
}
