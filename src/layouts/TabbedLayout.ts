/**
 * Tabbed Layout
 *
 * Single window with tabs to switch between shader output and code views.
 * First tab shows the live shader, remaining tabs show GLSL source files.
 */

import './tabbed.css';

import * as Prism from 'prismjs';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';

import { BaseLayout, LayoutOptions } from './types';
import { ShadertoyProject } from '../project/types';

export class TabbedLayout implements BaseLayout {
  private container: HTMLElement;
  private project: ShadertoyProject;
  private root: HTMLElement;
  private canvasContainer: HTMLElement;
  private contentArea: HTMLElement;
  private codeViewer: HTMLElement;
  private copyButton: HTMLElement;

  constructor(opts: LayoutOptions) {
    this.container = opts.container;
    this.project = opts.project;

    // Create root layout container
    this.root = document.createElement('div');
    this.root.className = 'layout-tabbed';

    // Create wrapper to constrain size (matches centered layout)
    const wrapper = document.createElement('div');
    wrapper.className = 'tabbed-wrapper';

    // Create content area (holds either canvas or code)
    this.contentArea = document.createElement('div');
    this.contentArea.className = 'tabbed-content';

    // Create canvas container (shown when Shader tab is active)
    this.canvasContainer = document.createElement('div');
    this.canvasContainer.className = 'tabbed-canvas-container';

    // Create code viewer (shown when code tabs are active)
    this.codeViewer = document.createElement('div');
    this.codeViewer.className = 'tabbed-code-viewer';
    this.codeViewer.style.visibility = 'hidden';

    // Create copy button
    this.copyButton = document.createElement('button');
    this.copyButton.className = 'tabbed-copy-button';
    this.copyButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2z" opacity="0.4"/>
        <path d="M2 5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H2zm0 1h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/>
      </svg>
    `;
    this.copyButton.title = 'Copy code to clipboard';
    this.copyButton.style.visibility = 'hidden';

    this.contentArea.appendChild(this.canvasContainer);
    this.contentArea.appendChild(this.codeViewer);
    this.contentArea.appendChild(this.copyButton);

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

  dispose(): void {
    this.container.innerHTML = '';
  }

  private buildTabBar(): HTMLElement {
    const tabBar = document.createElement('div');
    tabBar.className = 'tabbed-tab-bar';

    // Build tabs: Shader first, then code files
    const tabs: Array<{ name: string; isShader: boolean; source?: string }> = [];

    // 1. Shader output tab
    tabs.push({ name: 'Shader', isShader: true });

    // 2. Common (if exists)
    if (this.project.commonSource) {
      tabs.push({ name: 'common.glsl', isShader: false, source: this.project.commonSource });
    }

    // 3. Buffers in order
    const bufferOrder: ('BufferA' | 'BufferB' | 'BufferC' | 'BufferD')[] = [
      'BufferA', 'BufferB', 'BufferC', 'BufferD',
    ];
    for (const bufferName of bufferOrder) {
      const pass = this.project.passes[bufferName];
      if (pass) {
        tabs.push({
          name: `${bufferName.toLowerCase()}.glsl`,
          isShader: false,
          source: pass.glslSource,
        });
      }
    }

    // 4. Image last
    const imagePass = this.project.passes.Image;
    tabs.push({ name: 'image.glsl', isShader: false, source: imagePass.glslSource });

    // Track current source for copying
    let currentSource = '';

    // Icon SVGs
    const clipboardIcon = this.copyButton.innerHTML;
    const checkIcon = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
      </svg>
    `;

    // Copy button handler
    this.copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(currentSource);
        this.copyButton.innerHTML = checkIcon;
        this.copyButton.classList.add('copied');
        setTimeout(() => {
          this.copyButton.innerHTML = clipboardIcon;
          this.copyButton.classList.remove('copied');
        }, 1500);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    });

    // Function to show a specific tab
    const showTab = (tabIndex: number) => {
      const tab = tabs[tabIndex];

      // Update active tab styling
      tabBar.querySelectorAll('.tabbed-tab-button').forEach((b, i) => {
        b.classList.toggle('active', i === tabIndex);
      });

      if (tab.isShader) {
        // Show shader canvas
        this.canvasContainer.style.visibility = 'visible';
        this.codeViewer.style.visibility = 'hidden';
        this.copyButton.style.visibility = 'hidden';
      } else {
        // Show code
        this.canvasContainer.style.visibility = 'hidden';
        this.codeViewer.style.visibility = 'visible';
        this.copyButton.style.visibility = 'visible';

        currentSource = tab.source || '';

        // Create pre/code elements for Prism
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.className = 'language-cpp';
        code.textContent = tab.source || '';
        pre.appendChild(code);

        // Clear and append
        this.codeViewer.innerHTML = '';
        this.codeViewer.appendChild(pre);

        // Highlight with Prism
        Prism.highlightElement(code);
      }
    };

    // Create tab buttons
    tabs.forEach((tab, index) => {
      const tabButton = document.createElement('button');
      tabButton.className = 'tabbed-tab-button';
      if (tab.isShader) {
        tabButton.classList.add('shader-tab');
      }
      tabButton.textContent = tab.name;
      if (index === 0) tabButton.classList.add('active');

      tabButton.addEventListener('click', () => showTab(index));

      tabBar.appendChild(tabButton);
    });

    return tabBar;
  }
}
