/**
 * Engine Layer - Type Definitions
 *
 * Internal types used by ShadertoyEngine for managing WebGL resources.
 * Based on docs/engine-spec.md
 */

import type {
  ShadertoyProject,
  PassName,
  Channels,
} from '../project/types';

// =============================================================================
// Engine Options
// =============================================================================

/**
 * Options for constructing a ShadertoyEngine.
 *
 * The App is responsible for creating the WebGL2RenderingContext
 * and passing it in.
 */
export interface EngineOptions {
  gl: WebGL2RenderingContext;
  project: ShadertoyProject;
}

// =============================================================================
// Per-Pass Uniform Locations
// =============================================================================

/**
 * Per-pass uniform locations and metadata.
 *
 * NOTE: This is separate from RuntimePass so that we can keep
 * the GL program + locations together.
 */
export interface PassUniformLocations {
  program: WebGLProgram;

  // Core Shadertoy uniforms
  iResolution: WebGLUniformLocation | null;
  iTime: WebGLUniformLocation | null;
  iTimeDelta: WebGLUniformLocation | null;
  iFrame: WebGLUniformLocation | null;
  iMouse: WebGLUniformLocation | null;
  iDate: WebGLUniformLocation | null;
  iFrameRate: WebGLUniformLocation | null;

  // iChannel0..3
  iChannel: (WebGLUniformLocation | null)[];

  // iChannelResolution[4] - resolution of each channel texture
  iChannelResolution: (WebGLUniformLocation | null)[];

  // Touch uniforms (Shader Sandbox extensions)
  iTouchCount: WebGLUniformLocation | null;
  iTouch: (WebGLUniformLocation | null)[]; // iTouch0, iTouch1, iTouch2
  iPinch: WebGLUniformLocation | null;
  iPinchDelta: WebGLUniformLocation | null;
  iPinchCenter: WebGLUniformLocation | null;

  // Custom uniforms (from project config)
  custom: Map<string, WebGLUniformLocation | null>;
}

// =============================================================================
// Runtime Pass Representation
// =============================================================================

/**
 * A runtime representation of a pass:
 * - knows which project pass it corresponds to
 * - owns two textures (current + previous) for ping-pong
 * - owns a framebuffer and VAO for drawing
 */
export interface RuntimePass {
  name: PassName;
  projectChannels: Channels;

  vao: WebGLVertexArrayObject;
  uniforms: PassUniformLocations;

  framebuffer: WebGLFramebuffer;

  // Ping-pong textures:
  // - current: where we write this frame
  // - previous: where we read "previous" from when needed
  currentTexture: WebGLTexture;
  previousTexture: WebGLTexture;
}

// =============================================================================
// Runtime Texture Representation
// =============================================================================

/**
 * Runtime representation of an external 2D texture.
 * This corresponds 1:1 to ShadertoyTexture2D from the project.
 */
export interface RuntimeTexture2D {
  name: string; // e.g. "tex0" (same as project texture name)
  texture: WebGLTexture;
  width: number;
  height: number;
}

/**
 * Keyboard texture representation.
 * For v1, you can leave this unimplemented or just stub it out.
 */
export interface RuntimeKeyboardTexture {
  texture: WebGLTexture;
  width: number;
  height: number;
}

// =============================================================================
// Engine Stats
// =============================================================================

/**
 * Engine stats (for optional overlay / debugging).
 */
export interface EngineStats {
  frame: number;         // iFrame
  time: number;          // total time in seconds (iTime)
  deltaTime: number;     // last frame delta in seconds (iTimeDelta)
  width: number;
  height: number;
}

