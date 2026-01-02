vec2 normalize_coord(vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    return uv * 4.0;
}

struct Circle {
    vec2 center;
    float radius;
};

vec2 invert(vec2 p, Circle c) {
    vec2 d = p - c.center;
    return c.center + c.radius * c.radius * d / dot(d, d);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 p = normalize_coord(fragCoord);
    
    // Animate the inversion circle
    Circle inv_circle;
    inv_circle.center = vec2(sin(iTime) * 0.5, cos(iTime * 0.7) * 0.5);
    inv_circle.radius = 1.0 + 0.3 * sin(iTime * 1.3);
    
    vec2 p_inv = invert(p, inv_circle);
    
    vec3 color = vec3(0.1, 0.1, 0.15);
    
    // Draw the inversion circle
    float d_inv = abs(length(p - inv_circle.center) - inv_circle.radius);
    if (d_inv < 0.02) color = vec3(0.5, 0.5, 0.5);
    
    // Draw a grid in the inverted space
    vec2 grid = mod(p_inv, 0.5);
    if (grid.x < 0.02 || grid.y < 0.02) color = vec3(1.0, 1.0, 0.0);
    
    fragColor = vec4(color, 1.0);
}