# Hello Shader

This is a simple gradient shader that demonstrates the basic structure of a Shadertoy-compatible shader.

## How it works

The shader creates a smooth gradient based on the UV coordinates:

- **Red channel**: Horizontal position (left to right)
- **Green channel**: Vertical position (bottom to top)
- **Blue channel**: Animated using `sin(iTime)`

## Key concepts

1. `gl_FragCoord` - The pixel coordinates
2. `iResolution` - The viewport resolution
3. `iTime` - Time in seconds since start

> This shader runs entirely on the GPU, computing the color for each pixel in parallel.

## Try modifying

- Change the color channels
- Add more complex math functions
- Use `iMouse` for interactivity
