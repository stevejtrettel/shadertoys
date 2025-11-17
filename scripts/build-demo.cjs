#!/usr/bin/env node

/**
 * Build a specific demo for production
 * Usage: npm run build:demo <demo-name>
 * Example: npm run build:demo keyboard-test
 */

const { execSync } = require('child_process');

const demo = process.argv[2];

if (!demo) {
  console.error('Error: Please specify a demo name');
  console.error('Usage: npm run build:demo <demo-name>');
  console.error('Example: npm run build:demo keyboard-test');
  process.exit(1);
}

console.log(`Building demo: ${demo}`);

try {
  // TypeScript compilation
  console.log('Running TypeScript compiler...');
  execSync('tsc', { stdio: 'inherit' });

  // Vite build with demo environment variable
  console.log(`Building with Vite for demo: ${demo}...`);
  execSync(`vite build`, {
    stdio: 'inherit',
    env: { ...process.env, VITE_DEMO: demo }
  });

  console.log(`✓ Build complete for demo: ${demo}`);
  console.log(`Output: dist/`);
} catch (error) {
  process.exit(error.status || 1);
}
