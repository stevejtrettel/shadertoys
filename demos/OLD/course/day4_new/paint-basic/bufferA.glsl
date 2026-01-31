void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec4 prev = texelFetch(iChannel0, ivec2(fragCoord), 0);

    float d = length(fragCoord - iMouse.xy);

    if (iMouse.z > 0.0 && d < 10.0) {
        fragColor = vec4(1.0);
    } else {
        fragColor = prev;
    }
}
