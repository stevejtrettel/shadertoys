void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;

    // Offset x based on y position and time
    uv.x += 0.03 * sin(uv.y * 20.0 + iTime * 2.0);

    fragColor = texture(iChannel0, uv);
}
