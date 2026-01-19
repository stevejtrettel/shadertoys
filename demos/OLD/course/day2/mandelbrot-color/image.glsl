vec2 cmul(vec2 z, vec2 w) {
    return vec2(z.x * w.x - z.y * w.y, z.x * w.y + z.y * w.x);
}

vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.00, 0.33, 0.67);
    return a + b * cos(6.28318 * (c * t + d));
}

vec2 normalize_coord(vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    return uv * 2.5;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 c = normalize_coord(fragCoord);
    c.x = c.x - 0.5;
    
    vec3 color = vec3(0.0, 0.0, 0.0);
    
    vec2 z = vec2(0.0, 0.0);
    int i;
    for (i = 0; i < 100; i++) {
        if (length(z) > 2.0) break;
        z = cmul(z, z) + c;
    }
    
    if (i < 100) {
        float t = float(i) / 100.0;
        color = palette(t);
    }
    
    fragColor = vec4(color, 1.0);
}