# Shadertoy Runner

A lightweight, Shadertoy-compatible GLSL shader playground built for teaching and learning shader programming.

## Features

- **Shadertoy Compatibility** - Copy/paste shaders directly from Shadertoy
- **Full Shadertoy Uniforms** - `iTime`, `iResolution`, `iFrame`, `iMouse`, `iTimeDelta`, `iChannel0-3`
- **Multi-Buffer Rendering** - BufferA-D passes with correct ping-pong semantics
- **Texture Support** - Load external images with configurable filtering and wrapping
- **Keyboard Input** - Full keyboard state via Shadertoy-compatible texture
- **Playback Controls** - Play/pause, reset, and screenshot capture
- **Multiple Layout Modes** - Fullscreen, centered, split-view, or tabbed code display
- **Zero Runtime Dependencies** - Pure WebGL2
- **Tiny Builds** - ~26KB JS (gzipped)

## Quick Start

```bash
npm install
npm run new my-shader
npm run dev:demo my-shader
```

Open `http://localhost:3000` to see your shader.

---

## Common Setups

### 1. Simple Shader (just image.glsl)

The simplest setup - no config needed.

```bash
npm run new my-shader
```

**Files:**
```
demos/my-shader/
└── image.glsl
```

**image.glsl:**
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0, 2, 4));
    fragColor = vec4(col, 1.0);
}
```

---

### 2. One Buffer (feedback/trails)

For effects that accumulate over time (trails, paint, fluid).

```bash
npm run new my-shader 1
```

**Files:**
```
demos/my-shader/
├── bufferA.glsl
├── image.glsl
└── config.json
```

**config.json:**
```json
{
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

**bufferA.glsl:**
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Read previous frame with fade
    vec4 prev = texture(iChannel0, uv) * 0.98;

    // Draw at mouse
    vec2 mouse = iMouse.xy / iResolution.xy;
    float d = length(uv - mouse);
    float spot = smoothstep(0.05, 0.0, d);

    fragColor = prev + vec4(spot);
}
```

**image.glsl:**
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    fragColor = texture(iChannel0, uv);
}
```

---

### 3. Multiple Buffers (interacting simulations)

For reaction-diffusion, fluid dynamics, etc. All buffers can read all other buffers.

```bash
npm run new my-shader 2
```

**Files:**
```
demos/my-shader/
├── bufferA.glsl
├── bufferB.glsl
├── image.glsl
└── config.json
```

**config.json:**
```json
{
  "passes": {
    "BufferA": {
      "channels": {
        "iChannel0": { "buffer": "BufferA", "previous": true },
        "iChannel1": { "buffer": "BufferB", "previous": true }
      }
    },
    "BufferB": {
      "channels": {
        "iChannel0": { "buffer": "BufferA" },
        "iChannel1": { "buffer": "BufferB", "previous": true }
      }
    },
    "Image": {
      "channels": {
        "iChannel0": { "buffer": "BufferA" },
        "iChannel1": { "buffer": "BufferB" }
      }
    }
  }
}
```

**Channel mapping:** `iChannel0` = BufferA, `iChannel1` = BufferB, etc.

---

### 4. Texture + Image (image processing)

Load an image and process it.

**Files:**
```
demos/my-shader/
├── image.glsl
├── photo.jpg
└── config.json
```

**config.json:**
```json
{
  "passes": {
    "Image": {
      "channels": {
        "iChannel0": { "texture": "photo.jpg" }
      }
    }
  }
}
```

**image.glsl:**
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec4 img = texture(iChannel0, uv);

    // Example: grayscale
    float gray = dot(img.rgb, vec3(0.299, 0.587, 0.114));

    fragColor = vec4(vec3(gray), 1.0);
}
```

**Texture options (all optional):**
```json
{ "texture": "photo.jpg", "filter": "linear", "wrap": "repeat", "type": "2d" }
```
- `filter`: `"linear"` (smooth, default) or `"nearest"` (pixelated)
- `wrap`: `"repeat"` (tile, default) or `"clamp"` (stretch edges)
- `type`: `"2d"` (standard, default) or `"cubemap"` (equirectangular environment map)

**Cubemap textures:** Use `"type": "cubemap"` for equirectangular environment maps (360° panoramas). The engine will automatically convert 3D direction lookups to 2D coordinates:
```json
{ "texture": "environment.jpg", "type": "cubemap" }
```
```glsl
// In your shader, sample with a 3D direction:
vec3 dir = normalize(rayDirection);
vec4 sky = texture(iChannel0, dir);  // Automatically converted
```

---

### 5. Texture + Buffers (image + feedback)

Combine textures with buffer feedback for effects like painting on an image.

**Files:**
```
demos/my-shader/
├── bufferA.glsl
├── image.glsl
├── photo.jpg
└── config.json
```

**config.json:**
```json
{
  "passes": {
    "BufferA": {
      "channels": {
        "iChannel0": { "buffer": "BufferA", "previous": true },
        "iChannel1": { "texture": "photo.jpg" }
      }
    },
    "Image": {
      "channels": {
        "iChannel0": { "buffer": "BufferA" },
        "iChannel1": { "texture": "photo.jpg" }
      }
    }
  }
}
```

**bufferA.glsl:**
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    vec4 prev = texture(iChannel0, uv);      // Previous frame
    vec4 img = texture(iChannel1, uv);        // Original image

    // Paint with mouse
    vec2 mouse = iMouse.xy / iResolution.xy;
    float d = length(uv - mouse);
    float brush = smoothstep(0.05, 0.0, d);

    // Blend: painted areas persist, unpainted fade to original
    fragColor = mix(mix(prev, img, 0.01), prev + brush, brush);
}
```

---

## Buffer Execution & Frame Timing

**Execution order:** BufferA → BufferB → BufferC → BufferD → Image

| You are in... | Reading... | You get... |
|---------------|------------|------------|
| BufferA | BufferA (self) | **previous frame** |
| BufferA | BufferB, C, D | **previous frame** (haven't run yet) |
| BufferB | BufferA | **current frame** (already ran) |
| BufferB | BufferB (self) | **previous frame** |
| Image | Any buffer | **current frame** (all have run) |

The `previous: true` flag explicitly requests the previous frame.

---

## Layouts

Control how the shader is displayed with the `layout` option in `config.json`:

```json
{
  "layout": "split",
  "passes": { ... }
}
```

| Layout | Description | Best for |
|--------|-------------|----------|
| `fullscreen` | Canvas fills entire viewport | Immersive art, games, installations |
| `centered` | Canvas centered with max-width | General viewing (default without config) |
| `tabbed` | Tabs to switch between shader and code | Exploring/debugging |
| `split` | Side-by-side: shader left, code right | Teaching, presentations, tutorials |

**`fullscreen`** - No chrome, canvas fills the screen:
```json
{ "layout": "fullscreen" }
```

**`centered`** - Clean centered view with rounded corners:
```json
{ "layout": "centered" }
```

**`tabbed`** - Click tabs to switch between live shader and source code:
```json
{ "layout": "tabbed" }
```

**`split`** - See shader and code simultaneously (code panel has tabs for multi-file projects):
```json
{ "layout": "split" }
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **S** | Save screenshot (PNG) |
| **Space** | Play/Pause (when controls enabled) |
| **R** | Reset to frame 0 (when controls enabled) |

---

## NPM Scripts

```bash
npm run new <name> [buffers]   # Create new shader project
npm run dev:demo <name>        # Development server with hot reload
npm run build:demo <name>      # Production build to dist/
```

---

## Documentation

- [Getting Started](docs/learn/getting-started.md) - Your first shader
- [Buffers and Channels](docs/learn/buffers-and-channels.md) - Multi-pass rendering
- [Configuration](docs/learn/configuration.md) - Full config reference
- [Architecture](docs/dev/architecture.md) - How the engine works

## License

MIT
