
## Shadertoy Runner – Project & Config Specification (v1)

### 0. Scope

This document specifies the **project and config layer** of the Shadertoy Runner:

* How shader projects are laid out on disk.
* The JSON configuration format (`shadertoy.config.json`).
* The in-memory `ShadertoyProject` representation.
* The behavior of `loadProject(root: string) → ShadertoyProject`.

The runtime (WebGL, animation loop, etc.) is *not* covered here.

---

### 1. Shadertoy model recap (names only)

We mimic Shadertoy’s mental model:

* Pass names:

    * `Image`
    * `BufferA`
    * `BufferB`
    * `BufferC`
    * `BufferD`

* GLSL entry point per pass:

  ```glsl
  void mainImage(out vec4 fragColor, in vec2 fragCoord);
  ```

* Built-in uniforms (provided later by runtime, listed here for context):

  ```glsl
  uniform vec3  iResolution;
  uniform float iTime;
  uniform float iTimeDelta;
  uniform int   iFrame;
  uniform vec4  iMouse;
  uniform sampler2D iChannel0;
  uniform sampler2D iChannel1;
  uniform sampler2D iChannel2;
  uniform sampler2D iChannel3;
  ```

Config and project types *only* refer to passes by these names.

---

### 2. Project layout on disk

Each project lives in its own directory (e.g. under `projects/`):

```text
projects/
  julia-single/
    image.glsl

  heat-diffusion/
    shadertoy.config.json
    common.glsl
    image.glsl
    bufferA.glsl
    textures/
      noise.png
      palette.png
```

#### 2.1 Default file names

Default file names for passes (when not overridden in config):

* `Image`   → `image.glsl`
* `BufferA` → `bufferA.glsl`
* `BufferB` → `bufferB.glsl`
* `BufferC` → `bufferC.glsl`
* `BufferD` → `bufferD.glsl`

Default name for shared/common code:

* `common.glsl` (optional)

Config file:

* `shadertoy.config.json` (optional, but required for multi-pass / textures).

All paths in the config are **relative to the project root**.

---

### 3. Single-pass projects (no config)

A project is treated as a **single-pass project** iff:

* `shadertoy.config.json` does **not** exist in the project root, **and**
* the root contains exactly one GLSL file: `image.glsl`, **and**
* there is no `textures/` directory containing images, **and**
* there are no other `.glsl` files.

Then:

* Only the `Image` pass exists.
* No `BufferA`–`BufferD`.
* No common code (`common.glsl` is *not* allowed in this mode).
* All four channels on `Image` are unused.
* Meta:

    * `title` = directory name
    * `author` = `null`
    * `description` = `null`

If any extra `.glsl` file or texture file is present with no config, `loadProject` MUST treat that as an error and instruct the user to add `shadertoy.config.json`.

---

### 4. Multi-pass / textured projects (config required)

If a project uses any of the following:

* More than one pass (i.e., any of `bufferA.glsl`, `bufferB.glsl`, …), or
* Any external textures, or
* Non-default pass filenames, or
* Any non-trivial `iChannel` routing,

then `shadertoy.config.json` is **required** in the project root.

If `shadertoy.config.json` is missing in such a project, `loadProject` MUST throw a clear error.

---

### 5. JSON config (`shadertoy.config.json`)

The config describes:

* Project metadata (title, author, description).
* Which passes exist and which GLSL file each uses.
* Per-pass `iChannel0..3` routing:

    * Buffers (Image/BufferA–D), including `previous`-frame ping-pong.
    * Textures (2D images on disk).
    * Keyboard texture (optional; runtime may not support it yet).
* Optional common GLSL file path.

#### 5.1 Type aliases

Informal type notation (can be turned into TS):

```ts
type PassName = 'Image' | 'BufferA' | 'BufferB' | 'BufferC' | 'BufferD';
```

#### 5.2 ChannelJSON – what goes under `"channels"`

Each pass has an optional `channels` object:

```ts
interface PassConfig {
  source?: string;  // optional GLSL path, default depends on pass name
  channels?: {
    iChannel0?: ChannelJSON;
    iChannel1?: ChannelJSON;
    iChannel2?: ChannelJSON;
    iChannel3?: ChannelJSON;
  };
}
```

`ChannelJSON` is **only** object forms, for uniformity:

```ts
type ChannelJSON =
  | { buffer: PassName; previous?: boolean }         // read from another pass
  | { texture: string; filter?: 'nearest' | 'linear';
                      wrap?: 'clamp' | 'repeat' }    // 2D texture from image file
  | { keyboard: true };                              // keyboard texture
```

Rules:

* If `channels` is missing → all four channels are unused.
* If `channels.iChannelK` is missing → that channel is unused.
* There is no explicit `"none"`; omission = none.

**Semantics:**

* `{ "buffer": "BufferA" }`

    * Read from BufferA’s **current** output texture (this frame).
* `{ "buffer": "BufferA", "previous": true }`

    * Read from BufferA’s **previous** output texture (last frame). Used for ping-pong.
* `{ "texture": "textures/dog.png" }`

    * Read from a 2D texture loaded from that path. Optional:

        * `filter` (default `"linear"`).
        * `wrap` (default `"repeat"`).
* `{ "keyboard": true }`

    * Read from a runtime-maintained keyboard texture (runtime may throw an error if unsupported in this version).

#### 5.3 Top-level config shape

```ts
interface ShadertoyConfig {
  meta?: {
    title?: string;
    author?: string;
    description?: string;
  };

  // Optional; if omitted, loader will still check for "common.glsl"
  // and use it if present.
  common?: string;

  passes: {
    Image: PassConfig;       // required
    BufferA?: PassConfig;
    BufferB?: PassConfig;
    BufferC?: PassConfig;
    BufferD?: PassConfig;
  };
}
```

Notes:

* `passes.Image` MUST exist.
* `passes` MUST NOT contain any other keys besides `Image`, `BufferA`–`BufferD`.

#### 5.4 Config examples

**Example 1: Image reads from BufferA and BufferC**

```json
{
  "meta": {
    "title": "Two-buffer demo"
  },
  "passes": {
    "BufferA": {},
    "BufferC": {},
    "Image": {
      "channels": {
        "iChannel0": { "buffer": "BufferA" },
        "iChannel1": { "buffer": "BufferC" }
      }
    }
  }
}
```

**Example 2: BufferA ping-pong + Image view**

```json
{
  "meta": {
    "title": "Heat Diffusion"
  },
  "passes": {
    "BufferA": {
      "channels": {
        "iChannel0": { "buffer": "BufferA", "previous": true }
      }
    },
    "Image": {
      "channels": {
        "iChannel0": { "buffer": "BufferA" }
      }
    }
  }
}
```

**Example 3: BufferC uses a PNG**

```json
{
  "passes": {
    "BufferC": {
      "channels": {
        "iChannel0": { "texture": "textures/dog.png" }
      }
    },
    "Image": {}
  }
}
```

**Example 4: Using keyboard on `iChannel0`**

```json
{
  "passes": {
    "Image": {
      "channels": {
        "iChannel0": { "keyboard": true }
      }
    }
  }
}
```

---

### 6. In-memory project representation

`loadProject(root)` produces a `ShadertoyProject` that the engine uses. The engine should *not* need to know about JSON or filenames.

#### 6.1 Internal ChannelSource

```ts
type ChannelSource =
  | { kind: 'none' }
  | { kind: 'buffer'; buffer: PassName; previous: boolean }
  | { kind: 'texture2D'; name: string }   // internal ID: "tex0", "tex1", ...
  | { kind: 'keyboard' };
```

#### 6.2 Textures in memory

Textures are deduplicated by `(source, filter, wrap)` (or at least by `source`):

```ts
interface ShadertoyTexture2D {
  name: string;                 // internal ID, e.g. "tex0"
  source: string;               // texture path from config
  filter: 'nearest' | 'linear';
  wrap: 'clamp' | 'repeat';
}
```

#### 6.3 Pass & project types

```ts
interface ShadertoyPass {
  name: PassName;
  glslSource: string;           // full GLSL contents
  channels: ChannelSource[];    // length exactly 4
}

interface ShadertoyMeta {
  title: string;
  author: string | null;
  description: string | null;
}

interface ShadertoyProject {
  root: string;                 // project root path
  meta: ShadertoyMeta;
  commonSource: string | null;  // contents of common.glsl or config.common, else null
  passes: {
    Image: ShadertoyPass;
    BufferA?: ShadertoyPass;
    BufferB?: ShadertoyPass;
    BufferC?: ShadertoyPass;
    BufferD?: ShadertoyPass;
  };
  textures: ShadertoyTexture2D[];  // deduped list
}
```

#### 6.4 Normalization guarantees from `loadProject`

* `passes.Image` is always defined.
* Each defined pass has `channels.length === 4`:

    * missing channels → `kind: 'none'`.
* `meta`:

    * `title` = config.meta.title or directory name.
    * `author` = config.meta.author or `null`.
    * `description` = config.meta.description or `null`.
* `commonSource`:

    * If `config.common` is set → that file’s contents.
    * Else if `common.glsl` exists → that file’s contents.
    * Else → `null`.
* `textures`:

    * Contains unique `(source, filter, wrap)` entries, with unique `name`s.
    * All `ChannelSource` of `kind: 'texture2D'` refer to these names.

---

### 7. `loadProject(root: string): Promise<ShadertoyProject>`

#### 7.1 Responsibilities

* Validate disk layout according to single-pass / multi-pass rules.
* Parse and validate JSON if present.
* Load GLSL files.
* Build and normalize a `ShadertoyProject`.

#### 7.2 Behavior overview

1. Check if `shadertoy.config.json` exists.
2. If it **does not** exist → attempt `loadSinglePassProject(root)`.
3. If it **does** exist → `loadProjectWithConfig(root, config)`.
4. Either path returns a fully normalized `ShadertoyProject` as above.
5. All user-facing failures (missing files, invalid config) must throw `Error` with descriptive messages.

---

## Reference TypeScript Implementation

Below is a “backup” implementation consistent with the spec.
It assumes a Node-style environment with `fs/promises` and `path` (you can tweak imports as needed).

### `src/project/types.ts`

```ts
// src/project/types.ts

export type PassName = 'Image' | 'BufferA' | 'BufferB' | 'BufferC' | 'BufferD';

export interface ChannelJSONBuffer {
  buffer: PassName;
  previous?: boolean;
}

export interface ChannelJSONTexture {
  texture: string;
  filter?: 'nearest' | 'linear';
  wrap?: 'clamp' | 'repeat';
}

export interface ChannelJSONKeyboard {
  keyboard: true;
}

export type ChannelJSON =
  | ChannelJSONBuffer
  | ChannelJSONTexture
  | ChannelJSONKeyboard;

export interface PassConfig {
  source?: string;
  channels?: {
    iChannel0?: ChannelJSON;
    iChannel1?: ChannelJSON;
    iChannel2?: ChannelJSON;
    iChannel3?: ChannelJSON;
  };
}

export interface ShadertoyConfig {
  meta?: {
    title?: string;
    author?: string;
    description?: string;
  };
  common?: string;
  passes: {
    Image: PassConfig;
    BufferA?: PassConfig;
    BufferB?: PassConfig;
    BufferC?: PassConfig;
    BufferD?: PassConfig;
    // no other keys allowed
  };
}

export type ChannelSource =
  | { kind: 'none' }
  | { kind: 'buffer'; buffer: PassName; previous: boolean }
  | { kind: 'texture2D'; name: string }
  | { kind: 'keyboard' };

export interface ShadertoyTexture2D {
  name: string;  // internal ID (e.g. "tex0")
  source: string;
  filter: 'nearest' | 'linear';
  wrap: 'clamp' | 'repeat';
}

export interface ShadertoyPass {
  name: PassName;
  glslSource: string;
  channels: ChannelSource[];  // length 4
}

export interface ShadertoyMeta {
  title: string;
  author: string | null;
  description: string | null;
}

export interface ShadertoyProject {
  root: string;
  meta: ShadertoyMeta;
  commonSource: string | null;
  passes: {
    Image: ShadertoyPass;
    BufferA?: ShadertoyPass;
    BufferB?: ShadertoyPass;
    BufferC?: ShadertoyPass;
    BufferD?: ShadertoyPass;
  };
  textures: ShadertoyTexture2D[];
}
```

---

### `src/project/loadProject.ts`

```ts
// src/project/loadProject.ts

import { promises as fs } from 'fs';
import * as path from 'path';
import {
  PassName,
  ChannelJSON,
  ChannelSource,
  ShadertoyConfig,
  ShadertoyPass,
  ShadertoyProject,
  ShadertoyTexture2D,
  PassConfig,
} from './types';

// ---------- Small helpers ----------

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function isPassName(s: string): s is PassName {
  return s === 'Image' || s === 'BufferA' || s === 'BufferB' || s === 'BufferC' || s === 'BufferD';
}

async function listGlslFiles(root: string): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.glsl'))
    .map((e) => e.name);
}

async function hasTexturesDirWithFiles(root: string): Promise<boolean> {
  const dir = path.join(root, 'textures');
  if (!(await fileExists(dir))) return false;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries.some((e) => e.isFile());
}

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

// ---------- Public entry ----------

export async function loadProject(root: string): Promise<ShadertoyProject> {
  const configPath = path.join(root, 'shadertoy.config.json');
  const hasConfig = await fileExists(configPath);

  if (hasConfig) {
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
    return await loadSinglePassProject(root);
  }
}

// ---------- Single-pass mode ----------

async function loadSinglePassProject(root: string): Promise<ShadertoyProject> {
  const imagePath = path.join(root, 'image.glsl');
  if (!(await fileExists(imagePath))) {
    throw new Error(`Single-pass project at '${root}' requires 'image.glsl'.`);
  }

  const glslFiles = await listGlslFiles(root);
  const extraGlsl = glslFiles.filter((name) => name !== 'image.glsl');
  if (extraGlsl.length > 0) {
    throw new Error(
      `Project at '${root}' contains multiple GLSL files (${glslFiles.join(
        ', '
      )}) but no 'shadertoy.config.json'. Add a config file to use multiple passes.`
    );
  }

  if (await hasTexturesDirWithFiles(root)) {
    throw new Error(
      `Project at '${root}' uses textures (in 'textures/' folder) but has no 'shadertoy.config.json'. Add a config file to define texture bindings.`
    );
  }

  const imageSource = await fs.readFile(imagePath, 'utf8');
  const title = path.basename(root);

  const project: ShadertoyProject = {
    root,
    meta: {
      title,
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

  return project;
}

// ---------- Config mode ----------

async function loadProjectWithConfig(root: string, config: ShadertoyConfig): Promise<ShadertoyProject> {
  // Basic validation of passes
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
    const defaultCommonPath = path.join(root, 'common.glsl');
    if (await fileExists(defaultCommonPath)) {
      commonSource = await fs.readFile(defaultCommonPath, 'utf8');
    }
  }

  // Texture dedupe map: key = source|filter|wrap, value = internal texture name (e.g. "tex0")
  const textureMap = new Map<string, ShadertoyTexture2D>();

  // Helper to register a texture from ChannelJSONTexture and return its internal name
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

  // Helper to build a ShadertoyPass from a PassName + PassConfig
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

    // Normalize channels
    const channelSources: ChannelSource[] = [];
    const ch = passConfig.channels ?? {};

    const keys = ['iChannel0', 'iChannel1', 'iChannel2', 'iChannel3'] as const;

    for (const key of keys) {
      const value = ch[key];
      if (!value) {
        channelSources.push({ kind: 'none' });
        continue;
      }

      // buffer
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

      // texture
      if ('texture' in value) {
        const internalName = registerTexture(value);
        channelSources.push({
          kind: 'texture2D',
          name: internalName,
        });
        continue;
      }

      // keyboard
      if ('keyboard' in value) {
        if (value.keyboard !== true) {
          throw new Error(
            `Invalid keyboard value for ${key} in pass '${name}' at '${root}'. Expected { "keyboard": true }.`
          );
        }
        channelSources.push({ kind: 'keyboard' });
        continue;
      }

      // If we got here, shape is unknown
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
    // Should not happen due to earlier check, but guard anyway
    throw new Error(`passes.Image must be defined in shadertoy.config.json at '${root}'.`);
  }

  const bufferAPass = await loadPass('BufferA', config.passes.BufferA);
  const bufferBPass = await loadPass('BufferB', config.passes.BufferB);
  const bufferCPass = await loadPass('BufferC', config.passes.BufferC);
  const bufferDPass = await loadPass('BufferD', config.passes.BufferD);

  // Meta
  const title = config.meta?.title ?? path.basename(root);
  const author = config.meta?.author ?? null;
  const description = config.meta?.description ?? null;

  const project: ShadertoyProject = {
    root,
    meta: { title, author, description },
    commonSource,
    passes: {
      Image: imagePass,
      BufferA: bufferAPass ?? undefined,
      BufferB: bufferBPass ?? undefined,
      BufferC: bufferCPass ?? undefined,
      BufferD: bufferDPass ?? undefined,
    },
    textures: Array.from(textureMap.values()),
  };

  return project;
}
```

