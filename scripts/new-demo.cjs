#!/usr/bin/env node

/**
 * Create a new shader demo project
 *
 * Usage:
 *   npm run new <name>         # Simple single-pass shader
 *   npm run new <name> <n>     # Shader with N buffers (1-4)
 *
 * When using buffers, all buffers are available to all passes:
 *   - BufferA = iChannel0, BufferB = iChannel1, etc.
 *   - Each buffer reads its own previous frame for feedback
 *   - Image pass reads all buffers
 *
 * Examples:
 *   npm run new my-shader           # Just image.glsl
 *   npm run new trail-effect 1      # Feedback effect (BufferA + Image)
 *   npm run new fluid-sim 2         # Two interacting buffers
 */

const fs = require('fs');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);
const name = args[0];
const bufferCount = args[1] ? parseInt(args[1], 10) : 0;

function showUsage() {
  console.error('Create a new shader project\n');
  console.error('Usage:');
  console.error('  npm run new <name>         # Simple single-pass shader');
  console.error('  npm run new <name> <n>     # Shader with N buffers (1-4)\n');
  console.error('When using buffers, all buffers are available to all passes:');
  console.error('  BufferA = iChannel0, BufferB = iChannel1, BufferC = iChannel2, BufferD = iChannel3');
  console.error('  Each buffer reads its own previous frame for feedback effects\n');
  console.error('Examples:');
  console.error('  npm run new my-shader           # Just image.glsl');
  console.error('  npm run new trail-effect 1      # Feedback effect (BufferA + Image)');
  console.error('  npm run new fluid-sim 2         # Two interacting buffers');
  process.exit(1);
}

if (!name) {
  console.error('Error: Please specify a project name\n');
  showUsage();
}

// Validate name
if (!/^[a-z0-9-]+$/.test(name)) {
  console.error('Error: Name must be lowercase letters, numbers, and hyphens only');
  console.error('Example: my-cool-shader');
  process.exit(1);
}

// Validate buffer count
if (args[1] && (isNaN(bufferCount) || bufferCount < 1 || bufferCount > 4)) {
  console.error('Error: Buffer count must be between 1 and 4');
  process.exit(1);
}

const demoDir = path.join(process.cwd(), 'demos', name);

// Check if already exists
if (fs.existsSync(demoDir)) {
  console.error(`Error: Demo '${name}' already exists at demos/${name}/`);
  process.exit(1);
}

// Create directory
fs.mkdirSync(demoDir, { recursive: true });

// Generate title from name
const title = name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

// Channel names for comments
const channelNames = ['iChannel0', 'iChannel1', 'iChannel2', 'iChannel3'];
const bufferNames = ['BufferA', 'BufferB', 'BufferC', 'BufferD'];

// Templates
const templates = {
  simpleImage: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Normalized coordinates (0 to 1)
    vec2 uv = fragCoord / iResolution.xy;

    // Center the coordinates (-0.5 to 0.5)
    vec2 p = uv - 0.5;
    p.x *= iResolution.x / iResolution.y; // Aspect ratio correction

    // Animated color gradient
    vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0, 2, 4));

    // Add a circle
    float d = length(p);
    float circle = smoothstep(0.3, 0.29, d);
    col = mix(col, vec3(1.0), circle * 0.5);

    fragColor = vec4(col, 1.0);
}
`,

  buffer: (index, total) => {
    // Shadertoy execution order: BufferA → BufferB → BufferC → BufferD → Image
    // - Self or later buffer = previous frame
    // - Earlier buffer = current frame
    const channelComments = [];
    for (let i = 0; i < total; i++) {
      const isPrevious = i >= index;
      const note = i === index ? ' (self, previous frame)' : isPrevious ? ' (previous frame)' : ' (current frame)';
      channelComments.push(`//   ${channelNames[i]} = ${bufferNames[i]}${note}`);
    }

    if (index === 0) {
      // First buffer: feedback trail effect
      return `// Buffer${bufferNames[index].charAt(6)} - Available channels:
${channelComments.join('\n')}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Read previous frame with slight fade (creates trails)
    vec4 prev = texture(iChannel0, uv) * 0.98;

    // Draw at mouse position
    vec2 mouse = iMouse.xy / iResolution.xy;
    float d = length(uv - mouse);
    float spot = smoothstep(0.05, 0.0, d);

    // Rainbow color based on time
    vec3 col = 0.5 + 0.5 * cos(iTime * 2.0 + uv.xyx * 3.0 + vec3(0, 2, 4));

    // Combine previous frame with new content
    fragColor = prev + vec4(col * spot, 1.0);
}
`;
    } else {
      // Subsequent buffers: process previous buffer
      return `// Buffer${bufferNames[index].charAt(6)} - Available channels:
${channelComments.join('\n')}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Read from Buffer${bufferNames[index - 1].charAt(6)} (${channelNames[index - 1]})
    vec4 prev = texture(${channelNames[index - 1]}, uv);

    // Example: apply a simple effect
    vec3 col = prev.rgb;

    // Simple blur using neighboring pixels
    vec2 texel = 1.0 / iResolution.xy;
    col += texture(${channelNames[index - 1]}, uv + texel * vec2(1, 0)).rgb;
    col += texture(${channelNames[index - 1]}, uv + texel * vec2(-1, 0)).rgb;
    col += texture(${channelNames[index - 1]}, uv + texel * vec2(0, 1)).rgb;
    col += texture(${channelNames[index - 1]}, uv + texel * vec2(0, -1)).rgb;
    col /= 5.0;

    fragColor = vec4(col, 1.0);
}
`;
    }
  },

  imageWithBuffers: (total) => {
    const channelComments = [];
    for (let i = 0; i < total; i++) {
      channelComments.push(`//   ${channelNames[i]} = ${bufferNames[i]}`);
    }

    // Read from the last buffer by default
    const lastChannel = channelNames[total - 1];

    return `// Image (final output) - Available channels:
${channelComments.join('\n')}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Read from final buffer
    vec4 buf = texture(${lastChannel}, uv);

    // Output with color grading
    vec3 col = buf.rgb;
    col = pow(col, vec3(0.95)); // Slight gamma adjustment

    fragColor = vec4(col, 1.0);
}
`;
  },
};

// Determine what to create
let files = [];
let config = null;

if (bufferCount > 0) {
  // Multi-buffer mode: all buffers available to all passes
  const activeBuffers = bufferNames.slice(0, bufferCount);

  // Create buffer files
  files = activeBuffers.map((bufName, i) => ({
    name: `buffer${bufName.charAt(6)}.glsl`,
    content: templates.buffer(i, bufferCount)
  }));

  // Create image file
  files.push({
    name: 'image.glsl',
    content: templates.imageWithBuffers(bufferCount)
  });

  // Build config where all buffers are available to all passes
  // Shadertoy execution order: BufferA → BufferB → BufferC → BufferD → Image
  // - Self-reference (i === j): always previous frame (ping-pong)
  // - Reading buffer that runs BEFORE you (j < i): current frame
  // - Reading buffer that runs AFTER you (j > i): previous frame
  const passes = {};

  activeBuffers.forEach((bufName, i) => {
    const channels = {};
    activeBuffers.forEach((otherBuf, j) => {
      const needsPrevious = j >= i; // self or runs after = previous frame
      channels[channelNames[j]] = {
        buffer: otherBuf,
        ...(needsPrevious ? { previous: true } : {})
      };
    });
    passes[bufName] = { channels };
  });

  // Image pass reads all buffers (current frame)
  const imageChannels = {};
  activeBuffers.forEach((bufName, i) => {
    imageChannels[channelNames[i]] = { buffer: bufName };
  });
  passes.Image = { channels: imageChannels };

  config = {
    meta: { title },
    controls: true,
    passes
  };
} else {
  // Simple mode: just image.glsl
  files = [
    { name: 'image.glsl', content: templates.simpleImage }
  ];
}

// Write files
files.forEach(file => {
  const filePath = path.join(demoDir, file.name);
  fs.writeFileSync(filePath, file.content);
  console.log(`  Created ${file.name}`);
});

if (config) {
  const configPath = path.join(demoDir, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  console.log(`  Created config.json`);
}

console.log(`\n✓ Created demos/${name}/\n`);
console.log('To run your shader:');
console.log(`  npm run dev:demo ${name}\n`);
