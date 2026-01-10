// Uniform Controls Test Shader
// Adjust the sliders in the Uniforms tab to change the animation!

// Custom uniforms - must be declared here
uniform float uSpeed;
uniform float uScale;
uniform float uBrightness;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord / iResolution.xy;

    // Center the coordinates
    vec2 p = uv - 0.5;

    // Apply scale to pattern
    p *= uScale;

    // Create an animated pattern using the speed uniform
    float t = iTime * uSpeed;

    // Interesting pattern with rings and waves
    float d = length(p);
    float angle = atan(p.y, p.x);

    float pattern = sin(d * 10.0 - t) * 0.5 + 0.5;
    pattern *= sin(angle * 6.0 + t * 0.5) * 0.5 + 0.5;

    // Create colorful output
    vec3 col = vec3(
        sin(pattern * 3.14159 + 0.0) * 0.5 + 0.5,
        sin(pattern * 3.14159 + 2.094) * 0.5 + 0.5,
        sin(pattern * 3.14159 + 4.188) * 0.5 + 0.5
    );

    // Apply brightness
    col *= uBrightness + 0.5;

    // Output to screen
    fragColor = vec4(col, 1.0);
}
