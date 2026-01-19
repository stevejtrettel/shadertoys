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
  KeyConfig,
  KeyDefinition,
  NormalizedKeyBinding,
  KeyMode,
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

// =============================================================================
// Key Code Mapping (duplicated from loadProject.ts for browser compatibility)
// =============================================================================

const KEY_CODE_MAP: Record<string, number> = {
  // Letters (A-Z)
  A: 65, B: 66, C: 67, D: 68, E: 69, F: 70, G: 71, H: 72, I: 73, J: 74,
  K: 75, L: 76, M: 77, N: 78, O: 79, P: 80, Q: 81, R: 82, S: 83, T: 84,
  U: 85, V: 86, W: 87, X: 88, Y: 89, Z: 90,

  // Numbers (0-9)
  '0': 48, '1': 49, '2': 50, '3': 51, '4': 52,
  '5': 53, '6': 54, '7': 55, '8': 56, '9': 57,

  // Arrow keys
  ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39,
  Up: 38, Down: 40, Left: 37, Right: 39,

  // Modifiers
  Shift: 16, ShiftLeft: 16, ShiftRight: 16,
  Ctrl: 17, Control: 17, ControlLeft: 17, ControlRight: 17,
  Alt: 18, AltLeft: 18, AltRight: 18,
  Meta: 91, MetaLeft: 91, MetaRight: 92,

  // Special keys
  Space: 32, ' ': 32,
  Enter: 13, Return: 13,
  Escape: 27, Esc: 27,
  Tab: 9,
  Backspace: 8,
  Delete: 46,
  Insert: 45,
  Home: 36,
  End: 35,
  PageUp: 33,
  PageDown: 34,

  // Function keys
  F1: 112, F2: 113, F3: 114, F4: 115, F5: 116, F6: 117,
  F7: 118, F8: 119, F9: 120, F10: 121, F11: 122, F12: 123,

  // Punctuation
  Comma: 188, ',': 188,
  Period: 190, '.': 190,
  Slash: 191, '/': 191,
  Semicolon: 186, ';': 186,
  Quote: 222, "'": 222,
  BracketLeft: 219, '[': 219,
  BracketRight: 221, ']': 221,
  Backslash: 220, '\\': 220,
  Minus: 189, '-': 189,
  Equal: 187, '=': 187,
  Backquote: 192, '`': 192,
};

function keyNameToCode(keyName: string): number | undefined {
  if (KEY_CODE_MAP[keyName] !== undefined) {
    return KEY_CODE_MAP[keyName];
  }
  if (keyName.length === 1) {
    const upper = keyName.toUpperCase();
    if (KEY_CODE_MAP[upper] !== undefined) {
      return KEY_CODE_MAP[upper];
    }
  }
  return undefined;
}

function normalizeKeyDefinition(name: string, def: KeyDefinition): NormalizedKeyBinding {
  let keys: string[];
  let mode: KeyMode = 'hold';

  if (typeof def === 'string') {
    keys = [def];
  } else if (Array.isArray(def)) {
    keys = def;
  } else {
    keys = Array.isArray(def.key) ? def.key : [def.key];
    mode = def.mode ?? 'hold';
  }

  const keyCodes: number[] = [];
  for (const keyName of keys) {
    const code = keyNameToCode(keyName);
    if (code === undefined) {
      console.warn(`Unknown key name '${keyName}' in key binding '${name}'. Skipping.`);
      continue;
    }
    keyCodes.push(code);
  }

  return { name, keyCodes, mode };
}

function normalizeKeyConfig(config: KeyConfig | undefined): NormalizedKeyBinding[] {
  if (!config) return [];

  const bindings: NormalizedKeyBinding[] = [];
  for (const [name, def] of Object.entries(config)) {
    const binding = normalizeKeyDefinition(name, def);
    if (binding.keyCodes.length > 0) {
      bindings.push(binding);
    }
  }
  return bindings;
}

export async function loadDemo(
  demoPath: string,
  glslFiles: Record<string, () => Promise<string>>,
  jsonFiles: Record<string, () => Promise<ShadertoyConfig>>,
  imageFiles: Record<string, () => Promise<string>>
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
      return loadWithConfig(normalizedPath, config, glslFiles, imageFiles);
    } else {
      // Config with only settings (layout, controls, etc.) but no passes
      return loadSinglePass(normalizedPath, glslFiles, config);
    }
  } else {
    return loadSinglePass(normalizedPath, glslFiles);
  }
}

async function loadSinglePass(
  demoPath: string,
  glslFiles: Record<string, () => Promise<string>>,
  configOverrides?: Partial<ShadertoyConfig>
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
    uniforms: {},
    keys: normalizeKeyConfig(configOverrides?.keys),
  };
}

async function loadWithConfig(
  demoPath: string,
  config: ShadertoyConfig,
  glslFiles: Record<string, () => Promise<string>>,
  imageFiles: Record<string, () => Promise<string>>
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
      filename: textureFilename,  // Preserve original filename for display
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
    keys: normalizeKeyConfig(config.keys),
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
