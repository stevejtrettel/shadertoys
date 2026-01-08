/**
 * Project Layer - Type Definitions for Shadertoy Projects
 *
 * Pure TypeScript interfaces matching Shadertoy's mental model.
 * Based on docs/project-spec.md
 */

// =============================================================================
// Pass Names (Fixed set matching Shadertoy)
// =============================================================================

export type PassName = 'Image' | 'BufferA' | 'BufferB' | 'BufferC' | 'BufferD';

// =============================================================================
// Channel Definitions (JSON Config Format)
// =============================================================================

/**
 * Reference to another buffer pass.
 * By default, reads the previous frame (safe for all cases).
 * Use current: true to read from a buffer that has already run this frame.
 */
export interface ChannelJSONBuffer {
  buffer: PassName;
  current?: boolean;  // Default: false (read previous frame)
}

/**
 * Reference to external texture (image file).
 */
export interface ChannelJSONTexture {
  texture: string;  // Path to image file
  filter?: 'nearest' | 'linear';  // Default: 'linear'
  wrap?: 'clamp' | 'repeat';      // Default: 'repeat'
  type?: '2d' | 'cubemap';        // Default: '2d'. Cubemap uses equirectangular projection.
}

/**
 * Reference to keyboard texture (runtime-provided).
 */
export interface ChannelJSONKeyboard {
  keyboard: true;
}

/**
 * Union type for channel sources in JSON config (object form).
 */
export type ChannelJSONObject =
  | ChannelJSONBuffer
  | ChannelJSONTexture
  | ChannelJSONKeyboard;

/**
 * Channel value in simplified config format.
 * Can be a string shorthand or full object:
 * - "BufferA", "BufferB", etc. → buffer reference
 * - "keyboard" → keyboard input
 * - "photo.jpg" (with extension) → texture file
 * - { buffer: "BufferA" } → explicit buffer with options
 * - { texture: "photo.jpg", filter: "nearest" } → texture with options
 */
export type ChannelValue = string | ChannelJSONObject;

// =============================================================================
// Config Format (config.json) - Simplified flat format
// =============================================================================

/**
 * Pass configuration in simplified format.
 * Channel bindings are directly on the pass object.
 *
 * Example:
 * {
 *   "iChannel0": "BufferA",
 *   "iChannel1": "photo.jpg",
 *   "source": "custom.glsl"  // optional
 * }
 */
export interface PassConfigSimplified {
  /** Optional custom source file path */
  source?: string;
  /** Channel bindings - string shorthand or full object */
  iChannel0?: ChannelValue;
  iChannel1?: ChannelValue;
  iChannel2?: ChannelValue;
  iChannel3?: ChannelValue;
}

/**
 * Top-level config.json structure (simplified flat format).
 *
 * Example:
 * {
 *   "title": "My Shader",
 *   "layout": "split",
 *   "controls": true,
 *
 *   "BufferA": {
 *     "iChannel0": "BufferA"
 *   },
 *   "Image": {
 *     "iChannel0": "BufferA"
 *   }
 * }
 */
export interface ShadertoyConfig {
  // Metadata (flat, not nested)
  title?: string;
  author?: string;
  description?: string;

  // Settings
  layout?: 'fullscreen' | 'centered' | 'split' | 'tabbed';
  controls?: boolean;
  common?: string;

  // Passes (at top level)
  Image?: PassConfigSimplified;
  BufferA?: PassConfigSimplified;
  BufferB?: PassConfigSimplified;
  BufferC?: PassConfigSimplified;
  BufferD?: PassConfigSimplified;
}

// =============================================================================
// Internal Channel Representation (Normalized)
// =============================================================================

/**
 * Normalized channel source for engine consumption.
 * All channels are represented as one of these discriminated union variants.
 */
export type ChannelSource =
  | { kind: 'none' }
  | { kind: 'buffer'; buffer: PassName; current: boolean }
  | { kind: 'texture'; name: string; cubemap: boolean }  // Internal texture ID (e.g., "tex0")
  | { kind: 'keyboard' };

/**
 * Exactly 4 channels (iChannel0-3), matching Shadertoy's fixed channel count.
 */
export type Channels = [ChannelSource, ChannelSource, ChannelSource, ChannelSource];

// =============================================================================
// Texture Definitions
// =============================================================================

/**
 * External 2D texture loaded from image file.
 * Textures are deduplicated by (source, filter, wrap) tuple.
 */
export interface ShadertoyTexture2D {
  name: string;  // Internal ID (e.g., "tex0", "tex1")
  source: string;  // Path to image file
  filter: 'nearest' | 'linear';
  wrap: 'clamp' | 'repeat';
}

// =============================================================================
// Pass Definition (In-Memory)
// =============================================================================

/**
 * A single shader pass in the rendering pipeline.
 */
export interface ShadertoyPass {
  name: PassName;
  glslSource: string;  // Full GLSL source code
  channels: Channels;  // iChannel0..3
}

// =============================================================================
// Project Metadata
// =============================================================================

/**
 * Project metadata (title, author, description).
 */
export interface ShadertoyMeta {
  title: string;
  author: string | null;
  description: string | null;
}

// =============================================================================
// Main Project Definition (Normalized, Engine-Ready)
// =============================================================================

/**
 * Complete in-memory representation of a Shadertoy project.
 * Produced by loadProject() and consumed by ShadertoyEngine.
 *
 * Guarantees:
 * - passes.Image always exists
 * - All passes have exactly 4 channels (missing → kind: 'none')
 * - Textures are deduplicated
 * - All paths resolved and GLSL loaded
 */
export interface ShadertoyProject {
  /**
   * Project root directory path.
   */
  root: string;

  /**
   * Project metadata.
   */
  meta: ShadertoyMeta;

  /**
   * Layout mode for the shader viewer.
   */
  layout: 'fullscreen' | 'centered' | 'split' | 'tabbed';

  /**
   * Whether to show playback controls (play/pause, reset).
   */
  controls: boolean;

  /**
   * Common GLSL code (prepended to all shaders), or null if none.
   */
  commonSource: string | null;

  /**
   * Pass definitions.
   * Image is always present, BufferA-D are optional.
   */
  passes: {
    Image: ShadertoyPass;
    BufferA?: ShadertoyPass;
    BufferB?: ShadertoyPass;
    BufferC?: ShadertoyPass;
    BufferD?: ShadertoyPass;
  };

  /**
   * Deduplicated list of external textures.
   * All ChannelSource with kind: 'texture2D' refer to names in this list.
   */
  textures: ShadertoyTexture2D[];
}
