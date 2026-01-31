// BufferA: Persistent particle simulation
// Reads its previous frame to maintain particle state

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Read previous frame
    vec4 prev = texture(iChannel0, uv);

    // Fade previous frame
    vec3 col = prev.rgb * 0.97;

    // Spawn particles at mouse position when clicking
    if (iMouse.z > 0.0) {
        vec2 mouseUV = iMouse.xy / iResolution.xy;
        float dist = length(uv - mouseUV);

        // Random offset for particle spray
        vec2 offset = hash22(uv + iTime) - 0.5;
        float spawnDist = length(offset) * 0.05;

        if (dist < 0.02 + spawnDist) {
            // Use shared hsv2rgb from common.glsl
            col = hsv2rgb(vec3(iTime * 0.1 + hash21(uv), 0.8, 1.0));
        }
    }

    // Clear on first frame
    if (iFrame < 1) col = vec3(0.0);

    fragColor = vec4(col, 1.0);
}
