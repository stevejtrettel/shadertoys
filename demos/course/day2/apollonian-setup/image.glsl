struct Circle {
    vec2 center;
    float radius;
};

float distToCircle(vec2 p, Circle c) {
    return abs(length(p - c.center) - c.radius);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    vec2 p = uv * 6.0;
    
    // Three mutually tangent inner circles plus outer circle
    // For three circles of radius r centered at vertices of equilateral triangle:
    // - Side length of triangle = 2r (so circles touch)
    // - Circumradius of triangle = 2r / sqrt(3)
    // - Outer circle radius = circumradius + r
    
    float r = 1.0;
    float triSide = 2.0 * r;  // distance between inner circle centers
    float circumradius = triSide / sqrt(3.0);  // distance from origin to inner centers
    
    // Inner circles at vertices of equilateral triangle
    Circle c1 = Circle(vec2(0.0, circumradius), r);
    Circle c2 = Circle(vec2(-circumradius * 0.866, -circumradius * 0.5), r);
    Circle c3 = Circle(vec2(circumradius * 0.866, -circumradius * 0.5), r);
    
    // Outer circle tangent to all three from outside
    Circle outer = Circle(vec2(0.0, 0.0), circumradius + r);
    
    vec3 color = vec3(0.1, 0.1, 0.15);
    
    // Draw all four circles
    if (distToCircle(p, c1) < 0.03) color = vec3(1.0, 0.3, 0.3);
    if (distToCircle(p, c2) < 0.03) color = vec3(0.3, 1.0, 0.3);
    if (distToCircle(p, c3) < 0.03) color = vec3(0.3, 0.3, 1.0);
    if (distToCircle(p, outer) < 0.03) color = vec3(1.0, 1.0, 1.0);
    
    fragColor = vec4(color, 1.0);
}