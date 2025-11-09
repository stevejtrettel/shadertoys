// ShaderDisplay.js — WebGL2 / GLSL3 Shadertoy-style display with custom uniforms + GUI

import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min';

function createFullscreenContainer(id = 'World') {
    let el = document.getElementById(id);
    if (el) return el;
    el = document.createElement('div');
    el.id = id;
    Object.assign(el.style, {
        position: 'fixed',
        inset: '0',
        width: '100vw',
        height: '100vh',
        zIndex: '0',
        overflow: 'hidden',
    });
    document.body.prepend(el);
    return el;
}

const VERT_GLSL3 = /* glsl */`
precision highp float;
in vec3 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

function wrapShadertoyBodyGLSL3(fragBody, customUniforms = '') {
    return /* glsl */`
precision highp float;

// Shadertoy built-in uniforms
uniform vec3  iResolution;
uniform float iTime;
uniform int   iFrame;
uniform vec4  iMouse;
uniform vec4  iDate;

// Custom uniforms (injected here)
${customUniforms}

out vec4 outColor;

${fragBody}

void main() {
  vec4 color;
  mainImage(color, gl_FragCoord.xy);
  outColor = color;
}
`;
}

export default class ShaderDisplayThree {
    constructor(fragBody, opts = {}) {
        const {
            container,
            containerId = 'World',
            fullscreen = true,
            createUI = true,
            transparent = true,
            maxDPR = 2,
            targetFPS = 60,
            preserveBuffer = true,
        } = opts;

        this.container = container ?? (fullscreen ? createFullscreenContainer(containerId) : document.body);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: transparent,
            preserveDrawingBuffer: !!preserveBuffer,
            premultipliedAlpha: false,
            powerPreference: 'high-performance',
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDPR));
        this.renderer.setClearColor(0x000000, transparent ? 0 : 1);

        const canvas = this.renderer.domElement;
        canvas.style.cssText = '';
        canvas.style.display = 'block';
        this.container.appendChild(canvas);

        // GUI setup
        this.gui = createUI ? new GUI() : null;

        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = null;
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        const geo = new THREE.PlaneGeometry(2, 2);

        // Shadertoy uniforms
        this.uniforms = {
            iResolution: new THREE.Uniform(new THREE.Vector3(1, 1, 1)),
            iTime:       new THREE.Uniform(0),
            iFrame:      new THREE.Uniform(0),
            iMouse:      new THREE.Uniform(new THREE.Vector4(0,0,0,0)),
            iDate:       new THREE.Uniform(new THREE.Vector4(0,0,0,0)),
        };

        // Store custom uniform metadata for GUI and shader rebuilding
        this._customUniforms = [];
        this._fragBody = fragBody || `void mainImage(out vec4 fragColor, in vec2 fragCoord){ fragColor = vec4(0.0,0.0,0.0,1.0); }`;

        // Build initial material
        this._buildMaterial(transparent);

        this.mesh = new THREE.Mesh(geo, this.material);
        this.scene.add(this.mesh);

        // Deterministic hooks
        this._detResetNext = true;
        this.updatables = [{
            tick: (t, dt) => {
                if (this._detResetNext) {
                    this.uniforms.iFrame.value = 0;
                    this._detResetNext = false;
                } else {
                    this.uniforms.iFrame.value = (this.uniforms.iFrame.value | 0) + 1;
                }
                this.uniforms.iTime.value = +t || 0;
                this._updateIDate();
            }
        }];

        this._postRenders = [];
        this.addPostRender = (fn) => { if (typeof fn === 'function') this._postRenders.push(fn); };

        // Patch renderer to sync iResolution
        const _origRender = this.renderer.render.bind(this.renderer);
        this.renderer.render = (scene, camera) => {
            this._syncIResolutionFromCanvas();
            _origRender(scene, camera);
        };

        // Animation state
        this._animating = false;
        this._targetFPS = targetFPS;
        this._startTimeMs = performance.now();
        this._lastRAF = 0;

        // Mouse input
        this._isMouseDown = false;
        this._mouse = { x: 0, y: 0, clickX: 0, clickY: 0 };
        this._bindMouse();

        // Sizing
        this._sizeLocked = false;
        this._onWindowResize = () => this.resize();
        window.addEventListener('resize', this._onWindowResize);

        this._ro = new ResizeObserver(() => this.resize());
        this._ro.observe(this.container);

        this.resize();
        requestAnimationFrame(() => this.resize());
    }

    // ===== Custom Uniform API =====

    /**
     * Add a custom uniform that will be available in your shader
     * @param {string} name - Uniform name (e.g., 'uScale')
     * @param {string} glslType - GLSL type: 'float', 'int', 'bool', 'vec2', 'vec3', 'vec4'
     * @param {number|number[]|boolean} initialValue - Initial value
     */
    addUniform(name, glslType, initialValue) {
        // Create THREE.Uniform with appropriate value wrapper
        let uniformValue;
        if (glslType === 'vec2') uniformValue = new THREE.Vector2(...(Array.isArray(initialValue) ? initialValue : [initialValue, initialValue]));
        else if (glslType === 'vec3') uniformValue = new THREE.Vector3(...(Array.isArray(initialValue) ? initialValue : [initialValue, initialValue, initialValue]));
        else if (glslType === 'vec4') uniformValue = new THREE.Vector4(...(Array.isArray(initialValue) ? initialValue : [initialValue, initialValue, initialValue, initialValue]));
        else uniformValue = initialValue;

        this.uniforms[name] = new THREE.Uniform(uniformValue);

        // Track for shader rebuilding
        this._customUniforms.push({ name, glslType, value: uniformValue });

        // Rebuild shader with new uniform
        this._rebuildShader();

        return this;
    }

    /**
     * Add a GUI control for a uniform
     * @param {string} uniformName - Name of the uniform to control
     * @param {object} options - lil-gui options: { min, max, step } for numbers, { type: 'color' } for vec3 colors
     */
    addControl(uniformName, options = {}) {
        if (!this.gui) {
            console.warn('GUI not enabled. Pass createUI: true to constructor.');
            return this;
        }

        const uniform = this.uniforms[uniformName];
        if (!uniform) {
            console.warn(`Uniform '${uniformName}' not found`);
            return this;
        }

        const value = uniform.value;

        // Handle color for vec3
        if (options.type === 'color' && (value instanceof THREE.Vector3 || value instanceof THREE.Color)) {
            const colorProxy = { color: value instanceof THREE.Color ? value.getHex() : new THREE.Color(value.x, value.y, value.z).getHex() };
            this.gui.addColor(colorProxy, 'color').name(options.name || uniformName).onChange(hex => {
                const c = new THREE.Color(hex);
                if (value instanceof THREE.Color) {
                    value.setHex(hex);
                } else {
                    value.set(c.r, c.g, c.b);
                }
            });
        }
        // Handle vec2/vec3/vec4 components
        else if (value instanceof THREE.Vector2 || value instanceof THREE.Vector3 || value instanceof THREE.Vector4) {
            const folder = this.gui.addFolder(options.name || uniformName);
            const components = value instanceof THREE.Vector2 ? ['x', 'y'] :
                value instanceof THREE.Vector3 ? ['x', 'y', 'z'] :
                    ['x', 'y', 'z', 'w'];
            components.forEach(comp => {
                folder.add(value, comp, options.min ?? -10, options.max ?? 10, options.step).name(comp);
            });
        }
        // Handle scalar values
        else if (typeof value === 'number') {
            this.gui.add(uniform, 'value', options.min ?? -10, options.max ?? 10, options.step).name(options.name || uniformName);
        }
        // Handle boolean
        else if (typeof value === 'boolean') {
            this.gui.add(uniform, 'value').name(options.name || uniformName);
        }

        return this;
    }

    // ===== Internal =====

    _buildMaterial(transparent) {
        const customUniformsGLSL = this._customUniforms
            .map(u => `uniform ${u.glslType} ${u.name};`)
            .join('\n');

        const fragmentShader = wrapShadertoyBodyGLSL3(this._fragBody, customUniformsGLSL);

        if (this.material) this.material.dispose();

        this.material = new THREE.RawShaderMaterial({
            glslVersion: THREE.GLSL3,
            vertexShader: VERT_GLSL3,
            fragmentShader,
            uniforms: this.uniforms,
            transparent,
        });

        if (this.mesh) this.mesh.material = this.material;
    }

    _rebuildShader() {
        const transparent = this.renderer.getContextAttributes()?.alpha ?? true;
        this._buildMaterial(transparent);
    }

    // ===== Public API (unchanged from your original) =====

    start() {
        if (this._animating) return;
        this._animating = true;
        this._startTimeMs = performance.now();

        const loop = (ts) => {
            if (!this._animating) return;
            const minDelta = 1000 / Math.max(1, Math.min(240, this._targetFPS | 0));
            if (ts - this._lastRAF >= minDelta) {
                const nowMs = performance.now();
                this.uniforms.iTime.value = (nowMs - this._startTimeMs) / 1000;
                this.uniforms.iFrame.value = (this.uniforms.iFrame.value | 0) + 1;
                this._updateIDate();

                this.renderer.render(this.scene, this.camera);
                for (const fn of this._postRenders) fn?.();

                this._lastRAF = ts;
            }
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    stop() {
        this._animating = false;
        this._detResetNext = true;
        this.uniforms.iFrame.value = 0;
    }

    setFPS(fps = 60) { this._targetFPS = fps; }

    setShaderSource(fragBody) {
        this._fragBody = fragBody;
        this._rebuildShader();
    }

    renderOnce(tSeconds, frameIndex) {
        this._setClock(tSeconds, frameIndex);
        this.renderer.render(this.scene, this.camera);
        for (const fn of this._postRenders) fn?.();
    }

    setTime(t, frameIndex) {
        this.uniforms.iTime.value  = +t || 0;
        this.uniforms.iFrame.value = (frameIndex | 0);
        this._updateIDate();
    }

    beginFixedSize({ width, height, pixelRatio = 1 }) {
        if (this._sizeLocked) return;
        this._sizeLocked = true;

        const c = this.renderer.domElement;
        this._prevSizeState = {
            pr: this.renderer.getPixelRatio?.(),
            cssAR: c.style.aspectRatio,
            cssW:  c.style.width,
            cssH:  c.style.height,
        };

        this.renderer.setPixelRatio(pixelRatio);
        this.renderer.setSize(width, height, false);
        this._syncIResolutionFromCanvas();

        c.style.removeProperty('width');
        c.style.removeProperty('height');
        c.style.aspectRatio = `${width} / ${height}`;
    }

    endFixedSize() {
        if (!this._sizeLocked) return;
        const c = this.renderer.domElement;

        if (this._prevSizeState?.pr != null) this.renderer.setPixelRatio(this._prevSizeState.pr);

        const w = this.container.clientWidth  || window.innerWidth;
        const h = this.container.clientHeight || window.innerHeight;
        this.renderer.setSize(w, h, true);

        if (this._prevSizeState?.cssAR) c.style.aspectRatio = this._prevSizeState.cssAR;
        else c.style.removeProperty('aspect-ratio');
        c.style.width  = this._prevSizeState?.cssW || '';
        c.style.height = this._prevSizeState?.cssH || '';

        this._sizeLocked = false;
        this._syncIResolutionFromCanvas();
    }

    resize(width, height) {
        if (this._sizeLocked) {
            this._syncIResolutionFromCanvas();
            return;
        }
        const w = Math.max(1, Math.round(width  ?? (this.container.clientWidth  || window.innerWidth)));
        const h = Math.max(1, Math.round(height ?? (this.container.clientHeight || window.innerHeight)));
        this.renderer.setSize(w, h, true);
        this._syncIResolutionFromCanvas();
    }

    dispose() {
        this.stop();
        this._ro?.disconnect();
        window.removeEventListener('resize', this._onWindowResize);

        const el = this.renderer.domElement;
        el.removeEventListener('mousemove', this._onMouseMove);
        el.removeEventListener('mousedown', this._onMouseDown);
        el.removeEventListener('mouseup',   this._onMouseUp);

        this.mesh?.geometry?.dispose();
        this.material?.dispose();
        this.renderer?.dispose();
        if (el?.parentNode) el.parentNode.removeChild(el);

        this.gui?.destroy();
    }

    // ===== Internals (unchanged) =====

    _syncIResolutionFromCanvas() {
        const c = this.renderer?.domElement;
        if (!c) return;
        const w = c.width  || 1;
        const h = c.height || 1;
        this.uniforms.iResolution.value.set(w, h, 1.0);
    }

    _updateIDate() {
        const now = new Date();
        const secondsInDay =
            now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds()
            + now.getMilliseconds()/1000;
        this.uniforms.iDate.value.set(
            now.getFullYear(), now.getMonth() + 1, now.getDate(), secondsInDay
        );
    }

    _setClock(tSeconds, frameIndex) {
        this.uniforms.iTime.value  = +tSeconds || 0;
        this.uniforms.iFrame.value = (frameIndex | 0);
        this._updateIDate();
    }

    _bindMouse() {
        this._onMouseMove = (e) => { if (this._isMouseDown) this._updateMouse(e, false); };
        this._onMouseDown = (e) => { this._isMouseDown = true;  this._updateMouse(e, true);  };
        this._onMouseUp   = (e) => { this._isMouseDown = false; this._updateMouse(e, false); };
        const el = this.renderer.domElement;
        el.addEventListener('mousemove', this._onMouseMove);
        el.addEventListener('mousedown', this._onMouseDown);
        el.addEventListener('mouseup',   this._onMouseUp);
    }

    _updateMouse(e, downEvent) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const dpr  = this.renderer.getPixelRatio();
        const px = (e.clientX - rect.left) * dpr;
        const py = (rect.bottom - e.clientY) * dpr;
        if (downEvent) { this._mouse.clickX = px; this._mouse.clickY = py; }
        this._mouse.x = px; this._mouse.y = py;
        this.uniforms.iMouse.value.set(this._mouse.x, this._mouse.y, this._mouse.clickX, this._mouse.clickY);
    }
}
