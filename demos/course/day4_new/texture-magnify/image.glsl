void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;
    vec2 mouse = iMouse.xy / iResolution.xy;

    float dist = length(uv - mouse);
    float radius = 0.15;

    if (dist < radius) {
        // Inside lens: sample closer to mouse position (zoom in)
        float zoom = 2.0;
        uv = mouse + (uv - mouse) / zoom;
    }

    fragColor = texture(iChannel0, uv);
}
