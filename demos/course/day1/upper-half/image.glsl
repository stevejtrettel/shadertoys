void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Coordinate setup
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - 0.5;
    uv.x *= iResolution.x / iResolution.y;
    vec2 p = uv * 4.0;
    
    float L = p.x;  // The function L(x,y) = x
    
    vec3 color = (L < 0.0) ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 0.0, 1.0);
    fragColor = vec4(color, 1.0);
}