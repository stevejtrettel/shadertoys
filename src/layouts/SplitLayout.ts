/**
 * Split Layout
 *
 * Shader on left, code viewer on right with syntax highlighting.
 * Ideal for teaching and presentations where viewers need to see the code.
 */

import './split.css';

import * as Prism from 'prismjs';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';

import { BaseLayout, LayoutOptions } from './types';
import { ShadertoyProject } from '../project/types';

export class SplitLayout implements BaseLayout {
  private container: HTMLElement;
  private project: ShadertoyProject;
  private root: HTMLElement;
  private canvasContainer: HTMLElement;
  private codePanel: HTMLElement;

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
    this.buildCodePanel();

    // Assemble and append to DOM
    this.root.appendChild(this.canvasContainer);
    this.root.appendChild(this.codePanel);
    this.container.appendChild(this.root);
  }

  getCanvasContainer(): HTMLElement {
    return this.canvasContainer;
  }

  dispose(): void {
    this.container.innerHTML = '';
  }

  /**
   * Build the code panel with tabs for each shader pass.
   * Uses Prism.js with C++ syntax highlighting (lightweight, works well for GLSL).
   */
  private buildCodePanel(): void {
    // Build tabs in order: common, BufferA-D, Image
    const tabs: Array<{ name: string; source: string }> = [];

    // 1. Common first (if exists)
    if (this.project.commonSource) {
      tabs.push({ name: 'common.glsl', source: this.project.commonSource });
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
          name: `${bufferName.toLowerCase()}.glsl`,
          source: pass.glslSource,
        });
      }
    }

    // 3. Image last
    const imagePass = this.project.passes.Image;
    tabs.push({ name: 'image.glsl', source: imagePass.glslSource });

    // Create tab bar
    const tabBar = document.createElement('div');
    tabBar.className = 'tab-bar';

    // Create code viewer container
    const codeViewer = document.createElement('div');
    codeViewer.className = 'code-viewer';

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
      currentSource = tab.source;

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

    // Copy button handler
    copyButton.addEventListener('click', async () => {
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
      tabButton.textContent = tab.name;
      if (index === 0) tabButton.classList.add('active');

      tabButton.addEventListener('click', () => {
        // Update active tab
        tabBar
          .querySelectorAll('.tab-button')
          .forEach((b) => b.classList.remove('active'));
        tabButton.classList.add('active');

        // Update code viewer
        showTab(index);
      });

      tabBar.appendChild(tabButton);
    });

    // Assemble code panel
    this.codePanel.appendChild(tabBar);
    this.codePanel.appendChild(copyButton);
    this.codePanel.appendChild(codeViewer);

    // Show first tab
    if (tabs.length > 0) {
      showTab(0);
    }
  }
}
