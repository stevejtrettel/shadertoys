# Shader Sandbox

A lightweight, Shadertoy-compatible GLSL shader development environment. Copy shaders directly from Shadertoy and run them locally with live editing.

## Features

- **Shadertoy Compatibility** - Copy/paste shaders directly from Shadertoy
- **Full Shadertoy Uniforms** - `iTime`, `iResolution`, `iFrame`, `iMouse`, `iTimeDelta`, `iChannel0-3`
- **Multi-Buffer Rendering** - BufferA-D passes with correct ping-pong semantics
- **Texture Support** - Load images with configurable filtering and wrapping
- **Keyboard Input** - Config-based key bindings with hold/toggle modes, plus Shadertoy-compatible texture
- **Custom Uniforms** - Define uniforms in config with auto-generated UI controls
- **Live Code Editing** - Edit shaders in the browser with instant recompilation
- **Multiple Layouts** - Fullscreen, split-view, or tabbed code display
- **Playback Controls** - Play/pause, reset, screenshot, and video recording
- **Export** - Export shaders as standalone HTML files
- **Touch Support** - Multi-touch with pinch gestures for mobile

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
shader build <name>      # Build for production (multi-file)
shader export <name>     # Export as standalone HTML (single file)
shader new <name>        # Create a new shader
shader list              # List all shaders
shader init              # Initialize shaders in current directory
shader --version         # Show version
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

### Keyboard Input

Define semantic key bindings in config - uniforms are auto-injected:

**shaders/my-game/config.json:**
```json
{
  "keys": {
    "jump": "Space",
    "left": ["A", "ArrowLeft"],
    "right": ["D", "ArrowRight"],
    "debug": { "key": "G", "mode": "toggle" }
  },
  "Image": {}
}
```

**shaders/my-game/image.glsl:**
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Use key uniforms directly - no declarations needed!
    float dx = key_right - key_left;

    // Single-frame events
    if (key_jump_pressed > 0.5) {
        // Jump was just pressed this frame
    }

    // Toggle state
    if (key_debug > 0.5) {
        // Debug mode is on
    }

    fragColor = vec4(uv, 0.5, 1.0);
}
```

For each key binding, three uniforms are generated:
- `key_<name>` - 1.0 while held (or toggled on)
- `key_<name>_pressed` - 1.0 only on frame pressed
- `key_<name>_released` - 1.0 only on frame released

Shadertoy's keyboard texture is also supported for copy-paste compatibility.

### Custom Uniforms

Define interactive uniforms with auto-generated UI controls:

**shaders/my-shader/config.json:**
```json
{
  "uniforms": {
    "speed": { "type": "float", "value": 1.0, "min": 0, "max": 5 },
    "rings": { "type": "int", "value": 5, "min": 1, "max": 20 },
    "animate": { "type": "bool", "value": true },
    "color": { "type": "vec3", "value": [1, 0.5, 0.2], "color": true },
    "offset": { "type": "vec2", "value": [0.5, 0.5] }
  },
  "Image": {}
}
```

**shaders/my-shader/image.glsl:**
```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Uniforms are auto-injected - just use them!
    float t = animate ? iTime * speed : 0.0;
    vec3 col = color * sin(length(uv - offset) * float(rings) - t);

    fragColor = vec4(col, 1.0);
}
```

Supported types: `float`, `int`, `bool`, `vec2`, `vec3`, `vec4`

### Common Code

If multiple passes share helper functions, create a `common.glsl` file in your shader folder. It will be automatically injected into every pass:

**shaders/my-shader/common.glsl:**
```glsl
vec3 palette(float t) {
    return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
}

float sdCircle(vec2 p, float r) {
    return length(p) - r;
}
```

These functions are then available in `image.glsl`, `bufferA.glsl`, etc. without any imports.

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

## Themes

Set the color theme in `config.json`:

```json
{
  "theme": "dark"
}
```

| Theme | Description |
|-------|-------------|
| `dark` | Dark background (default) |
| `light` | Light background |
| `system` | Follow OS preference |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **S** | Save screenshot (PNG) |
| **Space** | Play/Pause |
| **R** | Reset to frame 0 |

Note: Shortcuts are disabled while typing in the code editor.

## Controls Menu

Click the **+** button to access:
- **Play/Pause** - Toggle animation
- **Reset** - Return to frame 0
- **Screenshot** - Download PNG
- **Record Video** - Capture WebM video
- **Export HTML** - Download standalone HTML file
- **Uniform Controls** - Sliders, color pickers, and XY pads for custom uniforms

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

### Touch Extensions (Shader Sandbox only)

| Uniform | Type | Description |
|---------|------|-------------|
| `iTouchCount` | `int` | Number of active touches (0-10) |
| `iTouch0-2` | `vec4` | Touch position (x, y, startX, startY) |
| `iPinch` | `float` | Pinch scale factor (1.0 = no pinch) |
| `iPinchDelta` | `float` | Pinch change since last frame |
| `iPinchCenter` | `vec2` | Center point of pinch gesture |

## Building & Exporting

### Build for hosting

```bash
shader build my-shader
```

Outputs to `dist/<name>/` with separate files for hosting:
```
dist/my-shader/
├── index.html
├── assets/
│   └── main.js
```

Textures and images are included in the assets folder. Suitable for deploying to any static host.

### Export as standalone HTML

```bash
shader export my-shader
```

Generates a single self-contained HTML file at `dist/<name>.html` with all JavaScript and CSS inlined. No external dependencies — just open the file in a browser.

You can also export from the browser: click the **+** menu and select **Export HTML** to download the current shader as a standalone file with baked-in uniform values.

Note: The standalone HTML export replaces textures with a procedural grid pattern since images can't be reliably inlined. Use `shader build` if your shader relies on texture inputs.

## License

MIT
