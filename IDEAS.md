# Shader Sandbox - Ideas & Roadmap

A collection of planned features and enhancement ideas for the shader-sandbox npm package.

---

## Controls Menu Additions
- [ ] **Playback speed** - 0.5x, 1x, 2x toggle
- [ ] **Frame stepping** - Advance one frame at a time for debugging
- [ ] **Fullscreen toggle** - Enter/exit fullscreen mode
- [ ] **Resolution toggle** - Switch between 1x, 0.5x pixel density

## Uniform Controls UI
- [ ] **Slider controls** - Interactive sliders for float uniforms
- [ ] **Color pickers** - For vec3/vec4 color uniforms
- [ ] **Vector editors** - 2D/3D input for vec2/vec3
- [ ] **Preset system** - Save/load uniform configurations
- [ ] Design considerations:
  - Integration with controls menu vs separate panel
  - Tab in split/tabbed layouts
  - Auto-detection of uniforms from shader code
  - JSON-based uniform definitions in config

## Recording & Export
- [ ] **Video recording** - Capture animation as WebM/MP4
- [ ] **GIF export** - Animated GIF generation
- [ ] **Export standalone HTML** - Package shader as single file
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

### Uniform Controls UI (In Progress)

Considering several approaches:

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

*Last updated: 2026-01-10*
