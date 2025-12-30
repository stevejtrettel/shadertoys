void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Coordinate setup
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - 0.5;
    uv.x *= iResolution.x / iResolution.y;
    vec2 p = uv * 4.0;
    
    //the parabola
    float F = p.y - p.x * p.x - 1.0;

    //color
    float thickness = 0.1;
    vec3 color = vec3(0.1, 0.1, 0.3);
    if(abs(F)<thickness){
        color = vec3(1.,1.,0.);
    }
    
    fragColor = vec4(color, 1.0);
}