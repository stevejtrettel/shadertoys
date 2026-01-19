// Touch Gestures
// Demonstrates multi-touch and pinch gesture support
//
// On touch devices:
// - Touch to see touch points visualized
// - Use two fingers to pinch and see scale factor
//
// On desktop:
// - Click to simulate touch (works with iMouse too)
//
// Touch uniforms (Shader Sandbox extension):
// - iTouchCount: number of active touches (0-10)
// - iTouch0, iTouch1, iTouch2: vec4(x, y, startX, startY)
// - iPinch: pinch scale factor (1.0 = no pinch)
// - iPinchDelta: pinch change since last frame
// - iPinchCenter: center point of pinch gesture

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec2 aspect = vec2(iResolution.x / iResolution.y, 1.0);

    // Background with pinch-reactive zoom effect
    vec2 centered = (uv - 0.5) * 2.0;
    float zoom = 1.0 / max(iPinch, 0.1);
    float pattern = sin(length(centered * zoom) * 20.0 - iTime * 2.0);
    vec3 bg = vec3(0.1, 0.1, 0.15) + pattern * 0.05;

    vec3 col = bg;

    // Draw touch points
    for (int i = 0; i < 3; i++) {
        vec4 touch;
        if (i == 0) touch = iTouch0;
        else if (i == 1) touch = iTouch1;
        else touch = iTouch2;

        if (touch.x > 0.0 || touch.y > 0.0) {
            vec2 touchUV = touch.xy / iResolution.xy;
            float d = length((uv - touchUV) * aspect);

            // Draw circle at touch point
            float circle = smoothstep(0.05, 0.04, d);

            // Color based on touch index
            vec3 touchCol = vec3(0.0);
            if (i == 0) touchCol = vec3(1.0, 0.3, 0.3);
            else if (i == 1) touchCol = vec3(0.3, 1.0, 0.3);
            else touchCol = vec3(0.3, 0.3, 1.0);

            col = mix(col, touchCol, circle);

            // Draw line from start position
            vec2 startUV = touch.zw / iResolution.xy;
            if (startUV.x > 0.0 || startUV.y > 0.0) {
                vec2 toStart = startUV - touchUV;
                vec2 toPoint = uv - touchUV;
                float t = clamp(dot(toPoint, toStart) / dot(toStart, toStart), 0.0, 1.0);
                vec2 closest = touchUV + t * toStart;
                float lineDist = length((uv - closest) * aspect);
                float line = smoothstep(0.01, 0.005, lineDist);
                col = mix(col, touchCol * 0.5, line * 0.5);
            }
        }
    }

    // Draw pinch center
    if (iPinch != 1.0) {
        vec2 pinchUV = iPinchCenter / iResolution.xy;
        float d = length((uv - pinchUV) * aspect);
        float ring = smoothstep(0.08, 0.07, d) - smoothstep(0.06, 0.05, d);
        col = mix(col, vec3(1.0, 1.0, 0.3), ring);
    }

    // Display info
    if (uv.y > 0.92) {
        col = vec3(0.0);
        // Touch count indicator
        float touchIndicator = step(float(iTouchCount), uv.x * 5.0);
        col.r = 1.0 - touchIndicator;
    }

    fragColor = vec4(col, 1.0);
}
