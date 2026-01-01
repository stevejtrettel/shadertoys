vec3 drawF(vec2 p, vec3 bgColor, vec3 fgColor) {
    vec3 color = bgColor;
    if (p.x > -0.2 && p.x < -0.05 && p.y > -0.3 && p.y < 0.3) color = fgColor;
    if (p.x > -0.2 && p.x < 0.2 && p.y > 0.15 && p.y < 0.3) color = fgColor;
    if (p.x > -0.2 && p.x < 0.1 && p.y > -0.05 && p.y < 0.1) color = fgColor;
    return color;
}

vec2 normalize_coord(vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    return uv * 8.0;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 p = normalize_coord(fragCoord);
    
    for (int i = 0; i < 20; i++) {
        if (p.x < 0.0) p.x = -p.x;
        if (p.x > 1.0) p.x = 2.0 - p.x;
    }
    
    vec3 color = drawF(p - vec2(0.5, 0.0), vec3(0.1, 0.1, 0.15), vec3(1.0, 0.8, 0.3));
    fragColor = vec4(color, 1.0);
}