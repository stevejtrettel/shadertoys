struct HalfSpace {
    float a, b, c;
    float side;
};

bool inside(vec2 p, HalfSpace h) {
    float val = h.a * p.x + h.b * p.y - h.c;
    return val * h.side < 0.0;
}

vec2 normalize_coord(vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    return uv * 4.0;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 p = normalize_coord(fragCoord);
    
    HalfSpace h = HalfSpace(1.0, 0.0, 1.0, 1.0);
    
    vec3 color = inside(p, h) ? vec3(0.3, 0.5, 0.7) : vec3(0.1, 0.1, 0.15);
    
    float dist = abs(h.a * p.x + h.b * p.y - h.c) / length(vec2(h.a, h.b));
    if (dist < 0.03) color = vec3(1.0);
    
    fragColor = vec4(color, 1.0);
}