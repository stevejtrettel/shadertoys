vec2 normalize_coord(vec2 coord) {
    vec2 uv = coord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    return uv * 4.0;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 p = normalize_coord(fragCoord);
    
    // Mouse picks (a, b) in parameter space
    float a = mix(-2.0, 1.0, iMouse.x / iResolution.x);
    float b_center = mix(-2.0, 2.0, iMouse.y / iResolution.y);
    
    vec3 color = vec3(0.05, 0.05, 0.1);
    
    vec3 oneComponent = vec3(1.0, 0.85, 0.3);   // gold
    vec3 twoComponent = vec3(0.3, 0.5, 0.8);    // blue
    vec3 singularColor = vec3(1.0, 0.2, 0.2);   // red
    
    for (int j = -15; j <= 15; j++) {
        float b = b_center + float(j) * 0.15;
        
        float dist_from_center = abs(float(j));
        
        // Discriminant: 4a³ + 27b²
        float disc = 4.0 * a * a * a + 27.0 * b * b;
        
        float F = p.y * p.y - p.x * p.x * p.x - a * p.x - b;
        vec2 grad = vec2(-3.0 * p.x * p.x - a, 2.0 * p.y);
        float dist = abs(F) / max(length(grad), 0.01);
        
        float thickness = 0.05 / (1.0 + dist_from_center * 0.8);
        
        // Color by topology
        vec3 curveColor;
        if (abs(disc) < 0.3) {
            curveColor = singularColor;
        } else if (disc > 0.0) {
            curveColor = oneComponent;
        } else {
            curveColor = twoComponent;
        }
        
        float brightness = 1.0 / (1.0 + dist_from_center * 0.4);
        curveColor *= brightness;
        
        if (dist < thickness) {
            color = curveColor;
        }
    }
    
    fragColor = vec4(color, 1.0);
}