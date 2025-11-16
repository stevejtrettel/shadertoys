// Image: Display BufferA

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Just display BufferA
    vec3 col = texture(iChannel0, uv).rgb;

    fragColor = vec4(col, 1.0);
}
