(function(){"use strict";try{if(typeof document<"u"){var o=document.createElement("style");o.appendChild(document.createTextNode(".shader-demo{position:relative;width:100%}.shader-demo canvas{display:block;width:100%;height:100%}.fps-counter{position:absolute;bottom:8px;left:8px;padding:6px 10px;background:#000000bf;color:#fff;font-family:Monaco,Menlo,Courier New,monospace;font-size:12px;font-weight:500;border-radius:4px;pointer-events:none;-webkit-user-select:none;user-select:none;z-index:1000;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);box-shadow:0 2px 8px #0000004d}.playback-controls{position:absolute;bottom:8px;right:8px;display:flex;gap:8px;z-index:1000}.control-button{padding:6px 8px;background:#000000bf;color:#fff;border:none;border-radius:4px;cursor:pointer;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);box-shadow:0 2px 8px #0000004d;transition:all .2s ease;display:flex;align-items:center;justify-content:center;width:32px;height:32px}.control-button:hover{background:#000000d9;transform:scale(1.05)}.control-button:active{transform:scale(.95)}.control-button svg{width:16px;height:16px;fill:currentColor}.shader-error-overlay{position:absolute;top:0;left:0;right:0;bottom:0;background:#000000f2;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:2000;padding:60px;overflow-y:auto}.error-overlay-content{background:#1a1a1a;border-radius:6px;max-width:900px;width:100%;display:flex;flex-direction:column;box-shadow:0 20px 60px #000c,0 0 1px #ffffff1a;border:1px solid #2a2a2a;max-height:calc(100vh - 120px)}.error-header{display:flex;align-items:center;justify-content:space-between;padding:18px 24px;background:linear-gradient(135deg,#c62828,#b71c1c);color:#fff;border-radius:6px 6px 0 0;border-bottom:1px solid rgba(0,0,0,.3);box-shadow:0 2px 8px #0003}.error-title{font-size:15px;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;display:flex;align-items:center;gap:8px;letter-spacing:-.01em}.error-close{background:transparent;border:none;color:#ffffffe6;font-size:24px;line-height:1;cursor:pointer;padding:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:4px;transition:all .2s ease;opacity:.8}.error-close:hover{background:#ffffff26;opacity:1;transform:scale(1.05)}.error-body{padding:24px;overflow-y:auto;flex:1}.error-section{margin-bottom:24px}.error-section:last-child{margin-bottom:0}.error-pass-name{font-size:13px;font-weight:600;color:#ffa726;font-family:Monaco,Menlo,Courier New,monospace;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #2a2a2a;letter-spacing:.02em}.error-content{margin:0;padding:14px 16px;background:#0f0f0f;border-radius:4px;color:#ff6b6b;font-size:13px;font-family:Monaco,Menlo,Courier New,monospace;line-height:1.6;overflow-x:auto;border:1px solid #2a2a2a;white-space:pre-wrap;word-break:break-word}.error-code-context{margin:12px 0 0;padding:14px 16px;background:#0d0d0d;border-radius:4px;color:#b0b0b0;font-size:12px;font-family:Monaco,Menlo,Courier New,monospace;line-height:1.6;overflow-x:auto;border:1px solid #2a2a2a;white-space:pre}.error-code-context .context-line{color:#666;display:block}.error-code-context .error-line-highlight{color:#fff;background:#c6282840;display:block;font-weight:600;border-left:3px solid #c62828;margin-left:-16px;padding-left:13px}.layout-fullscreen{width:100%;height:100%}.layout-fullscreen .canvas-container{position:relative;width:100%;height:100%;background:#000}.layout-centered{width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:60px}.layout-centered .canvas-container{position:relative;width:800px;height:600px;background:#000;border-radius:8px;box-shadow:0 20px 60px #00000040,0 5px 15px #00000026;overflow:hidden}.layout-split{width:100%;height:100%;display:flex;gap:40px;padding:120px 140px}.layout-split .canvas-container{position:relative;flex:1;background:#000;border-radius:8px;box-shadow:0 10px 30px #0003,0 3px 8px #0000001f;overflow:hidden}.layout-split .code-panel{position:relative;flex:1;display:flex;flex-direction:column;background:#fff;border-radius:8px;box-shadow:0 10px 30px #0003,0 3px 8px #0000001f;overflow:hidden}.tab-bar{display:flex;background:#f8f8f8;border-bottom:1px solid #e0e0e0;padding:8px 8px 0;gap:4px}.tab-button{padding:8px 16px;background:transparent;border:none;border-radius:6px 6px 0 0;font-size:13px;font-family:Monaco,Menlo,Courier New,monospace;cursor:pointer;transition:background .2s;color:#666}.tab-button:hover{background:#e8e8e8}.tab-button.active{background:#fff;color:#000;font-weight:500}.copy-button{position:absolute;top:12px;right:12px;padding:6px;background:transparent;border:none;border-radius:4px;color:#666;cursor:pointer;transition:all .2s;z-index:10;display:flex;align-items:center;justify-content:center}.copy-button:hover{background:#0000000d;color:#333}.copy-button:active{transform:scale(.9)}.copy-button.copied{color:#4caf50}.code-viewer{flex:1;overflow:auto;position:relative;background:#fff}.code-viewer pre{margin:0;padding:16px;font-size:13px;line-height:1.5;font-family:Monaco,Menlo,Courier New,monospace;background:#fff;overflow:visible}.code-viewer code{font-family:inherit;font-size:inherit}.token.comment{color:#6a9955}.token.keyword{color:#00f}.token.string{color:#a31515}.token.number{color:#098658}.token.operator{color:#000}.token.function{color:#795e26}.token.class-name{color:#267f99}.token.punctuation{color:#000}@media (max-width: 1800px){.layout-split{padding:100px 120px}}@media (max-width: 1600px){.layout-split{padding:80px 100px}}@media (max-width: 1400px){.layout-split{padding:60px 80px}}@media (max-width: 1200px){.layout-split{padding:50px 60px}}@media (max-width: 1000px){.layout-split{padding:40px 50px}}@media (max-width: 800px){.layout-split{flex-direction:column;padding:30px;gap:30px}}")),document.head.appendChild(o)}}catch(e){console.error("vite-plugin-css-injected-by-js",e)}})();
var oe = Object.defineProperty;
var ie = (n, e, t) => e in n ? oe(n, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : n[e] = t;
var I = (n, e, t) => ie(n, typeof e != "symbol" ? e + "" : e, t);
function Y(n, e, t) {
  const r = n.createShader(e);
  if (!r)
    throw new Error("Failed to create shader object");
  if (n.shaderSource(r, t), n.compileShader(r), !n.getShaderParameter(r, n.COMPILE_STATUS)) {
    const i = n.getShaderInfoLog(r);
    throw n.deleteShader(r), new Error(`Shader compilation failed:
${i}`);
  }
  return r;
}
function ce(n, e, t) {
  const r = Y(n, n.VERTEX_SHADER, e), o = Y(n, n.FRAGMENT_SHADER, t), i = n.createProgram();
  if (!i)
    throw new Error("Failed to create program object");
  if (n.attachShader(i, r), n.attachShader(i, o), n.linkProgram(i), !n.getProgramParameter(i, n.LINK_STATUS)) {
    const c = n.getProgramInfoLog(i);
    throw n.deleteProgram(i), n.deleteShader(r), n.deleteShader(o), new Error(`Program linking failed:
${c}`);
  }
  return n.detachShader(i, r), n.detachShader(i, o), n.deleteShader(r), n.deleteShader(o), i;
}
function le(n) {
  const e = n.createVertexArray();
  if (!e)
    throw new Error("Failed to create VAO");
  n.bindVertexArray(e);
  const t = new Float32Array([
    -1,
    -1,
    // Bottom-left
    3,
    -1,
    // Bottom-right (extends beyond viewport)
    -1,
    3
    // Top-left (extends beyond viewport)
  ]), r = n.createBuffer();
  if (!r)
    throw new Error("Failed to create VBO");
  return n.bindBuffer(n.ARRAY_BUFFER, r), n.bufferData(n.ARRAY_BUFFER, t, n.STATIC_DRAW), n.enableVertexAttribArray(0), n.vertexAttribPointer(
    0,
    // attribute location
    2,
    // size (vec2)
    n.FLOAT,
    // type
    !1,
    // normalized
    0,
    // stride
    0
    // offset
  ), n.bindVertexArray(null), n.bindBuffer(n.ARRAY_BUFFER, null), e;
}
function K(n, e, t) {
  const r = n.createTexture();
  if (!r)
    throw new Error("Failed to create texture");
  return n.bindTexture(n.TEXTURE_2D, r), n.texImage2D(
    n.TEXTURE_2D,
    0,
    // mip level
    n.RGBA32F,
    // internal format (32-bit float per channel)
    e,
    t,
    0,
    // border (must be 0)
    n.RGBA,
    // format
    n.FLOAT,
    // type
    null
    // no data (allocate only)
  ), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_MIN_FILTER, n.NEAREST), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_MAG_FILTER, n.NEAREST), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_WRAP_S, n.CLAMP_TO_EDGE), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_WRAP_T, n.CLAMP_TO_EDGE), n.bindTexture(n.TEXTURE_2D, null), r;
}
function Q(n, e) {
  const t = n.createFramebuffer();
  if (!t)
    throw new Error("Failed to create framebuffer");
  n.bindFramebuffer(n.FRAMEBUFFER, t), n.framebufferTexture2D(
    n.FRAMEBUFFER,
    n.COLOR_ATTACHMENT0,
    n.TEXTURE_2D,
    e,
    0
    // mip level
  );
  const r = n.checkFramebufferStatus(n.FRAMEBUFFER);
  if (r !== n.FRAMEBUFFER_COMPLETE)
    throw n.deleteFramebuffer(t), new Error(`Framebuffer incomplete: ${pe(n, r)}`);
  return n.bindFramebuffer(n.FRAMEBUFFER, null), t;
}
function ue(n) {
  const e = n.createTexture();
  if (!e)
    throw new Error("Failed to create black texture");
  n.bindTexture(n.TEXTURE_2D, e);
  const t = new Float32Array([0, 0, 0, 1]);
  return n.texImage2D(
    n.TEXTURE_2D,
    0,
    n.RGBA32F,
    1,
    1,
    0,
    n.RGBA,
    n.FLOAT,
    t
  ), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_MIN_FILTER, n.NEAREST), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_MAG_FILTER, n.NEAREST), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_WRAP_S, n.CLAMP_TO_EDGE), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_WRAP_T, n.CLAMP_TO_EDGE), n.bindTexture(n.TEXTURE_2D, null), e;
}
function Ae(n) {
  const e = n.createTexture();
  if (!e)
    throw new Error("Failed to create keyboard texture");
  n.bindTexture(n.TEXTURE_2D, e);
  const t = 256, r = 3, o = new Float32Array(t * r * 4);
  return n.texImage2D(
    n.TEXTURE_2D,
    0,
    n.RGBA32F,
    t,
    r,
    0,
    n.RGBA,
    n.FLOAT,
    o
  ), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_MIN_FILTER, n.NEAREST), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_MAG_FILTER, n.NEAREST), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_WRAP_S, n.CLAMP_TO_EDGE), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_WRAP_T, n.CLAMP_TO_EDGE), n.bindTexture(n.TEXTURE_2D, null), e;
}
function ge(n, e, t, r) {
  const p = new Float32Array(3072);
  for (let c = 0; c < 256; c++) {
    const f = t.get(c) || !1, P = r.get(c) || 0, j = (0 * 256 + c) * 4;
    p[j + 0] = f ? 1 : 0, p[j + 1] = f ? 1 : 0, p[j + 2] = f ? 1 : 0, p[j + 3] = 1;
    const h = (2 * 256 + c) * 4;
    p[h + 0] = P, p[h + 1] = P, p[h + 2] = P, p[h + 3] = 1;
  }
  n.bindTexture(n.TEXTURE_2D, e), n.texSubImage2D(
    n.TEXTURE_2D,
    0,
    0,
    0,
    // x, y offset
    256,
    3,
    n.RGBA,
    n.FLOAT,
    p
  ), n.bindTexture(n.TEXTURE_2D, null);
}
function pe(n, e) {
  switch (e) {
    case n.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
      return "FRAMEBUFFER_INCOMPLETE_ATTACHMENT";
    case n.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
      return "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT";
    case n.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
      return "FRAMEBUFFER_INCOMPLETE_DIMENSIONS";
    case n.FRAMEBUFFER_UNSUPPORTED:
      return "FRAMEBUFFER_UNSUPPORTED";
    case n.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE:
      return "FRAMEBUFFER_INCOMPLETE_MULTISAMPLE";
    default:
      return `Unknown status: ${e}`;
  }
}
const de = `#version 300 es
precision highp float;

layout(location = 0) in vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;
class fe {
  constructor(e) {
    I(this, "project");
    I(this, "gl");
    I(this, "_width");
    I(this, "_height");
    I(this, "_frame", 0);
    I(this, "_time", 0);
    I(this, "_lastStepTime", null);
    I(this, "_passes", []);
    I(this, "_textures", []);
    I(this, "_keyboardTexture", null);
    I(this, "_blackTexture", null);
    // Keyboard state tracking (Maps keycodes to state)
    I(this, "_keyStates", /* @__PURE__ */ new Map());
    // true = down, false = up
    I(this, "_toggleStates", /* @__PURE__ */ new Map());
    // 0.0 or 1.0
    // Compilation errors (if any occurred during initialization)
    I(this, "_compilationErrors", []);
    this.gl = e.gl, this.project = e.project, this._width = this.gl.drawingBufferWidth, this._height = this.gl.drawingBufferHeight, this.initExtensions(), this._blackTexture = ue(this.gl);
    const t = Ae(this.gl);
    this._keyboardTexture = {
      texture: t,
      width: 256,
      height: 3
    }, this.initProjectTextures(), this.initRuntimePasses();
  }
  // ===========================================================================
  // Public API
  // ===========================================================================
  get width() {
    return this._width;
  }
  get height() {
    return this._height;
  }
  get stats() {
    const e = this._lastStepTime === null ? 0 : this._time - this._lastStepTime;
    return {
      frame: this._frame,
      time: this._time,
      deltaTime: e,
      width: this._width,
      height: this._height
    };
  }
  /**
   * Get shader compilation errors (if any occurred during initialization).
   * Returns empty array if all shaders compiled successfully.
   */
  getCompilationErrors() {
    return this._compilationErrors;
  }
  /**
   * Check if there were any compilation errors.
   */
  hasErrors() {
    return this._compilationErrors.length > 0;
  }
  /**
   * Run one full frame of all passes.
   *
   * @param timeSeconds - global time in seconds (monotone, from App)
   * @param mouse - iMouse as [x, y, clickX, clickY]
   */
  step(e, t) {
    const r = this.gl, o = this._lastStepTime === null ? 0 : e - this._lastStepTime;
    this._lastStepTime = e, this._time = e;
    const i = [this._width, this._height, 1], p = this._time, c = o, f = this._frame, P = t;
    r.viewport(0, 0, this._width, this._height);
    const j = ["BufferA", "BufferB", "BufferC", "BufferD", "Image"];
    for (const h of j) {
      const S = this._passes.find((x) => x.name === h);
      S && (this.executePass(S, {
        iResolution: i,
        iTime: p,
        iTimeDelta: c,
        iFrame: f,
        iMouse: P
      }), this.swapPassTextures(S));
    }
    this._frame += 1;
  }
  /**
   * Resize all internal render targets to new width/height.
   * Does not reset time or frame count.
   */
  resize(e, t) {
    this._width = e, this._height = t;
    const r = this.gl;
    for (const o of this._passes)
      r.deleteTexture(o.currentTexture), r.deleteTexture(o.previousTexture), r.deleteFramebuffer(o.framebuffer), o.currentTexture = K(r, e, t), o.previousTexture = K(r, e, t), o.framebuffer = Q(r, o.currentTexture);
  }
  /**
   * Reset frame counter and clear all render targets.
   * Used for playback controls to restart shader from frame 0.
   */
  reset() {
    this._frame = 0;
    const e = this.gl;
    for (const t of this._passes)
      e.bindFramebuffer(e.FRAMEBUFFER, t.framebuffer), e.clearColor(0, 0, 0, 0), e.clear(e.COLOR_BUFFER_BIT), e.framebufferTexture2D(
        e.FRAMEBUFFER,
        e.COLOR_ATTACHMENT0,
        e.TEXTURE_2D,
        t.previousTexture,
        0
      ), e.clear(e.COLOR_BUFFER_BIT), e.framebufferTexture2D(
        e.FRAMEBUFFER,
        e.COLOR_ATTACHMENT0,
        e.TEXTURE_2D,
        t.currentTexture,
        0
      );
    e.bindFramebuffer(e.FRAMEBUFFER, null);
  }
  /**
   * Update keyboard key state (called from App on keydown/keyup events).
   *
   * @param keycode ASCII keycode (e.g., 65 for 'A')
   * @param isDown true if key pressed, false if released
   */
  updateKeyState(e, t) {
    const r = this._keyStates.get(e) || !1;
    if (this._keyStates.set(e, t), t && !r) {
      const o = this._toggleStates.get(e) || 0;
      this._toggleStates.set(e, o === 0 ? 1 : 0);
    }
  }
  /**
   * Update keyboard texture with current key states.
   * Should be called once per frame before rendering.
   */
  updateKeyboardTexture() {
    this._keyboardTexture && ge(
      this.gl,
      this._keyboardTexture.texture,
      this._keyStates,
      this._toggleStates
    );
  }
  /**
   * Delete all GL resources.
   */
  dispose() {
    const e = this.gl;
    for (const t of this._passes)
      e.deleteProgram(t.uniforms.program), e.deleteVertexArray(t.vao), e.deleteFramebuffer(t.framebuffer), e.deleteTexture(t.currentTexture), e.deleteTexture(t.previousTexture);
    for (const t of this._textures)
      e.deleteTexture(t.texture);
    this._keyboardTexture && e.deleteTexture(this._keyboardTexture.texture), this._blackTexture && e.deleteTexture(this._blackTexture), this._passes = [], this._textures = [], this._keyboardTexture = null, this._blackTexture = null;
  }
  // ===========================================================================
  // Initialization Helpers
  // ===========================================================================
  initExtensions() {
    const e = this.gl;
    if (!e.getExtension("EXT_color_buffer_float"))
      throw new Error(
        "EXT_color_buffer_float not supported. WebGL2 with float rendering is required."
      );
    e.getExtension("OES_texture_float_linear");
  }
  /**
   * Initialize external textures based on project.textures.
   *
   * NOTE: This function as written assumes that actual image loading
   * is handled elsewhere. For now we just construct an empty array.
   * In a real implementation, you would load images here.
   */
  initProjectTextures() {
    const e = this.gl;
    this._textures = [];
    for (const t of this.project.textures) {
      const r = e.createTexture();
      if (!r)
        throw new Error("Failed to create texture");
      e.bindTexture(e.TEXTURE_2D, r), e.texImage2D(e.TEXTURE_2D, 0, e.RGBA, 1, 1, 0, e.RGBA, e.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
      const o = {
        name: t.name,
        texture: r,
        width: 1,
        height: 1
      };
      this._textures.push(o);
      const i = new Image();
      i.crossOrigin = "anonymous", i.onload = () => {
        e.bindTexture(e.TEXTURE_2D, r), e.texImage2D(e.TEXTURE_2D, 0, e.RGBA, e.RGBA, e.UNSIGNED_BYTE, i);
        const p = t.filter === "nearest" ? e.NEAREST : e.LINEAR;
        e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, p), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MAG_FILTER, p);
        const c = t.wrap === "clamp" ? e.CLAMP_TO_EDGE : e.REPEAT;
        e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, c), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, c), t.filter === "linear" && e.generateMipmap(e.TEXTURE_2D), o.width = i.width, o.height = i.height, console.log(`Loaded texture '${t.name}': ${i.width}x${i.height}`);
      }, i.onerror = () => {
        console.error(`Failed to load texture '${t.name}' from ${t.source}`);
      }, i.src = t.source;
    }
  }
  /**
   * Compile shaders, create VAOs/FBOs/textures, and build RuntimePass array.
   */
  initRuntimePasses() {
    const e = this.gl, t = this.project, r = le(e), o = ["BufferA", "BufferB", "BufferC", "BufferD", "Image"];
    for (const i of o) {
      const p = t.passes[i];
      if (!p) continue;
      const c = this.buildFragmentShader(p.glslSource);
      try {
        const f = ce(e, de, c), P = {
          program: f,
          iResolution: e.getUniformLocation(f, "iResolution"),
          iTime: e.getUniformLocation(f, "iTime"),
          iTimeDelta: e.getUniformLocation(f, "iTimeDelta"),
          iFrame: e.getUniformLocation(f, "iFrame"),
          iMouse: e.getUniformLocation(f, "iMouse"),
          iChannel: [
            e.getUniformLocation(f, "iChannel0"),
            e.getUniformLocation(f, "iChannel1"),
            e.getUniformLocation(f, "iChannel2"),
            e.getUniformLocation(f, "iChannel3")
          ]
        }, j = K(e, this._width, this._height), h = K(e, this._width, this._height), S = Q(e, j), x = {
          name: i,
          projectChannels: p.channels,
          vao: r,
          uniforms: P,
          framebuffer: S,
          currentTexture: j,
          previousTexture: h
        };
        this._passes.push(x);
      } catch (f) {
        const P = f instanceof Error ? f.message : String(f), j = this.getLineMapping(), h = P.match(/ERROR:\s*\d+:(\d+):/);
        let S = !1, x = null;
        if (h && this.project.commonSource) {
          const y = parseInt(h[1], 10), q = j.boilerplateLinesBeforeCommon + 2, k = q + j.commonLineCount - 1;
          y >= q && y <= k && (S = !0, x = y - q + 1);
        }
        this._compilationErrors.push({
          passName: i,
          error: P,
          source: c,
          isFromCommon: S,
          originalLine: x
        }), console.error(`Failed to compile ${i}:`, P);
      }
    }
  }
  /**
   * Calculate line number mappings for error reporting.
   * Returns info about where common.glsl code lives in the compiled shader.
   */
  getLineMapping() {
    return { boilerplateLinesBeforeCommon: 12, commonLineCount: this.project.commonSource ? this.project.commonSource.split(`
`).length : 0 };
  }
  /**
   * Build complete fragment shader source with Shadertoy boilerplate.
   */
  buildFragmentShader(e) {
    const t = [];
    t.push("#version 300 es"), t.push("precision highp float;"), t.push(""), t.push("// Shadertoy compatibility: equirectangular texture sampling"), t.push("const float ST_PI = 3.14159265359;"), t.push("const float ST_TWOPI = 6.28318530718;"), t.push("vec2 _st_dirToEquirect(vec3 dir) {"), t.push("  float phi = atan(dir.z, dir.x);"), t.push("  float theta = asin(dir.y);"), t.push("  return vec2(phi / ST_TWOPI + 0.5, theta / ST_PI + 0.5);"), t.push("}"), t.push(""), this.project.commonSource && (t.push("// Common code"), t.push(this.project.commonSource), t.push("")), t.push("// Shadertoy built-in uniforms"), t.push("uniform vec3  iResolution;"), t.push("uniform float iTime;"), t.push("uniform float iTimeDelta;"), t.push("uniform int   iFrame;"), t.push("uniform vec4  iMouse;"), t.push("uniform sampler2D iChannel0;"), t.push("uniform sampler2D iChannel1;"), t.push("uniform sampler2D iChannel2;"), t.push("uniform sampler2D iChannel3;"), t.push("");
    let r = this.preprocessCubemapTextures(e);
    return t.push("// User shader code"), t.push(r), t.push(""), t.push("// Main wrapper"), t.push("out vec4 fragColor;"), t.push(""), t.push("void main() {"), t.push("  mainImage(fragColor, gl_FragCoord.xy);"), t.push("}"), t.join(`
`);
  }
  /**
   * Preprocess shader to convert cubemap-style texture() calls to equirectangular.
   * Detects: texture(iChannelN, vec3_expr) and converts to texture(iChannelN, _st_dirToEquirect(vec3_expr))
   */
  preprocessCubemapTextures(e) {
    const t = /texture\s*\(\s*(iChannel[0-3])\s*,\s*([^)]+)\)/g;
    return e.replace(t, (r, o, i) => i.includes("fragCoord") || // Using fragCoord directly
    i.includes("/") || // Division (likely uv calculation)
    /\.xy\s*$/.test(i.trim()) || // Ends with .xy swizzle
    /\.st\s*$/.test(i.trim()) || // Ends with .st swizzle
    /^vec2\s*\(/.test(i.trim()) ? r : `texture(${o}, _st_dirToEquirect(${i}))`);
  }
  // ===========================================================================
  // Pass Execution
  // ===========================================================================
  executePass(e, t) {
    const r = this.gl;
    r.bindFramebuffer(r.FRAMEBUFFER, e.framebuffer), r.useProgram(e.uniforms.program), r.bindVertexArray(e.vao), this.bindBuiltinUniforms(e.uniforms, t), this.bindChannelTextures(e), r.drawArrays(r.TRIANGLES, 0, 3), r.bindVertexArray(null), r.useProgram(null), r.bindFramebuffer(r.FRAMEBUFFER, null);
  }
  bindBuiltinUniforms(e, t) {
    const r = this.gl;
    e.iResolution && r.uniform3f(e.iResolution, t.iResolution[0], t.iResolution[1], t.iResolution[2]), e.iTime && r.uniform1f(e.iTime, t.iTime), e.iTimeDelta && r.uniform1f(e.iTimeDelta, t.iTimeDelta), e.iFrame && r.uniform1i(e.iFrame, t.iFrame), e.iMouse && r.uniform4f(e.iMouse, t.iMouse[0], t.iMouse[1], t.iMouse[2], t.iMouse[3]);
  }
  bindChannelTextures(e) {
    const t = this.gl;
    for (let r = 0; r < 4; r++) {
      const o = e.projectChannels[r], i = this.resolveChannelTexture(o, e.name);
      t.activeTexture(t.TEXTURE0 + r), t.bindTexture(t.TEXTURE_2D, i);
      const p = e.uniforms.iChannel[r];
      p && t.uniform1i(p, r);
    }
  }
  /**
   * Resolve a ChannelSource to an actual WebGLTexture to bind.
   */
  resolveChannelTexture(e, t) {
    switch (e.kind) {
      case "none":
        if (!this._blackTexture)
          throw new Error("Black texture not initialized");
        return this._blackTexture;
      case "buffer": {
        const o = this._passes.find((p) => p.name === e.buffer);
        if (!o)
          throw new Error(`Buffer '${e.buffer}' not found`);
        return e.buffer === t ? o.previousTexture : o.currentTexture;
      }
      case "texture2D": {
        const o = this._textures.find((i) => i.name === e.name);
        if (!o)
          throw new Error(`Texture '${e.name}' not found`);
        return o.texture;
      }
      case "keyboard":
        if (!this._keyboardTexture)
          throw new Error("Internal error: keyboard texture not initialized");
        return this._keyboardTexture.texture;
      default:
        const r = e;
        throw new Error(`Unknown channel source: ${JSON.stringify(r)}`);
    }
  }
  /**
   * Swap current and previous textures for a pass (ping-pong).
   * Also reattach framebuffer to new current texture.
   */
  swapPassTextures(e) {
    const t = this.gl, r = e.currentTexture;
    e.currentTexture = e.previousTexture, e.previousTexture = r, t.bindFramebuffer(t.FRAMEBUFFER, e.framebuffer), t.framebufferTexture2D(
      t.FRAMEBUFFER,
      t.COLOR_ATTACHMENT0,
      t.TEXTURE_2D,
      e.currentTexture,
      0
    ), t.bindFramebuffer(t.FRAMEBUFFER, null);
  }
}
class Ie {
  constructor(e) {
    I(this, "container");
    I(this, "canvas");
    I(this, "gl");
    I(this, "engine");
    I(this, "project");
    I(this, "pixelRatio");
    I(this, "animationId", null);
    I(this, "startTime", 0);
    // Mouse state for iMouse uniform
    I(this, "mouse", [0, 0, -1, -1]);
    // FPS tracking
    I(this, "fpsDisplay");
    I(this, "frameCount", 0);
    I(this, "lastFpsUpdate", 0);
    I(this, "currentFps", 0);
    // Playback controls
    I(this, "controlsContainer", null);
    I(this, "playPauseButton", null);
    I(this, "isPaused", !1);
    // Error overlay
    I(this, "errorOverlay", null);
    // Resize observer
    I(this, "resizeObserver");
    // ===========================================================================
    // Animation Loop
    // ===========================================================================
    I(this, "animate", (e) => {
      if (this.animationId = requestAnimationFrame(this.animate), this.isPaused)
        return;
      const t = e / 1e3, r = t - this.startTime;
      this.updateFps(t), this.engine.updateKeyboardTexture(), this.engine.step(r, this.mouse), this.presentToScreen();
    });
    this.container = e.container, this.project = e.project, this.pixelRatio = e.pixelRatio ?? window.devicePixelRatio, this.canvas = document.createElement("canvas"), this.canvas.style.width = "100%", this.canvas.style.height = "100%", this.canvas.style.display = "block", this.container.appendChild(this.canvas), this.fpsDisplay = document.createElement("div"), this.fpsDisplay.className = "fps-counter", this.fpsDisplay.textContent = "0 FPS", this.container.appendChild(this.fpsDisplay), e.project.controls && this.createControls();
    const t = this.canvas.getContext("webgl2", {
      alpha: !1,
      antialias: !1,
      depth: !1,
      stencil: !1,
      preserveDrawingBuffer: !0,
      // Required for screenshots
      powerPreference: "high-performance"
    });
    if (!t)
      throw new Error("WebGL2 not supported");
    this.gl = t, this.updateCanvasSize(), this.engine = new fe({
      gl: this.gl,
      project: e.project
    }), this.engine.hasErrors() && this.showErrorOverlay(this.engine.getCompilationErrors()), this.resizeObserver = new ResizeObserver(() => {
      this.updateCanvasSize(), this.engine.resize(this.canvas.width, this.canvas.height);
    }), this.resizeObserver.observe(this.container), this.setupMouseTracking(), this.setupKeyboardTracking(), this.setupGlobalShortcuts(), e.project.controls && this.setupKeyboardShortcuts();
  }
  // ===========================================================================
  // Public API
  // ===========================================================================
  /**
   * Check if there were any shader compilation errors.
   * Returns true if the engine has errors and should not be started.
   */
  hasErrors() {
    return this.engine.hasErrors();
  }
  /**
   * Start the animation loop.
   */
  start() {
    this.animationId === null && (this.startTime = performance.now() / 1e3, this.animate(this.startTime));
  }
  /**
   * Stop the animation loop.
   */
  stop() {
    this.animationId !== null && (cancelAnimationFrame(this.animationId), this.animationId = null);
  }
  /**
   * Clean up all resources.
   */
  dispose() {
    this.stop(), this.resizeObserver.disconnect(), this.engine.dispose(), this.container.removeChild(this.canvas), this.container.removeChild(this.fpsDisplay);
  }
  /**
   * Update FPS counter.
   * Updates the display roughly once per second.
   */
  updateFps(e) {
    this.frameCount++, e - this.lastFpsUpdate >= 1 && (this.currentFps = this.frameCount / (e - this.lastFpsUpdate), this.fpsDisplay.textContent = `${Math.round(this.currentFps)} FPS`, this.frameCount = 0, this.lastFpsUpdate = e);
  }
  /**
   * Present the Image pass output to the screen.
   *
   * Since Image is the final pass and we execute all passes to their FBOs,
   * we need to blit the Image pass output to the default framebuffer.
   */
  presentToScreen() {
    const e = this.gl, t = this.engine._passes.filter((o) => o.name === "Image");
    if (t.length === 0) {
      console.warn("No Image pass found");
      return;
    }
    const r = t[0];
    e.bindFramebuffer(e.FRAMEBUFFER, null), e.clearColor(0, 0, 0, 1), e.clear(e.COLOR_BUFFER_BIT), e.bindFramebuffer(e.READ_FRAMEBUFFER, r.framebuffer), e.bindFramebuffer(e.DRAW_FRAMEBUFFER, null), e.blitFramebuffer(
      0,
      0,
      this.canvas.width,
      this.canvas.height,
      // src
      0,
      0,
      this.canvas.width,
      this.canvas.height,
      // dst
      e.COLOR_BUFFER_BIT,
      e.NEAREST
    ), e.bindFramebuffer(e.READ_FRAMEBUFFER, null);
  }
  // ===========================================================================
  // Resize Handling
  // ===========================================================================
  updateCanvasSize() {
    const e = this.container.getBoundingClientRect(), t = Math.floor(e.width * this.pixelRatio), r = Math.floor(e.height * this.pixelRatio);
    (this.canvas.width !== t || this.canvas.height !== r) && (this.canvas.width = t, this.canvas.height = r);
  }
  // ===========================================================================
  // Mouse Tracking
  // ===========================================================================
  setupMouseTracking() {
    const e = (r) => {
      const o = this.canvas.getBoundingClientRect(), i = (r.clientX - o.left) * this.pixelRatio, p = (o.height - (r.clientY - o.top)) * this.pixelRatio;
      this.mouse[0] = i, this.mouse[1] = p;
    }, t = (r) => {
      const o = this.canvas.getBoundingClientRect(), i = (r.clientX - o.left) * this.pixelRatio, p = (o.height - (r.clientY - o.top)) * this.pixelRatio;
      this.mouse[2] = i, this.mouse[3] = p;
    };
    this.canvas.addEventListener("mousemove", e), this.canvas.addEventListener("click", t);
  }
  // ===========================================================================
  // Playback Controls
  // ===========================================================================
  /**
   * Create playback control buttons (play/pause and reset).
   */
  createControls() {
    this.controlsContainer = document.createElement("div"), this.controlsContainer.className = "playback-controls", this.playPauseButton = document.createElement("button"), this.playPauseButton.className = "control-button", this.playPauseButton.title = "Play/Pause (Space)", this.playPauseButton.innerHTML = `
      <svg viewBox="0 0 16 16">
        <path d="M5 3h2v10H5V3zm4 0h2v10H9V3z"/>
      </svg>
    `, this.playPauseButton.addEventListener("click", () => this.togglePlayPause());
    const e = document.createElement("button");
    e.className = "control-button", e.title = "Reset (R)", e.innerHTML = `
      <svg viewBox="0 0 16 16">
        <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
      </svg>
    `, e.addEventListener("click", () => this.reset());
    const t = document.createElement("button");
    t.className = "control-button", t.title = "Screenshot (S)", t.innerHTML = `
      <svg viewBox="0 0 16 16">
        <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
        <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z"/>
      </svg>
    `, t.addEventListener("click", () => this.screenshot()), this.controlsContainer.appendChild(this.playPauseButton), this.controlsContainer.appendChild(e), this.controlsContainer.appendChild(t), this.container.appendChild(this.controlsContainer);
  }
  /**
   * Set up keyboard tracking for shader keyboard texture.
   * Tracks all key presses/releases and forwards to engine.
   */
  setupKeyboardTracking() {
    document.addEventListener("keydown", (e) => {
      const t = e.keyCode;
      t >= 0 && t < 256 && this.engine.updateKeyState(t, !0);
    }), document.addEventListener("keyup", (e) => {
      const t = e.keyCode;
      t >= 0 && t < 256 && this.engine.updateKeyState(t, !1);
    });
  }
  /**
   * Set up global keyboard shortcuts (always available).
   */
  setupGlobalShortcuts() {
    document.addEventListener("keydown", (e) => {
      e.code === "KeyS" && !e.repeat && (e.preventDefault(), this.screenshot());
    });
  }
  /**
   * Set up keyboard shortcuts for playback control.
   */
  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      e.code === "Space" && !e.repeat && (e.preventDefault(), this.togglePlayPause()), e.code === "KeyR" && !e.repeat && (e.preventDefault(), this.reset());
    });
  }
  /**
   * Toggle between play and pause states.
   */
  togglePlayPause() {
    this.isPaused = !this.isPaused, this.updatePlayPauseButton();
  }
  /**
   * Reset the shader to frame 0.
   */
  reset() {
    this.startTime = performance.now() / 1e3, this.frameCount = 0, this.lastFpsUpdate = 0, this.engine.reset();
  }
  /**
   * Capture and download a screenshot of the current canvas as PNG.
   * Filename format: shadertoy-{folderName}-{timestamp}.png
   */
  screenshot() {
    const e = this.project.root.split("/").pop() || "shader", t = /* @__PURE__ */ new Date(), r = t.getFullYear().toString() + (t.getMonth() + 1).toString().padStart(2, "0") + t.getDate().toString().padStart(2, "0") + "-" + t.getHours().toString().padStart(2, "0") + t.getMinutes().toString().padStart(2, "0") + t.getSeconds().toString().padStart(2, "0"), o = `shadertoy-${e}-${r}.png`;
    this.canvas.toBlob((i) => {
      if (!i) {
        console.error("Failed to create screenshot blob");
        return;
      }
      const p = URL.createObjectURL(i), c = document.createElement("a");
      c.href = p, c.download = o, c.click(), URL.revokeObjectURL(p), console.log(`Screenshot saved: ${o}`);
    }, "image/png");
  }
  /**
   * Update play/pause button icon based on current state.
   */
  updatePlayPauseButton() {
    this.playPauseButton && (this.isPaused ? this.playPauseButton.innerHTML = `
        <svg viewBox="0 0 16 16">
          <path d="M4 3v10l8-5-8-5z"/>
        </svg>
      ` : this.playPauseButton.innerHTML = `
        <svg viewBox="0 0 16 16">
          <path d="M5 3h2v10H5V3zm4 0h2v10H9V3z"/>
        </svg>
      `);
  }
  // ===========================================================================
  // Error Handling
  // ===========================================================================
  /**
   * Display shader compilation errors in an overlay.
   */
  showErrorOverlay(e) {
    this.errorOverlay || (this.errorOverlay = document.createElement("div"), this.errorOverlay.className = "shader-error-overlay", this.container.appendChild(this.errorOverlay));
    const t = e.filter((P) => P.isFromCommon), r = e.filter((P) => !P.isFromCommon), c = [...t.length > 0 ? [t[0]] : [], ...r].map(({ passName: P, error: j, source: h, isFromCommon: S, originalLine: x }) => {
      const y = j.replace(`Shader compilation failed:
`, "");
      let q = y;
      return S && x !== null && (q = y.replace(/Line \d+:/, `Line ${x}:`), q = q.replace(/ERROR:\s*\d+:(\d+):/, `ERROR: 0:${x}:`)), {
        passName: S ? "common.glsl" : P,
        error: this.parseShaderError(q),
        codeContext: S ? this.extractCodeContextFromCommon(x) : this.extractCodeContext(q, h)
      };
    }).map(({ passName: P, error: j, codeContext: h }) => `
      <div class="error-section">
        <div class="error-pass-name">${P}</div>
        <pre class="error-content">${this.escapeHTML(j)}</pre>
        ${h ? `<pre class="error-code-context">${h}</pre>` : ""}
      </div>
    `).join("");
    this.errorOverlay.innerHTML = `
      <div class="error-overlay-content">
        <div class="error-header">
          <span class="error-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-bottom;">
              <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM3.5 7.5a.75.75 0 0 0 0 1.5h9a.75.75 0 0 0 0-1.5h-9z"/>
            </svg>
            Shader Compilation Failed
          </span>
          <button class="error-close" title="Dismiss">×</button>
        </div>
        <div class="error-body">
          ${c}
        </div>
      </div>
    `;
    const f = this.errorOverlay.querySelector(".error-close");
    f && f.addEventListener("click", () => this.hideErrorOverlay());
  }
  /**
   * Parse and improve WebGL shader error messages.
   */
  parseShaderError(e) {
    return e.split(`
`).map((t) => {
      const r = t.match(/^ERROR:\s*(\d+):(\d+):\s*(.+)$/);
      if (r) {
        const [, , o, i] = r;
        return `Line ${o}: ${i}`;
      }
      return t;
    }).join(`
`);
  }
  /**
   * Extract code context around error line (±3 lines).
   * Returns HTML with the error line highlighted.
   */
  extractCodeContext(e, t) {
    const r = e.match(/ERROR:\s*\d+:(\d+):/);
    if (!r) return null;
    const o = parseInt(r[1], 10), i = t.split(`
`), p = 3, c = Math.max(0, o - p - 1), f = Math.min(i.length, o + p);
    return i.slice(c, f).map((h, S) => {
      const x = c + S + 1, y = x === o, q = String(x).padStart(4, " "), k = this.escapeHTML(h);
      return y ? `<span class="error-line-highlight">${q} │ ${k}</span>` : `<span class="context-line">${q} │ ${k}</span>`;
    }).join("");
  }
  /**
   * Extract code context from common.glsl file.
   * Similar to extractCodeContext but uses the original common source.
   */
  extractCodeContextFromCommon(e) {
    const t = this.engine.project.commonSource;
    if (!t) return null;
    const r = t.split(`
`), o = 3, i = Math.max(0, e - o - 1), p = Math.min(r.length, e + o);
    return r.slice(i, p).map((P, j) => {
      const h = i + j + 1, S = h === e, x = String(h).padStart(4, " "), y = this.escapeHTML(P);
      return S ? `<span class="error-line-highlight">${x} │ ${y}</span>` : `<span class="context-line">${x} │ ${y}</span>`;
    }).join("");
  }
  /**
   * Escape HTML to prevent XSS.
   */
  escapeHTML(e) {
    const t = document.createElement("div");
    return t.textContent = e, t.innerHTML;
  }
  /**
   * Hide the error overlay.
   */
  hideErrorOverlay() {
    this.errorOverlay && (this.errorOverlay.remove(), this.errorOverlay = null);
  }
}
class he {
  constructor(e) {
    I(this, "container");
    I(this, "root");
    I(this, "canvasContainer");
    this.container = e.container, this.root = document.createElement("div"), this.root.className = "layout-fullscreen", this.canvasContainer = document.createElement("div"), this.canvasContainer.className = "canvas-container", this.root.appendChild(this.canvasContainer), this.container.appendChild(this.root);
  }
  getCanvasContainer() {
    return this.canvasContainer;
  }
  dispose() {
    this.container.innerHTML = "";
  }
}
class Ce {
  constructor(e) {
    I(this, "container");
    I(this, "root");
    I(this, "canvasContainer");
    this.container = e.container, this.root = document.createElement("div"), this.root.className = "layout-centered", this.canvasContainer = document.createElement("div"), this.canvasContainer.className = "canvas-container", this.root.appendChild(this.canvasContainer), this.container.appendChild(this.root);
  }
  getCanvasContainer() {
    return this.canvasContainer;
  }
  dispose() {
    this.container.innerHTML = "";
  }
}
var _ = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Te(n) {
  return n && n.__esModule && Object.prototype.hasOwnProperty.call(n, "default") ? n.default : n;
}
var $ = { exports: {} };
(function(n) {
  var e = typeof window < "u" ? window : typeof WorkerGlobalScope < "u" && self instanceof WorkerGlobalScope ? self : {};
  /**
   * Prism: Lightweight, robust, elegant syntax highlighting
   *
   * @license MIT <https://opensource.org/licenses/MIT>
   * @author Lea Verou <https://lea.verou.me>
   * @namespace
   * @public
   */
  var t = function(r) {
    var o = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i, i = 0, p = {}, c = {
      /**
       * By default, Prism will attempt to highlight all code elements (by calling {@link Prism.highlightAll}) on the
       * current page after the page finished loading. This might be a problem if e.g. you wanted to asynchronously load
       * additional languages or plugins yourself.
       *
       * By setting this value to `true`, Prism will not automatically highlight all code elements on the page.
       *
       * You obviously have to change this value before the automatic highlighting started. To do this, you can add an
       * empty Prism object into the global scope before loading the Prism script like this:
       *
       * ```js
       * window.Prism = window.Prism || {};
       * Prism.manual = true;
       * // add a new <script> to load Prism's script
       * ```
       *
       * @default false
       * @type {boolean}
       * @memberof Prism
       * @public
       */
      manual: r.Prism && r.Prism.manual,
      /**
       * By default, if Prism is in a web worker, it assumes that it is in a worker it created itself, so it uses
       * `addEventListener` to communicate with its parent instance. However, if you're using Prism manually in your
       * own worker, you don't want it to do this.
       *
       * By setting this value to `true`, Prism will not add its own listeners to the worker.
       *
       * You obviously have to change this value before Prism executes. To do this, you can add an
       * empty Prism object into the global scope before loading the Prism script like this:
       *
       * ```js
       * window.Prism = window.Prism || {};
       * Prism.disableWorkerMessageHandler = true;
       * // Load Prism's script
       * ```
       *
       * @default false
       * @type {boolean}
       * @memberof Prism
       * @public
       */
      disableWorkerMessageHandler: r.Prism && r.Prism.disableWorkerMessageHandler,
      /**
       * A namespace for utility methods.
       *
       * All function in this namespace that are not explicitly marked as _public_ are for __internal use only__ and may
       * change or disappear at any time.
       *
       * @namespace
       * @memberof Prism
       */
      util: {
        encode: function s(a) {
          return a instanceof f ? new f(a.type, s(a.content), a.alias) : Array.isArray(a) ? a.map(s) : a.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\u00a0/g, " ");
        },
        /**
         * Returns the name of the type of the given value.
         *
         * @param {any} o
         * @returns {string}
         * @example
         * type(null)      === 'Null'
         * type(undefined) === 'Undefined'
         * type(123)       === 'Number'
         * type('foo')     === 'String'
         * type(true)      === 'Boolean'
         * type([1, 2])    === 'Array'
         * type({})        === 'Object'
         * type(String)    === 'Function'
         * type(/abc+/)    === 'RegExp'
         */
        type: function(s) {
          return Object.prototype.toString.call(s).slice(8, -1);
        },
        /**
         * Returns a unique number for the given object. Later calls will still return the same number.
         *
         * @param {Object} obj
         * @returns {number}
         */
        objId: function(s) {
          return s.__id || Object.defineProperty(s, "__id", { value: ++i }), s.__id;
        },
        /**
         * Creates a deep clone of the given object.
         *
         * The main intended use of this function is to clone language definitions.
         *
         * @param {T} o
         * @param {Record<number, any>} [visited]
         * @returns {T}
         * @template T
         */
        clone: function s(a, l) {
          l = l || {};
          var u, A;
          switch (c.util.type(a)) {
            case "Object":
              if (A = c.util.objId(a), l[A])
                return l[A];
              u = /** @type {Record<string, any>} */
              {}, l[A] = u;
              for (var d in a)
                a.hasOwnProperty(d) && (u[d] = s(a[d], l));
              return (
                /** @type {any} */
                u
              );
            case "Array":
              return A = c.util.objId(a), l[A] ? l[A] : (u = [], l[A] = u, /** @type {Array} */
              /** @type {any} */
              a.forEach(function(C, g) {
                u[g] = s(C, l);
              }), /** @type {any} */
              u);
            default:
              return a;
          }
        },
        /**
         * Returns the Prism language of the given element set by a `language-xxxx` or `lang-xxxx` class.
         *
         * If no language is set for the element or the element is `null` or `undefined`, `none` will be returned.
         *
         * @param {Element} element
         * @returns {string}
         */
        getLanguage: function(s) {
          for (; s; ) {
            var a = o.exec(s.className);
            if (a)
              return a[1].toLowerCase();
            s = s.parentElement;
          }
          return "none";
        },
        /**
         * Sets the Prism `language-xxxx` class of the given element.
         *
         * @param {Element} element
         * @param {string} language
         * @returns {void}
         */
        setLanguage: function(s, a) {
          s.className = s.className.replace(RegExp(o, "gi"), ""), s.classList.add("language-" + a);
        },
        /**
         * Returns the script element that is currently executing.
         *
         * This does __not__ work for line script element.
         *
         * @returns {HTMLScriptElement | null}
         */
        currentScript: function() {
          if (typeof document > "u")
            return null;
          if (document.currentScript && document.currentScript.tagName === "SCRIPT")
            return (
              /** @type {any} */
              document.currentScript
            );
          try {
            throw new Error();
          } catch (u) {
            var s = (/at [^(\r\n]*\((.*):[^:]+:[^:]+\)$/i.exec(u.stack) || [])[1];
            if (s) {
              var a = document.getElementsByTagName("script");
              for (var l in a)
                if (a[l].src == s)
                  return a[l];
            }
            return null;
          }
        },
        /**
         * Returns whether a given class is active for `element`.
         *
         * The class can be activated if `element` or one of its ancestors has the given class and it can be deactivated
         * if `element` or one of its ancestors has the negated version of the given class. The _negated version_ of the
         * given class is just the given class with a `no-` prefix.
         *
         * Whether the class is active is determined by the closest ancestor of `element` (where `element` itself is
         * closest ancestor) that has the given class or the negated version of it. If neither `element` nor any of its
         * ancestors have the given class or the negated version of it, then the default activation will be returned.
         *
         * In the paradoxical situation where the closest ancestor contains __both__ the given class and the negated
         * version of it, the class is considered active.
         *
         * @param {Element} element
         * @param {string} className
         * @param {boolean} [defaultActivation=false]
         * @returns {boolean}
         */
        isActive: function(s, a, l) {
          for (var u = "no-" + a; s; ) {
            var A = s.classList;
            if (A.contains(a))
              return !0;
            if (A.contains(u))
              return !1;
            s = s.parentElement;
          }
          return !!l;
        }
      },
      /**
       * This namespace contains all currently loaded languages and the some helper functions to create and modify languages.
       *
       * @namespace
       * @memberof Prism
       * @public
       */
      languages: {
        /**
         * The grammar for plain, unformatted text.
         */
        plain: p,
        plaintext: p,
        text: p,
        txt: p,
        /**
         * Creates a deep copy of the language with the given id and appends the given tokens.
         *
         * If a token in `redef` also appears in the copied language, then the existing token in the copied language
         * will be overwritten at its original position.
         *
         * ## Best practices
         *
         * Since the position of overwriting tokens (token in `redef` that overwrite tokens in the copied language)
         * doesn't matter, they can technically be in any order. However, this can be confusing to others that trying to
         * understand the language definition because, normally, the order of tokens matters in Prism grammars.
         *
         * Therefore, it is encouraged to order overwriting tokens according to the positions of the overwritten tokens.
         * Furthermore, all non-overwriting tokens should be placed after the overwriting ones.
         *
         * @param {string} id The id of the language to extend. This has to be a key in `Prism.languages`.
         * @param {Grammar} redef The new tokens to append.
         * @returns {Grammar} The new language created.
         * @public
         * @example
         * Prism.languages['css-with-colors'] = Prism.languages.extend('css', {
         *     // Prism.languages.css already has a 'comment' token, so this token will overwrite CSS' 'comment' token
         *     // at its original position
         *     'comment': { ... },
         *     // CSS doesn't have a 'color' token, so this token will be appended
         *     'color': /\b(?:red|green|blue)\b/
         * });
         */
        extend: function(s, a) {
          var l = c.util.clone(c.languages[s]);
          for (var u in a)
            l[u] = a[u];
          return l;
        },
        /**
         * Inserts tokens _before_ another token in a language definition or any other grammar.
         *
         * ## Usage
         *
         * This helper method makes it easy to modify existing languages. For example, the CSS language definition
         * not only defines CSS highlighting for CSS documents, but also needs to define highlighting for CSS embedded
         * in HTML through `<style>` elements. To do this, it needs to modify `Prism.languages.markup` and add the
         * appropriate tokens. However, `Prism.languages.markup` is a regular JavaScript object literal, so if you do
         * this:
         *
         * ```js
         * Prism.languages.markup.style = {
         *     // token
         * };
         * ```
         *
         * then the `style` token will be added (and processed) at the end. `insertBefore` allows you to insert tokens
         * before existing tokens. For the CSS example above, you would use it like this:
         *
         * ```js
         * Prism.languages.insertBefore('markup', 'cdata', {
         *     'style': {
         *         // token
         *     }
         * });
         * ```
         *
         * ## Special cases
         *
         * If the grammars of `inside` and `insert` have tokens with the same name, the tokens in `inside`'s grammar
         * will be ignored.
         *
         * This behavior can be used to insert tokens after `before`:
         *
         * ```js
         * Prism.languages.insertBefore('markup', 'comment', {
         *     'comment': Prism.languages.markup.comment,
         *     // tokens after 'comment'
         * });
         * ```
         *
         * ## Limitations
         *
         * The main problem `insertBefore` has to solve is iteration order. Since ES2015, the iteration order for object
         * properties is guaranteed to be the insertion order (except for integer keys) but some browsers behave
         * differently when keys are deleted and re-inserted. So `insertBefore` can't be implemented by temporarily
         * deleting properties which is necessary to insert at arbitrary positions.
         *
         * To solve this problem, `insertBefore` doesn't actually insert the given tokens into the target object.
         * Instead, it will create a new object and replace all references to the target object with the new one. This
         * can be done without temporarily deleting properties, so the iteration order is well-defined.
         *
         * However, only references that can be reached from `Prism.languages` or `insert` will be replaced. I.e. if
         * you hold the target object in a variable, then the value of the variable will not change.
         *
         * ```js
         * var oldMarkup = Prism.languages.markup;
         * var newMarkup = Prism.languages.insertBefore('markup', 'comment', { ... });
         *
         * assert(oldMarkup !== Prism.languages.markup);
         * assert(newMarkup === Prism.languages.markup);
         * ```
         *
         * @param {string} inside The property of `root` (e.g. a language id in `Prism.languages`) that contains the
         * object to be modified.
         * @param {string} before The key to insert before.
         * @param {Grammar} insert An object containing the key-value pairs to be inserted.
         * @param {Object<string, any>} [root] The object containing `inside`, i.e. the object that contains the
         * object to be modified.
         *
         * Defaults to `Prism.languages`.
         * @returns {Grammar} The new grammar object.
         * @public
         */
        insertBefore: function(s, a, l, u) {
          u = u || /** @type {any} */
          c.languages;
          var A = u[s], d = {};
          for (var C in A)
            if (A.hasOwnProperty(C)) {
              if (C == a)
                for (var g in l)
                  l.hasOwnProperty(g) && (d[g] = l[g]);
              l.hasOwnProperty(C) || (d[C] = A[C]);
            }
          var T = u[s];
          return u[s] = d, c.languages.DFS(c.languages, function(R, H) {
            H === T && R != s && (this[R] = d);
          }), d;
        },
        // Traverse a language definition with Depth First Search
        DFS: function s(a, l, u, A) {
          A = A || {};
          var d = c.util.objId;
          for (var C in a)
            if (a.hasOwnProperty(C)) {
              l.call(a, C, a[C], u || C);
              var g = a[C], T = c.util.type(g);
              T === "Object" && !A[d(g)] ? (A[d(g)] = !0, s(g, l, null, A)) : T === "Array" && !A[d(g)] && (A[d(g)] = !0, s(g, l, C, A));
            }
        }
      },
      plugins: {},
      /**
       * This is the most high-level function in Prism’s API.
       * It fetches all the elements that have a `.language-xxxx` class and then calls {@link Prism.highlightElement} on
       * each one of them.
       *
       * This is equivalent to `Prism.highlightAllUnder(document, async, callback)`.
       *
       * @param {boolean} [async=false] Same as in {@link Prism.highlightAllUnder}.
       * @param {HighlightCallback} [callback] Same as in {@link Prism.highlightAllUnder}.
       * @memberof Prism
       * @public
       */
      highlightAll: function(s, a) {
        c.highlightAllUnder(document, s, a);
      },
      /**
       * Fetches all the descendants of `container` that have a `.language-xxxx` class and then calls
       * {@link Prism.highlightElement} on each one of them.
       *
       * The following hooks will be run:
       * 1. `before-highlightall`
       * 2. `before-all-elements-highlight`
       * 3. All hooks of {@link Prism.highlightElement} for each element.
       *
       * @param {ParentNode} container The root element, whose descendants that have a `.language-xxxx` class will be highlighted.
       * @param {boolean} [async=false] Whether each element is to be highlighted asynchronously using Web Workers.
       * @param {HighlightCallback} [callback] An optional callback to be invoked on each element after its highlighting is done.
       * @memberof Prism
       * @public
       */
      highlightAllUnder: function(s, a, l) {
        var u = {
          callback: l,
          container: s,
          selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
        };
        c.hooks.run("before-highlightall", u), u.elements = Array.prototype.slice.apply(u.container.querySelectorAll(u.selector)), c.hooks.run("before-all-elements-highlight", u);
        for (var A = 0, d; d = u.elements[A++]; )
          c.highlightElement(d, a === !0, u.callback);
      },
      /**
       * Highlights the code inside a single element.
       *
       * The following hooks will be run:
       * 1. `before-sanity-check`
       * 2. `before-highlight`
       * 3. All hooks of {@link Prism.highlight}. These hooks will be run by an asynchronous worker if `async` is `true`.
       * 4. `before-insert`
       * 5. `after-highlight`
       * 6. `complete`
       *
       * Some the above hooks will be skipped if the element doesn't contain any text or there is no grammar loaded for
       * the element's language.
       *
       * @param {Element} element The element containing the code.
       * It must have a class of `language-xxxx` to be processed, where `xxxx` is a valid language identifier.
       * @param {boolean} [async=false] Whether the element is to be highlighted asynchronously using Web Workers
       * to improve performance and avoid blocking the UI when highlighting very large chunks of code. This option is
       * [disabled by default](https://prismjs.com/faq.html#why-is-asynchronous-highlighting-disabled-by-default).
       *
       * Note: All language definitions required to highlight the code must be included in the main `prism.js` file for
       * asynchronous highlighting to work. You can build your own bundle on the
       * [Download page](https://prismjs.com/download.html).
       * @param {HighlightCallback} [callback] An optional callback to be invoked after the highlighting is done.
       * Mostly useful when `async` is `true`, since in that case, the highlighting is done asynchronously.
       * @memberof Prism
       * @public
       */
      highlightElement: function(s, a, l) {
        var u = c.util.getLanguage(s), A = c.languages[u];
        c.util.setLanguage(s, u);
        var d = s.parentElement;
        d && d.nodeName.toLowerCase() === "pre" && c.util.setLanguage(d, u);
        var C = s.textContent, g = {
          element: s,
          language: u,
          grammar: A,
          code: C
        };
        function T(H) {
          g.highlightedCode = H, c.hooks.run("before-insert", g), g.element.innerHTML = g.highlightedCode, c.hooks.run("after-highlight", g), c.hooks.run("complete", g), l && l.call(g.element);
        }
        if (c.hooks.run("before-sanity-check", g), d = g.element.parentElement, d && d.nodeName.toLowerCase() === "pre" && !d.hasAttribute("tabindex") && d.setAttribute("tabindex", "0"), !g.code) {
          c.hooks.run("complete", g), l && l.call(g.element);
          return;
        }
        if (c.hooks.run("before-highlight", g), !g.grammar) {
          T(c.util.encode(g.code));
          return;
        }
        if (a && r.Worker) {
          var R = new Worker(c.filename);
          R.onmessage = function(H) {
            T(H.data);
          }, R.postMessage(JSON.stringify({
            language: g.language,
            code: g.code,
            immediateClose: !0
          }));
        } else
          T(c.highlight(g.code, g.grammar, g.language));
      },
      /**
       * Low-level function, only use if you know what you’re doing. It accepts a string of text as input
       * and the language definitions to use, and returns a string with the HTML produced.
       *
       * The following hooks will be run:
       * 1. `before-tokenize`
       * 2. `after-tokenize`
       * 3. `wrap`: On each {@link Token}.
       *
       * @param {string} text A string with the code to be highlighted.
       * @param {Grammar} grammar An object containing the tokens to use.
       *
       * Usually a language definition like `Prism.languages.markup`.
       * @param {string} language The name of the language definition passed to `grammar`.
       * @returns {string} The highlighted HTML.
       * @memberof Prism
       * @public
       * @example
       * Prism.highlight('var foo = true;', Prism.languages.javascript, 'javascript');
       */
      highlight: function(s, a, l) {
        var u = {
          code: s,
          grammar: a,
          language: l
        };
        if (c.hooks.run("before-tokenize", u), !u.grammar)
          throw new Error('The language "' + u.language + '" has no grammar.');
        return u.tokens = c.tokenize(u.code, u.grammar), c.hooks.run("after-tokenize", u), f.stringify(c.util.encode(u.tokens), u.language);
      },
      /**
       * This is the heart of Prism, and the most low-level function you can use. It accepts a string of text as input
       * and the language definitions to use, and returns an array with the tokenized code.
       *
       * When the language definition includes nested tokens, the function is called recursively on each of these tokens.
       *
       * This method could be useful in other contexts as well, as a very crude parser.
       *
       * @param {string} text A string with the code to be highlighted.
       * @param {Grammar} grammar An object containing the tokens to use.
       *
       * Usually a language definition like `Prism.languages.markup`.
       * @returns {TokenStream} An array of strings and tokens, a token stream.
       * @memberof Prism
       * @public
       * @example
       * let code = `var foo = 0;`;
       * let tokens = Prism.tokenize(code, Prism.languages.javascript);
       * tokens.forEach(token => {
       *     if (token instanceof Prism.Token && token.type === 'number') {
       *         console.log(`Found numeric literal: ${token.content}`);
       *     }
       * });
       */
      tokenize: function(s, a) {
        var l = a.rest;
        if (l) {
          for (var u in l)
            a[u] = l[u];
          delete a.rest;
        }
        var A = new h();
        return S(A, A.head, s), j(s, A, a, A.head, 0), y(A);
      },
      /**
       * @namespace
       * @memberof Prism
       * @public
       */
      hooks: {
        all: {},
        /**
         * Adds the given callback to the list of callbacks for the given hook.
         *
         * The callback will be invoked when the hook it is registered for is run.
         * Hooks are usually directly run by a highlight function but you can also run hooks yourself.
         *
         * One callback function can be registered to multiple hooks and the same hook multiple times.
         *
         * @param {string} name The name of the hook.
         * @param {HookCallback} callback The callback function which is given environment variables.
         * @public
         */
        add: function(s, a) {
          var l = c.hooks.all;
          l[s] = l[s] || [], l[s].push(a);
        },
        /**
         * Runs a hook invoking all registered callbacks with the given environment variables.
         *
         * Callbacks will be invoked synchronously and in the order in which they were registered.
         *
         * @param {string} name The name of the hook.
         * @param {Object<string, any>} env The environment variables of the hook passed to all callbacks registered.
         * @public
         */
        run: function(s, a) {
          var l = c.hooks.all[s];
          if (!(!l || !l.length))
            for (var u = 0, A; A = l[u++]; )
              A(a);
        }
      },
      Token: f
    };
    r.Prism = c;
    function f(s, a, l, u) {
      this.type = s, this.content = a, this.alias = l, this.length = (u || "").length | 0;
    }
    f.stringify = function s(a, l) {
      if (typeof a == "string")
        return a;
      if (Array.isArray(a)) {
        var u = "";
        return a.forEach(function(T) {
          u += s(T, l);
        }), u;
      }
      var A = {
        type: a.type,
        content: s(a.content, l),
        tag: "span",
        classes: ["token", a.type],
        attributes: {},
        language: l
      }, d = a.alias;
      d && (Array.isArray(d) ? Array.prototype.push.apply(A.classes, d) : A.classes.push(d)), c.hooks.run("wrap", A);
      var C = "";
      for (var g in A.attributes)
        C += " " + g + '="' + (A.attributes[g] || "").replace(/"/g, "&quot;") + '"';
      return "<" + A.tag + ' class="' + A.classes.join(" ") + '"' + C + ">" + A.content + "</" + A.tag + ">";
    };
    function P(s, a, l, u) {
      s.lastIndex = a;
      var A = s.exec(l);
      if (A && u && A[1]) {
        var d = A[1].length;
        A.index += d, A[0] = A[0].slice(d);
      }
      return A;
    }
    function j(s, a, l, u, A, d) {
      for (var C in l)
        if (!(!l.hasOwnProperty(C) || !l[C])) {
          var g = l[C];
          g = Array.isArray(g) ? g : [g];
          for (var T = 0; T < g.length; ++T) {
            if (d && d.cause == C + "," + T)
              return;
            var R = g[T], H = R.inside, b = !!R.lookbehind, W = !!R.greedy, N = R.alias;
            if (W && !R.pattern.global) {
              var re = R.pattern.toString().match(/[imsuy]*$/)[0];
              R.pattern = RegExp(R.pattern.source, re + "g");
            }
            for (var z = R.pattern || R, V = u.next, U = A; V !== a.tail && !(d && U >= d.reach); U += V.value.length, V = V.next) {
              var J = V.value;
              if (a.length > s.length)
                return;
              if (!(J instanceof f)) {
                var G = 1, O;
                if (W) {
                  if (O = P(z, U, s, b), !O || O.index >= s.length)
                    break;
                  var F = O.index, ae = O.index + O[0].length, w = U;
                  for (w += V.value.length; F >= w; )
                    V = V.next, w += V.value.length;
                  if (w -= V.value.length, U = w, V.value instanceof f)
                    continue;
                  for (var v = V; v !== a.tail && (w < ae || typeof v.value == "string"); v = v.next)
                    G++, w += v.value.length;
                  G--, J = s.slice(U, w), O.index -= U;
                } else if (O = P(z, 0, J, b), !O)
                  continue;
                var F = O.index, E = O[0], M = J.slice(0, F), X = J.slice(F + E.length), B = U + J.length;
                d && B > d.reach && (d.reach = B);
                var D = V.prev;
                M && (D = S(a, D, M), U += M.length), x(a, D, G);
                var se = new f(C, H ? c.tokenize(E, H) : E, N, E);
                if (V = S(a, D, se), X && S(a, V, X), G > 1) {
                  var Z = {
                    cause: C + "," + T,
                    reach: B
                  };
                  j(s, a, l, V.prev, U, Z), d && Z.reach > d.reach && (d.reach = Z.reach);
                }
              }
            }
          }
        }
    }
    function h() {
      var s = { value: null, prev: null, next: null }, a = { value: null, prev: s, next: null };
      s.next = a, this.head = s, this.tail = a, this.length = 0;
    }
    function S(s, a, l) {
      var u = a.next, A = { value: l, prev: a, next: u };
      return a.next = A, u.prev = A, s.length++, A;
    }
    function x(s, a, l) {
      for (var u = a.next, A = 0; A < l && u !== s.tail; A++)
        u = u.next;
      a.next = u, u.prev = a, s.length -= A;
    }
    function y(s) {
      for (var a = [], l = s.head.next; l !== s.tail; )
        a.push(l.value), l = l.next;
      return a;
    }
    if (!r.document)
      return r.addEventListener && (c.disableWorkerMessageHandler || r.addEventListener("message", function(s) {
        var a = JSON.parse(s.data), l = a.language, u = a.code, A = a.immediateClose;
        r.postMessage(c.highlight(u, c.languages[l], l)), A && r.close();
      }, !1)), c;
    var q = c.util.currentScript();
    q && (c.filename = q.src, q.hasAttribute("data-manual") && (c.manual = !0));
    function k() {
      c.manual || c.highlightAll();
    }
    if (!c.manual) {
      var m = document.readyState;
      m === "loading" || m === "interactive" && q && q.defer ? document.addEventListener("DOMContentLoaded", k) : window.requestAnimationFrame ? window.requestAnimationFrame(k) : window.setTimeout(k, 16);
    }
    return c;
  }(e);
  n.exports && (n.exports = t), typeof _ < "u" && (_.Prism = t), t.languages.markup = {
    comment: {
      pattern: /<!--(?:(?!<!--)[\s\S])*?-->/,
      greedy: !0
    },
    prolog: {
      pattern: /<\?[\s\S]+?\?>/,
      greedy: !0
    },
    doctype: {
      // https://www.w3.org/TR/xml/#NT-doctypedecl
      pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
      greedy: !0,
      inside: {
        "internal-subset": {
          pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/,
          lookbehind: !0,
          greedy: !0,
          inside: null
          // see below
        },
        string: {
          pattern: /"[^"]*"|'[^']*'/,
          greedy: !0
        },
        punctuation: /^<!|>$|[[\]]/,
        "doctype-tag": /^DOCTYPE/i,
        name: /[^\s<>'"]+/
      }
    },
    cdata: {
      pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
      greedy: !0
    },
    tag: {
      pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,
      greedy: !0,
      inside: {
        tag: {
          pattern: /^<\/?[^\s>\/]+/,
          inside: {
            punctuation: /^<\/?/,
            namespace: /^[^\s>\/:]+:/
          }
        },
        "special-attr": [],
        "attr-value": {
          pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
          inside: {
            punctuation: [
              {
                pattern: /^=/,
                alias: "attr-equals"
              },
              {
                pattern: /^(\s*)["']|["']$/,
                lookbehind: !0
              }
            ]
          }
        },
        punctuation: /\/?>/,
        "attr-name": {
          pattern: /[^\s>\/]+/,
          inside: {
            namespace: /^[^\s>\/:]+:/
          }
        }
      }
    },
    entity: [
      {
        pattern: /&[\da-z]{1,8};/i,
        alias: "named-entity"
      },
      /&#x?[\da-f]{1,8};/i
    ]
  }, t.languages.markup.tag.inside["attr-value"].inside.entity = t.languages.markup.entity, t.languages.markup.doctype.inside["internal-subset"].inside = t.languages.markup, t.hooks.add("wrap", function(r) {
    r.type === "entity" && (r.attributes.title = r.content.replace(/&amp;/, "&"));
  }), Object.defineProperty(t.languages.markup.tag, "addInlined", {
    /**
     * Adds an inlined language to markup.
     *
     * An example of an inlined language is CSS with `<style>` tags.
     *
     * @param {string} tagName The name of the tag that contains the inlined language. This name will be treated as
     * case insensitive.
     * @param {string} lang The language key.
     * @example
     * addInlined('style', 'css');
     */
    value: function(o, i) {
      var p = {};
      p["language-" + i] = {
        pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
        lookbehind: !0,
        inside: t.languages[i]
      }, p.cdata = /^<!\[CDATA\[|\]\]>$/i;
      var c = {
        "included-cdata": {
          pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
          inside: p
        }
      };
      c["language-" + i] = {
        pattern: /[\s\S]+/,
        inside: t.languages[i]
      };
      var f = {};
      f[o] = {
        pattern: RegExp(/(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g, function() {
          return o;
        }), "i"),
        lookbehind: !0,
        greedy: !0,
        inside: c
      }, t.languages.insertBefore("markup", "cdata", f);
    }
  }), Object.defineProperty(t.languages.markup.tag, "addAttribute", {
    /**
     * Adds an pattern to highlight languages embedded in HTML attributes.
     *
     * An example of an inlined language is CSS with `style` attributes.
     *
     * @param {string} attrName The name of the tag that contains the inlined language. This name will be treated as
     * case insensitive.
     * @param {string} lang The language key.
     * @example
     * addAttribute('style', 'css');
     */
    value: function(r, o) {
      t.languages.markup.tag.inside["special-attr"].push({
        pattern: RegExp(
          /(^|["'\s])/.source + "(?:" + r + ")" + /\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source,
          "i"
        ),
        lookbehind: !0,
        inside: {
          "attr-name": /^[^\s=]+/,
          "attr-value": {
            pattern: /=[\s\S]+/,
            inside: {
              value: {
                pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,
                lookbehind: !0,
                alias: [o, "language-" + o],
                inside: t.languages[o]
              },
              punctuation: [
                {
                  pattern: /^=/,
                  alias: "attr-equals"
                },
                /"|'/
              ]
            }
          }
        }
      });
    }
  }), t.languages.html = t.languages.markup, t.languages.mathml = t.languages.markup, t.languages.svg = t.languages.markup, t.languages.xml = t.languages.extend("markup", {}), t.languages.ssml = t.languages.xml, t.languages.atom = t.languages.xml, t.languages.rss = t.languages.xml, function(r) {
    var o = /(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;
    r.languages.css = {
      comment: /\/\*[\s\S]*?\*\//,
      atrule: {
        pattern: RegExp("@[\\w-](?:" + /[^;{\s"']|\s+(?!\s)/.source + "|" + o.source + ")*?" + /(?:;|(?=\s*\{))/.source),
        inside: {
          rule: /^@[\w-]+/,
          "selector-function-argument": {
            pattern: /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,
            lookbehind: !0,
            alias: "selector"
          },
          keyword: {
            pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/,
            lookbehind: !0
          }
          // See rest below
        }
      },
      url: {
        // https://drafts.csswg.org/css-values-3/#urls
        pattern: RegExp("\\burl\\((?:" + o.source + "|" + /(?:[^\\\r\n()"']|\\[\s\S])*/.source + ")\\)", "i"),
        greedy: !0,
        inside: {
          function: /^url/i,
          punctuation: /^\(|\)$/,
          string: {
            pattern: RegExp("^" + o.source + "$"),
            alias: "url"
          }
        }
      },
      selector: {
        pattern: RegExp(`(^|[{}\\s])[^{}\\s](?:[^{};"'\\s]|\\s+(?![\\s{])|` + o.source + ")*(?=\\s*\\{)"),
        lookbehind: !0
      },
      string: {
        pattern: o,
        greedy: !0
      },
      property: {
        pattern: /(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,
        lookbehind: !0
      },
      important: /!important\b/i,
      function: {
        pattern: /(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i,
        lookbehind: !0
      },
      punctuation: /[(){};:,]/
    }, r.languages.css.atrule.inside.rest = r.languages.css;
    var i = r.languages.markup;
    i && (i.tag.addInlined("style", "css"), i.tag.addAttribute("style", "css"));
  }(t), t.languages.clike = {
    comment: [
      {
        pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
        lookbehind: !0,
        greedy: !0
      },
      {
        pattern: /(^|[^\\:])\/\/.*/,
        lookbehind: !0,
        greedy: !0
      }
    ],
    string: {
      pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
      greedy: !0
    },
    "class-name": {
      pattern: /(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i,
      lookbehind: !0,
      inside: {
        punctuation: /[.\\]/
      }
    },
    keyword: /\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/,
    boolean: /\b(?:false|true)\b/,
    function: /\b\w+(?=\()/,
    number: /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
    operator: /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
    punctuation: /[{}[\];(),.:]/
  }, t.languages.javascript = t.languages.extend("clike", {
    "class-name": [
      t.languages.clike["class-name"],
      {
        pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/,
        lookbehind: !0
      }
    ],
    keyword: [
      {
        pattern: /((?:^|\})\s*)catch\b/,
        lookbehind: !0
      },
      {
        pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
        lookbehind: !0
      }
    ],
    // Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
    function: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
    number: {
      pattern: RegExp(
        /(^|[^\w$])/.source + "(?:" + // constant
        (/NaN|Infinity/.source + "|" + // binary integer
        /0[bB][01]+(?:_[01]+)*n?/.source + "|" + // octal integer
        /0[oO][0-7]+(?:_[0-7]+)*n?/.source + "|" + // hexadecimal integer
        /0[xX][\dA-Fa-f]+(?:_[\dA-Fa-f]+)*n?/.source + "|" + // decimal bigint
        /\d+(?:_\d+)*n/.source + "|" + // decimal number (integer or float) but no bigint
        /(?:\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\.\d+(?:_\d+)*)(?:[Ee][+-]?\d+(?:_\d+)*)?/.source) + ")" + /(?![\w$])/.source
      ),
      lookbehind: !0
    },
    operator: /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/
  }), t.languages.javascript["class-name"][0].pattern = /(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/, t.languages.insertBefore("javascript", "keyword", {
    regex: {
      pattern: RegExp(
        // lookbehind
        // eslint-disable-next-line regexp/no-dupe-characters-character-class
        /((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)/.source + // Regex pattern:
        // There are 2 regex patterns here. The RegExp set notation proposal added support for nested character
        // classes if the `v` flag is present. Unfortunately, nested CCs are both context-free and incompatible
        // with the only syntax, so we have to define 2 different regex patterns.
        /\//.source + "(?:" + /(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}/.source + "|" + // `v` flag syntax. This supports 3 levels of nested character classes.
        /(?:\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.)*\])*\])*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}v[dgimyus]{0,7}/.source + ")" + // lookahead
        /(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/.source
      ),
      lookbehind: !0,
      greedy: !0,
      inside: {
        "regex-source": {
          pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/,
          lookbehind: !0,
          alias: "language-regex",
          inside: t.languages.regex
        },
        "regex-delimiter": /^\/|\/$/,
        "regex-flags": /^[a-z]+$/
      }
    },
    // This must be declared before keyword because we use "function" inside the look-forward
    "function-variable": {
      pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,
      alias: "function"
    },
    parameter: [
      {
        pattern: /(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,
        lookbehind: !0,
        inside: t.languages.javascript
      },
      {
        pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,
        lookbehind: !0,
        inside: t.languages.javascript
      },
      {
        pattern: /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,
        lookbehind: !0,
        inside: t.languages.javascript
      },
      {
        pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,
        lookbehind: !0,
        inside: t.languages.javascript
      }
    ],
    constant: /\b[A-Z](?:[A-Z_]|\dx?)*\b/
  }), t.languages.insertBefore("javascript", "string", {
    hashbang: {
      pattern: /^#!.*/,
      greedy: !0,
      alias: "comment"
    },
    "template-string": {
      pattern: /`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/,
      greedy: !0,
      inside: {
        "template-punctuation": {
          pattern: /^`|`$/,
          alias: "string"
        },
        interpolation: {
          pattern: /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,
          lookbehind: !0,
          inside: {
            "interpolation-punctuation": {
              pattern: /^\$\{|\}$/,
              alias: "punctuation"
            },
            rest: t.languages.javascript
          }
        },
        string: /[\s\S]+/
      }
    },
    "string-property": {
      pattern: /((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m,
      lookbehind: !0,
      greedy: !0,
      alias: "property"
    }
  }), t.languages.insertBefore("javascript", "operator", {
    "literal-property": {
      pattern: /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,
      lookbehind: !0,
      alias: "property"
    }
  }), t.languages.markup && (t.languages.markup.tag.addInlined("script", "javascript"), t.languages.markup.tag.addAttribute(
    /on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/.source,
    "javascript"
  )), t.languages.js = t.languages.javascript, function() {
    if (typeof t > "u" || typeof document > "u")
      return;
    Element.prototype.matches || (Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector);
    var r = "Loading…", o = function(q, k) {
      return "✖ Error " + q + " while fetching file: " + k;
    }, i = "✖ Error: File does not exist or is empty", p = {
      js: "javascript",
      py: "python",
      rb: "ruby",
      ps1: "powershell",
      psm1: "powershell",
      sh: "bash",
      bat: "batch",
      h: "c",
      tex: "latex"
    }, c = "data-src-status", f = "loading", P = "loaded", j = "failed", h = "pre[data-src]:not([" + c + '="' + P + '"]):not([' + c + '="' + f + '"])';
    function S(q, k, m) {
      var s = new XMLHttpRequest();
      s.open("GET", q, !0), s.onreadystatechange = function() {
        s.readyState == 4 && (s.status < 400 && s.responseText ? k(s.responseText) : s.status >= 400 ? m(o(s.status, s.statusText)) : m(i));
      }, s.send(null);
    }
    function x(q) {
      var k = /^\s*(\d+)\s*(?:(,)\s*(?:(\d+)\s*)?)?$/.exec(q || "");
      if (k) {
        var m = Number(k[1]), s = k[2], a = k[3];
        return s ? a ? [m, Number(a)] : [m, void 0] : [m, m];
      }
    }
    t.hooks.add("before-highlightall", function(q) {
      q.selector += ", " + h;
    }), t.hooks.add("before-sanity-check", function(q) {
      var k = (
        /** @type {HTMLPreElement} */
        q.element
      );
      if (k.matches(h)) {
        q.code = "", k.setAttribute(c, f);
        var m = k.appendChild(document.createElement("CODE"));
        m.textContent = r;
        var s = k.getAttribute("data-src"), a = q.language;
        if (a === "none") {
          var l = (/\.(\w+)$/.exec(s) || [, "none"])[1];
          a = p[l] || l;
        }
        t.util.setLanguage(m, a), t.util.setLanguage(k, a);
        var u = t.plugins.autoloader;
        u && u.loadLanguages(a), S(
          s,
          function(A) {
            k.setAttribute(c, P);
            var d = x(k.getAttribute("data-range"));
            if (d) {
              var C = A.split(/\r\n?|\n/g), g = d[0], T = d[1] == null ? C.length : d[1];
              g < 0 && (g += C.length), g = Math.max(0, Math.min(g - 1, C.length)), T < 0 && (T += C.length), T = Math.max(0, Math.min(T, C.length)), A = C.slice(g, T).join(`
`), k.hasAttribute("data-start") || k.setAttribute("data-start", String(g + 1));
            }
            m.textContent = A, t.highlightElement(m);
          },
          function(A) {
            k.setAttribute(c, j), m.textContent = A;
          }
        );
      }
    }), t.plugins.fileHighlight = {
      /**
       * Executes the File Highlight plugin for all matching `pre` elements under the given container.
       *
       * Note: Elements which are already loaded or currently loading will not be touched by this method.
       *
       * @param {ParentNode} [container=document]
       */
      highlight: function(k) {
        for (var m = (k || document).querySelectorAll(h), s = 0, a; a = m[s++]; )
          t.highlightElement(a);
      }
    };
    var y = !1;
    t.fileHighlight = function() {
      y || (console.warn("Prism.fileHighlight is deprecated. Use `Prism.plugins.fileHighlight.highlight` instead."), y = !0), t.plugins.fileHighlight.highlight.apply(this, arguments);
    };
  }();
})($);
var Se = $.exports;
const Pe = /* @__PURE__ */ Te(Se);
Prism.languages.c = Prism.languages.extend("clike", {
  comment: {
    pattern: /\/\/(?:[^\r\n\\]|\\(?:\r\n?|\n|(?![\r\n])))*|\/\*[\s\S]*?(?:\*\/|$)/,
    greedy: !0
  },
  string: {
    // https://en.cppreference.com/w/c/language/string_literal
    pattern: /"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"/,
    greedy: !0
  },
  "class-name": {
    pattern: /(\b(?:enum|struct)\s+(?:__attribute__\s*\(\([\s\S]*?\)\)\s*)?)\w+|\b[a-z]\w*_t\b/,
    lookbehind: !0
  },
  keyword: /\b(?:_Alignas|_Alignof|_Atomic|_Bool|_Complex|_Generic|_Imaginary|_Noreturn|_Static_assert|_Thread_local|__attribute__|asm|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|inline|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|typeof|union|unsigned|void|volatile|while)\b/,
  function: /\b[a-z_]\w*(?=\s*\()/i,
  number: /(?:\b0x(?:[\da-f]+(?:\.[\da-f]*)?|\.[\da-f]+)(?:p[+-]?\d+)?|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?)[ful]{0,4}/i,
  operator: />>=?|<<=?|->|([-+&|:])\1|[?:~]|[-+*/%&|^!=<>]=?/
});
Prism.languages.insertBefore("c", "string", {
  char: {
    // https://en.cppreference.com/w/c/language/character_constant
    pattern: /'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n]){0,32}'/,
    greedy: !0
  }
});
Prism.languages.insertBefore("c", "string", {
  macro: {
    // allow for multiline macro definitions
    // spaces after the # character compile fine with gcc
    pattern: /(^[\t ]*)#\s*[a-z](?:[^\r\n\\/]|\/(?!\*)|\/\*(?:[^*]|\*(?!\/))*\*\/|\\(?:\r\n|[\s\S]))*/im,
    lookbehind: !0,
    greedy: !0,
    alias: "property",
    inside: {
      string: [
        {
          // highlight the path of the include statement as a string
          pattern: /^(#\s*include\s*)<[^>]+>/,
          lookbehind: !0
        },
        Prism.languages.c.string
      ],
      char: Prism.languages.c.char,
      comment: Prism.languages.c.comment,
      "macro-name": [
        {
          pattern: /(^#\s*define\s+)\w+\b(?!\()/i,
          lookbehind: !0
        },
        {
          pattern: /(^#\s*define\s+)\w+\b(?=\()/i,
          lookbehind: !0,
          alias: "function"
        }
      ],
      // highlight macro directives as keywords
      directive: {
        pattern: /^(#\s*)[a-z]+/,
        lookbehind: !0,
        alias: "keyword"
      },
      "directive-hash": /^#/,
      punctuation: /##|\\(?=[\r\n])/,
      expression: {
        pattern: /\S[\s\S]*/,
        inside: Prism.languages.c
      }
    }
  }
});
Prism.languages.insertBefore("c", "function", {
  // highlight predefined macros as constants
  constant: /\b(?:EOF|NULL|SEEK_CUR|SEEK_END|SEEK_SET|__DATE__|__FILE__|__LINE__|__TIMESTAMP__|__TIME__|__func__|stderr|stdin|stdout)\b/
});
delete Prism.languages.c.boolean;
(function(n) {
  var e = /\b(?:alignas|alignof|asm|auto|bool|break|case|catch|char|char16_t|char32_t|char8_t|class|co_await|co_return|co_yield|compl|concept|const|const_cast|consteval|constexpr|constinit|continue|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|final|float|for|friend|goto|if|import|inline|int|int16_t|int32_t|int64_t|int8_t|long|module|mutable|namespace|new|noexcept|nullptr|operator|override|private|protected|public|register|reinterpret_cast|requires|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|try|typedef|typeid|typename|uint16_t|uint32_t|uint64_t|uint8_t|union|unsigned|using|virtual|void|volatile|wchar_t|while)\b/, t = /\b(?!<keyword>)\w+(?:\s*\.\s*\w+)*\b/.source.replace(/<keyword>/g, function() {
    return e.source;
  });
  n.languages.cpp = n.languages.extend("c", {
    "class-name": [
      {
        pattern: RegExp(/(\b(?:class|concept|enum|struct|typename)\s+)(?!<keyword>)\w+/.source.replace(/<keyword>/g, function() {
          return e.source;
        })),
        lookbehind: !0
      },
      // This is intended to capture the class name of method implementations like:
      //   void foo::bar() const {}
      // However! The `foo` in the above example could also be a namespace, so we only capture the class name if
      // it starts with an uppercase letter. This approximation should give decent results.
      /\b[A-Z]\w*(?=\s*::\s*\w+\s*\()/,
      // This will capture the class name before destructors like:
      //   Foo::~Foo() {}
      /\b[A-Z_]\w*(?=\s*::\s*~\w+\s*\()/i,
      // This also intends to capture the class name of method implementations but here the class has template
      // parameters, so it can't be a namespace (until C++ adds generic namespaces).
      /\b\w+(?=\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>\s*::\s*\w+\s*\()/
    ],
    keyword: e,
    number: {
      pattern: /(?:\b0b[01']+|\b0x(?:[\da-f']+(?:\.[\da-f']*)?|\.[\da-f']+)(?:p[+-]?[\d']+)?|(?:\b[\d']+(?:\.[\d']*)?|\B\.[\d']+)(?:e[+-]?[\d']+)?)[ful]{0,4}/i,
      greedy: !0
    },
    operator: />>=?|<<=?|->|--|\+\+|&&|\|\||[?:~]|<=>|[-+*/%&|^!=<>]=?|\b(?:and|and_eq|bitand|bitor|not|not_eq|or|or_eq|xor|xor_eq)\b/,
    boolean: /\b(?:false|true)\b/
  }), n.languages.insertBefore("cpp", "string", {
    module: {
      // https://en.cppreference.com/w/cpp/language/modules
      pattern: RegExp(
        /(\b(?:import|module)\s+)/.source + "(?:" + // header-name
        /"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|<[^<>\r\n]*>/.source + "|" + // module name or partition or both
        /<mod-name>(?:\s*:\s*<mod-name>)?|:\s*<mod-name>/.source.replace(/<mod-name>/g, function() {
          return t;
        }) + ")"
      ),
      lookbehind: !0,
      greedy: !0,
      inside: {
        string: /^[<"][\s\S]+/,
        operator: /:/,
        punctuation: /\./
      }
    },
    "raw-string": {
      pattern: /R"([^()\\ ]{0,16})\([\s\S]*?\)\1"/,
      alias: "string",
      greedy: !0
    }
  }), n.languages.insertBefore("cpp", "keyword", {
    "generic-function": {
      pattern: /\b(?!operator\b)[a-z_]\w*\s*<(?:[^<>]|<[^<>]*>)*>(?=\s*\()/i,
      inside: {
        function: /^\w+/,
        generic: {
          pattern: /<[\s\S]+/,
          alias: "class-name",
          inside: n.languages.cpp
        }
      }
    }
  }), n.languages.insertBefore("cpp", "operator", {
    "double-colon": {
      pattern: /::/,
      alias: "punctuation"
    }
  }), n.languages.insertBefore("cpp", "class-name", {
    // the base clause is an optional list of parent classes
    // https://en.cppreference.com/w/cpp/language/class
    "base-clause": {
      pattern: /(\b(?:class|struct)\s+\w+\s*:\s*)[^;{}"'\s]+(?:\s+[^;{}"'\s]+)*(?=\s*[;{])/,
      lookbehind: !0,
      greedy: !0,
      inside: n.languages.extend("cpp", {})
    }
  }), n.languages.insertBefore("inside", "double-colon", {
    // All untokenized words that are not namespaces should be class names
    "class-name": /\b[a-z_]\w*\b(?!\s*::)/i
  }, n.languages.cpp["base-clause"]);
})(Prism);
class je {
  constructor(e) {
    I(this, "container");
    I(this, "project");
    I(this, "root");
    I(this, "canvasContainer");
    I(this, "codePanel");
    this.container = e.container, this.project = e.project, this.root = document.createElement("div"), this.root.className = "layout-split", this.canvasContainer = document.createElement("div"), this.canvasContainer.className = "canvas-container", this.codePanel = document.createElement("div"), this.codePanel.className = "code-panel", this.buildCodePanel(), this.root.appendChild(this.canvasContainer), this.root.appendChild(this.codePanel), this.container.appendChild(this.root);
  }
  getCanvasContainer() {
    return this.canvasContainer;
  }
  dispose() {
    this.container.innerHTML = "";
  }
  /**
   * Build the code panel with tabs for each shader pass.
   * Uses Prism.js with C++ syntax highlighting (lightweight, works well for GLSL).
   */
  buildCodePanel() {
    const e = [];
    this.project.commonSource && e.push({ name: "common.glsl", source: this.project.commonSource });
    const t = [
      "BufferA",
      "BufferB",
      "BufferC",
      "BufferD"
    ];
    for (const h of t) {
      const S = this.project.passes[h];
      S && e.push({
        name: `${h.toLowerCase()}.glsl`,
        source: S.glslSource
      });
    }
    const r = this.project.passes.Image;
    e.push({ name: "image.glsl", source: r.glslSource });
    const o = document.createElement("div");
    o.className = "tab-bar";
    const i = document.createElement("div");
    i.className = "code-viewer";
    const p = document.createElement("button");
    p.className = "copy-button", p.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2z" opacity="0.4"/>
        <path d="M2 5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H2zm0 1h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/>
      </svg>
    `, p.title = "Copy code to clipboard";
    let c = "";
    const f = p.innerHTML, P = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
      </svg>
    `, j = (h) => {
      const S = e[h];
      c = S.source;
      const x = document.createElement("pre"), y = document.createElement("code");
      y.className = "language-cpp", y.textContent = S.source, x.appendChild(y), i.innerHTML = "", i.appendChild(x), Pe.highlightElement(y);
    };
    p.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(c), p.innerHTML = P, p.classList.add("copied"), setTimeout(() => {
          p.innerHTML = f, p.classList.remove("copied");
        }, 1500);
      } catch (h) {
        console.error("Failed to copy:", h);
      }
    }), e.forEach((h, S) => {
      const x = document.createElement("button");
      x.className = "tab-button", x.textContent = h.name, S === 0 && x.classList.add("active"), x.addEventListener("click", () => {
        o.querySelectorAll(".tab-button").forEach((y) => y.classList.remove("active")), x.classList.add("active"), j(S);
      }), o.appendChild(x);
    }), this.codePanel.appendChild(o), this.codePanel.appendChild(p), this.codePanel.appendChild(i), e.length > 0 && j(0);
  }
}
function xe(n, e) {
  switch (n) {
    case "fullscreen":
      return new he(e);
    case "centered":
      return new Ce(e);
    case "split":
      return new je(e);
  }
}
async function qe(n, e, t, r) {
  return `/demos/${n}/shadertoy.config.json` in t ? ye(n, t, e, r) : ke(n, e);
}
async function ke(n, e) {
  const t = `/demos/${n}/image.glsl`;
  if (!(t in e))
    throw new Error(`Demo '${n}' not found. Expected ${t}`);
  const r = await e[t]();
  return {
    root: `/demos/${n}`,
    meta: {
      title: n.split("-").map((o) => o.charAt(0).toUpperCase() + o.slice(1)).join(" "),
      author: null,
      description: null
    },
    layout: "centered",
    controls: !1,
    commonSource: null,
    passes: {
      Image: {
        name: "Image",
        glslSource: r,
        channels: [
          { kind: "none" },
          { kind: "none" },
          { kind: "none" },
          { kind: "none" }
        ]
      }
    },
    textures: []
  };
}
async function ye(n, e, t, r) {
  var m, s, a, l, u, A, d, C;
  const o = `/demos/${n}/shadertoy.config.json`, i = await e[o]();
  let p = null;
  if (i.common) {
    const g = `/demos/${n}/${i.common}`;
    g in t && (p = await t[g]());
  } else {
    const g = `/demos/${n}/common.glsl`;
    g in t && (p = await t[g]());
  }
  const c = /* @__PURE__ */ new Set(), f = ["Image", "BufferA", "BufferB", "BufferC", "BufferD"];
  for (const g of f) {
    const T = i.passes[g];
    if (T)
      for (const R of ["iChannel0", "iChannel1", "iChannel2", "iChannel3"]) {
        const H = (m = T.channels) == null ? void 0 : m[R];
        H && "texture" in H && c.add(H.texture);
      }
  }
  const P = [], j = /* @__PURE__ */ new Map();
  for (const g of c) {
    const T = `/demos/${n}/${g.replace(/^\.\//, "")}`;
    if (!(T in r))
      throw new Error(`Texture not found: ${g} (expected at ${T})`);
    const R = await r[T](), H = g.split("/").pop().replace(/\.[^.]+$/, "");
    P.push({
      name: H,
      source: R,
      filter: "linear",
      wrap: "repeat"
    }), j.set(g, H);
  }
  const h = {};
  for (const g of f) {
    const T = i.passes[g];
    if (!T) continue;
    const R = {
      Image: "image.glsl",
      BufferA: "bufferA.glsl",
      BufferB: "bufferB.glsl",
      BufferC: "bufferC.glsl",
      BufferD: "bufferD.glsl"
    }, H = T.source || R[g], b = `/demos/${n}/${H}`;
    if (!(b in t))
      throw new Error(`Missing shader file: ${b}`);
    const W = await t[b](), N = [
      L((s = T.channels) == null ? void 0 : s.iChannel0, j),
      L((a = T.channels) == null ? void 0 : a.iChannel1, j),
      L((l = T.channels) == null ? void 0 : l.iChannel2, j),
      L((u = T.channels) == null ? void 0 : u.iChannel3, j)
    ];
    h[g] = {
      name: g,
      glslSource: W,
      channels: N
    };
  }
  if (!h.Image)
    throw new Error(`Demo '${n}' must have an Image pass`);
  const S = ((A = i.meta) == null ? void 0 : A.title) || n.split("-").map((g) => g.charAt(0).toUpperCase() + g.slice(1)).join(" "), x = ((d = i.meta) == null ? void 0 : d.author) || null, y = ((C = i.meta) == null ? void 0 : C.description) || null, q = i.layout || "centered", k = i.controls ?? !1;
  return {
    root: `/demos/${n}`,
    meta: { title: S, author: x, description: y },
    layout: q,
    controls: k,
    commonSource: p,
    passes: h,
    textures: P
  };
}
function L(n, e) {
  return n ? "buffer" in n ? {
    kind: "buffer",
    buffer: n.buffer,
    previous: !!n.previous
  } : "texture" in n ? {
    kind: "texture2D",
    name: (e == null ? void 0 : e.get(n.texture)) || n.texture
  } : "keyboard" in n ? { kind: "keyboard" } : { kind: "none" } : { kind: "none" };
}
const Re = "demofox-pt1";
async function me() {
  return qe(Re, /* @__PURE__ */ Object.assign({
    "/demos/demofox-pt1/bufferA.glsl": () => Promise.resolve().then(() => Ve).then((r) => r.default),
    "/demos/demofox-pt1/image.glsl": () => Promise.resolve().then(() => Ue).then((r) => r.default)
  }), /* @__PURE__ */ Object.assign({
    "/demos/demofox-pt1/shadertoy.config.json": () => Promise.resolve().then(() => be).then((r) => r.default)
  }), /* @__PURE__ */ Object.assign({
    "/demos/demofox-pt1/textures/equirect.jpg": () => Promise.resolve().then(() => ve).then((r) => r.default)
  }));
}
async function Ge(n) {
  const e = typeof n.container == "string" ? document.querySelector(n.container) : n.container;
  if (!e || !(e instanceof HTMLElement))
    throw new Error(`Container not found: ${n.container}`);
  const t = await me(), r = xe(t.layout, {
    container: e,
    project: t
  }), o = new Ie({
    container: r.getCanvasContainer(),
    project: t,
    pixelRatio: n.pixelRatio ?? window.devicePixelRatio
  });
  return o.hasErrors() || o.start(), {
    app: o,
    destroy: () => {
      var i;
      (i = o.stop) == null || i.call(o);
    }
  };
}
const He = `// The minimunm distance a ray must travel before we consider an intersection.
// This is to prevent a ray from intersecting a surface it just bounced off of.
const float c_minimumRayHitTime = 0.01f;

// after a hit, it moves the ray this far along the normal away from a surface.
// Helps prevent incorrect intersections when rays bounce off of objects.
const float c_rayPosNormalNudge = 0.01f;

// the farthest we look for ray hits
const float c_superFar = 10000.0f;

// camera FOV
const float c_FOVDegrees = 90.0f;

// number of ray bounces allowed
const int c_numBounces = 8;

// how many renders per frame - to get around the vsync limitation.
const int c_numRendersPerFrame = 1;

const float c_pi = 3.14159265359f;
const float c_twopi = 2.0f * c_pi;

uint wang_hash(inout uint seed)
{
    seed = uint(seed ^ uint(61)) ^ uint(seed >> uint(16));
    seed *= uint(9);
    seed = seed ^ (seed >> 4);
    seed *= uint(0x27d4eb2d);
    seed = seed ^ (seed >> 15);
    return seed;
}

float RandomFloat01(inout uint state)
{
    return float(wang_hash(state)) / 4294967296.0;
}

vec3 RandomUnitVector(inout uint state)
{
    float z = RandomFloat01(state) * 2.0f - 1.0f;
    float a = RandomFloat01(state) * c_twopi;
    float r = sqrt(1.0f - z * z);
    float x = r * cos(a);
    float y = r * sin(a);
    return vec3(x, y, z);
}

struct SRayHitInfo
{
    float dist;
    vec3 normal;
    vec3 albedo;
    vec3 emissive;
};

float ScalarTriple(vec3 u, vec3 v, vec3 w)
{
    return dot(cross(u, v), w);
}

bool TestQuadTrace(in vec3 rayPos, in vec3 rayDir, inout SRayHitInfo info, in vec3 a, in vec3 b, in vec3 c, in vec3 d)
{
    // calculate normal and flip vertices order if needed
    vec3 normal = normalize(cross(c-a, c-b));
    if (dot(normal, rayDir) > 0.0f)
    {
        normal *= -1.0f;

        vec3 temp = d;
        d = a;
        a = temp;

        temp = b;
        b = c;
        c = temp;
    }

    vec3 p = rayPos;
    vec3 q = rayPos + rayDir;
    vec3 pq = q - p;
    vec3 pa = a - p;
    vec3 pb = b - p;
    vec3 pc = c - p;

    // determine which triangle to test against by testing against diagonal first
    vec3 m = cross(pc, pq);
    float v = dot(pa, m);
    vec3 intersectPos;
    if (v >= 0.0f)
    {
        // test against triangle a,b,c
        float u = -dot(pb, m);
        if (u < 0.0f) return false;
        float w = ScalarTriple(pq, pb, pa);
        if (w < 0.0f) return false;
        float denom = 1.0f / (u+v+w);
        u*=denom;
        v*=denom;
        w*=denom;
        intersectPos = u*a+v*b+w*c;
    }
    else
    {
        vec3 pd = d - p;
        float u = dot(pd, m);
        if (u < 0.0f) return false;
        float w = ScalarTriple(pq, pa, pd);
        if (w < 0.0f) return false;
        v = -v;
        float denom = 1.0f / (u+v+w);
        u*=denom;
        v*=denom;
        w*=denom;
        intersectPos = u*a+v*d+w*c;
    }

    float dist;
    if (abs(rayDir.x) > 0.1f)
    {
        dist = (intersectPos.x - rayPos.x) / rayDir.x;
    }
    else if (abs(rayDir.y) > 0.1f)
    {
        dist = (intersectPos.y - rayPos.y) / rayDir.y;
    }
    else
    {
        dist = (intersectPos.z - rayPos.z) / rayDir.z;
    }

    if (dist > c_minimumRayHitTime && dist < info.dist)
    {
        info.dist = dist;
        info.normal = normal;
        return true;
    }

    return false;
}

bool TestSphereTrace(in vec3 rayPos, in vec3 rayDir, inout SRayHitInfo info, in vec4 sphere)
{
    //get the vector from the center of this sphere to where the ray begins.
    vec3 m = rayPos - sphere.xyz;

    //get the dot product of the above vector and the ray's vector
    float b = dot(m, rayDir);

    float c = dot(m, m) - sphere.w * sphere.w;

    //exit if r's origin outside s (c > 0) and r pointing away from s (b > 0)
    if(c > 0.0 && b > 0.0)
    return false;

    //calculate discriminant
    float discr = b * b - c;

    //a negative discriminant corresponds to ray missing sphere
    if(discr < 0.0)
    return false;

    //ray now found to intersect sphere, compute smallest t value of intersection
    bool fromInside = false;
    float dist = -b - sqrt(discr);
    if (dist < 0.0f)
    {
        fromInside = true;
        dist = -b + sqrt(discr);
    }

    if (dist > c_minimumRayHitTime && dist < info.dist)
    {
        info.dist = dist;
        info.normal = normalize((rayPos+rayDir*dist) - sphere.xyz) * (fromInside ? -1.0f : 1.0f);
        return true;
    }

    return false;
}

void TestSceneTrace(in vec3 rayPos, in vec3 rayDir, inout SRayHitInfo hitInfo)
{
    // to move the scene around, since we can't move the camera yet
    vec3 sceneTranslation = vec3(0.0f, 0.0f, 10.0f);
    vec4 sceneTranslation4 = vec4(sceneTranslation, 0.0f);

    // back wall
    {
        vec3 A = vec3(-12.6f, -12.6f, 25.0f) + sceneTranslation;
        vec3 B = vec3( 12.6f, -12.6f, 25.0f) + sceneTranslation;
        vec3 C = vec3( 12.6f,  12.6f, 25.0f) + sceneTranslation;
        vec3 D = vec3(-12.6f,  12.6f, 25.0f) + sceneTranslation;
        if (TestQuadTrace(rayPos, rayDir, hitInfo, A, B, C, D))
        {
            hitInfo.albedo = vec3(0.7f, 0.7f, 0.7f);
            hitInfo.emissive = vec3(0.0f, 0.0f, 0.0f);
        }
    }

    // floor
    {
        vec3 A = vec3(-12.6f, -12.45f, 25.0f) + sceneTranslation;
        vec3 B = vec3( 12.6f, -12.45f, 25.0f) + sceneTranslation;
        vec3 C = vec3( 12.6f, -12.45f, 15.0f) + sceneTranslation;
        vec3 D = vec3(-12.6f, -12.45f, 15.0f) + sceneTranslation;
        if (TestQuadTrace(rayPos, rayDir, hitInfo, A, B, C, D))
        {
            hitInfo.albedo = vec3(0.7f, 0.7f, 0.7f);
            hitInfo.emissive = vec3(0.0f, 0.0f, 0.0f);
        }
    }

    // cieling
    {
        vec3 A = vec3(-12.6f, 12.5f, 25.0f) + sceneTranslation;
        vec3 B = vec3( 12.6f, 12.5f, 25.0f) + sceneTranslation;
        vec3 C = vec3( 12.6f, 12.5f, 15.0f) + sceneTranslation;
        vec3 D = vec3(-12.6f, 12.5f, 15.0f) + sceneTranslation;
        if (TestQuadTrace(rayPos, rayDir, hitInfo, A, B, C, D))
        {
            hitInfo.albedo = vec3(0.7f, 0.7f, 0.7f);
            hitInfo.emissive = vec3(0.0f, 0.0f, 0.0f);
        }
    }

    // left wall
    {
        vec3 A = vec3(-12.5f, -12.6f, 25.0f) + sceneTranslation;
        vec3 B = vec3(-12.5f, -12.6f, 15.0f) + sceneTranslation;
        vec3 C = vec3(-12.5f,  12.6f, 15.0f) + sceneTranslation;
        vec3 D = vec3(-12.5f,  12.6f, 25.0f) + sceneTranslation;
        if (TestQuadTrace(rayPos, rayDir, hitInfo, A, B, C, D))
        {
            hitInfo.albedo = vec3(0.7f, 0.1f, 0.1f);
            hitInfo.emissive = vec3(0.0f, 0.0f, 0.0f);
        }
    }

    // right wall
    {
        vec3 A = vec3( 12.5f, -12.6f, 25.0f) + sceneTranslation;
        vec3 B = vec3( 12.5f, -12.6f, 15.0f) + sceneTranslation;
        vec3 C = vec3( 12.5f,  12.6f, 15.0f) + sceneTranslation;
        vec3 D = vec3( 12.5f,  12.6f, 25.0f) + sceneTranslation;
        if (TestQuadTrace(rayPos, rayDir, hitInfo, A, B, C, D))
        {
            hitInfo.albedo = vec3(0.1f, 0.7f, 0.1f);
            hitInfo.emissive = vec3(0.0f, 0.0f, 0.0f);
        }
    }

    // light
    {
        vec3 A = vec3(-5.0f, 12.4f,  22.5f) + sceneTranslation;
        vec3 B = vec3( 5.0f, 12.4f,  22.5f) + sceneTranslation;
        vec3 C = vec3( 5.0f, 12.4f,  17.5f) + sceneTranslation;
        vec3 D = vec3(-5.0f, 12.4f,  17.5f) + sceneTranslation;
        if (TestQuadTrace(rayPos, rayDir, hitInfo, A, B, C, D))
        {
            hitInfo.albedo = vec3(0.0f, 0.0f, 0.0f);
            hitInfo.emissive = vec3(1.0f, 0.9f, 0.7f) * 20.0f;
        }
    }

    if (TestSphereTrace(rayPos, rayDir, hitInfo, vec4(-9.0f, -9.5f, 20.0f, 3.0f)+sceneTranslation4))
    {
        hitInfo.albedo = vec3(0.9f, 0.9f, 0.75f);
        hitInfo.emissive = vec3(0.0f, 0.0f, 0.0f);
    }

    if (TestSphereTrace(rayPos, rayDir, hitInfo, vec4(0.0f, -9.5f, 20.0f, 3.0f)+sceneTranslation4))
    {
        hitInfo.albedo = vec3(0.9f, 0.75f, 0.9f);
        hitInfo.emissive = vec3(0.0f, 0.0f, 0.0f);
    }

    if (TestSphereTrace(rayPos, rayDir, hitInfo, vec4(9.0f, -9.5f, 20.0f, 3.0f)+sceneTranslation4))
    {
        hitInfo.albedo = vec3(0.75f, 0.9f, 0.9f);
        hitInfo.emissive = vec3(0.0f, 0.0f, 0.0f);
    }
}

vec3 GetColorForRay(in vec3 startRayPos, in vec3 startRayDir, inout uint rngState)
{
    // initialize
    vec3 ret = vec3(0.0f, 0.0f, 0.0f);
    vec3 throughput = vec3(1.0f, 1.0f, 1.0f);
    vec3 rayPos = startRayPos;
    vec3 rayDir = startRayDir;

    for (int bounceIndex = 0; bounceIndex <= c_numBounces; ++bounceIndex)
    {
        // shoot a ray out into the world
        SRayHitInfo hitInfo;
        hitInfo.dist = c_superFar;
        TestSceneTrace(rayPos, rayDir, hitInfo);

        // if the ray missed, we are done
        if (hitInfo.dist == c_superFar)
        {
            ret += texture(iChannel1, rayDir).rgb * throughput;
            break;
        }

        // update the ray position
        rayPos = (rayPos + rayDir * hitInfo.dist) + hitInfo.normal * c_rayPosNormalNudge;

        // calculate new ray direction, in a cosine weighted hemisphere oriented at normal
        rayDir = normalize(hitInfo.normal + RandomUnitVector(rngState));

        // add in emissive lighting
        ret += hitInfo.emissive * throughput;

        // update the colorMultiplier
        throughput *= hitInfo.albedo;
    }

    // return pixel color
    return ret;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // initialize a random number state based on frag coord and frame
    uint rngState = uint(uint(fragCoord.x) * uint(1973) + uint(fragCoord.y) * uint(9277) + uint(iFrame) * uint(26699)) | uint(1);

    // The ray starts at the camera position (the origin)
    vec3 rayPosition = vec3(0.0f, 0.0f, 0.0f);

    // calculate the camera distance
    float cameraDistance = 1.0f / tan(c_FOVDegrees * 0.5f * c_pi / 180.0f);

    // calculate coordinates of the ray target on the imaginary pixel plane.
    // -1 to +1 on x,y axis. 1 unit away on the z axis
    vec3 rayTarget = vec3((fragCoord/iResolution.xy) * 2.0f - 1.0f, cameraDistance);

    // correct for aspect ratio
    float aspectRatio = iResolution.x / iResolution.y;
    rayTarget.y /= aspectRatio;

    // calculate a normalized vector for the ray direction.
    // it's pointing from the ray position to the ray target.
    vec3 rayDir = normalize(rayTarget - rayPosition);

    // raytrace for this pixel
    vec3 color = vec3(0.0f, 0.0f, 0.0f);
    for (int index = 0; index < c_numRendersPerFrame; ++index)
    color += GetColorForRay(rayPosition, rayDir, rngState) / float(c_numRendersPerFrame);

    // average the frames together
    vec3 lastFrameColor = texture(iChannel0, fragCoord / iResolution.xy).rgb;
    color = mix(lastFrameColor, color, 1.0f / float(iFrame+1));

    // show the result
    fragColor = vec4(color, 1.0f);
}
`, Ve = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: He
}, Symbol.toStringTag, { value: "Module" })), Oe = `void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec3 color = texture(iChannel0, fragCoord / iResolution.xy).rgb;
    fragColor = vec4(color, 1.0f);
}
`, Ue = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Oe
}, Symbol.toStringTag, { value: "Module" })), ee = {
  title: "Path Tracing I",
  description: "From Demofox's Blog"
}, te = "split", ne = {
  BufferA: {
    channels: {
      iChannel0: {
        buffer: "BufferA"
      },
      iChannel1: {
        texture: "./textures/equirect.jpg"
      }
    }
  },
  Image: {
    channels: {
      iChannel0: {
        buffer: "BufferA"
      }
    }
  }
}, we = {
  meta: ee,
  layout: te,
  passes: ne
}, be = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: we,
  layout: te,
  meta: ee,
  passes: ne
}, Symbol.toStringTag, { value: "Module" })), Je = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEBLAEsAAD/4QBWRXhpZgAATU0AKgAAAAgABAEaAAUAAAABAAAAPgEbAAUAAAABAAAARgEoAAMAAAABAAIAAAITAAMAAAABAAEAAAAAAAAAAAEsAAAAAQAAASwAAAAB/+0ALFBob3Rvc2hvcCAzLjAAOEJJTQQEAAAAAAAPHAFaAAMbJUccAQAAAgAEAP/hDIFodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvADw/eHBhY2tldCBiZWdpbj0n77u/JyBpZD0nVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkJz8+Cjx4OnhtcG1ldGEgeG1sbnM6eD0nYWRvYmU6bnM6bWV0YS8nIHg6eG1wdGs9J0ltYWdlOjpFeGlmVG9vbCAxMS44OCc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczp0aWZmPSdodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyc+CiAgPHRpZmY6UmVzb2x1dGlvblVuaXQ+MjwvdGlmZjpSZXNvbHV0aW9uVW5pdD4KICA8dGlmZjpYUmVzb2x1dGlvbj4zMDAvMTwvdGlmZjpYUmVzb2x1dGlvbj4KICA8dGlmZjpZUmVzb2x1dGlvbj4zMDAvMTwvdGlmZjpZUmVzb2x1dGlvbj4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PScnCiAgeG1sbnM6eG1wTU09J2h0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8nPgogIDx4bXBNTTpEb2N1bWVudElEPmFkb2JlOmRvY2lkOnN0b2NrOmUzZmI0MzYxLTdlMWEtNDgwZC1iYWRlLWM3YTA1ZWM1OGFiNjwveG1wTU06RG9jdW1lbnRJRD4KICA8eG1wTU06SW5zdGFuY2VJRD54bXAuaWlkOmQxOGEzNDIyLWJjNDYtNDcxOC04YjBlLTAyYzhkOWQzMGI4ZTwveG1wTU06SW5zdGFuY2VJRD4KIDwvcmRmOkRlc2NyaXB0aW9uPgo8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo8P3hwYWNrZXQgZW5kPSd3Jz8+/9sAQwAFAwQEBAMFBAQEBQUFBgcMCAcHBwcPCwsJDBEPEhIRDxERExYcFxMUGhURERghGBodHR8fHxMXIiQiHiQcHh8e/9sAQwEFBQUHBgcOCAgOHhQRFB4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4e/8AAEQgBaALQAwERAAIRAQMRAf/EABwAAAEFAQEBAAAAAAAAAAAAAAYCAwQFBwEACP/EAFIQAAIBAwMCAwYCBgYHBQcBCQECAwQFEQASIQYxE0FRBxQiYXGBMpEVI0JSobEzYnKSwdEW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", ve = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Je
}, Symbol.toStringTag, { value: "Module" }));
export {
  Re as DEMO_NAME,
  Ge as embed
};
