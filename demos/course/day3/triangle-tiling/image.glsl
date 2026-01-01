struct HalfSpace {
    float a, b, c;
    float side;
};

vec2 reflectInto(vec2 p, HalfSpace h, inout int count) {
    float val = h.a * p.x + h.b * p.y - h.c;
    if (val * h.side < 0.0) return p;
    
    vec2 n = vec2(h.a, h.b);
    n = n / length(n);
    float dist = val / length(vec2(h.a, h.b));
    count++;
    return p - 2.0 * dist * n;
}

vec3 drawF(vec2 p, vec3 bgColor, vec3 fgColor) {
    vec3 color = bgColor;
    if (p.x > -0.15 && p.x < 0.0 && p.y > -0.2 && p.y < 0.2) color = fgColor;
    if (p.x > -0.15 && p.x < 0.15 && p.y > 0.1 && p.y < 0.2) color = fgColor;
    if (p.x > -0.15 && p.x < 0.08 && p.y > -0.02 && p.y < 0.08) color = fgColor;
    return color;
}

vec2 normalize_coord(vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    return uv * 6.0;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 p = normalize_coord(fragCoord);
    
    HalfSpace h1 = HalfSpace(0.0, 1.0, -0.5, -1.0);
    HalfSpace h2 = HalfSpace(0.866, -0.5, -0.5, -1.0);
    HalfSpace h3 = HalfSpace(-0.866, -0.5, -0.5, -1.0);
    
    int foldCount = 0;
    for (int i = 0; i < 30; i++) {
        vec2 p0 = p;
        p = reflectInto(p, h1, foldCount);
        p = reflectInto(p, h2, foldCount);
        p = reflectInto(p, h3, foldCount);
        if (length(p - p0) < 0.0001) break;
    }
    
    float parity = mod(float(foldCount), 2.0);
    vec3 bg = (parity < 0.5) ? vec3(0.85, 0.8, 0.75) : vec3(0.35, 0.4, 0.45);
    vec3 fg = (parity < 0.5) ? vec3(0.6, 0.2, 0.2) : vec3(0.2, 0.2, 0.6);
    
    vec3 color = drawF(p, bg, fg);
    fragColor = vec4(color, 1.0);
}