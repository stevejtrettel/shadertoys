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
    vec2 c = normalize_coord(fragCoord);
    c.x = c.x - 0.5;  // shift left to center the interesting part
    
    vec3 color = vec3(0.0, 0.0, 0.0);
    
    vec2 z = vec2(0.0, 0.0);
    
    for (int i = 0; i < 100; i++) {
        if (length(z) > 2.0) {
            color = vec3(1.0, 1.0, 1.0);
            break;
        }
        z = cmul(z, z) + c;
    }
    
    fragColor = vec4(color, 1.0);
}