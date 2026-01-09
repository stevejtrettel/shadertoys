# Project Structure

Complete guide to the codebase organization and what each file does.

## Directory Overview

```
shadertoys/
├── src/               # Source code
├── shaders/           # Your shaders
├── docs/              # Documentation
├── scripts/           # Build scripts
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
├── vite.config.ts     # Build configuration
└── index.html         # Entry HTML file
```

## Source Code (`src/`)

### Entry Point

```
src/
├── main.ts            # Application entry point
└── styles/
    └── base.css       # Global CSS resets
```

**`main.ts`**
- Loads demo project via generated loader
- Creates layout based on project config
- Initializes App
- Starts animation loop
- Handles initialization errors

### Project Layer (`src/project/`)

Handles configuration loading and normalization.

```
src/project/
├── types.ts           # Type definitions
├── loadProject.ts     # Project loader (Node.js)
└── loaderHelper.ts    # Runtime loader for bundled demos
```

**`types.ts`**
- `PassName` - Union type: `'Image' | 'BufferA' | 'BufferB' | 'BufferC' | 'BufferD'`
- `ChannelJSON*` - JSON config format types
- `ChannelSource` - Normalized channel type (discriminated union)
- `Channels` - Tuple of exactly 4 ChannelSource
- `ShadertoyConfig` - JSON config structure
- `ShadertoyProject` - Normalized project (engine input)
- `ShadertoyPass` - Normalized pass definition
- `ShadertoyMeta` - Project metadata

**`loadProject.ts`**
- `loadProject(root)` - Main loading function (async, Node.js)
- Handles both simple (just `image.glsl`) and complex (with config) projects
- Validates passes and channels
- Normalizes configs to `ShadertoyProject`
- Sets default values for layout and controls

**`loaderHelper.ts`**
- `loadProjectFromFiles()` - Runtime loader for bundled demos
- Used by generated loader code
- Converts bundled file maps to ShadertoyProject

### Engine Layer (`src/engine/`)

WebGL execution engine.

```
src/engine/
├── ShadertoyEngine.ts # Main engine class
├── types.ts           # Engine types
└── glHelpers.ts       # WebGL utilities
```

**`ShadertoyEngine.ts`**

Main engine class (~800 lines):

**Constructor**:
- Initialize extensions (float textures)
- Create black texture (for unused channels)
- Create keyboard texture (256×3)
- Load external textures
- Compile shaders and create passes

**Public methods**:
- `step(time, mouse)` - Execute one frame
- `resize(width, height)` - Resize render targets
- `reset()` - Clear buffers and reset frame counter
- `updateKeyState(keycode, down)` - Track keyboard input
- `updateKeyboardTexture()` - Upload key states to GPU
- `getImageFramebuffer()` - Get Image pass FBO for presentation
- `hasErrors()` - Check for compilation errors
- `getCompilationErrors()` - Get error details
- `dispose()` - Clean up all resources

**Private methods**:
- `initExtensions()` - Enable required WebGL extensions
- `initProjectTextures()` - Load external images
- `initRuntimePasses()` - Compile shaders, create VAOs/FBOs
- `buildFragmentShader()` - Assemble shader with boilerplate
- `preprocessCubemapTextures()` - Convert cubemap calls to equirect
- `executePass()` - Render single pass
- `bindBuiltinUniforms()` - Set uniform values
- `bindChannelTextures()` - Bind textures to channels
- `resolveChannelTexture()` - Get WebGLTexture for channel
- `swapPassTextures()` - Ping-pong swap after render

**`types.ts`**
- `EngineOptions` - Engine constructor options
- `PassUniformLocations` - Cached uniform locations per pass
- `RuntimePass` - Internal pass representation
- `RuntimeTexture2D` - Loaded external texture
- `RuntimeKeyboardTexture` - Keyboard state texture
- `EngineStats` - Frame statistics

**`glHelpers.ts`**

WebGL utility functions:

**Shader compilation**:
- `createShader(gl, type, source)` - Compile shader with error checking
- `createProgramFromSources(gl, vs, fs)` - Link shader program

**Geometry**:
- `createFullscreenTriangleVAO(gl)` - Create VAO for fullscreen triangle

**Textures**:
- `createRenderTargetTexture(gl, w, h)` - RGBA32F float texture
- `createBlackTexture(gl)` - 1×1 black texture for unused channels
- `createKeyboardTexture(gl)` - 256×3 keyboard state texture
- `updateKeyboardTexture(gl, tex, keyStates, toggleStates)` - Upload key data

**Framebuffers**:
- `createFramebufferWithColorAttachment(gl, tex)` - Create FBO with texture

### App Layer (`src/app/`)

Browser runtime and UI.

```
src/app/
├── App.ts             # Main application class
├── types.ts           # App types
└── app.css            # App UI styles
```

**`App.ts`**

Main application class (~680 lines):

**Constructor**:
- Create canvas element
- Create FPS display
- Create playback controls (if enabled)
- Get WebGL2 context
- Create ShadertoyEngine
- Set up resize observer
- Set up mouse/keyboard tracking
- Set up keyboard shortcuts

**Animation loop**:
- `start()` - Begin requestAnimationFrame loop
- `stop()` - Cancel animation
- `animate(time)` - Main render callback

**Controls**:
- `togglePlayPause()` - Toggle isPaused flag
- `reset()` - Reset start time and engine
- `screenshot()` - Capture canvas as PNG

**Events**:
- `setupMouseTracking()` - Track mouse position and clicks
- `setupKeyboardTracking()` - Forward all keys to engine
- `setupGlobalShortcuts()` - S for screenshot
- `setupKeyboardShortcuts()` - Space/R for playback

**Rendering**:
- `updateCanvasSize()` - Resize canvas to container
- `presentToScreen()` - Blit Image pass to canvas
- `updateFps()` - Calculate and display FPS

**Error display**:
- `showErrorOverlay()` - Display compilation errors
- `extractCodeContext()` - Get source context around error

**`types.ts`**
- `AppOptions` - App constructor options
- `MouseState` - `[x, y, clickX, clickY]` for iMouse

**`app.css`**
- `.fps-counter` - FPS display styling
- `.playback-controls` - Control buttons styling
- `.control-button` - Individual button styling
- `.shader-error-overlay` - Compilation error display

### Layout Layer (`src/layouts/`)

Display modes for the viewer.

```
src/layouts/
├── index.ts           # Factory and exports
├── types.ts           # Layout interface
├── FullscreenLayout.ts
├── DefaultLayout.ts
├── SplitLayout.ts
├── fullscreen.css
├── default.css
└── split.css
```

**`types.ts`**
- `BaseLayout` - Interface all layouts implement
  - `getCanvasContainer()` - Returns HTMLElement for canvas
  - `dispose()` - Clean up
- `LayoutOptions` - Layout constructor options
- `LayoutMode` - `'fullscreen' | 'default' | 'split'`

**`index.ts`**
- `createLayout(mode, options)` - Factory function

**`FullscreenLayout.ts`**
- Canvas fills entire screen
- Imports `fullscreen.css`

**`DefaultLayout.ts`**
- Canvas centered with max-width and shadow
- Imports `default.css`

**`SplitLayout.ts`**
- Split view with code panel on right
- Uses Prism.js for syntax highlighting
- Tab switching between passes
- Copy-to-clipboard button
- Imports `split.css`

### Styles (`src/styles/`)

```
src/styles/
└── base.css           # Global resets and defaults
```

**`base.css`**
- CSS reset (margin, padding, box-sizing)
- html/body 100% height
- Disable overflow on body

## Shaders (`shaders/`)

Your shader projects. Each shader is a folder containing shader files.

**Shader structure** (two variants):

**Simple** (auto-configured):
```
shaders/my-shader/
└── image.glsl
```

**Complex** (with config):
```
shaders/my-shader/
├── config.json
├── common.glsl          (optional)
├── bufferA.glsl         (if BufferA defined)
├── bufferB.glsl         (if BufferB defined)
├── bufferC.glsl         (if BufferC defined)
├── bufferD.glsl         (if BufferD defined)
├── image.glsl           (always required)
└── texture.jpg          (if textures used)
```

## Scripts (`scripts/`)

Build helper scripts (Node.js):

- `dev-demo.cjs` - Generate loader for dev server
- `build-demo.cjs` - Generate loader for production build

These scripts create `src/project/generatedLoader.ts` which bundles the demo files.

## Documentation (`docs/`)

```
docs/
├── learn/
│   ├── getting-started.md
│   ├── buffers-and-channels.md
│   └── configuration.md
└── dev/
    ├── architecture.md
    ├── project-structure.md
    ├── components.md
    └── troubleshooting.md
```

## Configuration Files

### `package.json`

**Dependencies**:
- `prismjs` - Syntax highlighting for split layout

**DevDependencies**:
- `typescript` - TypeScript compiler
- `vite` - Build tool and dev server
- `vite-plugin-css-injected-by-js` - Inline CSS into JS bundle

**CLI Commands** (after installing package):
- `shader dev <name>` - Run specific shader
- `shader build <name>` - Build specific shader
- `shader new <name>` - Create new shader
- `shader list` - List all shaders

### `tsconfig.json`

TypeScript compiler options:
- `target: "ES2020"` - Modern JavaScript
- `module: "ESNext"` - ES modules
- `strict: true` - All strict checks enabled
- `moduleResolution: "bundler"` - For Vite
- Path alias: `@/*` → `src/*`

### `vite.config.ts`

Vite build configuration:
- Dev server on port 3000, auto-opens browser
- CSS injected into JS bundle
- Single JS output file (`assets/main.js`)
- Images keep original names

## File Naming Conventions

### TypeScript
- PascalCase for classes: `ShadertoyEngine.ts`, `App.ts`
- camelCase for utilities: `glHelpers.ts`, `loaderHelper.ts`
- lowercase for types: `types.ts`

### CSS
- kebab-case: `base.css`, `fullscreen.css`
- Component CSS same name as TS: `app.css`, `split.css`

### GLSL
- lowercase: `image.glsl`, `bufferA.glsl`, `common.glsl`
- Must match pass name (case-insensitive)

### Demos
- kebab-case folder names: `my-shader/`, `feedback-effect/`

## Code Organization Principles

### 1. Separation of Concerns
Each file has one clear purpose. No "god classes" or utility dumping grounds.

### 2. Co-location
Related files live together:
- Layout + CSS
- Component + types
- Pass + GLSL file

### 3. Clear Dependencies
Layers depend downward only:
```
App → Engine → Project
Layout → (independent)
```

### 4. Minimal Exports
Files export only what's needed externally. Internal helpers stay private.

### 5. Strong Typing
Every module has clear interfaces and types in `types.ts`.

## Adding New Files

### New Shader

1. Run: `shader new my-shader`
2. Edit: `shaders/my-shader/image.glsl`
3. Run: `shader dev my-shader`

### New Layout

1. Create `src/layouts/MyLayout.ts`
2. Create `src/layouts/my-layout.css`
3. Import CSS in class: `import './my-layout.css'`
4. Implement `BaseLayout` interface
5. Add to factory in `layouts/index.ts`
6. Add to `LayoutMode` type in `types.ts`

### New Engine Feature

1. Add types to `src/engine/types.ts`
2. Implement in `ShadertoyEngine.ts`
3. Add WebGL helpers to `glHelpers.ts` if needed

## Development Workflow

### Typical Session

1. `shader dev <name>` - Start with a shader
2. Edit shader files - browser auto-reloads
3. Edit code in browser - instant recompilation
4. Press S to save screenshots

### Debugging

**Shader compilation errors**:
- Displayed in overlay on screen
- Shows line numbers and code context
- Maps common.glsl errors to original lines

**Runtime errors**:
- Browser console shows stack traces
- TypeScript source maps work
- Use browser DevTools

**Performance**:
- FPS counter in bottom-left
- Use browser Performance tab for profiling
