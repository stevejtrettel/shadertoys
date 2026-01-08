#!/usr/bin/env node

/**
 * Shadertoy Runner CLI
 * Commands:
 *   shadertoy init [template]  - Create a new shader project
 *   shadertoy dev              - Start development server
 *   shadertoy build            - Build for production
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
  shadertoy init [template]   Create a new shader project
  shadertoy dev               Start development server
  shadertoy build             Build for production

Templates:
  basic    Single image shader (default)
  buffer   Image shader with BufferA

Examples:
  shadertoy init              Create project with basic template
  shadertoy init buffer       Create project with buffer template
  shadertoy dev               Start dev server on port 3000
  shadertoy build             Build to ./dist folder
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

async function init(template = 'basic') {
  const cwd = process.cwd();
  const templatesDir = path.join(packageRoot, 'templates');
  const templatePath = path.join(templatesDir, template);

  if (!fs.existsSync(templatePath)) {
    console.error(`Error: Template "${template}" not found`);
    console.error(`Available templates: basic, buffer`);
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

function runVite(args) {
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

  const child = spawn(viteBin, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32'
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

  case 'dev':
    console.log('Starting development server...');
    runVite([]);
    break;

  case 'build':
    console.log('Building for production...');
    runVite(['build']);
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
