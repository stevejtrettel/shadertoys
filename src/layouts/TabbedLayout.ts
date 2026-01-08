/**
 * Tabbed Layout
 *
 * Single window with tabs to switch between shader output, code views, and textures.
 * First tab shows the live shader, remaining tabs show GLSL source files and images.
 */

import './tabbed.css';

import * as Prism from 'prismjs';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';

import { BaseLayout, LayoutOptions } from './types';
import { ShadertoyProject } from '../project/types';

type ShaderTab = { kind: 'shader'; name: string };
type CodeTab = { kind: 'code'; name: string; source: string };
type ImageTab = { kind: 'image'; name: string; url: string };
type Tab = ShaderTab | CodeTab | ImageTab;

export class TabbedLayout implements BaseLayout {
  private container: HTMLElement;
  private project: ShadertoyProject;
  private root: HTMLElement;
  private canvasContainer: HTMLElement;
  private contentArea: HTMLElement;
  private codeViewer: HTMLElement;
  private imageViewer: HTMLElement;
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

    // Create content area (holds either canvas, code, or image)
    this.contentArea = document.createElement('div');
    this.contentArea.className = 'tabbed-content';

    // Create canvas container (shown when Shader tab is active)
    this.canvasContainer = document.createElement('div');
    this.canvasContainer.className = 'tabbed-canvas-container';

    // Create code viewer (shown when code tabs are active)
    this.codeViewer = document.createElement('div');
    this.codeViewer.className = 'tabbed-code-viewer';
    this.codeViewer.style.visibility = 'hidden';

    // Create image viewer (shown when image tabs are active)
    this.imageViewer = document.createElement('div');
    this.imageViewer.className = 'tabbed-image-viewer';
    this.imageViewer.style.visibility = 'hidden';

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
    this.contentArea.appendChild(this.imageViewer);
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

    // Build tabs: Shader first, then code files, then textures
    const tabs: Tab[] = [];

    // 1. Shader output tab
    tabs.push({ kind: 'shader', name: 'Shader' });

    // 2. Common (if exists)
    if (this.project.commonSource) {
      tabs.push({ kind: 'code', name: 'common.glsl', source: this.project.commonSource });
    }

    // 3. Buffers in order
    const bufferOrder: ('BufferA' | 'BufferB' | 'BufferC' | 'BufferD')[] = [
      'BufferA', 'BufferB', 'BufferC', 'BufferD',
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

    // 4. Image pass
    const imagePass = this.project.passes.Image;
    tabs.push({ kind: 'code', name: 'image.glsl', source: imagePass.glslSource });

    // 5. Textures (images)
    for (const texture of this.project.textures) {
      const filename = texture.source.split('/').pop() || texture.source;
      tabs.push({
        kind: 'image',
        name: filename,
        url: texture.source,
      });
    }

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
      if (!currentSource) return;
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

      // Hide all content first
      this.canvasContainer.style.visibility = 'hidden';
      this.codeViewer.style.visibility = 'hidden';
      this.imageViewer.style.visibility = 'hidden';
      this.copyButton.style.visibility = 'hidden';

      if (tab.kind === 'shader') {
        // Show shader canvas
        this.canvasContainer.style.visibility = 'visible';
      } else if (tab.kind === 'code') {
        // Show code
        this.codeViewer.style.visibility = 'visible';
        this.copyButton.style.visibility = 'visible';

        currentSource = tab.source;
        const lines = currentSource.split('\n');

        // Create pre element
        const pre = document.createElement('pre');

        // Line numbers column
        const lineNumbers = document.createElement('div');
        lineNumbers.className = 'tabbed-line-numbers';
        lineNumbers.innerHTML = lines.map((_, i) => i + 1).join('\n');

        // Code content column
        const codeContent = document.createElement('div');
        codeContent.className = 'tabbed-code-content';
        const code = document.createElement('code');
        code.className = 'language-cpp';
        code.textContent = currentSource;
        codeContent.appendChild(code);

        pre.appendChild(lineNumbers);
        pre.appendChild(codeContent);

        // Clear and append
        this.codeViewer.innerHTML = '';
        this.codeViewer.appendChild(pre);

        // Highlight with Prism
        Prism.highlightElement(code);
      } else {
        // Show image
        currentSource = '';
        this.imageViewer.style.visibility = 'visible';

        const img = document.createElement('img');
        img.src = tab.url;
        img.alt = tab.name;

        this.imageViewer.innerHTML = '';
        this.imageViewer.appendChild(img);
      }
    };

    // Create tab buttons
    tabs.forEach((tab, index) => {
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
