struct HalfSpaceVert {
    float x;
    float side;
};

struct HalfSpaceCirc {
    float center;
    float radius;
    float side;
};

vec2 reflectVert(vec2 z, HalfSpaceVert h) {
    z.x = 2.0 * h.x - z.x;
    return z;
}

vec2 reflectCirc(vec2 z, HalfSpaceCirc h) {
    // Circle inversion through semicircle
    z.x -= h.center;
    z = z / h.radius;
    z = z / dot(z, z);
    z = z * h.radius;
    z.x += h.center;
    return z;
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
    uv = uv - vec2(0.5, 0.0);
    uv.x *= iResolution.x / iResolution.y;
    return uv * 6.0;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 z = normalize_coord(fragCoord);
    vec2 z_orig = z;
    
    // Define our geodesics
    HalfSpaceVert hv = HalfSpaceVert(-1.5, -1.0);
    HalfSpaceCirc hc = HalfSpaceCirc(1.5, 2.5, 1.0);
    
    // Alternate between reflection types every 2 seconds
    float t = mod(iTime, 4.0);
    if (t < 2.0) {
        z = reflectVert(z, hv);
    } else {
        z = reflectCirc(z, hc);
    }
    
    // Draw F at transformed position
    vec3 color = drawF(z - vec2(0.5, 3.5), vec3(0.1, 0.1, 0.15), vec3(1.0, 0.8, 0.3));
    
    // Draw the geodesic boundaries (in original coordinates)
    if (abs(z_orig.x - hv.x) < 0.04) {
        color = vec3(0.5, 0.5, 0.5);
    }
    float dist_to_circ = abs(length(z_orig - vec2(hc.center, 0.0)) - hc.radius);
    if (dist_to_circ < 0.04 && z_orig.y > 0.0) {
        color = vec3(0.5, 0.5, 0.5);
    }
    
    // Draw the real axis
    if (z_orig.y < 0.02) {
        color = vec3(0.15, 0.15, 0.15);
    }
    
    fragColor = vec4(color, 1.0);
}