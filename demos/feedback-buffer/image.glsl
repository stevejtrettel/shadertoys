// Feedback Buffer - Image Pass
// Displays the accumulated buffer content
//
// Click and drag to paint. Colors fade over time.
// This demonstrates multi-buffer rendering with ping-pong feedback.

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Read from BufferA
    vec3 col = texture(iChannel0, uv).rgb;

    // Add subtle vignette
    float vignette = 1.0 - 0.3 * length(uv - 0.5);
    col *= vignette;

    fragColor = vec4(col, 1.0);
}
