// Color palette
const vec3 CREAM = vec3(0.85, 0.8, 0.75);
const vec3 SLATE = vec3(0.35, 0.4, 0.45);
const vec3 BLACK = vec3(0.15, 0.15, 0.15);

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
    if ((z.x - h.x) * h.side < 0.0) return z;  // Already inside
    z.x = 2.0 * h.x - z.x;
    count++;
    return z;
}

vec2 reflectInto(vec2 z, HalfSpaceCirc h, inout int count) {
    vec2 rel = z - vec2(h.center, 0.0);
    float dist2 = dot(rel, rel);
    
    if ((dist2 - h.radius * h.radius) * h.side > 0.0) return z;  // Already inside
    
    // Circle inversion
    z.x -= h.center;
    z = z / h.radius;
    z = z / dot(z, z);
    z = z * h.radius;
    z.x += h.center;
    count++;
    return z;
}

vec2 normalize_coord(vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    uv.y *= iResolution.y / iResolution.x;
    return uv * 4.0 - vec2(0.75, 0.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 z = normalize_coord(fragCoord);
    vec2 z_orig = z;
    
    // Define the (2,3,∞) triangle
    HalfSpaceVert left = HalfSpaceVert(0.0, -1.0);
    HalfSpaceVert right = HalfSpaceVert(0.5, 1.0);
    HalfSpaceCirc bottom = HalfSpaceCirc(0.0, 1.0, 1.0);
    
    // Fold into fundamental domain
    int foldCount = 0;
    for (int i = 0; i < 100; i++) {
        vec2 z0 = z;
        z = reflectInto(z, left, foldCount);
        z = reflectInto(z, right, foldCount);
        z = reflectInto(z, bottom, foldCount);
        if (length(z - z0) < 0.0001) break;
    }
    
    // Color by parity
    float parity = mod(float(foldCount), 2.0);
    vec3 color = (parity < 0.5) ? CREAM : SLATE;
    
    // Draw the real axis
    if (z_orig.y < 0.01) {
        color = BLACK;
    }
    
    fragColor = vec4(color, 1.0);
}