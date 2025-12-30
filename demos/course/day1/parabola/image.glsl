void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    vec2 p = uv * 4.0;
    
    float F = p.y - p.x * p.x;
    float eps = 0.1;
    
    vec3 color;
    if (abs(F) < eps) {
        color = vec3(1.0, 1.0, 0.0);  // yellow curve
    } else {
        color = vec3(0.1, 0.1, 0.3);  // dark background
    }
    
    fragColor = vec4(color, 1.0);
}