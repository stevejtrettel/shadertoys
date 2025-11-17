# Architecture

This document explains the system design, data flow, and key architectural decisions.

## Overview

The Shadertoy Runner is built with a clean **layered architecture** that separates concerns and maintains strong boundaries between components.

```
┌─────────────────────────────────────────────┐
│              User Interface                 │
│         (Layouts + App Layer)               │
├─────────────────────────────────────────────┤
│              Engine Layer                   │
│        (WebGL Execution)                    │
├─────────────────────────────────────────────┤
│             Project Layer                   │
│    (Config Loading & Normalization)         │
└─────────────────────────────────────────────┘
```

Each layer has a specific responsibility and communicates through well-defined interfaces.

## Layer Breakdown

### 1. Project Layer (`src/project/`)

**Responsibility**: Load and normalize shader configurations into a standard format.

**Key Files**:
- `types.ts` - Type definitions for configs and normalized projects
- `loadDemo.ts` - Loads demos from the `demos/` folder
- `preprocess.ts` - GLSL preprocessing (common.glsl injection, cubemap conversion)

**Input**: Raw config files + GLSL source files
**Output**: Normalized `ShadertoyProject` object

**Key Responsibilities**:
- Parse JSON configs
- Load GLSL source files
- Inject `common.glsl` into all passes
- Convert cubemap texture() calls to equirectangular
- Detect self-referencing buffers (ping-pong)
- Validate configuration
- Normalize defaults (missing channels → `kind: 'none'`)

**Design Decision**: This layer ensures the engine always receives **valid, normalized data**. The engine never needs to handle edge cases like missing passes or optional fields.

### 2. Engine Layer (`src/engine/`)

**Responsibility**: Execute shaders using WebGL with Shadertoy semantics.

**Key Files**:
- `ShadertoyEngine.ts` - Main engine implementation
- `types.ts` - Engine-specific types (RuntimePass, etc.)
- `glHelpers.ts` - WebGL utility functions

**Input**: `ShadertoyProject` + WebGL context
**Output**: Renders frames to screen

**Key Responsibilities**:
- Compile GLSL shaders
- Create WebGL resources (programs, VAOs, framebuffers, textures)
- Bind Shadertoy uniforms (`iTime`, `iResolution`, `iFrame`, etc.)
- Execute passes in order (BufferA → BufferB → ... → Image)
- Manage ping-pong textures for self-referencing buffers
- Bind channels (buffers, textures, keyboard)
- Track keyboard state and update keyboard texture

**Design Decision**: The engine is **stateless across frames** - it just executes what it's told. The App layer controls timing and the animation loop.

### 3. App Layer (`src/app/`)

**Responsibility**: Browser runtime, animation loop, and user interface.

**Key Files**:
- `App.ts` - Main application class
- `types.ts` - App-specific types (AppOptions, MouseState)

**Input**: Container element + `ShadertoyProject`
**Output**: Running application with UI

**Key Responsibilities**:
- Create and manage canvas
- Run animation loop (`requestAnimationFrame`)
- Track FPS and display counter
- Handle mouse events → update `iMouse`
- Handle keyboard events → forward to engine
- Manage playback state (play/pause/reset)
- Screenshot functionality
- Present engine output to screen
- Handle resize events

**Design Decision**: App layer handles **all browser APIs** and UI concerns. The engine never touches DOM or browser events.

### 4. Layout Layer (`src/layouts/`)

**Responsibility**: Different display modes for the shader viewer.

**Key Files**:
- `FullscreenLayout.ts` - Canvas fills screen
- `CenteredLayout.ts` - Canvas centered with max-width
- `SplitLayout.ts` - Canvas + code viewer side-by-side
- `index.ts` - Factory function

**Input**: Container + project
**Output**: Layout-specific DOM structure

**Key Responsibilities**:
- Create DOM structure for layout
- Import and manage layout-specific CSS
- Provide canvas container to App
- Handle syntax highlighting (SplitLayout only)

**Design Decision**: Layouts are **modular and swappable** via factory pattern. Each layout imports its own CSS, so Vite bundles only what's needed.

## Data Flow

### Startup Sequence

```
1. main.ts
   ↓
2. loadDemoProject(demoName)
   ↓
3. Project Layer: Load config, load GLSL, preprocess, normalize
   ↓
4. Returns ShadertoyProject
   ↓
5. createLayout(mode, { container, project })
   ↓
6. Layout creates DOM structure
   ↓
7. new App({ container: layout.getCanvasContainer(), project })
   ↓
8. App creates canvas, WebGL context
   ↓
9. new ShadertoyEngine({ gl, project })
   ↓
10. Engine compiles shaders, creates resources
   ↓
11. app.start() begins animation loop
```

### Per-Frame Execution

```
1. requestAnimationFrame callback
   ↓
2. App.animate(timestamp)
   ↓
3. App.updateKeyboardTexture()  (writes key states to GPU)
   ↓
4. App → Engine.step(time, mouse)
   ↓
5. Engine executes passes in order:
   ├─ For each pass:
   │  ├─ Bind framebuffer
   │  ├─ Bind uniforms (iTime, iResolution, etc.)
   │  ├─ Bind channels (iChannel0-3)
   │  ├─ Draw fullscreen triangle
   │  └─ Swap ping-pong textures if needed
   │
6. Engine returns
   ↓
7. App.presentToScreen()  (blits Image pass to canvas)
   ↓
8. App.updateFps()
```

### Channel Binding Flow

When the engine needs to bind `iChannel0` for a pass:

```
1. Look up channel source in pass.projectChannels[0]
   ↓
2. Switch on source.kind:
   │
   ├─ kind: 'buffer'
   │  ├─ Find runtime pass by name
   │  ├─ Use currentTexture or previousTexture
   │  └─ Bind to texture unit 0
   │
   ├─ kind: 'texture2d'
   │  ├─ Find runtime texture by name
   │  └─ Bind to texture unit 0
   │
   ├─ kind: 'keyboard'
   │  ├─ Get keyboard texture
   │  └─ Bind to texture unit 0
   │
   └─ kind: 'none'
      └─ Bind black 1x1 texture
```

## Key Design Decisions

### 1. Normalization at Load Time

**Decision**: All validation and normalization happens in the Project layer.

**Why**:
- Engine code is simpler (no edge cases)
- Errors caught early (at load time, not render time)
- Type system guarantees valid data

**Example**: Missing channels are filled with `{ kind: 'none' }` so the engine always has exactly 4 channels per pass.

### 2. Ping-Pong Automatic Detection

**Decision**: Self-referencing buffers automatically get ping-pong textures.

**Why**:
- Users don't need to understand ping-pong
- Matches Shadertoy behavior exactly
- No extra configuration needed

**How**: Preprocessor detects `buffer: X, previous: true` where X is current pass name.

### 3. Stateless Engine

**Decision**: Engine doesn't control timing or decide when to render.

**Why**:
- Clean separation of concerns
- Easy to test (just call `step()`)
- App controls pause/play without engine knowledge

**How**: App calls `engine.step(time, mouse)` each frame. Engine just executes.

### 4. WebGL Resource Ownership

**Decision**: Engine owns **all** WebGL resources.

**Why**:
- Clear ownership (engine creates, engine disposes)
- App never touches WebGL
- Prevents resource leaks

**Resources**:
- Shader programs
- VAOs (Vertex Array Objects)
- Framebuffers
- Textures (render targets + external)
- Keyboard texture

### 5. CSS Co-location

**Decision**: Each layout imports its own CSS file.

**Why**:
- Modular - CSS lives with the component that needs it
- Vite bundles efficiently (tree-shaking works)
- No global CSS pollution

**How**: TypeScript imports like `import './fullscreen.css'` are processed by Vite.

### 6. Factory Pattern for Layouts

**Decision**: Layouts created via factory function, not direct instantiation.

**Why**:
- Easy to add new layouts
- Clean switch based on mode string
- Main doesn't need to know about all layout classes

**Code**:
```typescript
const layout = createLayout(project.layout, options);
// Instead of:
// const layout = new CenteredLayout(options);
```

## WebGL Resource Management

### Texture Strategy

**Render Targets** (ping-pong):
- Each pass has `currentTexture` and `previousTexture`
- After rendering, swap them
- Both are RGBA32F (float precision)

**External Textures**:
- Loaded once at startup
- Stored in `_textures` array
- RGBA8 format (images)

**Keyboard Texture**:
- 256×3 RGBA32F texture
- Updated every frame before rendering
- Stores key states at y=0, toggles at y=2

### Framebuffer Strategy

Each pass has one framebuffer:
- Attached to `currentTexture`
- Reattached after ping-pong swap
- Used for rendering that pass

The Image pass output is blitted to screen using `gl.blitFramebuffer()`.

### Vertex Array Objects (VAOs)

Each pass has one VAO for a fullscreen triangle:
- 3 vertices: (-1,-1), (3,-1), (-1,3)
- Covers entire clip space
- More efficient than quad (2 triangles)

## Performance Considerations

### Minimize State Changes

WebGL state changes are expensive. The engine:
- Binds VAO once per pass (contains all vertex state)
- Binds program once per pass
- Binds textures in order (texture unit 0-3)
- Minimizes framebuffer binds

### Texture Uploads

Keyboard texture is the only texture updated per frame:
- Small (256×3 = 768 pixels)
- Uses `texSubImage2D` (no reallocation)
- Uploaded once before all passes

### No Redundant Work

- Canvas resize only updates when size actually changes
- FPS counter only updates ~once per second
- Compilation errors cached (not re-checked each frame)

## Error Handling

### Compile-Time Errors

Shader compilation errors are:
1. Caught during engine construction
2. Stored in `_compilationErrors` array
3. Checked by App via `engine.hasErrors()`
4. Displayed in overlay (App responsibility)
5. Animation loop not started

### Runtime Errors

Rare, but possible:
- Invalid framebuffer configurations → throw Error
- Missing resources → throw Error
- WebGL context loss → not currently handled (TODO)

**Philosophy**: Fail fast and loudly during development. Production use should never hit these.

## Type Safety

### Strong Typing Throughout

- Project layer: `ShadertoyProject`, `ShadertoyPass`, `ChannelSource`
- Engine layer: `RuntimePass`, `RuntimeTexture2D`, `PassUniformLocations`
- App layer: `AppOptions`, `MouseState`

### Discriminated Unions

Channel sources use discriminated unions:

```typescript
type ChannelSource =
  | { kind: 'buffer'; name: PassName; previous: boolean }
  | { kind: 'texture2d'; name: string; filter: ...; wrap: ... }
  | { kind: 'keyboard' }
  | { kind: 'none' };
```

TypeScript ensures exhaustive checking in switch statements.

### Null Safety

- Optional fields use `| null`, not `| undefined`
- Required fields are non-nullable
- Uniforms are `WebGLUniformLocation | null` (matching WebGL API)

## Extension Points

### Adding New Uniform Types

1. Add to `PassUniformLocations` type
2. Query location in `createPassUniforms()`
3. Bind in `bindUniforms()`

### Adding New Channel Types

1. Add to `ChannelSource` union
2. Add to `ChannelJSON` union
3. Handle in `resolveChannelSource()`
4. Handle in `bindChannel()`

### Adding New Layout Modes

1. Create `NewLayout.ts` class implementing `BaseLayout`
2. Create `new-layout.css` for styles
3. Add to factory in `layouts/index.ts`
4. Add to `LayoutMode` type

## Testing Strategy (Future)

Not currently implemented, but here's the recommended approach:

### Unit Tests
- Project layer: Config parsing and normalization
- Preprocessor: GLSL transformations
- GL helpers: Texture creation, shader compilation

### Integration Tests
- Engine: Full render pipeline with mock GL context
- App: Mouse/keyboard event handling

### Visual Regression Tests
- Render reference shaders
- Compare screenshots pixel-by-pixel
- Catch rendering regressions

## Build Process

### Development
```bash
npm run dev
```

Vite development server:
- Hot module replacement
- TypeScript compilation
- CSS bundling
- Source maps

### Production
```bash
npm run build
```

1. TypeScript compilation (`tsc`)
2. Vite build (bundling, minification)
3. Output to `dist/`:
   - `index.html` (0.37 kB)
   - `assets/main.js` (~100 kB, ~26 kB gzipped)
   - `assets/index.css` (~6 kB)
   - Static assets (images)

### Key Optimizations

- Tree-shaking removes unused code
- CSS is extracted and minified
- Assets are hashed for cache busting
- Gzip compression on text files

## Future Improvements

### Potential Additions

1. **WebGL context loss handling** - Restore resources on context lost/restored
2. **Multiple textures per channel** - Cubemaps, 3D textures, video
3. **Audio input** - FFT texture for music visualization
4. **Hot reload for shaders** - Watch GLSL files and recompile
5. **Performance profiling** - GPU timer queries for per-pass timing
6. **WASM preprocessing** - Faster GLSL parsing/transformation
7. **Unit tests** - Full test coverage

### Known Limitations

- No cubemap textures (converted to equirectangular)
- No video textures
- No audio input
- No webcam input
- Fixed 4 channels per pass
- Maximum 5 passes (BufferA-D + Image)

These match Shadertoy's current feature set and can be added if needed.

## Summary

The architecture emphasizes:
- **Clear separation of concerns** - Each layer has one job
- **Strong typing** - TypeScript prevents bugs
- **Predictable data flow** - One-way flow from config to rendering
- **Modularity** - Easy to extend and maintain
- **Performance** - Minimal overhead, efficient WebGL usage

This design makes the codebase easy to understand, test, and extend while maintaining high performance and compatibility with Shadertoy.
