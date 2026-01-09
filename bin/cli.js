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
  shader build <shader-name> Build for production
  shader list                List available shaders

Examples:
  shader create my-shaders   Create a new project with everything set up
  shader new my-shader       Create shaders/my-shader/
  shader dev my-shader       Run shader in dev mode
  shader build my-shader     Build shader to dist/
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

function listShaders(cwd) {
  const shadersDir = path.join(cwd, 'shaders');
  if (!fs.existsSync(shadersDir)) {
    console.error('Error: shaders/ directory not found');
    console.error('Run "shader init" first');
    process.exit(1);
  }

  const entries = fs.readdirSync(shadersDir, { withFileTypes: true });
  const shaders = entries.filter(e => e.isDirectory()).map(e => e.name);

  if (shaders.length === 0) {
    console.log('No shaders found. Run "shader new <name>" to create one.');
    return;
  }

  console.log('Available shaders:');
  shaders.forEach(s => console.log(`  ${s}`));
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
      'shader-sandbox': '^0.1.0',
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
    if (!shaderName) {
      console.error('Error: Specify a shader name');
      console.error('  shader dev <shader-name>');
      console.error('  shader list');
      process.exit(1);
    }

    const cwd = process.cwd();
    const shaderPath = path.join(cwd, 'shaders', shaderName);
    if (!fs.existsSync(shaderPath)) {
      console.error(`Error: Shader "${shaderName}" not found`);
      console.error('Run "shader list" to see available shaders');
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
      console.error('  shader build <shader-name>');
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
