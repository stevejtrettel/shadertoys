#!/usr/bin/env node

/**
 * Shader Sandbox CLI
 * Commands:
 *   shader create <name>       - Create a new shader project (recommended)
 *   shader init                - Initialize shaders in current directory
 *   shader new <name>          - Create a new shader
 *   shader dev <shader-name>   - Start development server
 *   shader build <shader-name> - Build for production
 *   shader list                - List available shaders
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');

const pkg = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf-8'));

const args = process.argv.slice(2);
const command = args[0];

function printUsage() {
  console.log(`
Shader Sandbox - Local GLSL shader development

Usage:
  shader create <name>       Create a new shader project (recommended)
  shader init                Initialize shaders in current directory
  shader new <name>          Create a new shader
  shader dev <shader-name>   Start development server
  shader build <shader-name> Build for production (multi-file)
  shader export <shader-name> Export as standalone HTML (single file)
  shader list                List available shaders
  shader --version           Show version

Examples:
  shader create my-shaders   Create a new project with everything set up
  shader new my-shader       Create shaders/my-shader/
  shader dev my-shader       Run shader in dev mode
  shader build my-shader     Build shader to dist/
  shader export my-shader    Export as single HTML file
  shader list                Show all shaders
`);
}

function copyDir(src, dest, skipFiles = []) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    // Skip specified files
    if (skipFiles.includes(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, skipFiles);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function getShaderList(cwd) {
  const shadersDir = path.join(cwd, 'shaders');
  if (!fs.existsSync(shadersDir)) {
    return null;
  }

  const entries = fs.readdirSync(shadersDir, { withFileTypes: true });
  return entries.filter(e => e.isDirectory()).map(e => e.name);
}

function listShaders(cwd) {
  const shaders = getShaderList(cwd);

  if (shaders === null) {
    console.error('Error: shaders/ directory not found');
    console.error('');
    console.error('To get started:');
    console.error('  shader init     Initialize shaders in current directory');
    console.error('  shader create   Create a new shader project');
    process.exit(1);
  }

  if (shaders.length === 0) {
    console.log('No shaders found.');
    console.log('');
    console.log('Create your first shader:');
    console.log('  shader new my-shader');
    return;
  }

  console.log('Available shaders:');
  shaders.forEach(s => console.log(`  ${s}`));
  console.log('');
  console.log('Run a shader:');
  console.log(`  shader dev ${shaders[0]}`);
}

async function create(projectName) {
  // Validate name
  if (!projectName || !/^[a-zA-Z0-9_-]+$/.test(projectName)) {
    console.error('Error: Invalid project name');
    console.error('Use only letters, numbers, hyphens, and underscores');
    process.exit(1);
  }

  const projectDir = path.join(process.cwd(), projectName);
  const templatesDir = path.join(packageRoot, 'templates');

  // Check if directory already exists
  if (fs.existsSync(projectDir)) {
    console.error(`Error: Directory "${projectName}" already exists`);
    process.exit(1);
  }

  console.log(`Creating shader project "${projectName}"...`);

  // Create project directory
  fs.mkdirSync(projectDir, { recursive: true });

  // Generate package.json
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    type: 'module',
    scripts: {
      dev: 'shader dev',
      build: 'shader build',
      list: 'shader list'
    },
    dependencies: {
      '@stevejtrettel/shader-sandbox': `^${pkg.version}`,
      'vite': '^5.0.0'
    }
  };

  fs.writeFileSync(
    path.join(projectDir, 'package.json'),
    JSON.stringify(packageJson, null, 2) + '\n'
  );

  // Copy template files (skip package.json since we generated our own)
  copyDir(templatesDir, projectDir, ['package.json']);

  // Run npm install
  console.log('Installing dependencies...');

  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npmCmd, ['install'], {
    cwd: projectDir,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  child.on('error', (err) => {
    console.error('Failed to run npm install:', err.message);
    console.log('\nProject created but dependencies not installed.');
    console.log(`Run: cd ${projectName} && npm install`);
    process.exit(1);
  });

  child.on('close', (code) => {
    if (code !== 0) {
      console.error('\nnpm install failed.');
      console.log(`Run: cd ${projectName} && npm install`);
      process.exit(code);
    }

    console.log(`
✓ Project "${projectName}" created!

Next steps:
  cd ${projectName}
  shader dev example-gradient    Run a shader
  shader list                    Show all shaders
  shader new my-shader           Create a new shader
`);
  });
}

async function init() {
  const cwd = process.cwd();
  const templatesDir = path.join(packageRoot, 'templates');

  // Check if directory already has shader files
  const shaderDir = path.join(cwd, 'shaders');
  if (fs.existsSync(shaderDir)) {
    console.error('Error: shaders/ directory already exists');
    process.exit(1);
  }

  console.log('Creating shader collection...');

  // Copy template files (skip package.json to not overwrite user's)
  copyDir(templatesDir, cwd, ['package.json']);

  console.log(`
✓ Shader collection created!

Structure:
  shaders/
    example-gradient/    Simple animated gradient
    example-buffer/      BufferA feedback example

Next steps:
  shader list                    Show all shaders
  shader dev example-gradient    Run a shader
  shader new my-shader           Create a new shader
`);
}

function createNewShader(name) {
  const cwd = process.cwd();
  const shadersDir = path.join(cwd, 'shaders');

  // Check shaders directory exists
  if (!fs.existsSync(shadersDir)) {
    console.error('Error: shaders/ directory not found');
    console.error('Run "shader init" first');
    process.exit(1);
  }

  // Validate name
  if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
    console.error('Error: Invalid shader name');
    console.error('Use only letters, numbers, hyphens, and underscores');
    process.exit(1);
  }

  const shaderDir = path.join(shadersDir, name);

  // Check if already exists
  if (fs.existsSync(shaderDir)) {
    console.error(`Error: Shader "${name}" already exists`);
    process.exit(1);
  }

  // Create directory
  fs.mkdirSync(shaderDir, { recursive: true });

  // Create image.glsl with starter template
  const imageGlsl = `void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Normalized pixel coordinates (0 to 1)
    vec2 uv = fragCoord / iResolution.xy;

    // Time varying pixel color
    vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0, 2, 4));

    // Output to screen
    fragColor = vec4(col, 1.0);
}
`;

  fs.writeFileSync(path.join(shaderDir, 'image.glsl'), imageGlsl);

  // Create config.json
  const config = {
    layout: 'default',
    controls: true
  };

  fs.writeFileSync(path.join(shaderDir, 'config.json'), JSON.stringify(config, null, 2) + '\n');

  console.log(`
✓ Created shader "${name}"

Files:
  shaders/${name}/image.glsl     Main shader
  shaders/${name}/config.json    Configuration

Run it:
  shader dev ${name}
`);
}

function runVite(viteArgs, shaderName) {
  const cwd = process.cwd();

  // Check for vite.config.js
  if (!fs.existsSync(path.join(cwd, 'vite.config.js'))) {
    console.error('Error: vite.config.js not found');
    console.error('Run "shader init" first');
    process.exit(1);
  }

  // Find vite binary
  const viteBin = path.join(cwd, 'node_modules', '.bin', 'vite');
  if (!fs.existsSync(viteBin)) {
    console.error('Error: vite not found in node_modules');
    console.error('Run "npm install" first');
    process.exit(1);
  }

  const env = { ...process.env, SHADER_NAME: shaderName };

  const child = spawn(viteBin, viteArgs, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env
  });

  child.on('error', (err) => {
    console.error('Failed to start vite:', err.message);
    process.exit(1);
  });

  child.on('close', (code) => {
    process.exit(code || 0);
  });
}

function validateShaderExists(cwd, shaderName) {
  const shaderPath = path.join(cwd, 'shaders', shaderName);
  if (fs.existsSync(shaderPath)) return shaderPath;

  const shaders = getShaderList(cwd);
  console.error(`Error: Shader "${shaderName}" not found`);

  if (shaders && shaders.length > 0) {
    const similar = shaders.filter(s =>
      s.toLowerCase().includes(shaderName.toLowerCase()) ||
      shaderName.toLowerCase().includes(s.toLowerCase())
    );
    if (similar.length > 0) {
      console.error('');
      console.error('Did you mean:');
      similar.forEach(s => console.error(`  ${s}`));
    } else {
      console.error('');
      console.error('Available shaders:');
      shaders.forEach(s => console.error(`  ${s}`));
    }
  }
  process.exit(1);
}

function generateStandaloneHTML(opts) {
  const { title, commonSource, passes, uniforms } = opts;

  const escapeForJS = (s) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

  const shaderSources = passes.map(p => ({
    name: p.name,
    source: escapeForJS(p.source),
    channels: p.channels,
  }));

  const uniformInits = Object.entries(uniforms).map(([name, def]) => {
    const value = def.value;
    if (def.type === 'float' || def.type === 'int') {
      return `  '${name}': ${value},`;
    } else if (def.type === 'bool') {
      return `  '${name}': ${value ? 1 : 0},`;
    } else if (def.type === 'vec2') {
      return `  '${name}': [${value[0]}, ${value[1]}],`;
    } else if (def.type === 'vec3') {
      return `  '${name}': [${value[0]}, ${value[1]}, ${value[2]}],`;
    } else if (def.type === 'vec4') {
      return `  '${name}': [${value[0]}, ${value[1]}, ${value[2]}, ${value[3]}],`;
    }
    return '';
  }).filter(Boolean).join('\n');

  const uniformDeclarations = Object.entries(uniforms).map(([name, def]) => {
    if (def.type === 'float') return `uniform float ${name};`;
    if (def.type === 'int') return `uniform int ${name};`;
    if (def.type === 'bool') return `uniform int ${name};`;
    if (def.type === 'vec2') return `uniform vec2 ${name};`;
    if (def.type === 'vec3') return `uniform vec3 ${name};`;
    if (def.type === 'vec4') return `uniform vec4 ${name};`;
    return '';
  }).filter(Boolean).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #fff; }
    body { display: flex; align-items: center; justify-content: center; }
    .container {
      width: 90vw;
      max-width: 1200px;
      aspect-ratio: 16 / 9;
      background: #000;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1);
    }
    canvas { display: block; width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div class="container">
    <canvas id="canvas"></canvas>
  </div>
  <script>
// Shader Sandbox Export - ${title}
// Generated ${new Date().toISOString()}

const VERTEX_SHADER = \`#version 300 es
precision highp float;
layout(location = 0) in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
\`;

const FRAGMENT_PREAMBLE = \`#version 300 es
precision highp float;

vec4 proceduralGrid(vec2 uv) {
  vec2 grid = step(fract(uv * 8.0), vec2(0.5));
  float checker = abs(grid.x - grid.y);
  return mix(vec4(0.2, 0.2, 0.2, 1.0), vec4(0.8, 0.1, 0.8, 1.0), checker);
}

uniform vec3  iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform int   iFrame;
uniform vec4  iMouse;
uniform vec4  iDate;
uniform float iFrameRate;
uniform vec3  iChannelResolution[4];
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;
${uniformDeclarations}
\`;

const FRAGMENT_SUFFIX = \`
out vec4 fragColor;
void main() { mainImage(fragColor, gl_FragCoord.xy); }
\`;

const COMMON_SOURCE = \`${commonSource ? escapeForJS(commonSource) : ''}\`;

const PASSES = [
${shaderSources.map(p => `  { name: '${p.name}', source: \`${p.source}\`, channels: ${JSON.stringify(p.channels)} }`).join(',\n')}
];

const UNIFORM_VALUES = {
${uniformInits}
};

const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, preserveDrawingBuffer: true });
if (!gl) { alert('WebGL2 not supported'); throw new Error('WebGL2 not supported'); }

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
const vbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

function createProceduralTexture() {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  const data = new Uint8Array(8 * 8 * 4);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const i = (y * 8 + x) * 4;
      const checker = (x + y) % 2;
      data[i] = checker ? 204 : 51;
      data[i+1] = checker ? 26 : 51;
      data[i+2] = checker ? 204 : 51;
      data[i+3] = 255;
    }
  }
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 8, 8, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  return tex;
}

function createBlackTexture() {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,255]));
  return tex;
}

const proceduralTex = createProceduralTexture();
const blackTex = createBlackTexture();

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    console.error(source.split('\\n').map((l,i) => (i+1) + ': ' + l).join('\\n'));
    throw new Error('Shader compile failed');
  }
  return shader;
}

function createProgram(fragSource) {
  const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compileShader(gl.FRAGMENT_SHADER, fragSource);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error('Program link failed: ' + gl.getProgramInfoLog(program));
  }
  return program;
}

function createRenderTexture(w, h) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w, h, 0, gl.RGBA, gl.FLOAT, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

function createFramebuffer(tex) {
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  return fb;
}

const container = canvas.parentElement;
let width = canvas.width = container.clientWidth * devicePixelRatio;
let height = canvas.height = container.clientHeight * devicePixelRatio;

const floatExt = gl.getExtension('EXT_color_buffer_float');

const runtimePasses = PASSES.map(pass => {
  const fragSource = FRAGMENT_PREAMBLE + (COMMON_SOURCE ? '\\n// Common\\n' + COMMON_SOURCE + '\\n' : '') + '\\n// User code\\n' + pass.source + FRAGMENT_SUFFIX;
  const program = createProgram(fragSource);
  const currentTexture = createRenderTexture(width, height);
  const previousTexture = createRenderTexture(width, height);
  const framebuffer = createFramebuffer(currentTexture);
  return {
    name: pass.name,
    channels: pass.channels,
    program,
    framebuffer,
    currentTexture,
    previousTexture,
    uniforms: {
      iResolution: gl.getUniformLocation(program, 'iResolution'),
      iTime: gl.getUniformLocation(program, 'iTime'),
      iTimeDelta: gl.getUniformLocation(program, 'iTimeDelta'),
      iFrame: gl.getUniformLocation(program, 'iFrame'),
      iMouse: gl.getUniformLocation(program, 'iMouse'),
      iDate: gl.getUniformLocation(program, 'iDate'),
      iFrameRate: gl.getUniformLocation(program, 'iFrameRate'),
      iChannel: [0,1,2,3].map(i => gl.getUniformLocation(program, 'iChannel' + i)),
      custom: Object.keys(UNIFORM_VALUES).reduce((acc, name) => {
        acc[name] = gl.getUniformLocation(program, name);
        return acc;
      }, {})
    }
  };
});

const findPass = name => runtimePasses.find(p => p.name === name);

let mouse = [0, 0, 0, 0];
canvas.addEventListener('mousemove', e => {
  mouse[0] = e.clientX * devicePixelRatio;
  mouse[1] = (canvas.clientHeight - e.clientY) * devicePixelRatio;
});
canvas.addEventListener('click', e => {
  mouse[2] = e.clientX * devicePixelRatio;
  mouse[3] = (canvas.clientHeight - e.clientY) * devicePixelRatio;
});

let lastWidth = width, lastHeight = height;
new ResizeObserver(() => {
  const newWidth = container.clientWidth * devicePixelRatio;
  const newHeight = container.clientHeight * devicePixelRatio;
  if (newWidth === lastWidth && newHeight === lastHeight) return;
  lastWidth = width = canvas.width = newWidth;
  lastHeight = height = canvas.height = newHeight;
  runtimePasses.forEach(p => {
    [p.currentTexture, p.previousTexture].forEach(tex => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, p.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, p.currentTexture, 0);
  });
  frame = 0;
  startTime = performance.now() / 1000;
  lastTime = 0;
}).observe(container);

let frame = 0;
let startTime = performance.now() / 1000;
let lastTime = 0;

function render(now) {
  requestAnimationFrame(render);

  const time = now / 1000 - startTime;
  const deltaTime = Math.max(0, time - lastTime);
  lastTime = time;

  const date = new Date();
  const iDate = [date.getFullYear(), date.getMonth(), date.getDate(),
    date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds() + date.getMilliseconds() / 1000];

  gl.bindVertexArray(vao);

  runtimePasses.forEach(pass => {
    gl.useProgram(pass.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, pass.framebuffer);
    gl.viewport(0, 0, width, height);

    gl.uniform3f(pass.uniforms.iResolution, width, height, 1);
    gl.uniform1f(pass.uniforms.iTime, time);
    gl.uniform1f(pass.uniforms.iTimeDelta, deltaTime);
    gl.uniform1i(pass.uniforms.iFrame, frame);
    gl.uniform4fv(pass.uniforms.iMouse, mouse);
    gl.uniform4fv(pass.uniforms.iDate, iDate);
    gl.uniform1f(pass.uniforms.iFrameRate, 1 / deltaTime);

    Object.entries(UNIFORM_VALUES).forEach(([name, value]) => {
      const loc = pass.uniforms.custom[name];
      if (!loc) return;
      if (Array.isArray(value)) {
        if (value.length === 2) gl.uniform2fv(loc, value);
        else if (value.length === 3) gl.uniform3fv(loc, value);
        else if (value.length === 4) gl.uniform4fv(loc, value);
      } else {
        gl.uniform1f(loc, value);
      }
    });

    pass.channels.forEach((ch, i) => {
      gl.activeTexture(gl.TEXTURE0 + i);
      if (ch === 'none') {
        gl.bindTexture(gl.TEXTURE_2D, blackTex);
      } else if (ch === 'procedural') {
        gl.bindTexture(gl.TEXTURE_2D, proceduralTex);
      } else if (['BufferA', 'BufferB', 'BufferC', 'BufferD', 'Image'].includes(ch)) {
        const srcPass = findPass(ch);
        gl.bindTexture(gl.TEXTURE_2D, srcPass ? srcPass.previousTexture : blackTex);
      } else {
        gl.bindTexture(gl.TEXTURE_2D, blackTex);
      }
      gl.uniform1i(pass.uniforms.iChannel[i], i);
    });

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    const temp = pass.currentTexture;
    pass.currentTexture = pass.previousTexture;
    pass.previousTexture = temp;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pass.currentTexture, 0);
  });

  const imagePass = findPass('Image');
  if (imagePass) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, imagePass.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, imagePass.previousTexture, 0);

    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, imagePass.framebuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.blitFramebuffer(0, 0, width, height, 0, 0, width, height, gl.COLOR_BUFFER_BIT, gl.NEAREST);

    gl.bindFramebuffer(gl.FRAMEBUFFER, imagePass.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, imagePass.currentTexture, 0);
  }

  frame++;
}

requestAnimationFrame(render);
  </script>
</body>
</html>`;
}

function exportShader(shaderName) {
  const cwd = process.cwd();
  const shaderDir = validateShaderExists(cwd, shaderName);

  // Read config
  const configPath = path.join(shaderDir, 'config.json');
  let config = {};
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }

  const title = config.title || shaderName;
  const uniforms = config.uniforms || {};

  // Read common.glsl if present
  const commonPath = path.join(shaderDir, config.common || 'common.glsl');
  let commonSource = null;
  if (fs.existsSync(commonPath)) {
    commonSource = fs.readFileSync(commonPath, 'utf-8');
  }

  // Determine passes
  const PASS_NAMES = ['BufferA', 'BufferB', 'BufferC', 'BufferD', 'Image'];
  const PASS_FILES = { Image: 'image.glsl', BufferA: 'bufferA.glsl', BufferB: 'bufferB.glsl', BufferC: 'bufferC.glsl', BufferD: 'bufferD.glsl' };
  const passes = [];

  for (const passName of PASS_NAMES) {
    const passConfig = config[passName];
    const sourceFile = (passConfig && passConfig.source) || PASS_FILES[passName];
    const sourcePath = path.join(shaderDir, sourceFile);

    if (!fs.existsSync(sourcePath)) {
      if (passConfig) {
        console.error(`Error: Source file "${sourceFile}" not found for pass ${passName}`);
        process.exit(1);
      }
      continue;
    }

    const source = fs.readFileSync(sourcePath, 'utf-8');

    // Map channels
    const channelKeys = ['iChannel0', 'iChannel1', 'iChannel2', 'iChannel3'];
    const channels = channelKeys.map(key => {
      const ch = passConfig && passConfig[key];
      if (!ch) return 'none';
      const value = typeof ch === 'string' ? ch : (ch.buffer || (ch.texture ? 'procedural' : (ch.keyboard ? 'keyboard' : 'none')));
      if (['BufferA', 'BufferB', 'BufferC', 'BufferD', 'Image'].includes(value)) return value;
      if (value === 'keyboard') return 'none'; // keyboard not supported in standalone export
      if (ch.texture || (typeof ch === 'string' && !['BufferA', 'BufferB', 'BufferC', 'BufferD', 'Image', 'keyboard'].includes(ch))) return 'procedural';
      return value;
    });

    passes.push({ name: passName, source, channels });
  }

  // Ensure we have at least an Image pass
  if (!passes.find(p => p.name === 'Image')) {
    const imagePath = path.join(shaderDir, 'image.glsl');
    if (fs.existsSync(imagePath)) {
      passes.push({
        name: 'Image',
        source: fs.readFileSync(imagePath, 'utf-8'),
        channels: ['none', 'none', 'none', 'none'],
      });
    } else {
      console.error('Error: No image.glsl found');
      process.exit(1);
    }
  }

  const html = generateStandaloneHTML({ title, commonSource, passes, uniforms });

  // Write output
  const distDir = path.join(cwd, 'dist');
  fs.mkdirSync(distDir, { recursive: true });
  const outputPath = path.join(distDir, `${shaderName}.html`);
  fs.writeFileSync(outputPath, html);

  console.log(`✓ Exported standalone HTML: dist/${shaderName}.html`);
}

// Main command handler
switch (command) {
  case 'create': {
    const name = args[1];
    if (!name) {
      console.error('Error: Specify a project name');
      console.error('  shader create <name>');
      process.exit(1);
    }
    create(name);
    break;
  }

  case 'init':
    init();
    break;

  case 'new': {
    const name = args[1];
    if (!name) {
      console.error('Error: Specify a shader name');
      console.error('  shader new <name>');
      process.exit(1);
    }
    createNewShader(name);
    break;
  }

  case 'dev': {
    const shaderName = args[1];
    const cwd = process.cwd();

    if (!shaderName) {
      const shaders = getShaderList(cwd);

      if (shaders === null) {
        console.error('Error: shaders/ directory not found');
        console.error('');
        console.error('To get started:');
        console.error('  shader init     Initialize shaders in current directory');
        console.error('  shader create   Create a new shader project');
        process.exit(1);
      }

      if (shaders.length === 0) {
        console.error('Error: No shaders found');
        console.error('');
        console.error('Create your first shader:');
        console.error('  shader new my-shader');
        process.exit(1);
      }

      console.error('Error: Specify which shader to run');
      console.error('');
      console.error('Available shaders:');
      shaders.forEach(s => console.error(`  ${s}`));
      console.error('');
      console.error('Usage:');
      console.error(`  shader dev ${shaders[0]}`);
      process.exit(1);
    }

    const shaderPath = path.join(cwd, 'shaders', shaderName);
    if (!fs.existsSync(shaderPath)) {
      const shaders = getShaderList(cwd);

      console.error(`Error: Shader "${shaderName}" not found`);

      if (shaders && shaders.length > 0) {
        // Check for similar names (typo detection)
        const similar = shaders.filter(s =>
          s.toLowerCase().includes(shaderName.toLowerCase()) ||
          shaderName.toLowerCase().includes(s.toLowerCase())
        );

        if (similar.length > 0) {
          console.error('');
          console.error('Did you mean:');
          similar.forEach(s => console.error(`  ${s}`));
        } else {
          console.error('');
          console.error('Available shaders:');
          shaders.forEach(s => console.error(`  ${s}`));
        }
      }
      process.exit(1);
    }

    console.log(`Starting dev server for "${shaderName}"...`);
    runVite([], shaderName);
    break;
  }

  case 'build': {
    const shaderName = args[1];
    const cwd = process.cwd();

    if (!shaderName) {
      const shaders = getShaderList(cwd);

      if (shaders && shaders.length > 0) {
        console.error('Error: Specify which shader to build');
        console.error('');
        console.error('Available shaders:');
        shaders.forEach(s => console.error(`  ${s}`));
        console.error('');
        console.error('Usage:');
        console.error(`  shader build ${shaders[0]}`);
      } else {
        console.error('Error: Specify a shader name');
        console.error('  shader build <shader-name>');
      }
      process.exit(1);
    }

    const shaderPath = path.join(cwd, 'shaders', shaderName);
    if (!fs.existsSync(shaderPath)) {
      const shaders = getShaderList(cwd);

      console.error(`Error: Shader "${shaderName}" not found`);

      if (shaders && shaders.length > 0) {
        const similar = shaders.filter(s =>
          s.toLowerCase().includes(shaderName.toLowerCase()) ||
          shaderName.toLowerCase().includes(s.toLowerCase())
        );

        if (similar.length > 0) {
          console.error('');
          console.error('Did you mean:');
          similar.forEach(s => console.error(`  ${s}`));
        } else {
          console.error('');
          console.error('Available shaders:');
          shaders.forEach(s => console.error(`  ${s}`));
        }
      }
      process.exit(1);
    }

    console.log(`Building "${shaderName}"...`);
    runVite(['build'], shaderName);
    break;
  }

  case 'export': {
    const shaderName = args[1];
    if (!shaderName) {
      const shaders = getShaderList(process.cwd());
      if (shaders && shaders.length > 0) {
        console.error('Error: Specify which shader to export');
        console.error('');
        console.error('Available shaders:');
        shaders.forEach(s => console.error(`  ${s}`));
        console.error('');
        console.error('Usage:');
        console.error(`  shader export ${shaders[0]}`);
      } else {
        console.error('Error: Specify a shader name');
        console.error('  shader export <shader-name>');
      }
      process.exit(1);
    }
    exportShader(shaderName);
    break;
  }

  case 'list':
    listShaders(process.cwd());
    break;

  case 'version':
  case '--version':
  case '-v':
    console.log(`shader-sandbox v${pkg.version}`);
    break;

  case 'help':
  case '--help':
  case '-h':
    printUsage();
    break;

  case undefined:
    printUsage();
    break;

  default:
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
}
