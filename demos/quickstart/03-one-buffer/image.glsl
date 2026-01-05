// Image: Display what BufferA rendered
// This is the final output that gets shown on screen

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Just pass through BufferA's output
    fragColor = texture(iChannel0, uv);
}
