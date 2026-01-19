void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    vec2 p = uv * 4.0;
    
    float a = 1.5;
    float r2 = dot(p, p);
    float F = r2 * r2 - a * a * (p.x * p.x - p.y * p.y);
    
    vec2 grad = vec2(
        4.0 * p.x * r2 - 2.0 * a * a * p.x,
        4.0 * p.y * r2 + 2.0 * a * a * p.y
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