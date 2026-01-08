// Color palette
const vec3 CREAM = vec3(0.85, 0.8, 0.75);
const vec3 SLATE = vec3(0.35, 0.4, 0.45);
const vec3 BLACK = vec3(0.05, 0.05, 0.05);

struct HalfSpaceVert {
    float x;
    float side;
};

struct HalfSpaceCirc {
    float center;
    float radius;
    float side;
};

vec2 reflectInto(vec2 z, HalfSpaceVert h, inout int count) {
    if ((z.x - h.x) * h.side < 0.0) return z;
    z.x = 2.0 * h.x - z.x;
    count++;
    return z;
}

vec2 reflectInto(vec2 z, HalfSpaceCirc h, inout int count) {
    vec2 rel = z - vec2(h.center, 0.0);
    float dist2 = dot(rel, rel);
    
    if ((dist2 - h.radius * h.radius) * h.side > 0.0) return z;
    
    // Circle inversion
    z.x -= h.center;
    z = z / h.radius;
    z = z / dot(z, z);
    z = z * h.radius;
    z.x += h.center;
    count++;
    return z;
}

vec2 cmul(vec2 a, vec2 b) {
    return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

vec2 cdiv(vec2 a, vec2 b) {
    float denom = dot(b, b);
    return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / denom;
}

vec2 diskToUHP(vec2 w) {
    vec2 i = vec2(0.0, 1.0);
    vec2 one = vec2(1.0, 0.0);
    return cmul(i, cdiv(one + w, one - w));
}

vec2 normalize_coord(vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    return uv * 2.5;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 w = normalize_coord(fragCoord);
    vec2 z = diskToUHP(w);
    
    // The (2,3,7) triangle
    HalfSpaceVert left = HalfSpaceVert(0.0, -1.0);             // x > 0
    HalfSpaceCirc bottom = HalfSpaceCirc(0.0, 1.0, 1.0);       // outside unit circle
    HalfSpaceCirc third = HalfSpaceCirc(-0.7665, 1.533, -1.0); // inside this circle
    
    int foldCount = 0;
    for (int i = 0; i < 100; i++) {
        vec2 z0 = z;
        z = reflectInto(z, left, foldCount);
        z = reflectInto(z, bottom, foldCount);
        z = reflectInto(z, third, foldCount);
        if (length(z - z0) < 0.0001) break;
    }
    
    // Color by parity
    float parity = mod(float(foldCount), 2.0);
    vec3 color = (parity < 0.5) ? CREAM : SLATE;
    
    // Darken outside the disk
    if (length(w) > 1.0) {
        color = BLACK;
    }
    
    fragColor = vec4(color, 1.0);
}