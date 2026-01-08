vec2 cmul(vec2 z, vec2 w) {
    return vec2(z.x * w.x - z.y * w.y, z.x * w.y + z.y * w.x);
}

vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.00, 0.33, 0.67);
    return a + b * cos(6.28318 * (c * t + d));
}

vec2 normalize_coord(vec2 fragCoord, float zoom) {
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    return uv * 2.5 / zoom;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Zoom parameters
    float zoom = pow(2.0, iTime * 0.5);
    vec2 center = vec2(-0.745, 0.186);  // seahorse valley
    vec2 c = center + normalize_coord(fragCoord, zoom);
    
    vec2 z = vec2(0.0, 0.0);
    vec2 dz = vec2(0.0, 0.0);
    
    int i;
    for (i = 0; i < 512; i++) {
        if (length(z) > 256.0) break;
        
        dz = 2.0 * cmul(z, dz) + vec2(1.0, 0.0);
        z = cmul(z, z) + c;
    }
    
    vec3 color = vec3(0.0, 0.0, 0.0);
    
    if (i < 512) {
        float r = length(z);
        float dr = length(dz);
        
        if (dr > 0.0001) {
            // Distance estimation
            float dist = 0.5 * r * log(r) / dr;
            float scaled_dist = dist * zoom;
            
            // Smooth coloring
            float log_zn = log(r);
            float nu = log(log_zn / log(2.0)) / log(2.0);
            float smooth_iter = float(i) + 1.0 - nu;
            float t = smooth_iter / 512.0;
            
            color = palette(t * 5.0);
            
            // Glow near boundary
            float glow = exp(-scaled_dist * 200.0);
            color = mix(color, vec3(1.0, 1.0, 1.0), glow * 0.7);
        }
    }
    
    fragColor = vec4(color, 1.0);
}