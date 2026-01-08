bool inDomain(vec2 fragCoord, vec2 resolution) {
    vec2 center = resolution * 0.5;
    float scale = min(resolution.x, resolution.y) * 0.3;
    vec2 c = (fragCoord - center) / scale;
    c.x -= 0.5;
    
    vec2 z = vec2(0.0);
    for (int i = 0; i < 100; i++) {
        z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
        if (dot(z, z) > 4.0) return false;
    }
    return true;
}