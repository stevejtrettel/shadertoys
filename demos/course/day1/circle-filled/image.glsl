void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Coordinate setup
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - 0.5;
    uv.x *= iResolution.x / iResolution.y;
    vec2 p = uv * 4.0;
    
    float d = length(p);
    float r = 1.0;
    
    vec3 color = (d < r) ? vec3(1.0, 1.0, 0.0) : vec3(0.1, 0.1, 0.3);
    fragColor = vec4(color, 1.0);
}