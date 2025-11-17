# Configuration Reference

Complete reference for configuring your shader projects.

## Quick Overview

Every shader project needs either:
- **Simple**: Just an `image.glsl` file (auto-configured)
- **Advanced**: A `shadertoy.config.json` file + shader files

## File Structure

### Simple Single-Pass Shader

```
demos/my-shader/
└── image.glsl
```

That's it! The system will auto-generate a config for you.

### Multi-Pass Shader

```
demos/my-shader/
├── shadertoy.config.json
├── common.glsl          (optional - shared code)
├── bufferA.glsl
├── bufferB.glsl
├── image.glsl
└── photo.jpg            (optional - textures)
```

## Configuration File Format

`shadertoy.config.json` is a JSON file that describes your shader's structure.

### Minimal Example

```json
{
  "passes": {
    "Image": {}
  }
}
```

This is the absolute minimum - just an Image pass with no special configuration.

### Complete Example

```json
{
  "meta": {
    "title": "My Amazing Shader",
    "author": "Your Name",
    "description": "Does cool things with colors"
  },
  "layout": "centered",
  "controls": true,
  "passes": {
    "BufferA": {
      "channels": {
        "iChannel0": {
          "buffer": "BufferA",
          "previous": true
        },
        "iChannel1": {
          "texture": "photo.jpg",
          "filter": "linear",
          "wrap": "repeat"
        }
      }
    },
    "Image": {
      "channels": {
        "iChannel0": { "buffer": "BufferA" },
        "iChannel1": { "keyboard": true }
      }
    }
  }
}
```

## Top-Level Options

### `meta` (optional)

Project metadata for documentation.

```json
"meta": {
  "title": "Shader Name",
  "author": "Your Name",
  "description": "What this shader does"
}
```

All fields are optional. If omitted:
- `title` defaults to the folder name (capitalized)
- `author` defaults to `null`
- `description` defaults to `null`

### `layout` (optional)

Controls how the shader is displayed.

```json
"layout": "centered"
```

**Options**:
- `"fullscreen"` - Canvas fills entire screen
- `"centered"` (default) - Canvas is centered with max-width
- `"split"` - Split view with shader code on the right

**When to use each**:
- Fullscreen: Immersive art pieces, games
- Centered: Most shaders (default is usually fine)
- Split: When teaching/debugging to see code live

### `controls` (optional)

Enable playback control buttons.

```json
"controls": true
```

**Options**:
- `true` - Show play/pause, reset, and screenshot buttons
- `false` (default) - No controls visible

**What you get**:
- Play/Pause button (also **Space** key)
- Reset button (also **R** key)
- Screenshot button (also **S** key)

Even with `controls: false`, the **S** key for screenshots always works!

### `passes` (required)

Defines which shader passes to run and their configuration.

```json
"passes": {
  "BufferA": { /* config */ },
  "BufferB": { /* config */ },
  "Image": { /* config */ }
}
```

**Available passes** (all optional except Image):
- `BufferA`, `BufferB`, `BufferC`, `BufferD` - Intermediate render targets
- `Image` - Final output (required, must always be present)

**Execution order**: BufferA → BufferB → BufferC → BufferD → Image

## Pass Configuration

Each pass can have a `channels` object defining its inputs.

### Basic Pass (No Inputs)

```json
"Image": {}
```

No channels bound - all `iChannel0-3` will be black.

### Pass with Channels

```json
"BufferA": {
  "channels": {
    "iChannel0": { /* source */ },
    "iChannel1": { /* source */ },
    "iChannel2": { /* source */ },
    "iChannel3": { /* source */ }
  }
}
```

You can bind 0-4 channels. Unbound channels read as black.

## Channel Types

### 1. Buffer Reference

Read from another pass's render target.

**Current frame** (default):
```json
"iChannel0": {
  "buffer": "BufferA"
}
```

Reads BufferA's **current frame**. Works because BufferA runs before this pass.

**Previous frame**:
```json
"iChannel0": {
  "buffer": "BufferA",
  "previous": true
}
```

Reads BufferA's **previous frame**. Enables feedback loops!

**Self-reference** (feedback):
```json
"BufferA": {
  "channels": {
    "iChannel0": {
      "buffer": "BufferA",
      "previous": true
    }
  }
}
```

BufferA reads its own previous frame. The engine automatically creates ping-pong textures.

### 2. Texture (Image File)

Load an external image file.

**Basic**:
```json
"iChannel0": {
  "texture": "photo.jpg"
}
```

**With options**:
```json
"iChannel0": {
  "texture": "noise.png",
  "filter": "nearest",
  "wrap": "repeat"
}
```

**Options**:

`filter` - How pixels are sampled:
- `"linear"` (default) - Smooth interpolation
- `"nearest"` - Sharp, pixelated

`wrap` - What happens at UV edges:
- `"repeat"` (default) - Texture tiles
- `"clamp"` - Edge pixels stretch

**Supported formats**: `.jpg`, `.png`, `.webp`

**Where to put files**: In the same folder as your config file.

### 3. Keyboard

Read keyboard input as a texture.

```json
"iChannel0": {
  "keyboard": true
}
```

See [Buffers and Channels - Keyboard Input](buffers-and-channels.md#keyboard-input) for usage details.

## Complete Examples

### Simple Gradient

```json
{
  "meta": {
    "title": "Rainbow Gradient"
  },
  "passes": {
    "Image": {}
  }
}
```

### Feedback Loop

```json
{
  "meta": {
    "title": "Trails Effect"
  },
  "controls": true,
  "passes": {
    "BufferA": {
      "channels": {
        "iChannel0": {
          "buffer": "BufferA",
          "previous": true
        }
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

### With Texture and Keyboard

```json
{
  "meta": {
    "title": "Interactive Photo Effect",
    "author": "Me"
  },
  "layout": "centered",
  "controls": true,
  "passes": {
    "Image": {
      "channels": {
        "iChannel0": {
          "texture": "photo.jpg",
          "filter": "linear"
        },
        "iChannel1": {
          "keyboard": true
        }
      }
    }
  }
}
```

### Multi-Buffer Pipeline

```json
{
  "meta": {
    "title": "Complex Pipeline"
  },
  "passes": {
    "BufferA": {},
    "BufferB": {
      "channels": {
        "iChannel0": { "buffer": "BufferA" }
      }
    },
    "BufferC": {
      "channels": {
        "iChannel0": { "buffer": "BufferB" }
      }
    },
    "Image": {
      "channels": {
        "iChannel0": { "buffer": "BufferC" }
      }
    }
  }
}
```

## Common Shader Files

### `common.glsl` (Optional)

Shared code included in all passes.

```glsl
// common.glsl - shared by all passes

#define PI 3.14159265359

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec3 palette(float t) {
    vec3 a = vec3(0.5);
    vec3 b = vec3(0.5);
    vec3 c = vec3(1.0);
    vec3 d = vec3(0.0, 0.33, 0.67);
    return a + b * cos(6.28318 * (c * t + d));
}
```

All passes can use these functions without re-declaring them.

### Pass Files

Each pass needs a `.glsl` file:
- `bufferA.glsl`, `bufferB.glsl`, `bufferC.glsl`, `bufferD.glsl`
- `image.glsl` (always required)

File names must match pass names (case-insensitive).

## Keyboard Shortcuts

### Always Available

| Key | Action |
|-----|--------|
| **S** | Save screenshot as PNG |

Screenshots are saved as: `shadertoy-{folder-name}-{timestamp}.png`

Example: `shadertoy-my-shader-20241117-143022.png`

### When `controls: true`

| Key | Action |
|-----|--------|
| **Space** | Play / Pause animation |
| **R** | Reset (restart from frame 0) |

These work even if you hide the control buttons!

## Loading Your Shader

Edit `src/main.ts`:

```typescript
const DEMO_NAME = 'my-shader';  // Your folder name
```

Then refresh your browser. That's it!

## Troubleshooting

### "Image pass is required"

You must always have an `Image` pass in your config:

```json
{
  "passes": {
    "Image": {}
  }
}
```

### "Texture not found: photo.jpg"

Make sure:
1. File is in the same folder as your config
2. Filename matches exactly (case-sensitive!)
3. Path is relative (just the filename, no `./` or folders)

### "Buffer 'BufferX' not found"

You referenced a buffer that isn't defined:

```json
{
  "passes": {
    "Image": {
      "channels": {
        "iChannel0": { "buffer": "BufferA" }  // But no BufferA defined!
      }
    }
  }
}
```

Add the buffer to `passes`:

```json
{
  "passes": {
    "BufferA": {},
    "Image": {
      "channels": {
        "iChannel0": { "buffer": "BufferA" }
      }
    }
  }
}
```

### Controls not showing

Make sure you set:

```json
{
  "controls": true
}
```

At the top level of your config, not inside `passes`.

## Best Practices

### Start Simple

Begin with just `image.glsl`, add complexity as needed:

1. Start: Just `image.glsl`
2. Add config: `shadertoy.config.json` with metadata
3. Add buffers: Multi-pass rendering
4. Add textures: External images
5. Add keyboard: Interactivity

### Organize Complex Shaders

For big projects:

```
demos/my-complex-shader/
├── shadertoy.config.json
├── common.glsl              # Shared functions
├── bufferA.glsl            # Simulation
├── bufferB.glsl            # Post-process
├── image.glsl              # Final composite
├── textures/
│   ├── noise.png
│   └── environment.jpg
└── README.md               # Your notes
```

### Use Comments

JSON doesn't support comments, but you can add a description:

```json
{
  "meta": {
    "description": "BufferA: physics sim, BufferB: blur, Image: composite"
  }
}
```

## Next Steps

- See [Getting Started](getting-started.md) for shader basics
- See [Buffers and Channels](buffers-and-channels.md) for multi-pass details
- Check out the example demos for inspiration!

Happy configuring! ⚙️
