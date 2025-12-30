void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Coordinate setup
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - 0.5;
    uv.x *= iResolution.x / iResolution.y;
    vec2 p = uv * 4.0;
    
    // Map x coordinate to red, y to green
    vec2 color_rg = p * 0.5 + 0.5;  // Remap to [0, 1]
    fragColor = vec4(color_rg, 0.0, 1.0);
}