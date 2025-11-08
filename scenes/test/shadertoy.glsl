// test.glsl - Copy your Shadertoy code here, just the mainImage function

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Example: animated test effect
    float t = iTime * 0.5;
    vec3 col = 0.5 + 0.5 * cos(t + uv.xyx + vec3(0, 2, 4));

    fragColor = vec4(col, 1.0);
}
