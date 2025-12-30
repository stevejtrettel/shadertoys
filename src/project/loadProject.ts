/**
 * Project Layer - Config Loader
 *
 * Loads Shadertoy projects from disk into normalized ShadertoyProject representation.
 * Handles both single-pass (no config) and multi-pass (with config) projects.
 *
 * Based on docs/project-spec.md
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import {
  PassName,
  ChannelSource,
  ShadertoyConfig,
  ShadertoyPass,
  ShadertoyProject,
  ShadertoyTexture2D,
  PassConfig,
} from './types';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if a file exists.
 */
async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard for PassName.
 */
function isPassName(s: string): s is PassName {
  return s === 'Image' || s === 'BufferA' || s === 'BufferB' || s === 'BufferC' || s === 'BufferD';
}

/**
 * List all .glsl files in a directory.
 */
async function listGlslFiles(root: string): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.glsl'))
    .map((e) => e.name);
}

/**
 * Check if project has a textures/ directory with files.
 */
async function hasTexturesDirWithFiles(root: string): Promise<boolean> {
  const dir = path.join(root, 'textures');
  if (!(await fileExists(dir))) return false;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries.some((e) => e.isFile());
}

/**
 * Get default source file name for a pass.
 */
function defaultSourceForPass(name: PassName): string {
  switch (name) {
    case 'Image':
      return 'image.glsl';
    case 'BufferA':
      return 'bufferA.glsl';
    case 'BufferB':
      return 'bufferB.glsl';
    case 'BufferC':
      return 'bufferC.glsl';
    case 'BufferD':
      return 'bufferD.glsl';
  }
}

// =============================================================================
// Main Entry Point
// =============================================================================

/**
 * Load a Shadertoy project from disk.
 *
 * Automatically detects:
 * - Single-pass mode (no config, just image.glsl)
 * - Multi-pass mode (shadertoy.config.json present)
 *
 * @param root - Absolute path to project directory
 * @returns Fully normalized ShadertoyProject
 * @throws Error with descriptive message if project is invalid
 */
export async function loadProject(root: string): Promise<ShadertoyProject> {
  const configPath = path.join(root, 'shadertoy.config.json');
  const hasConfig = await fileExists(configPath);

  if (hasConfig) {
    // Multi-pass mode: parse config
    const raw = await fs.readFile(configPath, 'utf8');
    let config: ShadertoyConfig;
    try {
      config = JSON.parse(raw);
    } catch (err: any) {
      throw new Error(
        `Invalid JSON in shadertoy.config.json at '${root}': ${err?.message ?? String(err)}`
      );
    }
    return await loadProjectWithConfig(root, config);
  } else {
    // Single-pass mode: just image.glsl
    return await loadSinglePassProject(root);
  }
}

// =============================================================================
// Single-Pass Mode (No Config)
// =============================================================================

/**
 * Load a simple single-pass project.
 *
 * Requirements:
 * - Must have image.glsl
 * - Cannot have other .glsl files
 * - Cannot have textures/ directory
 * - No common.glsl allowed
 *
 * @param root - Project directory
 * @returns ShadertoyProject with only Image pass
 */
async function loadSinglePassProject(root: string): Promise<ShadertoyProject> {
  const imagePath = path.join(root, 'image.glsl');
  if (!(await fileExists(imagePath))) {
    throw new Error(`Single-pass project at '${root}' requires 'image.glsl'.`);
  }

  // Check for extra GLSL files
  const glslFiles = await listGlslFiles(root);
  const extraGlsl = glslFiles.filter((name) => name !== 'image.glsl');
  if (extraGlsl.length > 0) {
    throw new Error(
      `Project at '${root}' contains multiple GLSL files (${glslFiles.join(
        ', '
      )}) but no 'shadertoy.config.json'. Add a config file to use multiple passes.`
    );
  }

  // Check for textures
  if (await hasTexturesDirWithFiles(root)) {
    throw new Error(
      `Project at '${root}' uses textures (in 'textures/' folder) but has no 'shadertoy.config.json'. Add a config file to define texture bindings.`
    );
  }

  // Load shader source
  const imageSource = await fs.readFile(imagePath, 'utf8');
  const title = path.basename(root);

  const project: ShadertoyProject = {
    root,
    meta: {
      title,
      author: null,
      description: null,
    },
    layout: 'centered',
    controls: false,
    commonSource: null,
    passes: {
      Image: {
        name: 'Image',
        glslSource: imageSource,
        channels: [
          { kind: 'none' },
          { kind: 'none' },
          { kind: 'none' },
          { kind: 'none' },
        ],
      },
    },
    textures: [],
  };

  return project;
}

// =============================================================================
// Multi-Pass Mode (With Config)
// =============================================================================

/**
 * Load a project with shadertoy.config.json.
 *
 * @param root - Project directory
 * @param config - Parsed JSON config
 * @returns Normalized ShadertoyProject
 */
async function loadProjectWithConfig(root: string, config: ShadertoyConfig): Promise<ShadertoyProject> {
  // Validate passes
  if (!config.passes || !config.passes.Image) {
    throw new Error(`shadertoy.config.json at '${root}' must define passes.Image.`);
  }

  const allowedPassKeys = new Set<PassName>(['Image', 'BufferA', 'BufferB', 'BufferC', 'BufferD']);
  for (const key of Object.keys(config.passes)) {
    if (!allowedPassKeys.has(key as PassName)) {
      throw new Error(
        `shadertoy.config.json at '${root}' contains unknown pass '${key}'. Allowed passes are Image, BufferA, BufferB, BufferC, BufferD.`
      );
    }
  }

  // Resolve commonSource
  let commonSource: string | null = null;
  if (config.common) {
    const commonPath = path.join(root, config.common);
    if (!(await fileExists(commonPath))) {
      throw new Error(
        `Common GLSL file '${config.common}' not found in '${root}'.`
      );
    }
    commonSource = await fs.readFile(commonPath, 'utf8');
  } else {
    // Check for default common.glsl
    const defaultCommonPath = path.join(root, 'common.glsl');
    if (await fileExists(defaultCommonPath)) {
      commonSource = await fs.readFile(defaultCommonPath, 'utf8');
    }
  }

  // Texture deduplication map
  const textureMap = new Map<string, ShadertoyTexture2D>();

  /**
   * Register a texture and return its internal name.
   */
  function registerTexture(j: { texture: string; filter?: 'nearest' | 'linear'; wrap?: 'clamp' | 'repeat' }): string {
    const filter = j.filter ?? 'linear';
    const wrap = j.wrap ?? 'repeat';
    const key = `${j.texture}|${filter}|${wrap}`;

    let existing = textureMap.get(key);
    if (existing) {
      return existing.name;
    }

    const name = `tex${textureMap.size}`;
    const tex: ShadertoyTexture2D = {
      name,
      source: j.texture,
      filter,
      wrap,
    };
    textureMap.set(key, tex);
    return name;
  }

  /**
   * Load a single pass from config.
   */
  async function loadPass(
    name: PassName,
    passConfig: PassConfig | undefined
  ): Promise<ShadertoyPass | undefined> {
    if (!passConfig) return undefined;

    const sourceRel = passConfig.source ?? defaultSourceForPass(name);
    const sourcePath = path.join(root, sourceRel);

    if (!(await fileExists(sourcePath))) {
      throw new Error(
        `Source GLSL file for pass '${name}' not found at '${sourceRel}' in '${root}'.`
      );
    }

    const glslSource = await fs.readFile(sourcePath, 'utf8');

    // Normalize channels (always 4 channels)
    const channelSources: ChannelSource[] = [];
    const ch = passConfig.channels ?? {};

    const keys = ['iChannel0', 'iChannel1', 'iChannel2', 'iChannel3'] as const;

    for (const key of keys) {
      const value = ch[key];
      if (!value) {
        channelSources.push({ kind: 'none' });
        continue;
      }

      // Buffer channel
      if ('buffer' in value) {
        const buf = value.buffer;
        if (!isPassName(buf)) {
          throw new Error(
            `Invalid buffer name '${buf}' for ${key} in pass '${name}' at '${root}'.`
          );
        }
        channelSources.push({
          kind: 'buffer',
          buffer: buf,
          previous: !!value.previous,
        });
        continue;
      }

      // Texture channel
      if ('texture' in value) {
        const internalName = registerTexture(value);
        channelSources.push({
          kind: 'texture2D',
          name: internalName,
        });
        continue;
      }

      // Keyboard channel
      if ('keyboard' in value) {
        if (value.keyboard !== true) {
          throw new Error(
            `Invalid keyboard value for ${key} in pass '${name}' at '${root}'. Expected { "keyboard": true }.`
          );
        }
        channelSources.push({ kind: 'keyboard' });
        continue;
      }

      // Unknown channel type
      throw new Error(
        `Invalid channel object for ${key} in pass '${name}' at '${root}'.`
      );
    }

    return {
      name,
      glslSource,
      channels: channelSources,
    };
  }

  // Load all passes
  const imagePass = await loadPass('Image', config.passes.Image);
  if (!imagePass) {
    throw new Error(`passes.Image must be defined in shadertoy.config.json at '${root}'.`);
  }

  const bufferAPass = await loadPass('BufferA', config.passes.BufferA);
  const bufferBPass = await loadPass('BufferB', config.passes.BufferB);
  const bufferCPass = await loadPass('BufferC', config.passes.BufferC);
  const bufferDPass = await loadPass('BufferD', config.passes.BufferD);

  // Build metadata
  const title = config.meta?.title ?? path.basename(root);
  const author = config.meta?.author ?? null;
  const description = config.meta?.description ?? null;

  const project: ShadertoyProject = {
    root,
    meta: { title, author, description },
    layout: config.layout ?? 'centered',
    controls: config.controls ?? false,
    commonSource,
    passes: {
      Image: imagePass,
      BufferA: bufferAPass,
      BufferB: bufferBPass,
      BufferC: bufferCPass,
      BufferD: bufferDPass,
    },
    textures: Array.from(textureMap.values()),
  };

  return project;
}
