void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    if (iFrame == 0) {
        vec2 center = iResolution.xy * 0.5;
        float d = length(fragCoord - center);
        float u = 6.0 * exp(-d * d / 100.0);
        fragColor = vec4(u, 0.0, 0.0, 1.0);
        return;
    }
    
    ivec2 p = ivec2(fragCoord);
    
    float u = texelFetch(iChannel0, p, 0).r;
    float v = texelFetch(iChannel0, p, 0).g;
    
    float u_n = texelFetch(iChannel0, p + ivec2( 0,  1), 0).r;
    float u_s = texelFetch(iChannel0, p + ivec2( 0, -1), 0).r;
    float u_e = texelFetch(iChannel0, p + ivec2( 1,  0), 0).r;
    float u_w = texelFetch(iChannel0, p + ivec2(-1,  0), 0).r;
    float laplacian = u_n + u_s + u_e + u_w - 4.0 * u;
    
    // Symplectic Euler: update velocity first, then position
    float dt = 0.3;
    float c = 2.0;
    float newV = v + dt * c * c * laplacian;
    float newU = u + dt * newV;
    
    fragColor = vec4(newU, newV, 0.0, 1.0);
}