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
 */
export interface ChannelJSONBuffer {
  buffer: PassName;
  previous?: boolean;  // Default: false (read current frame)
}

/**
 * Reference to external 2D texture (image file).
 */
export interface ChannelJSONTexture {
  texture: string;  // Path to image file
  filter?: 'nearest' | 'linear';  // Default: 'linear'
  wrap?: 'clamp' | 'repeat';      // Default: 'repeat'
}

/**
 * Reference to keyboard texture (runtime-provided).
 */
export interface ChannelJSONKeyboard {
  keyboard: true;
}

/**
 * Union type for channel sources in JSON config.
 */
export type ChannelJSON =
  | ChannelJSONBuffer
  | ChannelJSONTexture
  | ChannelJSONKeyboard;

// =============================================================================
// Config Format (shadertoy.config.json)
// =============================================================================

/**
 * Per-pass configuration in JSON.
 */
export interface PassConfig {
  /**
   * Path to GLSL source file (relative to project root).
   * Optional - defaults to standard names (image.glsl, bufferA.glsl, etc.)
   */
  source?: string;

  /**
   * Channel bindings for iChannel0..3.
   * Any omitted channel defaults to unused (none).
   */
  channels?: {
    iChannel0?: ChannelJSON;
    iChannel1?: ChannelJSON;
    iChannel2?: ChannelJSON;
    iChannel3?: ChannelJSON;
  };
}

/**
 * Top-level shadertoy.config.json structure.
 */
export interface ShadertoyConfig {
  /**
   * Optional project metadata.
   */
  meta?: {
    title?: string;
    author?: string;
    description?: string;
  };

  /**
   * Optional layout mode for the shader viewer.
   * - 'fullscreen': Canvas fills entire viewport, no styling
   * - 'centered': Centered canvas with rounded corners and drop shadow
   * - 'split': Shader on left, code viewer on right with syntax highlighting
   * - 'tabbed': Single window with tabs for shader and code (default)
   * If omitted, defaults to 'tabbed'.
   */
  layout?: 'fullscreen' | 'centered' | 'split' | 'tabbed';

  /**
   * Optional controls for playback.
   * If true, shows play/pause and reset buttons with keyboard shortcuts.
   * If omitted, defaults to true.
   */
  controls?: boolean;

  /**
   * Optional path to common GLSL code (shared across all passes).
   * If omitted, loader checks for 'common.glsl' automatically.
   */
  common?: string;

  /**
   * Pass definitions.
   * Image is required, BufferA-D are optional.
   */
  passes: {
    Image: PassConfig;
    BufferA?: PassConfig;
    BufferB?: PassConfig;
    BufferC?: PassConfig;
    BufferD?: PassConfig;
  };
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
  | { kind: 'buffer'; buffer: PassName; previous: boolean }
  | { kind: 'texture2D'; name: string }  // Internal texture ID (e.g., "tex0")
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
