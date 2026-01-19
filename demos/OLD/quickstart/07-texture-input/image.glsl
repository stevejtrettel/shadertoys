// Texture Input Example
// Load an image and apply animated distortion effects
//
// iChannel0 = texture.png

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Center coordinates for radial effects
    vec2 center = uv - 0.5;
    center.x *= iResolution.x / iResolution.y; // Aspect ratio correction

    // --- Distortion Effects ---

    // 1. Wavy distortion (sine waves)
    float wave = sin(uv.y * 20.0 + iTime * 2.0) * 0.01;
    vec2 distortedUV = uv + vec2(wave, 0.0);

    // 2. Radial ripple from center
    float dist = length(center);
    float ripple = sin(dist * 30.0 - iTime * 4.0) * 0.02;
    distortedUV += normalize(center + 0.001) * ripple;

    // 3. Subtle zoom pulse
    float pulse = 1.0 + sin(iTime) * 0.02;
    distortedUV = (distortedUV - 0.5) / pulse + 0.5;

    // Sample the texture with distorted coordinates
    vec4 texColor = texture(iChannel0, distortedUV);

    // --- Color Effects ---

    // Chromatic aberration (RGB split)
    float aberration = 0.003 + sin(iTime * 0.5) * 0.002;
    vec4 texR = texture(iChannel0, distortedUV + vec2(aberration, 0.0));
    vec4 texB = texture(iChannel0, distortedUV - vec2(aberration, 0.0));
    texColor.r = texR.r;
    texColor.b = texB.b;

    // Vignette (darken edges)
    float vignette = 1.0 - dot(center, center) * 0.5;
    texColor.rgb *= vignette;

    fragColor = texColor;
}
