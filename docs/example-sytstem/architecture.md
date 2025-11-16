# Architecture

Technical documentation of Shader Sandbox's system design and internal architecture.

## Table of Contents

1. [System Overview](#system-overview)
2. [Layer Architecture](#layer-architecture)
3. [Data Flow](#data-flow)
4. [Component Responsibilities](#component-responsibilities)
5. [Event System](#event-system)
6. [Rendering Pipeline](#rendering-pipeline)
7. [Type Safety](#type-safety)
8. [Performance Considerations](#performance-considerations)

## System Overview

Shader Sandbox is built as a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────┐
│                   UI Layer                       │
│  Panels, Layouts, DOM manipulation               │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│                  App Layer                       │
│  Time, Parameters, Events, Coordination          │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│                 Engine Layer                     │
│  WebGL2, Framebuffers, Rendering                │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│                Project Layer                     │
│  Types, Compiler, Validation                    │
└─────────────────────────────────────────────────┘
```

### Design Principles

1. **Separation of Concerns** - Each layer has a single responsibility
2. **Type Safety** - TypeScript strict mode throughout
3. **Immutable Data** - ProjectDefinition is read-only
4. **Event-Driven** - Loose coupling via event system
5. **Tree-Shakable** - Optional features don't bloat bundles

## Layer Architecture

### Project Layer

**Location:** `src/project/`

**Responsibility:** Pure data structures and transformations

```typescript
// Pure types (no implementation)
types.ts

// Compiler (ProjectDefinition → GLSL)
compiler.ts
```

**Key Characteristics:**
- No side effects
- No DOM manipulation
- No WebGL code
- Pure functions only

**Exports:**
- `ProjectDefinition` interface
- `compileProject()` function
- `recompilePass()` function

### Engine Layer

**Location:** `src/engine/`

**Responsibility:** WebGL2 rendering

```typescript
// Core WebGL operations
WebGLCore.ts

// Framebuffer management
FramebufferManager.ts

// High-level rendering
Engine.ts
```

**Key Characteristics:**
- WebGL2 only (no fallback)
- No time management (App's job)
- No parameter management (App's job)
- No event emission (reports status to App)

**Exports:**
- `Engine` class

### App Layer

**Location:** `src/app/`

**Responsibility:** Browser runtime and coordination

```typescript
// Main App class
App.ts

// Type definitions
types.ts
```

**Key Characteristics:**
- Owns time (realtime vs fixed)
- Owns parameters (canonical source of truth)
- Owns events (pub/sub system)
- Coordinates Engine
- Handles browser APIs (ResizeObserver, RAF, mouse)

**Exports:**
- `App` class
- Event types
- `LayoutBuilder` type

### UI Layer

**Location:** `src/panels/`, `src/layouts/`

**Responsibility:** User interface and interaction

```typescript
// Panel implementations
panels/
  PreviewPanel/
  ParamsPanel/
  CodePanel/
  PerformancePanel/
  BufferViewerPanel/
  ProjectManagerPanel/
  ProjectEditorPanel/

// Pre-built layouts
layouts/
  standard.ts
  code-focused.ts
  inspector.ts
  performance.ts
```

**Key Characteristics:**
- Implements `Panel` interface
- Creates DOM structure
- Subscribes to App events
- Cleans up on detach
- Self-contained CSS

**Exports:**
- Panel classes
- Layout builder functions

## Data Flow

### Initialization Flow

```
1. User creates ProjectDefinition
2. compileProject(project) generates shader code
3. App constructed with compiled project
4. App creates Engine with WebGL2 context
5. Engine compiles shaders and creates framebuffers
6. Layout builder creates and attaches panels
7. Panels subscribe to App events
8. App starts animation loop
```

### Frame Rendering Flow

```
1. requestAnimationFrame callback fires
2. App updates time (realtime or fixed)
3. App emits 'frame' event
4. App calls engine.render() with current state
5. Engine binds uniforms (time, params, mouse, etc.)
6. Engine executes passes in order:
   a. Bind framebuffer (buffer or screen)
   b. Bind program
   c. Bind uniforms (time, params, buffers)
   d. Draw full-screen quad
   e. Swap ping-pong buffers if needed
7. Frame complete
8. Panels update based on 'frame' event
```

### Parameter Update Flow

```
1. User interacts with ParamsPanel control
2. ParamsPanel calls app.updateParam(name, value)
3. App updates paramStore (canonical state)
4. App emits 'paramChange' event
5. Engine uses updated value on next render
6. Other panels update if listening to 'paramChange'
```

### Project Switch Flow

```
1. User selects new project
2. compileProject(newProject) generates shaders
3. App.resetProject(newProject) called
4. App pauses animation loop
5. Old engine destroyed
6. New engine created with new project
7. App emits 'projectChanged' event
8. Panels refresh UI based on new project
9. Animation loop resumes
```

## Component Responsibilities

### App

**Owns:**
- Simulation time
- Parameter values (ParamStore)
- Mouse state
- Canvas and container
- Animation loop (RAF)

**Does:**
- Time management (realtime/fixed modes)
- Parameter updates
- Event emission
- Resize handling
- Engine coordination

**Does NOT:**
- Touch WebGL directly
- Create DOM UI (layouts do that)
- Know about panels (they know about App)

### Engine

**Owns:**
- WebGL2 context
- Shader programs
- Framebuffers
- Texture units

**Does:**
- Compile GLSL shaders
- Create and manage framebuffers
- Bind uniforms
- Execute render passes
- Read buffer pixels

**Does NOT:**
- Manage time (App provides it)
- Store parameters (App provides them)
- Emit events (App does that)
- Handle browser APIs

### Panels

**Own:**
- Their DOM element
- UI state (which buffer selected, etc.)

**Do:**
- Create UI structure
- Subscribe to App events
- Update UI based on events
- Clean up on detach

**Do NOT:**
- Directly access Engine (go through App)
- Manage global state
- Know about other panels

### Layouts

**Do:**
- Configure container grid
- Create panel instances
- Position panels in grid
- Attach panels to App

**Do NOT:**
- Store state
- Subscribe to events (panels do that)
- Modify project

## Event System

### Architecture

Type-safe publish-subscribe system:

```typescript
class App {
  private eventHandlers: Map<string, Set<AppEventHandler<any>>> = new Map()

  on<T>(event: string, handler: AppEventHandler<T>): UnsubscribeFn {
    // Add handler to set
    // Return unsubscribe function
  }

  off<T>(event: string, handler: AppEventHandler<T>): void {
    // Remove handler from set
  }

  private emit<T>(event: string, data: T): void {
    // Call all handlers with data
  }
}
```

### Event Types

All events are strongly typed:

```typescript
type AppEventType =
  | 'frame'           // FrameEvent
  | 'paramChange'     // ParamChangeEvent
  | 'resize'          // ResizeEvent
  | 'shaderError'     // ShaderErrorEvent
  | 'runtimeError'    // RuntimeErrorEvent
  | 'projectChanged'  // No payload
```

### Event Emission Points

**frame** - Every RAF callback
```typescript
private loop(currentWallTime: number): void {
  // Update time...
  this.emit('frame', {
    frame: this.engine.frame,
    time: this.simulationTime,
    deltaTime
  })
  // Render...
}
```

**paramChange** - When parameter updated
```typescript
updateParam(name: string, value: ParamValue): void {
  this.paramStore.set(name, value)
  this.emit('paramChange', { name, value })
}
```

**resize** - When canvas size changes
```typescript
private handleResize(entry: ResizeObserverEntry): void {
  // Resize canvas...
  this.emit('resize', { width, height })
}
```

**shaderError** - On compilation failure
```typescript
private handleShaderError(passName: string, message: string): void {
  this.emit('shaderError', { passName, message })
}
```

**projectChanged** - When project switched
```typescript
resetProject(newProject: ProjectDefinition): void {
  // Cleanup and reinit...
  this.emit('projectChanged', undefined)
}
```

## Rendering Pipeline

### Pass Execution Order

Passes execute in array order:

```typescript
passes: [
  { name: 'step1', output: 'buffer1' },  // Executes first
  { name: 'step2', output: 'buffer2' },  // Then this
  { name: 'final', output: 'screen' }    // Finally this
]
```

### Framebuffer Management

Engine maintains framebuffers for each buffer:

```typescript
// Simple buffer
framebuffers.set('myBuffer', {
  main: { fbo, texture, width, height },
  alt: null,
  current: 'main'
})

// Ping-pong buffer
framebuffers.set('feedback', {
  main: { fbo, texture, width, height },
  alt: { fbo, texture, width, height },
  current: 'main'  // Alternates each frame
})
```

### Ping-Pong Swap Logic

```typescript
// Before pass renders:
const readTexture = current === 'main' ? main.texture : alt.texture
bindTexture(program, 'feedback', readTexture)

// Pass writes to opposite buffer
const writeFBO = current === 'main' ? alt.fbo : main.fbo
gl.bindFramebuffer(gl.FRAMEBUFFER, writeFBO)

// After pass completes:
framebuffer.current = current === 'main' ? 'alt' : 'main'  // Swap!
```

### Uniform Binding

Uniforms bound in this order:

1. **Built-in uniforms** (uResolution, uTime, etc.)
2. **Parameter uniforms** (from ParamStore)
3. **Buffer samplers + resolutions** (textures + vec3)
4. **External texture samplers** (if any)

```typescript
private bindAllUniforms(program: WebGLProgram): void {
  // Built-ins
  this.core.bindUniform(program, 'uResolution', [w, h, aspect])
  this.core.bindUniform(program, 'uTime', time)
  // ...

  // Parameters
  for (const [name, value] of paramStore.entries()) {
    this.core.bindUniform(program, name, value)
  }

  // Buffers with resolutions
  let unit = 0
  for (const [name, fb] of this.framebuffers.entries()) {
    const texture = fb.current === 'main' ? fb.main.texture : fb.alt.texture
    this.core.bindTexture(program, name, texture, unit)

    const resName = `u${capitalize(name)}Resolution`
    this.core.bindUniform(program, resName, [fb.width, fb.height, aspect])

    unit++
  }
}
```

## Type Safety

### Strict TypeScript

All code uses TypeScript strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### Type Hierarchies

**Project Types** - Pure data structures
```typescript
ProjectDefinition
  ├── meta: ProjectMeta
  ├── params?: Record<string, ParamConfig>
  ├── buffers: Record<string, BufferConfig>
  ├── passes: PassDefinition[]
  └── ...
```

**App Types** - Runtime types
```typescript
AppOptions
TimeMode ('realtime' | 'fixed')
ParamStore (Map<string, ParamValue>)
AppEventHandler<T>
```

**Panel Types** - UI types
```typescript
Panel interface
  ├── element: HTMLElement
  ├── attach(app: App): void
  └── detach(): void

LayoutBuilder = (app: App, container: HTMLElement) => void
```

### Type Guards

No runtime type checking needed - TypeScript enforces at compile time:

```typescript
// Compile error if wrong type
app.updateParam('speed', 'fast')  // Error: string not assignable to ParamValue

// Compile error if missing property
const panel: Panel = {
  element: div
  // Error: missing attach() and detach()
}
```

## Performance Considerations

### Bundle Size

Tree-shaking eliminates unused code:

```typescript
// CodePanel not imported = not bundled
import { PreviewPanel } from '@/panels/PreviewPanel/PreviewPanel'
import { ParamsPanel } from '@/panels/ParamsPanel/ParamsPanel'
// ~24KB bundle

// CodePanel imported = CodeMirror included
import { CodePanel } from '@/panels/CodePanel/CodePanel'
// ~558KB bundle (CodeMirror is large)
```

### GPU Readback Cost

`engine.readBuffer()` is expensive:

```typescript
// Bad: 180 readbacks/sec = freezing
for (let i = 0; i < 3; i++) {
  const panel = new BufferViewerPanel()
  panel.autoUpdate = true  // Reads every frame!
}

// Good: 60 readbacks/sec = smooth
const panel = new BufferViewerPanel()
panel.autoUpdate = true  // Only one panel
```

### Frame Budget

Target 60 FPS = 16.67ms per frame:

```
Time budget per frame:
- JavaScript (App + Panels): ~2ms
- WebGL (Engine rendering): ~10ms
- Browser (layout, paint): ~4ms
- Total: ~16ms
```

### Optimization Strategies

1. **Minimize uniform updates** - Only update changed values
2. **Batch GL calls** - Group state changes
3. **Avoid sync readbacks** - Use BufferViewerPanel sparingly
4. **Use appropriate buffer formats** - rgba8 faster than rgba32f
5. **Fixed-size buffers** - Avoid resizing on every canvas resize

### Memory Management

**Framebuffer lifecycle:**
```typescript
// Creation
const fb = createFramebuffer(width, height, format)

// Usage
bindFramebuffer(fb)
render()

// Cleanup
gl.deleteTexture(texture)
gl.deleteFramebuffer(fbo)
```

**Panel lifecycle:**
```typescript
// Creation
const panel = new PreviewPanel()

// Attach (subscribes)
panel.attach(app)

// Detach (unsubscribes, prevents memory leak)
panel.detach()
```

## File Structure

```
shader-demos/
├── src/
│   ├── project/              # Project layer (pure)
│   │   ├── types.ts         # Data structures
│   │   └── compiler.ts      # GLSL generation
│   │
│   ├── engine/              # Engine layer (WebGL)
│   │   ├── WebGLCore.ts    # Low-level GL ops
│   │   ├── FramebufferManager.ts
│   │   └── Engine.ts       # High-level rendering
│   │
│   ├── app/                 # App layer (coordination)
│   │   ├── types.ts        # Runtime types
│   │   └── App.ts          # Main App class
│   │
│   ├── panels/              # UI layer (panels)
│   │   ├── PreviewPanel/
│   │   ├── ParamsPanel/
│   │   ├── CodePanel/
│   │   ├── PerformancePanel/
│   │   ├── BufferViewerPanel/
│   │   ├── ProjectManagerPanel/
│   │   └── ProjectEditorPanel/
│   │
│   └── layouts/             # UI layer (layouts)
│       ├── standard.ts
│       ├── code-focused.ts
│       ├── inspector.ts
│       └── performance.ts
│
├── demos/                   # Example projects
│   ├── hello-world/
│   ├── reaction-diffusion/
│   └── buffers-test/
│
└── docs/                    # Documentation
    ├── GETTING_STARTED.md
    ├── PROJECT_GUIDE.md
    ├── PANELS_GUIDE.md
    ├── LAYOUTS_GUIDE.md
    ├── API_REFERENCE.md
    ├── ARCHITECTURE.md      # This file
    └── EXTENDING.md
```

## Design Decisions

### Why Separate Project and Engine Layers?

- **Project** defines what to render (data)
- **Engine** defines how to render (implementation)
- Enables multiple engines (WebGL2, WebGPU future)
- Pure types in project layer

### Why App Owns Time?

- Different time modes (realtime vs fixed)
- Pause/play/reset controls
- Time is part of simulation, not rendering

### Why Event System Instead of Direct Calls?

- Loose coupling between App and Panels
- Easy to add new panels without modifying App
- Panels can unsubscribe cleanly
- Type-safe event payloads

### Why Grid-Based Layouts?

- Flexible positioning
- Responsive behavior
- No complex flex calculations
- Standard CSS feature

### Why No Default Framebuffer Reading?

- WebGL default FB is double-buffered
- Reading gives back buffer (not current frame)
- Unreliable across browsers
- Use intermediate FBO instead

### Why Per-Buffer Resolution Uniforms?

- Buffers can have different sizes
- UV calculations need correct resolution
- Fixed-size buffers independent of canvas
- Automatic generation by compiler

## Next Steps

- **[Extending](./EXTENDING.md)** - Create custom panels and features
- **[API Reference](./API_REFERENCE.md)** - Complete API docs
- **[Project Guide](./PROJECT_GUIDE.md)** - Build shader projects
