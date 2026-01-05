// BufferB: Apply a blur effect to BufferA
// Reads BufferA and applies a simple box blur

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Simple 5x5 box blur
    vec3 col = vec3(0.0);
    float total = 0.0;

    for (float x = -2.0; x <= 2.0; x++) {
        for (float y = -2.0; y <= 2.0; y++) {
            vec2 offset = vec2(x, y) / iResolution.xy * 3.0;
            col += texture(iChannel0, uv + offset).rgb;
            total += 1.0;
        }
    }
    col /= total;

    fragColor = vec4(col, 1.0);
}
