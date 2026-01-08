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
  PassConfigSimplified,
  PassConfigLegacy,
} from './types';

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

/**
 * Convert legacy pass config to simplified format.
 */
function convertLegacyPassConfig(legacy: PassConfigLegacy | undefined): PassConfigSimplified | undefined {
  if (!legacy) return undefined;

  const result: PassConfigSimplified = {};
  if (legacy.source) result.source = legacy.source;

  if (legacy.channels) {
    if (legacy.channels.iChannel0) result.iChannel0 = legacy.channels.iChannel0;
    if (legacy.channels.iChannel1) result.iChannel1 = legacy.channels.iChannel1;
    if (legacy.channels.iChannel2) result.iChannel2 = legacy.channels.iChannel2;
    if (legacy.channels.iChannel3) result.iChannel3 = legacy.channels.iChannel3;
  }

  return result;
}

export async function loadDemo(
  demoName: string,
  glslFiles: Record<string, () => Promise<string>>,
  jsonFiles: Record<string, () => Promise<ShadertoyConfig>>,
  imageFiles: Record<string, () => Promise<string>>
): Promise<ShadertoyProject> {
  const configPath = `/demos/${demoName}/config.json`;
  const hasConfig = configPath in jsonFiles;

  if (hasConfig) {
    const config = await jsonFiles[configPath]();
    // Detect format: legacy has "passes" key, new format has passes at top level
    const isLegacyFormat = !!config.passes;
    const hasNewFormatPasses = config.Image || config.BufferA || config.BufferB ||
                               config.BufferC || config.BufferD;

    if (isLegacyFormat || hasNewFormatPasses) {
      return loadWithConfig(demoName, config, glslFiles, imageFiles);
    } else {
      // Config with only settings (layout, controls, etc.) but no passes
      return loadSinglePass(demoName, glslFiles, config);
    }
  } else {
    return loadSinglePass(demoName, glslFiles);
  }
}

async function loadSinglePass(
  demoName: string,
  glslFiles: Record<string, () => Promise<string>>,
  configOverrides?: Partial<ShadertoyConfig>
): Promise<ShadertoyProject> {
  const imagePath = `/demos/${demoName}/image.glsl`;

  if (!(imagePath in glslFiles)) {
    throw new Error(`Demo '${demoName}' not found. Expected ${imagePath}`);
  }

  const imageSource = await glslFiles[imagePath]();

  // Support both flat and nested metadata
  const layout = configOverrides?.layout || 'tabbed';
  const controls = configOverrides?.controls ?? true;
  const title = configOverrides?.title || configOverrides?.meta?.title ||
                demoName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return {
    root: `/demos/${demoName}`,
    meta: {
      title,
      author: configOverrides?.author || configOverrides?.meta?.author || null,
      description: configOverrides?.description || configOverrides?.meta?.description || null,
    },
    layout,
    controls,
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
}

async function loadWithConfig(
  demoName: string,
  config: ShadertoyConfig,
  glslFiles: Record<string, () => Promise<string>>,
  imageFiles: Record<string, () => Promise<string>>
): Promise<ShadertoyProject> {

  // Detect format and normalize pass configs
  const isLegacyFormat = !!config.passes;

  let passConfigs: {
    Image?: PassConfigSimplified;
    BufferA?: PassConfigSimplified;
    BufferB?: PassConfigSimplified;
    BufferC?: PassConfigSimplified;
    BufferD?: PassConfigSimplified;
  };

  if (isLegacyFormat) {
    passConfigs = {
      Image: convertLegacyPassConfig(config.passes!.Image),
      BufferA: convertLegacyPassConfig(config.passes!.BufferA),
      BufferB: convertLegacyPassConfig(config.passes!.BufferB),
      BufferC: convertLegacyPassConfig(config.passes!.BufferC),
      BufferD: convertLegacyPassConfig(config.passes!.BufferD),
    };
  } else {
    passConfigs = {
      Image: config.Image,
      BufferA: config.BufferA,
      BufferB: config.BufferB,
      BufferC: config.BufferC,
      BufferD: config.BufferD,
    };
  }

  // Load common source
  let commonSource: string | null = null;
  if (config.common) {
    const commonPath = `/demos/${demoName}/${config.common}`;
    if (commonPath in glslFiles) {
      commonSource = await glslFiles[commonPath]();
    }
  } else {
    const defaultCommonPath = `/demos/${demoName}/common.glsl`;
    if (defaultCommonPath in glslFiles) {
      commonSource = await glslFiles[defaultCommonPath]();
    }
  }

  // Collect all texture paths
  const texturePathsSet = new Set<string>();
  const passOrder = ['Image', 'BufferA', 'BufferB', 'BufferC', 'BufferD'] as const;

  for (const passName of passOrder) {
    const passConfig = passConfigs[passName];
    if (!passConfig) continue;

    for (const channelKey of ['iChannel0', 'iChannel1', 'iChannel2', 'iChannel3'] as const) {
      const channelValue = passConfig[channelKey];
      if (!channelValue) continue;

      const parsed = parseChannelValue(channelValue);
      if (parsed && 'texture' in parsed) {
        texturePathsSet.add(parsed.texture);
      }
    }
  }

  // Load textures
  const textures: any[] = [];
  const texturePathToName = new Map<string, string>();

  for (const texturePath of texturePathsSet) {
    const fullPath = `/demos/${demoName}/${texturePath.replace(/^\.\//, '')}`;

    if (!(fullPath in imageFiles)) {
      throw new Error(`Texture not found: ${texturePath} (expected at ${fullPath})`);
    }

    const imageUrl = await imageFiles[fullPath]();
    const textureName = texturePath.split('/').pop()!.replace(/\.[^.]+$/, '');

    textures.push({
      name: textureName,
      source: imageUrl,
      filter: 'linear' as const,
      wrap: 'repeat' as const,
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
    const sourcePath = `/demos/${demoName}/${sourceFile}`;

    if (!(sourcePath in glslFiles)) {
      throw new Error(`Missing shader file: ${sourcePath}`);
    }

    const glslSource = await glslFiles[sourcePath]();

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
    throw new Error(`Demo '${demoName}' must have an Image pass`);
  }

  // Support both flat and nested metadata
  const title = config.title || config.meta?.title ||
                demoName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const author = config.author || config.meta?.author || null;
  const description = config.description || config.meta?.description || null;
  const layout = config.layout || 'tabbed';
  const controls = config.controls ?? true;

  return {
    root: `/demos/${demoName}`,
    meta: { title, author, description },
    layout,
    controls,
    commonSource,
    passes,
    textures,
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
      previous: !!parsed.previous,
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
