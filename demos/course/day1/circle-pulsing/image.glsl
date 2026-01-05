void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    vec2 p = uv * 4.0;
    
    float d = length(p);
    float r = 1.0 + 0.5 * sin(iTime);  // radius oscillates between 0.5 and 1.5
    float f = d - r;
    
    vec3 color;
    if (f < 0.0) {
        color = vec3(1.0, 1.0, 0.0);  // yellow inside
    } else {
        color = vec3(0.1, 0.1, 0.3);  // dark background
    }
    
    fragColor = vec4(color, 1.0);
}