#!/usr/bin/env node

/**
 * Build all demos in a folder WITH screenshots
 * Usage: npm run build:folder:screenshots <folder-path>
 * Example: npm run build:folder:screenshots lecture/day1
 *
 * Output structure:
 *   dist-embed/lecture/day1/<project>/
 *     embed.js        - compiled shader app
 *     screenshot.png  - rendered screenshot
 *     image.glsl      - copied source
 *     bufferA.glsl    - copied source (if exists)
 *     ...
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

// Try to find Chrome executable
function findChrome() {
  const candidates = [
    // Linux
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    // Windows
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Try 'which' command on Unix
  try {
    const result = execSync('which chromium chromium-browser google-chrome 2>/dev/null', { encoding: 'utf8' });
    const found = result.trim().split('\n')[0];
    if (found && fs.existsSync(found)) {
      return found;
    }
  } catch (e) {
    // Ignore
  }

  return null;
}

const folderArg = process.argv[2];

if (!folderArg) {
  console.error('Error: Please specify a folder path');
  console.error('Usage: npm run build:folder:screenshots <folder-path>');
  console.error('Example: npm run build:folder:screenshots lecture/day1');
  process.exit(1);
}

const chromePath = findChrome();
if (!chromePath) {
  console.error('Error: Could not find Chrome/Chromium installation');
  console.error('Please install Chrome or Chromium, or set CHROME_PATH environment variable');
  process.exit(1);
}
console.log(`Using Chrome: ${chromePath}\n`);

const demosDir = path.join(__dirname, '..', 'demos');
const targetDir = path.join(demosDir, folderArg);
const outputBase = path.join(__dirname, '..', 'dist-embed');
const distDir = path.join(__dirname, '..', 'dist');

// Check folder exists
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

// Helper to wait (replaces deprecated page.waitForTimeout)
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Take screenshot of a built demo
async function takeScreenshot(browser, htmlPath, outputPath, frames = 60) {
  const page = await browser.newPage();

  // Log console errors for debugging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`    Browser error: ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    console.log(`    Page error: ${err.message}`);
  });

  try {
    // Set viewport to match typical shader size
    await page.setViewport({ width: 800, height: 600 });

    // Load the page
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for shader to render some frames
    await sleep(2000 + (frames / 60) * 1000);

    // Find the canvas and screenshot it
    const canvas = await page.$('canvas');
    if (canvas) {
      await canvas.screenshot({ path: outputPath, type: 'png' });
      return true;
    } else {
      // Fallback: screenshot the whole page
      await page.screenshot({ path: outputPath, type: 'png' });
      return true;
    }
  } catch (error) {
    console.error(`    Screenshot error: ${error.message}`);
    return false;
  } finally {
    await page.close();
  }
}

// Main async function
async function main() {
  const demos = findDemos(targetDir);

  if (demos.length === 0) {
    console.error(`Error: No demos found in demos/${folderArg}`);
    process.exit(1);
  }

  console.log(`Found ${demos.length} demo(s) in demos/${folderArg}:\n`);
  demos.forEach(d => console.log(`  - ${d.relativePath}`));
  console.log('');

  // Launch browser once for all screenshots
  console.log('Launching headless browser...\n');
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || chromePath,
    headless: process.env.DEBUG_SCREENSHOTS ? false : 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--allow-file-access-from-files',
      // WebGL support in headless mode
      '--enable-webgl',
      '--enable-webgl2',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
    ]
  });

  let successCount = 0;
  let failCount = 0;
  let screenshotCount = 0;

  try {
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
        const assetsDir = path.join(distDir, 'assets');
        const builtJs = path.join(assetsDir, 'main.js');

        if (fs.existsSync(builtJs)) {
          fs.copyFileSync(builtJs, path.join(outputDir, 'embed.js'));
        }

        // Copy any images from dist/assets
        if (fs.existsSync(assetsDir)) {
          const assets = fs.readdirSync(assetsDir);
          for (const asset of assets) {
            if (/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(asset)) {
              fs.copyFileSync(
                path.join(assetsDir, asset),
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

        // Take screenshot using dist/index.html
        const htmlPath = path.join(distDir, 'index.html');
        const screenshotPath = path.join(outputDir, 'screenshot.png');

        console.log('  Taking screenshot...');
        const screenshotSuccess = await takeScreenshot(browser, htmlPath, screenshotPath);
        if (screenshotSuccess) {
          console.log(`  ✓ Screenshot saved`);
          screenshotCount++;
        }

        console.log(`✓ Output: dist-embed/${demo.relativePath}/`);
        successCount++;

      } catch (error) {
        console.error(`✗ Failed to build ${demo.relativePath}`);
        failCount++;
      }
    }
  } finally {
    await browser.close();
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('Build Summary');
  console.log('='.repeat(60));
  console.log(`  Success: ${successCount}`);
  console.log(`  Screenshots: ${screenshotCount}`);
  console.log(`  Failed:  ${failCount}`);
  console.log(`  Output:  dist-embed/${folderArg}/`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
