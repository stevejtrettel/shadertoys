void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    float d = length(fragCoord - iMouse.xy);

    if (iMouse.z > 0.0 && d < 10.0) {
        fragColor = vec4(1.0);  // White brush
    } else {
        fragColor = vec4(0.0, 0.0, 0.0, 1.0);  // Black background
    }
}
