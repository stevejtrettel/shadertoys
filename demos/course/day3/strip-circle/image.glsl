vec2 normalize_coord(vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    return uv * 8.0;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 p = normalize_coord(fragCoord);
    
    // Fold into the strip [0, 1]
    for (int i = 0; i < 20; i++) {
        if (p.x < 0.0) p.x = -p.x;
        if (p.x > 1.0) p.x = 2.0 - p.x;
    }
    
    // Draw a circle in the fundamental domain
    float d = length(p - vec2(0.5, 0.0));
    vec3 color = vec3(0.1, 0.1, 0.15);
    if (d < 0.3) {
        color = vec3(1.0, 0.8, 0.3);
    }
    
    fragColor = vec4(color, 1.0);
}