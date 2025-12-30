void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Coordinate setup
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - 0.5;
    uv.x *= iResolution.x / iResolution.y;
    vec2 p = uv * 4.0;

    // Cassini oval parameters
    float c = 1.0;  // half-distance between foci
    float a = 0.8 + 0.4 * sin(iTime * 0.5);  // animate through phase transition

    // Implicit equation: (x² + y²)² - 2c²(x² - y²) = a⁴ - c⁴
    float r2 = dot(p, p);
    float c2 = c * c;
    float a4 = a * a * a * a;
    float c4 = c2 * c2;
    float F = r2 * r2 - 2.0 * c2 * (p.x * p.x - p.y * p.y) - (a4 - c4);

    // Gradient: ∂F/∂x = 4x(r²) - 4c²x = 4x(r² - c²)
    //           ∂F/∂y = 4y(r²) + 4c²y = 4y(r² + c²)
    vec2 grad = vec2(
        4.0 * p.x * (r2 - c2),
        4.0 * p.y * (r2 + c2)
    );

    // Approximate signed distance
    float gradLen = length(grad);
    float dist = abs(F) / max(gradLen, 0.01);

    // Draw curve with uniform thickness
    float thickness = 0.05;
    vec3 color = vec3(0.1, 0.1, 0.3);
    if(dist < thickness){
        color = vec3(1.0, 1.0, 0.0);
    }
    
    fragColor = vec4(color, 1.0);
}