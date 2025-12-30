vec2 normalize_coord(vec2 coord) {
    vec2 uv = coord / iResolution.xy;
    uv = uv - vec2(0.5, 0.5);
    uv.x *= iResolution.x / iResolution.y;
    return uv * 4.0;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 p = normalize_coord(fragCoord);
    
    // Use iMouse.zw (last click position) so sun stays put
    vec2 sun = normalize_coord(iMouse.zw);
    
    // Earth orbits the sun
    float orbit_radius = 0.8;
    vec2 earth = sun + orbit_radius * vec2(cos(iTime), sin(iTime));
    
    // Draw sun (larger, yellow)
    float d_sun = length(p - sun);
    // Draw earth (smaller, blue)
    float d_earth = length(p - earth);
    
    vec3 color = vec3(0.02, 0.02, 0.05);  // dark background
    if (d_sun < 0.3) {
        color = vec3(1.0, 0.9, 0.2);  // yellow sun
    }
    if (d_earth < 0.15) {
        color = vec3(0.2, 0.5, 1.0);  // blue earth
    }
    
    fragColor = vec4(color, 1.0);
}