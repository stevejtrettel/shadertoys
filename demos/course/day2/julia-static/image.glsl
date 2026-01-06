vec2 cmul(vec2 z, vec2 w) {
    return vec2(z.x * w.x - z.y * w.y, z.x * w.y + z.y * w.x);
}

vec2 normalize_coord(vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    return uv * 2.5;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Fixed parameter
    vec2 c = vec2(-0.7, 0.27015);
    
    // z starts at pixel position
    vec2 z = normalize_coord(fragCoord);
    
    vec3 color = vec3(0.0, 0.0, 0.0);
    
    int i;
    for (i = 0; i < 100; i++) {
        if (length(z) > 2.0) break;
        z = cmul(z, z) + c;
    }
    
    if (i < 100) {
        float t = float(i) / 100.0;
        float gray = 1.0 - t;
        color = vec3(gray, gray, gray);
    }
    
    fragColor = vec4(color, 1.0);
}