# Shadertoy Runner

A lightweight, Shadertoy-compatible GLSL shader playground built for teaching and learning shader programming.

## Features

- **Shadertoy Compatibility** - Copy/paste shaders directly from Shadertoy
  - Automatic `mainImage()` wrapper injection
  - Automatic cubemap to equirectangular texture conversion
  - Automatic ping-pong buffer detection for self-referencing passes
- **Full Shadertoy Uniforms** - `iTime`, `iResolution`, `iFrame`, `iMouse`, `iTimeDelta`, `iChannel0-3`
- **Multi-Buffer Rendering** - BufferA-D passes with automatic ping-pong for feedback effects
- **Texture Support** - Load external images with configurable filtering and wrapping
- **Keyboard Input** - Full keyboard state via Shadertoy-compatible keyboard texture
- **Playback Controls** - Play/pause, reset, and screenshot capture
- **Multiple Layout Modes** - Fullscreen, centered, or split-view with live code display
- **Zero Runtime Dependencies** - Pure WebGL2
- **Tiny Builds** - ~26KB JS (gzipped)

## Quick Start

```bash
# Install dependencies
npm install

# Run a demo in development
npm run dev:demo <demo-folder-name>

# Build a demo for production
npm run build:demo <demo-folder-name>
```

Open your browser to `http://localhost:3000` and you'll see the running shader.

## Documentation

### For Students Learning Shaders
- [**Getting Started**](docs/learn/getting-started.md) - Your first shader in 5 minutes
- [**Buffers and Channels**](docs/learn/buffers-and-channels.md) - Multi-pass rendering and textures
- [**Configuration**](docs/learn/configuration.md) - Config file reference and keyboard shortcuts

### For Developers
- [**Architecture**](docs/dev/architecture.md) - System design and data flow
- [**Project Structure**](docs/dev/project-structure.md) - Codebase organization
- [**Components**](docs/dev/components.md) - How each component works
- [**Troubleshooting**](docs/dev/troubleshooting.md) - Common issues and solutions

## Creating Your First Shader

### Simple Single-Pass Shader

1. Create a folder: `demos/my-shader/`
2. Create `demos/my-shader/image.glsl`:

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0, 2, 4));
    fragColor = vec4(col, 1.0);
}
```

3. Run it:
```bash
npm run dev:demo my-shader
```

### Multi-Pass Shader with Buffers

Create `demos/feedback-effect/shadertoy.config.json`:

```json
{
  "meta": {
    "title": "Feedback Effect"
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

Then create your shader files (`bufferA.glsl`, `image.glsl`) in that folder. See [Buffers and Channels](docs/learn/buffers-and-channels.md) for details.

## Keyboard Shortcuts

- **S** - Save screenshot (PNG)
- **Space** - Play/Pause (when controls enabled)
- **R** - Reset (when controls enabled)

## Project Structure

```
src/
├── project/         # Config loading and project types
├── engine/          # WebGL execution engine
├── app/             # Browser runtime and UI
├── layouts/         # Layout modes (fullscreen, centered, split)
└── main.ts          # Entry point

demos/               # Your shader projects go here
```

## Architecture

Built with a clean layered architecture:

1. **Project Layer** - Loads and normalizes shader configs
2. **Engine Layer** - WebGL execution with Shadertoy semantics
3. **App Layer** - Browser runtime, animation loop, and UI
4. **Layout Layer** - Modular display modes

All layers are strongly typed with TypeScript.

## License

MIT
