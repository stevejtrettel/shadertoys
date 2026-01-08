// Color palette
const vec3 CREAM = vec3(0.85, 0.8, 0.75);
const vec3 SLATE = vec3(0.35, 0.4, 0.45);
const vec3 MAROON = vec3(0.6, 0.2, 0.2);
const vec3 NAVY = vec3(0.2, 0.2, 0.6);

struct HalfSpace {
    vec2 normal;    // Unit normal to the line
    float offset;   // Signed distance from origin to line
    float side;     // +1 or -1: which side is "inside"
};

vec2 reflectInto(vec2 p, HalfSpace h, inout int count) {
    float val = dot(h.normal, p) - h.offset;
    if (val * h.side < 0.0) return p;  // Already inside
    count++;
    return p - 2.0 * val * h.normal;
}

vec3 drawF(vec2 p, vec3 bgColor, vec3 fgColor) {
    vec3 color = bgColor;
    // Vertical stroke
    if (p.x > -0.2 && p.x < -0.05 && p.y > -0.3 && p.y < 0.3) color = fgColor;
    // Top horizontal stroke
    if (p.x > -0.2 && p.x < 0.2 && p.y > 0.15 && p.y < 0.3) color = fgColor;
    // Middle horizontal stroke
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
    
    // Four half-spaces defining [0,1] × [0,1]
    HalfSpace left   = HalfSpace(vec2(1.0, 0.0), 0.0, -1.0);  // x > 0
    HalfSpace right  = HalfSpace(vec2(1.0, 0.0), 1.0,  1.0);  // x < 1
    HalfSpace bottom = HalfSpace(vec2(0.0, 1.0), 0.0, -1.0);  // y > 0
    HalfSpace top    = HalfSpace(vec2(0.0, 1.0), 1.0,  1.0);  // y < 1
    
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
    vec3 bg = (parity < 0.5) ? CREAM : SLATE;
    vec3 fg = (parity < 0.5) ? MAROON : NAVY;
    
    vec3 color = drawF(p - vec2(0.5, 0.5), bg, fg);
    fragColor = vec4(color, 1.0);
}