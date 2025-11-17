/**
 * Browser-compatible project loader using Vite's import.meta.glob
 *
 * This works at build time - Vite statically analyzes and bundles the files.
 * Much better than trying to use Node's fs module in the browser!
 */

import { ShadertoyProject, ShadertoyConfig } from './types';

/**
 * Load a Shadertoy project from the demos/ folder.
 *
 * @param demoName - Name of the folder in demos/ (e.g., "simple-gradient")
 * @returns ShadertoyProject ready for the engine
 */
export async function loadDemoProject(demoName: string): Promise<ShadertoyProject> {
  // Use Vite's import.meta.glob to get all files in demos/
  // This is evaluated at build time, not runtime!
  const glslFiles = import.meta.glob<string>('/demos/**/*.glsl', {
    query: '?raw',
    import: 'default',
  });

  const jsonFiles = import.meta.glob<ShadertoyConfig>('/demos/**/*.json', {
    import: 'default',
  });

  // Import image files as URLs
  const imageFiles = import.meta.glob<string>('/demos/**/*.{jpg,jpeg,png,gif,webp,bmp}', {
    query: '?url',
    import: 'default',
  });

  // Check if this demo has a config file
  const configPath = `/demos/${demoName}/shadertoy.config.json`;
  const hasConfig = configPath in jsonFiles;

  if (hasConfig) {
    // Multi-pass project with config
    return await loadWithConfig(demoName, jsonFiles, glslFiles, imageFiles);
  } else {
    // Simple single-pass project
    return await loadSinglePass(demoName, glslFiles);
  }
}

/**
 * Load a single-pass demo (just image.glsl, no config).
 */
async function loadSinglePass(
  demoName: string,
  glslFiles: Record<string, () => Promise<string>>
): Promise<ShadertoyProject> {
  const imagePath = `/demos/${demoName}/image.glsl`;

  if (!(imagePath in glslFiles)) {
    throw new Error(`Demo '${demoName}' not found. Expected ${imagePath}`);
  }

  const imageSource = await glslFiles[imagePath]();

  return {
    root: `/demos/${demoName}`,
    meta: {
      title: demoName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      author: null,
      description: null,
    },
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

/**
 * Load a multi-pass demo with shadertoy.config.json.
 */
async function loadWithConfig(
  demoName: string,
  jsonFiles: Record<string, () => Promise<ShadertoyConfig>>,
  glslFiles: Record<string, () => Promise<string>>,
  imageFiles: Record<string, () => Promise<string>>
): Promise<ShadertoyProject> {
  const configPath = `/demos/${demoName}/shadertoy.config.json`;
  const config = await jsonFiles[configPath]();

  // Load common.glsl if specified or if it exists
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

  // Collect all texture references from channels
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

  // Load textures
  const textures: any[] = [];
  const texturePathToName = new Map<string, string>();

  for (const texturePath of texturePathsSet) {
    // Resolve path relative to demo folder
    const fullPath = `/demos/${demoName}/${texturePath.replace(/^\.\//, '')}`;

    if (!(fullPath in imageFiles)) {
      throw new Error(`Texture not found: ${texturePath} (expected at ${fullPath})`);
    }

    const imageUrl = await imageFiles[fullPath]();

    // Generate texture name from filename
    const textureName = texturePath.split('/').pop()!.replace(/\.[^.]+$/, '');

    textures.push({
      name: textureName,
      source: imageUrl,  // Vite asset URL
      filter: 'linear' as const,
      wrap: 'repeat' as const,
    });

    texturePathToName.set(texturePath, textureName);
  }

  // Load passes
  const passes: any = {};

  for (const passName of passOrder) {
    const passConfig = config.passes[passName];
    if (!passConfig) continue;

    // Determine source file
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

    // Normalize channels
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

  // Build metadata
  const title = config.meta?.title || demoName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const author = config.meta?.author || null;
  const description = config.meta?.description || null;

  return {
    root: `/demos/${demoName}`,
    meta: { title, author, description },
    commonSource,
    passes,
    textures,
  };
}

/**
 * Normalize a channel from JSON config to ChannelSource.
 */
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
