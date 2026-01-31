vec2 cmul(vec2 z, vec2 w) {
    return vec2(z.x * w.x - z.y * w.y, z.x * w.y + z.y * w.x);
}

vec2 normalize_coord(vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    return uv * 2.5;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 p = normalize_coord(fragCoord);
    
    // Get c from mouse position
    vec2 c = normalize_coord(iMouse.xy);
    c.x = c.x - 0.5;
    
    // Default to interesting value if no mouse
    if (iMouse.x < 1.0) {
        c = vec2(-0.7, 0.27015);
    }
    
    // Mandelbrot iteration (for background)
    vec2 mc = p;
    mc.x = mc.x - 0.5;
    vec2 mz = vec2(0.0, 0.0);
    int m_i;
    for (m_i = 0; m_i < 100; m_i++) {
        if (length(mz) > 2.0) break;
        mz = cmul(mz, mz) + mc;
    }
    
    // Julia iteration (for foreground)
    vec2 jz = p;
    int j_i;
    for (j_i = 0; j_i < 100; j_i++) {
        if (length(jz) > 2.0) break;
        jz = cmul(jz, jz) + c;
    }
    
    // Mandelbrot grayscale (faded to serve as background)
    vec3 color = vec3(1.0, 1.0, 1.0);
    if (m_i < 100) {
        float t = float(m_i) / 100.0;
        float gray = 0.6 + 0.4 * (1.0 - t);  // range [0.6, 1.0]
        color = vec3(gray, gray, gray);
    } else {
        color = vec3(0.5, 0.5, 0.5);  // Mandelbrot interior
    }
    
    // Julia grayscale (overlaid)
    if (j_i < 100) {
        float t = float(j_i) / 100.0;
        float gray = 1.0 - t;
        color = vec3(gray, gray, gray);
    } else {
        color = vec3(0.0, 0.0, 0.0);  // Julia interior
    }
    
    // Draw red dot at c position
    vec2 c_pos = c;
    c_pos.x = c_pos.x + 0.5;
    if (length(p - c_pos) < 0.05) {
        color = vec3(1.0, 0.0, 0.0);
    }
    
    fragColor = vec4(color, 1.0);
}