/**
 * Engine - WebGL Execution Orchestrator
 *
 * Executes ProjectDefinition using WebGL.
 * Manages resources, state, and pass execution.
 */

import { Core } from '@/core/Core'
import type { ProjectDefinition, PassDefinition, BufferConfig } from '@/project/types'
import type { FramebufferPair } from './types'
import { generateUniforms, compileShader } from '@/project/compiler'

/**
 * Engine executes a ProjectDefinition using WebGL.
 */
export class Engine {
  private core: Core
  private canvas: HTMLCanvasElement
  private project: ProjectDefinition

  // State
  private _frame: number = 0
  private destroyed: boolean = false

  // WebGL resources
  private programs: Map<string, WebGLProgram> = new Map()
  private initPrograms: Map<string, WebGLProgram> = new Map()  // Init shaders for buffers
  private framebuffers: Map<string, FramebufferPair> = new Map()
  private textures: Map<string, WebGLTexture> = new Map()
  private quadVAO: WebGLVertexArrayObject | null = null

  // Parameter values (both built-ins and user-defined)
  private paramValues: Map<string, number | boolean | number[]> = new Map()

  /**
   * Create a new Engine (async for texture loading).
   *
   * @param project - Compiled ProjectDefinition
   * @param canvas - HTML canvas element
   * @returns Promise resolving to ready Engine
   * @throws Error if WebGL2 not supported or initialization fails
   */
  static async create(
    project: ProjectDefinition,
    canvas: HTMLCanvasElement
  ): Promise<Engine> {
    const engine = new Engine(project, canvas)
    await engine.initialize()
    return engine
  }

  /**
   * Private constructor (use Engine.create instead).
   */
  private constructor(project: ProjectDefinition, canvas: HTMLCanvasElement) {
    this.project = project
    this.canvas = canvas
    this.core = new Core(canvas)
  }

  /**
   * Initialize WebGL resources and load textures.
   */
  private async initialize(): Promise<void> {
    this.validateProject()
    this.compileAllPrograms()
    this.compileInitPrograms()
    this.createFramebuffers()
    await this.loadTextures()
    this.createQuadVAO()
    this.initializeParameters()
    this.runInitShaders()
  }

  // ==========================================================================
  // PUBLIC API - Execution
  // ==========================================================================

  /**
   * Execute all passes in order, incrementing frame count.
   */
  step(): void {
    this.checkNotDestroyed()

    this._frame += 1

    for (const pass of this.project.passes) {
      this.executePass(pass)
    }
  }

  /**
   * Reset simulation to initial state.
   */
  reset(): void {
    this.checkNotDestroyed()

    this._frame = 0

    // Clear all buffers
    for (const name of Object.keys(this.project.buffers)) {
      this.clearBuffer(name)
    }

    // Run init shaders
    this.runInitShaders()
  }

  // ==========================================================================
  // PUBLIC API - Parameters & Uniforms
  // ==========================================================================

  /**
   * Set a parameter or built-in uniform value.
   *
   * @param name - Parameter name
   * @param value - Parameter value
   * @throws Error if parameter doesn't exist
   */
  setParameter(name: string, value: number | boolean | number[]): void {
    this.checkNotDestroyed()

    // Check if it's a valid parameter
    const isBuiltIn = ['uResolution', 'uTime', 'uDeltaTime', 'uMouse'].includes(name)
    const isUserParam = this.project.params && name in this.project.params

    if (!isBuiltIn && !isUserParam) {
      throw new Error(`Parameter '${name}' not found`)
    }

    this.paramValues.set(name, value)
  }

  /**
   * Get current value of a parameter or built-in uniform.
   *
   * @param name - Parameter name
   * @returns Current parameter value
   * @throws Error if parameter doesn't exist
   */
  getParameter(name: string): number | boolean | number[] {
    this.checkNotDestroyed()

    const value = this.paramValues.get(name)
    if (value === undefined) {
      throw new Error(`Parameter '${name}' not found`)
    }

    return value
  }

  // ==========================================================================
  // PUBLIC API - WebGL Lifecycle
  // ==========================================================================

  /**
   * Resize canvas and reallocate framebuffers.
   *
   * @param width - New canvas width
   * @param height - New canvas height
   */
  resize(width: number, height: number): void {
    this.checkNotDestroyed()

    const gl = this.core.gl

    // Update canvas size
    this.canvas.width = width
    this.canvas.height = height

    // Reallocate inherit buffers
    for (const [name, config] of Object.entries(this.project.buffers)) {
      if (config.resolution !== 'inherit') {
        continue
      }

      const pair = this.framebuffers.get(name)!

      // Delete old resources
      gl.deleteFramebuffer(pair.main.fbo)
      gl.deleteTexture(pair.main.texture)
      if (pair.alt) {
        gl.deleteFramebuffer(pair.alt.fbo)
        gl.deleteTexture(pair.alt.texture)
      }

      // Create new textures and framebuffers
      const mainTexture = this.core.createTexture(
        width,
        height,
        config.format,
        config.filter,
        config.wrap
      )
      const mainFbo = this.core.createFramebuffer(mainTexture)

      pair.main.texture = mainTexture
      pair.main.fbo = mainFbo
      pair.width = width
      pair.height = height

      if (config.pingPong && pair.alt) {
        const altTexture = this.core.createTexture(
          width,
          height,
          config.format,
          config.filter,
          config.wrap
        )
        const altFbo = this.core.createFramebuffer(altTexture)

        pair.alt.texture = altTexture
        pair.alt.fbo = altFbo
      }

      // Clear new buffers
      this.clearBuffer(name)
    }

    // Update uResolution
    this.setParameter('uResolution', [width, height, width / height])
  }

  /**
   * Hot-reload a single pass with new compiled shader source.
   *
   * @param passName - Name of pass to reload
   * @param compiledShader - New compiled shader source
   * @throws Error if pass not found or compilation fails
   */
  reloadPass(passName: string, compiledShader: string): void {
    this.checkNotDestroyed()

    const gl = this.core.gl

    // Find pass
    const pass = this.project.passes.find(p => p.name === passName)
    if (!pass) {
      throw new Error(`Pass '${passName}' not found`)
    }

    try {
      // Compile new program
      const newProgram = this.core.compileProgram(compiledShader)

      // Delete old program
      const oldProgram = this.programs.get(passName)
      if (oldProgram) {
        gl.deleteProgram(oldProgram)
      }

      // Store new program
      this.programs.set(passName, newProgram)

      // Reset simulation
      this.reset()
    } catch (error) {
      throw new Error(`Failed to reload pass '${passName}': ${error}`)
    }
  }

  /**
   * Read pixel data from a buffer or the screen.
   *
   * @param bufferName - Buffer name or 'screen'
   * @returns ImageData with RGBA pixel data
   * @throws Error if buffer not found
   */
  readBuffer(bufferName: string): ImageData {
    this.checkNotDestroyed()

    let fbo: WebGLFramebuffer | null
    let width: number
    let height: number

    if (bufferName === 'screen') {
      fbo = null
      width = this.canvas.width
      height = this.canvas.height
    } else {
      const pair = this.framebuffers.get(bufferName)
      if (!pair) {
        throw new Error(`Buffer '${bufferName}' not found`)
      }

      fbo = pair.main.fbo
      width = pair.width
      height = pair.height
    }

    const pixels = this.core.readPixels(fbo, width, height)
    return new ImageData(new Uint8ClampedArray(pixels), width, height)
  }

  /**
   * Clean up all WebGL resources.
   */
  destroy(): void {
    if (this.destroyed) {
      return
    }

    const gl = this.core.gl

    this.destroyed = true

    // Delete quad VAO
    if (this.quadVAO) {
      gl.deleteVertexArray(this.quadVAO)
    }

    // Delete external textures
    for (const texture of this.textures.values()) {
      gl.deleteTexture(texture)
    }

    // Delete framebuffers
    for (const pair of this.framebuffers.values()) {
      gl.deleteFramebuffer(pair.main.fbo)
      gl.deleteTexture(pair.main.texture)
      if (pair.alt) {
        gl.deleteFramebuffer(pair.alt.fbo)
        gl.deleteTexture(pair.alt.texture)
      }
    }

    // Delete programs
    for (const program of this.programs.values()) {
      gl.deleteProgram(program)
    }

    // Delete init programs
    for (const program of this.initPrograms.values()) {
      gl.deleteProgram(program)
    }
  }

  // ==========================================================================
  // PUBLIC API - State Access
  // ==========================================================================

  /**
   * Current frame number (auto-incremented by step()).
   */
  get frame(): number {
    return this._frame
  }

  // ==========================================================================
  // PRIVATE - Initialization
  // ==========================================================================

  /**
   * Validate project structure.
   */
  private validateProject(): void {
    // Check all passes have compiled shaders
    for (const pass of this.project.passes) {
      if (!pass.shader) {
        throw new Error(
          `Pass '${pass.name}' has no compiled shader. Did you call compileProject()?`
        )
      }
    }

    // Check all pass outputs exist
    for (const pass of this.project.passes) {
      if (pass.output !== 'screen' && !(pass.output in this.project.buffers)) {
        throw new Error(
          `Pass '${pass.name}' outputs to '${pass.output}' but buffer '${pass.output}' does not exist`
        )
      }
    }
  }

  /**
   * Compile all shader programs.
   */
  private compileAllPrograms(): void {
    for (const pass of this.project.passes) {
      try {
        const program = this.core.compileProgram(pass.shader!)
        this.programs.set(pass.name, program)
      } catch (error) {
        throw new Error(`Failed to compile pass '${pass.name}':\n${error}`)
      }
    }
  }

  /**
   * Compile initialization shaders for buffers.
   */
  private compileInitPrograms(): void {
    for (const [name, config] of Object.entries(this.project.buffers)) {
      if (!config.init) {
        continue
      }

      try {
        // Generate uniforms (same as passes)
        const uniforms = generateUniforms(this.project)
        const common = this.project.common || ''

        // Compile init shader
        const compiledShader = compileShader({
          uniforms,
          common,
          source: config.init
        })

        // Compile WebGL program
        const program = this.core.compileProgram(compiledShader)
        this.initPrograms.set(name, program)
      } catch (error) {
        throw new Error(`Failed to compile init shader for buffer '${name}':\n${error}`)
      }
    }
  }

  /**
   * Create framebuffers for all buffers.
   */
  private createFramebuffers(): void {
    for (const [name, config] of Object.entries(this.project.buffers)) {
      const [width, height] = this.calculateResolution(config)

      // Create main texture and framebuffer
      const mainTexture = this.core.createTexture(
        width,
        height,
        config.format,
        config.filter,
        config.wrap
      )
      const mainFbo = this.core.createFramebuffer(mainTexture)

      const pair: FramebufferPair = {
        main: { fbo: mainFbo, texture: mainTexture },
        width,
        height,
        current: 'main'
      }

      // Create ping-pong pair if needed
      if (config.pingPong) {
        const altTexture = this.core.createTexture(
          width,
          height,
          config.format,
          config.filter,
          config.wrap
        )
        const altFbo = this.core.createFramebuffer(altTexture)

        pair.alt = { fbo: altFbo, texture: altTexture }
      }

      this.framebuffers.set(name, pair)
    }
  }

  /**
   * Load all external textures.
   */
  private async loadTextures(): Promise<void> {
    if (!this.project.textures) {
      return
    }

    for (const [name, config] of Object.entries(this.project.textures)) {
      try {
        const texture = await this.core.loadImageTexture(
          config.source,
          config.filter,
          config.wrap
        )
        this.textures.set(name, texture)
      } catch (error) {
        throw new Error(`Failed to load texture '${name}': ${error}`)
      }
    }
  }

  /**
   * Create VAO for full-screen quad.
   */
  private createQuadVAO(): void {
    this.quadVAO = this.core.createQuadVAO()
  }

  /**
   * Initialize all parameters to default values.
   */
  private initializeParameters(): void {
    // Built-in uniforms
    const aspect = this.canvas.width / this.canvas.height
    this.paramValues.set('uResolution', [this.canvas.width, this.canvas.height, aspect])
    this.paramValues.set('uTime', 0)
    this.paramValues.set('uDeltaTime', 0)
    this.paramValues.set('uMouse', [0, 0, 0, 0])

    // User parameters
    if (this.project.params) {
      for (const [name, config] of Object.entries(this.project.params)) {
        this.paramValues.set(name, config.default)
      }
    }
  }

  // ==========================================================================
  // PRIVATE - Execution
  // ==========================================================================

  /**
   * Execute a single pass.
   */
  private executePass(pass: PassDefinition): void {
    const gl = this.core.gl

    // Determine output target
    let targetFbo: WebGLFramebuffer | null
    let width: number
    let height: number
    let outputBuffer: FramebufferPair | null = null

    if (pass.output === 'screen') {
      targetFbo = null
      width = this.canvas.width
      height = this.canvas.height
    } else {
      const pair = this.framebuffers.get(pass.output)!
      outputBuffer = pair

      // For ping-pong, write to the OTHER framebuffer
      if (pair.alt) {
        targetFbo = pair.current === 'main' ? pair.alt.fbo : pair.main.fbo
      } else {
        targetFbo = pair.main.fbo
      }

      width = pair.width
      height = pair.height
    }

    // Bind output framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, targetFbo)

    // Set viewport
    this.core.setViewport(width, height)

    // Use shader program
    const program = this.programs.get(pass.name)!
    gl.useProgram(program)

    // Bind all uniforms
    this.bindAllUniforms(program)

    // Draw full-screen quad
    this.core.drawQuad(this.quadVAO!)

    // Swap ping-pong if needed
    if (outputBuffer && outputBuffer.alt) {
      outputBuffer.current = outputBuffer.current === 'main' ? 'alt' : 'main'
    }

    // Unbind framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  /**
   * Bind all uniforms for a program.
   */
  private bindAllUniforms(program: WebGLProgram): void {
    // Built-in uniforms
    this.core.bindUniform(program, 'uResolution', this.paramValues.get('uResolution')!)
    this.core.bindUniform(program, 'uTime', this.paramValues.get('uTime')!)
    this.core.bindUniform(program, 'uDeltaTime', this.paramValues.get('uDeltaTime')!)
    this.core.bindIntUniform(program, 'uFrame', this._frame)
    this.core.bindUniform(program, 'uMouse', this.paramValues.get('uMouse')!)

    let unit = 0

    // Buffer textures + resolutions
    for (const [name, pair] of this.framebuffers.entries()) {
      // For ping-pong, read from current texture
      const texture = pair.alt
        ? (pair.current === 'main' ? pair.main.texture : pair.alt.texture)
        : pair.main.texture

      this.core.bindTexture(program, name, texture, unit)
      unit++

      // Bind buffer resolution uniform
      // e.g., velocity -> uVelocityResolution
      const resolutionName = `u${name.charAt(0).toUpperCase()}${name.slice(1)}Resolution`
      const aspect = pair.width / pair.height
      this.core.bindUniform(program, resolutionName, [pair.width, pair.height, aspect])
    }

    // External textures
    for (const [name, texture] of this.textures.entries()) {
      this.core.bindTexture(program, name, texture, unit)
      unit++
    }

    // User parameters
    if (this.project.params) {
      for (const [name, config] of Object.entries(this.project.params)) {
        const value = this.paramValues.get(name)!

        // Use appropriate binding method based on type
        if (config.type === 'int') {
          this.core.bindIntUniform(program, name, value as number)
        } else {
          this.core.bindUniform(program, name, value)
        }
      }
    }
  }

  /**
   * Clear a buffer to its initial color.
   */
  private clearBuffer(name: string): void {
    const pair = this.framebuffers.get(name)!
    const config = this.project.buffers[name]

    this.core.clear(pair.main.fbo, config.clear)
    if (pair.alt) {
      this.core.clear(pair.alt.fbo, config.clear)
    }
  }

  /**
   * Run initialization shaders for buffers.
   */
  private runInitShaders(): void {
    const gl = this.core.gl

    for (const [name, program] of this.initPrograms.entries()) {
      const pair = this.framebuffers.get(name)!

      // Run init shader on main buffer
      gl.bindFramebuffer(gl.FRAMEBUFFER, pair.main.fbo)
      this.core.setViewport(pair.width, pair.height)
      gl.useProgram(program)
      this.bindAllUniforms(program)
      this.core.drawQuad(this.quadVAO!)

      // Run on alt buffer if ping-pong
      if (pair.alt) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, pair.alt.fbo)
        this.core.setViewport(pair.width, pair.height)
        gl.useProgram(program)
        this.bindAllUniforms(program)
        this.core.drawQuad(this.quadVAO!)
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    }
  }

  /**
   * Calculate resolution for a buffer.
   */
  private calculateResolution(config: BufferConfig): [number, number] {
    const res = config.resolution

    if (res === 'inherit') {
      return [this.canvas.width, this.canvas.height]
    } else if (Array.isArray(res)) {
      return res
    } else if ('width' in res) {
      // Fixed width, compute height from aspect ratio
      const height = Math.round(res.width / res.aspectRatio)
      return [res.width, height]
    } else {
      // Fixed height, compute width from aspect ratio
      const width = Math.round(res.height * res.aspectRatio)
      return [width, res.height]
    }
  }

  /**
   * Check if engine has been destroyed, throw if so.
   */
  private checkNotDestroyed(): void {
    if (this.destroyed) {
      throw new Error('Engine has been destroyed')
    }
  }
}
