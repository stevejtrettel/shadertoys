#!/usr/bin/env node

/**
 * Build all demos in a folder
 * Usage: npm run build:embed:folder <folder-path>
 * Example: npm run build:embed:folder course/day1
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const folderArg = process.argv[2];

if (!folderArg) {
  console.error('Usage: npm run build:embed:folder <folder-path>');
  console.error('Example: npm run build:embed:folder course/day1');
  process.exit(1);
}

const demosDir = path.join(__dirname, '..', 'demos');
const targetDir = path.join(demosDir, folderArg);

if (!fs.existsSync(targetDir)) {
  console.error(`Error: Folder not found: demos/${folderArg}`);
  process.exit(1);
}

// Find all demo subdirectories
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
        demos.push(...findDemos(subdir));
      }
    }
  }

  return demos;
}

const demos = findDemos(targetDir);

if (demos.length === 0) {
  console.error(`Error: No demos found in demos/${folderArg}`);
  process.exit(1);
}

console.log(`Found ${demos.length} demo(s) in demos/${folderArg}:\n`);
demos.forEach(d => console.log(`  - ${d.relativePath}`));
console.log('');

let successCount = 0;
let failCount = 0;

for (const demo of demos) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Building: ${demo.relativePath}`);
  console.log('='.repeat(60));

  try {
    // Use the single-demo build script
    execSync(`npm run build:embed "${demo.relativePath}"`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });

    // Copy GLSL source files to output
    const outputDir = path.join(__dirname, '..', 'dist-embed', demo.relativePath);
    const glslFiles = fs.readdirSync(demo.path).filter(f => f.endsWith('.glsl'));
    for (const glslFile of glslFiles) {
      fs.copyFileSync(
        path.join(demo.path, glslFile),
        path.join(outputDir, glslFile)
      );
    }

    console.log(`✓ Output: dist-embed/${demo.relativePath}/`);
    successCount++;

  } catch (error) {
    console.error(`✗ Failed: ${demo.relativePath}`);
    failCount++;
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`Done: ${successCount} succeeded, ${failCount} failed`);
console.log(`Output: dist-embed/${folderArg}/`);
