#!/usr/bin/env node

/**
 * Development server for a specific demo
 * Usage: npm run dev:demo <demo-name>
 * Example: npm run dev:demo keyboard-test
 */

const { execSync } = require('child_process');

const demo = process.argv[2];

if (!demo) {
  console.error('Error: Please specify a demo name');
  console.error('Usage: npm run dev:demo <demo-name>');
  console.error('Example: npm run dev:demo keyboard-test');
  process.exit(1);
}

console.log(`Starting dev server for demo: ${demo}`);

try {
  execSync(`VITE_DEMO=${demo} vite`, {
    stdio: 'inherit',
    env: { ...process.env, VITE_DEMO: demo }
  });
} catch (error) {
  process.exit(error.status || 1);
}
