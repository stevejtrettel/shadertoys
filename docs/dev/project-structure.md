# Project Structure

Complete guide to the codebase organization and what each file does.

## Directory Overview

```
shadertoys/
├── src/               # Source code
├── demos/             # Example shaders
├── public/            # Static assets
├── dist/              # Build output (generated)
├── docs/              # Documentation
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
├── vite.config.ts     # Build configuration
└── index.html         # Entry HTML file
```

## Source Code (`src/`)

### Entry Point

```
src/
└── main.ts            # Application entry point
```

**`main.ts`**
- Loads demo project by name
- Creates layout
- Initializes App
- Starts animation loop
- Handles initialization errors

**Key code**:
```typescript
// Demo name comes from generated loader (set via npm run dev:demo <name>)
import { loadDemoProject, DEMO_NAME } from './project/generatedLoader';

const project = await loadDemoProject();
const layout = createLayout(project.layout, { container, project });
const app = new App({ container, project, pixelRatio });
app.start();
```

### Project Layer (`src/project/`)

Handles configuration loading and normalization.

```
src/project/
├── types.ts           # Type definitions
├── loadDemo.ts        # Demo loader
└── preprocess.ts      # GLSL preprocessing
```

**`types.ts`**
- `PassName` - Type for pass names ('Image', 'BufferA', etc.)
- `ChannelJSON*` - JSON config format types
- `ChannelSource` - Normalized channel type
- `ShadertoyConfig` - JSON config structure
- `ShadertoyProject` - Normalized project (engine input)
- `ShadertoyPass` - Normalized pass definition
- `ShadertoyMeta` - Project metadata

**`loadDemo.ts`**
- `loadDemoProject(demoName)` - Main loading function
- Handles both simple (just image.glsl) and complex (with config) demos
- Uses Vite's `import.meta.glob()` to load files
- Normalizes configs to `ShadertoyProject`
- Validates passes and channels

**`preprocess.ts`**
- `preprocessGLSL(source, common)` - Prepend common.glsl
- `convertCubemapToEquirect(source)` - Transform texture() calls
- `wrapInMainIfNeeded(source)` - Add main() wrapper for mainImage()
- Detects cubemap sampling: `texture(iChannel, vec3)`
- Converts to: `texture(iChannel, equirectangularUV)`

### Engine Layer (`src/engine/`)

WebGL execution engine.

```
src/engine/
├── ShadertoyEngine.ts # Main engine class
├── types.ts           # Engine types
└── glHelpers.ts       # WebGL utilities
```

**`ShadertoyEngine.ts`**

Main engine implementation:

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
- `dispose()` - Clean up all resources

**Private methods**:
- `initExtensions()` - Enable required WebGL extensions
- `initProjectTextures()` - Load external images
- `initRuntimePasses()` - Compile shaders, create VAOs/FBOs
- `bindUniforms()` - Set uniform values
- `bindChannel()` - Bind texture to channel
- `resolveChannelTexture()` - Get WebGLTexture for channel

**`types.ts`**
- `EngineOptions` - Engine constructor options
- `PassUniformLocations` - Cached uniform locations per pass
- `RuntimePass` - Internal pass representation
- `RuntimeTexture2D` - Loaded external texture
- `RuntimeKeyboardTexture` - Keyboard state texture
- `EngineStats` - Frame statistics
- `ShadertoyEngine` - Public engine interface

**`glHelpers.ts`**

WebGL utility functions:

**Shader compilation**:
- `compileShader(gl, type, source)` - Compile shader with error checking
- `createProgramFromSources(gl, vs, fs)` - Link shader program

**Geometry**:
- `createFullscreenTriangleVAO(gl)` - Create VAO for fullscreen triangle

**Textures**:
- `createRenderTargetTexture(gl, w, h)` - RGBA32F float texture
- `createBlackTexture(gl)` - 1×1 black texture for unused channels
- `createKeyboardTexture(gl)` - 256×3 keyboard state texture
- `createTextureFromImage(gl, img, filter, wrap)` - Texture from HTMLImageElement
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

Main application class:

**Constructor**:
- Create canvas element
- Create FPS display
- Create playback controls (if enabled)
- Get WebGL2 context with `preserveDrawingBuffer: true`
- Create ShadertoyEngine
- Set up resize observer
- Set up mouse tracking
- Set up keyboard tracking
- Set up keyboard shortcuts

**Animation loop**:
- `start()` - Begin requestAnimationFrame loop
- `stop()` - Cancel animation
- `animate(time)` - Main render callback
  - Skip if paused
  - Update FPS counter
  - Update keyboard texture
  - Call engine.step()
  - Present to screen

**Controls**:
- `togglePlayPause()` - Toggle isPaused flag
- `reset()` - Reset start time and engine
- `screenshot()` - Capture canvas as PNG

**Events**:
- `setupMouseTracking()` - Track mouse position and clicks
- `setupKeyboardTracking()` - Forward all keys to engine
- `setupGlobalShortcuts()` - S for screenshot
- `setupKeyboardShortcuts()` - Space/R for playback controls

**Rendering**:
- `updateCanvasSize()` - Resize canvas to container
- `presentToScreen()` - Blit Image pass to canvas
- `updateFps()` - Calculate and display FPS

**`types.ts`**
- `AppOptions` - App constructor options
- `MouseState` - [x, y, clickX, clickY] for iMouse

**`app.css`**
- `.fps-counter` - FPS display styling
- `.playback-controls` - Control buttons styling
- `.control-button` - Individual button styling
- `.error-overlay` - Shader compilation error display

### Layout Layer (`src/layouts/`)

Display modes for the viewer.

```
src/layouts/
├── index.ts           # Factory and exports
├── types.ts           # Layout interface
├── FullscreenLayout.ts
├── CenteredLayout.ts
├── SplitLayout.ts
├── fullscreen.css
├── centered.css
└── split.css
```

**`types.ts`**
- `BaseLayout` - Interface all layouts implement
  - `getCanvasContainer()` - Returns HTMLElement for canvas
  - `dispose()` - Clean up
- `LayoutOptions` - Layout constructor options
- `LayoutMode` - 'fullscreen' | 'centered' | 'split'

**`index.ts`**
- `createLayout(mode, options)` - Factory function
- Exports all layout classes

**`FullscreenLayout.ts`**
- Canvas fills entire screen
- Imports `fullscreen.css`

**`CenteredLayout.ts`**
- Canvas centered with max-width
- Imports `centered.css`

**`SplitLayout.ts`**
- Split view with code panel
- Uses Prism for syntax highlighting
- Imports `split.css` and Prism theme

**CSS files**
- Each layout imports its own CSS
- Vite bundles them together
- Uses class names like `.layout-fullscreen`, `.layout-centered`, `.layout-split`

### Styles (`src/styles/`)

Global base styles.

```
src/styles/
└── base.css           # Global resets and defaults
```

**`base.css`**
- CSS reset (margin, padding, box-sizing)
- html/body 100% height
- Disable overflow on body
- Imported in `main.ts`

## Demos (`demos/`)

Example shader projects.

```
demos/
├── simple-gradient/
│   └── image.glsl
├── ping-pong-test/
│   ├── shadertoy.config.json
│   ├── bufferA.glsl
│   └── image.glsl
├── multi-buffer-test/
│   ├── shadertoy.config.json
│   ├── bufferA.glsl
│   ├── bufferB.glsl
│   └── image.glsl
├── demofox-pt2/
│   ├── shadertoy.config.json
│   ├── bufferA.glsl
│   ├── image.glsl
│   └── equirect.jpg
└── keyboard-test/
    ├── shadertoy.config.json
    └── image.glsl
```

**Demo structure** (two variants):

**Simple** (auto-configured):
```
demos/my-shader/
└── image.glsl
```

**Complex** (with config):
```
demos/my-shader/
├── shadertoy.config.json
├── common.glsl          (optional)
├── bufferA.glsl         (if BufferA defined)
├── bufferB.glsl         (if BufferB defined)
├── bufferC.glsl         (if BufferC defined)
├── bufferD.glsl         (if BufferD defined)
├── image.glsl           (always required)
└── texture.jpg          (if textures used)
```

## Public Assets (`public/`)

Static files copied as-is to build output.

```
public/
└── (currently empty)
```

Files in `public/` are served at the root URL. Example:
- `public/logo.png` → `http://localhost:5173/logo.png`

## Documentation (`docs/`)

```
docs/
├── learn/
│   ├── getting-started.md
│   ├── buffers-and-channels.md
│   └── configuration.md
└── dev/
    ├── architecture.md
    ├── project-structure.md  (this file!)
    ├── components.md
    └── troubleshooting.md
```

## Build Output (`dist/`)

Generated by `npm run build`, do not edit manually.

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].css
│   ├── main.js
│   └── equirect.jpg
└── (demo assets)
```

**File sizes** (approximate):
- `index.html` - 0.37 kB
- `main.js` - ~100 kB (~26 kB gzipped)
- CSS - ~6 kB (~1.6 kB gzipped)

## Configuration Files

### `package.json`

**Dependencies**:
- `prismjs` - Syntax highlighting for split layout

**DevDependencies**:
- `typescript` - TypeScript compiler
- `vite` - Build tool and dev server

**Scripts**:
- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### `tsconfig.json`

TypeScript compiler options:
- `target: "ES2020"` - Modern JavaScript
- `module: "ESNext"` - ES modules
- `strict: true` - All strict checks enabled
- `moduleResolution: "bundler"` - For Vite

**Includes**: `src/**/*`

### `vite.config.ts`

Vite build configuration:
- Base URL: `/`
- Out dir: `dist`
- Asset inline threshold: 4096 bytes

## Import Patterns

### GLSL Files

Loaded dynamically using Vite glob imports:

```typescript
const glslFiles = import.meta.glob<string>('/demos/**/*.glsl', {
  as: 'raw',
  eager: false,
});

const source = await glslFiles[`/demos/${name}/image.glsl`]();
```

### CSS Files

Imported directly in TypeScript:

```typescript
import './app.css';
import './layouts/centered.css';
```

Vite processes these and bundles them.

### Images

Loaded as assets:

```typescript
const img = new Image();
img.src = `/demos/${demoName}/${filename}`;
await img.decode();
```

Vite copies these to `dist/assets/` with hashed filenames.

## File Naming Conventions

### TypeScript
- PascalCase for classes: `ShadertoyEngine.ts`
- camelCase for utilities: `loadDemo.ts`, `glHelpers.ts`
- lowercase for types: `types.ts`

### CSS
- kebab-case: `base.css`, `fullscreen.css`
- Same name as corresponding TS file

### GLSL
- lowercase: `image.glsl`, `bufferA.glsl`
- Must match pass name (case-insensitive)

### Demos
- kebab-case folder names: `simple-gradient/`, `keyboard-test/`

## Code Organization Principles

### 1. Separation of Concerns
Each file has one clear purpose. No "god classes" or "utility dumping grounds".

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
Files export only what's needed externally. Internal helpers are not exported.

### 5. Strong Typing
Every module has a `types.ts` with clear interfaces and types.

## Adding New Files

### New Demo

1. Create folder: `demos/my-shader/`
2. Add files: `image.glsl` (+ optional config/buffers)
3. Run: `npm run dev:demo my-shader`

### New Layout

1. Create `src/layouts/MyLayout.ts`
2. Create `src/layouts/my-layout.css`
3. Import CSS in class: `import './my-layout.css'`
4. Implement `BaseLayout` interface
5. Add to factory in `layouts/index.ts`
6. Add to `LayoutMode` type in `types.ts`

### New Utility Module

1. Create `src/engine/myUtility.ts` (or appropriate layer)
2. Export functions/types
3. Import in file that needs it
4. Keep it focused - single responsibility

### New Shader Preprocessing

1. Add function to `src/project/preprocess.ts`
2. Call from `preprocessGLSL()`
3. Add tests if modifying GLSL structure

## Development Workflow

### Typical Session

1. `npm run dev` - Start dev server
2. Edit `src/main.ts` to load your demo
3. Edit shader files - browser auto-reloads
4. Edit TypeScript - browser auto-reloads
5. Press S to save screenshots

### Debugging

**Shader compilation errors**:
- Displayed in overlay on screen
- Check browser console for details
- Line numbers match original source

**Runtime errors**:
- Browser console shows stack traces
- TypeScript source maps work
- Use browser DevTools

**Performance**:
- Press S to screenshot with timestamp
- Check FPS counter
- Use browser Performance tab

## Summary

The project structure emphasizes:
- **Clear organization** - Related files together
- **Modularity** - Easy to find and modify code
- **Type safety** - TypeScript throughout
- **Build efficiency** - Vite handles bundling
- **Developer experience** - Fast hot reload, good error messages

Understanding this structure will help you navigate the codebase and make modifications confidently.
