// Texture Sampling
// Demonstrates loading and manipulating textures
//
// The texture is loaded via config.json with filter and wrap options.
// Try changing "filter" to "nearest" or "wrap" to "clamp" in config.

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Add some animated distortion
    vec2 distortedUV = uv;
    distortedUV.x += sin(uv.y * 10.0 + iTime) * 0.02;
    distortedUV.y += cos(uv.x * 10.0 + iTime) * 0.02;

    // Sample the texture
    vec4 tex = texture(iChannel0, distortedUV);

    // Add time-based color tint
    vec3 tint = 0.5 + 0.5 * cos(iTime * 0.5 + vec3(0, 2, 4));
    vec3 col = mix(tex.rgb, tex.rgb * tint, 0.3);

    fragColor = vec4(col, 1.0);
}
