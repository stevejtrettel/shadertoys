void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Coordinate setup
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - 0.5;
    uv.x *= iResolution.x / iResolution.y;
    vec2 p = uv * 4.0;

    // Lemniscate of Bernoulli: (x² + y²)² = a²(x² - y²)
    float a = 1.0;
    float r2 = dot(p, p);
    float F = r2 * r2 - a * a * (p.x * p.x - p.y * p.y);

    // Compute gradient analytically:
    // ∂F/∂x = 4x(x² + y²) - 2a²x = 2x(2r² - a²)
    // ∂F/∂y = 4y(x² + y²) + 2a²y = 2y(2r² + a²)
    vec2 grad = vec2(
        2.0 * p.x * (2.0 * r2 - a * a),
        2.0 * p.y * (2.0 * r2 + a * a)
    );

    // Approximate signed distance: |F| / |∇F|
    float gradLen = length(grad);
    float dist = abs(F) / max(gradLen, 0.01);  // avoid division by zero

    // Uniform thickness
    float thickness = 0.05;
    vec3 color = vec3(0.1, 0.1, 0.3);
    if(dist < thickness){
        color = vec3(1.0, 1.0, 0.0);
    }

    fragColor = vec4(color, 1.0);
}