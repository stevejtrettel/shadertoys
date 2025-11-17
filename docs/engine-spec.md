

# ⚙️  SHADERTOY ENGINE – TECHNICAL SPECIFICATION (v1)

## 0. Scope

This document specifies the **ENGINE** layer for the Shadertoy Runner:

✔️ It defines **how to run** a fully loaded `ShadertoyProject` (from our Project/Config layer).
❌ It does **not** define UI, editor, hot-reload, layout, or app shell.
❌ It does **not** define how shaders are bundled — only how they run **after being compiled**.

It **MUST** be possible to hand this document + the `loadProject.ts` implementation to an LLM and get a **working Shadertoy runner**.

---

## 1. Inputs and Outputs

### Engine Input:

A fully normalized:

```ts
ShadertoyProject
```

containing:

* `commonSource: string | null`
* Passes `Image`, `BufferA` … `BufferD`, each containing:

    * raw GLSL `glslSource`
    * normalized `channels: ChannelSource[4]`
* Deduped textures list

### Engine Output:

An object with methods:

```ts
interface ShadertoyEngine {
  readonly project: ShadertoyProject;
  readonly gl: WebGL2RenderingContext;
  readonly width: number;
  readonly height: number;

  step(timeNowSeconds: number): void;   // runs one frame worth of passes
  resize(width: number, height: number): void;
  dispose(): void;
}
```

The **App layer** controls:

* When frames run (`requestAnimationFrame`)
* When to call `.resize(...)`
* When to `.dispose()`

---

## 2. Execution Model

### 2.1 All passes run **every frame** in this fixed order:

```
BufferA → BufferB → BufferC → BufferD → Image
```

Exactly like Shadertoy.

If a buffer pass does not exist, skip it.

### 2.2 Every pass renders **to an offscreen floating-point texture**.

Each pass requires **two textures**:

* a **current** write target
* a **previous** read target (for ping-pong)

Even if the config *never* uses `"previous": true`, **you MUST allocate both**.

Why?
Because Shadertoy semantics require that all passes *could* read last frame.

### 2.3 For each frame:

For each pass:

```
Bind FBO → attach CURRENT texture
Bind shader program
Bind all iChannels according to config
Set uniforms
Draw full-screen triangle
Swap CURRENT ↔ PREVIOUS
```

After finishing all passes, the App may present `Image.currentTexture` to screen.

---

## 3. GPU Resource Rules

### 3.1 Texture format

**All render targets MUST be RGBA32F**.

* Internal format: `gl.RGBA32F`
* Format: `gl.RGBA`
* Type: `gl.FLOAT`

Shadertoy uses float textures — students expect this.

The engine MUST enable:

```js
gl.getExtension("EXT_color_buffer_float")
```

### 3.2 Texture size

The engine **owns resolution**, not the shader.

* Default: canvas size (devicePixelRatio optional)
* MUST support `.resize(w,h)` which:

    * Resizes **all render textures**
    * Does *not* destroy ping-pong history
    * Preserves frame index reset semantics (**see below**)

### 3.3 Texture binding rules

Each pass sees **exactly four** bound texture units:

```
iChannel0 → sampler2D at TEXTURE UNIT 0
iChannel1 → sampler2D at TEXTURE UNIT 1
iChannel2 → sampler2D at TEXTURE UNIT 2
iChannel3 → sampler2D at TEXTURE UNIT 3
```

UNUSED CHANNELS MUST STILL BIND A 1×1 BLACK FLOAT TEXTURE.
(Real Shadertoy does this.)

---

## 4. Uniform Semantics (must match Shadertoy)

| Name                    | Type                 | Meaning                                  |
| ----------------------- | -------------------- | ---------------------------------------- |
| `iResolution`           | `vec3`               | `(width, height, 1.0)`                   |
| `iTime`                 | `float`              | seconds since engine.start               |
| `iTimeDelta`            | `float`              | elapsed seconds since last frame         |
| `iFrame`                | `int`                | current frame index **starting at 0**    |
| `iMouse`                | `vec4`               | Provided by APP (engine does not define) |
| `iChannelTime[4]`       | OPTIONAL float array |                                          |
| `iChannelResolution[4]` | OPTIONAL vec3 array  |                                          |

Engine MUST supply at minimum:

```glsl
uniform vec3  iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform int   iFrame;
uniform vec4  iMouse;
```

---

## 5. Shader Program Construction

### 5.1 Every final shader is built as:

```
#version 300 es
precision highp float;

{{commonSource OR ""}}

uniform vec3  iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform int   iFrame;
uniform vec4  iMouse;
uniform sampler2D iChannel0;
...
{{ raw shader GLSL }}
```

### 5.2 MUST support:

* `mainImage(out vec4 fragColor, in vec2 fragCoord)`
* Engine generates wrapper:

```glsl
out vec4 fragColor;

void main() {
    mainImage(fragColor, gl_FragCoord.xy);
}
```

### 5.3 Compiler failure behavior

❌ If shader fails to compile:

* Engine MUST throw on startup, NOT silently continue.

Later versions may implement hot reload instead of exception.

---

## 6. Channel Binding Logic

For pass `P`, for channel index `k`:

| Case                                        | Action                                            |
| ------------------------------------------- | ------------------------------------------------- |
| `{kind:"none"}`                             | bind 1×1 black texture                            |
| `{kind:"buffer", buffer:X, previous:false}` | bind **X.currentTexture**                         |
| `{kind:"buffer", buffer:X, previous:true}`  | bind **X.previousTexture**                        |
| `{kind:"texture2D", name:N}`                | bind loaded 2D texture `N`                        |
| `{kind:"keyboard"}`                         | bind keyboard texture (OR THROW if unimplemented) |

---

## 7. Frame Counter and Reset Rules

**This is subtle and extremely important for PDE shaders.**

### 7.1 REQUIRED behavior:

* `iFrame` starts at **0**
* Increments **after each full frame**
* **Reset ONLY if engine is recreated**
* Calling `.resize()` **MUST NOT** reset `iFrame`
* Calling `.step()` multiple times in same JS frame MUST increment correctly

This matches real Shadertoy behavior.

---

## 8. Engine Internal Data Model

```ts
interface RuntimePass {
  name: PassName;
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;
  current: WebGLTexture;
  previous: WebGLTexture;
  fbo: WebGLFramebuffer;  // bound per-frame
}
```

Engine stores an array:

```ts
runtime.passes = [
  RuntimePass for BufferA?,
  RuntimePass for BufferB?,
  RuntimePass for BufferC?,
  RuntimePass for BufferD?,
  RuntimePass for Image
]
```

Order **MUST** be fixed (A→D→Image).

---

## 9. Engine Public API

```ts
interface EngineOptions {
  gl: WebGL2RenderingContext;
  project: ShadertoyProject;
}

class ShadertoyEngine {

  constructor(opts: EngineOptions) { ... }

  step(nowSeconds: number): void {
     // 1. Compute time delta
     // 2. Run passes in order
     // 3. Swap textures
     // 4. iFrame++
  }

  resize(width: number, height: number): void {
     // Reallocate ALL pass textures
     // MUST NOT reset iFrame
  }

  dispose(): void {
     // delete all GL resources
  }
}
```

---

# ⭐ CRITICAL COMPATIBILITY REQUIREMENTS

The following MUST match real Shadertoy or many shaders BREAK:

### ✔ Ping-pong works **even if not declared**

You MUST allocate and swap previous textures for EVERY pass, even if not referenced.

### ✔ Black texture for missing channels

If you bind `null`, user code sampling `iChannelX` becomes undefined NAN.

### ✔ `mainImage(...)` wrapper

Do not require shaders to define `main()` manually.

### ✔ Shader Preprocessing for Shadertoy Compatibility

**CRITICAL**: The engine MUST preprocess user shader code to enable **direct copy-paste from Shadertoy** without modification.

#### Automatic Cubemap Texture Conversion

Shadertoy shaders often use cubemap-style texture sampling with 3D direction vectors:

```glsl
vec3 color = texture(iChannel1, rayDir).rgb;  // rayDir is vec3
```

Since we only support `sampler2D` (not `samplerCube`), the engine MUST automatically detect and convert these calls to equirectangular sampling.

**Preprocessing Algorithm:**

1. **Inject helper function** at the top of every fragment shader (before common code):

```glsl
const float ST_PI = 3.14159265359;
const float ST_TWOPI = 6.28318530718;
vec2 _st_dirToEquirect(vec3 dir) {
  float phi = atan(dir.z, dir.x);
  float theta = asin(dir.y);
  return vec2(phi / ST_TWOPI + 0.5, theta / ST_PI + 0.5);
}
```

2. **Detect cubemap-style texture calls** using heuristics:
   - Match: `texture(iChannel[0-3], <coord>)`
   - If `<coord>` appears to be 2D UV (contains `fragCoord`, `/`, `.xy`, `.st`, or `vec2(`), leave unchanged
   - Otherwise, assume 3D direction vector and wrap with `_st_dirToEquirect(...)`

3. **Transform example:**

```glsl
// Original shader (copied from Shadertoy):
ret += texture(iChannel1, rayDir).rgb;

// Automatically becomes:
ret += texture(iChannel1, _st_dirToEquirect(rayDir)).rgb;
```

**Why this matters:**
- Enables **zero-modification copy-paste** from Shadertoy
- Students can use environment maps and path tracers directly
- Shaders remain portable back to Shadertoy (just bind cubemaps there)
- Source `.glsl` files stay pure Shadertoy code

**Implementation note**: Preprocessing happens during shader compilation, NOT to source files. The `.glsl` files in the project remain unchanged and fully Shadertoy-compatible.

### ✔ Float FBOs

Integer framebuffers break PDE scripts.

### ✔ Monotonic iFrame

Many physics shaders use:

```glsl
if (iFrame < 1) reset();
```

---

# OPTIONAL FEATURES (v2+)

Not required **now**, but spec reserves space:

| Feature                     | Status                          |
| --------------------------- | ------------------------------- |
| Mipmapped user textures     | ❌ Not needed                    |
| `iChannelResolution`        | ⚠️ Nice to have                 |
| Keyboard texture            | 🚧 Allowed in config, may throw |
| Screen-capture / AVI export | Future                          |
| Shader compilation caching  | Future                          |
| Compute shader support      | Future                          |







Nice, let’s wire up the engine skeleton.

I’ll give you a **TypeScript scaffold** for the engine layer:

* `src/engine/types.ts` – engine-facing types and small interfaces
* `src/engine/glHelpers.ts` – low-level WebGL helpers with TODOs
* `src/engine/ShadertoyEngine.ts` – main engine class with method stubs

All imports expect your existing `project/types.ts` from the previous spec.

You can hand these files to Claude/Cursor/etc. and say “fill in all the TODOs according to the spec.”

---

## `src/engine/types.ts`

```ts
// src/engine/types.ts

import type {
  ShadertoyProject,
  PassName,
  ChannelSource,
  ShadertoyTexture2D,
} from '../project/types';

/**
 * Options for constructing a ShadertoyEngine.
 *
 * The App is responsible for creating the WebGL2RenderingContext
 * and passing it in.
 */
export interface EngineOptions {
  gl: WebGL2RenderingContext;
  project: ShadertoyProject;
}

/**
 * Per-pass uniform locations and metadata.
 *
 * NOTE: This is separate from RuntimePass so that we can keep
 * the GL program + locations together.
 */
export interface PassUniformLocations {
  program: WebGLProgram;
  // Core Shadertoy uniforms
  iResolution: WebGLUniformLocation | null;
  iTime: WebGLUniformLocation | null;
  iTimeDelta: WebGLUniformLocation | null;
  iFrame: WebGLUniformLocation | null;
  iMouse: WebGLUniformLocation | null;

  // iChannel0..3
  iChannel: (WebGLUniformLocation | null)[];
}

/**
 * A runtime representation of a pass:
 * - knows which project pass it corresponds to
 * - owns two textures (current + previous) for ping-pong
 * - owns a framebuffer and VAO for drawing
 */
export interface RuntimePass {
  name: PassName;
  projectChannels: ChannelSource[];

  vao: WebGLVertexArrayObject;
  uniforms: PassUniformLocations;

  framebuffer: WebGLFramebuffer;

  // Ping-pong textures:
  // - current: where we write this frame
  // - previous: where we read "previous" from when needed
  currentTexture: WebGLTexture;
  previousTexture: WebGLTexture;
}

/**
 * Runtime representation of an external 2D texture.
 * This corresponds 1:1 to ShadertoyTexture2D from the project.
 */
export interface RuntimeTexture2D {
  name: string; // e.g. "tex0" (same as project texture name)
  texture: WebGLTexture;
  width: number;
  height: number;
}

/**
 * Keyboard texture representation.
 * For v1, you can leave this unimplemented or just stub it out.
 */
export interface RuntimeKeyboardTexture {
  texture: WebGLTexture;
  width: number;
  height: number;
}

/**
 * Engine stats (for optional overlay / debugging).
 */
export interface EngineStats {
  frame: number;         // iFrame
  time: number;          // total time in seconds (iTime)
  deltaTime: number;     // last frame delta in seconds (iTimeDelta)
  width: number;
  height: number;
}

/**
 * Public engine interface.
 *
 * The engine does not decide when to render; the App calls `step(timeSeconds)`
 * once per animation frame.
 */
export interface ShadertoyEngine {
  readonly project: ShadertoyProject;
  readonly gl: WebGL2RenderingContext;

  readonly width: number;
  readonly height: number;

  /** Stats snapshot (read-only) */
  readonly stats: EngineStats;

  /**
   * Run one full frame worth of passes at the given time in seconds.
   *
   * The App is responsible for calling this from requestAnimationFrame
   * and passing a monotone time.
   */
  step(timeSeconds: number, mouse: [number, number, number, number]): void;

  /**
   * Resize all internal render targets to the new resolution.
   *
   * This MUST NOT reset iFrame/iTime; existing ping-pong history may be
   * cleared or discarded, but frame counter must remain monotone.
   */
  resize(width: number, height: number): void;

  /**
   * Clean up all GL resources allocated by the engine.
   * After dispose(), the engine instance MUST NOT be used again.
   */
  dispose(): void;
}
```

---

## `src/engine/glHelpers.ts`

These are low-level helpers. Right now they’re just signatures + TODO comments.

```ts
// src/engine/glHelpers.ts

/**
 * Compile a shader of given type from source. Throws on error.
 */
export function createShader(
  gl: WebGL2RenderingContext,
  type: GLenum,
  source: string
): WebGLShader {
  // TODO: Implement shader compilation, error checking, and info log output.
  // - Create shader
  // - gl.shaderSource, gl.compileShader
  // - Check COMPILE_STATUS
  // - If fail: log infoLog and throw Error
  throw new Error('createShader not implemented');
}

/**
 * Link a program from vertex + fragment source strings.
 * Throws with a descriptive error if link fails.
 */
export function createProgramFromSources(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string
): WebGLProgram {
  // TODO:
  // - Compile vertex + fragment with createShader
  // - Attach shaders, link program
  // - Check LINK_STATUS
  // - Detach/delete shaders as appropriate
  // - Throw on error with info log
  throw new Error('createProgramFromSources not implemented');
}

/**
 * Create a full-screen triangle VAO.
 *
 * Attribute layout:
 *  - location 0: vec2 position in clip space.
 */
export function createFullscreenTriangleVAO(gl: WebGL2RenderingContext): WebGLVertexArrayObject {
  // TODO:
  // - Create VAO
  // - Create VBO with 3 vertices covering the screen
  // - Enable vertex attrib array at location 0
  // - Set up vertexAttribPointer
  throw new Error('createFullscreenTriangleVAO not implemented');
}

/**
 * Create a float RGBA texture (no data) for use as a render target.
 * This MUST use an internal format compatible with EXT_color_buffer_float.
 */
export function createRenderTargetTexture(
  gl: WebGL2RenderingContext,
  width: number,
  height: number
): WebGLTexture {
  // TODO:
  // - gl.createTexture
  // - gl.bindTexture(gl.TEXTURE_2D, tex)
  // - gl.texImage2D with RGBA32F / FLOAT
  // - Set MIN/MAG filters to NEAREST (for simulation)
  // - Set WRAP modes to CLAMP_TO_EDGE
  throw new Error('createRenderTargetTexture not implemented');
}

/**
 * Create a framebuffer with a single color attachment at COLOR_ATTACHMENT0.
 * Throws if framebuffer is not complete.
 */
export function createFramebufferWithColorAttachment(
  gl: WebGL2RenderingContext,
  texture: WebGLTexture
): WebGLFramebuffer {
  // TODO:
  // - gl.createFramebuffer
  // - gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  // - gl.framebufferTexture2D(...)
  // - Check FRAMEBUFFER_COMPLETE
  throw new Error('createFramebufferWithColorAttachment not implemented');
}

/**
 * Create a 1x1 black float texture for unused channels.
 */
export function createBlackTexture(gl: WebGL2RenderingContext): WebGLTexture {
  // TODO:
  // - Create texture
  // - Upload 1x1 RGBA=[0,0,0,1] float
  throw new Error('createBlackTexture not implemented');
}

/**
 * Create a 2D texture from an HTMLImageElement (or ImageBitmap).
 * This is used for project textures (dog.png, noise.png, etc.)
 *
 * NOTE: actual image loading is done by the App; engine just gets an
 * already-loaded image object.
 */
export function createTextureFromImage(
  gl: WebGL2RenderingContext,
  image: HTMLImageElement | ImageBitmap,
  filter: 'nearest' | 'linear',
  wrap: 'clamp' | 'repeat'
): WebGLTexture {
  // TODO:
  // - Create texture
  // - Bind and upload image
  // - Set MIN/MAG filter
  // - Set WRAP modes
  throw new Error('createTextureFromImage not implemented');
}
```

---

## `src/engine/ShadertoyEngine.ts`

This is the main engine class, wired to the earlier types + helpers, but with TODOs for the heavy lifting.

```ts
// src/engine/ShadertoyEngine.ts

import {
  ShadertoyProject,
  ChannelSource,
  PassName,
} from '../project/types';

import {
  EngineOptions,
  ShadertoyEngine as ShadertoyEngineInterface,
  RuntimePass,
  RuntimeTexture2D,
  RuntimeKeyboardTexture,
  EngineStats,
  PassUniformLocations,
} from './types';

import {
  createProgramFromSources,
  createFullscreenTriangleVAO,
  createRenderTargetTexture,
  createFramebufferWithColorAttachment,
  createBlackTexture,
} from './glHelpers';

/**
 * ShadertoyEngine
 *
 * Implements the execution model described in docs/engine-spec.md.
 *
 * Responsibilities:
 *  - Own WebGL resources for passes (programs, VAOs, textures, FBOs).
 *  - Execute passes each frame in Shadertoy order: BufferA→BufferB→BufferC→BufferD→Image.
 *  - Bind Shadertoy uniforms (iResolution, iTime, iTimeDelta, iFrame, iMouse).
 *  - Bind iChannel0..3 according to ChannelSource.
 */
export class ShadertoyEngine implements ShadertoyEngineInterface {
  readonly project: ShadertoyProject;
  readonly gl: WebGL2RenderingContext;

  private _width: number;
  private _height: number;

  private _frame: number = 0;
  private _time: number = 0;
  private _lastStepTime: number | null = null;

  private _passes: RuntimePass[] = [];
  private _textures: RuntimeTexture2D[] = [];
  private _keyboardTexture: RuntimeKeyboardTexture | null = null;

  private _blackTexture: WebGLTexture | null = null;

  constructor(opts: EngineOptions) {
    this.gl = opts.gl;
    this.project = opts.project;

    // Initialize width/height from current drawing buffer
    this._width = this.gl.drawingBufferWidth;
    this._height = this.gl.drawingBufferHeight;

    // 1. Initialize extensions
    this.initExtensions();

    // 2. Create black texture for unused channels
    this._blackTexture = createBlackTexture(this.gl);

    // 3. Initialize external textures (from project.textures)
    //    NOTE: This requires actual image data; for now just stub the array.
    this.initProjectTextures();

    // 4. Compile shaders + create runtime passes
    this.initRuntimePasses();
  }

  // ------------------------------------------
  // Public API
  // ------------------------------------------

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get stats(): EngineStats {
    const dt = this._lastStepTime === null ? 0 : this._time - this._lastStepTime;
    return {
      frame: this._frame,
      time: this._time,
      deltaTime: dt,
      width: this._width,
      height: this._height,
    };
  }

  /**
   * Run one full frame of all passes.
   *
   * @param timeSeconds - global time in seconds (monotone, from App)
   * @param mouse - iMouse as [x, y, clickX, clickY]
   */
  step(timeSeconds: number, mouse: [number, number, number, number]): void {
    const gl = this.gl;

    // Compute time/deltaTime/iFrame
    const prevTime = this._time;
    this._time = timeSeconds;

    const deltaTime =
      this._lastStepTime === null ? 0.0 : this._time - this._lastStepTime;
    this._lastStepTime = this._time;

    const iResolution = [this._width, this._height, 1.0] as const;
    const iTime = this._time;
    const iTimeDelta = deltaTime;
    const iFrame = this._frame;
    const iMouse = mouse;

    // Set viewport for all passes
    gl.viewport(0, 0, this._width, this._height);

    // Execute passes in Shadertoy order
    const passOrder: PassName[] = ['BufferA', 'BufferB', 'BufferC', 'BufferD', 'Image'];

    for (const passName of passOrder) {
      const runtimePass = this._passes.find((p) => p.name === passName);
      if (!runtimePass) continue;

      this.executePass(runtimePass, {
        iResolution,
        iTime,
        iTimeDelta,
        iFrame,
        iMouse,
      });
    }

    // Monotone frame counter
    this._frame += 1;
  }

  /**
   * Resize all internal render targets to new width/height.
   * Does not reset time or frame count.
   */
  resize(width: number, height: number): void {
    // TODO:
    //  - update this._width / this._height
    //  - reallocate ALL pass textures to new resolution
    //  - update any cached resolution-dependent data (if needed)
    this._width = width;
    this._height = height;

    // For now just a stub; runtime passes still have old-sized textures.
    // Implementation model must fill this out.
  }

  /**
   * Delete all GL resources.
   */
  dispose(): void {
    const gl = this.gl;

    // TODO:
    //  - delete VAOs, FBOs, textures, programs for each pass
    //  - delete black texture and keyboard texture
    //  - clear arrays / null fields

    // Example stub:
    this._passes = [];
    this._textures = [];
    this._keyboardTexture = null;
    this._blackTexture = null;
  }

  // ------------------------------------------
  // Initialization helpers
  // ------------------------------------------

  private initExtensions(): void {
    const gl = this.gl;

    // TODO:
    //  - Ensure EXT_color_buffer_float is available
    //  - Optionally ensure OES_texture_float_linear, etc.
    //  - Throw with a clear message if missing
  }

  /**
   * Initialize external textures based on project.textures.
   *
   * NOTE: This function as written assumes that actual image loading
   * is handled elsewhere and passed in; for now we just construct
   * an empty array. In a real implementation, you might:
   *
   *  - Have the App load images and pass a map name->image into the engine
   *  - Or have the engine accept an async loader callback
   */
  private initProjectTextures(): void {
    // TODO:
    //  - For each ShadertoyTexture2D in project.textures:
    //      * load image (if engine is responsible)
    //      * create WebGLTexture from image with correct filter/wrap
    //      * store in this._textures
    this._textures = [];
  }

  /**
   * Compile shaders, create VAOs/FBOs/textures, and build RuntimePass array.
   */
  private initRuntimePasses(): void {
    const gl = this.gl;
    const project = this.project;

    // TODO:
    // 1. Build shared vertex shader source (full-screen triangle).
    // 2. For each project pass (Image, BufferA..D):
    //      - If pass exists, build fragment shader:
    //           commonSource + Shadertoy built-in uniform declarations +
    //           pass.glslSource + main() wrapper calling mainImage().
    //      - Compile & link program.
    //      - Create VAO via createFullscreenTriangleVAO.
    //      - Create two RGBA32F textures (current + previous).
    //      - Create framebuffer attached to currentTexture.
    //      - Cache uniform locations for iResolution, iTime, iTimeDelta,
    //        iFrame, iMouse, iChannel0..3.
    //      - Push RuntimePass into this._passes.
  }

  // ------------------------------------------
  // Pass execution
  // ------------------------------------------

  private executePass(
    runtimePass: RuntimePass,
    builtinUniforms: {
      iResolution: readonly [number, number, number];
      iTime: number;
      iTimeDelta: number;
      iFrame: number;
      iMouse: [number, number, number, number];
    }
  ): void {
    const gl = this.gl;
    const { program, iResolution, iTime, iTimeDelta, iFrame, iMouse, iChannel } =
      runtimePass.uniforms;

    // TODO:
    // 1. Bind framebuffer and set viewport
    // 2. Use program, bind VAO
    // 3. Bind Shadertoy built-in uniforms:
    //      - iResolution (vec3)
    //      - iTime, iTimeDelta, iFrame
    //      - iMouse (vec4)
    // 4. For each channel index 0..3:
    //      - Resolve ChannelSource -> concrete WebGLTexture (see below)
    //      - gl.activeTexture(TEXTURE0 + idx)
    //      - gl.bindTexture(TEXTURE_2D, texture)
    //      - gl.uniform1i(iChannel[idx], idx)
    // 5. Draw full-screen triangle.
    // 6. After drawing, swap current and previous textures for this pass.

    // Implementation model needs to fill in details here.
  }

  // ------------------------------------------
  // Channel resolution helpers
  // ------------------------------------------

  /**
   * Resolve a ChannelSource to an actual WebGLTexture to bind.
   *
   * This covers:
   *  - kind: 'none' → black texture
   *  - kind: 'buffer' → another RuntimePass's current/previous texture
   *  - kind: 'texture2D' → RuntimeTexture2D.texture
   *  - kind: 'keyboard' → keyboard texture (or throw if unimplemented)
   */
  private resolveChannelTexture(source: ChannelSource): WebGLTexture {
    // TODO:
    //  - if kind === 'none' → return this._blackTexture!
    //  - if kind === 'buffer' → locate RuntimePass with that name and
    //      return .currentTexture or .previousTexture based on `previous`
    //  - if kind === 'texture2D' → find RuntimeTexture2D by name and return texture
    //  - if kind === 'keyboard' → return keyboard texture or throw descriptive error
    if (!this._blackTexture) {
      throw new Error('Black texture not initialized');
    }
    return this._blackTexture;
  }
}
```

