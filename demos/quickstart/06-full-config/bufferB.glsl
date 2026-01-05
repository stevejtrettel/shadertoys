// BufferB: Post-processing - add bloom effect
// Reads from BufferA and applies a glow

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Sample BufferA with blur for bloom
    vec3 col = vec3(0.0);
    float total = 0.0;

    // 9-tap Gaussian-ish blur
    for (float x = -1.0; x <= 1.0; x++) {
        for (float y = -1.0; y <= 1.0; y++) {
            vec2 offset = vec2(x, y) / iResolution.xy * 8.0;
            float weight = 1.0 / (1.0 + length(vec2(x, y)));
            col += texture(iChannel0, uv + offset).rgb * weight;
            total += weight;
        }
    }
    col /= total;

    fragColor = vec4(col, 1.0);
}
