void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Normalized pixel coordinates (0 to 1)
    vec2 uv = fragCoord / iResolution.xy;

    // Read previous frame (for feedback effects)
    vec4 prev = texelFetch(iChannel0, ivec2(fragCoord), 0);

    // Time-based animation
    float t = iTime * 0.5;

    // Create animated pattern
    vec3 col = 0.5 + 0.5 * cos(t + uv.xyx + vec3(0, 2, 4));

    // Mix with previous frame for trail effect
    col = mix(prev.rgb, col, 0.1);

    fragColor = vec4(col, 1.0);
}
