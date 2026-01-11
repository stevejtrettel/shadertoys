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

/**
 * Theme mode for the shader viewer.
 * - 'light': Always use light theme
 * - 'dark': Always use dark theme
 * - 'system': Follow OS preference (prefers-color-scheme)
 */
export type ThemeMode = 'light' | 'dark' | 'system';

// =============================================================================
// Custom Uniform Definitions
// =============================================================================

/**
 * Supported uniform types for user-defined controls.
 * For now, we start with float only. More types will be added later.
 */
export type UniformType = 'float' | 'int' | 'bool' | 'vec2' | 'vec3' | 'vec4';

/**
 * Base uniform definition shared by all types.
 */
interface UniformDefinitionBase {
  /** Display label (defaults to uniform name if not provided) */
  label?: string;
}

/**
 * Float uniform with slider control.
 */
export interface FloatUniformDefinition extends UniformDefinitionBase {
  type: 'float';
  value: number;
  min?: number;   // Default: 0
  max?: number;   // Default: 1
  step?: number;  // Default: 0.01
}

/**
 * Integer uniform with discrete slider.
 */
export interface IntUniformDefinition extends UniformDefinitionBase {
  type: 'int';
  value: number;
  min?: number;   // Default: 0
  max?: number;   // Default: 10
  step?: number;  // Default: 1
}

/**
 * Boolean uniform with toggle control.
 */
export interface BoolUniformDefinition extends UniformDefinitionBase {
  type: 'bool';
  value: boolean;
}

/**
 * Vec2 uniform (2D position picker).
 */
export interface Vec2UniformDefinition extends UniformDefinitionBase {
  type: 'vec2';
  value: [number, number];
  min?: [number, number];   // Default: [0, 0]
  max?: [number, number];   // Default: [1, 1]
}

/**
 * Vec3 uniform (color picker or 3D value).
 */
export interface Vec3UniformDefinition extends UniformDefinitionBase {
  type: 'vec3';
  value: [number, number, number];
  /** If true, use color picker UI. Otherwise use 3 sliders. */
  color?: boolean;
}

/**
 * Vec4 uniform (color with alpha or 4D value).
 */
export interface Vec4UniformDefinition extends UniformDefinitionBase {
  type: 'vec4';
  value: [number, number, number, number];
  /** If true, use color picker with alpha. Otherwise use 4 sliders. */
  color?: boolean;
}

/**
 * Union of all uniform definition types.
 */
export type UniformDefinition =
  | FloatUniformDefinition
  | IntUniformDefinition
  | BoolUniformDefinition
  | Vec2UniformDefinition
  | Vec3UniformDefinition
  | Vec4UniformDefinition;

/**
 * Map of uniform names to their definitions.
 */
export type UniformDefinitions = Record<string, UniformDefinition>;

/**
 * A single uniform value at runtime.
 */
export type UniformValue = number | boolean | number[];

/**
 * Runtime uniform values (current state).
 * Keys are uniform names, values are the current value.
 */
export type UniformValues = Record<string, UniformValue>;

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
  layout?: 'fullscreen' | 'default' | 'split' | 'tabbed';
  theme?: ThemeMode;
  controls?: boolean;
  common?: string;

  // Info markdown file (optional, auto-detects info.md if not specified)
  info?: string;

  // Custom uniforms (user-defined controls)
  uniforms?: UniformDefinitions;

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
  filename?: string;  // Original filename for display (e.g., "texture.png")
  source: string;  // Path/URL to image file
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
  layout: 'fullscreen' | 'default' | 'split' | 'tabbed';

  /**
   * Theme mode for the shader viewer.
   * Defaults to 'light' if not specified.
   */
  theme: ThemeMode;

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

  /**
   * Custom uniform definitions from config.
   * Users must declare these uniforms in their shader code.
   */
  uniforms: UniformDefinitions;

  /**
   * Info markdown content (optional).
   * Loaded from info.md or custom path specified in config.
   */
  infoMarkdown: string | null;
}
