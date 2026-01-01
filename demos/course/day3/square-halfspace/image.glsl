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
    
    HalfSpace left   = HalfSpace(1.0, 0.0, 0.0, -1.0);
    HalfSpace right  = HalfSpace(1.0, 0.0, 1.0,  1.0);
    HalfSpace bottom = HalfSpace(0.0, 1.0, 0.0, -1.0);
    HalfSpace top    = HalfSpace(0.0, 1.0, 1.0,  1.0);
    
    int foldCount = 0;
    for (int i = 0; i < 20; i++) {
        vec2 p0 = p;
        p = reflectInto(p, left, foldCount);
        p = reflectInto(p, right, foldCount);
        p = reflectInto(p, bottom, foldCount);
        p = reflectInto(p, top, foldCount);
        if (length(p - p0) < 0.0001) break;
    }
    
    float parity = mod(float(foldCount), 2.0);
    vec3 bg = (parity < 0.5) ? vec3(0.85, 0.8, 0.75) : vec3(0.35, 0.4, 0.45);
    vec3 fg = (parity < 0.5) ? vec3(0.6, 0.2, 0.2) : vec3(0.2, 0.2, 0.6);
    
    vec3 color = drawF(p - vec2(0.5, 0.5), bg, fg);
    fragColor = vec4(color, 1.0);
}