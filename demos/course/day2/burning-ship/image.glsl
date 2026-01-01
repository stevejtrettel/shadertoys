vec2 cmul(vec2 z, vec2 w) {
    return vec2(z.x * w.x - z.y * w.y, z.x * w.y + z.y * w.x);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // Scale coordinates - the 0.1/iResolution.y factor and offset
    // center the view on the "ship"
    vec2 c = 0.1 * fragCoord / iResolution.y + vec2(1.66, -0.02);
    
    vec2 z = vec2(0.0);
    int max_iter = 100;
    int iter;
    
    for (iter = 0; iter < max_iter; iter++) {
        if (dot(z, z) > 1000.0) break;
        
        // Complex square
        z = cmul(z, z);
        
        // Burning Ship: take abs of imaginary part
        z.y = abs(z.y);
        
        // Subtract c (equivalent to z² + c with sign conventions)
        z = z - c;
    }
    
    vec3 color;
    if (iter == max_iter) {
        color = vec3(0.0);  // Inside: black
    } else {
        color = vec3(1.0);  // Escaped: white
        
        // For smooth coloring, try:
        // float s = float(iter) - log2(log2(dot(z, z))) + 3.0;
        // float t = s / float(max_iter);
        // color = vec3(t);
    }
    
    fragColor = vec4(color, 1.0);
}