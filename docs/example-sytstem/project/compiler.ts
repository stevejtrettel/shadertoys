/**
 * Project Layer - Compiler Functions
 *
 * Pure functions for compiling GLSL shaders from ProjectDefinition.
 * No side effects, no external dependencies.
 */

import type { ProjectDefinition } from './types'

/**
 * Comprehensive list of GLSL ES 3.00 reserved keywords.
 */
const GLSL_RESERVED_WORDS = new Set([
  // Types - basic
  'void', 'bool', 'int', 'uint', 'float',

  // Types - vectors
  'vec2', 'vec3', 'vec4',
  'bvec2', 'bvec3', 'bvec4',
  'ivec2', 'ivec3', 'ivec4',
  'uvec2', 'uvec3', 'uvec4',

  // Types - matrices
  'mat2', 'mat3', 'mat4',
  'mat2x2', 'mat2x3', 'mat2x4',
  'mat3x2', 'mat3x3', 'mat3x4',
  'mat4x2', 'mat4x3', 'mat4x4',

  // Types - samplers
  'sampler2D', 'sampler3D', 'samplerCube',
  'sampler2DShadow', 'samplerCubeShadow',
  'sampler2DArray', 'sampler2DArrayShadow',
  'isampler2D', 'isampler3D', 'isamplerCube', 'isampler2DArray',
  'usampler2D', 'usampler3D', 'usamplerCube', 'usampler2DArray',

  // Control flow
  'if', 'else', 'for', 'while', 'do',
  'switch', 'case', 'default',
  'break', 'continue', 'return', 'discard',

  // Qualifiers
  'const', 'uniform', 'in', 'out', 'inout',
  'attribute', 'varying',
  'lowp', 'mediump', 'highp', 'precision',
  'invariant', 'smooth', 'flat', 'centroid', 'layout',

  // Other
  'struct', 'true', 'false'
])

/**
 * Validate that a name is a valid GLSL identifier.
 *
 * Rules:
 * 1. Must start with letter or underscore
 * 2. Can only contain letters, numbers, underscores
 * 3. Cannot be a reserved keyword
 * 4. Cannot start with 'gl_' (reserved prefix)
 *
 * @param name - Identifier to validate
 * @param type - Type of identifier (for error messages: 'buffer', 'texture', 'parameter')
 * @throws Error with detailed message if invalid
 */
function validateGLSLIdentifier(name: string, type: string): void {
  // Check starts with letter or underscore
  if (!/^[a-zA-Z_]/.test(name)) {
    throw new Error(
      `Invalid ${type} name '${name}': must start with a letter or underscore`
    )
  }

  // Check contains only valid characters
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error(
      `Invalid ${type} name '${name}': can only contain letters, numbers, and underscores`
    )
  }

  // Check not a reserved keyword
  if (GLSL_RESERVED_WORDS.has(name)) {
    throw new Error(
      `Invalid ${type} name '${name}': this is a reserved GLSL keyword`
    )
  }

  // Check doesn't start with gl_
  if (name.startsWith('gl_')) {
    throw new Error(
      `Invalid ${type} name '${name}': names starting with 'gl_' are reserved by WebGL`
    )
  }
}

/**
 * Generate uniform declarations from project definition.
 *
 * Order:
 * 1. Built-in uniforms (uResolution, uTime, uDeltaTime, uFrame, uMouse)
 * 2. Buffer samplers (from project.buffers)
 * 3. External texture samplers (from project.textures)
 * 4. User parameters (from project.params)
 *
 * @param project - ProjectDefinition
 * @returns Multi-line GLSL string with all uniform declarations
 * @throws Error if any name is invalid
 */
export function generateUniforms(project: ProjectDefinition): string {
  const lines: string[] = []

  // 1. Built-in uniforms (always present)
  lines.push('uniform vec3 uResolution;')
  lines.push('uniform float uTime;')
  lines.push('uniform float uDeltaTime;')
  lines.push('uniform int uFrame;')
  lines.push('uniform vec4 uMouse;')

  // 2. Buffer samplers + resolutions
  for (const name of Object.keys(project.buffers)) {
    validateGLSLIdentifier(name, 'buffer')
    lines.push(`uniform sampler2D ${name};`)

    // Add resolution uniform for each buffer
    // e.g., velocity -> uVelocityResolution
    const resolutionName = `u${name.charAt(0).toUpperCase()}${name.slice(1)}Resolution`
    lines.push(`uniform vec3 ${resolutionName};`)
  }

  // 3. External texture samplers
  if (project.textures) {
    for (const name of Object.keys(project.textures)) {
      validateGLSLIdentifier(name, 'texture')
      lines.push(`uniform sampler2D ${name};`)
    }
  }

  // 4. User parameters
  if (project.params) {
    for (const [name, config] of Object.entries(project.params)) {
      validateGLSLIdentifier(name, 'parameter')

      switch (config.type) {
        case 'float':
          lines.push(`uniform float ${name};`)
          break
        case 'bool':
          lines.push(`uniform bool ${name};`)
          break
        case 'int':
          lines.push(`uniform int ${name};`)
          break
        case 'vec3':
          lines.push(`uniform vec3 ${name};`)
          break
      }
    }
  }

  return lines.join('\n')
}

/**
 * Options for compiling a single shader.
 */
export interface CompileOptions {
  uniforms: string
  common: string
  source: string
}

/**
 * Compile a single shader from parts.
 *
 * Assembles complete GLSL shader with:
 * - Version directive
 * - Precision statement
 * - Uniform declarations
 * - Output declaration
 * - Common code (if present)
 * - Shader source
 *
 * @param options - Shader parts to assemble
 * @returns Complete GLSL shader ready for WebGL compilation
 */
export function compileShader(options: CompileOptions): string {
  const lines: string[] = []

  // Version must be first
  lines.push('#version 300 es')
  lines.push('')

  // Precision
  lines.push('precision highp float;')
  lines.push('')

  // Uniforms
  if (options.uniforms) {
    lines.push('// === Generated Uniforms ===')
    lines.push(options.uniforms)
    lines.push('')
  }

  // Output declaration
  lines.push('// === Output ===')
  lines.push('out vec4 fragColor;')
  lines.push('')

  // Common code
  if (options.common) {
    lines.push('// === Common Code ===')
    lines.push(options.common)
    lines.push('')
  }

  // Shader source
  lines.push('// === Shader Source ===')
  lines.push(options.source)

  return lines.join('\n')
}

/**
 * Compile all passes in a project.
 *
 * For each pass:
 * 1. Generate uniforms from project
 * 2. Compile shader with uniforms + common + source
 * 3. Store result in pass.shader
 *
 * Mutates project in place, also returns it for convenience.
 *
 * @param project - ProjectDefinition
 * @returns Same project (mutated with .shader fields)
 * @throws Error if validation fails
 */
export function compileProject(project: ProjectDefinition): ProjectDefinition {
  // Generate uniforms once (same for all passes)
  const uniforms = generateUniforms(project)
  const common = project.common || ''

  // Compile each pass
  for (const pass of project.passes) {
    pass.shader = compileShader({
      uniforms,
      common,
      source: pass.source
    })
  }

  return project
}

/**
 * Recompile a single pass (for hot reload).
 *
 * Finds pass by name, regenerates uniforms, compiles shader,
 * and updates pass.shader in place.
 *
 * @param project - ProjectDefinition
 * @param passName - Name of pass to recompile
 * @throws Error if pass not found
 */
export function recompilePass(
  project: ProjectDefinition,
  passName: string
): void {
  // Find pass
  const pass = project.passes.find(p => p.name === passName)
  if (!pass) {
    throw new Error(`Pass '${passName}' not found`)
  }

  // Regenerate uniforms and compile
  const uniforms = generateUniforms(project)
  const common = project.common || ''

  pass.shader = compileShader({
    uniforms,
    common,
    source: pass.source
  })
}
