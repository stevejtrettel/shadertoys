struct HalfSpaceVert {
    float x;      // Vertical geodesic at x = c
    float side;   // +1: want x < c, -1: want x > c
};

struct HalfSpaceCirc {
    float center;   // Center of semicircle (on real axis)
    float radius;   // Radius of semicircle
    float side;     // +1: want outside circle, -1: want inside
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
    return uv * 5.0 - vec2(1.0, 0.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 z = normalize_coord(fragCoord);
    
    // A vertical half-space: x > 1
    HalfSpaceVert hv = HalfSpaceVert(1.0, -1.0);
    
    // A circular half-space: outside semicircle centered at 2.5 with radius 1
    HalfSpaceCirc hc = HalfSpaceCirc(2.5, 1.0, 1.0);
    
    vec3 color = vec3(0.1, 0.1, 0.15);
    
    // Color regions
    if (inside(z, hv)) {
        color = vec3(0.3, 0.5, 0.7);
    }
    if (inside(z, hc)) {
        color = color + vec3(0.4, 0.2, 0.1);
    }
    
    // Draw the geodesic boundaries
    if (abs(z.x - hv.x) < 0.03) {
        color = vec3(1.0, 1.0, 1.0);
    }
    float dist_to_circ = abs(length(z - vec2(hc.center, 0.0)) - hc.radius);
    if (dist_to_circ < 0.03 && z.y > 0.0) {
        color = vec3(1.0, 1.0, 1.0);
    }
    
    // Draw the real axis (boundary at infinity)
    if (z.y < 0.02) {
        color = vec3(0.15, 0.15, 0.15);
    }
    
    fragColor = vec4(color, 1.0);
}