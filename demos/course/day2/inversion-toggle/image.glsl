vec2 normalize_coord(vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    return uv * 4.0;
}

vec2 invert(vec2 p) {
    return p / dot(p, p);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 p = normalize_coord(fragCoord);
    vec2 p_inv = invert(p);
    
    // Toggle between original and inverted every second
    float time = fract(iTime * 0.5);
    vec2 q;
    if (time < 0.5) {
        q = p;
    } else {
        q = p_inv;
    }
    
    vec3 color = vec3(0.1, 0.1, 0.15);
    
    // Draw the unit circle
    float d_unit = abs(length(p) - 1.0);
    if (d_unit < 0.02) color = vec3(0.5, 0.5, 0.5);
    
    // Draw a vertical line at x = 2
    if (abs(q.x - 2.0) < 0.02) color = vec3(1.0, 1.0, 0.0);
    
    // Draw a horizontal line at y = 1.5
    if (abs(q.y - 1.5) < 0.02) color = vec3(1.0, 1.0, 0.0);
    
    // Draw a circle centered at (2, 0) with radius 0.5
    float d_circle = abs(length(q - vec2(2.0, 0.0)) - 0.5);
    if (d_circle < 0.02) color = vec3(1.0, 1.0, 0.0);
    
    fragColor = vec4(color, 1.0);
}