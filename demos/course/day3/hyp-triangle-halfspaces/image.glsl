struct HalfSpaceVert {
    float x;
    float side;
};

struct HalfSpaceCirc {
    float center;
    float radius;
    float side;
};

bool inside(vec2 z, HalfSpaceVert h) {
    return (z.x - h.x) * h.side < 0.0;
}

bool inside(vec2 z, HalfSpaceCirc h) {
    vec2 rel = z - vec2(h.center, 0.0);
    float dist2 = dot(rel, rel);
    return (dist2 - h.radius * h.radius) * h.side > 0.0;
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
    
    vec3 color = vec3(0.1, 0.1, 0.15);
    if (inside(z, left) && inside(z, right) && inside(z, bottom)) {
        color = vec3(0.3, 0.5, 0.7);
    }
    
    if (abs(z.x - 0.0) < 0.02 && z.y > 0.0) color = vec3(1.0);
    if (abs(z.x - 0.5) < 0.02 && z.y > 0.0) color = vec3(1.0);
    if (abs(length(z) - 1.0) < 0.02 && z.y > 0.0) color = vec3(1.0);
    
    if (z.y < 0.01) color = vec3(0.15);
    
    fragColor = vec4(color, 1.0);
}