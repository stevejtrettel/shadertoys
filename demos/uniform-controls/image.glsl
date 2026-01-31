// Uniform Controls
// Demonstrates custom uniforms with auto-generated UI controls
//
// Click the + button to access the controls panel.
// All uniforms are defined in config.json and auto-injected.
//
// Uniform types demonstrated:
// - float (speed) -> slider
// - int (rings) -> slider
// - bool (animate) -> checkbox
// - vec3 with color:true (color1, color2) -> color picker
// - vec2 (center) -> XY pad

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Distance from center point (controlled by XY pad)
    float d = length(uv - center);

    // Animated time (toggle with checkbox)
    float t = animate ? iTime * speed : 0.0;

    // Create ring pattern (ring count controlled by slider)
    float pattern = sin(d * float(rings) * 6.28318 - t);

    // Interpolate between two colors (controlled by color pickers)
    vec3 col = mix(color1, color2, pattern * 0.5 + 0.5);

    // Add soft edge
    col *= smoothstep(0.7, 0.3, d);

    fragColor = vec4(col, 1.0);
}
