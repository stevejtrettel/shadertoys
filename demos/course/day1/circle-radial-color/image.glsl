void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Coordinate setup
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - 0.5;
    uv.x *= iResolution.x / iResolution.y;
    vec2 p = uv * 4.0;
    
    float d = length(p);
    float intensity = 1.0 - d / 2.0;  // Fades from 1 at center to 0 at distance 2
    intensity = clamp(intensity, 0.0, 1.0);  // Keep it in [0, 1]
    
    vec3 color = vec3(intensity);
    fragColor = vec4(color, 1.0);
}