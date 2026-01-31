/**
 * Helper functions for loading demo files
 * Called by the generated loader
 */

import {
  ShadertoyProject,
  ShadertoyConfig,
  PassName,
  ChannelValue,
  ChannelJSONObject,
  DemoScriptHooks,
} from './types';

/**
 * Case-insensitive file lookup helper.
 * Returns the actual key from the record that matches the path (case-insensitive).
 */
function findFileCaseInsensitive<T>(
  files: Record<string, T>,
  path: string
): string | null {
  // First try exact match
  if (path in files) return path;

  // Try case-insensitive match
  const lowerPath = path.toLowerCase();
  for (const key of Object.keys(files)) {
    if (key.toLowerCase() === lowerPath) {
      return key;
    }
  }
  return null;
}

/**
 * Type guard for PassName.
 */
function isPassName(s: string): s is PassName {
  return s === 'Image' || s === 'BufferA' || s === 'BufferB' || s === 'BufferC' || s === 'BufferD';
}

/**
 * Parse a channel value (string shorthand or object) into normalized ChannelJSONObject.
 */
function parseChannelValue(value: ChannelValue): ChannelJSONObject | null {
  if (typeof value === 'string') {
    if (isPassName(value)) {
      return { buffer: value };
    }
    if (value === 'keyboard') {
      return { keyboard: true };
    }
    return { texture: value };
  }
  return value;
}

export async function loadDemo(
  demoPath: string,
  glslFiles: Record<string, () => Promise<string>>,
  jsonFiles: Record<string, () => Promise<ShadertoyConfig>>,
  imageFiles: Record<string, () => Promise<string>>,
  scriptFiles?: Record<string, () => Promise<any>>
): Promise<ShadertoyProject> {
  // Normalize path - handle both "./path" and "path" formats
  const normalizedPath = demoPath.startsWith('./') ? demoPath : `./${demoPath}`;
  const configPath = `${normalizedPath}/config.json`;
  const hasConfig = configPath in jsonFiles;

  if (hasConfig) {
    const config = await jsonFiles[configPath]();
    const hasPassConfigs = config.Image || config.BufferA || config.BufferB ||
                           config.BufferC || config.BufferD;

    if (hasPassConfigs) {
      return loadWithConfig(normalizedPath, config, glslFiles, imageFiles, scriptFiles);
    } else {
      // Config with only settings (layout, controls, etc.) but no passes
      return loadSinglePass(normalizedPath, glslFiles, config, scriptFiles);
    }
  } else {
    return loadSinglePass(normalizedPath, glslFiles, undefined, scriptFiles);
  }
}

/**
 * Load script.js from a demo folder if present.
 */
async function loadScript(
  demoPath: string,
  scriptFiles?: Record<string, () => Promise<any>>
): Promise<DemoScriptHooks | null> {
  if (!scriptFiles) return null;

  const scriptPath = `${demoPath}/script.js`;
  const actualPath = findFileCaseInsensitive(scriptFiles, scriptPath);
  if (!actualPath) return null;

  const mod = await scriptFiles[actualPath]();
  const hooks: DemoScriptHooks = {};
  if (typeof mod.setup === 'function') hooks.setup = mod.setup;
  if (typeof mod.onFrame === 'function') hooks.onFrame = mod.onFrame;

  return (hooks.setup || hooks.onFrame) ? hooks : null;
}

async function loadSinglePass(
  demoPath: string,
  glslFiles: Record<string, () => Promise<string>>,
  configOverrides?: Partial<ShadertoyConfig>,
  scriptFiles?: Record<string, () => Promise<any>>
): Promise<ShadertoyProject> {
  const imagePath = `${demoPath}/image.glsl`;
  const actualImagePath = findFileCaseInsensitive(glslFiles, imagePath);

  if (!actualImagePath) {
    throw new Error(`Demo '${demoPath}' not found. Expected ${imagePath}`);
  }

  const imageSource = await glslFiles[actualImagePath]();

  const layout = configOverrides?.layout || 'tabbed';
  const controls = configOverrides?.controls ?? true;
  // Extract name from path for title (e.g., "./shaders/example-gradient" -> "example-gradient")
  const demoName = demoPath.split('/').pop() || demoPath;
  const title = configOverrides?.title ||
                demoName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const theme = configOverrides?.theme || 'light';

  return {
    root: demoPath,
    meta: {
      title,
      author: configOverrides?.author || null,
      description: configOverrides?.description || null,
    },
    layout,
    theme,
    controls,
    startPaused: configOverrides?.startPaused ?? false,
    pixelRatio: configOverrides?.pixelRatio ?? null,
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
    uniforms: configOverrides?.uniforms ?? {},
    script: await loadScript(demoPath, scriptFiles),
  };
}

async function loadWithConfig(
  demoPath: string,
  config: ShadertoyConfig,
  glslFiles: Record<string, () => Promise<string>>,
  imageFiles: Record<string, () => Promise<string>>,
  scriptFiles?: Record<string, () => Promise<any>>
): Promise<ShadertoyProject> {

  // Extract pass configs from top level
  const passConfigs = {
    Image: config.Image,
    BufferA: config.BufferA,
    BufferB: config.BufferB,
    BufferC: config.BufferC,
    BufferD: config.BufferD,
  };

  // Load common source
  let commonSource: string | null = null;
  if (config.common) {
    const commonPath = `${demoPath}/${config.common}`;
    const actualCommonPath = findFileCaseInsensitive(glslFiles, commonPath);
    if (actualCommonPath) {
      commonSource = await glslFiles[actualCommonPath]();
    }
  } else {
    const defaultCommonPath = `${demoPath}/common.glsl`;
    const actualCommonPath = findFileCaseInsensitive(glslFiles, defaultCommonPath);
    if (actualCommonPath) {
      commonSource = await glslFiles[actualCommonPath]();
    }
  }

  // Collect all texture references with their config options
  interface TextureRef {
    path: string;
    filter: 'nearest' | 'linear';
    wrap: 'clamp' | 'repeat';
  }
  const textureRefs = new Map<string, TextureRef>();
  const passOrder = ['Image', 'BufferA', 'BufferB', 'BufferC', 'BufferD'] as const;

  for (const passName of passOrder) {
    const passConfig = passConfigs[passName];
    if (!passConfig) continue;

    for (const channelKey of ['iChannel0', 'iChannel1', 'iChannel2', 'iChannel3'] as const) {
      const channelValue = passConfig[channelKey];
      if (!channelValue) continue;

      const parsed = parseChannelValue(channelValue);
      if (parsed && 'texture' in parsed) {
        // Only store the first reference's options (deduplicated by path)
        if (!textureRefs.has(parsed.texture)) {
          textureRefs.set(parsed.texture, {
            path: parsed.texture,
            filter: parsed.filter ?? 'linear',
            wrap: parsed.wrap ?? 'repeat',
          });
        }
      }
    }
  }

  // Load textures
  const textures: any[] = [];
  const texturePathToName = new Map<string, string>();

  for (const [texturePath, ref] of textureRefs) {
    const fullPath = `${demoPath}/${texturePath.replace(/^\.\//, '')}`;
    const actualPath = findFileCaseInsensitive(imageFiles, fullPath);

    if (!actualPath) {
      throw new Error(`Texture not found: ${texturePath} (expected at ${fullPath})`);
    }

    const imageUrl = await imageFiles[actualPath]();
    const textureFilename = texturePath.split('/').pop()!;
    const textureName = textureFilename.replace(/\.[^.]+$/, '');

    textures.push({
      name: textureName,
      filename: textureFilename,
      source: imageUrl,
      filter: ref.filter,
      wrap: ref.wrap,
    });

    texturePathToName.set(texturePath, textureName);
  }

  // Build passes
  const passes: any = {};

  for (const passName of passOrder) {
    const passConfig = passConfigs[passName];
    if (!passConfig) continue;

    const defaultNames: Record<string, string> = {
      Image: 'image.glsl',
      BufferA: 'bufferA.glsl',
      BufferB: 'bufferB.glsl',
      BufferC: 'bufferC.glsl',
      BufferD: 'bufferD.glsl',
    };

    const sourceFile = passConfig.source || defaultNames[passName];
    const sourcePath = `${demoPath}/${sourceFile}`;
    const actualSourcePath = findFileCaseInsensitive(glslFiles, sourcePath);

    if (!actualSourcePath) {
      throw new Error(`Missing shader file: ${sourcePath}`);
    }

    const glslSource = await glslFiles[actualSourcePath]();

    const channels = [
      normalizeChannel(passConfig.iChannel0, texturePathToName),
      normalizeChannel(passConfig.iChannel1, texturePathToName),
      normalizeChannel(passConfig.iChannel2, texturePathToName),
      normalizeChannel(passConfig.iChannel3, texturePathToName),
    ];

    passes[passName] = {
      name: passName,
      glslSource,
      channels,
    };
  }

  if (!passes.Image) {
    throw new Error(`Demo '${demoPath}' must have an Image pass`);
  }

  // Extract name from path for title (e.g., "./shaders/example-gradient" -> "example-gradient")
  const demoName = demoPath.split('/').pop() || demoPath;
  const title = config.title ||
                demoName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const author = config.author || null;
  const description = config.description || null;
  const layout = config.layout || 'tabbed';
  const theme = config.theme || 'light';
  const controls = config.controls ?? true;

  return {
    root: demoPath,
    meta: { title, author, description },
    layout,
    theme,
    controls,
    startPaused: config.startPaused ?? false,
    pixelRatio: config.pixelRatio ?? null,
    commonSource,
    passes,
    textures,
    uniforms: config.uniforms ?? {},
    script: await loadScript(demoPath, scriptFiles),
  };
}

function normalizeChannel(channelValue: ChannelValue | undefined, texturePathToName?: Map<string, string>): any {
  if (!channelValue) {
    return { kind: 'none' };
  }

  // Parse string shorthand
  const parsed = parseChannelValue(channelValue);
  if (!parsed) {
    return { kind: 'none' };
  }

  if ('buffer' in parsed) {
    return {
      kind: 'buffer',
      buffer: parsed.buffer,
      current: !!parsed.current,
    };
  }

  if ('texture' in parsed) {
    const textureName = texturePathToName?.get(parsed.texture) || parsed.texture;
    return {
      kind: 'texture',
      name: textureName,
      cubemap: parsed.type === 'cubemap',
    };
  }

  if ('keyboard' in parsed) {
    return { kind: 'keyboard' };
  }

  return { kind: 'none' };
}
