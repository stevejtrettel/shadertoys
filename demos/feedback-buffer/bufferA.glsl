// Feedback Buffer - BufferA
// Stores persistent state with fade, draws at mouse position

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Read previous frame with slight fade
    vec4 prev = texture(iChannel0, uv) * 0.98;

    // Draw a spot at mouse position when clicked
    if (iMouse.z > 0.0) {
        vec2 mouse = iMouse.xy / iResolution.xy;
        float d = length(uv - mouse);
        float spot = smoothstep(0.05, 0.0, d);

        // Color based on time
        vec3 col = 0.5 + 0.5 * cos(iTime * 2.0 + vec3(0, 2, 4));
        prev.rgb = max(prev.rgb, col * spot);
    }

    fragColor = prev;
}
