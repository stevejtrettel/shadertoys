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

    // Set up resize observer
    this.resizeObserver = new ResizeObserver(() => {
      this.updateCanvasSize();
      this.engine.resize(this.canvas.width, this.canvas.height);
    });
    this.resizeObserver.observe(this.container);

    // Set up mouse tracking
    this.setupMouseTracking();
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

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
  }

  // ===========================================================================
  // Animation Loop
  // ===========================================================================

  private animate = (currentTimeMs: number): void => {
    const currentTimeSec = currentTimeMs / 1000;
    const elapsedTime = currentTimeSec - this.startTime;

    // Run engine step
    this.engine.step(elapsedTime, this.mouse);

    // Present Image pass output to screen
    this.presentToScreen();

    // Schedule next frame
    this.animationId = requestAnimationFrame(this.animate);
  };

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
}
