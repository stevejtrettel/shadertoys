/**
 * Core - WebGL2 Primitives Wrapper
 *
 * Pure WebGL operations with no knowledge of Project structure.
 * Handles shader compilation, texture/framebuffer creation, uniform binding, and drawing.
 *
 * This class is NOT exported publicly - it's an internal implementation detail of Engine.
 */

/**
 * Built-in full-screen quad vertex shader.
 * Used for all passes (authors only write fragment shaders).
 */
const VERTEX_SHADER_SOURCE = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

export class Core {
  readonly gl: WebGL2RenderingContext
  readonly canvas: HTMLCanvasElement

  /**
   * Create Core instance and initialize WebGL2 context.
   *
   * @param canvas - HTML canvas element
   * @throws Error if WebGL2 not supported
   */
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas

    // Get WebGL2 context
    const gl = canvas.getContext('webgl2')
    if (!gl) {
      throw new Error('WebGL2 not supported')
    }

    this.gl = gl

    // Enable required extensions for float rendering
    this.enableFloatExtensions()

    this.setupGLState()
  }

  // ==========================================================================
  // SHADER COMPILATION
  // ==========================================================================

  /**
   * Compile a complete shader program from fragment source.
   * Uses built-in vertex shader automatically.
   *
   * @param fragmentSource - GLSL fragment shader source code
   * @returns Compiled and linked WebGL program
   * @throws Error with detailed message if compilation or linking fails
   */
  compileProgram(fragmentSource: string): WebGLProgram {
    const gl = this.gl

    // Compile shaders
    const vertexShader = this.compileShader(VERTEX_SHADER_SOURCE, gl.VERTEX_SHADER)
    const fragmentShader = this.compileShader(fragmentSource, gl.FRAGMENT_SHADER)

    // Create program
    const program = gl.createProgram()
    if (!program) {
      throw new Error('Failed to create shader program')
    }

    // Attach and link
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    // Check linking status
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program)
      throw new Error(`Program linking failed:\n${log}`)
    }

    // Clean up shaders (no longer needed after linking)
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)

    return program
  }

  /**
   * Compile a single shader (vertex or fragment).
   *
   * @param source - GLSL shader source code
   * @param type - gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
   * @returns Compiled shader object
   * @throws Error with shader type and compiler log if compilation fails
   */
  private compileShader(source: string, type: number): WebGLShader {
    const gl = this.gl

    const shader = gl.createShader(type)
    if (!shader) {
      throw new Error('Failed to create shader')
    }

    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    // Check compilation status
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader)
      const shaderType = type === gl.VERTEX_SHADER ? 'vertex' : 'fragment'
      throw new Error(`${shaderType} shader compilation failed:\n${log}`)
    }

    return shader
  }

  // ==========================================================================
  // TEXTURE & FRAMEBUFFER CREATION
  // ==========================================================================

  /**
   * Create a texture with specified format and size.
   *
   * @param width - Texture width in pixels
   * @param height - Texture height in pixels
   * @param format - Internal format ('rgba8', 'rgba16f', 'rgba32f')
   * @param filter - Filtering mode ('nearest' or 'linear')
   * @param wrap - Wrap mode ('clamp' or 'repeat')
   * @returns Created texture object
   * @throws Error if texture creation fails
   */
  createTexture(
    width: number,
    height: number,
    format: 'rgba8' | 'rgba16f' | 'rgba32f',
    filter: 'nearest' | 'linear',
    wrap: 'clamp' | 'repeat'
  ): WebGLTexture {
    const gl = this.gl

    const texture = gl.createTexture()
    if (!texture) {
      throw new Error('Failed to create texture')
    }

    gl.bindTexture(gl.TEXTURE_2D, texture)

    // Get format constants
    const formatInfo = this.getTextureFormat(format)

    // Allocate texture storage
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      formatInfo.internalFormat,
      width,
      height,
      0,
      formatInfo.format,
      formatInfo.type,
      null
    )

    // Set filter mode
    const filterMode = filter === 'linear' ? gl.LINEAR : gl.NEAREST
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filterMode)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filterMode)

    // Set wrap mode
    const wrapMode = wrap === 'repeat' ? gl.REPEAT : gl.CLAMP_TO_EDGE
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapMode)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapMode)

    gl.bindTexture(gl.TEXTURE_2D, null)

    return texture
  }

  /**
   * Create a framebuffer attached to a texture.
   *
   * @param texture - Texture to attach
   * @returns Created framebuffer object
   * @throws Error with status string if framebuffer incomplete
   */
  createFramebuffer(texture: WebGLTexture): WebGLFramebuffer {
    const gl = this.gl

    const fbo = gl.createFramebuffer()
    if (!fbo) {
      throw new Error('Failed to create framebuffer')
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    )

    // Check completeness
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      const statusString = this.getFramebufferStatusString(status)
      throw new Error(`Framebuffer incomplete: ${statusString}`)
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    return fbo
  }

  /**
   * Load an image as a WebGL texture.
   *
   * @param url - Image file path or URL
   * @param filter - Filtering mode
   * @param wrap - Wrap mode
   * @returns Promise resolving to texture object
   * @throws Error if image fails to load
   */
  async loadImageTexture(
    url: string,
    filter: 'nearest' | 'linear',
    wrap: 'clamp' | 'repeat'
  ): Promise<WebGLTexture> {
    const gl = this.gl

    // Load image
    const image = await this.loadImage(url)

    // Create texture
    const texture = gl.createTexture()
    if (!texture) {
      throw new Error('Failed to create texture')
    }

    gl.bindTexture(gl.TEXTURE_2D, texture)

    // Upload image data
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      image
    )

    // Set filter mode
    const filterMode = filter === 'linear' ? gl.LINEAR : gl.NEAREST
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filterMode)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filterMode)

    // Set wrap mode
    const wrapMode = wrap === 'repeat' ? gl.REPEAT : gl.CLAMP_TO_EDGE
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapMode)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapMode)

    gl.bindTexture(gl.TEXTURE_2D, null)

    return texture
  }

  // ==========================================================================
  // FULL-SCREEN QUAD
  // ==========================================================================

  /**
   * Create a VAO for drawing a full-screen quad.
   *
   * @returns VAO containing full-screen quad geometry
   * @throws Error if VAO or VBO creation fails
   */
  createQuadVAO(): WebGLVertexArrayObject {
    const gl = this.gl

    // Full-screen quad vertices (2 triangles covering [-1, 1] x [-1, 1])
    const vertices = new Float32Array([
      -1, -1,  // Triangle 1
       1, -1,
      -1,  1,
      -1,  1,  // Triangle 2
       1, -1,
       1,  1
    ])

    // Create VAO
    const vao = gl.createVertexArray()
    if (!vao) {
      throw new Error('Failed to create VAO')
    }

    // Create VBO
    const vbo = gl.createBuffer()
    if (!vbo) {
      throw new Error('Failed to create VBO')
    }

    // Bind and upload
    gl.bindVertexArray(vao)
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    // Set vertex attribute (position at location 0)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    // Unbind
    gl.bindVertexArray(null)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    return vao
  }

  /**
   * Draw a full-screen quad using the given VAO.
   *
   * @param vao - VAO containing quad geometry
   */
  drawQuad(vao: WebGLVertexArrayObject): void {
    const gl = this.gl
    gl.bindVertexArray(vao)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    gl.bindVertexArray(null)
  }

  // ==========================================================================
  // UNIFORM BINDING
  // ==========================================================================

  /**
   * Bind a uniform value to a program.
   * Auto-detects type from value.
   *
   * @param program - Shader program
   * @param name - Uniform name (must match shader)
   * @param value - Uniform value (scalar or vector)
   * @throws Error if array length is invalid
   */
  bindUniform(
    program: WebGLProgram,
    name: string,
    value: number | boolean | number[]
  ): void {
    const gl = this.gl
    const location = gl.getUniformLocation(program, name)

    // If location is null, uniform doesn't exist or was optimized out
    if (location === null) {
      return
    }

    // Bind based on type
    if (typeof value === 'boolean') {
      gl.uniform1i(location, value ? 1 : 0)
    } else if (typeof value === 'number') {
      gl.uniform1f(location, value)
    } else if (Array.isArray(value)) {
      switch (value.length) {
        case 2:
          gl.uniform2fv(location, value)
          break
        case 3:
          gl.uniform3fv(location, value)
          break
        case 4:
          gl.uniform4fv(location, value)
          break
        default:
          throw new Error(`Invalid uniform array length: ${value.length}`)
      }
    }
  }

  /**
   * Bind an integer uniform to a program.
   * Used specifically for uFrame.
   *
   * @param program - Shader program
   * @param name - Uniform name
   * @param value - Integer value
   */
  bindIntUniform(
    program: WebGLProgram,
    name: string,
    value: number
  ): void {
    const gl = this.gl
    const location = gl.getUniformLocation(program, name)

    if (location === null) {
      return
    }

    gl.uniform1i(location, value)
  }

  /**
   * Bind a texture to a sampler uniform.
   *
   * @param program - Shader program
   * @param name - Sampler uniform name
   * @param texture - Texture to bind
   * @param unit - Texture unit index (0, 1, 2, ...)
   */
  bindTexture(
    program: WebGLProgram,
    name: string,
    texture: WebGLTexture,
    unit: number
  ): void {
    const gl = this.gl
    const location = gl.getUniformLocation(program, name)

    if (location === null) {
      return
    }

    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.uniform1i(location, unit)
  }

  // ==========================================================================
  // RENDERING & STATE
  // ==========================================================================

  /**
   * Clear a framebuffer (or screen) to a solid color.
   *
   * @param fbo - Framebuffer to clear (null for screen)
   * @param color - RGBA color in range [0, 1]
   */
  clear(
    fbo: WebGLFramebuffer | null,
    color: [number, number, number, number]
  ): void {
    const gl = this.gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.clearColor(color[0], color[1], color[2], color[3])
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  /**
   * Set the viewport.
   *
   * @param width - Viewport width
   * @param height - Viewport height
   */
  setViewport(width: number, height: number): void {
    this.gl.viewport(0, 0, width, height)
  }

  // ==========================================================================
  // READING
  // ==========================================================================

  /**
   * Read pixels from a framebuffer (or screen).
   *
   * @param fbo - Framebuffer to read from (null for screen)
   * @param width - Width in pixels
   * @param height - Height in pixels
   * @returns RGBA pixel data (4 bytes per pixel)
   */
  readPixels(
    fbo: WebGLFramebuffer | null,
    width: number,
    height: number
  ): Uint8Array {
    const gl = this.gl

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)

    const pixels = new Uint8Array(width * height * 4)
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    return pixels
  }

  // ==========================================================================
  // PRIVATE UTILITIES
  // ==========================================================================

  /**
   * Enable required WebGL extensions for float rendering.
   */
  private enableFloatExtensions(): void {
    const gl = this.gl

    // Enable rendering to float textures
    const extColorBufferFloat = gl.getExtension('EXT_color_buffer_float')
    if (!extColorBufferFloat) {
      console.warn('EXT_color_buffer_float not supported - rgba32f textures may not work')
    }

    // Enable linear filtering for float textures (optional, but nice to have)
    const extTextureFloatLinear = gl.getExtension('OES_texture_float_linear')
    if (!extTextureFloatLinear) {
      console.warn('OES_texture_float_linear not supported - float textures will use nearest filtering')
    }
  }

  /**
   * Set up initial WebGL state.
   */
  private setupGLState(): void {
    const gl = this.gl
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.BLEND)
  }

  /**
   * Map project format strings to WebGL constants.
   *
   * @param format - Project format string
   * @returns Object with WebGL constants
   */
  private getTextureFormat(format: 'rgba8' | 'rgba16f' | 'rgba32f'): {
    internalFormat: number
    format: number
    type: number
  } {
    const gl = this.gl

    switch (format) {
      case 'rgba8':
        return {
          internalFormat: gl.RGBA8,
          format: gl.RGBA,
          type: gl.UNSIGNED_BYTE
        }
      case 'rgba16f':
        return {
          internalFormat: gl.RGBA16F,
          format: gl.RGBA,
          type: gl.HALF_FLOAT
        }
      case 'rgba32f':
        return {
          internalFormat: gl.RGBA32F,
          format: gl.RGBA,
          type: gl.FLOAT
        }
    }
  }

  /**
   * Get human-readable framebuffer status string.
   *
   * @param status - WebGL framebuffer status constant
   * @returns Human-readable status string
   */
  private getFramebufferStatusString(status: number): string {
    const gl = this.gl

    switch (status) {
      case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
        return 'FRAMEBUFFER_INCOMPLETE_ATTACHMENT'
      case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
        return 'FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT'
      case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
        return 'FRAMEBUFFER_INCOMPLETE_DIMENSIONS'
      case gl.FRAMEBUFFER_UNSUPPORTED:
        return 'FRAMEBUFFER_UNSUPPORTED'
      case gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE:
        return 'FRAMEBUFFER_INCOMPLETE_MULTISAMPLE'
      default:
        return `UNKNOWN (${status})`
    }
  }

  /**
   * Load an image from a URL.
   *
   * @param url - Image file path or URL
   * @returns Promise resolving to loaded image
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error(`Failed to load image: ${url}`))
      image.src = url
    })
  }
}
