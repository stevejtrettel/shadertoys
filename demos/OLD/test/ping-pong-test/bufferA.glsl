// BufferA: Simple decay and addition
// Reads from itself (previous frame) and adds a moving dot

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Read previous frame
    vec4 prev = texture(iChannel0, uv);

    // Decay over time
    vec3 col = prev.rgb * 0.95;

    // Add a moving dot
    vec2 dotPos = 0.5 + 0.3 * vec2(cos(iTime), sin(iTime));
    float dist = length(uv - dotPos);
    col += exp(-dist * 50.0) * vec3(1.0, 0.5, 0.2);

    // Initialize if frame 0
    if (iFrame < 1) {
        col = vec3(0.0);
    }

    fragColor = vec4(col, 1.0);
}
