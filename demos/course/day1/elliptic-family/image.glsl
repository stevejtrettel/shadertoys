vec2 normalize_coord(vec2 coord) {
    vec2 uv = coord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    return uv * 4.0;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 p = normalize_coord(fragCoord);
    
    // Mouse controls the central (a, b) of our family
    float a_center = mix(-3.0, 1.0, iMouse.x / iResolution.x);
    float b_center = mix(-2.0, 2.0, iMouse.y / iResolution.y);
    
    vec3 color = vec3(0.05, 0.05, 0.1);  // dark background
    
    // Draw curves for a range of a values around a_center
    for (float i = -3.0; i <= 3.0; i += 1.0) {
        float a = a_center + i * 0.5;  // more spacing
        float b = b_center;
        
        // Elliptic curve: y² = x³ + ax + b
        float F = p.y * p.y - p.x * p.x * p.x - a * p.x - b;
        
        // Gradient
        vec2 grad = vec2(-3.0 * p.x * p.x - a, 2.0 * p.y);
        float dist = abs(F) / max(length(grad), 0.01);
        
        // Brightness fades quickly: central curve bright, outer curves fade to background
        float t = abs(i) / 3.0;  // 0 at center, 1 at edges
        float brightness = 1.0 - t * t;  // quadratic falloff
        
        if (dist < 0.03 && brightness > 0.05) {
            // Check discriminant for this specific curve
            float disc = 4.0 * a * a * a + 27.0 * b * b;
            if (abs(disc) < 0.3) {
                color = mix(color, vec3(1.0, 0.3, 0.3), brightness);  // red for singular
            } else {
                color = mix(color, vec3(1.0, 1.0, 0.5), brightness);  // yellow for smooth
            }
        }
    }
    
    fragColor = vec4(color, 1.0);
}