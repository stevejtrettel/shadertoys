void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    vec2 p = uv * 4.0;
    
    float a = cos(iTime);
    float b = sin(iTime);
    float c = 0.5 * sin(iTime * 0.7);
    float L = a * p.x + b * p.y + c;
    
    vec3 color;
    if (L < 0.0) {
        color = vec3(1.0, 0.0, 0.0);
    } else {
        color = vec3(0.0, 0.0, 1.0);
    }
    
    fragColor = vec4(color, 1.0);
}