# Shader Sandbox

A lightweight, Shadertoy-compatible GLSL shader development environment. Copy shaders directly from Shadertoy and run them locally with live editing.

## Features

- **Shadertoy Compatibility** - Copy/paste shaders directly from Shadertoy
- **Full Shadertoy Uniforms** - `iTime`, `iResolution`, `iFrame`, `iMouse`, `iTimeDelta`, `iChannel0-3`
- **Multi-Buffer Rendering** - BufferA-D passes with correct ping-pong semantics
- **Texture Support** - Load images with configurable filtering and wrapping
- **Keyboard Input** - Full keyboard state via Shadertoy-compatible texture
- **Live Code Editing** - Edit shaders in the browser with instant recompilation
- **Multiple Layouts** - Fullscreen, split-view, or tabbed code display
- **Playback Controls** - Play/pause, reset, and screenshot capture

## Quick Start

```bash
# Create a new shader project
npx @stevejtrettel/shader-sandbox create my-shaders

# Enter the project
cd my-shaders

# Run an example shader
shader dev example-gradient
```

Open http://localhost:3000 to see your shader running.

## CLI Commands

```bash
shader create <name>     # Create a new shader project
shader dev <name>        # Run shader with live reload
shader build <name>      # Build shader for production
shader new <name>        # Create a new shader
shader list              # List all shaders
shader init              # Initialize shaders in current directory
```

## Project Structure

After running `shader create my-shaders`:

```
my-shaders/
├── shaders/
│   ├── example-gradient/
│   │   ├── image.glsl       # Main shader code
│   │   └── config.json      # Optional configuration
│   └── example-buffer/
│       ├── image.glsl       # Final output
│       ├── bufferA.glsl     # Feedback buffer
│       └── config.json
├── main.ts                  # Entry point
├── vite.config.js           # Vite configuration
└── package.json
```

## Creating Shaders

### Simple Shader

Create a new shader with just an image pass:

```bash
shader new my-shader
shader dev my-shader
```

Edit `shaders/my-shader/image.glsl`:

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0, 2, 4));
    fragColor = vec4(col, 1.0);
}
```

### Copy from Shadertoy

1. Find a shader on [Shadertoy](https://www.shadertoy.com)
2. Copy the code from the "Image" tab
3. Paste into `shaders/my-shader/image.glsl`
4. Run `shader dev my-shader`

Most single-pass shaders work immediately. For multi-buffer shaders, you'll need to create the buffer files and config.

### Multi-Buffer Shaders

For feedback effects (trails, fluid, etc.), create a buffer:

**shaders/my-effect/bufferA.glsl:**
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec4 prev = texture(iChannel0, uv) * 0.98;  // Previous frame with fade

    // Draw at mouse position
    vec2 mouse = iMouse.xy / iResolution.xy;
    float d = length(uv - mouse);
    float spot = smoothstep(0.05, 0.0, d);

    fragColor = prev + vec4(spot);
}
```

**shaders/my-effect/image.glsl:**
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    fragColor = texture(iChannel0, uv);
}
```

**shaders/my-effect/config.json:**
```json
{
  "BufferA": {
    "iChannel0": "BufferA"
  },
  "Image": {
    "iChannel0": "BufferA"
  }
}
```

### Using Textures

Place an image in your shader folder and reference it in config:

**shaders/my-shader/config.json:**
```json
{
  "Image": {
    "iChannel0": "photo.jpg"
  }
}
```

**shaders/my-shader/image.glsl:**
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec4 img = texture(iChannel0, uv);
    fragColor = img;
}
```

Texture options:
```json
{
  "Image": {
    "iChannel0": {
      "texture": "photo.jpg",
      "filter": "linear",
      "wrap": "repeat"
    }
  }
}
```

- `filter`: `"linear"` (smooth) or `"nearest"` (pixelated)
- `wrap`: `"repeat"` (tile) or `"clamp"` (stretch edges)

## Layouts

Control how the shader is displayed in `config.json`:

```json
{
  "layout": "split"
}
```

| Layout | Description |
|--------|-------------|
| `fullscreen` | Canvas fills the viewport |
| `default` | Centered canvas with controls |
| `tabbed` | Tabs to switch between shader and code |
| `split` | Side-by-side shader and code editor |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **S** | Save screenshot (PNG) |
| **Space** | Play/Pause |
| **R** | Reset to frame 0 |

## Shadertoy Uniforms

All standard Shadertoy uniforms are supported:

| Uniform | Type | Description |
|---------|------|-------------|
| `iResolution` | `vec3` | Viewport resolution (width, height, 1) |
| `iTime` | `float` | Elapsed time in seconds |
| `iTimeDelta` | `float` | Time since last frame |
| `iFrame` | `int` | Frame counter |
| `iMouse` | `vec4` | Mouse position and click state |
| `iChannel0-3` | `sampler2D` | Input textures/buffers |
| `iChannelResolution[4]` | `vec3[]` | Resolution of each channel |
| `iDate` | `vec4` | Year, month, day, time in seconds |

## Building for Production

```bash
shader build my-shader
```

Output is in `dist/` - a single HTML file with embedded JavaScript that can be hosted anywhere.

## License

MIT
