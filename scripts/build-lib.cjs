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

  // Copy CSS files
  console.log('Copying CSS files...');
  const cssFiles = [
    'src/app/app.css',
    'src/styles/base.css',
    'src/styles/embed.css',
    'src/layouts/default.css',
    'src/layouts/fullscreen.css',
    'src/layouts/split.css',
    'src/layouts/tabbed.css',
    'src/controls/controls.css',
    'src/editor/editor-panel.css',
    'src/editor/prism-editor.css'
  ];

  const appDir = path.join(DIST_LIB, 'app');
  const stylesDir = path.join(DIST_LIB, 'styles');
  const layoutsDir = path.join(DIST_LIB, 'layouts');
  const controlsDir = path.join(DIST_LIB, 'controls');
  const editorDir = path.join(DIST_LIB, 'editor');

  fs.mkdirSync(appDir, { recursive: true });
  fs.mkdirSync(stylesDir, { recursive: true });
  fs.mkdirSync(layoutsDir, { recursive: true });
  fs.mkdirSync(controlsDir, { recursive: true });
  fs.mkdirSync(editorDir, { recursive: true });

  for (const cssFile of cssFiles) {
    const src = path.join(ROOT, cssFile);
    if (fs.existsSync(src)) {
      const destDir = path.dirname(path.join(DIST_LIB, cssFile.replace('src/', '')));
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(src, path.join(DIST_LIB, cssFile.replace('src/', '')));
    }
  }

  // Clean up temporary tsconfig
  fs.unlinkSync(tsconfigPath);

  console.log('✓ Library built successfully to dist-lib/');

} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
