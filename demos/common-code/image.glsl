// Common Code - Image Pass
// Displays BufferA with post-processing using shared functions
//
// This demo shows how common.glsl shares code across passes.
// Both BufferA and Image use functions like hsv2rgb, rotate2D, etc.

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Sample the buffer
    vec3 col = texture(iChannel0, uv).rgb;

    // Add some post-processing using shared functions
    vec2 centered = uv - 0.5;

    // Rotate the sampling slightly based on distance from center
    float dist = length(centered);
    float rotAngle = dist * 0.2 * sin(iTime);
    vec2 rotatedUV = rotate2D(centered, rotAngle) + 0.5;

    // Blend original and rotated
    vec3 rotatedCol = texture(iChannel0, rotatedUV).rgb;
    col = mix(col, rotatedCol, 0.3);

    // Add vignette
    float vignette = 1.0 - dist * 0.8;
    col *= vignette;

    // Subtle color grading using hsv2rgb
    vec3 tint = hsv2rgb(vec3(iTime * 0.05, 0.1, 1.0));
    col *= tint;

    fragColor = vec4(col, 1.0);
}
