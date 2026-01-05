// BufferA: Render the source pattern
// This creates the base image that BufferB will process

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Center and correct aspect ratio
    vec2 p = uv - 0.5;
    p.x *= iResolution.x / iResolution.y;

    // Create a pattern of circles
    vec3 col = vec3(0.0);

    for (float i = 0.0; i < 5.0; i++) {
        float angle = iTime + i * 1.256;
        vec2 center = 0.25 * vec2(cos(angle), sin(angle));
        float dist = length(p - center);
        col += 0.5 * smoothstep(0.08, 0.07, dist) * (0.5 + 0.5 * sin(iTime + i + vec3(0, 2, 4)));
    }

    fragColor = vec4(col, 1.0);
}
