/**
 * Helper functions for loading demo files
 * Called by the generated loader
 */

import { ShadertoyProject, ShadertoyConfig } from './types';

export async function loadDemo(
  demoName: string,
  glslFiles: Record<string, () => Promise<string>>,
  jsonFiles: Record<string, () => Promise<ShadertoyConfig>>,
  imageFiles: Record<string, () => Promise<string>>
): Promise<ShadertoyProject> {
  // Check for config files (shadertoy.config.json takes priority, then config.json)
  const shadertoyConfigPath = `/demos/${demoName}/shadertoy.config.json`;
  const simpleConfigPath = `/demos/${demoName}/config.json`;

  const configPath = shadertoyConfigPath in jsonFiles
    ? shadertoyConfigPath
    : simpleConfigPath in jsonFiles
      ? simpleConfigPath
      : null;

  if (configPath) {
    const config = await jsonFiles[configPath]();
    // If config has passes defined, use full config loading
    // Otherwise, use single-pass with config overrides (for layout, controls, etc.)
    if (config.passes) {
      return loadWithConfig(demoName, config, glslFiles, imageFiles);
    } else {
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

  // Apply config overrides if provided
  const layout = configOverrides?.layout || 'tabbed';
  const controls = configOverrides?.controls ?? true;
  const title = configOverrides?.meta?.title || demoName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return {
    root: `/demos/${demoName}`,
    meta: {
      title,
      author: configOverrides?.meta?.author || null,
      description: configOverrides?.meta?.description || null,
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

  const texturePathsSet = new Set<string>();
  const passOrder = ['Image', 'BufferA', 'BufferB', 'BufferC', 'BufferD'] as const;

  for (const passName of passOrder) {
    const passConfig = config.passes[passName];
    if (!passConfig) continue;

    for (const channelKey of ['iChannel0', 'iChannel1', 'iChannel2', 'iChannel3'] as const) {
      const channelConfig = passConfig.channels?.[channelKey];
      if (channelConfig && 'texture' in channelConfig) {
        texturePathsSet.add(channelConfig.texture);
      }
    }
  }

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

  const passes: any = {};

  for (const passName of passOrder) {
    const passConfig = config.passes[passName];
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
      normalizeChannel(passConfig.channels?.iChannel0, texturePathToName),
      normalizeChannel(passConfig.channels?.iChannel1, texturePathToName),
      normalizeChannel(passConfig.channels?.iChannel2, texturePathToName),
      normalizeChannel(passConfig.channels?.iChannel3, texturePathToName),
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

  const title = config.meta?.title || demoName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const author = config.meta?.author || null;
  const description = config.meta?.description || null;
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

function normalizeChannel(channelJson: any, texturePathToName?: Map<string, string>): any {
  if (!channelJson) {
    return { kind: 'none' };
  }

  if ('buffer' in channelJson) {
    return {
      kind: 'buffer',
      buffer: channelJson.buffer,
      previous: !!channelJson.previous,
    };
  }

  if ('texture' in channelJson) {
    const textureName = texturePathToName?.get(channelJson.texture) || channelJson.texture;
    return {
      kind: 'texture2D',
      name: textureName,
    };
  }

  if ('keyboard' in channelJson) {
    return { kind: 'keyboard' };
  }

  return { kind: 'none' };
}
