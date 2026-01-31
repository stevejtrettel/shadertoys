void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;
    vec2 center = vec2(0.5);

    vec2 offset = uv - center;
    float dist = length(offset);
    float angle = atan(offset.y, offset.x);

    // Rotate more near the center
    float swirl = 2.0 * exp(-dist * 3.0);
    angle += swirl;

    uv = center + dist * vec2(cos(angle), sin(angle));
    fragColor = texture(iChannel0, uv);
}
