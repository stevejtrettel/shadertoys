void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Normalized pixel coordinates (0 to 1)
    vec2 uv = fragCoord / iResolution.xy;

    // Time-based animation
    float t = iTime * 0.5;

    // Create a gradient with animated colors
    vec3 col = 0.5 + 0.5 * cos(t + uv.xyx + vec3(0, 2, 4));

    // Output to screen
    fragColor = vec4(col, 1.0);
}
