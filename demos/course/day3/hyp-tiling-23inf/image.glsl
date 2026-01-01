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
    float val = z.x - h.x;
    if (val * h.side < 0.0) return z;
    z.x = 2.0 * h.x - z.x;
    count++;
    return z;
}

vec2 reflectInto(vec2 z, HalfSpaceCirc h, inout int count) {
    vec2 rel = z - vec2(h.center, 0.0);
    float dist2 = dot(rel, rel);
    
    if ((dist2 - h.radius * h.radius) * h.side > 0.0) return z;
    
    z.x -= h.center;
    z /= h.radius;
    z /= dot(z, z);
    z *= h.radius;
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
    
    HalfSpaceVert left = HalfSpaceVert(0.0, -1.0);
    HalfSpaceVert right = HalfSpaceVert(0.5, 1.0);
    HalfSpaceCirc bottom = HalfSpaceCirc(0.0, 1.0, 1.0);
    
    int foldCount = 0;
    for (int i = 0; i < 100; i++) {
        vec2 z0 = z;
        z = reflectInto(z, left, foldCount);
        z = reflectInto(z, right, foldCount);
        z = reflectInto(z, bottom, foldCount);
        if (length(z - z0) < 0.0001) break;
    }
    
    float parity = mod(float(foldCount), 2.0);
    vec3 color = (parity < 0.5) ? vec3(0.85, 0.8, 0.75) : vec3(0.35, 0.4, 0.45);
    
    vec2 z_orig = normalize_coord(fragCoord);
    if (z_orig.y < 0.01) color = vec3(0.15);
    
    fragColor = vec4(color, 1.0);
}