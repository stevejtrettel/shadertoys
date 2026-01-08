bool inDomain(vec2 fragCoord, vec2 resolution) {
    vec2 center = resolution * 0.5;
    float radius = min(resolution.x, resolution.y) * 0.4;
    return length(fragCoord - center) < radius;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    if (!inDomain(fragCoord, iResolution.xy)) {
        fragColor = vec4(0.1, 0.1, 0.1, 1.0);
        return;
    }

    float u = texelFetch(iChannel0, ivec2(fragCoord), 0).r;
    u *= 3.0;

    vec3 color;
    if (u > 0.0) {
        color = mix(vec3(0.0), vec3(1.0, 0.5, 0.0), u);
    } else {
        color = mix(vec3(0.0), vec3(0.0, 0.3, 1.0), -u);
    }

    fragColor = vec4(color, 1.0);
}
