// Same shader as 01, but with a config file for metadata and controls
// Run: npm run dev:demo quickstart/02-with-config

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Correct for aspect ratio so circles aren't stretched
    float aspect = iResolution.x / iResolution.y;
    vec2 p = uv;
    p.x *= aspect;

    // Mouse position with same aspect correction
    vec2 mouse = iMouse.xy / iResolution.xy;
    mouse.x *= aspect;

    // Draw a circle that follows the mouse
    float dist = length(p - mouse);

    // Smooth circle with animated color
    vec3 col = smoothstep(0.15, 0.14, dist) * (0.5 + 0.5 * sin(iTime + vec3(0, 2, 4)));

    // Add a subtle background gradient
    col += 0.1 * vec3(uv.x, uv.y, 0.5);

    fragColor = vec4(col, 1.0);
}
