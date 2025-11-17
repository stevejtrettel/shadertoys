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
} from '../project/types';

import {
  EngineOptions,
  ShadertoyEngine as ShadertoyEngineInterface,
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
// ShadertoyEngine Implementation
// =============================================================================

export class ShadertoyEngine implements ShadertoyEngineInterface {
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

    // 3. Initialize external textures (from project.textures)
    //    NOTE: This requires actual image data; for now just stub the array.
    //    Real implementation would load images here.
    this.initProjectTextures();

    // 4. Compile shaders + create runtime passes
    this.initRuntimePasses();
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
   * Run one full frame of all passes.
   *
   * @param timeSeconds - global time in seconds (monotone, from App)
   * @param mouse - iMouse as [x, y, clickX, clickY]
   */
  step(timeSeconds: number, mouse: [number, number, number, number]): void {
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

    // Clear arrays
    this._passes = [];
    this._textures = [];
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

      // Build fragment shader source
      const fragmentSource = this.buildFragmentShader(projectPass.glslSource);

      // Compile program
      const program = createProgramFromSources(gl, VERTEX_SHADER_SOURCE, fragmentSource);

      // Cache uniform locations
      const uniforms: PassUniformLocations = {
        program,
        iResolution: gl.getUniformLocation(program, 'iResolution'),
        iTime: gl.getUniformLocation(program, 'iTime'),
        iTimeDelta: gl.getUniformLocation(program, 'iTimeDelta'),
        iFrame: gl.getUniformLocation(program, 'iFrame'),
        iMouse: gl.getUniformLocation(program, 'iMouse'),
        iChannel: [
          gl.getUniformLocation(program, 'iChannel0'),
          gl.getUniformLocation(program, 'iChannel1'),
          gl.getUniformLocation(program, 'iChannel2'),
          gl.getUniformLocation(program, 'iChannel3'),
        ],
      };

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
    }
  }

  /**
   * Build complete fragment shader source with Shadertoy boilerplate.
   */
  private buildFragmentShader(userSource: string): string {
    const lines: string[] = [];

    // Version and precision
    lines.push('#version 300 es');
    lines.push('precision highp float;');
    lines.push('');

    // Automatic compatibility helpers for Shadertoy cubemap textures
    lines.push('// Shadertoy compatibility: equirectangular texture sampling');
    lines.push('const float ST_PI = 3.14159265359;');
    lines.push('const float ST_TWOPI = 6.28318530718;');
    lines.push('vec2 _st_dirToEquirect(vec3 dir) {');
    lines.push('  float phi = atan(dir.z, dir.x);');
    lines.push('  float theta = asin(dir.y);');
    lines.push('  return vec2(phi / ST_TWOPI + 0.5, theta / ST_PI + 0.5);');
    lines.push('}');
    lines.push('');

    // Common code (if any)
    if (this.project.commonSource) {
      lines.push('// Common code');
      lines.push(this.project.commonSource);
      lines.push('');
    }

    // Shadertoy built-in uniforms
    lines.push('// Shadertoy built-in uniforms');
    lines.push('uniform vec3  iResolution;');
    lines.push('uniform float iTime;');
    lines.push('uniform float iTimeDelta;');
    lines.push('uniform int   iFrame;');
    lines.push('uniform vec4  iMouse;');
    lines.push('uniform sampler2D iChannel0;');
    lines.push('uniform sampler2D iChannel1;');
    lines.push('uniform sampler2D iChannel2;');
    lines.push('uniform sampler2D iChannel3;');
    lines.push('');

    // Preprocess user shader code to handle cubemap-style texture sampling
    // Convert: texture(iChannelN, vec3_expr) -> texture(iChannelN, _st_dirToEquirect(vec3_expr))
    let processedSource = this.preprocessCubemapTextures(userSource);

    // User shader code
    lines.push('// User shader code');
    lines.push(processedSource);
    lines.push('');

    // mainImage() wrapper
    lines.push('// Main wrapper');
    lines.push('out vec4 fragColor;');
    lines.push('');
    lines.push('void main() {');
    lines.push('  mainImage(fragColor, gl_FragCoord.xy);');
    lines.push('}');

    return lines.join('\n');
  }

  /**
   * Preprocess shader to convert cubemap-style texture() calls to equirectangular.
   * Detects: texture(iChannelN, vec3_expr) and converts to texture(iChannelN, _st_dirToEquirect(vec3_expr))
   */
  private preprocessCubemapTextures(source: string): string {
    // Match: texture(iChannelN, ...)
    const textureCallRegex = /texture\s*\(\s*(iChannel[0-3])\s*,\s*([^)]+)\)/g;

    return source.replace(textureCallRegex, (match, channel, coord) => {
      // Heuristic: if coord contains indicators of 2D UV coordinates, leave it alone
      // Otherwise, assume it's a 3D direction vector and wrap it
      const is2DTexture =
        coord.includes('fragCoord') ||   // Using fragCoord directly
        coord.includes('/') ||            // Division (likely uv calculation)
        /\.xy\s*$/.test(coord.trim()) ||  // Ends with .xy swizzle
        /\.st\s*$/.test(coord.trim()) ||  // Ends with .st swizzle
        /^vec2\s*\(/.test(coord.trim());  // Starts with vec2(

      if (is2DTexture) {
        // Leave 2D texture calls unchanged
        return match;
      } else {
        // Wrap 3D direction with equirectangular conversion
        return `texture(${channel}, _st_dirToEquirect(${coord}))`;
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

    // Bind iChannel textures
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
  }

  private bindChannelTextures(runtimePass: RuntimePass): void {
    const gl = this.gl;

    for (let i = 0; i < 4; i++) {
      const channelSource = runtimePass.projectChannels[i];
      const texture = this.resolveChannelTexture(channelSource, runtimePass.name);

      // Bind texture to texture unit i
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // Set uniform to use texture unit i
      const uniformLoc = runtimePass.uniforms.iChannel[i];
      if (uniformLoc) {
        gl.uniform1i(uniformLoc, i);
      }
    }
  }

  /**
   * Resolve a ChannelSource to an actual WebGLTexture to bind.
   */
  private resolveChannelTexture(source: ChannelSource, currentPassName: PassName): WebGLTexture {
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

        // Auto-detect self-reference: if a buffer references itself, always use previous texture
        // This prevents feedback loops and enables temporal accumulation (like path tracers)
        const isSelfReference = source.buffer === currentPassName;
        return isSelfReference ? targetPass.previousTexture : targetPass.currentTexture;
      }

      case 'texture2D': {
        // External texture → find RuntimeTexture2D by name
        const tex = this._textures.find((t) => t.name === source.name);
        if (!tex) {
          throw new Error(`Texture '${source.name}' not found`);
        }
        return tex.texture;
      }

      case 'keyboard':
        // Keyboard texture (optional feature)
        if (!this._keyboardTexture) {
          throw new Error('Keyboard texture not implemented');
        }
        return this._keyboardTexture.texture;

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
