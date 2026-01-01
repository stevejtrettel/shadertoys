vec2 cmul(vec2 z, vec2 w) {
    return vec2(z.x * w.x - z.y * w.y, z.x * w.y + z.y * w.x);
}

float cabs2(vec2 z) {
    return dot(z, z);
}

vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.00, 0.33, 0.67);
    return a + b * cos(6.28318 * (c * t + d));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    
    // Zoom into the seahorse valley
    vec2 center = vec2(-0.745, 0.186);
    float zoom = pow(1.5, mod(iTime, 30.0));  // resets every 30s
    
    vec2 c = center + uv * 4.0 / zoom;
    
    vec2 z = vec2(0.0, 0.0);
    int max_iter = 200;
    int iter;
    
    for (iter = 0; iter < max_iter; iter++) {
        if (cabs2(z) > 4.0) break;
        z = cmul(z, z) + c;
    }
    
    vec3 color;
    if (iter == max_iter) {
        color = vec3(0.0);
    } else {
        // Smooth coloring
        float log_zn = log(cabs2(z)) / 2.0;
        float nu = log(log_zn / log(2.0)) / log(2.0);
        float smooth_iter = float(iter) + 1.0 - nu;
        float t = smooth_iter / float(max_iter);
        color = palette(t * 4.0);  // multiply for more color variation
    }
    
    fragColor = vec4(color, 1.0);
}