/**
 * App Layer - Browser Runtime Coordinator
 *
 * Responsibilities:
 *  - Create and manage canvas
 *  - Initialize ShadertoyEngine
 *  - Run animation loop (requestAnimationFrame)
 *  - Handle resize and mouse events
 *  - Present Image pass output to screen
 */

import './app.css';

import { ShadertoyEngine } from '../engine/ShadertoyEngine';
import { AppOptions, MouseState } from './types';

export class App {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private engine: ShadertoyEngine;

  private pixelRatio: number;
  private animationId: number | null = null;
  private startTime: number = 0;

  // Mouse state for iMouse uniform
  private mouse: MouseState = [0, 0, -1, -1];

  // FPS tracking
  private fpsDisplay: HTMLElement;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private currentFps: number = 0;

  // Playback controls
  private controlsContainer: HTMLElement | null = null;
  private playPauseButton: HTMLElement | null = null;
  private isPaused: boolean = false;

  // Error overlay
  private errorOverlay: HTMLElement | null = null;

  // Resize observer
  private resizeObserver: ResizeObserver;

  constructor(opts: AppOptions) {
    this.container = opts.container;
    this.pixelRatio = opts.pixelRatio ?? window.devicePixelRatio;

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.container.appendChild(this.canvas);

    // Create FPS display overlay
    this.fpsDisplay = document.createElement('div');
    this.fpsDisplay.className = 'fps-counter';
    this.fpsDisplay.textContent = '0 FPS';
    this.container.appendChild(this.fpsDisplay);

    // Create playback controls if enabled
    if (opts.project.controls) {
      this.createControls();
    }

    // Get WebGL2 context
    const gl = this.canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    });

    if (!gl) {
      throw new Error('WebGL2 not supported');
    }

    this.gl = gl;

    // Initialize canvas size
    this.updateCanvasSize();

    // Create engine
    this.engine = new ShadertoyEngine({
      gl: this.gl,
      project: opts.project,
    });

    // Check for compilation errors and show overlay if needed
    if (this.engine.hasErrors()) {
      this.showErrorOverlay(this.engine.getCompilationErrors());
    }

    // Set up resize observer
    this.resizeObserver = new ResizeObserver(() => {
      this.updateCanvasSize();
      this.engine.resize(this.canvas.width, this.canvas.height);
    });
    this.resizeObserver.observe(this.container);

    // Set up mouse tracking
    this.setupMouseTracking();

    // Set up keyboard shortcuts if controls are enabled
    if (opts.project.controls) {
      this.setupKeyboardShortcuts();
    }
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  /**
   * Check if there were any shader compilation errors.
   * Returns true if the engine has errors and should not be started.
   */
  hasErrors(): boolean {
    return this.engine.hasErrors();
  }

  /**
   * Start the animation loop.
   */
  start(): void {
    if (this.animationId !== null) {
      return; // Already running
    }

    this.startTime = performance.now() / 1000;
    this.animate(this.startTime);
  }

  /**
   * Stop the animation loop.
   */
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Clean up all resources.
   */
  dispose(): void {
    this.stop();
    this.resizeObserver.disconnect();
    this.engine.dispose();
    this.container.removeChild(this.canvas);
    this.container.removeChild(this.fpsDisplay);
  }

  // ===========================================================================
  // Animation Loop
  // ===========================================================================

  private animate = (currentTimeMs: number): void => {
    // Schedule next frame first (even if paused)
    this.animationId = requestAnimationFrame(this.animate);

    // Skip rendering if paused
    if (this.isPaused) {
      return;
    }

    const currentTimeSec = currentTimeMs / 1000;
    const elapsedTime = currentTimeSec - this.startTime;

    // Update FPS counter
    this.updateFps(currentTimeSec);

    // Run engine step
    this.engine.step(elapsedTime, this.mouse);

    // Present Image pass output to screen
    this.presentToScreen();
  };

  /**
   * Update FPS counter.
   * Updates the display roughly once per second.
   */
  private updateFps(currentTimeSec: number): void {
    this.frameCount++;

    // Update FPS display once per second
    if (currentTimeSec - this.lastFpsUpdate >= 1.0) {
      this.currentFps = this.frameCount / (currentTimeSec - this.lastFpsUpdate);
      this.fpsDisplay.textContent = `${Math.round(this.currentFps)} FPS`;
      this.frameCount = 0;
      this.lastFpsUpdate = currentTimeSec;
    }
  }

  /**
   * Present the Image pass output to the screen.
   *
   * Since Image is the final pass and we execute all passes to their FBOs,
   * we need to blit the Image pass output to the default framebuffer.
   */
  private presentToScreen(): void {
    const gl = this.gl;

    // Find the Image pass
    const imagePasses = (this.engine as any)._passes.filter((p: any) => p.name === 'Image');
    if (imagePasses.length === 0) {
      console.warn('No Image pass found');
      return;
    }

    const imagePass = imagePasses[0];

    // Bind default framebuffer (screen)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // Clear screen
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Use a simple blit shader to display the texture
    // For now, we'll use a simple approach: bind the Image pass FBO as read buffer
    // and blit to the default framebuffer

    // Alternative: use glBindFramebuffer READ/DRAW and blitFramebuffer
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, imagePass.framebuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);

    gl.blitFramebuffer(
      0, 0, this.canvas.width, this.canvas.height,  // src
      0, 0, this.canvas.width, this.canvas.height,  // dst
      gl.COLOR_BUFFER_BIT,
      gl.NEAREST
    );

    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
  }

  // ===========================================================================
  // Resize Handling
  // ===========================================================================

  private updateCanvasSize(): void {
    const rect = this.container.getBoundingClientRect();
    const width = Math.floor(rect.width * this.pixelRatio);
    const height = Math.floor(rect.height * this.pixelRatio);

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  // ===========================================================================
  // Mouse Tracking
  // ===========================================================================

  private setupMouseTracking(): void {
    const updateMouse = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * this.pixelRatio;
      const y = (rect.height - (e.clientY - rect.top)) * this.pixelRatio; // Flip Y

      this.mouse[0] = x;
      this.mouse[1] = y;
    };

    const handleClick = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * this.pixelRatio;
      const y = (rect.height - (e.clientY - rect.top)) * this.pixelRatio; // Flip Y

      this.mouse[2] = x;
      this.mouse[3] = y;
    };

    this.canvas.addEventListener('mousemove', updateMouse);
    this.canvas.addEventListener('click', handleClick);
  }

  // ===========================================================================
  // Playback Controls
  // ===========================================================================

  /**
   * Create playback control buttons (play/pause and reset).
   */
  private createControls(): void {
    // Create container
    this.controlsContainer = document.createElement('div');
    this.controlsContainer.className = 'playback-controls';

    // Play/Pause button (starts showing pause icon since we're playing)
    this.playPauseButton = document.createElement('button');
    this.playPauseButton.className = 'control-button';
    this.playPauseButton.title = 'Play/Pause (Space)';
    this.playPauseButton.innerHTML = `
      <svg viewBox="0 0 16 16">
        <path d="M5 3h2v10H5V3zm4 0h2v10H9V3z"/>
      </svg>
    `;
    this.playPauseButton.addEventListener('click', () => this.togglePlayPause());

    // Reset button
    const resetButton = document.createElement('button');
    resetButton.className = 'control-button';
    resetButton.title = 'Reset (R)';
    resetButton.innerHTML = `
      <svg viewBox="0 0 16 16">
        <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
      </svg>
    `;
    resetButton.addEventListener('click', () => this.reset());

    // Add to container
    this.controlsContainer.appendChild(this.playPauseButton);
    this.controlsContainer.appendChild(resetButton);
    this.container.appendChild(this.controlsContainer);
  }

  /**
   * Set up keyboard shortcuts for playback control.
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      // Space - Play/Pause
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        this.togglePlayPause();
      }

      // R - Reset
      if (e.code === 'KeyR' && !e.repeat) {
        e.preventDefault();
        this.reset();
      }
    });
  }

  /**
   * Toggle between play and pause states.
   */
  private togglePlayPause(): void {
    this.isPaused = !this.isPaused;
    this.updatePlayPauseButton();
  }

  /**
   * Reset the shader to frame 0.
   */
  private reset(): void {
    this.startTime = performance.now() / 1000;
    this.frameCount = 0;
    this.lastFpsUpdate = 0;
  }

  /**
   * Update play/pause button icon based on current state.
   */
  private updatePlayPauseButton(): void {
    if (!this.playPauseButton) return;

    if (this.isPaused) {
      // Show play icon
      this.playPauseButton.innerHTML = `
        <svg viewBox="0 0 16 16">
          <path d="M4 3v10l8-5-8-5z"/>
        </svg>
      `;
    } else {
      // Show pause icon
      this.playPauseButton.innerHTML = `
        <svg viewBox="0 0 16 16">
          <path d="M5 3h2v10H5V3zm4 0h2v10H9V3z"/>
        </svg>
      `;
    }
  }

  // ===========================================================================
  // Error Handling
  // ===========================================================================

  /**
   * Display shader compilation errors in an overlay.
   */
  private showErrorOverlay(errors: Array<{
    passName: string;
    error: string;
    source: string;
    isFromCommon: boolean;
    originalLine: number | null;
  }>): void {
    // Create overlay if it doesn't exist
    if (!this.errorOverlay) {
      this.errorOverlay = document.createElement('div');
      this.errorOverlay.className = 'shader-error-overlay';
      this.container.appendChild(this.errorOverlay);
    }

    // Group errors: separate common.glsl errors from pass-specific errors
    const commonErrors = errors.filter(e => e.isFromCommon);
    const passErrors = errors.filter(e => !e.isFromCommon);

    // Deduplicate common errors (same error reported for multiple passes)
    const uniqueCommonErrors = commonErrors.length > 0 ? [commonErrors[0]] : [];

    // Combine: show common errors first, then pass-specific errors
    const allErrors = [...uniqueCommonErrors, ...passErrors];

    // Parse and format errors with source context
    const formattedErrors = allErrors.map(({passName, error, source, isFromCommon, originalLine}) => {
      // Extract the actual GLSL error from the thrown error message
      const glslError = error.replace('Shader compilation failed:\n', '');

      // For common errors, adjust line number in error message
      let adjustedError = glslError;
      if (isFromCommon && originalLine !== null) {
        adjustedError = glslError.replace(/Line \d+:/, `Line ${originalLine}:`);
        adjustedError = adjustedError.replace(/ERROR:\s*\d+:(\d+):/, `ERROR: 0:${originalLine}:`);
      }

      return {
        passName: isFromCommon ? 'common.glsl' : passName,
        error: this.parseShaderError(adjustedError),
        codeContext: isFromCommon
          ? this.extractCodeContextFromCommon(originalLine!)
          : this.extractCodeContext(adjustedError, source),
      };
    });

    // Build error HTML
    const errorHTML = formattedErrors.map(({passName, error, codeContext}) => `
      <div class="error-section">
        <div class="error-pass-name">${passName}</div>
        <pre class="error-content">${this.escapeHTML(error)}</pre>
        ${codeContext ? `<pre class="error-code-context">${codeContext}</pre>` : ''}
      </div>
    `).join('');

    this.errorOverlay.innerHTML = `
      <div class="error-overlay-content">
        <div class="error-header">
          <span class="error-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-bottom;">
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM3.5 7.5a.75.75 0 0 0 0 1.5h9a.75.75 0 0 0 0-1.5h-9z"/>
            </svg>
            Shader Compilation Failed
          </span>
          <button class="error-close" title="Dismiss">×</button>
        </div>
        <div class="error-body">
          ${errorHTML}
        </div>
      </div>
    `;

    // Add close button handler
    const closeButton = this.errorOverlay.querySelector('.error-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.hideErrorOverlay());
    }
  }

  /**
   * Parse and improve WebGL shader error messages.
   */
  private parseShaderError(error: string): string {
    // WebGL errors typically look like: "ERROR: 0:45: 'texure' : no matching overloaded function found"
    // Let's make them more readable by highlighting line numbers and adding context

    return error.split('\n').map(line => {
      // Match pattern: ERROR: 0:lineNumber: message
      const match = line.match(/^ERROR:\s*(\d+):(\d+):\s*(.+)$/);
      if (match) {
        const [, , lineNum, message] = match;
        return `Line ${lineNum}: ${message}`;
      }
      return line;
    }).join('\n');
  }

  /**
   * Extract code context around error line (±3 lines).
   * Returns HTML with the error line highlighted.
   */
  private extractCodeContext(error: string, source: string): string | null {
    // Extract line number from error
    const match = error.match(/ERROR:\s*\d+:(\d+):/);
    if (!match) return null;

    const errorLine = parseInt(match[1], 10);
    const lines = source.split('\n');

    // Extract context (3 lines before and after)
    const contextRange = 3;
    const startLine = Math.max(0, errorLine - contextRange - 1);
    const endLine = Math.min(lines.length, errorLine + contextRange);

    const contextLines = lines.slice(startLine, endLine);

    // Build HTML with line numbers and highlighting
    const html = contextLines.map((line, idx) => {
      const lineNum = startLine + idx + 1;
      const isErrorLine = lineNum === errorLine;
      const lineNumPadded = String(lineNum).padStart(4, ' ');
      const escapedLine = this.escapeHTML(line);

      if (isErrorLine) {
        return `<span class="error-line-highlight">${lineNumPadded} │ ${escapedLine}</span>`;
      } else {
        return `<span class="context-line">${lineNumPadded} │ ${escapedLine}</span>`;
      }
    }).join(''); // No newline - spans already have display:block

    return html;
  }

  /**
   * Extract code context from common.glsl file.
   * Similar to extractCodeContext but uses the original common source.
   */
  private extractCodeContextFromCommon(errorLine: number): string | null {
    const commonSource = this.engine.project.commonSource;
    if (!commonSource) return null;

    const lines = commonSource.split('\n');

    // Extract context (3 lines before and after)
    const contextRange = 3;
    const startLine = Math.max(0, errorLine - contextRange - 1);
    const endLine = Math.min(lines.length, errorLine + contextRange);

    const contextLines = lines.slice(startLine, endLine);

    // Build HTML with line numbers and highlighting
    const html = contextLines.map((line, idx) => {
      const lineNum = startLine + idx + 1;
      const isErrorLine = lineNum === errorLine;
      const lineNumPadded = String(lineNum).padStart(4, ' ');
      const escapedLine = this.escapeHTML(line);

      if (isErrorLine) {
        return `<span class="error-line-highlight">${lineNumPadded} │ ${escapedLine}</span>`;
      } else {
        return `<span class="context-line">${lineNumPadded} │ ${escapedLine}</span>`;
      }
    }).join(''); // No newline - spans already have display:block

    return html;
  }

  /**
   * Escape HTML to prevent XSS.
   */
  private escapeHTML(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Hide the error overlay.
   */
  private hideErrorOverlay(): void {
    if (this.errorOverlay) {
      this.errorOverlay.remove();
      this.errorOverlay = null;
    }
  }
}
