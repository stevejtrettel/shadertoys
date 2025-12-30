#!/usr/bin/env node

/**
 * Build all demos in a folder
 * Usage: npm run build:folder <folder-path>
 * Example: npm run build:folder lecture/day1
 *
 * Output structure:
 *   demo-embed/lecture/day1/<project>/
 *     embed.js       - compiled shader app
 *     image.glsl     - copied source
 *     bufferA.glsl   - copied source (if exists)
 *     common.glsl    - copied source (if exists)
 *     ...
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const folderArg = process.argv[2];

if (!folderArg) {
  console.error('Error: Please specify a folder path');
  console.error('Usage: npm run build:folder <folder-path>');
  console.error('Example: npm run build:folder lecture/day1');
  process.exit(1);
}

const demosDir = path.join(__dirname, '..', 'demos');
const targetDir = path.join(demosDir, folderArg);
const outputBase = path.join(__dirname, '..', 'demo-embed');

// Check folder exists
if (!fs.existsSync(targetDir)) {
  console.error(`Error: Folder not found: demos/${folderArg}`);
  process.exit(1);
}

// Find all demo subdirectories (those containing image.glsl or shadertoy.config.json)
function findDemos(dir) {
  const demos = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subdir = path.join(dir, entry.name);
      const hasImageGlsl = fs.existsSync(path.join(subdir, 'image.glsl'));
      const hasConfig = fs.existsSync(path.join(subdir, 'shadertoy.config.json'));

      if (hasImageGlsl || hasConfig) {
        demos.push({
          name: entry.name,
          path: subdir,
          relativePath: path.relative(demosDir, subdir)
        });
      } else {
        // Recurse into subdirectories
        demos.push(...findDemos(subdir));
      }
    }
  }

  return demos;
}

const demos = findDemos(targetDir);

if (demos.length === 0) {
  console.error(`Error: No demos found in demos/${folderArg}`);
  console.error('Demos must contain image.glsl or shadertoy.config.json');
  process.exit(1);
}

console.log(`Found ${demos.length} demo(s) in demos/${folderArg}:\n`);
demos.forEach(d => console.log(`  - ${d.relativePath}`));
console.log('');

// Build each demo
let successCount = 0;
let failCount = 0;

for (const demo of demos) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Building: ${demo.relativePath}`);
  console.log('='.repeat(60));

  try {
    // Run the existing build:demo script
    execSync(`node scripts/build-demo.cjs "${demo.relativePath}"`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });

    // Create output directory
    const outputDir = path.join(outputBase, demo.relativePath);
    fs.mkdirSync(outputDir, { recursive: true });

    // Move the built JS file
    const distDir = path.join(__dirname, '..', 'dist', 'assets');
    const builtJs = path.join(distDir, 'main.js');

    if (fs.existsSync(builtJs)) {
      fs.copyFileSync(builtJs, path.join(outputDir, 'embed.js'));
    }

    // Copy any images from dist/assets
    if (fs.existsSync(distDir)) {
      const assets = fs.readdirSync(distDir);
      for (const asset of assets) {
        if (/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(asset)) {
          fs.copyFileSync(
            path.join(distDir, asset),
            path.join(outputDir, asset)
          );
        }
      }
    }

    // Copy GLSL source files
    const glslFiles = fs.readdirSync(demo.path).filter(f => f.endsWith('.glsl'));
    for (const glslFile of glslFiles) {
      fs.copyFileSync(
        path.join(demo.path, glslFile),
        path.join(outputDir, glslFile)
      );
    }

    // Copy config if exists
    const configFile = path.join(demo.path, 'shadertoy.config.json');
    if (fs.existsSync(configFile)) {
      fs.copyFileSync(configFile, path.join(outputDir, 'shadertoy.config.json'));
    }

    console.log(`✓ Output: demo-embed/${demo.relativePath}/`);
    successCount++;

  } catch (error) {
    console.error(`✗ Failed to build ${demo.relativePath}`);
    failCount++;
  }
}

// Summary
console.log(`\n${'='.repeat(60)}`);
console.log('Build Summary');
console.log('='.repeat(60));
console.log(`  Success: ${successCount}`);
console.log(`  Failed:  ${failCount}`);
console.log(`  Output:  demo-embed/${folderArg}/`);
