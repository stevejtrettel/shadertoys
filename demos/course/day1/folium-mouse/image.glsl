vec2 normalize_coord(vec2 coord) {
    vec2 uv = coord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    return uv * 4.0;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 p = normalize_coord(fragCoord);
    
    // Fixed parameter a
    float a = 1.5;
    
    // Map mouse x to level set value c in [-2, 2]
    float c = mix(-2.0, 2.0, iMouse.x / iResolution.x);
    
    // Folium of Descartes: x³ + y³ - 3axy = c
    float F = p.x*p.x*p.x + p.y*p.y*p.y - 3.0*a*p.x*p.y - c;
    
    // Gradient: ∇F = (3x² - 3ay, 3y² - 3ax)
    vec2 grad = vec2(3.0*p.x*p.x - 3.0*a*p.y, 3.0*p.y*p.y - 3.0*a*p.x);
    float dist = abs(F) / max(length(grad), 0.01);
    
    vec3 color;
    if (dist < 0.05) {
        color = vec3(1.0, 1.0, 0.0);
    } else {
        color = vec3(0.1, 0.1, 0.3);
    }
    
    fragColor = vec4(color, 1.0);
}