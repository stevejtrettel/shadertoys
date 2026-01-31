/**
 * Engine - Shadertoy Execution Engine
 *
 * Implements the execution model described in docs/engine-spec.md.
 *
 * Responsibilities:
 *  - Own WebGL resources for passes (programs, VAOs, textures, FBOs).
 *  - Execute passes each frame in Shadertoy order: BufferA→BufferB→BufferC→BufferD→Image.
 *  - Bind Shadertoy uniforms (iResolution, iTime, iTimeDelta, iFrame, iMouse).
 *  - Bind iChannel0..3 according to ChannelSource.
 */

import {
  ShadertoyProject,
  ChannelSource,
  PassName,
  UniformValue,
  UniformValues,
  ArrayUniformDefinition,
  isArrayUniform,
} from '../project/types';

import { UniformStore } from '../uniforms/UniformStore';
import { std140ByteSize, packStd140, glslTypeName } from './std140';

import {
  EngineOptions,
  RuntimePass,
  RuntimeTexture2D,
  RuntimeKeyboardTexture,
  EngineStats,
  PassUniformLocations,
} from './types';

import {
  createProgramFromSources,
  createFullscreenTriangleVAO,
  createRenderTargetTexture,
  createFramebufferWithColorAttachment,
  createBlackTexture,
  createKeyboardTexture,
  updateKeyboardTexture,
} from './glHelpers';

// =============================================================================
// Vertex Shader (Shared across all passes)
// =============================================================================

const VERTEX_SHADER_SOURCE = `#version 300 es
precision highp float;

layout(location = 0) in vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// =============================================================================
// Fragment Shader Boilerplate (before common code)
// =============================================================================

const FRAGMENT_PREAMBLE = `#version 300 es
precision highp float;

// Shadertoy compatibility: equirectangular texture sampling
const float ST_PI = 3.14159265359;
const float ST_TWOPI = 6.28318530718;
vec2 _st_dirToEquirect(vec3 dir) {
  float phi = atan(dir.z, dir.x);
  float theta = asin(dir.y);
  return vec2(phi / ST_TWOPI + 0.5, theta / ST_PI + 0.5);
}
`;

// Line count computed from actual preamble (for error line mapping)
// Count actual newlines in the preamble string
const PREAMBLE_LINE_COUNT = (FRAGMENT_PREAMBLE.match(/\n/g) || []).length;

// =============================================================================
// ShadertoyEngine Implementation
// =============================================================================

/** Runtime state for a single UBO-backed array uniform */
interface UBOEntry {
  name: string;
  def: ArrayUniformDefinition;
  buffer: WebGLBuffer;
  bindingPoint: number;
  byteSize: number;
  dirty: boolean;
  /** Pre-allocated std140-padded buffer, reused across frames */
  paddedData: Float32Array;
}

export class ShadertoyEngine {
  readonly project: ShadertoyProject;
  readonly gl: WebGL2RenderingContext;

  private _width: number;
  private _height: number;

  private _frame: number = 0;
  private _time: number = 0;
  private _lastStepTime: number | null = null;

  private _passes: RuntimePass[] = [];
  private _textures: RuntimeTexture2D[] = [];
  private _keyboardTexture: RuntimeKeyboardTexture | null = null;

  private _blackTexture: WebGLTexture | null = null;

  // Keyboard state tracking (Maps keycodes to state)
  private _keyStates: Map<number, boolean> = new Map(); // true = down, false = up
  private _toggleStates: Map<number, number> = new Map(); // 0.0 or 1.0

  // Compilation errors (if any occurred during initialization)
  private _compilationErrors: Array<{
    passName: PassName;
    error: string;
    source: string;
    isFromCommon: boolean;
    originalLine: number | null;
  }> = [];

  // Custom uniform state manager (initialized in initCustomUniforms called by constructor)
  private _uniforms!: UniformStore;

  // UBO-backed array uniforms
  private _ubos: UBOEntry[] = [];

  constructor(opts: EngineOptions) {
    this.gl = opts.gl;
    this.project = opts.project;

    // Initialize width/height from current drawing buffer
    this._width = this.gl.drawingBufferWidth;
    this._height = this.gl.drawingBufferHeight;

    // 1. Initialize extensions
    this.initExtensions();

    // 2. Create black texture for unused channels
    this._blackTexture = createBlackTexture(this.gl);

    // 3. Create keyboard texture (256x3, Shadertoy format)
    const keyboardTex = createKeyboardTexture(this.gl);
    this._keyboardTexture = {
      texture: keyboardTex,
      width: 256,
      height: 3,
    };

    // 4. Initialize external textures (from project.textures)
    //    NOTE: This requires actual image data; for now just stub the array.
    //    Real implementation would load images here.
    this.initProjectTextures();

    // 5. Initialize custom uniform values and UBOs (must happen before shader compilation)
    this.initCustomUniforms();

    // 6. Compile shaders + create runtime passes
    this.initRuntimePasses();
  }

  /**
   * Initialize custom uniform store and UBOs from project config.
   */
  private initCustomUniforms(): void {
    this._uniforms = new UniformStore(this.project.uniforms);
    this.initUBOs();
  }

  /**
   * Create WebGL UBO buffers for all array uniforms.
   */
  private initUBOs(): void {
    const gl = this.gl;
    const maxSize = gl.getParameter(gl.MAX_UNIFORM_BLOCK_SIZE) as number;
    let bindingPoint = 0;

    for (const [name, def] of Object.entries(this.project.uniforms)) {
      if (!isArrayUniform(def)) continue;

      const byteSize = std140ByteSize(def.type, def.count);
      if (byteSize > maxSize) {
        throw new Error(
          `Array uniform '${name}' requires ${byteSize} bytes but GL MAX_UNIFORM_BLOCK_SIZE is ${maxSize}`
        );
      }

      const buffer = gl.createBuffer();
      if (!buffer) throw new Error(`Failed to create UBO buffer for '${name}'`);

      // Allocate GPU buffer
      gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
      gl.bufferData(gl.UNIFORM_BUFFER, byteSize, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.UNIFORM_BUFFER, null);

      // Bind to a binding point
      gl.bindBufferBase(gl.UNIFORM_BUFFER, bindingPoint, buffer);

      // Pre-allocate the padded data buffer
      const paddedData = new Float32Array(byteSize / 4);

      this._ubos.push({
        name,
        def,
        buffer,
        bindingPoint,
        byteSize,
        dirty: false,
        paddedData,
      });

      bindingPoint++;
    }
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get stats(): EngineStats {
    const dt = this._lastStepTime === null ? 0 : this._time - this._lastStepTime;
    return {
      frame: this._frame,
      time: this._time,
      deltaTime: dt,
      width: this._width,
      height: this._height,
    };
  }

  /**
   * Get shader compilation errors (if any occurred during initialization).
   * Returns empty array if all shaders compiled successfully.
   */
  getCompilationErrors(): Array<{
    passName: PassName;
    error: string;
    source: string;
    isFromCommon: boolean;
    originalLine: number | null;
  }> {
    return this._compilationErrors;
  }

  /**
   * Check if there were any compilation errors.
   */
  hasErrors(): boolean {
    return this._compilationErrors.length > 0;
  }

  /**
   * Get the uniform store for direct access to uniform state.
   */
  getUniformStore(): UniformStore {
    return this._uniforms;
  }

  /**
   * Get the current value of a custom uniform.
   */
  getUniformValue(name: string): UniformValue | undefined {
    return this._uniforms.get(name);
  }

  /**
   * Get all custom uniform values.
   */
  getUniformValues(): UniformValues {
    return this._uniforms.getAll();
  }

  /**
   * Set the value of a custom uniform.
   * For scalar uniforms, the value will be applied on the next render frame.
   * For array uniforms (UBOs), the data is packed to std140 and uploaded on next bind.
   */
  setUniformValue(name: string, value: UniformValue): void {
    this._uniforms.set(name, value);

    // If this is an array uniform, pack and mark dirty
    const def = this.project.uniforms[name];
    if (def && isArrayUniform(def)) {
      const ubo = this._ubos.find(u => u.name === name);
      if (ubo && value instanceof Float32Array) {
        const packed = packStd140(def.type, def.count, value, ubo.paddedData);
        // Fast-path types (vec4, mat4) return input directly; copy into paddedData
        if (packed !== ubo.paddedData) {
          ubo.paddedData.set(packed);
        }
        ubo.dirty = true;
      }
    }
  }

  /**
   * Set multiple custom uniform values at once.
   */
  setUniformValues(values: Partial<UniformValues>): void {
    this._uniforms.setAll(values);
  }

  /**
   * Get the framebuffer for the Image pass (for presenting to screen).
   */
  getImageFramebuffer(): WebGLFramebuffer | null {
    const imagePass = this._passes.find((p) => p.name === 'Image');
    return imagePass?.framebuffer ?? null;
  }

  /**
   * Bind the Image pass output as the READ_FRAMEBUFFER for blitting to screen.
   *
   * After the ping-pong swap, the rendered output is in previousTexture,
   * but the framebuffer is attached to currentTexture. This method temporarily
   * attaches previousTexture so blitFramebuffer reads the correct data.
   */
  bindImageForRead(): boolean {
    const gl = this.gl;
    const imagePass = this._passes.find((p) => p.name === 'Image');
    if (!imagePass) return false;

    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, imagePass.framebuffer);
    gl.framebufferTexture2D(
      gl.READ_FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      imagePass.previousTexture,
      0
    );
    return true;
  }

  /**
   * Restore the Image pass framebuffer to its normal state (attached to currentTexture).
   * Call after blitting to screen.
   */
  unbindImageForRead(): void {
    const gl = this.gl;
    const imagePass = this._passes.find((p) => p.name === 'Image');
    if (!imagePass) return;

    // Restore FBO attachment to currentTexture for next frame's render
    gl.framebufferTexture2D(
      gl.READ_FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      imagePass.currentTexture,
      0
    );
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
  }

  /**
   * Run one full frame of all passes.
   *
   * @param timeSeconds - global time in seconds (monotone, from App)
   * @param mouse - iMouse as [x, y, clickX, clickY]
   * @param touch - optional touch state for touch uniforms
   */
  step(timeSeconds: number, mouse: [number, number, number, number], touch?: {
    count: number;
    touches: [[number, number, number, number], [number, number, number, number], [number, number, number, number]];
    pinch: number;
    pinchDelta: number;
    pinchCenter: [number, number];
  }): void {
    const gl = this.gl;

    // Compute time/deltaTime/iFrame
    const deltaTime =
      this._lastStepTime === null ? 0.0 : timeSeconds - this._lastStepTime;
    this._lastStepTime = timeSeconds;
    this._time = timeSeconds;

    const iResolution = [this._width, this._height, 1.0] as const;
    const iTime = this._time;
    const iTimeDelta = deltaTime;
    const iFrame = this._frame;
    const iMouse = mouse;

    // Compute iDate: (year, month, day, seconds since midnight)
    const now = new Date();
    const iDate = [
      now.getFullYear(),
      now.getMonth(),      // 0-11 (matches Shadertoy)
      now.getDate(),       // 1-31
      now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() + now.getMilliseconds() / 1000
    ] as const;

    // Compute iFrameRate (smoothed via deltaTime)
    const iFrameRate = deltaTime > 0 ? 1.0 / deltaTime : 60.0;

    // Default touch state if not provided
    const touchState = touch ?? {
      count: 0,
      touches: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]] as [[number, number, number, number], [number, number, number, number], [number, number, number, number]],
      pinch: 1.0,
      pinchDelta: 0.0,
      pinchCenter: [0, 0] as [number, number],
    };

    // Set viewport for all passes
    gl.viewport(0, 0, this._width, this._height);

    // Execute passes in Shadertoy order
    const passOrder: PassName[] = ['BufferA', 'BufferB', 'BufferC', 'BufferD', 'Image'];

    for (const passName of passOrder) {
      const runtimePass = this._passes.find((p) => p.name === passName);
      if (!runtimePass) continue;

      this.executePass(runtimePass, {
        iResolution,
        iTime,
        iTimeDelta,
        iFrame,
        iMouse,
        iDate,
        iFrameRate,
        iTouchCount: touchState.count,
        iTouch: touchState.touches,
        iPinch: touchState.pinch,
        iPinchDelta: touchState.pinchDelta,
        iPinchCenter: touchState.pinchCenter,
      });

      // Swap ping-pong textures after pass execution
      this.swapPassTextures(runtimePass);
    }

    // Monotone frame counter (increment AFTER all passes)
    this._frame += 1;
  }

  /**
   * Resize all internal render targets to new width/height.
   * Does not reset time or frame count.
   */
  resize(width: number, height: number): void {
    this._width = width;
    this._height = height;

    const gl = this.gl;

    // Reallocate ALL pass textures to new resolution
    for (const pass of this._passes) {
      // Delete old textures and framebuffer
      gl.deleteTexture(pass.currentTexture);
      gl.deleteTexture(pass.previousTexture);
      gl.deleteFramebuffer(pass.framebuffer);

      // Create new textures at new resolution
      pass.currentTexture = createRenderTargetTexture(gl, width, height);
      pass.previousTexture = createRenderTargetTexture(gl, width, height);

      // Create new framebuffer (attached to current texture)
      pass.framebuffer = createFramebufferWithColorAttachment(gl, pass.currentTexture);
    }
  }

  /**
   * Reset frame counter and clear all render targets.
   * Used for playback controls to restart shader from frame 0.
   */
  reset(): void {
    this._frame = 0;

    // Clear all pass textures (both current and previous for ping-pong)
    // This is critical for accumulation shaders that read from previous frame
    const gl = this.gl;
    for (const pass of this._passes) {
      // Clear current texture (already attached to framebuffer)
      gl.bindFramebuffer(gl.FRAMEBUFFER, pass.framebuffer);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Also clear previous texture (temporarily attach it)
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        pass.previousTexture,
        0
      );
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Re-attach current texture
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        pass.currentTexture,
        0
      );
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /**
   * Update keyboard key state (called from App on keydown/keyup events).
   *
   * @param keycode ASCII keycode (e.g., 65 for 'A')
   * @param isDown true if key pressed, false if released
   */
  updateKeyState(keycode: number, isDown: boolean): void {
    const wasDown = this._keyStates.get(keycode) || false;

    // Update current state
    this._keyStates.set(keycode, isDown);

    // Toggle on press (down transition)
    if (isDown && !wasDown) {
      const currentToggle = this._toggleStates.get(keycode) || 0.0;
      this._toggleStates.set(keycode, currentToggle === 0.0 ? 1.0 : 0.0);
    }
  }

  /**
   * Update keyboard texture with current key states.
   * Should be called once per frame before rendering.
   */
  updateKeyboardTexture(): void {
    if (!this._keyboardTexture) {
      return; // No keyboard texture to update
    }

    updateKeyboardTexture(
      this.gl,
      this._keyboardTexture.texture,
      this._keyStates,
      this._toggleStates
    );
  }

  /**
   * Recompile a single pass with new GLSL source code.
   * Used for live editing - keeps the old shader running if compilation fails.
   *
   * @param passName - Name of the pass to recompile ('Image', 'BufferA', etc.)
   * @param newSource - New GLSL source code for the pass
   * @returns Object with success status and error message if failed
   */
  recompilePass(passName: PassName, newSource: string): { success: boolean; error?: string } {
    const gl = this.gl;

    // Find the runtime pass
    const runtimePass = this._passes.find((p) => p.name === passName);
    if (!runtimePass) {
      return { success: false, error: `Pass '${passName}' not found` };
    }

    // Update the project's pass source (so buildFragmentShader uses it)
    const projectPass = this.project.passes[passName];
    if (!projectPass) {
      return { success: false, error: `Project pass '${passName}' not found` };
    }

    // Build new fragment shader
    const fragmentSource = this.buildFragmentShader(newSource, projectPass.channels);

    try {
      // Try to compile new program
      const newProgram = createProgramFromSources(gl, VERTEX_SHADER_SOURCE, fragmentSource);

      // Success! Delete old program and update runtime pass
      gl.deleteProgram(runtimePass.uniforms.program);

      // Cache new uniform locations
      runtimePass.uniforms = this.cacheUniformLocations(newProgram);

      // Update the stored source in the project
      projectPass.glslSource = newSource;

      // Clear any previous compilation errors for this pass
      this._compilationErrors = this._compilationErrors.filter(e => e.passName !== passName);

      return { success: true };
    } catch (err) {
      // Compilation failed - keep old shader running
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Recompile common.glsl and all passes that use it.
   * Used for live editing of common code.
   *
   * @param newCommonSource - New GLSL source code for common.glsl
   * @returns Object with success status and errors for each failed pass
   */
  recompileCommon(newCommonSource: string): { success: boolean; errors: Array<{ passName: PassName; error: string }> } {
    const oldCommonSource = this.project.commonSource;

    // Temporarily update common source
    this.project.commonSource = newCommonSource;

    const errors: Array<{ passName: PassName; error: string }> = [];
    const passOrder: PassName[] = ['BufferA', 'BufferB', 'BufferC', 'BufferD', 'Image'];

    // Try to recompile all passes
    for (const passName of passOrder) {
      const projectPass = this.project.passes[passName];
      if (!projectPass) continue;

      const result = this.recompilePass(passName, projectPass.glslSource);
      if (!result.success) {
        errors.push({ passName, error: result.error || 'Unknown error' });
      }
    }

    // If any failed, restore old common source and recompile successful ones back
    if (errors.length > 0) {
      this.project.commonSource = oldCommonSource;

      // Recompile passes back to working state
      for (const passName of passOrder) {
        const projectPass = this.project.passes[passName];
        if (!projectPass) continue;

        // Skip passes that failed (they still have old shader)
        if (errors.some(e => e.passName === passName)) continue;

        // Recompile with old common source
        this.recompilePass(passName, projectPass.glslSource);
      }

      return { success: false, errors };
    }

    return { success: true, errors: [] };
  }

  /**
   * Delete all GL resources.
   */
  dispose(): void {
    const gl = this.gl;

    // Delete passes (programs, VAOs, FBOs, textures)
    for (const pass of this._passes) {
      gl.deleteProgram(pass.uniforms.program);
      gl.deleteVertexArray(pass.vao);
      gl.deleteFramebuffer(pass.framebuffer);
      gl.deleteTexture(pass.currentTexture);
      gl.deleteTexture(pass.previousTexture);
    }

    // Delete external textures
    for (const tex of this._textures) {
      gl.deleteTexture(tex.texture);
    }

    // Delete keyboard texture
    if (this._keyboardTexture) {
      gl.deleteTexture(this._keyboardTexture.texture);
    }

    // Delete black texture
    if (this._blackTexture) {
      gl.deleteTexture(this._blackTexture);
    }

    // Delete UBO buffers
    for (const ubo of this._ubos) {
      gl.deleteBuffer(ubo.buffer);
    }

    // Clear arrays
    this._passes = [];
    this._textures = [];
    this._ubos = [];
    this._keyboardTexture = null;
    this._blackTexture = null;
  }

  // ===========================================================================
  // Initialization Helpers
  // ===========================================================================

  private initExtensions(): void {
    const gl = this.gl;

    // MUST enable EXT_color_buffer_float for RGBA32F render targets
    const ext = gl.getExtension('EXT_color_buffer_float');
    if (!ext) {
      throw new Error(
        'EXT_color_buffer_float not supported. WebGL2 with float rendering is required.'
      );
    }

    // Optionally check for OES_texture_float_linear (for smooth filtering of float textures)
    // Not strictly required for Shadertoy, but nice to have
    gl.getExtension('OES_texture_float_linear');
  }

  /**
   * Cache uniform locations for a compiled program.
   * Returns a PassUniformLocations object with all standard and custom uniform locations.
   */
  private cacheUniformLocations(program: WebGLProgram): PassUniformLocations {
    const gl = this.gl;

    // Cache custom uniform locations (skip array uniforms — they use UBOs)
    const customLocations = new Map<string, WebGLUniformLocation | null>();
    for (const [name, def] of Object.entries(this.project.uniforms)) {
      if (isArrayUniform(def)) continue;
      customLocations.set(name, gl.getUniformLocation(program, name));
    }

    // Bind UBO block indices for this program
    for (const ubo of this._ubos) {
      const blockIndex = gl.getUniformBlockIndex(program, `_ub_${ubo.name}`);
      if (blockIndex !== gl.INVALID_INDEX) {
        gl.uniformBlockBinding(program, blockIndex, ubo.bindingPoint);
      }
    }

    return {
      program,
      iResolution: gl.getUniformLocation(program, 'iResolution'),
      iTime: gl.getUniformLocation(program, 'iTime'),
      iTimeDelta: gl.getUniformLocation(program, 'iTimeDelta'),
      iFrame: gl.getUniformLocation(program, 'iFrame'),
      iMouse: gl.getUniformLocation(program, 'iMouse'),
      iDate: gl.getUniformLocation(program, 'iDate'),
      iFrameRate: gl.getUniformLocation(program, 'iFrameRate'),
      iChannel: [
        gl.getUniformLocation(program, 'iChannel0'),
        gl.getUniformLocation(program, 'iChannel1'),
        gl.getUniformLocation(program, 'iChannel2'),
        gl.getUniformLocation(program, 'iChannel3'),
      ],
      iChannelResolution: [
        gl.getUniformLocation(program, 'iChannelResolution[0]'),
        gl.getUniformLocation(program, 'iChannelResolution[1]'),
        gl.getUniformLocation(program, 'iChannelResolution[2]'),
        gl.getUniformLocation(program, 'iChannelResolution[3]'),
      ],
      // Touch uniforms
      iTouchCount: gl.getUniformLocation(program, 'iTouchCount'),
      iTouch: [
        gl.getUniformLocation(program, 'iTouch0'),
        gl.getUniformLocation(program, 'iTouch1'),
        gl.getUniformLocation(program, 'iTouch2'),
      ],
      iPinch: gl.getUniformLocation(program, 'iPinch'),
      iPinchDelta: gl.getUniformLocation(program, 'iPinchDelta'),
      iPinchCenter: gl.getUniformLocation(program, 'iPinchCenter'),
      custom: customLocations,
    };
  }

  /**
   * Initialize external textures based on project.textures.
   *
   * NOTE: This function as written assumes that actual image loading
   * is handled elsewhere. For now we just construct an empty array.
   * In a real implementation, you would load images here.
   */
  private initProjectTextures(): void {
    const gl = this.gl;
    this._textures = [];

    // Load each texture from the project
    for (const texDef of this.project.textures) {
      // Create a placeholder 1x1 texture immediately
      const texture = gl.createTexture();
      if (!texture) {
        throw new Error('Failed to create texture');
      }

      // Bind and set initial 1x1 black pixel
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));

      // Store in runtime array
      const runtimeTex: RuntimeTexture2D = {
        name: texDef.name,
        texture,
        width: 1,
        height: 1,
      };
      this._textures.push(runtimeTex);

      // Load the actual image asynchronously
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        // Set filter
        const filter = texDef.filter === 'nearest' ? gl.NEAREST : gl.LINEAR;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);

        // Set wrap mode
        const wrap = texDef.wrap === 'clamp' ? gl.CLAMP_TO_EDGE : gl.REPEAT;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);

        // Generate mipmaps if using linear filtering
        if (texDef.filter === 'linear') {
          gl.generateMipmap(gl.TEXTURE_2D);
        }

        // Update dimensions
        runtimeTex.width = image.width;
        runtimeTex.height = image.height;

        console.log(`Loaded texture '${texDef.name}': ${image.width}x${image.height}`);
      };
      image.onerror = () => {
        console.error(`Failed to load texture '${texDef.name}' from ${texDef.source}`);
      };
      image.src = texDef.source;
    }
  }

  /**
   * Compile shaders, create VAOs/FBOs/textures, and build RuntimePass array.
   */
  private initRuntimePasses(): void {
    const gl = this.gl;
    const project = this.project;

    // Shared VAO (all passes use the same fullscreen triangle)
    const sharedVAO = createFullscreenTriangleVAO(gl);

    // Build passes in Shadertoy order
    const passOrder: PassName[] = ['BufferA', 'BufferB', 'BufferC', 'BufferD', 'Image'];

    for (const passName of passOrder) {
      const projectPass = project.passes[passName];
      if (!projectPass) continue;

      // Build fragment shader source (outside try so we can access in catch)
      const fragmentSource = this.buildFragmentShader(projectPass.glslSource, projectPass.channels);

      try {
        // Compile program
        const program = createProgramFromSources(gl, VERTEX_SHADER_SOURCE, fragmentSource);

        // Cache uniform locations
        const uniforms = this.cacheUniformLocations(program);

        // Create ping-pong textures (MUST allocate both for all passes)
        const currentTexture = createRenderTargetTexture(gl, this._width, this._height);
        const previousTexture = createRenderTargetTexture(gl, this._width, this._height);

        // Create framebuffer (attached to current texture)
        const framebuffer = createFramebufferWithColorAttachment(gl, currentTexture);

        // Build RuntimePass
        const runtimePass: RuntimePass = {
          name: passName,
          projectChannels: projectPass.channels,
          vao: sharedVAO,
          uniforms,
          framebuffer,
          currentTexture,
          previousTexture,
        };

        this._passes.push(runtimePass);
      } catch (err) {
        // Store compilation error with source code for context display
        const errorMessage = err instanceof Error ? err.message : String(err);

        // Detect if error is from common.glsl
        const lineMapping = this.getLineMapping();
        const errorLineMatch = errorMessage.match(/ERROR:\s*\d+:(\d+):/);
        let isFromCommon = false;
        let originalLine: number | null = null;

        if (errorLineMatch && this.project.commonSource) {
          const errorLine = parseInt(errorLineMatch[1], 10);
          const commonStartLine = lineMapping.boilerplateLinesBeforeCommon + 2; // +1 for comment, +1 for 1-indexed
          const commonEndLine = commonStartLine + lineMapping.commonLineCount - 1;

          if (errorLine >= commonStartLine && errorLine <= commonEndLine) {
            isFromCommon = true;
            // Calculate line number relative to common.glsl
            originalLine = errorLine - commonStartLine + 1;
          }
        }

        this._compilationErrors.push({
          passName,
          error: errorMessage,
          source: fragmentSource,
          isFromCommon,
          originalLine,
        });
        console.error(`Failed to compile ${passName}:`, errorMessage);
      }
    }
  }

  /**
   * Calculate line number mappings for error reporting.
   * Returns info about where common.glsl code lives in the compiled shader.
   */
  private getLineMapping(): { boilerplateLinesBeforeCommon: number; commonLineCount: number } {
    // +1 for the "// Common code" comment line added before common source
    const boilerplateLinesBeforeCommon = PREAMBLE_LINE_COUNT + 1;

    const commonLineCount = this.project.commonSource
      ? this.project.commonSource.split('\n').length
      : 0;

    return { boilerplateLinesBeforeCommon, commonLineCount };
  }

  /**
   * Build complete fragment shader source with Shadertoy boilerplate.
   *
   * @param userSource - The user's GLSL source code
   * @param channels - Channel configuration for this pass (to detect cubemap textures)
   */
  private buildFragmentShader(userSource: string, channels: ChannelSource[]): string {
    const parts: string[] = [FRAGMENT_PREAMBLE];

    // Common code (if any)
    if (this.project.commonSource) {
      parts.push('// Common code');
      parts.push(this.project.commonSource);
      parts.push('');
    }

    // Shadertoy built-in uniforms
    parts.push(`// Shadertoy built-in uniforms
uniform vec3  iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform int   iFrame;
uniform vec4  iMouse;
uniform vec4  iDate;
uniform float iFrameRate;
uniform vec3  iChannelResolution[4];
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;

// Shader Sandbox touch extensions (not in Shadertoy)
uniform int   iTouchCount;          // Number of active touches (0-10)
uniform vec4  iTouch0;              // Primary touch: (x, y, startX, startY)
uniform vec4  iTouch1;              // Second touch
uniform vec4  iTouch2;              // Third touch
uniform float iPinch;               // Pinch scale factor (1.0 = no pinch)
uniform float iPinchDelta;          // Pinch change since last frame
uniform vec2  iPinchCenter;         // Center point of pinch gesture
`);

    // Array uniform blocks (UBOs) - auto-injected so user doesn't need to declare them
    for (const ubo of this._ubos) {
      parts.push(`// Array uniform: ${ubo.name}`);
      parts.push(`layout(std140) uniform _ub_${ubo.name} {`);
      parts.push(`  ${glslTypeName(ubo.def.type)} ${ubo.name}[${ubo.def.count}];`);
      parts.push(`};`);
      parts.push('');
    }

    // Preprocess user shader code to handle cubemap-style texture sampling
    const processedSource = this.preprocessCubemapTextures(userSource, channels);

    // User shader code
    parts.push('// User shader code');
    parts.push(processedSource);
    parts.push('');

    // mainImage() wrapper
    parts.push(`// Main wrapper
out vec4 fragColor;

void main() {
  mainImage(fragColor, gl_FragCoord.xy);
}`);

    return parts.join('\n');
  }

  /**
   * Preprocess shader to convert cubemap-style texture() calls to equirectangular.
   *
   * Uses the channel configuration to determine which channels are cubemaps.
   * Only channels explicitly marked as `type: 'cubemap'` in config.json will have
   * their texture() calls wrapped with _st_dirToEquirect().
   *
   * @param source - User's GLSL source code
   * @param channels - Channel configuration for this pass
   */
  private preprocessCubemapTextures(source: string, channels: ChannelSource[]): string {
    // Build set of channel names that are cubemaps
    const cubemapChannels = new Set<string>();
    channels.forEach((ch, i) => {
      if (ch.kind === 'texture' && ch.cubemap) {
        cubemapChannels.add(`iChannel${i}`);
      }
    });

    // If no cubemap channels, return source unchanged
    if (cubemapChannels.size === 0) {
      return source;
    }

    // Match: texture(iChannelN, ...)
    const textureCallRegex = /texture\s*\(\s*(iChannel[0-3])\s*,\s*([^)]+)\)/g;

    return source.replace(textureCallRegex, (match, channel, coord) => {
      // Only wrap if this channel is explicitly marked as cubemap
      if (cubemapChannels.has(channel)) {
        return `texture(${channel}, _st_dirToEquirect(${coord}))`;
      } else {
        return match;
      }
    });
  }

  // ===========================================================================
  // Pass Execution
  // ===========================================================================

  private executePass(
    runtimePass: RuntimePass,
    builtinUniforms: {
      iResolution: readonly [number, number, number];
      iTime: number;
      iTimeDelta: number;
      iFrame: number;
      iMouse: [number, number, number, number];
      iDate: readonly [number, number, number, number];
      iFrameRate: number;
      iTouchCount: number;
      iTouch: [[number, number, number, number], [number, number, number, number], [number, number, number, number]];
      iPinch: number;
      iPinchDelta: number;
      iPinchCenter: [number, number];
    }
  ): void {
    const gl = this.gl;

    // Bind framebuffer (write to current texture)
    gl.bindFramebuffer(gl.FRAMEBUFFER, runtimePass.framebuffer);

    // Use program
    gl.useProgram(runtimePass.uniforms.program);

    // Bind VAO
    gl.bindVertexArray(runtimePass.vao);

    // Bind built-in uniforms
    this.bindBuiltinUniforms(runtimePass.uniforms, builtinUniforms);

    // Bind custom uniforms
    this.bindCustomUniforms(runtimePass.uniforms);

    // Bind iChannel textures and their resolutions
    this.bindChannelTextures(runtimePass);

    // Draw fullscreen triangle
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Unbind
    gl.bindVertexArray(null);
    gl.useProgram(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  private bindBuiltinUniforms(
    uniforms: PassUniformLocations,
    values: {
      iResolution: readonly [number, number, number];
      iTime: number;
      iTimeDelta: number;
      iFrame: number;
      iMouse: [number, number, number, number];
      iDate: readonly [number, number, number, number];
      iFrameRate: number;
      iTouchCount: number;
      iTouch: [[number, number, number, number], [number, number, number, number], [number, number, number, number]];
      iPinch: number;
      iPinchDelta: number;
      iPinchCenter: [number, number];
    }
  ): void {
    const gl = this.gl;

    if (uniforms.iResolution) {
      gl.uniform3f(uniforms.iResolution, values.iResolution[0], values.iResolution[1], values.iResolution[2]);
    }

    if (uniforms.iTime) {
      gl.uniform1f(uniforms.iTime, values.iTime);
    }

    if (uniforms.iTimeDelta) {
      gl.uniform1f(uniforms.iTimeDelta, values.iTimeDelta);
    }

    if (uniforms.iFrame) {
      gl.uniform1i(uniforms.iFrame, values.iFrame);
    }

    if (uniforms.iMouse) {
      gl.uniform4f(uniforms.iMouse, values.iMouse[0], values.iMouse[1], values.iMouse[2], values.iMouse[3]);
    }

    if (uniforms.iDate) {
      gl.uniform4f(uniforms.iDate, values.iDate[0], values.iDate[1], values.iDate[2], values.iDate[3]);
    }

    if (uniforms.iFrameRate) {
      gl.uniform1f(uniforms.iFrameRate, values.iFrameRate);
    }

    // Touch uniforms
    if (uniforms.iTouchCount) {
      gl.uniform1i(uniforms.iTouchCount, values.iTouchCount);
    }

    // Bind individual touch points (iTouch0, iTouch1, iTouch2)
    for (let i = 0; i < 3; i++) {
      const loc = uniforms.iTouch[i];
      if (loc) {
        const t = values.iTouch[i];
        gl.uniform4f(loc, t[0], t[1], t[2], t[3]);
      }
    }

    if (uniforms.iPinch) {
      gl.uniform1f(uniforms.iPinch, values.iPinch);
    }

    if (uniforms.iPinchDelta) {
      gl.uniform1f(uniforms.iPinchDelta, values.iPinchDelta);
    }

    if (uniforms.iPinchCenter) {
      gl.uniform2f(uniforms.iPinchCenter, values.iPinchCenter[0], values.iPinchCenter[1]);
    }
  }

  /**
   * Bind custom uniform values to the current program.
   */
  private bindCustomUniforms(uniforms: PassUniformLocations): void {
    const gl = this.gl;

    // Upload dirty UBOs
    for (const ubo of this._ubos) {
      if (!ubo.dirty) continue;
      gl.bindBuffer(gl.UNIFORM_BUFFER, ubo.buffer);
      gl.bufferSubData(gl.UNIFORM_BUFFER, 0, ubo.paddedData);
      ubo.dirty = false;
    }

    for (const [name, def, value] of this._uniforms.entries()) {
      // Skip array uniforms — they're handled via UBOs above
      if (isArrayUniform(def)) continue;

      const location = uniforms.custom.get(name);
      if (!location) continue;

      switch (def.type) {
        case 'float':
          gl.uniform1f(location, value as number);
          break;
        case 'int':
          gl.uniform1i(location, value as number);
          break;
        case 'bool':
          gl.uniform1i(location, (value as boolean) ? 1 : 0);
          break;
        case 'vec2': {
          const v = value as number[];
          gl.uniform2f(location, v[0], v[1]);
          break;
        }
        case 'vec3': {
          const v = value as number[];
          gl.uniform3f(location, v[0], v[1], v[2]);
          break;
        }
        case 'vec4': {
          const v = value as number[];
          gl.uniform4f(location, v[0], v[1], v[2], v[3]);
          break;
        }
      }
    }
  }

  private bindChannelTextures(runtimePass: RuntimePass): void {
    const gl = this.gl;

    for (let i = 0; i < 4; i++) {
      const channelSource = runtimePass.projectChannels[i];
      const texture = this.resolveChannelTexture(channelSource);
      const resolution = this.resolveChannelResolution(channelSource);

      // Bind texture to texture unit i
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // Set uniform to use texture unit i
      const uniformLoc = runtimePass.uniforms.iChannel[i];
      if (uniformLoc) {
        gl.uniform1i(uniformLoc, i);
      }

      // Set iChannelResolution[i]
      const resLoc = runtimePass.uniforms.iChannelResolution[i];
      if (resLoc) {
        gl.uniform3f(resLoc, resolution[0], resolution[1], 1.0);
      }
    }
  }

  /**
   * Resolve a ChannelSource to an actual WebGLTexture to bind.
   */
  private resolveChannelTexture(source: ChannelSource): WebGLTexture {
    switch (source.kind) {
      case 'none':
        // Unused channel → bind black texture
        if (!this._blackTexture) {
          throw new Error('Black texture not initialized');
        }
        return this._blackTexture;

      case 'buffer': {
        // Buffer reference → find RuntimePass and return current or previous texture
        const targetPass = this._passes.find((p) => p.name === source.buffer);
        if (!targetPass) {
          throw new Error(`Buffer '${source.buffer}' not found`);
        }

        // Default to previous frame (safer, matches common use case)
        // Only use current frame if explicitly requested with current: true
        return source.current ? targetPass.currentTexture : targetPass.previousTexture;
      }

      case 'texture': {
        // External texture → find RuntimeTexture by name
        const tex = this._textures.find((t) => t.name === source.name);
        if (!tex) {
          throw new Error(`Texture '${source.name}' not found`);
        }
        return tex.texture;
      }

      case 'keyboard':
        // Keyboard texture (always available)
        if (!this._keyboardTexture) {
          throw new Error('Internal error: keyboard texture not initialized');
        }
        return this._keyboardTexture.texture;

      default:
        // Exhaustive check
        const _exhaustive: never = source;
        throw new Error(`Unknown channel source: ${JSON.stringify(_exhaustive)}`);
    }
  }

  /**
   * Resolve a ChannelSource to its resolution [width, height].
   * Returns [0, 0] for unused channels.
   */
  private resolveChannelResolution(source: ChannelSource): [number, number] {
    switch (source.kind) {
      case 'none':
        return [0, 0];

      case 'buffer': {
        // Buffer passes use the engine's current resolution
        return [this._width, this._height];
      }

      case 'texture': {
        // External texture - find its dimensions
        const tex = this._textures.find((t) => t.name === source.name);
        if (!tex) {
          return [0, 0];
        }
        return [tex.width, tex.height];
      }

      case 'keyboard':
        // Keyboard texture is always 256x3
        return [256, 3];

      default:
        // Exhaustive check
        const _exhaustive: never = source;
        throw new Error(`Unknown channel source: ${JSON.stringify(_exhaustive)}`);
    }
  }

  /**
   * Swap current and previous textures for a pass (ping-pong).
   * Also reattach framebuffer to new current texture.
   */
  private swapPassTextures(pass: RuntimePass): void {
    const gl = this.gl;

    // Swap texture references
    const temp = pass.currentTexture;
    pass.currentTexture = pass.previousTexture;
    pass.previousTexture = temp;

    // Re-attach framebuffer to new current texture
    gl.bindFramebuffer(gl.FRAMEBUFFER, pass.framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      pass.currentTexture,
      0
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
}
