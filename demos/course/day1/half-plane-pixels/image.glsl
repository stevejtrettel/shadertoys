void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec3 color;
    if (fragCoord.x < iResolution.x / 2.0) {
        color = vec3(1.0, 0.0, 0.0);  // red on left
    } else {
        color = vec3(0.0, 0.0, 1.0);  // blue on right
    }
    
    fragColor = vec4(color, 1.0);
}