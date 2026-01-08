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

# Create a new shader project
npm run new my-shader

# Run it
npm run dev:demo my-shader
```

Open `http://localhost:3000` to see your shader.

## Creating Shaders

### Simple Shader (no buffers)

```bash
npm run new my-shader
```

Creates `demos/my-shader/image.glsl` - a single-pass shader.

### Multi-Buffer Shader

```bash
npm run new my-shader 2
```

Creates a shader with 2 buffers where **all buffers are available to all passes**:

| Channel | Buffer |
|---------|--------|
| `iChannel0` | BufferA |
| `iChannel1` | BufferB |
| `iChannel2` | BufferC |
| `iChannel3` | BufferD |

**Examples:**
```bash
npm run new trail-effect 1      # Feedback effect (BufferA + Image)
npm run new reaction-diffusion 2 # Two interacting buffers
npm run new fluid-sim 3          # Three buffers
```

## Buffer Execution & Frame Timing

Matches Shadertoy's semantics exactly:

**Execution order:** BufferA → BufferB → BufferC → BufferD → Image

**Which frame do you get when sampling a buffer?**

| You are in... | Reading... | You get... |
|---------------|------------|------------|
| BufferA | BufferA (self) | **previous frame** |
| BufferA | BufferB, C, D | **previous frame** (haven't run yet) |
| BufferB | BufferA | **current frame** (already ran) |
| BufferB | BufferB (self) | **previous frame** |
| BufferB | BufferC, D | **previous frame** (haven't run yet) |
| Image | Any buffer | **current frame** (all have run) |

This is handled automatically by the generated `config.json`. The `previous: true` flag in the config explicitly requests the previous frame.

## Project Structure

A shader project is a folder in `demos/` containing:

```
demos/my-shader/
├── image.glsl           # Required - final output
├── bufferA.glsl         # Optional - BufferA pass
├── bufferB.glsl         # Optional - BufferB pass
├── common.glsl          # Optional - shared code (included in all passes)
├── config.json          # Optional - channel bindings & settings
└── *.jpg, *.png         # Optional - texture files
```

## Config File

For simple shaders, no config is needed. For multi-buffer or texture use:

```json
{
  "meta": { "title": "My Shader" },
  "controls": true,
  "passes": {
    "BufferA": {
      "channels": {
        "iChannel0": { "buffer": "BufferA", "previous": true }
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

**Channel types:**
- `{ "buffer": "BufferA" }` - read from buffer (current frame)
- `{ "buffer": "BufferA", "previous": true }` - read previous frame
- `{ "texture": "photo.jpg" }` - load image file
- `{ "keyboard": true }` - keyboard state texture

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **S** | Save screenshot (PNG) |
| **Space** | Play/Pause (when controls enabled) |
| **R** | Reset to frame 0 (when controls enabled) |

## NPM Scripts

```bash
npm run new <name> [buffers]   # Create new shader project
npm run dev:demo <name>        # Development server with hot reload
npm run build:demo <name>      # Production build to dist/
```

## Documentation

- [Getting Started](docs/learn/getting-started.md) - Your first shader
- [Buffers and Channels](docs/learn/buffers-and-channels.md) - Multi-pass rendering
- [Configuration](docs/learn/configuration.md) - Full config reference
- [Architecture](docs/dev/architecture.md) - How the engine works

## License

MIT
