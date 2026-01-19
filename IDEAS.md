# Shader Sandbox - Ideas & Roadmap

A collection of planned features and enhancement ideas for the shader-sandbox npm package.

---

## Controls Menu Additions
- [ ] **Playback speed** - 0.5x, 1x, 2x toggle
- [ ] **Frame stepping** - Advance one frame at a time for debugging
- [ ] **Fullscreen toggle** - Enter/exit fullscreen mode
- [ ] **Resolution toggle** - Switch between 1x, 0.5x pixel density

## Uniform Controls UI
- [x] **Slider controls** - Interactive sliders for float uniforms
- [x] **Color pickers** - For vec3/vec4 color uniforms
- [x] **Vector editors** - 2D/3D input for vec2/vec3 (XY pad + sliders)
- [x] **JSON-based uniform definitions** - Define uniforms in config.json, auto-injected into shaders
- [ ] **Preset system** - Save/load uniform configurations

## Keyboard Input
- [x] **Config-based key bindings** - Define keys in config.json with semantic names
- [x] **Multiple keys per action** - e.g., `"left": ["A", "ArrowLeft"]`
- [x] **Toggle mode** - e.g., `"debug": { "key": "G", "mode": "toggle" }`
- [x] **Press/release events** - `key_jump_pressed`, `key_jump_released` uniforms
- [x] **Shadertoy compatibility** - Legacy keyboard texture channel still supported

## Recording & Export
- [x] **Video recording** - Capture animation as WebM
- [ ] **GIF export** - Animated GIF generation
- [x] **Export standalone HTML** - Package shader as single file
- [ ] **Share URL** - Encode shader code in URL

## Editor Enhancements
- [ ] **Auto-save** - Persist code to localStorage
- [ ] **Find/replace** - Standard editor feature
- [ ] **Better error navigation** - Click error to jump to line
- [ ] **Undo/redo** - Code history
- [ ] **Code folding** - Collapse sections

## Input Sources
- [ ] **Audio input** - iChannel as audio reactive texture
- [ ] **Webcam input** - Camera feed as texture
- [ ] **Drag-and-drop textures** - Load images at runtime
- [ ] **More cubemap options** - Additional environment maps

## API / Developer Features
- [ ] **Event callbacks** - `onFrame`, `onCompile`, `onError` hooks
- [ ] **Programmatic control** - `app.pause()`, `app.setTime(t)`, etc.
- [ ] **Custom uniform injection** - Pass JS values to shader
- [ ] **Plugin system** - Extensible architecture

## Performance
- [ ] **Resolution scaling UI** - User-adjustable quality
- [ ] **GPU info display** - Show renderer info
- [ ] **Frame time graph** - Performance visualization

---

## Design Notes

### Uniform Controls UI (Implemented)

The uniform controls system uses a collapsible panel integrated with the controls menu. Uniforms defined in config.json are automatically injected into shaders - no manual `uniform` declarations needed.

### Keyboard Input (Implemented)

Config-based keyboard bindings provide a cleaner alternative to Shadertoy's texture-based system while maintaining backward compatibility.

### Layout Options Considered:

**Option A: Integrated with + menu**
- Pros: Consistent with existing UI, minimal footprint
- Cons: Limited space, may get crowded with many uniforms

**Option B: Separate floating panel**
- Pros: Can be positioned anywhere, resizable
- Cons: May obscure shader view

**Option C: Tab in split/tabbed layouts**
- Pros: Dedicated space, fits existing tab paradigm
- Cons: Only available in certain layouts

**Option D: Bottom drawer**
- Pros: Doesn't obscure main view, slides in/out
- Cons: Limited vertical space

**Option E: Collapsible side panel**
- Pros: Good for many controls, clear organization
- Cons: Reduces canvas width

---

*Last updated: 2026-01-19*
