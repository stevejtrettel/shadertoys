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

projects/            # Example shaders
├── simple-gradient/
├── ping-pong-test/
└── multi-buffer-test/
```

## Usage

Edit `src/main.ts` to change the shader. Just copy/paste the GLSL code from any Shadertoy into the `simpleGradientShader` constant!

```typescript
const myShader = `
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0, 2, 4));
    fragColor = vec4(col, 1.0);
}
`;
```

## Architecture

Built with a clean 3-layer architecture:

1. **Project Layer** - Type definitions and config loading
2. **Engine Layer** - WebGL execution with Shadertoy compatibility
3. **App Layer** - Browser runtime and UI

See `docs/` for detailed specifications.

## License

MIT
