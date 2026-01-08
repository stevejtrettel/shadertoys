struct HalfSpace {
    vec2 normal;    // Unit normal to the line
    float offset;   // Signed distance from origin to line
    float side;     // +1 or -1: which side is "inside"
};

bool inside(vec2 p, HalfSpace h) {
    return (dot(h.normal, p) - h.offset) * h.side < 0.0;
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
    
    // Half-space: x < 1 (left side of vertical line at x = 1)
    HalfSpace h = HalfSpace(vec2(1.0, 0.0), 1.0, 1.0);
    
    vec3 color;
    if (inside(p, h)) {
        color = vec3(0.3, 0.5, 0.7);
    } else {
        color = vec3(0.1, 0.1, 0.15);
    }
    
    // Draw the boundary line
    float dist = abs(dot(h.normal, p) - h.offset);
    if (dist < 0.03) {
        color = vec3(1.0, 1.0, 1.0);
    }
    
    fragColor = vec4(color, 1.0);
}