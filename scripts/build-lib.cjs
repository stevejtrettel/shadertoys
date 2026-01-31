#!/usr/bin/env node

/**
 * Build the library for distribution as an npm package
 * This compiles TypeScript and bundles everything needed for users to import
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST_LIB = path.join(ROOT, 'dist-lib');

console.log('Building library for distribution...');

try {
  // Clean dist-lib
  if (fs.existsSync(DIST_LIB)) {
    fs.rmSync(DIST_LIB, { recursive: true });
  }
  fs.mkdirSync(DIST_LIB, { recursive: true });

  // Create tsconfig for library build
  const libTsConfig = {
    compilerOptions: {
      target: "ES2020",
      module: "ESNext",
      moduleResolution: "bundler",
      declaration: true,
      declarationMap: true,
      outDir: "./dist-lib",
      rootDir: "./src",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      resolveJsonModule: true
    },
    include: ["src/**/*"],
    exclude: ["src/project/generatedLoader.ts"]
  };

  const tsconfigPath = path.join(ROOT, 'tsconfig.lib.json');
  fs.writeFileSync(tsconfigPath, JSON.stringify(libTsConfig, null, 2));

  // Compile TypeScript
  console.log('Compiling TypeScript...');
  execSync('npx tsc -p tsconfig.lib.json', {
    cwd: ROOT,
    stdio: 'inherit'
  });

  // Copy all CSS files from src/ to dist-lib/, preserving directory structure
  console.log('Copying CSS files...');
  const srcDir = path.join(ROOT, 'src');

  function findCssFiles(dir) {
    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findCssFiles(fullPath));
      } else if (entry.name.endsWith('.css')) {
        results.push(fullPath);
      }
    }
    return results;
  }

  const cssFiles = findCssFiles(srcDir);
  for (const cssFile of cssFiles) {
    const relativePath = path.relative(srcDir, cssFile);
    const destPath = path.join(DIST_LIB, relativePath);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(cssFile, destPath);
  }

  // Clean up temporary tsconfig
  fs.unlinkSync(tsconfigPath);

  console.log('✓ Library built successfully to dist-lib/');

} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
