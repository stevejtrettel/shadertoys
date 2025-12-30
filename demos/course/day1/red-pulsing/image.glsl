void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    float red = 0.5 + 0.5 * sin(iTime);
    fragColor = vec4(red, 0.0, 0.0, 1.0);
}