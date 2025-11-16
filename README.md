# Shadertoy Runner

A lightweight, Shadertoy-compatible shader playground for teaching shader programming.

## Features

- ✅ **Copy/paste compatibility** - Run Shadertoy shaders directly without modification
- ✅ **Full Shadertoy semantics** - `mainImage()`, `iTime`, `iResolution`, `iChannel0-3`, etc.
- ✅ **Multi-buffer support** - BufferA-D with ping-pong rendering
- ✅ **Float framebuffers** - RGBA32F for PDE/physics simulations
- ✅ **Zero dependencies** - Pure WebGL2, no Three.js bloat
- ✅ **Small builds** - Minimal, focused codebase

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

## Architecture

Built with a clean 3-layer architecture:

1. **Project Layer** - Type definitions and config loading
2. **Engine Layer** - WebGL execution with Shadertoy compatibility
3. **App Layer** - Browser runtime and UI

See `docs/` for detailed specifications.

## License

MIT
