// Common Code - Buffer A
// Uses shared functions from common.glsl to create animated metaballs

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec2 p = (uv - 0.5) * 2.0;
    p.x *= iResolution.x / iResolution.y;

    // Previous frame with fade (using feedback)
    vec4 prev = texture(iChannel0, uv) * 0.95;

    // Create animated metaballs using shared functions
    float d = 1000.0;

    for (int i = 0; i < 5; i++) {
        float fi = float(i);
        float angle = iTime * (0.5 + fi * 0.1) + fi * TAU / 5.0;
        float radius = 0.3 + 0.2 * sin(iTime * 0.7 + fi);

        // Use rotate2D from common.glsl
        vec2 pos = rotate2D(vec2(radius, 0.0), angle);

        // Use sdCircle and smin from common.glsl
        float circle = sdCircle(p - pos, 0.15);
        d = smin(d, circle, 0.3);
    }

    // Color using hsv2rgb from common.glsl
    float hue = fract(iTime * 0.1 + d * 0.5);
    vec3 col = hsv2rgb(vec3(hue, 0.8, 0.9));

    // Only draw where metaballs are
    float mask = smoothstep(0.1, -0.1, d);
    col *= mask;

    // Blend with previous frame
    col = max(col, prev.rgb);

    fragColor = vec4(col, 1.0);
}
