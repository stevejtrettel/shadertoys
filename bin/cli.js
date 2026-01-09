#!/usr/bin/env node

/**
 * Shadertoy Runner CLI
 * Commands:
 *   shadertoy init [template]     - Create a new shader project
 *   shadertoy dev [shader-name]   - Start development server
 *   shadertoy build [shader-name] - Build for production
 *   shadertoy list                - List available shaders (collection only)
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
  shadertoy init [template]     Create a new shader project
  shadertoy dev [shader-name]   Start development server
  shadertoy build [shader-name] Build for production
  shadertoy list                List available shaders (collection projects)

Templates:
  basic       Single image shader (default)
  buffer      Image shader with BufferA
  collection  Multiple shaders in one project

Examples:
  shadertoy init                 Create project with basic template
  shadertoy init collection      Create a shader collection
  shadertoy dev                  Start dev server
  shadertoy dev my-shader        Start dev server for specific shader
  shadertoy build                Build to ./dist folder
  shadertoy list                 Show all shaders in collection
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

function isCollectionProject(cwd) {
  const shadersDir = path.join(cwd, 'shaders');
  if (!fs.existsSync(shadersDir)) return false;

  // Check if shaders/ contains subdirectories (collection) vs files (single)
  const entries = fs.readdirSync(shadersDir, { withFileTypes: true });
  return entries.some(e => e.isDirectory());
}

function listShaders(cwd) {
  const shadersDir = path.join(cwd, 'shaders');
  if (!fs.existsSync(shadersDir)) {
    console.error('Error: shaders/ directory not found');
    process.exit(1);
  }

  const entries = fs.readdirSync(shadersDir, { withFileTypes: true });
  const shaders = entries.filter(e => e.isDirectory()).map(e => e.name);

  if (shaders.length === 0) {
    console.log('No shaders found. Create a folder in shaders/ with image.glsl');
    return;
  }

  console.log('Available shaders:');
  shaders.forEach(s => console.log(`  ${s}`));
}

async function init(template = 'basic') {
  const cwd = process.cwd();
  const templatesDir = path.join(packageRoot, 'templates');
  const templatePath = path.join(templatesDir, template);

  if (!fs.existsSync(templatePath)) {
    console.error(`Error: Template "${template}" not found`);
    console.error(`Available templates: basic, buffer, collection`);
    process.exit(1);
  }

  // Check if directory already has shader files
  const shaderDir = path.join(cwd, 'shaders');
  if (fs.existsSync(shaderDir)) {
    console.error('Error: shaders/ directory already exists');
    process.exit(1);
  }

  console.log(`Creating shader project with "${template}" template...`);

  // Copy template files
  copyDir(templatePath, cwd);

  if (template === 'collection') {
    console.log(`
✓ Shader collection created!

Structure:
  shaders/
    example-gradient/    - Simple animated gradient
    example-buffer/      - BufferA feedback example

Usage:
  npm install
  shadertoy dev example-gradient    Run a specific shader
  shadertoy list                    Show all shaders
  shadertoy build example-gradient  Build a specific shader

To add a new shader:
  1. Create shaders/my-shader/
  2. Add image.glsl (required)
  3. Add config.json, bufferA.glsl, common.glsl as needed
`);
  } else {
    console.log(`
✓ Project created!

Files created:
  shaders/image.glsl    - Main shader${template === 'buffer' ? '\n  shaders/bufferA.glsl  - Buffer A shader' : ''}
  shaders/config.json   - Shader configuration
  vite.config.js        - Vite configuration
  index.html            - Entry point

Next steps:
  1. npm install         (or: npm install vite shadertoy-runner)
  2. shadertoy dev       Start development server
  3. Edit shaders/image.glsl and see live updates!
`);
  }
}

function runVite(viteArgs, shaderName) {
  const cwd = process.cwd();

  // Check for vite.config.js
  if (!fs.existsSync(path.join(cwd, 'vite.config.js'))) {
    console.error('Error: vite.config.js not found');
    console.error('Run "shadertoy init" first to create a project');
    process.exit(1);
  }

  // Find vite binary
  const viteBin = path.join(cwd, 'node_modules', '.bin', 'vite');
  const viteExists = fs.existsSync(viteBin);

  if (!viteExists) {
    console.error('Error: vite not found in node_modules');
    console.error('Run "npm install" first');
    process.exit(1);
  }

  // Set environment for shader name
  const env = { ...process.env };
  if (shaderName) {
    env.SHADER_NAME = shaderName;
  }

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
    init(args[1]);
    break;

  case 'dev': {
    const shaderName = args[1];
    const cwd = process.cwd();

    if (shaderName) {
      // Verify shader exists
      const shaderPath = path.join(cwd, 'shaders', shaderName);
      if (!fs.existsSync(shaderPath)) {
        console.error(`Error: Shader "${shaderName}" not found`);
        console.error(`Run "shadertoy list" to see available shaders`);
        process.exit(1);
      }
      console.log(`Starting development server for "${shaderName}"...`);
    } else if (isCollectionProject(cwd)) {
      console.error('Error: This is a collection project. Specify a shader name:');
      console.error('  shadertoy dev <shader-name>');
      console.error('  shadertoy list');
      process.exit(1);
    } else {
      console.log('Starting development server...');
    }

    runVite([], shaderName);
    break;
  }

  case 'build': {
    const shaderName = args[1];
    const cwd = process.cwd();

    if (shaderName) {
      const shaderPath = path.join(cwd, 'shaders', shaderName);
      if (!fs.existsSync(shaderPath)) {
        console.error(`Error: Shader "${shaderName}" not found`);
        process.exit(1);
      }
      console.log(`Building "${shaderName}" for production...`);
    } else if (isCollectionProject(cwd)) {
      console.error('Error: This is a collection project. Specify a shader name:');
      console.error('  shadertoy build <shader-name>');
      process.exit(1);
    } else {
      console.log('Building for production...');
    }

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
