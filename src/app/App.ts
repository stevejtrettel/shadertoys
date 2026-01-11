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
import { ShadertoyProject } from '../project/types';
import { UniformsPanel } from '../uniforms/UniformsPanel';
import { AppOptions, MouseState } from './types';

export class App {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private engine: ShadertoyEngine;
  private project: ShadertoyProject;

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

  // Stats panel (expandable from FPS counter)
  private statsContainer: HTMLElement | null = null;
  private statsGrid: HTMLElement | null = null;
  private timeDisplay: HTMLElement | null = null;
  private frameDisplay: HTMLElement | null = null;
  private resolutionDisplay: HTMLElement | null = null;
  private totalFrameCount: number = 0;
  private isStatsOpen: boolean = false;

  // Playback controls
  private controlsContainer: HTMLElement | null = null;
  private controlsGrid: HTMLElement | null = null;
  private menuButton: HTMLElement | null = null;
  private playPauseButton: HTMLElement | null = null;
  private isPaused: boolean = false;
  private isMenuOpen: boolean = false;

  // Error overlay
  private errorOverlay: HTMLElement | null = null;

  // Resize observer
  private resizeObserver: ResizeObserver;

  // Visibility observer (auto-pause when off-screen)
  private intersectionObserver: IntersectionObserver;
  private isVisible: boolean = true;

  // WebGL context loss handling
  private contextLostOverlay: HTMLElement | null = null;
  private isContextLost: boolean = false;

  // Floating uniforms panel
  private uniformsPanel: UniformsPanel | null = null;

  constructor(opts: AppOptions) {
    this.container = opts.container;
    this.project = opts.project;
    this.pixelRatio = opts.pixelRatio ?? window.devicePixelRatio;

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.container.appendChild(this.canvas);

    // Create stats container (holds FPS button and expandable stats)
    this.statsContainer = document.createElement('div');
    this.statsContainer.className = 'stats-container';

    // Create FPS display (clickable to expand stats)
    this.fpsDisplay = document.createElement('button');
    this.fpsDisplay.className = 'fps-counter';
    this.fpsDisplay.textContent = '0 FPS';
    this.fpsDisplay.title = 'Click to show stats';
    this.fpsDisplay.addEventListener('click', () => this.toggleStats());

    // Create stats grid (hidden by default)
    this.statsGrid = document.createElement('div');
    this.statsGrid.className = 'stats-grid';

    // Time display
    this.timeDisplay = document.createElement('div');
    this.timeDisplay.className = 'stat-item';
    this.timeDisplay.innerHTML = '<span class="stat-value">0:00</span><span class="stat-label">time</span>';
    this.statsGrid.appendChild(this.timeDisplay);

    // Frame display
    this.frameDisplay = document.createElement('div');
    this.frameDisplay.className = 'stat-item';
    this.frameDisplay.innerHTML = '<span class="stat-value">0</span><span class="stat-label">frame</span>';
    this.statsGrid.appendChild(this.frameDisplay);

    // Resolution display
    this.resolutionDisplay = document.createElement('div');
    this.resolutionDisplay.className = 'stat-item';
    this.resolutionDisplay.innerHTML = '<span class="stat-value">0×0</span><span class="stat-label">res</span>';
    this.statsGrid.appendChild(this.resolutionDisplay);

    this.statsContainer.appendChild(this.statsGrid);
    this.statsContainer.appendChild(this.fpsDisplay);
    this.container.appendChild(this.statsContainer);

    // Create playback controls if enabled (skip for 'ui' layout which has its own)
    if (opts.project.controls && !opts.skipPlaybackControls) {
      this.createControls();
    }

    // Get WebGL2 context
    const gl = this.canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: true, // Required for screenshots
      powerPreference: 'high-performance',
    });

    if (!gl) {
      throw new Error('WebGL2 not supported');
    }

    this.gl = gl;

    // Set up WebGL context loss handling
    this.setupContextLossHandling();

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

    // Create floating uniforms panel (skip for 'ui' layout which has its own)
    if (!opts.skipUniformsPanel && opts.project.uniforms && Object.keys(opts.project.uniforms).length > 0) {
      this.uniformsPanel = new UniformsPanel({
        container: this.container,
        uniforms: opts.project.uniforms,
        onChange: (name, value) => {
          this.engine.setUniformValue(name, value);
        },
      });
    }

    // Set up resize observer
    this.resizeObserver = new ResizeObserver(() => {
      this.updateCanvasSize();
      this.engine.resize(this.canvas.width, this.canvas.height);
      // Reset frame counter so shaders can reinitialize (important for accumulators)
      this.startTime = performance.now() / 1000;
      this.engine.reset();
    });
    this.resizeObserver.observe(this.container);

    // Set up intersection observer for auto-pause when off-screen
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        this.isVisible = entry.isIntersecting;
      },
      { threshold: 0.1 } // Trigger when 10% visible
    );
    this.intersectionObserver.observe(this.container);

    // Set up mouse tracking
    this.setupMouseTracking();

    // Set up keyboard tracking for shader keyboard texture
    this.setupKeyboardTracking();

    // Set up global keyboard shortcuts (always available)
    this.setupGlobalShortcuts();

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
   * Get the underlying engine instance.
   * Used for live recompilation in editor mode.
   */
  getEngine(): ShadertoyEngine {
    return this.engine;
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
    this.intersectionObserver.disconnect();
    this.uniformsPanel?.destroy();
    this.engine.dispose();
    this.container.removeChild(this.canvas);
    if (this.statsContainer) {
      this.container.removeChild(this.statsContainer);
    }
    this.hideContextLostOverlay();
    this.hideErrorOverlay();
  }

  // ===========================================================================
  // Animation Loop
  // ===========================================================================

  private animate = (currentTimeMs: number): void => {
    // Schedule next frame first (even if paused or invisible)
    this.animationId = requestAnimationFrame(this.animate);

    // Skip rendering if paused, off-screen, or context lost
    if (this.isPaused || !this.isVisible || this.isContextLost) {
      return;
    }

    const currentTimeSec = currentTimeMs / 1000;
    const elapsedTime = currentTimeSec - this.startTime;

    // Update FPS counter and stats
    this.updateFps(currentTimeSec, elapsedTime);

    // Update keyboard texture with current key states
    this.engine.updateKeyboardTexture();

    // Run engine step
    this.engine.step(elapsedTime, this.mouse);

    // Present Image pass output to screen
    this.presentToScreen();
  };

  /**
   * Update FPS counter.
   * FPS display updates once per second, frame count updates every frame.
   */
  private updateFps(currentTimeSec: number, elapsedTime: number): void {
    this.frameCount++;
    this.totalFrameCount++;

    // Update frame count display every frame if stats panel is open
    if (this.isStatsOpen && this.frameDisplay) {
      this.updateFrameDisplay();
    }

    // Update FPS display once per second
    if (currentTimeSec - this.lastFpsUpdate >= 1.0) {
      this.currentFps = this.frameCount / (currentTimeSec - this.lastFpsUpdate);
      this.fpsDisplay.textContent = `${Math.round(this.currentFps)} FPS`;
      this.frameCount = 0;
      this.lastFpsUpdate = currentTimeSec;

      // Update time/resolution stats once per second (they don't need per-frame updates)
      if (this.isStatsOpen) {
        this.updateTimeDisplay(elapsedTime);
        this.updateResolutionDisplay();
      }
    }
  }

  /**
   * Update frame count display.
   */
  private updateFrameDisplay(): void {
    if (!this.frameDisplay) return;

    let frameStr: string;
    if (this.totalFrameCount >= 1000000) {
      frameStr = (this.totalFrameCount / 1000000).toFixed(1) + 'M';
    } else if (this.totalFrameCount >= 1000) {
      frameStr = (this.totalFrameCount / 1000).toFixed(1) + 'K';
    } else {
      frameStr = this.totalFrameCount.toString();
    }
    this.frameDisplay.querySelector('.stat-value')!.textContent = frameStr;
  }

  /**
   * Update time display.
   */
  private updateTimeDisplay(elapsedTime: number): void {
    if (!this.timeDisplay) return;

    const totalSeconds = Math.floor(elapsedTime);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let timeStr: string;
    if (hours > 0) {
      timeStr = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    this.timeDisplay.querySelector('.stat-value')!.textContent = timeStr;
  }

  /**
   * Update resolution display.
   */
  private updateResolutionDisplay(): void {
    if (!this.resolutionDisplay) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    this.resolutionDisplay.querySelector('.stat-value')!.textContent = `${w}×${h}`;
  }

  /**
   * Toggle the stats panel open/closed.
   */
  private toggleStats(): void {
    this.isStatsOpen = !this.isStatsOpen;

    if (this.statsGrid) {
      this.statsGrid.classList.toggle('open', this.isStatsOpen);
    }

    if (this.statsContainer) {
      this.statsContainer.classList.toggle('open', this.isStatsOpen);
    }

    // Update stats immediately when opening
    if (this.isStatsOpen) {
      const elapsedTime = (performance.now() / 1000) - this.startTime;
      this.updateTimeDisplay(elapsedTime);
      this.updateFrameDisplay();
      this.updateResolutionDisplay();
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

    const imageFramebuffer = this.engine.getImageFramebuffer();
    if (!imageFramebuffer) {
      console.warn('No Image pass found');
      return;
    }

    // Bind default framebuffer (screen)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // Clear screen
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Blit Image pass FBO to screen
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, imageFramebuffer);
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
   * Create playback control buttons with collapsible menu.
   */
  private createControls(): void {
    // Create container
    this.controlsContainer = document.createElement('div');
    this.controlsContainer.className = 'playback-controls';

    // Create menu toggle button
    this.menuButton = document.createElement('button');
    this.menuButton.className = 'controls-menu-button';
    this.menuButton.title = 'Controls';
    this.menuButton.textContent = '+';
    this.menuButton.addEventListener('click', () => this.toggleControlsMenu());

    // Create controls grid (hidden by default)
    this.controlsGrid = document.createElement('div');
    this.controlsGrid.className = 'controls-grid';

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

    // Screenshot button
    const screenshotButton = document.createElement('button');
    screenshotButton.className = 'control-button';
    screenshotButton.title = 'Screenshot (S)';
    screenshotButton.innerHTML = `
      <svg viewBox="0 0 16 16">
        <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
        <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z"/>
      </svg>
    `;
    screenshotButton.addEventListener('click', () => this.screenshot());

    // Add buttons to grid (positioned in 2x2 layout)
    // Top-left: Play/Pause, Top-right: Reset
    // Bottom-left: Screenshot, Bottom-right: (empty for menu button overlay)
    this.controlsGrid.appendChild(this.playPauseButton);
    this.controlsGrid.appendChild(resetButton);
    this.controlsGrid.appendChild(screenshotButton);

    // Add grid and menu button to container
    this.controlsContainer.appendChild(this.controlsGrid);
    this.controlsContainer.appendChild(this.menuButton);
    this.container.appendChild(this.controlsContainer);
  }

  /**
   * Toggle the controls menu open/closed.
   */
  private toggleControlsMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;

    if (this.menuButton) {
      this.menuButton.textContent = this.isMenuOpen ? '−' : '+';
    }

    if (this.controlsGrid) {
      this.controlsGrid.classList.toggle('open', this.isMenuOpen);
    }

    if (this.controlsContainer) {
      this.controlsContainer.classList.toggle('open', this.isMenuOpen);
    }
  }

  /**
   * Set up keyboard tracking for shader keyboard texture.
   * Tracks all key presses/releases and forwards to engine.
   */
  private setupKeyboardTracking(): void {
    // Track keydown events
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      // Get keycode - use e.keyCode which is the ASCII code
      const keycode = e.keyCode;
      if (keycode >= 0 && keycode < 256) {
        this.engine.updateKeyState(keycode, true);
      }
    });

    // Track keyup events
    document.addEventListener('keyup', (e: KeyboardEvent) => {
      const keycode = e.keyCode;
      if (keycode >= 0 && keycode < 256) {
        this.engine.updateKeyState(keycode, false);
      }
    });
  }

  /**
   * Set up global keyboard shortcuts (always available).
   */
  private setupGlobalShortcuts(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      // S - Screenshot
      if (e.code === 'KeyS' && !e.repeat) {
        e.preventDefault();
        this.screenshot();
      }
    });
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

  // ===========================================================================
  // WebGL Context Loss Handling
  // ===========================================================================

  /**
   * Set up handlers for WebGL context loss and restoration.
   * Context can be lost due to GPU driver issues, system sleep, etc.
   */
  private setupContextLossHandling(): void {
    this.canvas.addEventListener('webglcontextlost', (e: Event) => {
      e.preventDefault(); // Required to allow context restoration
      this.handleContextLost();
    });

    this.canvas.addEventListener('webglcontextrestored', () => {
      this.handleContextRestored();
    });
  }

  /**
   * Handle WebGL context loss - pause rendering and show overlay.
   */
  private handleContextLost(): void {
    this.isContextLost = true;
    this.stop();
    this.showContextLostOverlay();
    console.warn('WebGL context lost. Waiting for restoration...');
  }

  /**
   * Handle WebGL context restoration - reinitialize and resume.
   */
  private handleContextRestored(): void {
    console.log('WebGL context restored. Reinitializing...');

    try {
      // Dispose old engine resources (they're invalid now)
      this.engine.dispose();

      // Reinitialize engine with fresh GL state
      this.engine = new ShadertoyEngine({
        gl: this.gl,
        project: this.project,
      });

      // Check for compilation errors
      if (this.engine.hasErrors()) {
        this.showErrorOverlay(this.engine.getCompilationErrors());
      }

      // Resize to current dimensions
      this.engine.resize(this.canvas.width, this.canvas.height);

      // Hide context lost overlay and resume
      this.hideContextLostOverlay();
      this.isContextLost = false;
      this.reset();
      this.start();

      console.log('WebGL context successfully restored');
    } catch (error) {
      console.error('Failed to restore WebGL context:', error);
      this.showContextLostOverlay(true); // Show with reload prompt
    }
  }

  /**
   * Show overlay when WebGL context is lost.
   */
  private showContextLostOverlay(showReload: boolean = false): void {
    if (!this.contextLostOverlay) {
      this.contextLostOverlay = document.createElement('div');
      this.contextLostOverlay.className = 'context-lost-overlay';
      this.container.appendChild(this.contextLostOverlay);
    }

    if (showReload) {
      this.contextLostOverlay.innerHTML = `
        <div class="context-lost-content">
          <div class="context-lost-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div class="context-lost-title">WebGL Context Lost</div>
          <div class="context-lost-message">Unable to restore automatically.</div>
          <button class="context-lost-reload" onclick="location.reload()">Reload Page</button>
        </div>
      `;
    } else {
      this.contextLostOverlay.innerHTML = `
        <div class="context-lost-content">
          <div class="context-lost-spinner"></div>
          <div class="context-lost-title">WebGL Context Lost</div>
          <div class="context-lost-message">Attempting to restore...</div>
        </div>
      `;
    }
  }

  /**
   * Hide the context lost overlay.
   */
  private hideContextLostOverlay(): void {
    if (this.contextLostOverlay) {
      this.contextLostOverlay.remove();
      this.contextLostOverlay = null;
    }
  }

  /**
   * Toggle between play and pause states.
   * Public for UILayout to call.
   */
  togglePlayPause(): void {
    this.isPaused = !this.isPaused;
    this.updatePlayPauseButton();
  }

  /**
   * Get current paused state.
   */
  getPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Reset the shader to frame 0.
   * Public for UILayout to call.
   */
  reset(): void {
    this.startTime = performance.now() / 1000;
    this.frameCount = 0;
    this.totalFrameCount = 0;
    this.lastFpsUpdate = 0;
    this.engine.reset();

    // Update stats display if open
    if (this.isStatsOpen) {
      this.updateTimeDisplay(0);
      this.updateFrameDisplay();
      this.updateResolutionDisplay();
    }
  }

  /**
   * Capture and download a screenshot of the current canvas as PNG.
   * Filename format: shadertoy-{folderName}-{timestamp}.png
   * Public for UILayout to call.
   */
  screenshot(): void {
    // Extract folder name from project root (e.g., "/demos/keyboard-test" -> "keyboard-test")
    const folderName = this.project.root.split('/').pop() || 'shader';

    // Generate timestamp (YYYYMMDD-HHMMSS)
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') + '-' +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0');

    const filename = `shadertoy-${folderName}-${timestamp}.png`;

    // Capture canvas as PNG blob
    this.canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Failed to create screenshot blob');
        return;
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();

      // Clean up
      URL.revokeObjectURL(url);

      console.log(`Screenshot saved: ${filename}`);
    }, 'image/png');
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
