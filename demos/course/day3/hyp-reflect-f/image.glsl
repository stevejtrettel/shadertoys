struct HalfSpaceVert {
    float x;
    float side;
};

struct HalfSpaceCirc {
    float center;
    float radius;
    float side;
};

vec2 reflectInto(vec2 z, HalfSpaceVert h) {
    if ((z.x - h.x) * h.side < 0.0) return z;
    z.x = 2.0 * h.x - z.x;
    return z;
}

vec2 reflectInto(vec2 z, HalfSpaceCirc h) {
    vec2 rel = z - vec2(h.center, 0.0);
    float dist2 = dot(rel, rel);
    
    if ((dist2 - h.radius * h.radius) * h.side > 0.0) return z;
    
    z.x -= h.center;
    z /= h.radius;
    z /= dot(z, z);
    z *= h.radius;
    z.x += h.center;
    
    return z;
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
    uv = uv - vec2(0.5, 0.0);
    uv.x *= iResolution.x / iResolution.y;
    return uv * 6.0;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 z = normalize_coord(fragCoord);
    
    HalfSpaceVert hv = HalfSpaceVert(-1.5, -1.0);
    HalfSpaceCirc hc = HalfSpaceCirc(1.5, 2.5, 1.0);
    
    float t = mod(iTime, 4.0);
    if (t < 2.0) {
        z = reflectInto(z, hv);
    } else {
        z = reflectInto(z, hc);
    }
    
    vec3 color = drawF(z - vec2(0.5, 3.5), vec3(0.1, 0.1, 0.15), vec3(1.0, 0.8, 0.3));
    
    vec2 z_orig = normalize_coord(fragCoord);
    
    if (abs(z_orig.x - hv.x) < 0.04) color = vec3(0.5);
    if (abs(length(z_orig - vec2(hc.center, 0.0)) - hc.radius) < 0.04 && z_orig.y > 0.0) color = vec3(0.5);
    if (z_orig.y < 0.02) color = vec3(0.15);
    
    fragColor = vec4(color, 1.0);
}