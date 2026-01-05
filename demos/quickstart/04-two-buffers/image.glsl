// Image: Combine original and blurred versions
// Shows both BufferA (sharp) and BufferB (blurred) side by side

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Get both versions
    vec3 sharp = texture(iChannel0, uv).rgb;   // BufferA - original
    vec3 blurred = texture(iChannel1, uv).rgb; // BufferB - blurred

    // Split screen: left = sharp, right = blurred
    vec3 col = (uv.x < 0.5) ? sharp : blurred;

    // Draw a dividing line
    col += 0.5 * smoothstep(0.003, 0.0, abs(uv.x - 0.5));

    fragColor = vec4(col, 1.0);
}
