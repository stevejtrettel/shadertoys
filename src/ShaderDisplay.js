// ShaderDisplay.js — Add viewport scaling + fullscreen button

import { GUI } from 'lil-gui';

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

function createFullscreenButton() {
    const btn = document.createElement('button');
    btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
    `;
    Object.assign(btn.style, {
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        padding: '12px',
        background: 'rgba(0, 0, 0, 0.6)',
        border: 'none',
        borderRadius: '8px',
        color: 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.2s',
        zIndex: '1000',
        backdropFilter: 'blur(4px)',
    });

    btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(0, 0, 0, 0.8)';
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.background = 'rgba(0, 0, 0, 0.6)';
    });

    return btn;
}

const VERT_GLSL3 = `#version 300 es
in vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

function wrapShadertoyBodyGLSL3(fragBody, customUniforms = '') {
    return `#version 300 es
precision highp float;

uniform vec3  iResolution;
uniform float iTime;
uniform int   iFrame;
uniform vec4  iMouse;
uniform vec4  iDate;

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

function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Shader compilation failed: ${info}`);
    }
    return shader;
}

function createProgram(gl, vertSource, fragSource) {
    const vertShader = compileShader(gl, gl.VERTEX_SHADER, vertSource);
    const fragShader = compileShader(gl, gl.FRAGMENT_SHADER, fragSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        throw new Error(`Program linking failed: ${info}`);
    }

    gl.deleteShader(vertShader);
    gl.deleteShader(fragShader);
    return program;
}

export default class ShaderDisplay {
    constructor(fragBody, opts = {}) {
        const {
            container,
            containerId = 'World',
            fullscreen = true,
            createUI = true,
            showFullscreenButton = false,  // NEW
            viewportScale = 1.0,           // NEW: 0.5 = render in center 50% of screen
            transparent = true,
            maxDPR = 2,
            targetFPS = 60,
        } = opts;

        this.container = container ?? (fullscreen ? createFullscreenContainer(containerId) : document.body);
        this.container.style.position = 'relative'; // for button positioning

        // Wrapper for canvas + button
        this.wrapper = document.createElement('div');
        Object.assign(this.wrapper.style, {
            position: 'relative',
            width: '100%',
            height: '100%',
        });
        this.container.appendChild(this.wrapper);

        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.style.display = 'block';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.wrapper.appendChild(this.canvas);

        // Fullscreen button
        this.fullscreenButton = null;
        if (showFullscreenButton) {
            this.fullscreenButton = createFullscreenButton();
            this.wrapper.appendChild(this.fullscreenButton);
            this._bindFullscreen();
        }

        // WebGL2 context
        this.gl = this.canvas.getContext('webgl2', {
            antialias: true,
            alpha: transparent,
            preserveDrawingBuffer: true,
            premultipliedAlpha: false,
            powerPreference: 'high-performance',
        });

        if (!this.gl) throw new Error('WebGL2 not supported');

        this.dpr = Math.min(window.devicePixelRatio || 1, maxDPR);
        this.transparent = transparent;
        this.viewportScale = Math.max(0.1, Math.min(1.0, viewportScale));

        // Fullscreen quad
        const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        this.vao = this.gl.createVertexArray();
        this.vbo = this.gl.createBuffer();
        this.gl.bindVertexArray(this.vao);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

        // GUI
        this.gui = createUI ? new GUI() : null;

        // Shader state
        this._fragBody = fragBody || `void mainImage(out vec4 fragColor, in vec2 fragCoord){ fragColor = vec4(0.0); }`;
        this._customUniforms = [];
        this._uniformLocations = {};
        this._uniformValues = {
            iResolution: [1, 1, 1],
            iTime: 0,
            iFrame: 0,
            iMouse: [0, 0, 0, 0],
            iDate: [0, 0, 0, 0],
        };

        this._buildProgram();

        // Animation
        this._animating = false;
        this._targetFPS = targetFPS;
        this._startTimeMs = performance.now();
        this._lastRAF = 0;

        // Mouse
        this._isMouseDown = false;
        this._mouse = { x: 0, y: 0, clickX: 0, clickY: 0 };
        this._bindMouse();

        // Resize
        this._onWindowResize = () => this.resize();
        window.addEventListener('resize', this._onWindowResize);
        this._ro = new ResizeObserver(() => this.resize());
        this._ro.observe(this.container);

        this.resize();
        requestAnimationFrame(() => this.resize());
    }

    _buildProgram() {
        const customUniformsGLSL = this._customUniforms
            .map(u => `uniform ${u.glslType} ${u.name};`)
            .join('\n');

        const fragSource = wrapShadertoyBodyGLSL3(this._fragBody, customUniformsGLSL);

        if (this.program) this.gl.deleteProgram(this.program);

        this.program = createProgram(this.gl, VERT_GLSL3, fragSource);

        const posLoc = this.gl.getAttribLocation(this.program, 'position');
        this.gl.enableVertexAttribArray(posLoc);
        this.gl.vertexAttribPointer(posLoc, 2, this.gl.FLOAT, false, 0, 0);

        this._uniformLocations = {
            iResolution: this.gl.getUniformLocation(this.program, 'iResolution'),
            iTime: this.gl.getUniformLocation(this.program, 'iTime'),
            iFrame: this.gl.getUniformLocation(this.program, 'iFrame'),
            iMouse: this.gl.getUniformLocation(this.program, 'iMouse'),
            iDate: this.gl.getUniformLocation(this.program, 'iDate'),
        };

        for (const u of this._customUniforms) {
            this._uniformLocations[u.name] = this.gl.getUniformLocation(this.program, u.name);
        }
    }

    addUniform(name, glslType, initialValue) {
        this._customUniforms.push({ name, glslType });

        if (glslType === 'vec2') this._uniformValues[name] = Array.isArray(initialValue) ? initialValue : [initialValue, initialValue];
        else if (glslType === 'vec3') this._uniformValues[name] = Array.isArray(initialValue) ? initialValue : [initialValue, initialValue, initialValue];
        else if (glslType === 'vec4') this._uniformValues[name] = Array.isArray(initialValue) ? initialValue : [initialValue, initialValue, initialValue, initialValue];
        else this._uniformValues[name] = initialValue;

        this._buildProgram();
        return this;
    }

    addControl(uniformName, options = {}) {
        if (!this.gui) {
            console.warn('GUI not enabled');
            return this;
        }

        const value = this._uniformValues[uniformName];
        if (value === undefined) {
            console.warn(`Uniform '${uniformName}' not found`);
            return this;
        }

        if (options.type === 'color' && Array.isArray(value) && value.length === 3) {
            const colorProxy = {
                color: `#${value.map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('')}`
            };
            this.gui.addColor(colorProxy, 'color').name(options.name || uniformName).onChange(hex => {
                const r = parseInt(hex.slice(1, 3), 16) / 255;
                const g = parseInt(hex.slice(3, 5), 16) / 255;
                const b = parseInt(hex.slice(5, 7), 16) / 255;
                this._uniformValues[uniformName] = [r, g, b];
            });
        }
        else if (Array.isArray(value)) {
            const folder = this.gui.addFolder(options.name || uniformName);
            const components = ['x', 'y', 'z', 'w'].slice(0, value.length);
            const proxy = {};
            components.forEach((comp, i) => {
                proxy[comp] = value[i];
                folder.add(proxy, comp, options.min ?? -10, options.max ?? 10, options.step).onChange(v => {
                    this._uniformValues[uniformName][i] = v;
                });
            });
        }
        else if (typeof value === 'number') {
            const proxy = { value };
            this.gui.add(proxy, 'value', options.min ?? -10, options.max ?? 10, options.step)
                .name(options.name || uniformName)
                .onChange(v => { this._uniformValues[uniformName] = v; });
        }
        else if (typeof value === 'boolean') {
            const proxy = { value };
            this.gui.add(proxy, 'value').name(options.name || uniformName)
                .onChange(v => { this._uniformValues[uniformName] = v; });
        }

        return this;
    }

    setViewportScale(scale) {
        this.viewportScale = Math.max(0.1, Math.min(1.0, scale));
        this.resize();
    }

    start() {
        if (this._animating) return;
        this._animating = true;
        this._startTimeMs = performance.now();

        const loop = (ts) => {
            if (!this._animating) return;
            const minDelta = 1000 / Math.max(1, Math.min(240, this._targetFPS | 0));
            if (ts - this._lastRAF >= minDelta) {
                const nowMs = performance.now();
                this._uniformValues.iTime = (nowMs - this._startTimeMs) / 1000;
                this._uniformValues.iFrame = (this._uniformValues.iFrame | 0) + 1;
                this._updateIDate();
                this.render();
                this._lastRAF = ts;
            }
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    stop() {
        this._animating = false;
        this._uniformValues.iFrame = 0;
    }
// In the render() method, replace it with this:
    render() {
        const gl = this.gl;

        // Render to full canvas buffer (which is already scaled)
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0, 0, 0, this.transparent ? 0 : 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);

        // iResolution matches the actual render buffer size
        this._uniformValues.iResolution = [this.canvas.width, this.canvas.height, 1.0];

        gl.uniform3fv(this._uniformLocations.iResolution, this._uniformValues.iResolution);
        gl.uniform1f(this._uniformLocations.iTime, this._uniformValues.iTime);
        gl.uniform1i(this._uniformLocations.iFrame, this._uniformValues.iFrame);
        gl.uniform4fv(this._uniformLocations.iMouse, this._uniformValues.iMouse);
        gl.uniform4fv(this._uniformLocations.iDate, this._uniformValues.iDate);

        for (const u of this._customUniforms) {
            const loc = this._uniformLocations[u.name];
            const val = this._uniformValues[u.name];

            if (u.glslType === 'float') gl.uniform1f(loc, val);
            else if (u.glslType === 'int') gl.uniform1i(loc, val);
            else if (u.glslType === 'bool') gl.uniform1i(loc, val ? 1 : 0);
            else if (u.glslType === 'vec2') gl.uniform2fv(loc, val);
            else if (u.glslType === 'vec3') gl.uniform3fv(loc, val);
            else if (u.glslType === 'vec4') gl.uniform4fv(loc, val);
        }

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }



    resize(width, height) {
        const containerW = Math.max(1, Math.round(width  ?? (this.container.clientWidth  || window.innerWidth)));
        const containerH = Math.max(1, Math.round(height ?? (this.container.clientHeight || window.innerHeight)));

        // Calculate actual render dimensions (scaled down)
        const renderW = Math.round(containerW * this.viewportScale);
        const renderH = Math.round(containerH * this.viewportScale);

        // Set canvas render buffer to the scaled size
        this.canvas.width = renderW * this.dpr;
        this.canvas.height = renderH * this.dpr;

        // Display canvas at the scaled size
        this.canvas.style.width = `${renderW}px`;
        this.canvas.style.height = `${renderH}px`;

        // Center it in the container
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = `${(containerW - renderW) / 2}px`;
        this.canvas.style.top = `${(containerH - renderH) / 2}px`;
        this.canvas.style.transform = 'none';
    }

    setShaderSource(fragBody) {
        this._fragBody = fragBody;
        this._buildProgram();
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.container.requestFullscreen?.() ||
            this.container.webkitRequestFullscreen?.() ||
            this.container.mozRequestFullScreen?.();
        } else {
            document.exitFullscreen?.() ||
            document.webkitExitFullscreen?.() ||
            document.mozCancelFullScreen?.();
        }
    }

    _bindFullscreen() {
        if (!this.fullscreenButton) return;

        this.fullscreenButton.addEventListener('click', () => this.toggleFullscreen());

        // Update button icon on fullscreen change
        const updateIcon = () => {
            const isFullscreen = !!document.fullscreenElement;
            this.fullscreenButton.innerHTML = isFullscreen ? `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                </svg>
            ` : `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
            `;
        };

        document.addEventListener('fullscreenchange', updateIcon);
        document.addEventListener('webkitfullscreenchange', updateIcon);
        document.addEventListener('mozfullscreenchange', updateIcon);
    }

    dispose() {
        this.stop();
        this._ro?.disconnect();
        window.removeEventListener('resize', this._onWindowResize);

        this.canvas.removeEventListener('mousemove', this._onMouseMove);
        this.canvas.removeEventListener('mousedown', this._onMouseDown);
        this.canvas.removeEventListener('mouseup', this._onMouseUp);

        this.gl.deleteBuffer(this.vbo);
        this.gl.deleteVertexArray(this.vao);
        this.gl.deleteProgram(this.program);

        if (this.canvas?.parentNode) this.canvas.parentNode.removeChild(this.canvas);
        this.gui?.destroy();
    }

    _updateIDate() {
        const now = new Date();
        const secondsInDay = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() + now.getMilliseconds() / 1000;
        this._uniformValues.iDate = [now.getFullYear(), now.getMonth() + 1, now.getDate(), secondsInDay];
    }

    _bindMouse() {
        this._onMouseMove = (e) => { if (this._isMouseDown) this._updateMouse(e, false); };
        this._onMouseDown = (e) => { this._isMouseDown = true; this._updateMouse(e, true); };
        this._onMouseUp = (e) => { this._isMouseDown = false; this._updateMouse(e, false); };

        this.canvas.addEventListener('mousemove', this._onMouseMove);
        this.canvas.addEventListener('mousedown', this._onMouseDown);
        this.canvas.addEventListener('mouseup', this._onMouseUp);
    }

    _updateMouse(e, downEvent) {
        const rect = this.canvas.getBoundingClientRect();

        // Calculate mouse position relative to the scaled viewport
        const fullW = this.canvas.width;
        const fullH = this.canvas.height;
        const vpW = fullW * this.viewportScale;
        const vpH = fullH * this.viewportScale;
        const vpX = (fullW - vpW) * 0.5;
        const vpY = (fullH - vpH) * 0.5;

        const canvasX = (e.clientX - rect.left) * this.dpr;
        const canvasY = (rect.bottom - e.clientY) * this.dpr;

        // Translate to viewport coordinates
        const px = canvasX - vpX;
        const py = canvasY - vpY;

        if (downEvent) {
            this._mouse.clickX = px;
            this._mouse.clickY = py;
        }
        this._mouse.x = px;
        this._mouse.y = py;
        this._uniformValues.iMouse = [this._mouse.x, this._mouse.y, this._mouse.clickX, this._mouse.clickY];
    }
}
