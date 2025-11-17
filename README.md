# Shadertoy Runner

A lightweight, Shadertoy-compatible shader playground for teaching shader programming.

## Features

- ✅ **Perfect Shadertoy copy/paste** - Run shaders directly from Shadertoy without ANY modification
  - Automatic cubemap texture preprocessing (converts `texture(iChannel, vec3)` to equirectangular)
  - Automatic `mainImage()` wrapper injection
  - Automatic ping-pong detection for self-referencing buffers
- ✅ **Full Shadertoy semantics** - `mainImage()`, `iTime`, `iResolution`, `iChannel0-3`, `iFrame`, `iMouse`
- ✅ **Multi-buffer support** - BufferA-D with automatic ping-pong rendering
- ✅ **Texture support** - Load images for environment maps and textures
- ✅ **Float framebuffers** - RGBA32F for PDE/physics simulations
- ✅ **Zero dependencies** - Pure WebGL2, no Three.js bloat
- ✅ **Small builds** - 19KB JS (6KB gzipped)

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── project/         # Project types and config loading
├── engine/          # WebGL execution engine
├── app/             # Browser runtime and animation loop
└── main.ts          # Entry point

demos/               # Example shaders
├── simple-gradient/
├── ping-pong-test/
└── multi-buffer-test/
```

## Usage

### Quick Start

Change the demo in `src/main.ts`:

```typescript
const DEMO_NAME = 'simple-gradient';
// Try: 'simple-gradient', 'ping-pong-test', 'multi-buffer-test'
```

### Creating Your Own Demos

**Option 1: Single-pass shader** (simplest)
```bash
mkdir demos/my-shader
# Create demos/my-shader/image.glsl
# That's it! Just one file needed.
```

**Option 2: Multi-pass shader** (advanced)
```bash
mkdir demos/my-complex-shader
# Create demos/my-complex-shader/shadertoy.config.json
# Create demos/my-complex-shader/bufferA.glsl
# Create demos/my-complex-shader/image.glsl
```

Example config:
```json
{
  "meta": {
    "title": "My Shader"
  },
  "passes": {
    "BufferA": {
      "channels": {
        "iChannel0": { "buffer": "BufferA" }
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

**Note**: Self-referencing buffers (like BufferA reading from itself) automatically use ping-pong textures - no special config needed!

## Architecture

Built with a clean 3-layer architecture:

1. **Project Layer** - Type definitions and config loading
2. **Engine Layer** - WebGL execution with Shadertoy compatibility
3. **App Layer** - Browser runtime and UI

See `docs/` for detailed specifications.

## License

MIT
