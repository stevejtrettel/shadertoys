// UBO Static Test — reads a 16-color palette from a UBO set once at startup
// colors[16] is auto-injected by the engine from config.json

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Pick palette index from x position (16 vertical stripes)
    int idx = int(uv.x * 16.0);
    idx = clamp(idx, 0, 15);

    vec4 col = colors[idx];

    // Slight vignette
    float d = length(uv - 0.5);
    col.rgb *= 1.0 - d * 0.4;

    fragColor = col;
}
