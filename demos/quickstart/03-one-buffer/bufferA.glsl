// BufferA: Creates a feedback effect by reading its own previous frame
// This creates trails that fade over time

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Read what we drew last frame (from iChannel0)
    vec3 prev = texture(iChannel0, uv).rgb;

    // Fade it out slowly (95% of previous brightness)
    vec3 col = prev * 0.95;

    // Add a moving dot that leaves trails
    vec2 dotPos = 0.5 + 0.3 * vec2(cos(iTime), sin(iTime * 0.7));
    float dist = length(uv - dotPos);
    col += exp(-dist * 40.0) * vec3(1.0, 0.5, 0.2);

    // Clear on first frame
    if (iFrame < 1) {
        col = vec3(0.0);
    }

    fragColor = vec4(col, 1.0);
}
