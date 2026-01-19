// Hello World - Your first shader!
// This creates an animated color gradient

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Normalize coordinates to 0-1 range
    vec2 uv = fragCoord / iResolution.xy;

    // Create an animated rainbow gradient
    vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0, 2, 4));

    // Output the final color
    fragColor = vec4(col, 1.0);
}
