// Image: Final composite
// Combines sharp particles with bloom and adds vignette

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Get sharp particles from BufferA
    vec3 sharp = texture(iChannel0, uv).rgb;

    // Get bloom from BufferB
    vec3 bloom = texture(iChannel1, uv).rgb;

    // Combine: sharp + bloom glow
    vec3 col = sharp + bloom * 0.5;

    // Add vignette (darker edges)
    vec2 vignetteUV = uv * (1.0 - uv);
    float vignette = vignetteUV.x * vignetteUV.y * 15.0;
    vignette = clamp(pow(vignette, 0.25), 0.0, 1.0);
    col *= vignette;

    // Tone mapping
    col = col / (1.0 + col);

    fragColor = vec4(col, 1.0);
}
