// BufferA: Uses shared functions from common.glsl
// Draws metaballs using the sdCircle and smin functions

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Center and correct aspect ratio
    vec2 p = uv - 0.5;
    p.x *= iResolution.x / iResolution.y;

    // Create several moving circles and blend them together
    float d = 1.0;
    for (float i = 0.0; i < 4.0; i++) {
        float angle = iTime * (0.5 + i * 0.1) + i * PI * 0.5;
        vec2 center = 0.2 * vec2(cos(angle), sin(angle * 1.3));

        // Use the shared sdCircle function
        float circle = sdCircle(p - center, 0.1);

        // Use the shared smin for smooth blending
        d = smin(d, circle, 0.15);
    }

    // Output the distance field (will be colored in Image pass)
    fragColor = vec4(vec3(d), 1.0);
}
