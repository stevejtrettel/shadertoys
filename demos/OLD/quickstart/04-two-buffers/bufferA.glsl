// BufferA: Wave displacement
// Stores the height of the wave at each point

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Initialize: flat surface
    if (iFrame == 0) {
        fragColor = vec4(0.0);
        return;
    }

    // Boundary: keep edges at zero
    if (fragCoord.x < 1.0 || fragCoord.x > iResolution.x - 1.0 ||
        fragCoord.y < 1.0 || fragCoord.y > iResolution.y - 1.0) {
        fragColor = vec4(0.0);
        return;
    }

    ivec2 p = ivec2(fragCoord);
    float u = texelFetch(iChannel0, p, 0).r;  // Current displacement
    float v = texelFetch(iChannel1, p, 0).r;  // Current velocity

    // Update displacement: u' = u + dt * v
    float dt = 0.5;
    float newU = u + dt * v;

    fragColor = vec4(newU, 0.0, 0.0, 1.0);
}
