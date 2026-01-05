// Image: Uses shared palette function from common.glsl
// Reads the distance field from BufferA and applies colors

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Read distance field from BufferA
    float d = texture(iChannel0, uv).r;

    // Use the shared palette function for coloring
    vec3 col = palette(d * 2.0 + iTime * 0.2);

    // Make the metaballs solid with a glow
    col *= smoothstep(0.02, -0.02, d);
    col += 0.3 * palette(d * 3.0) * exp(-abs(d) * 20.0);

    fragColor = vec4(col, 1.0);
}
