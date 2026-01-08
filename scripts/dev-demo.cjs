#!/usr/bin/env node

/**
 * Development server for a specific demo
 * Usage: npm run dev:demo <demo-name>
 * Example: npm run dev:demo keyboard-test
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const demo = process.argv[2];

if (!demo) {
  console.error('Error: Please specify a demo name');
  console.error('Usage: npm run dev:demo <demo-name>');
  console.error('Example: npm run dev:demo keyboard-test');
  process.exit(1);
}

console.log(`Starting dev server for demo: ${demo}`);

// Check if editor mode is enabled in config.json
let editorEnabled = false;
const configPath = path.join(__dirname, '..', 'demos', demo, 'config.json');
if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    editorEnabled = config.editor === true;
  } catch (e) {
    // Ignore config read errors
  }
}
console.log(`Editor mode: ${editorEnabled ? 'enabled' : 'disabled'}`);

try {
  // Generate tiny loader with literal paths for this demo only
  console.log(`Generating loader for demo: ${demo}...`);
  const loaderContent = `// Auto-generated - DO NOT EDIT
import { loadDemo } from './loaderHelper';
import { ShadertoyConfig } from './types';

export const DEMO_NAME = '${demo}';

export async function loadDemoProject() {
  const glslFiles = import.meta.glob<string>('/demos/${demo}/**/*.glsl', {
    query: '?raw',
    import: 'default',
  });

  const jsonFiles = import.meta.glob<ShadertoyConfig>('/demos/${demo}/**/*.json', {
    import: 'default',
  });

  const imageFiles = import.meta.glob<string>('/demos/${demo}/**/*.{jpg,jpeg,png,gif,webp,bmp}', {
    query: '?url',
    import: 'default',
  });

  return loadDemo(DEMO_NAME, glslFiles, jsonFiles, imageFiles);
}
`;

  fs.writeFileSync('src/project/generatedLoader.ts', loaderContent);

  execSync(`npx vite`, {
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_DEMO: demo,
      VITE_EDITOR_ENABLED: editorEnabled ? 'true' : 'false'
    }
  });
} catch (error) {
  process.exit(error.status || 1);
}
