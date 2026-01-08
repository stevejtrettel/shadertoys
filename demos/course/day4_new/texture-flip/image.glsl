void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;
    uv.x = 1.0 - uv.x;
    fragColor = texture(iChannel0, uv);
}
