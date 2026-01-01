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
    
    // Get c from mouse position
    vec2 mouse_uv = iMouse.xy / iResolution.xy;
    mouse_uv = mouse_uv - vec2(0.5, 0.5);
    mouse_uv.x *= iResolution.x / iResolution.y;
    vec2 c = mouse_uv * 4.0;
    c.x -= 0.5;
    
    // Default to interesting value if no mouse
    if (iMouse.x < 1.0) {
        c = vec2(-0.7, 0.27015);
    }
    
    // Mandelbrot iteration (for background)
    vec2 mc = p;
    mc.x -= 0.5;
    vec2 mz = vec2(0.0);
    int m_iter;
    for (m_iter = 0; m_iter < 100; m_iter++) {
        if (cabs2(mz) > 4.0) break;
        mz = cmul(mz, mz) + mc;
    }
    
    // Julia iteration (for foreground)
    vec2 jz = p;
    int j_iter;
    for (j_iter = 0; j_iter < 100; j_iter++) {
        if (cabs2(jz) > 4.0) break;
        jz = cmul(jz, jz) + c;
    }
    
    // Color: light background, Mandelbrot in gray, Julia in black
    vec3 color = vec3(0.9);  // light background (escaped both)
    if (m_iter == 100) {
        color = vec3(0.6);  // Mandelbrot set in gray
    }
    if (j_iter == 100) {
        color = vec3(0.0);  // Julia set in black
    }
    
    // Draw red dot at c position (in Mandelbrot coordinates)
    vec2 c_pos = c;
    c_pos.x += 0.5;  // undo the offset we applied to c
    if (length(p - c_pos) < 0.05) {
        color = vec3(1.0, 0.0, 0.0);
    }
    
    fragColor = vec4(color, 1.0);
}