// BufferB: Wave velocity
// Stores how fast each point is moving up/down

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Initialize: zero velocity
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

    // Compute Laplacian of displacement (how curved the surface is)
    float u_c = texelFetch(iChannel0, p, 0).r;
    float u_n = texelFetch(iChannel0, p + ivec2( 0,  1), 0).r;
    float u_s = texelFetch(iChannel0, p + ivec2( 0, -1), 0).r;
    float u_e = texelFetch(iChannel0, p + ivec2( 1,  0), 0).r;
    float u_w = texelFetch(iChannel0, p + ivec2(-1,  0), 0).r;
    float laplacian = u_n + u_s + u_e + u_w - 4.0 * u_c;

    float v = texelFetch(iChannel1, p, 0).r;

    // Update velocity: v' = v + dt * c^2 * laplacian
    float dt = 0.5;
    float c = 0.5;  // Wave speed
    float newV = v + dt * c * c * laplacian;

    // Mouse click adds a velocity impulse (creates ripple)
    if (iMouse.z > 0.0) {
        float d = length(fragCoord - iMouse.xy);
        float sigma = 15.0;
        newV += 0.001 * exp(-d * d / (2.0 * sigma * sigma));
    }

    fragColor = vec4(newV, 0.0, 0.0, 1.0);
}
