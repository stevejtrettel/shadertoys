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
    // Smaller F for triangle cells
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
    
    // Three half-spaces defining equilateral triangle centered at origin
    // Edge normals point inward, 120° apart. sqrt(3)/2 ≈ 0.866
    HalfSpace h1 = HalfSpace(vec2(0.0, 1.0),       -0.5, -1.0);  // Bottom edge
    HalfSpace h2 = HalfSpace(vec2(0.866, -0.5),    -0.5, -1.0);  // Upper-right edge  
    HalfSpace h3 = HalfSpace(vec2(-0.866, -0.5),   -0.5, -1.0);  // Upper-left edge
    
    int foldCount = 0;
    for (int i = 0; i < 30; i++) {
        vec2 p0 = p;
        p = reflectInto(p, h1, foldCount);
        p = reflectInto(p, h2, foldCount);
        p = reflectInto(p, h3, foldCount);
        if (length(p - p0) < 0.0001) break;
    }
    
    float parity = mod(float(foldCount), 2.0);
    vec3 bg = (parity < 0.5) ? CREAM : SLATE;
    vec3 fg = (parity < 0.5) ? MAROON : NAVY;
    
    vec3 color = drawF(p, bg, fg);
    fragColor = vec4(color, 1.0);
}