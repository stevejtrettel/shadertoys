vec2 normalize_coord(vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    return uv * 8.0;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 p = normalize_coord(fragCoord);
    
    int foldCount = 0;
    for (int i = 0; i < 20; i++) {
        vec2 p0 = p;
        if (p.x < 0.0) { p.x = -p.x; foldCount++; }
        if (p.x > 1.0) { p.x = 2.0 - p.x; foldCount++; }
        if (p.y < 0.0) { p.y = -p.y; foldCount++; }
        if (p.y > 1.0) { p.y = 2.0 - p.y; foldCount++; }
        if (length(p - p0) < 0.0001) break;
    }
    
    float t = float(foldCount) / 10.0;
    vec3 color = 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
    fragColor = vec4(color, 1.0);
}