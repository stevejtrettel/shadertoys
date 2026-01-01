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
    
    vec2 c = uv * 4.0;
    c.x -= 0.5;
    
    vec2 z = vec2(0.0, 0.0);
    int max_iter = 100;
    int iter;
    
    for (iter = 0; iter < max_iter; iter++) {
        if (cabs2(z) > 4.0) break;
        z = cmul(z, z) + c;
    }
    
    vec3 color;
    if (iter == max_iter) {
        color = vec3(0.0);
    } else {
        float t = float(iter) / float(max_iter);
        color = palette(t);
    }
    
    fragColor = vec4(color, 1.0);
}