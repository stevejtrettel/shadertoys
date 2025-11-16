/**
 * Engine Layer - Type Definitions
 *
 * Internal types used by Engine for managing WebGL resources.
 */

/**
 * Framebuffer pair for a render target buffer.
 * Handles both regular and ping-pong buffers.
 */
export interface FramebufferPair {
  /**
   * Main framebuffer and texture
   */
  main: {
    fbo: WebGLFramebuffer
    texture: WebGLTexture
  }

  /**
   * Buffer resolution in pixels
   */
  width: number
  height: number

  /**
   * Alternate framebuffer and texture (only for ping-pong buffers)
   */
  alt?: {
    fbo: WebGLFramebuffer
    texture: WebGLTexture
  }

  /**
   * Which texture is current (for ping-pong buffers).
   * Reading uses current, writing uses the other, then swap.
   */
  current: 'main' | 'alt'
}
