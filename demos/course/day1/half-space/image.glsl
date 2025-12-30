void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Coordinate setup
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - 0.5;
    uv.x *= iResolution.x / iResolution.y;
    vec2 p = uv * 4.0;
    
    float a = sin(iTime);
    float b = cos(iTime/3.);
    float c = 1.+cos(3.*iTime)/3.;
    float L = a * p.x + b * p.y + c;
    
    vec3 color = (L < 0.0) ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 0.0, 1.0);
    fragColor = vec4(color, 1.0);
}