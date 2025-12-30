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

    // Naive threshold - thickness varies!
    float thickness = 0.15;
    vec3 color = (abs(F) < thickness) ? vec3(1.0, 1.0, 0.0) : vec3(0.1, 0.1, 0.3);

    fragColor = vec4(color, 1.0);
}