
vec2 normalize_coord(vec2 coord) {
    vec2 uv = coord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    return uv * 4.0;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Normalize coordinates to range [-2, 2] with aspect ratio correction
    vec2 p = normalize_coord(fragCoord);
    
    // Mouse controls (a, b) parameters
    float a = mix(-2.0, 1.0, iMouse.x / iResolution.x);
    float b = mix(-2.0, 2.0, iMouse.y / iResolution.y);
    
    // Discriminant: 4a³ + 27b²
    float disc = 4.0 * a * a * a + 27.0 * b * b;
    
    // Elliptic curve: y² = x³ + ax + b
    float F = p.y * p.y - p.x * p.x * p.x - a * p.x - b;
    vec2 grad = vec2(-3.0 * p.x * p.x - a, 2.0 * p.y);
    float dist = abs(F) / max(length(grad), 0.01);
    
    vec3 bg = vec3(0.05, 0.05, 0.1);
    vec3 color = bg;
    
    if (dist < 0.05) {
        // Color by topology
        if (abs(disc) < 0.3) {
            color = vec3(1.0, 0.2, 0.2);   // red for singular
        } else if (disc > 0.0) {
            color = vec3(1.0, 0.85, 0.3);  // gold for one component
        } else {
            color = vec3(0.3, 0.5, 0.8);   // blue for two components
        }
    }
    
    fragColor = vec4(color, 1.0);
}