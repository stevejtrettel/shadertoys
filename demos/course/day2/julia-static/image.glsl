vec2 cmul(vec2 z, vec2 w) {
    return vec2(z.x * w.x - z.y * w.y, z.x * w.y + z.y * w.x);
}

float cabs2(vec2 z) {
    return dot(z, z);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    vec2 p = uv * 4.0;
    
    // Fixed parameter - try different values!
    vec2 c = vec2(-0.7, 0.27015);
    
    // z starts at pixel position
    vec2 z = p;
    
    int max_iter = 100;
    int iter;
    
    for (iter = 0; iter < max_iter; iter++) {
        if (cabs2(z) > 4.0) break;
        z = cmul(z, z) + c;
    }
    
    vec3 color;
    if (iter == max_iter) {
        color = vec3(0.0);  // In the set: black
    } else {
        color = vec3(1.0);  // Escaped: white
    }
    
    fragColor = vec4(color, 1.0);
}