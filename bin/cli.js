#!/usr/bin/env node

/**
 * Shadertoy Runner CLI
 * Commands:
 *   shadertoy init                - Create a new shader collection
 *   shadertoy new <name>          - Create a new shader
 *   shadertoy dev <shader-name>   - Start development server
 *   shadertoy build <shader-name> - Build for production
 *   shadertoy list                - List available shaders
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const command = args[0];

function printUsage() {
  console.log(`
Shadertoy Runner - Local GLSL shader development

Usage:
  shadertoy init                Create a new shader collection
  shadertoy new <name>          Create a new shader
  shadertoy dev <shader-name>   Start development server
  shadertoy build <shader-name> Build for production
  shadertoy list                List available shaders

Examples:
  shadertoy init                Create a new project
  shadertoy new my-shader       Create shaders/my-shader/
  shadertoy dev my-shader       Run shader in dev mode
  shadertoy build my-shader     Build shader to dist/
  shadertoy list                Show all shaders
`);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function listShaders(cwd) {
  const shadersDir = path.join(cwd, 'shaders');
  if (!fs.existsSync(shadersDir)) {
    console.error('Error: shaders/ directory not found');
    console.error('Run "shadertoy init" first');
    process.exit(1);
  }

  const entries = fs.readdirSync(shadersDir, { withFileTypes: true });
  const shaders = entries.filter(e => e.isDirectory()).map(e => e.name);

  if (shaders.length === 0) {
    console.log('No shaders found. Run "shadertoy new <name>" to create one.');
    return;
  }

  console.log('Available shaders:');
  shaders.forEach(s => console.log(`  ${s}`));
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

  // Copy template files
  copyDir(templatesDir, cwd);

  console.log(`
✓ Shader collection created!

Structure:
  shaders/
    example-gradient/    Simple animated gradient
    example-buffer/      BufferA feedback example

Next steps:
  npm install
  shadertoy list                    Show all shaders
  shadertoy dev example-gradient    Run a shader
  shadertoy new my-shader           Create a new shader
`);
}

function createNewShader(name) {
  const cwd = process.cwd();
  const shadersDir = path.join(cwd, 'shaders');

  // Check shaders directory exists
  if (!fs.existsSync(shadersDir)) {
    console.error('Error: shaders/ directory not found');
    console.error('Run "shadertoy init" first');
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
  shadertoy dev ${name}
`);
}

function runVite(viteArgs, shaderName) {
  const cwd = process.cwd();

  // Check for vite.config.js
  if (!fs.existsSync(path.join(cwd, 'vite.config.js'))) {
    console.error('Error: vite.config.js not found');
    console.error('Run "shadertoy init" first');
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

// Main command handler
switch (command) {
  case 'init':
    init();
    break;

  case 'new': {
    const name = args[1];
    if (!name) {
      console.error('Error: Specify a shader name');
      console.error('  shadertoy new <name>');
      process.exit(1);
    }
    createNewShader(name);
    break;
  }

  case 'dev': {
    const shaderName = args[1];
    if (!shaderName) {
      console.error('Error: Specify a shader name');
      console.error('  shadertoy dev <shader-name>');
      console.error('  shadertoy list');
      process.exit(1);
    }

    const cwd = process.cwd();
    const shaderPath = path.join(cwd, 'shaders', shaderName);
    if (!fs.existsSync(shaderPath)) {
      console.error(`Error: Shader "${shaderName}" not found`);
      console.error('Run "shadertoy list" to see available shaders');
      process.exit(1);
    }

    console.log(`Starting dev server for "${shaderName}"...`);
    runVite([], shaderName);
    break;
  }

  case 'build': {
    const shaderName = args[1];
    if (!shaderName) {
      console.error('Error: Specify a shader name');
      console.error('  shadertoy build <shader-name>');
      process.exit(1);
    }

    const cwd = process.cwd();
    const shaderPath = path.join(cwd, 'shaders', shaderName);
    if (!fs.existsSync(shaderPath)) {
      console.error(`Error: Shader "${shaderName}" not found`);
      process.exit(1);
    }

    console.log(`Building "${shaderName}"...`);
    runVite(['build'], shaderName);
    break;
  }

  case 'list':
    listShaders(process.cwd());
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
