vec2 normalize_coord(vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    return uv * 6.0;
}

struct Circle {
    vec2 center;
    float radius;
};

float distToCircle(vec2 p, Circle c) {
    return abs(length(p - c.center) - c.radius);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 p = normalize_coord(fragCoord);
    
    float r = 1.0;
    float triSide = 2.0 * r;
    float circumradius = triSide / sqrt(3.0);
    
    Circle c1 = Circle(vec2(0.0, circumradius), r);
    Circle c2 = Circle(vec2(-circumradius * sqrt(3.0)/2.0, -circumradius * 0.5), r);
    Circle c3 = Circle(vec2(circumradius * sqrt(3.0)/2.0, -circumradius * 0.5), r);
    Circle outer = Circle(vec2(0.0, 0.0), circumradius + r);
    
    vec3 color = vec3(0.1, 0.1, 0.15);
    
    if (distToCircle(p, c1) < 0.03) color = vec3(1.0, 0.3, 0.3);
    if (distToCircle(p, c2) < 0.03) color = vec3(0.3, 1.0, 0.3);
    if (distToCircle(p, c3) < 0.03) color = vec3(0.3, 0.3, 1.0);
    if (distToCircle(p, outer) < 0.03) color = vec3(1.0, 1.0, 1.0);
    
    fragColor = vec4(color, 1.0);
}