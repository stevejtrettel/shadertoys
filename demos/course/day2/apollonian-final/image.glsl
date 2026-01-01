struct Circle {
    vec2 center;
    float radius;
};

vec2 invert(vec2 p, Circle c) {
    vec2 d = p - c.center;
    return c.center + c.radius * c.radius * d / dot(d, d);
}

bool isInside(vec2 p, Circle c) {
    return length(p - c.center) < c.radius;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    vec2 p = uv * 6.0;
    
    // Setup circles with correct geometry
    float r = 1.0;
    float triSide = 2.0 * r;
    float circumradius = triSide / sqrt(3.0);
    
    Circle c1 = Circle(vec2(0.0, circumradius), r);
    Circle c2 = Circle(vec2(-circumradius * 0.866, -circumradius * 0.5), r);
    Circle c3 = Circle(vec2(circumradius * 0.866, -circumradius * 0.5), r);
    Circle outer = Circle(vec2(0.0, 0.0), circumradius + r);
    
    // Iterate inversions
    int max_iter = 100;
    int iter;
    
    for (iter = 0; iter < max_iter; iter++) {
        if (isInside(p, c1)) {
            p = invert(p, c1);
        } else if (isInside(p, c2)) {
            p = invert(p, c2);
        } else if (isInside(p, c3)) {
            p = invert(p, c3);
        } else if (!isInside(p, outer)) {
            p = invert(p, outer);
        } else {
            break;
        }
    }
    
    // Color by iteration count, emphasizing the limit set
    float t = float(iter) / float(max_iter);
    vec3 color = 30.0 * vec3(pow(t, 2.0));
    
    fragColor = vec4(color, 1.0);
}