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

vec2 normalize_coord(vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    float zoom = pow(1.5, mod(iTime, 30.0));
    return uv * 2.5 / zoom;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Zoom into the seahorse valley
    vec2 center = vec2(-0.745, 0.186);
    vec2 c = center + normalize_coord(fragCoord);
    
    vec3 color = vec3(0.0, 0.0, 0.0);
    
    vec2 z = vec2(0.0, 0.0);
    int i;
    for (i = 0; i < 200; i++) {
        if (length(z) > 2.0) {
            // Smooth coloring
            float log_zn = log(length(z) * length(z)) / 2.0;
            float nu = log(log_zn / log(2.0)) / log(2.0);
            float smooth_iter = float(i) + 1.0 - nu;
            float t = smooth_iter / 200.0;
            color = palette(t * 4.0);
            break;
        }
        z = cmul(z, z) + c;
    }
    
    fragColor = vec4(color, 1.0);
}