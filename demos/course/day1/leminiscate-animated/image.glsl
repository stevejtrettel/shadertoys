void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    vec2 p = uv * 4.0;
    
    // Cassini oval parameters
    float c = 1.0;  // half-distance between foci
    float a = 0.8 + 0.4 * sin(iTime * 0.5);  // animate through transition
    
    // Implicit equation: (x² + y²)² - 2c²(x² - y²) = a⁴ - c⁴
    float r2 = dot(p, p);
    float c2 = c * c;
    float a4 = a * a * a * a;
    float c4 = c2 * c2;
    float F = r2 * r2 - 2.0 * c2 * (p.x * p.x - p.y * p.y) - (a4 - c4);
    
    // Gradient
    vec2 grad = vec2(
        4.0 * p.x * r2 - 4.0 * c2 * p.x,
        4.0 * p.y * r2 + 4.0 * c2 * p.y
    );
    
    float dist = abs(F) / max(length(grad), 0.01);
    float eps = 0.05;
    
    vec3 color;
    if (dist < eps) {
        color = vec3(1.0, 1.0, 0.0);
    } else {
        color = vec3(0.1, 0.1, 0.3);
    }
    
    fragColor = vec4(color, 1.0);
}